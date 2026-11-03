import { lazy, Suspense, useCallback, useState } from 'react'
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
// The admin pages are only for the bakery owner, so they are loaded only when someone opens them.
// Customers never download their code, and the website opens a little faster.
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'))
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'))
const AdminMenu = lazy(() => import('./pages/admin/AdminMenu'))

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
    // CartProvider shares the shopping cart with every page
    <CartProvider>
      <AnimatePresence>{showIntro && !isAdmin && <Intro onDone={finishIntro} />}</AnimatePresence>

      <ScrollManager />
      <Navbar />
      {!isAdmin && <SpecialBanner />}
      <main>
        {/* while an admin page is being loaded, a short note is shown */}
        <Suspense fallback={<p className="page-loading" role="status">Loading…</p>}>
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
        </Suspense>
      </main>
      <Footer compact={isAdmin} />
      {!isAdmin && <FloatingButtons />}
      {!isAdmin && <CartDrawer />}
      {!isAdmin && <SundayNotice ready={!showIntro} />}
      <WakeUpNotice />
    </CartProvider>
  )
}
