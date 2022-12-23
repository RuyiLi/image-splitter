import { SetStoreFunction, Store, createStore } from 'solid-js/store'

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
}

let store
export function useStore(): [Store<IAppState>, SetStoreFunction<IAppState>] {
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
