"use client"

/**
 * GSAP-backed replacement for the small slice of the framer-motion API that the
 * calendar used (`motion.*`, `motion.create`, `AnimatePresence`).
 *
 * The call sites stay declarative and unchanged; only the engine underneath is
 * GSAP, which is what the rest of the app already animates with.
 *
 * Deliberately not supported: `layout` / `layoutId` auto-layout animations.
 * GSAP has no equivalent, so both props are accepted and ignored — the one
 * place that used `layout` also animates `width` explicitly, which is the part
 * that actually moved.
 */

import gsap from "gsap"
import {
  Children,
  createContext,
  createElement,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentProps,
  type ComponentType,
  type ReactElement,
  type ReactNode,
} from "react"

/* ------------------------------------------------------------------ types */

type Vars = Record<string, unknown>

export type Variants = Record<string, Vars>

export type Transition = {
  type?: "spring" | "tween"
  stiffness?: number
  damping?: number
  duration?: number
  delay?: number
  ease?: string
  staggerChildren?: number
}

/** The props this shim owns; everything else passes through to the base element. */
export type MotionProps = {
  initial?: Vars | string | false
  animate?: Vars | string | false
  exit?: Vars | string
  variants?: Variants
  transition?: Transition
  whileHover?: Vars | string
  whileTap?: Vars | string
  /** Accepted for source compatibility, intentionally inert. */
  layout?: boolean
  /** Accepted for source compatibility, intentionally inert. */
  layoutId?: string
  children?: ReactNode
}

type AnyComponent =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ComponentType<any> | keyof React.JSX.IntrinsicElements

/* -------------------------------------------------------------- internals */

const DEFAULT_DURATION = 0.35
const DEFAULT_EASE = "power2.out"

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect

/**
 * Framer springs are described by stiffness/damping; GSAP wants duration/ease.
 * This maps the former onto a visually close tween rather than solving the
 * spring exactly — stiffer springs settle faster, heavier damping stretches out.
 */
function toTween(t?: Transition): Vars {
  if (!t) return { duration: DEFAULT_DURATION, ease: DEFAULT_EASE }

  if (t.type === "spring") {
    const stiffness = t.stiffness ?? 100
    const damping = t.damping ?? 10
    const duration = gsap.utils.clamp(
      0.2,
      1.2,
      ((2 * Math.PI) / Math.sqrt(stiffness)) * (damping / 20)
    )
    return { duration, ease: "power3.out", delay: t.delay ?? 0 }
  }

  return {
    duration: t.duration ?? DEFAULT_DURATION,
    ease: t.ease ?? DEFAULT_EASE,
    delay: t.delay ?? 0,
  }
}

function resolve(
  value: Vars | string | false | undefined,
  variants?: Variants
): Vars | null {
  if (!value) return null
  if (typeof value === "string") return variants?.[value] ?? null
  return value
}

/** Variants may carry their own nested `transition`; pull it out of the tween vars. */
function split(vars: Vars | null): { target: Vars; transition?: Transition } {
  if (!vars) return { target: {} }
  const { transition, ...target } = vars
  return { target, transition: transition as Transition | undefined }
}

const isEmpty = (o: Vars) => Object.keys(o).length === 0

/* ------------------------------------------------------------- presence */

type PresenceValue = {
  isPresent: boolean
  onExitComplete: () => void
}

const PresenceContext = createContext<PresenceValue | null>(null)

/* ------------------------------------------------------ motion component */

