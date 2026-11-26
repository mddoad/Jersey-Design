import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useCartStore } from '../store/cartStore'
import { fetchOrder } from '../lib/checkout'

interface OrderData {
  tranId: string
  status: string
  totalAmount: number
  totalQty: number
  paymentMethod: string | null
  customer: { name: string; email: string; phone: string } | null
  paidAt: string | null
}

function formatPrice(amount: number): string {
  return `৳${amount.toLocaleString('en-BD', { minimumFractionDigits: 2 })}`
}

export default function OrderSuccess() {
  const [params] = useSearchParams()
  const tranId = params.get('tran_id')
  const status = params.get('status')
  const clear = useCartStore((s) => s.clear)

  const [order, setOrder] = useState<OrderData | null>(null)
  const [loading, setLoading] = useState(!!tranId)
  const [error, setError] = useState('')

  const isSuccess = status === 'success'

  // Clear the cart on a successful payment
  useEffect(() => {
    if (isSuccess) clear()
  }, [isSuccess, clear])

  // Fetch order details
  useEffect(() => {
    if (!tranId) return
    fetchOrder(tranId)
      .then((data) => setOrder(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [tranId])

  return (
    <main className="flex h-full items-center justify-center p-6">
      <div className="max-w-md text-center">
        {/* Icon */}
        <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${isSuccess ? 'bg-green-100' : 'bg-red-100'}`}>
          {isSuccess ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
          )}
        </div>

        <h1 className="mb-2 text-2xl font-bold text-slate-900">
          {isSuccess ? 'Order Confirmed!' : 'Payment Failed'}
        </h1>
        <p className="mb-6 text-slate-500">
          {isSuccess
            ? 'Thank you for your purchase! Your custom jerseys are being prepared.'
            : 'Something went wrong with the payment. Please try again.'}
        </p>

        {loading && (
          <div className="mb-6 flex items-center justify-center gap-2 text-sm text-slate-500">
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            Loading order details…
          </div>
        )}

        {error && (
          <p className="mb-4 text-sm text-amber-600">
            {isSuccess
              ? 'Could not load order details, but your payment was successful.'
              : 'Could not load order details.'}
          </p>
        )}

        {order && isSuccess && (
          <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 text-left text-sm">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-semibold text-slate-700">Order ID</span>
              <span className="font-mono text-xs text-slate-500">{order.tranId}</span>
            </div>

            <div className="mb-3 flex items-center justify-between">
              <span className="font-semibold text-slate-700">Status</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                Paid
              </span>
            </div>

            {order.paymentMethod && (
              <div className="mb-3 flex items-center justify-between">
                <span className="font-semibold text-slate-700">Paid via</span>
                <span className="text-slate-600">{order.paymentMethod}</span>
              </div>
            )}

            {order.customer?.name && (
              <div className="mb-3 flex items-center justify-between">
                <span className="font-semibold text-slate-700">Customer</span>
                <span className="text-slate-600">{order.customer.name}</span>
              </div>
            )}

            {order.customer?.phone && (
              <div className="mb-3 flex items-center justify-between">
                <span className="font-semibold text-slate-700">Phone</span>
                <span className="text-slate-600">{order.customer.phone}</span>
              </div>
            )}

            <div className="mb-3 flex items-center justify-between">
              <span className="font-semibold text-slate-700">Items</span>
              <span className="text-slate-600">{order.totalQty} jersey{order.totalQty > 1 ? 's' : ''}</span>
            </div>

            <div className="flex items-center justify-between border-t border-slate-200 pt-3 font-bold text-slate-900">
              <span>Total</span>
              <span>{formatPrice(order.totalAmount)}</span>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {!isSuccess && (
            <Link
              to="/cart"
              className="rounded-lg bg-[#7a1f2b] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
            >
              Try again
            </Link>
          )}
          <Link
            to="/sport"
            className={`rounded-lg px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 ${
              isSuccess ? 'bg-[#7a1f2b]' : 'bg-slate-500'
            }`}
          >
            Design another jersey
          </Link>
          <Link to="/" className="text-sm text-slate-500 hover:text-slate-700">
            Back to home
          </Link>
        </div>
      </div>
    </main>
  )
}
