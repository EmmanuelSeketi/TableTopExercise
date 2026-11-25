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
  'mimosa-tech-1': '/images/Technical-Injects/Technical-Inject1.jpg',
  'mimosa-tech-2': '/images/Technical-Injects/Technical-Inject2.jpg',
  'mimosa-tech-3': '/images/Technical-Injects/Technical-Inject3.jpg',
  'mimosa-tech-4': '/images/Technical-Injects/Technical-Inject4.jpg',
  'mimosa-tech-5': '/images/Technical-Injects/Technical-Inject5.jpg',
  'mimosa-management-1': '/images/Management-Injects/Management_Inject1.jpg',
  'mimosa-management-2': '/images/Management-Injects/Management_Inject2.jpg',
  'mimosa-management-3': '/images/Management-Injects/Management_Inject3.jpg',
  'mimosa-management-4': '/images/Management-Injects/Management_Inject4.jpg',
  'mimosa-management-5': '/images/Management-Injects/Management_Inject5.jpg',
}

interface VisualImageProps {
  src: string
  alt: string
  zoom?: boolean
  compact?: boolean
}

function VisualImage({ src, alt, zoom = true, compact = false }: VisualImageProps) {
  const [loaded, setLoaded] = useState(false)

  return (
    <figure className={`relative ${compact ? 'aspect-[2.2/1]' : 'aspect-video'} w-full overflow-hidden bg-muted`} aria-busy={!loaded}>
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
        unoptimized={src.startsWith('/api/exercises/')}
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
        className={`${zoom ? 'scale-[1.2] ' : ''}object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </figure>
  )
}

interface InjectVisualProps {
  injectId: string
  title: string
  imageUrl?: string
}

export function InjectVisual({ injectId, title, imageUrl }: InjectVisualProps) {
  const src = imageUrl ?? INJECT_IMAGES[injectId]
  if (!src) return null

  return <VisualImage key={src} src={src} alt={`Scenario visual for ${title}`} />
}

export function ExerciseOverviewVisual({
  src = '/images/inject0.png',
  alt = 'Illustrative tabletop exercise scenario',
  zoom = false,
  compact = false,
}: {
  src?: string
  alt?: string
  zoom?: boolean
  compact?: boolean
} = {}) {
  return <VisualImage src={src} alt={alt} zoom={zoom} compact={compact} />
}
