"use client"

import { useState, useEffect, useCallback } from "react"
import { ChevronLeft, ChevronRight, X } from "lucide-react"

interface LightboxImage {
  url: string
  isMain?: boolean
  sortOrder?: number
}

interface ImageLightboxProps {
  images: LightboxImage[]
  initialIndex: number
  onClose: () => void
}

export function ImageLightbox({ images, initialIndex, onClose }: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const currentImage = images[currentIndex]

  const goTo = useCallback(
    (index: number) => {
      if (isTransitioning) return
      setIsTransitioning(true)
      setTimeout(() => {
        setCurrentIndex(index)
        setIsTransitioning(false)
      }, 150)
    },
    [isTransitioning],
  )

  const goPrev = useCallback(() => {
    const prev = currentIndex === 0 ? images.length - 1 : currentIndex - 1
    goTo(prev)
  }, [currentIndex, images.length, goTo])

  const goNext = useCallback(() => {
    const next = currentIndex === images.length - 1 ? 0 : currentIndex + 1
    goTo(next)
  }, [currentIndex, images.length, goTo])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      else if (e.key === "ArrowLeft") goPrev()
      else if (e.key === "ArrowRight") goNext()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onClose, goPrev, goNext])

  // Prevent body scroll while lightbox is open
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0, 0, 0, 0.85)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 40,
          height: 40,
          borderRadius: "var(--radius-md)",
          border: "none",
          background: "var(--surface-container-lowest)",
          color: "var(--on-surface)",
          cursor: "pointer",
          opacity: 0.9,
          transition: "opacity 150ms ease",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.9")}
        aria-label="Close lightbox"
      >
        <X size={20} />
      </button>

      {/* Previous button */}
      {images.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            goPrev()
          }}
          style={{
            position: "absolute",
            left: 16,
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 48,
            height: 48,
            borderRadius: "var(--radius-md)",
            border: "none",
            background: "var(--surface-container-lowest)",
            color: "var(--on-surface)",
            cursor: "pointer",
            opacity: 0.8,
            transition: "opacity 150ms ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.8")}
          aria-label="Previous image"
        >
          <ChevronLeft size={24} />
        </button>
      )}

      {/* Image container */}
      <div
        style={{
          position: "relative",
          maxWidth: "85vw",
          maxHeight: "85vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Main badge */}
        {currentImage?.isMain && (
          <span
            style={{
              position: "absolute",
              top: 12,
              left: 12,
              zIndex: 10,
              padding: "4px 12px",
              borderRadius: "var(--radius-md)",
              background: "var(--primary)",
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: "0.02em",
              pointerEvents: "none",
            }}
          >
            Main
          </span>
        )}

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={currentImage?.url}
          alt={`Image ${currentIndex + 1} of ${images.length}`}
          style={{
            maxWidth: "85vw",
            maxHeight: "85vh",
            objectFit: "contain",
            borderRadius: "var(--radius-md)",
            opacity: isTransitioning ? 0 : 1,
            transition: "opacity 150ms ease",
            userSelect: "none",
          }}
          draggable={false}
        />
      </div>

      {/* Next button */}
      {images.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            goNext()
          }}
          style={{
            position: "absolute",
            right: 16,
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 48,
            height: 48,
            borderRadius: "var(--radius-md)",
            border: "none",
            background: "var(--surface-container-lowest)",
            color: "var(--on-surface)",
            cursor: "pointer",
            opacity: 0.8,
            transition: "opacity 150ms ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.8")}
          aria-label="Next image"
        >
          <ChevronRight size={24} />
        </button>
      )}

      {/* Image counter */}
      {images.length > 1 && (
        <div
          style={{
            position: "absolute",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 10,
            padding: "6px 16px",
            borderRadius: "var(--radius-md)",
            background: "var(--surface-container-lowest)",
            color: "var(--on-surface)",
            fontSize: 14,
            fontWeight: 500,
            letterSpacing: "0.02em",
            pointerEvents: "none",
            userSelect: "none",
          }}
        >
          {currentIndex + 1} / {images.length}
        </div>
      )}
    </div>
  )
}
