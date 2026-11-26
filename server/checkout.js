/**
 * Express server for SSLCommerz payment gateway.
 *
 * Supports: bKash, Nagad, Rocket, Upay, Visa, Mastercard, Amex, and all
 * payment methods available through SSLCommerz.
 *
 * Usage:
 *   SSLCOMMERZ_STORE_ID=your_store_id SSLCOMMERZ_STORE_PASSWORD=your_pass node server/checkout.js
 *
 * It listens on port 4242 by default (PORT env to override).
 * The Vite dev server proxies /api/* to this server (see vite.config.ts).
 */

import 'dotenv/config'
import express from 'express'
import cors from 'cors'

const app = express()
app.use(cors())
app.use(express.json({ limit: '5mb' }))
app.use(express.urlencoded({ extended: true })) // SSLCommerz POSTs form data to IPN/success URLs

const PORT = process.env.PORT || 4242
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173'
const SERVER_URL = process.env.SERVER_URL || `http://localhost:${PORT}`

// SSLCommerz config
const STORE_ID = process.env.SSLCOMMERZ_STORE_ID || ''
const STORE_PASS = process.env.SSLCOMMERZ_STORE_PASSWORD || ''
const IS_SANDBOX = process.env.SSLCOMMERZ_SANDBOX !== 'false' // default: sandbox mode

const SSLCOMMERZ_URL = IS_SANDBOX
  ? 'https://sandbox.sslcommerz.com'
  : 'https://securepay.sslcommerz.com'

// In-memory order store (use a database in production)
const orders = new Map()

/**
 * POST /api/create-checkout-session
 *
 * Body: { items, customer: { name, email, phone, address, city } }
 */
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const { items, customer } = req.body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' })
    }

    if (!customer?.name || !customer?.phone) {
      return res.status(400).json({ error: 'Customer name and phone are required' })
    }

    const unitPrice = parseInt(process.env.UNIT_PRICE_CENTS ?? '150000', 10)
    const totalQty = items.reduce((s, i) => s + i.quantity, 0)
    const totalAmount = (totalQty * unitPrice) / 100 // SSLCommerz expects amount in BDT (not paisa)

    const tranId = `JERSEY_${Date.now()}_${Math.random().toString(36).slice(2, 8).toUpperCase()}`

    // Build product description
    const productDesc = items
      .map(
        (i) =>
          `${i.design.sport} ${i.design.cut} (${i.size}) x${i.quantity}` +
          (i.design.name ? ` - ${i.design.name}` : '') +
          (i.design.number ? ` #${i.design.number}` : ''),
      )
      .join(', ')

    // Store order info for later retrieval
    orders.set(tranId, {
      items,
      customer,
      totalAmount,
      totalQty,
      status: 'pending',
      createdAt: new Date().toISOString(),
    })

    // SSLCommerz session init parameters
    const params = new URLSearchParams({
      store_id: STORE_ID,
      store_passwd: STORE_PASS,
      total_amount: totalAmount.toFixed(2),
      currency: 'BDT',
      tran_id: tranId,

      // Redirect URLs
      success_url: `${SERVER_URL}/api/payment/success`,
      fail_url: `${SERVER_URL}/api/payment/fail`,
      cancel_url: `${SERVER_URL}/api/payment/cancel`,
      ipn_url: `${SERVER_URL}/api/payment/ipn`,

      // Customer info
      cus_name: customer.name,
      cus_email: customer.email || 'customer@example.com',
      cus_phone: customer.phone,
      cus_add1: customer.address || 'N/A',
      cus_city: customer.city || 'Dhaka',
      cus_country: 'Bangladesh',
      cus_postcode: customer.postcode || '1000',

      // Shipping (same as customer)
      shipping_method: 'Courier',
      ship_name: customer.name,
      ship_add1: customer.address || 'N/A',
      ship_city: customer.city || 'Dhaka',
      ship_country: 'Bangladesh',
      ship_postcode: customer.postcode || '1000',

      // Product info
      product_name: 'Custom Jersey',
      product_category: 'Clothing',
      product_profile: 'physical-goods',

      // Allow all payment methods
      multi_card_name: 'bkash,nagad,rocket,upay,visacard,mastercard,amexcard',

      // Additional info
      value_a: tranId,
      value_b: String(totalQty),
      value_c: productDesc.slice(0, 255),
    })

    const response = await fetch(`${SSLCOMMERZ_URL}/gwprocess/v4/api.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    })

    const data = await response.json()

    if (data.status === 'SUCCESS') {
      res.json({ url: data.GatewayPageURL })
    } else {
      console.error('SSLCommerz init failed:', data.failedreason || data)
      res.status(500).json({
        error: data.failedreason || 'Failed to initialize payment gateway',
      })
    }
  } catch (err) {
    console.error('Payment error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

/**
 * POST /api/payment/success
 * SSLCommerz redirects here after successful payment.
 */
app.post('/api/payment/success', async (req, res) => {
  try {
    const { tran_id, val_id, amount, card_type, card_brand } = req.body

    // Validate the payment with SSLCommerz
    const validationUrl = `${SSLCOMMERZ_URL}/validator/api/validationserverAPI.php?` +
      `val_id=${val_id}&store_id=${STORE_ID}&store_passwd=${STORE_PASS}&format=json`

    const valRes = await fetch(validationUrl)
    const valData = await valRes.json()

    if (valData.status === 'VALID' || valData.status === 'VALIDATED') {
      // Update order status
      const order = orders.get(tran_id)
      if (order) {
        order.status = 'paid'
        order.paymentMethod = card_type || card_brand || 'N/A'
        order.valId = val_id
        order.paidAmount = amount
        order.paidAt = new Date().toISOString()
      }

      // Redirect to frontend success page
      res.redirect(`${CLIENT_URL}/#/order-success?tran_id=${tran_id}&status=success`)
    } else {
      res.redirect(`${CLIENT_URL}/#/order-success?tran_id=${tran_id}&status=failed`)
    }
  } catch (err) {
    console.error('Payment validation error:', err.message)
    res.redirect(`${CLIENT_URL}/#/order-success?status=error`)
  }
})

