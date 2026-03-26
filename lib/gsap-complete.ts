import gsap from "gsap"
import { useRef, useEffect } from "react"

// Register all available plugins
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { Draggable } from "gsap/Draggable"
import { MotionPathPlugin } from "gsap/MotionPathPlugin"
import { Flip } from "gsap/Flip"
import { TextPlugin } from "gsap/TextPlugin"

gsap.registerPlugin(ScrollTrigger, Draggable, MotionPathPlugin, Flip, TextPlugin)

// ============ HOOKS ============

/**
 * Main GSAP context hook for animations
 */
export function useGSAPAnimation(
  callback: (ctx: gsap.Context) => void,
  deps: React.DependencyList = [],
  scope?: React.RefObject<HTMLElement>
) {
  const ctx = useRef<gsap.Context | null>(null)

  useEffect(() => {
    ctx.current = gsap.context(callback, scope?.current)
    return () => ctx.current?.revert()
  }, deps)

  return ctx
}

/**
 * Hook for ScrollTrigger animations
 */
export function useScrollTrigger(
  callback: () => void,
  deps: React.DependencyList = []
) {
  useEffect(() => {
    callback()
    return () => ScrollTrigger.refresh()
  }, deps)
}

// ============ BASIC ANIMATIONS ============

export const fadeIn = (target: gsap.TweenTarget, duration = 0.6) =>
  gsap.to(target, { opacity: 1, duration, ease: "power2.out" })

export const fadeOut = (target: gsap.TweenTarget, duration = 0.6) =>
  gsap.to(target, { opacity: 0, duration, ease: "power2.in" })

export const slideInLeft = (target: gsap.TweenTarget, distance = 100, duration = 0.6) => {
  gsap.set(target, { x: -distance, opacity: 0 })
  return gsap.to(target, { x: 0, opacity: 1, duration, ease: "power2.out" })
}

export const slideInRight = (target: gsap.TweenTarget, distance = 100, duration = 0.6) => {
  gsap.set(target, { x: distance, opacity: 0 })
  return gsap.to(target, { x: 0, opacity: 1, duration, ease: "power2.out" })
}

export const slideInUp = (target: gsap.TweenTarget, distance = 100, duration = 0.6) => {
  gsap.set(target, { y: distance, opacity: 0 })
  return gsap.to(target, { y: 0, opacity: 1, duration, ease: "power2.out" })
}

export const slideInDown = (target: gsap.TweenTarget, distance = 100, duration = 0.6) => {
  gsap.set(target, { y: -distance, opacity: 0 })
  return gsap.to(target, { y: 0, opacity: 1, duration, ease: "power2.out" })
}

export const scaleUp = (target: gsap.TweenTarget, scale = 0.8, duration = 0.6) => {
  gsap.set(target, { scale, opacity: 0 })
  return gsap.to(target, { scale: 1, opacity: 1, duration, ease: "back.out(1.7)" })
}

export const scaleDown = (target: gsap.TweenTarget, scale = 1.2, duration = 0.6) =>
  gsap.to(target, { scale: 1, opacity: 1, duration, ease: "back.out(1.7)" })

export const rotate = (target: gsap.TweenTarget, rotation = 360, duration = 1) =>
  gsap.to(target, { rotation, duration, ease: "power2.inOut" })

export const pulse = (target: gsap.TweenTarget, scale = 1.1, duration = 0.5) =>
  gsap.to(target, { scale, duration, yoyo: true, repeat: -1, ease: "sine.inOut" })

export const bounce = (target: gsap.TweenTarget, distance = 50, duration = 0.6) =>
  gsap.to(target, { y: -distance, duration, ease: "power1.inOut", yoyo: true, repeat: 1 })

// ============ ADVANCED ANIMATIONS ============

/**
 * Stagger animation for multiple elements
 */
export const staggerAnimation = (
  targets: gsap.TweenTarget,
  props: gsap.TweenVars,
  staggerAmount = 0.1
) => gsap.to(targets, { ...props, stagger: staggerAmount })

/**
 * Sequential timeline animation
 */
export function createTimeline() {
  return gsap.timeline()
}

/**
 * Text animation
 */
export const animateText = (target: gsap.TweenTarget, text: string, duration = 1) =>
  gsap.to(target, { text, duration, ease: "none" })

/**
 * Number counter animation
 */
export const countUp = (target: { value: number }, endValue: number, duration = 1) =>
  gsap.to(target, { value: endValue, duration, ease: "power2.out", snap: { value: 1 } })

/**
 * SVG path animation
 */
export const drawSVG = (target: gsap.TweenTarget, duration = 1) => {
  gsap.set(target, { strokeDasharray: 1000, strokeDashoffset: 1000 })
  return gsap.to(target, { strokeDashoffset: 0, duration, ease: "power2.out" })
}

/**
 * Flip animation (best for layout changes)
 */
export async function animateFlip(
  targets: gsap.TweenTarget,
  callback: () => void,
  duration = 0.6
) {
  const state = Flip.getState(targets)
  callback()
  Flip.from(state, { duration, ease: "power1.inOut" })
}

/**
 * Motion path animation
 */
export const followPath = (
  target: gsap.TweenTarget,
  path: string,
  duration = 3,
  autoRotate = true
) =>
  gsap.to(target, {
    motionPath: { path, autoRotate },
    duration,
    ease: "power1.inOut",
  })

// ============ SCROLL ANIMATIONS ============

/**
 * Parallax effect
 */
export const parallax = (
  target: gsap.TweenTarget,
  trigger: HTMLElement,
  speed = 0.5
) => {
  gsap.to(target, {
    y: () => (1 - speed) * ScrollTrigger.getScrollFunc()(500),
    scrollTrigger: {
      trigger,
      scrub: true,
    },
  })
}

/**
 * On scroll trigger
 */
export const onScroll = (
  target: gsap.TweenTarget,
  trigger: HTMLElement,
  props: gsap.TweenVars
) => {
  gsap.to(target, {
    scrollTrigger: { trigger, start: "top center" },
    ...props,
  })
}

/**
 * Pin element on scroll
 */
export const pinElement = (
  target: HTMLElement,
  duration = 1,
  end?: string
) => {
  ScrollTrigger.create({
    trigger: target,
    pin: true,
    pinSpacing: true,
    start: "top center",
    end: end || "+=500",
  })
}

// ============ INTERACTIVE ANIMATIONS ============

/**
 * Make element draggable
 */
export const makeDraggable = (target: gsap.TweenTarget) => {
  return Draggable.create(target, {
    type: "x,y",
    edgeResistance: 0.65,
    bounds: window,
  })[0]
}

/**
 * Hover animation
 */
export const onHover = (
  target: HTMLElement,
  onEnter: () => void,
  onLeave?: () => void
) => {
  target.addEventListener("mouseenter", onEnter)
  if (onLeave) {
    target.addEventListener("mouseleave", onLeave)
  }
}

/**
 * Click animation
 */
export const onClick = (
  target: HTMLElement,
  animation: () => gsap.core.Tween | gsap.core.Timeline
) => {
  target.addEventListener("click", animation)
}

// ============ UTILITY FUNCTIONS ============

/**
 * Kill all animations on target
 */
export const killAnimation = (target: gsap.TweenTarget) => {
  gsap.killTweensOf(target)
}

/**
 * Play/pause control
 */
export const toggleAnimation = (tween: gsap.core.Tween | gsap.core.Timeline) => {
  tween.paused() ? tween.play() : tween.pause()
}

/**
 * Reverse animation
 */
export const reverseAnimation = (tween: gsap.core.Tween | gsap.core.Timeline) => {
  tween.reverse()
}

export default gsap
