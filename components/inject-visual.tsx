'use client'

import Image from 'next/image'
import { useState } from 'react'

const INJECT_IMAGES: Record<string, string> = {
  inj1: '/images/inject2.png',
  inj2: '/images/inject1.jpg',
  inj3: '/images/inject4.png',
  inj4: '/images/inject3.png',
  inj5: '/images/inject5.png',
  inj6: '/images/inject6.png',
  inj7: '/images/inject7.jpg',
  inj8: '/images/inject8.jpg',
  inj9: '/images/inject9.jpg',
  inj10: '/images/inject10.jpg',
  inj11: '/images/inject11.jpg',
  inj12: '/images/inject12.jpg',
}

interface VisualImageProps {
  src: string
  alt: string
}

function VisualImage({ src, alt }: VisualImageProps) {
  const [loaded, setLoaded] = useState(false)

  return (
    <figure className="relative aspect-video w-full overflow-hidden bg-muted" aria-busy={!loaded}>
      {!loaded && (
        <div
          aria-hidden="true"
          className="absolute inset-0 animate-pulse bg-muted"
        />
      )}
      <Image
        src={src}
        alt={alt}
        width={1600}
        height={900}
        sizes="(max-width: 768px) 100vw, 1200px"
        fill
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
        className={`scale-[1.2] object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </figure>
  )
}

interface InjectVisualProps {
  injectId: string
  title: string
}

export function InjectVisual({ injectId, title }: InjectVisualProps) {
  const src = INJECT_IMAGES[injectId]
  if (!src) return null

  return <VisualImage key={src} src={src} alt={`Scenario visual for ${title}`} />
}

export function ExerciseOverviewVisual() {
  return (
    <VisualImage
      src="/images/inject0.png"
      alt="Finance employee reviewing a vendor invoice and spreadsheet"
    />
  )
}
