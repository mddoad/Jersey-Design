import { Link } from 'react-router-dom'
import { MIN_ORDER, QUOTE_EMAIL } from '../../data/catalog'
import { useCartStore, type CartItem } from '../../store/cartStore'
import Button from '../../components/ui/Button'

function buildMailto(items: CartItem[]): string {
  const lines = items.map(
    (i, n) =>
      `${n + 1}. ${i.design.sport} / ${i.design.cut} / ${i.design.pattern} / ` +
      `primary ${i.design.colors.primary} / quantity ${i.quantity}`,
  )
  const body = `Hello, I would like a quote for:\n\n${lines.join('\n')}`
  return (
    `mailto:${QUOTE_EMAIL}?subject=${encodeURIComponent('Quote request')}` +
    `&body=${encodeURIComponent(body)}`
  )
}

export default function CartPage() {
  const items = useCartStore((s) => s.items)
  const setQuantity = useCartStore((s) => s.setQuantity)
  const removeItem = useCartStore((s) => s.removeItem)
  const total = items.reduce((sum, i) => sum + i.quantity, 0)
  const enough = total >= MIN_ORDER

  return (
    <main className="mx-auto h-full max-w-3xl overflow-y-auto p-6">
      <Link to="/sport" className="text-sm text-slate-500">
        &larr; Design another
      </Link>
      <h1 className="mb-4 mt-2 text-2xl font-bold">Your cart</h1>

      {items.length === 0 && <p className="text-slate-600">Your cart is empty.</p>}

      <ul className="grid gap-3">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-3"
          >
            <img src={item.thumbnail} alt="Design preview" className="h-20 w-20 rounded-lg" />
            <div className="flex-1 text-sm">
              <p className="font-medium capitalize">
                {item.design.sport} - {item.design.cut}
              </p>
              <p className="text-slate-500">Pattern: {item.design.pattern}</p>
            </div>
            <input
              type="number"
              min={1}
              value={item.quantity}
              onChange={(e) => setQuantity(item.id, Math.max(1, Number(e.target.value) || 1))}
              className="w-20 rounded-lg border border-slate-300 px-2 py-1"
              aria-label="Quantity"
            />
            <Button onClick={() => removeItem(item.id)}>Remove</Button>
          </li>
        ))}
      </ul>

      {items.length > 0 && (
        <div className="mt-6 flex items-center justify-between">
          <p className={enough ? 'text-slate-700' : 'text-red-600'}>
            {total} garments {enough ? '' : `(minimum order is ${MIN_ORDER})`}
          </p>
          <a
            href={enough ? buildMailto(items) : undefined}
            className={`rounded-lg px-5 py-2 font-semibold text-white ${
              enough ? 'bg-[#7a1f2b]' : 'pointer-events-none bg-slate-400'
            }`}
          >
            Request a quote
          </a>
        </div>
      )}
    </main>
  )
}
