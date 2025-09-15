import { useAccount } from 'wagmi'
import { useEffect, useState } from 'react'
import { BrandDashboard, type Campaign } from '../components/BrandDashboard/BrandDashboard'
import { useNavigate } from 'react-router-dom'

export function Dashboard() {
  const { address, isConnected } = useAccount()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!isConnected || !address) {
      setLoading(false)
      return
    }

    fetchCampaigns()
  }, [isConnected, address])

  const fetchCampaigns = async () => {
    if (!address) return

    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        setError('Please sign in with your wallet first')
        setLoading(false)
        return
      }

      const response = await fetch(`/api/campaigns/brand/${address}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        if (response.status === 401) {
          setError('Authentication required. Please sign in with your wallet.')
          localStorage.removeItem('auth_token')
        } else {
          setError('Failed to fetch campaigns')
        }
        setLoading(false)
        return
      }

      const data = await response.json()
      // Transform the API response to match BrandDashboard Campaign interface
      const transformedCampaigns: Campaign[] = (data.campaigns || []).map((campaign: any) => ({
        id: campaign.id,
        platform: campaign.platform as Campaign['platform'],
        totalBudget: campaign.totalBudget,
        remainingBudget: campaign.remainingBudget,
        status: campaign.status as Campaign['status'],
        isActive: campaign.isActive,
        createdAt: campaign.createdAt,
        updatedAt: campaign.updatedAt || campaign.createdAt,
        actions: campaign.actions || []
      }))
      setCampaigns(transformedCampaigns)
      setLoading(false)
    } catch (err) {
      console.error('Error fetching campaigns:', err)
      setError('Failed to load campaigns')
      setLoading(false)
    }
  }

  const handleCreateCampaign = () => {
    navigate('/advertise')
  }

  const handleRefresh = () => {
    setLoading(true)
    fetchCampaigns()
  }

  return (
    <div className="p-6">
      <BrandDashboard
        campaigns={campaigns}
        isLoading={loading || !isConnected}
        walletAddress={address}
        onCreateCampaign={handleCreateCampaign}
        onRefresh={handleRefresh}
      />
    </div>
  )
}