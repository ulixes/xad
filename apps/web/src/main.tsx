import { createRoot } from 'react-dom/client'
import '@xad/styles/index.css'
import './index.css'
import './App.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <App />
)
