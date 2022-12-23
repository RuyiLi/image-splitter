import { createEffect, createSignal, onMount } from 'solid-js'
import { createStore, produce } from 'solid-js/store'

import type { IAppState } from '../store'
import PinchZoom from 'pinch-zoom-element'
import { SplitInfo } from './SplitInfo'
import SplitWorker from '../split.ts?worker'
import { Tooltip } from './Tooltip'
import styles from '../styles/ImagePreview.module.scss'
import { useStore } from '../store'

interface SetTransformOpts {
  scale?: number
  x?: number
  y?: number
}

export function ImagePreview() {
  let canvas: HTMLCanvasElement,
    pinchZoom: PinchZoom,
    ctx: CanvasRenderingContext2D
  const [state, setState] = useStore()
  const [zoom, setZoom] = createSignal(100)

  const [baseTransform, setBaseTransform] = createStore<SetTransformOpts>({})

  let worker: Worker
  function initializeWorker() {
    if (!worker) {
      worker = new SplitWorker()

      worker.addEventListener('error', function (evt) {
        console.error(evt.error)
      })

      worker.addEventListener('message', function ({ data: { type, data } }) {
        if (type === 'update1') {
          const [x, y] = data
          if ((x + y) % 2 === 0) {
            const { tileSize } = state.splitSettings
            ctx.fillStyle = state.siteSettings.colorA || 'transparent'
            ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize)
          }
        } else if (type === 'update2') {
          const [x, y] = data
          if ((x + y) % 2 === 1) {
            const { tileSize } = state.splitSettings
            ctx.fillStyle = state.siteSettings.colorB || 'transparent'
            ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize)
          }
        } else if (type === 'finish') {
          const { time, out } = data
          setState({ timeTaken: time, isSplitting: false })

          const a = document.createElement('a')
          a.href = URL.createObjectURL(new Blob([out]))
          a.download = `${state.splitSettings.filePrefix}_split_result.zip`
          a.click()
          URL.revokeObjectURL(a.href)
        }
      })
    }
  }

  onMount(() => {
    // Scale to fit screen
    const { width, height } = state.image
    const { clientWidth, clientHeight } = pinchZoom
    const scale = Math.min(clientWidth / width, clientHeight / height, 1)
    ctx = canvas.getContext('2d', {
      willReadFrequently: true,
    })
    setBaseTransform({
      scale,
      x: clientWidth / 2 - (width * scale) / 2,
      y: clientHeight / 2 - (height * scale) / 2,
    })
  })

  createEffect(() => {
    pinchZoom.setTransform(baseTransform)
    adjustZoom()
  })

  createEffect(updatePreview)

  function updatePreview() {
    const { tileSize } = state.splitSettings
    const { colorA, colorB } = state.siteSettings
    const { width, height } = state.image

    const columns = Math.ceil(width / tileSize)
    const rows = Math.ceil(height / tileSize)

    canvas.width = tileSize * columns
    canvas.height = tileSize * rows

    ctx.drawImage(state.image, 0, 0)

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < columns; x++) {
        // Set to transparent as a placeholder if either colorA or colorB is invalid
        ctx.fillStyle = 'transparent'
        ctx.fillStyle = (x + y) % 2 === 0 ? colorA : colorB
        ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize)
      }
    }

    setState(
      produce<IAppState>((state) => {
        // Use produce to mutate individual props so it doesn't
        // trigger a dependency update on state.splitSettings
        state.splitSettings.columns = columns
        state.splitSettings.rows = rows
      })
    )
  }

  function adjustZoom() {
    setTimeout(function () {
      setZoom(Math.round(pinchZoom.scale * 100))
    })
  }

  function resetTransform() {
    pinchZoom.setTransform(baseTransform)
    adjustZoom()
  }

  function split() {
    if (!state.isSplitting) {
      initializeWorker()
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(state.image, 0, 0)
      setState({ isSplitting: true })
      worker.postMessage({
        state: JSON.parse(JSON.stringify(state)),
        imageData: ctx.getImageData(0, 0, canvas.width, canvas.height),
      })
    }
  }

  function cancel() {
    if (worker) {
      worker.terminate()
      worker = null
    }
    setState((state) => ({
      image: state.isSplitting ? state.image : null,
      isSplitting: false,
    }))
  }

  function createZoom(sign) {
    return function () {
      const { left } = pinchZoom.getBoundingClientRect()
      pinchZoom.dispatchEvent(
        new WheelEvent('wheel', {
          deltaY: sign * 40,
          clientX: pinchZoom.clientWidth / 2 + left,
          clientY: pinchZoom.clientHeight / 2,
        })
      )
    }
  }

  return (
    <div class={styles.ImagePreview}>
      <SplitInfo onSplit={split} />

      <pinch-zoom ref={pinchZoom} onWheel={adjustZoom}>
        <canvas ref={canvas}></canvas>
      </pinch-zoom>

      <div class={styles.ZoomControls}>
        <Tooltip text="Cancel" position="top">
          <button title="Cancel" onClick={cancel}>
            <i class="fas fa-times"></i>
          </button>
        </Tooltip>

        <Tooltip text="Zoom Out" position="top">
          <button title="Zoom Out" onClick={createZoom(1)}>
            <i class="fas fa-minus"></i>
          </button>
        </Tooltip>

        <Tooltip text="Zoom Level" position="top">
          <h1>{zoom()}%</h1>
        </Tooltip>

        <Tooltip text="Zoom In" position="top">
          <button title="Zoom In" onClick={createZoom(-1)}>
            <i class="fas fa-plus"></i>
          </button>
        </Tooltip>

        <Tooltip text="Reset Position" position="top">
          <button title="Reset Position" onClick={resetTransform}>
            <i class="fas fa-redo"></i>
          </button>
        </Tooltip>
      </div>
    </div>
  )
}
