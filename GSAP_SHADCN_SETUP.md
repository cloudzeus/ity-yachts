# GSAP & shadcn/ui Complete Setup

## ✓ Installed GSAP Plugins

All major GSAP plugins are registered and ready to use via `lib/gsap-complete.ts`:

- **ScrollTrigger** - Scroll-based animations
- **Draggable** - Make elements draggable
- **MotionPathPlugin** - Animate along SVG paths
- **Flip** - Layout shift animations
- **TextPlugin** - Text animations
- **@gsap/react** - React integration utilities

## ✓ Installed shadcn/ui Components (24 total)

1. accordion
2. alert
3. avatar
4. badge
5. breadcrumb
6. button
7. card
8. checkbox
9. dialog
10. dropdown-menu
11. input
12. label
13. pagination
14. popover
15. progress
16. scroll-area
17. select
18. separator
19. sheet
20. slider
21. switch
22. tabs
23. textarea
24. tooltip

## Quick Usage Examples

### GSAP Animations
```tsx
import { useGSAPAnimation, fadeIn, slideInLeft } from "@/lib/gsap-complete"

export function MyComponent() {
  const ref = useRef(null)
  
  useGSAPAnimation(() => {
    fadeIn(ref.current)
    slideInLeft(ref.current, 100, 0.6)
  })
  
  return <div ref={ref}>Animated content</div>
}
```

### Scroll Animations
```tsx
import { useScrollTrigger, onScroll } from "@/lib/gsap-complete"

export function ScrollSection() {
  const triggerRef = useRef(null)
  
  useScrollTrigger(() => {
    onScroll(triggerRef.current, triggerRef.current, {
      opacity: 1,
      y: 0,
      duration: 1,
    })
  })
  
  return <div ref={triggerRef}>Scroll to animate</div>
}
```

### shadcn Components
```tsx
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

export function Example() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Form Example</CardTitle>
      </CardHeader>
      <CardContent>
        <Input placeholder="Enter text..." />
        <Button>Submit</Button>
      </CardContent>
    </Card>
  )
}
```

## Available GSAP Functions

### Basic
- `fadeIn()` - Fade in element
- `fadeOut()` - Fade out element
- `slideInLeft()`, `slideInRight()`, `slideInUp()`, `slideInDown()` - Slide animations
- `scaleUp()`, `scaleDown()` - Scale animations
- `rotate()` - Rotation animation
- `pulse()` - Pulsing effect
- `bounce()` - Bounce animation

### Advanced
- `staggerAnimation()` - Stagger multiple elements
- `createTimeline()` - Create animation timelines
- `animateText()` - Animate text changes
- `countUp()` - Number counter
- `drawSVG()` - SVG drawing animation
- `animateFlip()` - Layout flip animations
- `followPath()` - Motion path animation

### Scroll
- `parallax()` - Parallax effect
- `onScroll()` - Scroll-triggered animation
- `pinElement()` - Pin element while scrolling

### Interactive
- `makeDraggable()` - Make elements draggable
- `onHover()` - Hover animations
- `onClick()` - Click animations

### Control
- `killAnimation()` - Stop animation
- `toggleAnimation()` - Play/pause
- `reverseAnimation()` - Reverse animation

## Hooks Available

- `useGSAPAnimation()` - Main animation hook
- `useScrollTrigger()` - Scroll trigger hook

## File Locations

- GSAP utilities: `lib/gsap-complete.ts`
- GSAP context hook example: `lib/gsap-utils.ts`
- Bunny CDN: `lib/bunny-cdn.ts`
- shadcn components: `components/ui/`

## Tooltip Setup Required

If you use the Tooltip component, wrap your app in TooltipProvider:

```tsx
import { TooltipProvider } from "@/components/ui/tooltip"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  )
}
```

## Add More Components

To add more shadcn components later:
```bash
npx shadcn add <component-name>
```

Available components can be browsed at: https://ui.shadcn.com
