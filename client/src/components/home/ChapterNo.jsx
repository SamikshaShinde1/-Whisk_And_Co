import { twoDigits } from '../../numbers'

// The "01 ——" chapter number at the start of a Home section
export default function ChapterNo({ n }) {
  if (!n) return null
  return <span className="chapter-no">{twoDigits(n)}</span>
}
