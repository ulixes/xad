import { useEffect, useState } from 'react'
import { BrandDashboard, type Campaign } from '../components/BrandDashboard/BrandDashboard'
import { useNavigate } from 'react-router-dom'
import { usePrivyAuth } from '../hooks/usePrivyAuth'

export function Dashboard() {
  const { walletAddress, isPrivyAuthenticated, getAccessToken } = usePrivyAuth()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!isPrivyAuthenticated) {
      setLoading(false)
      return
    }

    fetchCampaigns()
  }, [isPrivyAuthenticated])

  const fetchCampaigns = async () => {
    console.log('[Dashboard] fetchCampaigns called')
    
    try {
      const token = await getAccessToken()
      
      console.log('[Dashboard] Auth token:', token ? 'exists' : 'missing')
      
      if (!token) {
        setError('Please sign in first')
        setLoading(false)
        return
      }

      // Use new endpoint that doesn't need wallet address
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
      const url = `${apiUrl}/campaigns/my-campaigns`
      console.log('[Dashboard] Fetching campaigns from:', url)
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true'
        }
      })

      if (!response.ok) {
        if (response.status === 401) {
          setError('Authentication required. Please sign in with your wallet.')
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
    navigate('/')
  }

  const handleRefresh = () => {
    setLoading(true)
    fetchCampaigns()
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      {error && (
        <div className="text-red-500 mb-4">{error}</div>
      )}
      <BrandDashboard
        campaigns={campaigns}
        isLoading={loading || !isPrivyAuthenticated}
        walletAddress={walletAddress}
        onCreateCampaign={handleCreateCampaign}
        onRefresh={handleRefresh}
      />
    </div>
  )
}