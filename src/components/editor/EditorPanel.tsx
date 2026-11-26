import { useState } from 'react'
import Button from '../ui/Button'
import ColorControls from './Colorcontrols'
import LogoUploader from './LogoUploader'
import PatternPicker from './PatternPicker'
import TextControls from './TextControls'
import { JERSEY_SIZES, type JerseySize } from '../../store/cartStore'

interface Props {
  onAddToCart: (size: JerseySize, quantity: number) => void
  onDownload: () => void
  onSave?: () => void // only passed when the backend is configured
  message: string
}

const panelClass =
  'h-[45%] w-full overflow-y-auto border-t border-slate-200 bg-white p-4 ' +
  'md:h-full md:w-[340px] md:border-l md:border-t-0'

export default function EditorPanel({ onAddToCart, onDownload, onSave, message }: Props) {
  const [size, setSize] = useState<JerseySize>('M')
  const [quantity, setQuantity] = useState(1)

  return (
    <aside className={panelClass}>
      <h1 className="text-base font-semibold">Design your kit</h1>
      <PatternPicker />
      <ColorControls />
      <LogoUploader />
      <TextControls />

      {/* Size & Quantity selector */}
      <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Size</p>
        <div className="flex flex-wrap gap-1.5">
          {JERSEY_SIZES.map((s) => (
            <button
              key={s}
              onClick={() => setSize(s)}
              className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
                size === s
                  ? 'border-[#7a1f2b] bg-[#7a1f2b] text-white'
                  : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <p className="mb-1.5 mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Quantity
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 bg-white text-lg font-bold text-slate-600 hover:bg-slate-100"
          >
            −
          </button>
          <input
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
            className="h-8 w-16 rounded-lg border border-slate-300 text-center text-sm"
            aria-label="Quantity"
          />
          <button
            onClick={() => setQuantity((q) => q + 1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 bg-white text-lg font-bold text-slate-600 hover:bg-slate-100"
          >
            +
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-2">
        <Button variant="primary" onClick={() => onAddToCart(size, quantity)}>
          🛒 Add to cart — {quantity}× {size}
        </Button>
        {onSave && <Button onClick={onSave}>Save and get share code</Button>}
        <Button onClick={onDownload}>Download preview PNG</Button>
      </div>
      {message && <p className="mt-3 text-sm text-slate-600">{message}</p>}
    </aside>
  )
}
