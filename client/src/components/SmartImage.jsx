import { useState } from 'react'

// Shows the photo. If the photo is missing, shows a pastel placeholder with an emoji instead.
// "pending" = the menu is still loading (e.g. while the free server wakes up): a soft shimmer
// is shown instead, so the emoji only ever means "this item really has no photo".
export default function SmartImage({ src, alt, emoji = '🧁', tone, className = '', eager = false, pending = false }) {
  // Remember WHICH photo failed, so a new photo (e.g. once the menu has loaded) gets its own chance
  const [failedSrc, setFailedSrc] = useState(null)

  if (pending && !src) {
    return <div className={`img-fallback img-fallback--pending ${className}`} role="img" aria-label="Loading photo" />
  }

  if (!src || failedSrc === src) {
    return (
      <div className={`img-fallback ${className}`} style={{ '--tone': tone }} role="img" aria-label={alt}>
        <span aria-hidden="true">{emoji}</span>
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading={eager ? 'eager' : 'lazy'}
      onError={() => setFailedSrc(src)}
    />
  )
}
