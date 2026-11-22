import { useState } from 'react'
import Button from '../ui/Button'
import Section from '../ui/Section'
import { fileToLogoDataUrl } from '../../lib/imageUtils'
import { useDesignStore } from '../../store/designStore'

export default function LogoUploader() {
  const logo = useDesignStore((s) => s.logo)
  const update = useDesignStore((s) => s.update)
  const [error, setError] = useState('')

  const onFile = async (file: File | undefined) => {
    if (!file) return
    try {
      setError('')
      update({ logo: await fileToLogoDataUrl(file) })
    } catch {
      setError('Could not read that image. Try a PNG or JPG.')
    }
  }

  return (
    <Section title="Logo (chest)">
      <input
        type="file"
        accept="image/*"
        onChange={(e) => onFile(e.target.files?.[0])}
        className="block w-full text-sm"
      />
      {logo && (
        <Button className="mt-2" onClick={() => update({ logo: null })}>
          Remove logo
        </Button>
      )}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </Section>
  )
}
