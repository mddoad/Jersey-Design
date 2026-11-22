import type { ButtonHTMLAttributes } from 'react'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary'
}

const styles = {
  primary: 'border-[#7a1f2b] bg-[#7a1f2b] text-white hover:opacity-90',
  secondary: 'border-slate-300 bg-white text-slate-900 hover:bg-slate-50',
}

export default function Button({ variant = 'secondary', className = '', ...rest }: Props) {
  return (
    <button
      className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${styles[variant]} ${className}`}
      {...rest}
    />
  )
}
