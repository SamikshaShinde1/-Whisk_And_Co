import { useEffect, useState } from 'react'
import { motion, useReducedMotion, useScroll } from 'motion/react'
import { twoDigits } from '../../numbers'
import './ChapterNav.css'

// The small chapter progress indicator on the Home page.
// Big screens: numbers 01, 02, 03… down the left side; the current chapter is filled in.
// Phones and tablets: a thin line under the navbar that grows as you scroll.
// "chapters" is a list of { id, label }; each id is the element that wraps that chapter.
export default function ChapterNav({ chapters }) {
  const [active, setActive] = useState(0)
  const calm = useReducedMotion()
  const { scrollYProgress } = useScroll()
  const ids = chapters.map((chapter) => chapter.id).join(' ')

  // Watch which chapter is in the middle of the screen
  useEffect(() => {
    const elements = ids.split(' ').map((id) => document.getElementById(id)).filter(Boolean)
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(elements.indexOf(entry.target))
        })
      },
      { rootMargin: '-45% 0px -50% 0px' },
    )
    elements.forEach((element) => observer.observe(element))
    return () => observer.disconnect()
  }, [ids])

  const goTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: calm ? 'auto' : 'smooth' })

  return (
    <>
      <motion.div className="chapter-bar" style={{ scaleX: scrollYProgress }} aria-hidden="true" />

      <nav className="chapter-nav" aria-label="Chapters">
        <span className="chapter-nav__track" aria-hidden="true">
          <motion.span className="chapter-nav__fill" style={{ scaleY: scrollYProgress }} />
        </span>
        <ol>
          {chapters.map((chapter, i) => (
            <li key={chapter.id}>
              <button
                type="button"
                className={`chapter-nav__dot ${i === active ? 'is-active' : i < active ? 'is-done' : ''}`}
                onClick={() => goTo(chapter.id)}
                aria-label={`${twoDigits(i + 1)}: ${chapter.label}`}
                aria-current={i === active ? 'step' : undefined}
              >
                {twoDigits(i + 1)}
              </button>
              <span className="chapter-nav__label" aria-hidden="true">{chapter.label}</span>
            </li>
          ))}
        </ol>
      </nav>
    </>
  )
}
