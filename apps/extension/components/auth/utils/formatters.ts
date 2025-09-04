export const formatWalletAddress = (address: string): string => {
  if (!address || address.length < 10) return address
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export const formatEmail = (email: string): string => {
  if (!email || !email.includes('@')) return email
  
  const [localPart, domain] = email.split('@')
  if (localPart.length <= 3) return email
  
  return `${localPart.slice(0, 3)}...@${domain}`
}

export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '')
  
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
  }
  
  if (cleaned.length === 11 && cleaned[0] === '1') {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`
  }
  
  return phone
}

export const truncateText = (text: string, maxLength: number): string => {
  if (!text || text.length <= maxLength) return text
  return `${text.slice(0, maxLength)}...`
}