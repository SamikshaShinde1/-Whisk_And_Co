import useProducts from './useProducts'

// The special offers running today (the server decides "today" using Indian time),
// plus the words the banner and the Home section use to announce them.
export default function useSpecials() {
  const { products } = useProducts()
  const specials = products.filter((item) => item.specialActive)
  const tags = [...new Set(specials.map((item) => item.specialTag))]

  // "Diwali Special" -> "Diwali Specials"; several different tags -> "Festive specials"
  let title = 'Festive specials'
  if (tags.length === 1) title = /special$/i.test(tags[0]) ? `${tags[0]}s` : tags[0]

  return { specials, title }
}
