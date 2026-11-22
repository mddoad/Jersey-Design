import ChoiceCard from '../components/wizard/ChoiceCard'
import WizardLayout from '../components/wizard/WizardLayout'
import { SPORTS } from '../data/catalog'

export default function SelectSport() {
  return (
    <WizardLayout step={1} title="Select your sport" backTo="/">
      {SPORTS.map((s) => (
        <ChoiceCard key={s.id} to={`/sport/${s.id}/cut`} label={s.label} />
      ))}
    </WizardLayout>
  )
}
