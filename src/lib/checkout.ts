import type { CartItem } from '../store/cartStore'

const API_BASE = import.meta.env.VITE_API_URL || ''

export interface CustomerInfo {
  name: string
  email: string
  phone: string
  address: string
  city: string
  postcode: string
}

export interface CheckoutRequest {
  items: CartItem[]
  customer: CustomerInfo
}

/**
 * Calls the backend to create an SSLCommerz payment session,
 * then redirects the browser to the SSLCommerz gateway page
 * where the user can pay with bKash, Nagad, Visa, Mastercard, etc.
 */
export async function redirectToCheckout(req: CheckoutRequest): Promise<void> {
  const res = await fetch(`${API_BASE}/api/create-checkout-session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Server error ${res.status}`)
  }

  const { url } = await res.json()
  if (!url) throw new Error('No payment gateway URL returned')

  window.location.href = url
}

/**
 * Fetches order details from the backend after a successful payment.
 */
export async function fetchOrder(tranId: string) {
  const res = await fetch(`${API_BASE}/api/order/${tranId}`)
  if (!res.ok) throw new Error(`Failed to fetch order: ${res.status}`)
  return res.json()
}

/**
 * Returns true if the payment backend is configured and reachable.
 */
export async function isPaymentEnabled(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/health`)
    if (!res.ok) return false
    const data = await res.json()
    return data.ok && data.sslcommerz
  } catch {
    return false
  }
}
