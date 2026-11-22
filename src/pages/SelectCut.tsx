import { useParams } from 'react-router-dom'
import ChoiceCard from '../components/wizard/ChoiceCard'
import WizardLayout from '../components/wizard/WizardLayout'
import { CUTS } from '../data/catalog'

export default function SelectCut() {
  const { sport = 'football' } = useParams()
  return (
    <WizardLayout step={2} title="Select your cut" backTo="/sport">
      {CUTS.map((c) => (
        <ChoiceCard key={c.id} to={`/sport/${sport}/cut/${c.id}/color`} label={c.label} />
      ))}
    </WizardLayout>
  )
}
