import './App.css'
import Hero from './components/Hero'
import Features from './components/Features'
import InstallSection from './components/InstallSection'
import Footer from './components/Footer'
import LanguageSwitch from './components/LanguageSwitch'

function App() {
  return (
    <div className="min-h-screen bg-background">
      <LanguageSwitch />
      <Hero />
      <Features />
      <InstallSection />
      <Footer />
    </div>
  )
}

export default App