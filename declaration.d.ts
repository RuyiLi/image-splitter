import 'solid-js'

declare module '*.svg'
declare module '*.png'
declare module '*.jpg'
declare module '*.jpeg'
declare module '*.gif'

declare module 'solid-js' {
  namespace JSX {
    interface IntrinsicElements {
      'pinch-zoom': unknown
    }
  }
}

declare global {
  interface OffscreenCanvas {
    convertToBlob: (options?: {
      type: string
      quality: number
    }) => Promise<Blob>
  }
}