import * as Scrollytelling from '@bsmnt/scrollytelling'
import Image from 'next/image'
import * as React from 'react'

import { HTMLLayout } from '~/components/layout/html-layout'
import { Portal } from '~/components/primitives/portal'
import { useMedia } from '~/hooks/use-media'
import { gsap } from '~/lib/gsap'
import bg from '~/public/images/underground.jpeg'

const IMAGES = [
  '/images/slider-placeholders/one.png',
  '/images/slider-placeholders/two.png',
  '/images/slider-placeholders/three.png',
  '/images/slider-placeholders/four.png',
  '/images/slider-placeholders/five.jpg',
  '/images/slider-placeholders/six.jpg',
  '/images/slider-placeholders/seven.jpg'
]

const [BIGGEST_SIZE, SMALLEST_SIZE, MAX_OPACITY, MIN_OPACITY, TOTAL] = [
  726, 280, 1, 0.4, 6
]
const MAX_PX_SIZES = [730, 300]

type MobileSliderProps = {
  images: string[]
}

const getTweenTimes = (
  totalStart: number,
  totalEnd: number,
  partialStart: number,
  partialEnd: number
) => {
  const start = (totalEnd - totalStart) * (partialStart / 100) + totalStart
  const end = Math.min(
    (totalEnd - totalStart) * (partialEnd / 100) + totalStart,
    100
  )
  return { start, end }
}

const MobileSlider = ({ images }: MobileSliderProps) => {
  return (
    <Scrollytelling.Root scrub={0.2}>
      <div style={{ height: 500 * images.length, width: '100%' }}>
        <Scrollytelling.Pin
          childClassName="flex items-center"
          childHeight="100vh"
          pinSpacerHeight="100%"
        >
          {images.map((src, idx) => {
            const fraction = 100 / images.length
            const start = fraction * idx
            const end = Math.min(fraction + fraction * idx, 100)

            const tween = []
            if (idx) {
              tween.push({
                to: {
                  scale: 1,
                  y: 0
                },
                // The negative start overlaps the current animation with the previous card fadeout
                ...getTweenTimes(start, end, -50, 20)
              })
            }
            if (idx !== images.length - 1) {
              tween.push({
                to: {
                  autoAlpha: 0,
                  y: -400
                },
                ...getTweenTimes(start, end, 35, 100)
              })
            }

            return (
              <Scrollytelling.Animation tween={tween} key={idx}>
                <figure
                  key={`figure-${idx}`}
                  className="w-full h-screen border border-[#FFFFFF66] overflow-hidden rounded-2xl max-h-[500px]"
                  style={{
                    zIndex: 10 - idx,
                    transformOrigin: 'bottom',
                    transform: `scale(calc(1 - 0.05 * ${idx})) translateY(calc(25px * ${idx}))`,
                    position: idx ? 'absolute' : 'relative'
                  }}
                >
                  <Image
                    src={src}
                    alt={`card-${idx}`}
                    fill
                    sizes="90vw"
                    style={{ objectFit: 'cover' }}
                  />
                </figure>
              </Scrollytelling.Animation>
            )
          })}
        </Scrollytelling.Pin>
      </div>
    </Scrollytelling.Root>
  )
}

type HorizontalSlideProps = {
  index: number
  nextImg?: string
  currentImg?: string
  animationCallback: VoidFunction
  handleClick?: React.MouseEventHandler
  containerWidth?: number
}

