import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCartStore, type CartItem } from '../store/cartStore'
import { UNIT_PRICE_CENTS, MIN_ORDER } from '../data/catalog'
import { redirectToCheckout, type CustomerInfo } from '../lib/checkout'
import Button from '../components/ui/Button'

function formatPrice(paisa: number): string {
  return `৳${(paisa / 100).toLocaleString('en-BD', { minimumFractionDigits: 2 })}`
}

function CheckoutItem({ item }: { item: CartItem }) {
  const lineTotal = item.quantity * UNIT_PRICE_CENTS
  return (
    <li className="flex items-center gap-4 border-b border-slate-100 py-3 last:border-b-0">
      <img
        src={item.thumbnail}
        alt="Preview"
        className="h-16 w-16 flex-shrink-0 rounded-lg border border-slate-100 object-cover"
      />
      <div className="flex-1 text-sm">
        <p className="font-medium capitalize text-slate-900">
          {item.design.sport} — {item.design.cut}
        </p>
        <p className="text-slate-500">
          Size {item.size} · {item.design.pattern}
          {item.design.name && ` · ${item.design.name}`}
          {item.design.number && ` #${item.design.number}`}
        </p>
      </div>
      <div className="text-right text-sm">
        <p className="font-medium text-slate-900">{formatPrice(lineTotal)}</p>
        <p className="text-xs text-slate-500">
          {item.quantity} × {formatPrice(UNIT_PRICE_CENTS)}
        </p>
      </div>
    </li>
  )
}

const PAYMENT_METHODS = [
  { name: 'bKash', color: '#E2136E' },
  { name: 'Nagad', color: '#F6921E' },
  { name: 'Rocket', color: '#8C3494' },
  { name: 'Upay', color: '#0077B6' },
  { name: 'Visa', color: '#1A1F71' },
  { name: 'Mastercard', color: '#EB001B' },
  { name: 'Amex', color: '#006FCF' },
]

export default function CheckoutPage() {
  const items = useCartStore((s) => s.items)
  const totalQty = items.reduce((s, i) => s + i.quantity, 0)
  const subtotal = items.reduce((s, i) => s + i.quantity * UNIT_PRICE_CENTS, 0)
  const enough = totalQty >= MIN_ORDER

  const [customer, setCustomer] = useState<CustomerInfo>({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postcode: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const updateField = (field: keyof CustomerInfo, value: string) => {
    setCustomer((prev) => ({ ...prev, [field]: value }))
  }

  const isFormValid = customer.name.trim().length > 0 && customer.phone.trim().length >= 11

  const handlePay = async () => {
    if (!enough || !isFormValid) return
    setLoading(true)
    setError('')
    try {
      await redirectToCheckout({ items, customer })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Payment failed')
      setLoading(false)
    }
  }

  if (items.length === 0) {
    return (
      <main className="flex h-full items-center justify-center p-6">
        <div className="text-center">
          <p className="mb-4 text-slate-500">Your cart is empty</p>
          <Link
            to="/sport"
            className="rounded-lg bg-[#7a1f2b] px-5 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            Start designing
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto h-full max-w-2xl overflow-y-auto p-6">
      <Link to="/cart" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        &larr; Back to cart
      </Link>

      <h1 className="mb-1 mt-2 text-2xl font-bold">Checkout</h1>
      <p className="mb-6 text-sm text-slate-500">Review your order and proceed to payment</p>

      {/* Order items */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="mb-2 text-sm font-semibold text-slate-700">Order Summary</h2>
        <ul>
          {items.map((item) => (
            <CheckoutItem key={item.id} item={item} />
          ))}
        </ul>
      </div>

      {/* Customer info */}
      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Your Information</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="আপনার নাম"
              value={customer.name}
              onChange={(e) => updateField('name', e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#7a1f2b] focus:outline-none focus:ring-1 focus:ring-[#7a1f2b]"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              placeholder="01XXXXXXXXX"
              value={customer.phone}
              onChange={(e) => updateField('phone', e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#7a1f2b] focus:outline-none focus:ring-1 focus:ring-[#7a1f2b]"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={customer.email}
              onChange={(e) => updateField('email', e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#7a1f2b] focus:outline-none focus:ring-1 focus:ring-[#7a1f2b]"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-slate-600">Delivery Address</label>
            <input
              type="text"
              placeholder="বাসা নং, রোড, এলাকা"
              value={customer.address}
              onChange={(e) => updateField('address', e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#7a1f2b] focus:outline-none focus:ring-1 focus:ring-[#7a1f2b]"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">City</label>
            <input
              type="text"
              placeholder="Dhaka"
              value={customer.city}
              onChange={(e) => updateField('city', e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#7a1f2b] focus:outline-none focus:ring-1 focus:ring-[#7a1f2b]"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Post Code</label>
            <input
              type="text"
              placeholder="1000"
              value={customer.postcode}
              onChange={(e) => updateField('postcode', e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#7a1f2b] focus:outline-none focus:ring-1 focus:ring-[#7a1f2b]"
            />
          </div>
        </div>
      </div>

      {/* Payment methods preview */}
      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Available Payment Methods</h2>
        <div className="flex flex-wrap gap-2">
          {PAYMENT_METHODS.map((pm) => (
            <span
              key={pm.name}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1 text-xs font-medium"
            >
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: pm.color }}
              />
              {pm.name}
            </span>
          ))}
          <span className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-400">
            + more
          </span>
        </div>
        <p className="mt-2 text-xs text-slate-400">
          You'll choose your payment method on the next page
        </p>
      </div>

      {/* Totals */}
      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex justify-between text-sm text-slate-600">
          <span>Subtotal ({totalQty} jersey{totalQty > 1 ? 's' : ''})</span>
          <span className="font-medium">{formatPrice(subtotal)}</span>
        </div>
        <div className="mt-1 flex justify-between text-sm text-slate-600">
          <span>Shipping</span>
          <span className="text-slate-400">Calculated at payment</span>
        </div>
        <div className="mt-3 flex justify-between border-t border-slate-200 pt-3 text-lg font-bold text-slate-900">
          <span>Total</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
      </div>

      {!enough && (
        <p className="mt-3 text-sm text-red-600">
          Minimum order is {MIN_ORDER} garment{MIN_ORDER > 1 ? 's' : ''} — you have {totalQty}. Go back and add more.
        </p>
      )}

      {error && (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <Button
        variant="primary"
        disabled={!enough || !isFormValid || loading}
        onClick={handlePay}
        className={`mt-4 w-full py-3 text-base ${!enough || !isFormValid || loading ? 'opacity-50' : ''}`}
      >
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            Redirecting to payment…
          </span>
        ) : (
          `Pay ${formatPrice(subtotal)}`
        )}
      </Button>

      {!isFormValid && customer.name.length === 0 && (
        <p className="mt-2 text-center text-xs text-slate-400">
          Fill in your name and phone number to continue
        </p>
      )}

      <div className="mt-3 flex items-center justify-center gap-2 text-xs text-slate-400">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        Secure payment powered by SSLCommerz
      </div>
    </main>
  )
}
