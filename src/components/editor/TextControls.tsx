import Section from '../ui/Section'
import { useDesignStore } from '../../store/designStore'

const inputClass = 'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm'

export default function TextControls() {
  const name = useDesignStore((s) => s.name)
  const number = useDesignStore((s) => s.number)
  const update = useDesignStore((s) => s.update)

  return (
    <Section title="Name and number (back)">
      <div className="flex gap-2">
        <input
          value={name}
          maxLength={12}
          onChange={(e) => update({ name: e.target.value })}
          className={`${inputClass} flex-1`}
          placeholder="Name"
        />
        <input
          value={number}
          maxLength={2}
          onChange={(e) => update({ number: e.target.value })}
          className={`${inputClass} w-20`}
          placeholder="#"
        />
      </div>
    </Section>
  )
}
