import { ParsedFrame, decompressFrames, parseGIF } from 'gifuct-js'
import { SetStoreFunction, Store, createStore } from 'solid-js/store'

import { createMemo } from 'solid-js'

export interface ISplitSettings {
  tileSize: number
  columns: number
  rows: number
  filePrefix: string
  frameDelay?: number
}

export interface ISiteSettings {
  theme: 'dark' | 'light'
  colorA: string
  colorB: string
}

export interface IAppState {
  image: HTMLImageElement
  isAnimated: boolean
  isSplitting: boolean
  timeTaken: number
  splitSettings: ISplitSettings
  siteSettings: ISiteSettings

  frames: Promise<ParsedFrame[]>
}

export const defaultSettings: IAppState = {
  image: null,
  isAnimated: false,
  isSplitting: false,
  timeTaken: 0,
  splitSettings: {
    tileSize: 32,
    columns: 5,
    rows: 5,
    filePrefix: 'image',
    frameDelay: 10,
  },
  siteSettings: {
    theme: 'dark',
    colorA: 'rgba(0, 0, 0, 0.5)',
    colorB: 'rgba(255, 255, 255, 0.25)',
  },
  frames: null,
}

let store: [Store<IAppState>, SetStoreFunction<IAppState>]
export function useStore() {
  const localSettings = JSON.parse(localStorage.getItem('siteSettings'))
  if (!store) {
    let frames
    store = createStore<IAppState>({
      ...defaultSettings,
      siteSettings: {
        ...defaultSettings.siteSettings,
        ...localSettings,
      },
      get frames() {
        return frames()
      },
    })
    frames = createMemo(() => {
      const [state, _setState] = store
      console.log(state.image)
      if (!state?.image) return
      return fetch(state.image.src)
        .then((res) => res.arrayBuffer())
        .then((arrayBuffer) => decompressFrames(parseGIF(arrayBuffer), true))
    })
  }
  return store
}
