import {
  type ISiteSettings,
  type ISplitSettings,
  defaultSettings,
  useStore,
} from '../store'
import { Show, createEffect } from 'solid-js'

import { Tooltip } from './Tooltip'
import { debounce } from '../util'
import styles from '../styles/Settings.module.scss'

const DEBOUNCE_WAIT = 400

export function Settings() {
  let colorAInput, colorBInput
  const [state, setState] = useStore()

  createEffect(() => {
    localStorage.setItem('siteSettings', JSON.stringify(state.siteSettings))

    if (state.siteSettings.theme === 'dark') {
      document.body.classList.add('dark-theme')
    } else {
      document.body.classList.remove('dark-theme')
    }

    colorAInput.style.borderColor = state.siteSettings.colorA
    colorBInput.style.borderColor = state.siteSettings.colorB
  })

  function toggleTheme(evt: InputEvent) {
    setState({
      siteSettings: {
        ...state.siteSettings,
        theme: (evt.target as HTMLInputElement).checked ? 'dark' : 'light',
      },
    })
  }

  function makeUpdater(
    key: keyof ISplitSettings,
    target: 'splitSettings'
  ): (evt: InputEvent) => void
  function makeUpdater(
    key: keyof ISiteSettings,
    target: 'siteSettings'
  ): (evt: InputEvent) => void
  function makeUpdater(key: string, target: string) {
    return function (evt: InputEvent) {
      const input = evt.target as HTMLInputElement
      if (input.type === 'number' && isNaN(input.valueAsNumber)) {
        input.classList.add('invalid')
        return
      }
      input.classList.remove('invalid')
      setState({
        [target]: {
          ...state[target],
          [key]: input[input.type === 'number' ? 'valueAsNumber' : 'value'],
        },
      })
    }
  }

  const makeSplitUpdater = (key: keyof ISplitSettings) =>
    makeUpdater(key, 'splitSettings')
  const makeSiteUpdater = (key: keyof ISiteSettings) =>
    makeUpdater(key, 'siteSettings')

  return (
    <div class={styles.Settings}>
      <Show when={state.image}>
        <form>
          <fieldset disabled={state.isSplitting}>
            <h1>Split Settings</h1>

            <Tooltip text="The size of each tile in pixels." position="right">
              <label>
                Tile Size
                <input
                  type="number"
                  placeholder="32"
                  value={state.splitSettings.tileSize}
                  onInput={debounce(
                    makeSplitUpdater('tileSize'),
                    DEBOUNCE_WAIT
                  )}
                />
              </label>
            </Tooltip>

            <Tooltip
              text="What the file name of each tile starts with. Each image will be named according to the format of prefix_x_y."
              position="right"
            >
              <label>
                File Prefix
                <input
                  type="text"
                  placeholder="image"
                  value={state.splitSettings.filePrefix}
                  onInput={makeSplitUpdater('filePrefix')}
                />
              </label>
            </Tooltip>

            <Show when={state.isAnimated}>
              <Tooltip
                text="Time in milliseconds between each frame."
                position="right"
              >
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
              </Tooltip>
            </Show>
          </fieldset>
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

        <Tooltip
          text="These colors will be shown, alternating, in a grid over the image to display how the tiles will look like."
          position="right"
        >
          <label>
            Color A
            <input
              ref={colorAInput}
              type="text"
              placeholder={defaultSettings.siteSettings.colorA}
              value={state.siteSettings.colorA}
              onInput={makeSiteUpdater('colorA')}
            />
          </label>
        </Tooltip>

        <Tooltip
          text="These colors will be shown, alternating, in a grid over the image to display how the tiles will look like."
          position="right"
        >
          <label>
            Color B
            <input
              ref={colorBInput}
              type="text"
              placeholder={defaultSettings.siteSettings.colorB}
              value={state.siteSettings.colorB}
              onInput={makeSiteUpdater('colorB')}
            />
          </label>
        </Tooltip>
      </form>

      <footer class={styles.Footer}>
        <p>Image Splitter V3 by Ruyi Li 😎</p>
        <a href="https://github.com/RuyiLi/image-splitter">
          This project is open source!
        </a>
      </footer>
    </div>
  )
}
