import { ParsedFrame, decompressFrames, parseGIF } from 'gifuct-js'
import { SetStoreFunction, Store, createStore } from 'solid-js/store'

import { createMemo } from 'solid-js'

// TODO make columns/rows computed
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
}

export const defaultSettings: IAppState = {
  image: null,
  isAnimated: false,
  isSplitting: false,
  timeTaken: 0,
  splitSettings: {
    tileSize: 32,
    filePrefix: 'image',
    frameDelay: 10,
    columns: 0,
    rows: 0,
  },
  siteSettings: {
    theme: 'dark',
    colorA: 'rgba(0, 0, 0, 0.5)',
    colorB: 'rgba(255, 255, 255, 0.25)',
  },
}

let store: [Store<IAppState>, SetStoreFunction<IAppState>]
export function useStore() {
  const localSettings = JSON.parse(localStorage.getItem('siteSettings'))
  if (!store) {
    store = createStore<IAppState>({
      ...defaultSettings,
      siteSettings: {
        ...defaultSettings.siteSettings,
        ...localSettings,
      },
    })
  }
  return store
}
