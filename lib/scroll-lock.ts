/**
 * Centralized scroll lock utility.
 * Integrates with Lenis smooth scroll to prevent wheel events from getting
 * stuck after modals/overlays are closed.
 *
 * Usage:
 *   lockScroll()   — call when modal/overlay opens
 *   unlockScroll() — call when modal/overlay closes (always in useEffect cleanup)
 */

interface LenisLike {
  stop(): void
  start(): void
}

let lenisInstance: LenisLike | null = null
let lockCount = 0

export function registerLenis(lenis: LenisLike) {
  lenisInstance = lenis
}

export function unregisterLenis() {
  lenisInstance = null
}

export function lockScroll() {
  lockCount++
  if (lockCount === 1) {
    lenisInstance?.stop()
    if (typeof document !== "undefined") {
      document.body.style.overflow = "hidden"
    }
  }
}

export function unlockScroll() {
  lockCount = Math.max(0, lockCount - 1)
  if (lockCount === 0) {
    if (typeof document !== "undefined") {
      document.body.style.overflow = ""
    }
    lenisInstance?.start()
  }
}
