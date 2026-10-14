'use client'

import * as React from 'react'
import Image from 'next/image'
import { Maximize, X, ChevronLeft, ChevronRight, Grid } from 'lucide-react'

interface PropertyGalleryProps {
  heroImage: string
  galleryImages: string[]
  title: string
}

export function PropertyGallery({ heroImage, galleryImages, title }: PropertyGalleryProps) {
  const allImages = React.useMemo(() => {
    return Array.from(new Set([heroImage, ...galleryImages]))
  }, [heroImage, galleryImages])

  const [activeModalIndex, setActiveModalIndex] = React.useState<number | null>(null)

  const openLightbox = (index: number) => {
    setActiveModalIndex(index)
  }

  const closeLightbox = () => {
    setActiveModalIndex(null)
  }

  const nextImage = () => {
    if (activeModalIndex !== null) {
      setActiveModalIndex((activeModalIndex + 1) % allImages.length)
    }
  }

  const prevImage = () => {
    if (activeModalIndex !== null) {
      setActiveModalIndex((activeModalIndex - 1 + allImages.length) % allImages.length)
    }
  }

  return (
    <>
      {/* Editorial Grid Gallery Composition */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 rounded-none overflow-hidden relative">
        {/* Main Hero Featured Image */}
        <div
          className="md:col-span-8 relative aspect-[16/10] md:aspect-auto md:h-[540px] cursor-pointer group overflow-hidden border border-white/15"
          onClick={() => openLightbox(0)}
        >
          <Image
            src={allImages[0]}
            alt={`${title} - Primary view`}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 66vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
          <button
            type="button"
            className="absolute bottom-4 left-4 px-4 py-2 bg-black/90 backdrop-blur-md text-xs uppercase tracking-[0.2em] font-bold text-white border border-white/40 hover:bg-gold-300 hover:text-black transition-all flex items-center gap-2 cursor-pointer shadow-lg"
          >
            <Maximize className="w-3.5 h-3.5 text-gold-300 group-hover:text-black" />
            <span>Full Resolution Gallery</span>
          </button>
        </div>

        {/* Side Stack Gallery Grid */}
        <div className="md:col-span-4 grid grid-cols-2 md:grid-cols-1 gap-3 sm:gap-4 md:h-[540px]">
          {allImages.slice(1, 3).map((img, idx) => (
            <div
              key={img + idx}
              className="relative aspect-[16/10] md:aspect-none md:h-[262px] cursor-pointer group overflow-hidden border border-white/15"
              onClick={() => openLightbox(idx + 1)}
            >
              <Image
                src={img}
                alt={`${title} - View ${idx + 2}`}
                fill
                sizes="(max-width: 768px) 50vw, 33vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />

              {/* View All Overlay Button on last thumbnail */}
              {idx === 1 && allImages.length > 3 && (
                <div className="absolute inset-0 bg-black/75 backdrop-blur-xs flex flex-col items-center justify-center text-white space-y-1">
                  <Grid className="w-6 h-6 text-gold-300 mb-1" />
                  <span className="text-xs uppercase tracking-[0.2em] font-bold">
                    +{allImages.length - 3} Photos
                  </span>
                  <span className="text-[10px] text-gold-300 font-semibold uppercase tracking-wider">View All</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Fullscreen Modal Lightbox */}
      {activeModalIndex !== null && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col justify-between p-4 sm:p-8">
          {/* Top Bar */}
          <div className="flex items-center justify-between text-white border-b border-white/15 pb-4">
            <div className="space-y-0.5">
              <span className="text-xs uppercase tracking-[0.2em] font-mono text-gold-300 font-bold">
                {activeModalIndex + 1} / {allImages.length}
              </span>
              <h4 className="text-sm font-serif font-normal text-white">{title}</h4>
            </div>

            <button
              type="button"
              onClick={closeLightbox}
              className="p-2.5 bg-white/10 hover:bg-white hover:text-black border border-white/30 text-white rounded-full transition-colors cursor-pointer"
              title="Close gallery"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Main Large Image Display */}
          <div className="relative flex-1 my-4 flex items-center justify-center overflow-hidden">
            <button
              type="button"
              onClick={prevImage}
              className="absolute left-2 sm:left-6 z-10 p-3 bg-black/80 hover:bg-gold-300 hover:text-black text-white border border-white/30 rounded-full backdrop-blur-md transition-all cursor-pointer shadow-xl"
              title="Previous photo"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <div className="relative w-full h-full max-w-6xl max-h-[80vh] mx-auto">
              <Image
                src={allImages[activeModalIndex]}
                alt={`${title} - Photo ${activeModalIndex + 1}`}
                fill
                className="object-contain"
              />
            </div>

            <button
              type="button"
              onClick={nextImage}
              className="absolute right-2 sm:right-6 z-10 p-3 bg-black/80 hover:bg-gold-300 hover:text-black text-white border border-white/30 rounded-full backdrop-blur-md transition-all cursor-pointer shadow-xl"
              title="Next photo"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          {/* Bottom Thumbnails Navigation */}
          <div className="flex items-center justify-center space-x-2 overflow-x-auto py-2">
            {allImages.map((img, idx) => (
              <button
                key={img + idx}
                type="button"
                onClick={() => setActiveModalIndex(idx)}
                className={`relative w-16 h-12 shrink-0 border transition-all cursor-pointer ${
                  activeModalIndex === idx
                    ? 'border-gold-300 border-2 opacity-100 scale-105 shadow-md'
                    : 'border-white/20 opacity-50 hover:opacity-100'
                }`}
              >
                <Image src={img} alt={`Thumb ${idx}`} fill className="object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
