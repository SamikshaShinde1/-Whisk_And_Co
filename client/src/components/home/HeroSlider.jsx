import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react'
import { FiArrowRight } from 'react-icons/fi'
import SmartImage from '../SmartImage'
import { formatPrice } from '../../data/menu'
import useProducts, { findProduct } from '../../hooks/useProducts'
import './HeroSlider.css'

// Each slide shows one product from the menu (its photo + price come from the database).
// "slug" is the item's web address name. If that item is sold out, the photo turns grey;
// if it was deleted, the slide still shows its words, with a placeholder picture and a link to the menu.
const SLIDES = [
  {
    slug: 'chocolate-truffle-cake',
    script: 'freshly baked',
    title: 'Baked with love, served with joy',
    text: 'Rich cakes, soft breads and little treats, made fresh in our home kitchen and baked to order.',
  },
  {
    slug: 'chocolate-chip-cookies',
    script: 'little treats',
    title: 'Small bites, big smiles',
    text: 'Cupcakes, cookies and brownies for every sweet craving, and for every celebration in between.',
  },
  {
    slug: 'sourdough',
    script: 'every morning',
    title: 'Fresh bread, warm hearts',
    text: 'Slow-fermented sourdough and soft everyday loaves with crackly golden crusts.',
  },
]

const SLIDE_TIME_MS = 6000

const fadeUp = {
  hide: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.2, 0.7, 0.2, 1] } },
}

export default function HeroSlider() {
  const [index, setIndex] = useState(0)
  const { products } = useProducts()
  const next = () => setIndex((i) => (i + 1) % SLIDES.length)

  // Auto-play: move on every 6 seconds (the timer restarts when the slide changes).
  useEffect(() => {
    const timer = setTimeout(() => setIndex((i) => (i + 1) % SLIDES.length), SLIDE_TIME_MS)
    return () => clearTimeout(timer)
  }, [index])

  // 3D tilt: track where the mouse is inside the hero (-0.5 to 0.5),
  // then turn that into a gentle rotation with a springy feel.
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const spring = { stiffness: 120, damping: 14 }
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-16, 16]), spring)
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [12, -12]), spring)

  const onMouseMove = (event) => {
    const box = event.currentTarget.getBoundingClientRect()
    mouseX.set((event.clientX - box.left) / box.width - 0.5)
    mouseY.set((event.clientY - box.top) / box.height - 0.5)
  }
  const onMouseLeave = () => {
    mouseX.set(0)
    mouseY.set(0)
  }

  // Swipe left/right on phones
  const onDragEnd = (_event, info) => {
    if (info.offset.x < -60) next()
    else if (info.offset.x > 60) setIndex((i) => (i - 1 + SLIDES.length) % SLIDES.length)
  }

  return (
    <section
      className="hero"
      aria-roledescription="carousel"
      aria-label="Featured bakes"
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      <div className="container">
        {/* All slides sit on top of each other, so the height never jumps. */}
        <motion.div
          className="hero__stage"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.12}
          onDragEnd={onDragEnd}
        >
          {SLIDES.map((slide, i) => {
            const item = findProduct(products, slide.slug)
            const active = i === index
            return (
              <motion.div
                key={slide.slug}
                className="hero__slide"
                aria-hidden={!active}
                inert={!active}
                initial="hide"
                animate={active ? 'show' : 'hide'}
                variants={{
                  show: { opacity: 1, transition: { duration: 0.5, staggerChildren: 0.12 } },
                  hide: { opacity: 0, transition: { duration: 0.4 } },
                }}
              >
                <div className="hero__text">
                  <motion.span className="script" variants={fadeUp}>{slide.script}</motion.span>
                  <motion.h1 variants={fadeUp}>{slide.title}</motion.h1>
                  <motion.p variants={fadeUp}>{slide.text}</motion.p>
                  <motion.div className="hero__actions" variants={fadeUp}>
                    <Link to={item ? `/menu/${item.slug}` : '/menu'} className="btn btn-rose">Order now</Link>
                    <Link to="/menu" className="btn btn-outline-light">View menu</Link>
                  </motion.div>
                </div>

                <motion.div
                  className="hero__visual"
                  variants={{
                    hide: { opacity: 0, scale: 0.85, rotate: -6 },
                    show: { opacity: 1, scale: 1, rotate: 0, transition: { type: 'spring', stiffness: 90, damping: 16 } },
                  }}
                >
                  <motion.div className="hero__tilt" style={{ rotateX, rotateY }}>
                    <div className={`hero__photo ${item && !item.available ? 'is-soldout' : ''}`}>
                      <SmartImage src={item?.image} alt={item?.name || ''} emoji="🎂" eager={i === 0} />
                    </div>
                    {item && (
                      <div className="hero__tag">
                        <span>{item.name}</span>
                        <strong>{item.available ? formatPrice(item.price, item.priceFrom) : 'Sold out'}</strong>
                      </div>
                    )}
                  </motion.div>
                </motion.div>
              </motion.div>
            )
          })}
        </motion.div>

        <div className="hero__controls">
          <div className="hero__dots">
            {SLIDES.map((slide, i) => (
              <button
                key={slide.slug}
                className={`hero__dot ${i === index ? 'is-active' : ''}`}
                onClick={() => setIndex(i)}
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === index}
              />
            ))}
          </div>
          <button className="hero__next" onClick={next} aria-label="Next slide">
            <FiArrowRight />
          </button>
        </div>
      </div>
    </section>
  )
}
