import type { ReactNode } from 'react'

export default function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-5">
      <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-slate-500">
        {title}
      </h2>
      {children}
    </section>
  )
}
