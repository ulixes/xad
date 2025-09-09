import { useState, useEffect } from 'react';
import { createPublicClient, http, formatUnits, getAddress } from 'viem';
import { base } from 'viem/chains';

// Contract address for the Megapot (Production)
const MEGAPOT_CONTRACT = getAddress('0xbEDd4F2beBE9E3E636161E644759f3cbe3d51B95'); // Base mainnet PROD

// ABI for the pool totals and timing
const MEGAPOT_ABI = [
  {
    inputs: [],
    name: 'lpPoolTotal',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'userPoolTotal',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'lastJackpotEndTime',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'roundDurationInSeconds',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  }
] as const;

export function useJackpotBalance() {
  const [balance, setBalance] = useState<string>('1000000'); // Default to $1M
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const client = createPublicClient({
          chain: base,
          transport: http()
        });

        // Get both pool totals as per the documentation
        const lpPoolTotal = await client.readContract({
          address: MEGAPOT_CONTRACT,
          abi: MEGAPOT_ABI,
          functionName: 'lpPoolTotal'
        }) as bigint;
        
        const userPoolTotal = await client.readContract({
          address: MEGAPOT_CONTRACT,
          abi: MEGAPOT_ABI,
          functionName: 'userPoolTotal'
        }) as bigint;

        // Take the larger of the two values
        const jackpotAmount = lpPoolTotal > userPoolTotal ? lpPoolTotal : userPoolTotal;
        
        // Format from 6 decimals (USDC) to human readable
        const formatted = formatUnits(jackpotAmount, 6);
        
        // Format with commas and no decimals
        const amount = Math.floor(parseFloat(formatted));
        setBalance(amount.toLocaleString('en-US'));
        
        // Get time remaining
        try {
          const lastJackpotEndTime = await client.readContract({
            address: MEGAPOT_CONTRACT,
            abi: MEGAPOT_ABI,
            functionName: 'lastJackpotEndTime'
          }) as bigint;
          
          const roundDuration = await client.readContract({
            address: MEGAPOT_CONTRACT,
            abi: MEGAPOT_ABI,
            functionName: 'roundDurationInSeconds'
          }) as bigint;
          
          const nextJackpotStartTime = Number(lastJackpotEndTime) + Number(roundDuration);
          const remaining = nextJackpotStartTime - (Date.now() / 1000);
          setTimeRemaining(remaining > 0 ? remaining : 0);
        } catch (err) {
          console.error('Error fetching time remaining:', err);
          // Default to 48 hours if we can't get the real time
          setTimeRemaining(48 * 60 * 60);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching jackpot data:', err);
        setError('Failed to fetch jackpot data');
        setBalance('1000000'); // Fallback to $1M
        setTimeRemaining(48 * 60 * 60); // Fallback to 48 hours
        setLoading(false);
      }
    };

    fetchData();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return { balance, timeRemaining, loading, error };
}