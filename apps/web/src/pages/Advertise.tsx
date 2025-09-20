import { SimplifiedAdTargetingForm } from '../components/AdTargetingForm/SimplifiedAdTargetingForm'
import { useNavigate } from 'react-router-dom'
import { usePrivyAuth } from '../hooks/usePrivyAuth'

export default function Advertise() {
  const navigate = useNavigate()
  const { walletAddress, isPrivyAuthenticated } = usePrivyAuth()

  const handleSave = (campaignData: any) => {
    console.log('Campaign created:', campaignData)
    // After successful campaign creation, redirect to dashboard
    navigate('/dashboard')
  }

  return (
    <section className="py-8 sm:py-12 lg:py-16">
      <div className="container mx-auto">
        <SimplifiedAdTargetingForm 
          onSave={handleSave} 
          mockWalletConnected={isPrivyAuthenticated}
        />
      </div>
    </section>
  )
}