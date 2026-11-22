import Section from '../ui/Section'
import { COLORS } from '../../data/catalog'
import { useDesignStore } from '../../store/designStore'
import type { DesignColors } from '../../types/design'

const FIELDS: { key: keyof DesignColors; label: string }[] = [
  { key: 'primary', label: 'Primary' },
  { key: 'secondary', label: 'Secondary (pattern)' },
  { key: 'trim', label: 'Collar and cuffs' },
  { key: 'text', label: 'Name and number' },
]

export default function ColorControls() {
  const colors = useDesignStore((s) => s.colors)
  const setColor = useDesignStore((s) => s.setColor)

  return (
    <>
      <Section title="Quick colors (primary)">
        <div className="flex flex-wrap gap-2">
          {COLORS.map((c) => (
            <button
              key={c.id}
              title={c.label}
              aria-label={c.label}
              onClick={() => setColor('primary', c.hex)}
              className="h-7 w-7 rounded-full border-2 border-slate-300"
              style={{ background: c.hex }}
            />
          ))}
        </div>
      </Section>

      <Section title="Colors">
        {FIELDS.map((f) => (
          <label key={f.key} className="my-2 flex items-center justify-between text-sm">
            {f.label}
            <input
              type="color"
              value={colors[f.key]}
              onChange={(e) => setColor(f.key, e.target.value)}
              className="h-8 w-12 cursor-pointer rounded border border-slate-300"
            />
          </label>
        ))}
      </Section>
    </>
  )
}
