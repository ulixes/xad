import { useAppKit } from '@reown/appkit/react'
import { useAccount } from 'wagmi'

export function TestAuth() {
  const { open } = useAppKit()
  const { address, isConnected } = useAccount()

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test SIWX Authentication</h1>
      
      <div className="space-y-4">
        <div>
          <strong>Wallet Status:</strong> {isConnected ? 'Connected' : 'Disconnected'}
        </div>
        
        {address && (
          <div>
            <strong>Address:</strong> {address}
          </div>
        )}
        
        <div>
          <strong>Auth Token:</strong> {localStorage.getItem('auth_token') ? 'Present' : 'None'}
        </div>
        
        <div className="space-x-4">
          <button 
            onClick={() => open()}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Connect Wallet
          </button>
          
          <button 
            onClick={() => {
              localStorage.removeItem('auth_token')
              window.location.reload()
            }}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Clear Auth
          </button>
        </div>
      </div>
      
      <div className="mt-8 p-4 bg-gray-100 rounded">
        <h3 className="font-bold mb-2">Instructions:</h3>
        <ol className="list-decimal list-inside space-y-1">
          <li>Click "Connect Wallet" to connect your wallet</li>
          <li>SIWX should automatically prompt you to sign a message</li>
          <li>After signing, check that "Auth Token" shows "Present"</li>
          <li>Check browser console for detailed SIWX logs</li>
        </ol>
      </div>
    </div>
  )
}