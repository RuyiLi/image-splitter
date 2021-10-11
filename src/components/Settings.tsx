import { createEffect, Show } from 'solid-js';
import { ISiteSettings, ISplitSettings, useStore } from '../store';
import styles from '../styles/Settings.module.scss';
import { isGif } from '../util';

export function Settings() {
  let colorAInput, colorBInput;
  const [state, setState] = useStore();

  createEffect(function () {
    localStorage.setItem('siteSettings', JSON.stringify(state.siteSettings));

    if (state.siteSettings.theme === 'dark') {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }

    colorAInput.style.borderColor = state.siteSettings.colorA;
    colorBInput.style.borderColor = state.siteSettings.colorB;
  });

  function toggleTheme(evt: InputEvent) {
    setState({
      siteSettings: {
        ...state.siteSettings,
        theme: (evt.target as HTMLInputElement).checked ? 'dark' : 'light',
      },
    });
  }

  function makeUpdater(
    key: keyof ISplitSettings,
    target: 'splitSettings',
  ): (evt: InputEvent) => void;
  function makeUpdater(
    key: keyof ISiteSettings,
    target: 'siteSettings',
  ): (evt: InputEvent) => void;
  function makeUpdater(key: string, target: string) {
    return function (evt: InputEvent) {
      const input = evt.target as HTMLInputElement;
      if (input.type === 'number' && isNaN(input.valueAsNumber)) {
        input.classList.add('invalid');
        return;
      }
      input.classList.remove('invalid');
      setState({
        [target]: {
          ...state[target],
          [key]: input[input.type === 'number' ? 'valueAsNumber' : 'value'],
        },
      });
    };
  }

  const makeSplitUpdater = (key: keyof ISplitSettings) =>
    makeUpdater(key, 'splitSettings');
  const makeSiteUpdater = (key: keyof ISiteSettings) =>
    makeUpdater(key, 'siteSettings');

  return (
    <div class={styles.Settings}>
      <Show when={state.image}>
        <form>
          <h1>Split Settings</h1>

          <label>
            Tile Size
            <input
              type="number"
              placeholder="32"
              value={state.splitSettings.tileSize}
              onInput={makeSplitUpdater('tileSize')}
            />
          </label>

          <label>
            File Prefix
            <input
              type="text"
              placeholder="image_"
              value={state.splitSettings.filePrefix}
              onInput={makeSplitUpdater('filePrefix')}
            />
          </label>

          <Show when={isGif(state.image)}>
            <label>
              Frame Delay
              <input
                type="number"
                placeholder="5"
                value={state.splitSettings.frameDelay}
                min={0}
                onInput={makeSplitUpdater('frameDelay')}
              />
            </label>
          </Show>
        </form>
      </Show>

      <form class={styles.SiteSettings}>
        <h1>Site Settings</h1>

        <label>
          Theme
          <input
            id="toggleTheme"
            type="checkbox"
            onInput={toggleTheme}
            checked={state.siteSettings.theme === 'dark'}
          />
          <label for="toggleTheme" style={{ 'text-transform': 'capitalize' }}>
            {state.siteSettings.theme}
          </label>
        </label>

        <label>
          Color A
          <input
            ref={colorAInput}
            type="text"
            placeholder="#ededed82"
            value={state.siteSettings.colorA}
            onInput={makeSiteUpdater('colorA')}
          />
        </label>

        <label>
          Color B
          <input
            ref={colorBInput}
            type="text"
            placeholder="#18181880"
            value={state.siteSettings.colorB}
            onInput={makeSiteUpdater('colorB')}
          />
        </label>
      </form>
    </div>
  );
}
