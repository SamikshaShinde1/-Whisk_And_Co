import { useCallback, useState } from 'react'
import { Navigate, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'motion/react'
import Intro from './components/Intro'
import Navbar from './components/Navbar'
import SpecialBanner from './components/SpecialBanner'
import CartProvider from './components/cart/CartProvider'
import CartDrawer from './components/cart/CartDrawer'
import SundayNotice from './components/SundayNotice'
import Footer from './components/Footer'
import FloatingButtons from './components/FloatingButtons'
import WakeUpNotice from './components/WakeUpNotice'
import ScrollManager from './components/ScrollManager'
import Home from './pages/Home'
import Menu from './pages/Menu'
import ProductDetail from './pages/ProductDetail'
import NotFound from './pages/NotFound'
import Track from './pages/Track'
import Checkout from './pages/Checkout'
import AdminLogin from './pages/admin/AdminLogin'
import AdminOrders from './pages/admin/AdminOrders'
import AdminMenu from './pages/admin/AdminMenu'

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
  const { pathname } = useLocation()
  const isAdmin = pathname.startsWith('/admin')
  // The orders and menu pages have their own slim bar (AdminBar) instead of the navbar
  const showNavbar = !isAdmin || pathname === '/admin/login'

  const finishIntro = useCallback(() => {
    try {
      sessionStorage.setItem('introSeen', 'yes')
    } catch {
      // storage blocked (e.g. private mode) – the intro will just play again next time
    }
    setShowIntro(false)
  }, [])

  return (
    // CartProvider shares the shopping cart with every page
    <CartProvider>
      <AnimatePresence>{showIntro && !isAdmin && <Intro onDone={finishIntro} />}</AnimatePresence>

      <ScrollManager />
      {showNavbar && <Navbar />}
      {!isAdmin && <SpecialBanner />}
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/menu/:slug" element={<ProductDetail />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/track" element={<Track />} />
          <Route path="/admin" element={<Navigate to="/admin/orders" replace />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/orders" element={<AdminOrders />} />
          <Route path="/admin/menu" element={<AdminMenu />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer compact={isAdmin} />
      {!isAdmin && <FloatingButtons />}
      {!isAdmin && <CartDrawer />}
      {!isAdmin && <SundayNotice ready={!showIntro} />}
      <WakeUpNotice />
    </CartProvider>
  )
}
