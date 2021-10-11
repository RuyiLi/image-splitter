import { createStore, SetStoreFunction, Store } from 'solid-js/store';

export interface ISplitSettings {
  tileSize: number;
  columns: number;
  rows: number;
  filePrefix: string;
  frameDelay?: number;
}

export interface ISiteSettings {
  theme: 'dark' | 'light';
  colorA: string;
  colorB: string;
}

export interface IAppState {
  image: HTMLImageElement;
  splitSettings: ISplitSettings;
  siteSettings: ISiteSettings;
}

let store;

export function useStore(): [Store<IAppState>, SetStoreFunction<IAppState>] {
  const localSettings = JSON.parse(localStorage.getItem('siteSettings'));
  if (!store) {
    store = createStore<IAppState>({
      image: null,
      splitSettings: {
        tileSize: 32,
        columns: 5,
        rows: 5,
        filePrefix: 'tile_',
        frameDelay: 10,
      },
      siteSettings: {
        theme: 'dark',
        colorA: '#ededed82',
        colorB: '#18181882',
        ...localSettings,
      },
    });
  }
  return store;
}
