import { useEffect, useRef, useState, useCallback } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import type * as THREE from 'three'
import GarmentViewer, { type View } from '../components/viewer/GarmentViewer'
import EditorPanel from '../components/editor/EditorPanel'
import Button from '../components/ui/Button'
import { COLORS } from '../data/catalog'
import { selectDesign, useDesignStore } from '../store/designStore'
import { useCartStore, type JerseySize } from '../store/cartStore'
import { captureThumbnail, downloadPng } from '../lib/exportImage'
import { isBackendEnabled, saveDesign } from '../features/saved-designs/designApi'

export default function Editor() {
  const { sport = 'football', cut = 'men', color } = useParams()
  const navigate = useNavigate()
  const update = useDesignStore((s) => s.update)
  const setColor = useDesignStore((s) => s.setColor)
  const addItem = useCartStore((s) => s.addItem)
  const cartCount = useCartStore((s) => s.items.length)

  const [view, setView] = useState<View>('front')
  const [autoRotate, setAutoRotate] = useState(false)
  const [message, setMessage] = useState('')
  const [toast, setToast] = useState<{ visible: boolean; text: string }>({ visible: false, text: '' })
  const glRef = useRef<THREE.WebGLRenderer | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Apply the choices from the URL (sport, cut, color) to the design.
  useEffect(() => {
    update({ sport, cut })
    const preset = COLORS.find((c) => c.id === color)
    if (preset) setColor('primary', preset.hex)
  }, [sport, cut, color, update, setColor])

  const currentDesign = () => selectDesign(useDesignStore.getState())

  const showToast = useCallback((text: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast({ visible: true, text })
    toastTimer.current = setTimeout(() => setToast({ visible: false, text: '' }), 4000)
  }, [])

  const handleAddToCart = (size: JerseySize, quantity: number) => {
    if (!glRef.current) return
    addItem({
      thumbnail: captureThumbnail(glRef.current),
      design: currentDesign(),
      size,
      quantity,
    })
    showToast(`Added ${quantity}× size ${size} to cart`)
  }

  const handleSave = async () => {
    try {
      const code = await saveDesign(currentDesign())
      setMessage(`Saved! Share this link: ${location.origin}/#/d/${code}`)
    } catch {
      setMessage('Could not save the design. Check your Supabase settings.')
    }
  }

  return (
    <div className="flex h-full flex-col md:flex-row">
      <div className="relative min-h-0 flex-1 bg-gradient-to-b from-white to-slate-200">
        <GarmentViewer view={view} autoRotate={autoRotate} onGl={(gl) => (glRef.current = gl)} />

        <Link to="/sport" className="absolute left-3 top-3 text-sm text-slate-600">
          &larr; Start over
        </Link>
        <Link to="/cart" className="absolute right-3 top-3 flex items-center gap-1 text-sm font-medium text-slate-800">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
          Cart
          {cartCount > 0 && (
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#7a1f2b] px-1 text-xs font-bold text-white">
              {cartCount}
            </span>
          )}
        </Link>

        {/* Toast notification */}
        {toast.visible && (
          <div className="absolute left-1/2 top-4 z-50 flex -translate-x-1/2 items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-2.5 shadow-lg animate-in fade-in slide-in-from-top-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            <span className="text-sm font-medium text-green-800">{toast.text}</span>
            <button
              onClick={() => navigate('/cart')}
              className="ml-1 rounded-lg bg-[#7a1f2b] px-3 py-1 text-xs font-semibold text-white hover:opacity-90"
            >
              View Cart
            </button>
          </div>
        )}

        <div className="absolute bottom-3 left-3 flex flex-wrap gap-2">
          <Button variant={view === 'front' ? 'primary' : 'secondary'} onClick={() => setView('front')}>
            Front
          </Button>
          <Button variant={view === 'back' ? 'primary' : 'secondary'} onClick={() => setView('back')}>
            Back
          </Button>
          <Button
            variant={autoRotate ? 'primary' : 'secondary'}
            onClick={() => setAutoRotate((v) => !v)}
          >
            Auto-rotate
          </Button>
        </div>
      </div>

      <EditorPanel
        onAddToCart={handleAddToCart}
        onDownload={() => glRef.current && downloadPng(glRef.current)}
        onSave={isBackendEnabled ? handleSave : undefined}
        message={message}
      />
    </div>
  )
}
