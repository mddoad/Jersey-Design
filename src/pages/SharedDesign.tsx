import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { loadDesign } from '../features/saved-designs/designApi'
import { useDesignStore } from '../store/designStore'

// Opens a design from a share link such as  /#/d/AB3K9Z
export default function SharedDesign() {
  const { code = '' } = useParams()
  const navigate = useNavigate()
  const update = useDesignStore((s) => s.update)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    loadDesign(code)
      .then((design) => {
        if (cancelled) return
        if (!design) {
          setError('Design not found.')
          return
        }
        update(design)
        // "shared" is not a preset color, so the editor keeps the loaded colors.
        navigate(`/sport/${design.sport}/cut/${design.cut}/color/shared`, { replace: true })
      })
      .catch(() => {
        if (!cancelled) setError('Could not load this design.')
      })
    return () => {
      cancelled = true
    }
  }, [code, navigate, update])

  return (
    <main className="flex h-full items-center justify-center text-slate-600">
      {error || 'Loading design...'}
    </main>
  )
}
