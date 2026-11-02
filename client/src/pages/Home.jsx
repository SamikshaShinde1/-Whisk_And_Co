import HeroSlider from '../components/home/HeroSlider'
import SpecialOffers from '../components/home/SpecialOffers'
import FreshFromOven from '../components/home/FreshFromOven'
import TheCraft from '../components/home/TheCraft'
import SignatureBake, { SIGNATURE_SLUG } from '../components/home/SignatureBake'
import Reviews from '../components/home/Reviews'
import PreorderSection from '../components/home/PreorderSection'
import ChapterNav from '../components/home/ChapterNav'
import usePageTitle from '../hooks/usePageTitle'
import useSpecials from '../hooks/useSpecials'
import useProducts, { findProduct } from '../hooks/useProducts'

// The Home page tells its story in numbered chapters (01, 02, 03…), top to bottom.
// Sections that are hidden right now (no specials running, brownie deleted) are left out,
// so the numbers always count up without gaps. "label" is the chapter's own heading.
export default function Home() {
  usePageTitle()
  const { specials, title } = useSpecials()
  const { products, loading } = useProducts()
  const hasSignature = loading || Boolean(findProduct(products, SIGNATURE_SLUG))

  const chapters = [
    { id: 'chapter-featured', label: 'Featured bakes', Section: HeroSlider },
    specials.length > 0 && { id: 'chapter-specials', label: title, Section: SpecialOffers },
    { id: 'chapter-fresh', label: 'Fresh from the oven', Section: FreshFromOven },
    { id: 'chapter-craft', label: 'Slow baking, made by hand', Section: TheCraft },
    hasSignature && { id: 'chapter-signature', label: 'The fudge brownie', Section: SignatureBake },
    { id: 'chapter-reviews', label: 'What our customers say', Section: Reviews },
    { id: 'chapter-preorder', label: 'Preorder your favourites', Section: PreorderSection },
  ].filter(Boolean)

  return (
    <>
      <ChapterNav chapters={chapters} />
      {chapters.map(({ id, Section }, i) => (
        <div key={id} id={id} className="chapter">
          <Section chapter={i + 1} />
        </div>
      ))}
    </>
  )
}
