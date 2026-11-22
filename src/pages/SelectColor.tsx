import { useParams } from 'react-router-dom'
import ChoiceCard from '../components/wizard/ChoiceCard'
import WizardLayout from '../components/wizard/WizardLayout'
import { COLORS } from '../data/catalog'

export default function SelectColor() {
  const { sport = 'football', cut = 'men' } = useParams()
  return (
    <WizardLayout step={3} title="Select your primary color" backTo={`/sport/${sport}/cut`}>
      {COLORS.map((c) => (
        <ChoiceCard
          key={c.id}
          to={`/sport/${sport}/cut/${cut}/color/${c.id}`}
          label={c.label}
          swatch={c.hex}
        />
      ))}
    </WizardLayout>
  )
}
