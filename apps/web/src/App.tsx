import './App.css'
import { HashRouter as Router, Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import ProtectedRoute from './components/ProtectedRoute'
import HomePage from './pages/HomePage'
import Blog from './pages/Blog'
import BlogPost from './pages/BlogPost'
import Advertise from './pages/Advertise'
import { Dashboard } from './pages/Dashboard'
import { TestAuth } from './pages/TestAuth'
import TermsPage from './pages/TermsPage'
import PrivacyPage from './pages/PrivacyPage'
import { PrivyAuthProvider } from './config/privy'

function App() {
  return (
    <PrivyAuthProvider>
      <Router>
        <div className="min-h-screen bg-background">
          <Header />
          <div className="pt-16">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:slug" element={<BlogPost />} />
              <Route path="/advertise" element={<Advertise />} />
              <Route path="/test-auth" element={<TestAuth />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
            </Routes>
            <Footer />
          </div>
        </div>
      </Router>
    </PrivyAuthProvider>
  )
}

export default App