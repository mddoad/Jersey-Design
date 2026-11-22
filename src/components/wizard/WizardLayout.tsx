import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface Props {
  step: number
  title: string
  backTo: string
  children: ReactNode
}

export default function WizardLayout({ step, title, backTo, children }: Props) {
  return (
    <main className="mx-auto flex h-full max-w-3xl flex-col gap-6 overflow-y-auto p-6">
      <div className="flex items-center justify-between text-sm text-slate-500">
        <Link to={backTo}>&larr; Back</Link>
        <span>Step {step} of 3</span>
      </div>
      <h1 className="text-2xl font-bold">{title}</h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">{children}</div>
    </main>
  )
}
