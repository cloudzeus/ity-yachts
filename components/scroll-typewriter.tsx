"use client"

import { useEffect, useRef } from "react"
import { useTranslations } from "@/lib/use-translations"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

type Props = {
  children: React.ReactNode
  /** Element to render. Defaults to a span so it inherits the parent's type. */
  as?: React.ElementType
  className?: string
  style?: React.CSSProperties
  /** Seconds between characters. */
  speed?: number
  /** Seconds to wait after the element enters view. */
  delay?: number
  /** Show a blinking caret while typing. */
  caret?: boolean
}

/**
 * Types its text out as it scrolls into view.
 *
 * The text is never removed from the DOM — every character stays in place and
 * only its visibility is animated. That keeps the copy readable by screen
 * readers and crawlers, and means a failed animation leaves readable text
 * rather than an empty heading.
 */
export function ScrollTypewriter({
  children,
  as: Tag = "span",
  className,
  style,
  speed = 0.028,
  delay = 0,
  caret = false,
}: Props) {
  const ref = useRef<HTMLElement>(null)
  /* Splitting replaces the text node React rendered with a tree of character
     spans, so React can no longer reach it: switching language left the old
     language typed on screen. Keying the wrapper by locale makes React discard
     the split subtree and render the new text, and the effect then re-splits
     it. */
  const { locale, ready } = useTranslations()

  useEffect(() => {
    const el = ref.current
    if (!el) return
    /* Wait for the dictionary. Splitting earlier captures the English fallback,
       and because the locale itself never changes afterwards the key never
       changes either — so the heading stayed in the fallback language for good
       while everything around it was translated. */
    if (!ready) return

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)")
    if (reduced.matches) return

    const text = el.textContent ?? ""
    if (!text.trim()) return

    // Snapshot so the original markup can be restored on cleanup.
    const original = el.innerHTML
    el.setAttribute("aria-label", text)

    const words: HTMLElement[] = []

    // Walk the tree and split only text nodes. Element children keep their own
    // styling, so a heading like "Elevate Your <b>Voyage</b>" still types out
    // with the accent word intact instead of being flattened to plain text.
    const split = (node: Node) => {
      for (const child of Array.from(node.childNodes)) {
        if (child.nodeType === Node.TEXT_NODE) {
          const value = child.textContent ?? ""
          if (!value) continue
          const frag = document.createDocumentFragment()
          for (const word of value.split(/(\s+)/)) {
            if (!word) continue
            if (/^\s+$/.test(word)) {
              frag.appendChild(document.createTextNode(word))
              continue
            }
            // One inline-block per word: lines still wrap normally, and the
            // word is the unit that appears.
            const wordEl = document.createElement("span")
            wordEl.style.display = "inline-block"
            wordEl.style.whiteSpace = "pre"
            wordEl.style.opacity = "0"
            wordEl.textContent = word
            words.push(wordEl)
            frag.appendChild(wordEl)
          }
          node.replaceChild(frag, child)
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          split(child)
        }
      }
    }
    split(el)
    if (!words.length) return

    let caretEl: HTMLElement | null = null
    if (caret) {
      caretEl = document.createElement("span")
      caretEl.textContent = "|"
      caretEl.style.cssText =
        "display:inline-block;margin-left:2px;opacity:0;color:var(--iyc-sun-500);font-weight:400"
      el.appendChild(caretEl)
    }

    const tween = gsap.fromTo(
      words,
      { opacity: 0, y: "0.18em" },
      {
      opacity: 1,
      y: 0,
      // A word needs a moment to land; a letter did not.
      duration: 0.34,
      ease: "power2.out",
      stagger: Math.max(speed * 2.6, 0.055),
      delay,
      scrollTrigger: { trigger: el, start: "top 88%", once: true },
      onStart: () => {
        if (caretEl) {
          gsap.set(caretEl, { opacity: 1 })
          gsap.to(caretEl, { opacity: 0, duration: 0.5, repeat: -1, yoyo: true })
        }
      },
      onComplete: () => {
        if (caretEl) gsap.to(caretEl, { opacity: 0, duration: 0.3, overwrite: true })
      },
      }
    )

    return () => {
      tween.scrollTrigger?.kill()
      tween.kill()
      // Put the original markup back so React's DOM stays predictable.
      el.innerHTML = original
      el.removeAttribute("aria-label")
    }
  }, [children, speed, delay, caret, locale, ready])

  return (
    <Tag key={`${locale}-${ready}`} ref={ref} className={className} style={style}>
      {children}
    </Tag>
  )
}
