import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import type * as THREE from 'three'
import GarmentViewer, { type View } from '../components/viewer/GarmentViewer'
import EditorPanel from '../components/editor/EditorPanel'
import Button from '../components/ui/Button'
import { COLORS } from '../data/catalog'
import { selectDesign, useDesignStore } from '../store/designStore'
import { useCartStore } from '../store/cartStore'
import { captureThumbnail, downloadPng } from '../lib/exportImage'
import { isBackendEnabled, saveDesign } from '../features/saved-designs/designApi'

export default function Editor() {
  const { sport = 'football', cut = 'men', color } = useParams()
  const update = useDesignStore((s) => s.update)
  const setColor = useDesignStore((s) => s.setColor)
  const addItem = useCartStore((s) => s.addItem)
  const cartCount = useCartStore((s) => s.items.length)

  const [view, setView] = useState<View>('front')
  const [autoRotate, setAutoRotate] = useState(false)
  const [message, setMessage] = useState('')
  const glRef = useRef<THREE.WebGLRenderer | null>(null)

  // Apply the choices from the URL (sport, cut, color) to the design.
  useEffect(() => {
    update({ sport, cut })
    const preset = COLORS.find((c) => c.id === color)
    if (preset) setColor('primary', preset.hex)
  }, [sport, cut, color, update, setColor])

  const currentDesign = () => selectDesign(useDesignStore.getState())

  const handleAddToCart = () => {
    if (!glRef.current) return
    addItem({ thumbnail: captureThumbnail(glRef.current), design: currentDesign() })
    setMessage('Added to your cart.')
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
        <Link to="/cart" className="absolute right-3 top-3 text-sm font-medium text-slate-800">
          Cart ({cartCount})
        </Link>

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
