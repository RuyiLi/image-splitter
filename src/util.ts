export function classes(...names: string[]): string {
  return names.filter(Boolean).join(' ')
}

export function isAnimated(uri: string): boolean {
  // webps can be animated too, but we'll stick to this method for now
  try {
    const url = new URL(uri)
    return url.pathname.endsWith('.gif')
  } catch {
    return uri.endsWith('.gif')
  }
}

export function debounce(fn, wait) {
  let timeout
  return function (...args) {
    clearTimeout(timeout)
    timeout = setTimeout(() => {
      timeout = null
      fn.apply(this, args)
    }, wait)
    if (!timeout) fn.apply(this, args)
  }
}
