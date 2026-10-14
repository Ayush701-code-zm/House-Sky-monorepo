export function getMotionPreference(): 'reduced' | 'no-preference' {
  if (typeof window === 'undefined') return 'no-preference'
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ? 'reduced'
    : 'no-preference'
}
