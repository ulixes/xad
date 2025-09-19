import { usePrivyAuth } from '../hooks/usePrivyAuth'

export function TestAuth() {
  const { 
    isPrivyAuthenticated,
    walletAddress,
    triggerSignIn,
    signOut,
    checkAuthStatus,
    privyUser
  } = usePrivyAuth()

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test Privy Authentication</h1>
      
      <div className="space-y-4">
        <div>
          <strong>Wallet Status:</strong> {isPrivyAuthenticated ? 'Connected' : 'Disconnected'}
        </div>
        
        {walletAddress && (
          <div>
            <strong>Address:</strong> {walletAddress}
          </div>
        )}
        
        {privyUser && (
          <div>
            <strong>Privy User ID:</strong> {privyUser.id}
          </div>
        )}
        
        <div>
          <strong>Backend Auth Token:</strong> {checkAuthStatus() ? 'Present' : 'None'}
        </div>
        
        <div className="space-x-4">
          <button 
            onClick={() => triggerSignIn()}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Connect with Privy
          </button>
          
          <button 
            onClick={() => signOut()}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Sign Out
          </button>
          
          <button 
            onClick={() => {
              localStorage.removeItem('auth_token')
              localStorage.removeItem('brandId')
              window.location.reload()
            }}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Clear Local Storage
          </button>
        </div>
      </div>
      
      <div className="mt-8 p-4 bg-gray-100 rounded">
        <h3 className="font-bold mb-2">Instructions:</h3>
        <ol className="list-decimal list-inside space-y-1">
          <li>Click "Connect with Privy" to authenticate</li>
          <li>Enter your email address to sign in</li>
          <li>Privy will send you a verification code</li>
          <li>An embedded wallet will be created automatically</li>
          <li>Check that "Backend Auth Token" shows "Present"</li>
        </ol>
      </div>
      
      <div className="mt-4 p-4 bg-blue-50 rounded">
        <h3 className="font-bold mb-2">Privy Benefits:</h3>
        <ul className="list-disc list-inside space-y-1">
          <li>Simple email-only authentication</li>
          <li>Automatic embedded wallet creation for all users</li>
          <li>No wallet management complexity</li>
          <li>Seamless payment experience</li>
        </ul>
      </div>
    </div>
  )
}