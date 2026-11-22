import Button from '../ui/Button'
import Section from '../ui/Section'
import { PATTERNS } from '../../data/catalog'
import { useDesignStore } from '../../store/designStore'

export default function PatternPicker() {
  const pattern = useDesignStore((s) => s.pattern)
  const update = useDesignStore((s) => s.update)

  return (
    <Section title="Design">
      <div className="flex flex-wrap gap-2">
        {PATTERNS.map((p) => (
          <Button
            key={p.id}
            variant={pattern === p.id ? 'primary' : 'secondary'}
            onClick={() => update({ pattern: p.id })}
          >
            {p.label}
          </Button>
        ))}
      </div>
    </Section>
  )
}
