import { AdTargetingFormBeta } from '../components/AdTargetingForm/AdTargetingFormBeta'
import { useNavigate } from 'react-router-dom'

export default function Advertise() {
  const navigate = useNavigate()

  const handleSave = () => {
    // After successful campaign creation, redirect to dashboard
    navigate('/dashboard')
  }

  return (
    <section className="py-8 sm:py-12 lg:py-16">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-3xl sm:text-4xl font-bold mb-2">Create Campaign</h1>
        <p className="text-muted-foreground mb-6 sm:mb-8">
          Launch your campaign on TikTok or Instagram. Beta version - no targeting requirements needed.
        </p>
        <AdTargetingFormBeta onSave={handleSave} />
      </div>
    </section>
  )
}