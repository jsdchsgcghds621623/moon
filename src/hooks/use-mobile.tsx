import * as React from "react"

const MOBILE_BREAKPOINT = 768

function detectTouchDevice() {
  // Primary touch input (phones, tablets)
  if (window.matchMedia("(pointer: coarse)").matches) return true
  if (window.matchMedia("(hover: none)").matches) return true
  // Touch-only hybrid (no fine pointer as primary)
  if (
    window.matchMedia("(any-pointer: coarse)").matches &&
    !window.matchMedia("(pointer: fine)").matches
  ) {
    return true
  }
  return false
}

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}

/** True on phones, tablets, and touch laptops — used for tap-vs-scroll gestures. */
export function useIsTouchDevice() {
  const [isTouch, setIsTouch] = React.useState(false)

  React.useEffect(() => {
    const update = () => setIsTouch(detectTouchDevice())
    update()

    const coarse = window.matchMedia("(pointer: coarse)")
    const noHover = window.matchMedia("(hover: none)")
    coarse.addEventListener("change", update)
    noHover.addEventListener("change", update)
    return () => {
      coarse.removeEventListener("change", update)
      noHover.removeEventListener("change", update)
    }
  }, [])

  return isTouch
}
