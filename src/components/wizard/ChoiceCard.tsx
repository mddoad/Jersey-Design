import { Link } from 'react-router-dom'

interface Props {
  to: string
  label: string
  swatch?: string // optional color circle
}

const cardClass =
  'flex flex-col items-center gap-3 rounded-xl border border-slate-200 bg-white p-6 ' +
  'text-center shadow-sm transition hover:border-[#7a1f2b] hover:shadow-md'

export default function ChoiceCard({ to, label, swatch }: Props) {
  return (
    <Link to={to} className={cardClass}>
      {swatch && (
        <span
          className="h-14 w-14 rounded-full border border-slate-300"
          style={{ background: swatch }}
        />
      )}
      <span className="font-medium">{label}</span>
    </Link>
  )
}
