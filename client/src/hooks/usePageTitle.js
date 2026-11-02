import { useEffect } from 'react'
import { SITE } from '../config/site'

// Sets the text shown in the browser tab, e.g. "Menu | Whisk & Co.".
export default function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} | ${SITE.name}` : `${SITE.name} | Home Bakery`
  }, [title])
}
