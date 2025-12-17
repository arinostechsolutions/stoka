'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import styles from './ImageCarousel.module.css'

interface CarouselImage {
  src: string
  alt: string
  title?: string
  description?: string
}

interface ImageCarouselProps {
  images: CarouselImage[]
  autoPlay?: boolean
  interval?: number
  showDots?: boolean
  showArrows?: boolean
}

export default function ImageCarousel({
  images,
  autoPlay = true,
  interval = 5000,
  showDots = true,
  showArrows = true,
}: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    if (!autoPlay || isPaused || images.length <= 1) return

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length)
    }, interval)

    return () => clearInterval(timer)
  }, [autoPlay, interval, isPaused, images.length])

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
  }

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length)
  }

  if (!images || images.length === 0) {
    return null
  }

  return (
    <div
      className={styles['image-carousel']}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className={styles['carousel-container']}>
        {images.map((image, index) => (
          <div
            key={index}
            className={`${styles['carousel-slide']} ${index === currentIndex ? styles.active : ''}`}
            style={{
              transform: `translateX(-${currentIndex * 100}%)`,
            }}
          >
            <div className={styles['slide-image']}>
              <Image
                src={image.src}
                alt={image.alt}
                fill
                className={styles.image}
                priority={index === 0}
                sizes="100vw"
              />
              {(image.title || image.description) && (
                <div className={styles['slide-overlay']}>
                  <div className={styles['slide-content']}>
                    {image.title && <h3 className={styles['slide-title']}>{image.title}</h3>}
                    {image.description && (
                      <p className={styles['slide-description']}>{image.description}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {showArrows && images.length > 1 && (
        <>
          <button
            className={`${styles['carousel-arrow']} ${styles['carousel-arrow-left']}`}
            onClick={goToPrevious}
            aria-label="Imagem anterior"
          >
            <span>‹</span>
          </button>
          <button
            className={`${styles['carousel-arrow']} ${styles['carousel-arrow-right']}`}
            onClick={goToNext}
            aria-label="Próxima imagem"
          >
            <span>›</span>
          </button>
        </>
      )}

      {showDots && images.length > 1 && (
        <div className={styles['carousel-dots']}>
          {images.map((_, index) => (
            <button
              key={index}
              className={`${styles['carousel-dot']} ${index === currentIndex ? styles.active : ''}`}
              onClick={() => goToSlide(index)}
              aria-label={`Ir para slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

