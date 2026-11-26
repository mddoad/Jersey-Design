import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MIN_ORDER, QUOTE_EMAIL, UNIT_PRICE_CENTS, CURRENCY } from '../../data/catalog'
import { useCartStore, JERSEY_SIZES, type CartItem, type JerseySize } from '../../store/cartStore'
import Button from '../../components/ui/Button'

function formatPrice(cents: number): string {
  return `৳${(cents / 100).toLocaleString('en-BD', { minimumFractionDigits: 2 })}`
}

function buildMailto(items: CartItem[]): string {
  const lines = items.map(
    (i, n) =>
      `${n + 1}. ${i.design.sport} / ${i.design.cut} / Size ${i.size} / ${i.design.pattern} / ` +
      `primary ${i.design.colors.primary} / name "${i.design.name}" #${i.design.number} / quantity ${i.quantity}`,
  )
  const body = `Hello, I would like a quote for:\n\n${lines.join('\n')}\n\nTotal garments: ${items.reduce((s, i) => s + i.quantity, 0)}`
  return (
    `mailto:${QUOTE_EMAIL}?subject=${encodeURIComponent('Quote request')}` +
    `&body=${encodeURIComponent(body)}`
  )
}

function CartItemRow({ item }: { item: CartItem }) {
  const updateItem = useCartStore((s) => s.updateItem)
  const removeItem = useCartStore((s) => s.removeItem)
  const [confirmRemove, setConfirmRemove] = useState(false)

  return (
    <li className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center">
      {/* Thumbnail */}
      <img
        src={item.thumbnail}
        alt="Design preview"
        className="h-24 w-24 flex-shrink-0 rounded-lg border border-slate-100 object-cover"
      />

      {/* Details */}
      <div className="flex-1 space-y-1 text-sm">
        <p className="font-semibold capitalize text-slate-900">
          {item.design.sport} — {item.design.cut}
        </p>
        <p className="text-slate-500">
          Pattern: <span className="capitalize">{item.design.pattern}</span>
        </p>
        <div className="flex items-center gap-1.5 text-slate-500">
          Colors:
          {Object.entries(item.design.colors).map(([key, hex]) => (
            <span
              key={key}
              title={`${key}: ${hex}`}
              className="inline-block h-4 w-4 rounded-full border border-slate-300"
              style={{ backgroundColor: hex }}
            />
          ))}
        </div>
        {(item.design.name || item.design.number) && (
          <p className="text-slate-500">
            {item.design.name && <>Name: <span className="font-medium text-slate-700">{item.design.name}</span></>}
            {item.design.name && item.design.number && ' · '}
            {item.design.number && <>#{item.design.number}</>}
          </p>
        )}
      </div>

      {/* Size selector */}
      <div className="flex flex-col items-start gap-1">
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">Size</label>
        <select
          value={item.size}
          onChange={(e) => updateItem(item.id, { size: e.target.value as JerseySize })}
          className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
          aria-label="Size"
        >
          {JERSEY_SIZES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Quantity */}
      <div className="flex flex-col items-start gap-1">
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">Qty</label>
        <div className="flex items-center gap-1">
          <button
            onClick={() => updateItem(item.id, { quantity: Math.max(1, item.quantity - 1) })}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 text-lg font-bold text-slate-600 hover:bg-slate-100"
          >
            −
          </button>
          <input
            type="number"
            min={1}
            value={item.quantity}
            onChange={(e) => updateItem(item.id, { quantity: Math.max(1, Number(e.target.value) || 1) })}
            className="h-8 w-14 rounded-lg border border-slate-300 text-center text-sm"
            aria-label="Quantity"
          />
          <button
            onClick={() => updateItem(item.id, { quantity: item.quantity + 1 })}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 text-lg font-bold text-slate-600 hover:bg-slate-100"
          >
            +
          </button>
        </div>
      </div>

      {/* Remove */}
      <div className="flex flex-col items-end gap-1">
        {!confirmRemove ? (
          <button
            onClick={() => setConfirmRemove(true)}
            className="text-sm text-red-500 hover:text-red-700"
            title="Remove item"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
          </button>
        ) : (
          <div className="flex items-center gap-1">
            <button
              onClick={() => removeItem(item.id)}
              className="rounded bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700"
            >
              Yes, remove
            </button>
            <button
              onClick={() => setConfirmRemove(false)}
              className="rounded bg-slate-200 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-300"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </li>
  )
}

export default function CartPage() {
  const items = useCartStore((s) => s.items)
  const clear = useCartStore((s) => s.clear)
  const total = items.reduce((sum, i) => sum + i.quantity, 0)
  const enough = total >= MIN_ORDER
  const [confirmClear, setConfirmClear] = useState(false)

  return (
    <main className="mx-auto h-full max-w-3xl overflow-y-auto p-6">
      <Link to="/sport" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        &larr; Design another jersey
      </Link>
      <h1 className="mb-1 mt-2 text-2xl font-bold">Your Cart</h1>
      <p className="mb-4 text-sm text-slate-500">
        {items.length === 0
          ? 'Your cart is empty — go design a jersey!'
          : `${items.length} design${items.length > 1 ? 's' : ''} · ${total} garment${total !== 1 ? 's' : ''} total`}
      </p>

      {items.length === 0 && (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
          <p className="text-slate-500">Nothing here yet</p>
          <Link
            to="/sport"
            className="rounded-lg bg-[#7a1f2b] px-5 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            Start designing
          </Link>
        </div>
      )}

      <ul className="grid gap-3">
        {items.map((item) => (
          <CartItemRow key={item.id} item={item} />
        ))}
      </ul>

      {items.length > 0 && (
        <>
          {/* Summary bar */}
          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-lg font-bold text-slate-900">
                  {total} garments · {formatPrice(total * UNIT_PRICE_CENTS)}
                </p>
                <p className="text-xs text-slate-500">
                  {formatPrice(UNIT_PRICE_CENTS)} per jersey
                </p>
                {!enough && (
                  <p className="mt-1 text-sm text-red-600">
                    Minimum order is {MIN_ORDER} — add {MIN_ORDER - total} more
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <a
                  href={enough ? buildMailto(items) : undefined}
                  className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${
                    enough
                      ? 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                      : 'pointer-events-none border-slate-200 bg-slate-100 text-slate-400'
                  }`}
                >
                  Request a quote
                </a>
                <Link
                  to={enough ? '/checkout' : '#'}
                  className={`rounded-lg px-6 py-2 text-sm font-semibold text-white transition ${
                    enough ? 'bg-[#7a1f2b] hover:opacity-90' : 'pointer-events-none bg-slate-400'
                  }`}
                >
                  Proceed to Checkout
                </Link>
              </div>
            </div>
          </div>

          {/* Clear cart */}
          <div className="mt-3 flex justify-end">
            {!confirmClear ? (
              <button
                onClick={() => setConfirmClear(true)}
                className="text-xs text-slate-400 hover:text-red-500"
              >
                Clear entire cart
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Remove all items?</span>
                <button
                  onClick={() => { clear(); setConfirmClear(false) }}
                  className="rounded bg-red-600 px-2 py-1 text-xs font-medium text-white"
                >
                  Yes, clear
                </button>
                <button
                  onClick={() => setConfirmClear(false)}
                  className="rounded bg-slate-200 px-2 py-1 text-xs font-medium text-slate-700"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </main>
  )
}
