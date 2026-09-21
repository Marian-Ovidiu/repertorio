import { useSyncExternalStore } from 'react'

const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
const mobileQuery = window.matchMedia('(max-width: 639px)')
const subscribeMotion = (notify: () => void) => {
  motionQuery.addEventListener('change', notify)
  return () => motionQuery.removeEventListener('change', notify)
}
const subscribeMobile = (notify: () => void) => {
  mobileQuery.addEventListener('change', notify)
  return () => mobileQuery.removeEventListener('change', notify)
}
const subscribeSize = (notify: () => void) => {
  window.addEventListener('resize', notify)
  return () => window.removeEventListener('resize', notify)
}

export function useEnvironment() {
  const systemReduced = useSyncExternalStore(subscribeMotion, () => motionQuery.matches)
  const mobile = useSyncExternalStore(subscribeMobile, () => mobileQuery.matches)
  const height = useSyncExternalStore(subscribeSize, () => window.innerHeight)
  return { systemReduced, mobile, height }
}
