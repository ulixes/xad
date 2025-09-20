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
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-3xl sm:text-4xl font-bold mb-2">Advertise on TikTok</h1>
        <p className="text-muted-foreground mb-6 sm:mb-8">
          Reach your target audience with our blockchain-powered engagement platform
        </p>
        <SimplifiedAdTargetingForm 
          onSave={handleSave} 
          mockWalletConnected={isPrivyAuthenticated}
        />
      </div>
    </section>
  )
}