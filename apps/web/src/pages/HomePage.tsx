import { SimplifiedAdTargetingForm } from '../components/AdTargetingForm/SimplifiedAdTargetingForm'
import FAQ from '../components/FAQ'

export default function HomePage() {
  return (
    <>
      <div className="container mx-auto px-4 py-8">
        <SimplifiedAdTargetingForm />
      </div>
      <FAQ />
    </>
  )
}