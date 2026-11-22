import { Link } from 'react-router-dom'
import { MIN_ORDER } from '../data/catalog'

const pageClass =
  'flex h-full flex-col items-center justify-center gap-6 ' +
  'bg-gradient-to-b from-white to-slate-200 p-6 text-center'

export default function Landing() {
  return (
    <main className={pageClass}>
      <h1 className="text-4xl font-bold tracking-tight">Design your own kit</h1>
      <p className="max-w-md text-slate-600">
        Pick a sport, choose a cut and a color, then customize your kit in 3D. Orders start from{' '}
        {MIN_ORDER} garments.
      </p>
      <Link to="/sport" className="rounded-lg bg-[#7a1f2b] px-6 py-3 font-semibold text-white">
        Start designing
      </Link>
    </main>
  )
}
