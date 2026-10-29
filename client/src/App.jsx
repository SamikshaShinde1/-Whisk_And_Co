import { useCallback, useState } from 'react'
import { Navigate, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'motion/react'
import Intro from './components/Intro'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import FloatingButtons from './components/FloatingButtons'
import ScrollManager from './components/ScrollManager'
import Home from './pages/Home'
import Menu from './pages/Menu'
import ProductDetail from './pages/ProductDetail'
import NotFound from './pages/NotFound'
import Track from './pages/Track'
import AdminLogin from './pages/admin/AdminLogin'
import AdminOrders from './pages/admin/AdminOrders'

// The intro plays once per visit (until the browser tab is closed).
function shouldShowIntro() {
  try {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false
    return sessionStorage.getItem('introSeen') !== 'yes'
  } catch {
    return true
  }
}

export default function App() {
  const [showIntro, setShowIntro] = useState(shouldShowIntro)
  // Admin pages skip the intro and the floating buttons
  const isAdmin = useLocation().pathname.startsWith('/admin')

  const finishIntro = useCallback(() => {
    try {
      sessionStorage.setItem('introSeen', 'yes')
    } catch {
      // storage blocked (e.g. private mode) – the intro will just play again next time
    }
    setShowIntro(false)
  }, [])

  return (
    <>
      <AnimatePresence>{showIntro && !isAdmin && <Intro onDone={finishIntro} />}</AnimatePresence>

      <ScrollManager />
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/menu/:id" element={<ProductDetail />} />
          <Route path="/track" element={<Track />} />
          <Route path="/admin" element={<Navigate to="/admin/orders" replace />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/orders" element={<AdminOrders />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer compact={isAdmin} />
      {!isAdmin && <FloatingButtons />}
    </>
  )
}
