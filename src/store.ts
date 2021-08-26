import { createStore } from 'solid-js/store';

interface ISStore {
  file: File;
}

let store;

export function useStore() {
  if (!store) {
    store = createStore<ISStore>({
      file: null,
    });
  }
  return store;
}