const HorizontalSlide = ({
  index,
  nextImg,
  currentImg,
  animationCallback,
  handleClick,
  containerWidth
}: HorizontalSlideProps) => {
  // Figure height & width calculation (if not specified, sizes are in pixels)
  const sizes =
    BIGGEST_SIZE - ((BIGGEST_SIZE - SMALLEST_SIZE) * index) / (TOTAL - 1)
  const vwSizes = (sizes / 1920) * 100 + 'vw'
  const maxSizes =
    MAX_PX_SIZES[0] -
    ((MAX_PX_SIZES[0] - MAX_PX_SIZES[1]) * index) / (TOTAL - 1)

  // Image opacity calculation (when more transparent the img, darker the figure)
  const opacity =
    MAX_OPACITY - ((MAX_OPACITY - MIN_OPACITY) * index) / (TOTAL - 1)

  const [hasRendered, setHasRendered] = React.useState(false)
  const figureRef = React.useRef<HTMLElement>(null)
  const [currentPosition, setCurrentPos] = React.useState(1)

  const positions: React.CSSProperties = React.useMemo(() => {
    if (index === 0) {
      return {
        left: 0
      }
    } else if (index === TOTAL - 1) {
      return {
        right: 0
      }
    } else {
      const largest = ((BIGGEST_SIZE / 1920) * 100) / 2
      const smallest = ((SMALLEST_SIZE / 1920) * 100) / 2
      const limits = `calc(${containerWidth}px - ${largest + smallest + 'vw'})`
      return {
        left: `calc(${index} * (${limits} / ${
          TOTAL - 1
        }) - ${vwSizes} / 2 + ${largest}vw)`
      }
    }
  }, [containerWidth, index, vwSizes])

  React.useEffect(() => {
    if (!figureRef.current || !hasRendered) return

    const selectors = ['img.prev-slide', 'img.current-slide', 'img.next-slide']
    const hiddenSlide = figureRef.current.querySelector(
      selectors.at(currentPosition - 1) as string
    )
    const incomingSlide = figureRef.current.querySelector(
      selectors.at(currentPosition + 1) ?? selectors[0]
    )
    if (hiddenSlide && 'src' in hiddenSlide) {
      hiddenSlide.src = nextImg
    }

    const tl = gsap.timeline({
      onComplete: () => {
        setCurrentPos((currentPosition) =>
          currentPosition === 2 ? 0 : currentPosition + 1
        )
        animationCallback()
      }
    })
    tl.to(
      figureRef.current.querySelector(selectors.at(currentPosition) as string),
      {
        x: '-100% '
      }
    )
      .to(incomingSlide, { x: 0 }, '<')
      .to(incomingSlide, { scaleX: 1 }, '<0.2')
      .set(hiddenSlide, { x: '100%', scaleX: 2 })

    return () => {
      tl.kill()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nextImg, currentImg, setCurrentPos])

  React.useEffect(() => {
    if (!figureRef.current) return
    const tl = gsap.timeline()

    const currentElem = figureRef.current.querySelector('img.current-slide')
    if (currentElem && 'src' in currentElem) {
      currentElem.src = currentImg
    }
    const nextElem = figureRef.current.querySelector('img.next-slide')
    if (nextElem && 'src' in nextElem) {
      nextElem.src = nextImg
    }

    tl.set(currentElem, { x: 0 })
      .set(figureRef.current.querySelector('img.prev-slide'), { x: '-100%' })
      .set(nextElem, { x: '100%', scaleX: 2 })

    setHasRendered(true)

    return () => {
      tl.kill()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setHasRendered])

  return (
    <figure
      ref={figureRef}
      style={{
        ...positions,
        width: vwSizes,
        height: vwSizes,
        maxWidth: maxSizes,
        maxHeight: maxSizes,
        zIndex: 10 - index,
        transformStyle: 'preserve-3d',
        position: 'absolute',
        top: '50%',
        transform: 'translateY(-50%)',
        overflow: 'hidden',
        cursor: 'pointer',
        background: 'black',
        borderRadius: 16,
        border: '1px solid #7C7C7C'
      }}
      onClick={handleClick}
    >
      <img
        className="prev-slide"
        src=""
        alt="prevImage"
        sizes="33vw"
        style={{
          opacity,
          objectFit: 'cover',
          width: '100%',
          height: '100%',
          position: 'absolute',
          left: 0,
          top: 0,
          transformOrigin: 'left'
        }}
      />
      <img
        src=""
        alt="currentImage"
        className="current-slide"
        sizes="33vw"
        style={{
          opacity,
          objectFit: 'cover',
          width: '100%',
          height: '100%',
          position: 'relative',
          transformOrigin: 'left'
        }}
      />
      <img
        src=""
        alt="nextImage"
        className="next-slide"
        sizes="33vw"
        style={{
          opacity,
          objectFit: 'cover',
          width: '100%',
          height: '100%',
          position: 'absolute',
          left: 0,
          top: 0,
          transformOrigin: 'left'
        }}
      />
    </figure>
  )
}

const StaggeredSlider = () => {
  const [nextImageIndex, setNextImgIndex] = React.useState(1)
  const [animationInProgress, setAnimationInProgress] = React.useState(true)
  const maxIndex = React.useMemo(() => IMAGES.length, [])
  const isMobile = useMedia('(max-width: 1023px)')

  const sectionRef = React.useRef<HTMLElement>(null)
  const [sectionWidth, setSectionWidth] = React.useState<number>()

  const handleSwap = React.useCallback(
    (offset = 1) => {
      if (!animationInProgress) return

      setNextImgIndex((counter) => (counter + offset) % maxIndex)
      setAnimationInProgress(false)
    },
    [maxIndex, setNextImgIndex, setAnimationInProgress, animationInProgress]
  )

  React.useEffect(() => {
    if (isMobile) return

    const interval = setInterval(handleSwap, 5000)
    const handleResize = () => {
      setSectionWidth(sectionRef.current?.offsetWidth)
    }

    window.addEventListener('resize', handleResize)
    handleResize()

    return () => {
      window.removeEventListener('resize', handleResize)
      clearInterval(interval)
    }
  }, [nextImageIndex, handleSwap, isMobile])

  React.useEffect(() => {
    if (!sectionRef.current || isMobile) return

    gsap.to(sectionRef.current, {
      autoAlpha: 1,
      delay: 0.4
    })
  }, [isMobile])

  return (
    <main
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: isMobile ? 24 : 64,
        position: 'relative',
        background: 'black'
      }}
    >
      <Image
        src={bg}
        alt="Background"
        style={{
          opacity: 0.6,
          filter: 'blur(6px)',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100vw',
          minHeight: '100vh',
          objectFit: 'cover',
          height: '100%'
        }}
      />
      <section
        ref={sectionRef}
        style={{
          position: 'relative',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          height: isMobile ? 'auto' : 750,
          opacity: isMobile ? 1 : 0
        }}
      >
        {isMobile ? (
          <MobileSlider images={IMAGES} />
        ) : (
          Array(TOTAL)
            .fill('')
            .map((_, idx) => {
              const current = (nextImageIndex - 1 + idx) % maxIndex
              const next = (nextImageIndex + idx) % maxIndex

              return (
                <React.Fragment key={idx}>
                  <HorizontalSlide
                    containerWidth={sectionWidth}
                    key={idx}
                    index={idx}
                    currentImg={IMAGES.at(current)}
                    nextImg={IMAGES.at(next)}
                    animationCallback={() => setAnimationInProgress(true)}
                    handleClick={() => handleSwap(idx || 1)}
                  />
                  {idx === 0 && (
                    <Portal id="next-image">
                      <div className="grid rounded backdrop-blur absolute w-[120px] bottom-[10px] right-[10px] py-5 px-2 z-50 gap-2 bg-brand-200 border border-brand">
                        <img
                          src={IMAGES.at(next) as string}
                          style={{
                            width: '100%',
                            maxHeight: 64,
                            objectFit: 'cover'
                          }}
                        />
                        <span style={{ lineHeight: 1 }}>Next image</span>
                      </div>
                    </Portal>
                  )}
                </React.Fragment>
              )
            })
        )}
      </section>
    </main>
  )
}

StaggeredSlider.Title = 'Staggered Slider'
StaggeredSlider.Description = (
  <p>
    Carousel inspired by{' '}
    <a
      target="_blank"
      rel="noopener"
      href="https://dribbble.com/shots/14708656-Instagram-Social-Widget"
    >
      Francesco Zagami's Widget
    </a>
  </p>
)
StaggeredSlider.Tags = 'animation, public'
StaggeredSlider.Layout = HTMLLayout

export default StaggeredSlider
