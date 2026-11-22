import Button from '../ui/Button'
import ColorControls from './Colorcontrols'
import LogoUploader from './LogoUploader'
import PatternPicker from './PatternPicker'
import TextControls from './TextControls'

interface Props {
  onAddToCart: () => void
  onDownload: () => void
  onSave?: () => void // only passed when the backend is configured
  message: string
}

const panelClass =
  'h-[45%] w-full overflow-y-auto border-t border-slate-200 bg-white p-4 ' +
  'md:h-full md:w-[340px] md:border-l md:border-t-0'

export default function EditorPanel({ onAddToCart, onDownload, onSave, message }: Props) {
  return (
    <aside className={panelClass}>
      <h1 className="text-base font-semibold">Design your kit</h1>
      <PatternPicker />
      <ColorControls />
      <LogoUploader />
      <TextControls />

      <div className="mt-6 grid gap-2">
        <Button variant="primary" onClick={onAddToCart}>
          Add to cart
        </Button>
        {onSave && <Button onClick={onSave}>Save and get share code</Button>}
        <Button onClick={onDownload}>Download preview PNG</Button>
      </div>
      {message && <p className="mt-3 text-sm text-slate-600">{message}</p>}
    </aside>
  )
}
