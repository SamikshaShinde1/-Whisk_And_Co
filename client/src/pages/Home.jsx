import HeroSlider from '../components/home/HeroSlider'
import FreshFromOven from '../components/home/FreshFromOven'
import TheCraft from '../components/home/TheCraft'
import SignatureBake from '../components/home/SignatureBake'
import Reviews from '../components/home/Reviews'
import PreorderSection from '../components/home/PreorderSection'
import usePageTitle from '../hooks/usePageTitle'

// Sections alternate dark brown and cream, top to bottom.
export default function Home() {
  usePageTitle()

  return (
    <>
      <HeroSlider />
      <FreshFromOven />
      <TheCraft />
      <SignatureBake />
      <Reviews />
      <PreorderSection />
    </>
  )
}