function createMotionComponent<T extends AnyComponent>(
  Base: T
): ComponentType<ComponentProps<T> & MotionProps> {
  function MotionComponent({
    initial,
    animate,
    exit,
    variants,
    transition,
    whileHover,
    whileTap,
    layout: _layout,
    layoutId: _layoutId,
    ...rest
  }: MotionProps & Record<string, unknown>) {
    const ref = useRef<HTMLElement | null>(null)
    const presence = useContext(PresenceContext)
    const isPresent = presence ? presence.isPresent : true

    const animateKey = JSON.stringify(animate ?? null)

    // Enter / animate.
    useIsomorphicLayoutEffect(() => {
      const el = ref.current
      if (!el) return

      const from = split(resolve(initial, variants))
      const to = split(resolve(animate, variants))

      if (initial !== false && !isEmpty(from.target)) {
        gsap.set(el, from.target)
      }
      if (isEmpty(to.target)) return

      const tween = gsap.to(el, {
        ...to.target,
        ...toTween(to.transition ?? transition),
      })
      return () => {
        tween.kill()
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [animateKey])

    // Exit, driven by AnimatePresence.
    useEffect(() => {
      if (isPresent) return

      const done = presence?.onExitComplete
      const el = ref.current
      const to = split(resolve(exit, variants))

      if (!el || isEmpty(to.target)) {
        done?.()
        return
      }

      const tween = gsap.to(el, {
        ...to.target,
        ...toTween(to.transition ?? transition),
        onComplete: done,
      })
      return () => {
        tween.kill()
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isPresent])

    // Hover / tap.
    useEffect(() => {
      const el = ref.current
      if (!el) return

      const hover = split(resolve(whileHover, variants)).target
      const tap = split(resolve(whileTap, variants)).target
      if (isEmpty(hover) && isEmpty(tap)) return

      const base = split(resolve(animate, variants)).target
      const tween = toTween(transition)

      // Resting values for every property hover/tap touches, so we can go back.
      const resting: Vars = {}
      for (const key of new Set([...Object.keys(hover), ...Object.keys(tap)])) {
        resting[key] =
          base[key] ??
          (key === "scale" || key === "scaleX" || key === "scaleY"
            ? 1
            : gsap.getProperty(el, key))
      }

      let hovering = false
      const to = (vars: Vars) => gsap.to(el, { ...vars, ...tween })

      const onEnter = () => {
        hovering = true
        if (!isEmpty(hover)) to(hover)
      }
      const onLeave = () => {
        hovering = false
        to(resting)
      }
      const onDown = () => {
        if (!isEmpty(tap)) to(tap)
      }
      const onUp = () => {
        to(hovering && !isEmpty(hover) ? hover : resting)
      }

      el.addEventListener("mouseenter", onEnter)
      el.addEventListener("mouseleave", onLeave)
      el.addEventListener("pointerdown", onDown)
      el.addEventListener("pointerup", onUp)

      return () => {
        el.removeEventListener("mouseenter", onEnter)
        el.removeEventListener("mouseleave", onLeave)
        el.removeEventListener("pointerdown", onDown)
        el.removeEventListener("pointerup", onUp)
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [whileHover, whileTap, animateKey])

    return createElement(Base as never, { ...rest, ref })
  }

  const baseName =
    typeof Base === "string" ? Base : Base.displayName ?? Base.name
  MotionComponent.displayName = `motion.${baseName ?? "component"}`

  return MotionComponent as ComponentType<ComponentProps<T> & MotionProps>
}

/* ------------------------------------------------------------ the proxy */

type MotionFactory = {
  create: typeof createMotionComponent
} & {
  [K in keyof React.JSX.IntrinsicElements]: ComponentType<
    React.JSX.IntrinsicElements[K] & MotionProps
  >
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cache = new Map<string, ComponentType<any>>()

export const motion = new Proxy({} as MotionFactory, {
  get(_target, prop: string) {
    if (prop === "create") return createMotionComponent
    let component = cache.get(prop)
    if (!component) {
      component = createMotionComponent(
        prop as keyof React.JSX.IntrinsicElements
      )
      cache.set(prop, component)
    }
    return component
  },
})

/* ------------------------------------------------------ AnimatePresence */

const keyOf = (child: ReactElement) => String(child.key)

function toArray(children: ReactNode): ReactElement[] {
  return Children.toArray(children).filter(isValidElement) as ReactElement[]
}

export function AnimatePresence({
  children,
  mode = "sync",
}: {
  children?: ReactNode
  mode?: "sync" | "wait"
  /** Accepted for source compatibility; children own their own `initial`. */
  initial?: boolean
}) {
  const present = toArray(children)
  const keySig = present.map(keyOf).join("|")

  const [exiting, setExiting] = useState<ReactElement[]>([])
  const [held, setHeld] = useState(false)
  const prevRef = useRef<ReactElement[]>(present)

  useEffect(() => {
    const presentKeys = new Set(present.map(keyOf))
    const removed = prevRef.current.filter((c) => !presentKeys.has(keyOf(c)))
    prevRef.current = present

    if (!removed.length) return
    setExiting((current) => [...current, ...removed])
    if (mode === "wait") setHeld(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keySig])

  useEffect(() => {
    if (exiting.length === 0) setHeld(false)
  }, [exiting.length])

  const handleExitComplete = useCallback((key: string) => {
    setExiting((current) => current.filter((c) => keyOf(c) !== key))
  }, [])

  return (
    <>
      {exiting.map((child) => (
        <PresenceContext.Provider
          key={keyOf(child)}
          value={{
            isPresent: false,
            onExitComplete: () => handleExitComplete(keyOf(child)),
          }}
        >
          {child}
        </PresenceContext.Provider>
      ))}
      {!held && children}
    </>
  )
}
