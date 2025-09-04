export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const isValidPhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^\+?[\d\s\-\(\)]+$/
  const cleaned = phone.replace(/\D/g, '')
  return phoneRegex.test(phone) && cleaned.length >= 10 && cleaned.length <= 15
}

export const isValidWalletAddress = (address: string): boolean => {
  const ethereumRegex = /^0x[a-fA-F0-9]{40}$/
  return ethereumRegex.test(address)
}

export const isValidSolanaAddress = (address: string): boolean => {
  const solanaRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/
  return solanaRegex.test(address)
}