/**
 * POST /api/payment/fail
 */
app.post('/api/payment/fail', (req, res) => {
  const { tran_id } = req.body
  const order = orders.get(tran_id)
  if (order) order.status = 'failed'
  res.redirect(`${CLIENT_URL}/#/cart?payment=failed`)
})

/**
 * POST /api/payment/cancel
 */
app.post('/api/payment/cancel', (req, res) => {
  const { tran_id } = req.body
  const order = orders.get(tran_id)
  if (order) order.status = 'cancelled'
  res.redirect(`${CLIENT_URL}/#/cart?payment=cancelled`)
})

/**
 * POST /api/payment/ipn — Instant Payment Notification (server-to-server)
 */
app.post('/api/payment/ipn', async (req, res) => {
  try {
    const { tran_id, val_id, status } = req.body

    if (status === 'VALID') {
      const validationUrl = `${SSLCOMMERZ_URL}/validator/api/validationserverAPI.php?` +
        `val_id=${val_id}&store_id=${STORE_ID}&store_passwd=${STORE_PASS}&format=json`

      const valRes = await fetch(validationUrl)
      const valData = await valRes.json()

      if (valData.status === 'VALID' || valData.status === 'VALIDATED') {
        const order = orders.get(tran_id)
        if (order) {
          order.status = 'paid'
          order.paidAt = new Date().toISOString()
        }
      }
    }

    res.status(200).json({ message: 'IPN received' })
  } catch (err) {
    console.error('IPN error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

/**
 * GET /api/order/:tranId — Retrieve order info for the success page
 */
app.get('/api/order/:tranId', (req, res) => {
  const order = orders.get(req.params.tranId)
  if (!order) {
    return res.status(404).json({ error: 'Order not found' })
  }
  res.json({
    tranId: req.params.tranId,
    status: order.status,
    totalAmount: order.totalAmount,
    totalQty: order.totalQty,
    customer: order.customer,
    paymentMethod: order.paymentMethod || null,
    items: order.items,
    paidAt: order.paidAt || null,
  })
})

/** Health check */
app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    sslcommerz: !!STORE_ID && !!STORE_PASS,
    sandbox: IS_SANDBOX,
  })
})

app.listen(PORT, () => {
  console.log(`✅ Payment server running on http://localhost:${PORT}`)
  console.log(`   Mode: ${IS_SANDBOX ? 'SANDBOX' : 'LIVE'}`)
  if (!STORE_ID || !STORE_PASS) {
    console.warn('⚠️  SSLCOMMERZ_STORE_ID or SSLCOMMERZ_STORE_PASSWORD is not set — payments will fail.')
    console.warn('   Get sandbox credentials at: https://developer.sslcommerz.com/registration/')
  }
})
