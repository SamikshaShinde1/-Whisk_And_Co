import { useState } from 'react'

// Shows the photo. If the photo is missing, shows a pastel placeholder with an emoji instead.
export default function SmartImage({ src, alt, emoji = '🧁', tone, className = '', eager = false }) {
  const [failed, setFailed] = useState(!src)

  if (failed) {
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
      onError={() => setFailed(true)}
    />
  )
}
