import { createEffect, createMemo, createSignal, onMount } from 'solid-js'
import { createStore, produce } from 'solid-js/store'

import { type IAppState } from '../store'
import { SplitInfo } from './SplitInfo'
import { Tooltip } from './Tooltip'
import { useStore } from '../store'
import PinchZoom from 'pinch-zoom-element'
import SplitWorker from '../split.ts?worker'
import styles from '../styles/ImagePreview.module.scss'
import { parseGIF, decompressFrames } from 'gifuct-js'

interface SetTransformOpts {
  scale?: number
  x?: number
  y?: number
}

/**
 * Yes, ImagePreview calls the split worker
 * @returns
 */
export function ImagePreview() {
  let canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    tileCanvas: HTMLCanvasElement,
    tileCtx: CanvasRenderingContext2D,
    pinchZoom: PinchZoom,
    frameInterval: number,
    worker: Worker

  const [state, setState] = useStore()
  const [zoom, setZoom] = createSignal(100)
  let frameIdx = 0

  const [baseTransform, setBaseTransform] = createStore<SetTransformOpts>({})

  const getFrames = createMemo(() => {
    if (!state?.image) return
    return fetch(state.image.src)
      .then((res) => res.arrayBuffer())
      .then((arrayBuffer) => decompressFrames(parseGIF(arrayBuffer), true))
  })

  function initializeWorker() {
    if (!worker) {
      worker = new SplitWorker()

      worker.addEventListener('error', function (evt) {
        console.error(evt)
      })

      worker.addEventListener('message', function ({ data: { type, data } }) {
        if (type === 'update1') {
          // First batch of updates (pre-blob-conversion)
          const [x, y] = data
          if ((x + y) % 2 === 0) {
            const { tileSize } = state.splitSettings
            tileCtx.fillStyle = state.siteSettings.colorA || 'transparent'
            tileCtx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize)
          }
        } else if (type === 'update2') {
          // First batch of updates (post-blob-conversion)
          const [x, y] = data
          if ((x + y) % 2 === 1) {
            const { tileSize } = state.splitSettings
            tileCtx.fillStyle = state.siteSettings.colorB || 'transparent'
            tileCtx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize)
          }
        } else if (type === 'finish') {
          // Final update (psot-zip-generation)
          const { time, out } = data
          setState({ timeTaken: time, isSplitting: false })
          terminateWorker()

          const a = document.createElement('a')
          a.href = URL.createObjectURL(new Blob([out]))
          a.download = `${state.splitSettings.filePrefix}_split.zip`
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

    ctx = canvas.getContext('2d', { willReadFrequently: true })
    tileCtx = tileCanvas.getContext('2d')
    setBaseTransform({
      scale,
      x: clientWidth / 2 - (width * scale) / 2,
      y: clientHeight / 2 - (height * scale) / 2,
    })
  })

  createEffect(() => {
    const { frameDelay } = state.splitSettings
    if (state.isAnimated && frameDelay) {
      clearInterval(frameInterval)
      frameInterval = setInterval(() => requestAnimationFrame(drawImage), frameDelay)
    }
  })

  createEffect(() => {
    pinchZoom.setTransform(baseTransform)
    adjustZoom()
  })

  createEffect(() => {
    const { tileSize } = state.splitSettings
    const { width, height } = state.image

    const columns = Math.ceil(width / tileSize)
    const rows = Math.ceil(height / tileSize)

    canvas.width = tileCanvas.width = tileSize * columns
    canvas.height = tileCanvas.height = tileSize * rows

    drawImage()
    updatePreview(tileSize, columns, rows)
  })

  async function drawAnimatedImage() {
    const frames = await getFrames()
    const frame = frames[frameIdx++ % frames.length]

    const { width, height, top, left } = frame.dims
    const imgData = new ImageData(frame.patch, width, height)
    console.log(frame.disposalType)
    if (frame.disposalType === 1) {
      // Draw on top of prev
      const tempCanvas = document.createElement('canvas')
      tempCanvas.width = width
      tempCanvas.height = height
      const tempCtx = tempCanvas.getContext('2d')
      const frameImgData = tempCtx.createImageData(width, height)
      frameImgData.data.set(frame.patch)
      tempCtx.putImageData(frameImgData, 0, 0)
      ctx.drawImage(tempCanvas, left, top)
      tempCtx.clearRect(0, 0, width, height)
      tempCtx.drawImage(canvas, 0, 0)
      document.body.append(tempCanvas)
    } else {
      // Overwrite, putImageData clears for us
      ctx.putImageData(imgData, 0, 0)
    }
  }

  function drawImage() {
    if (state.image) {
      if (state.isAnimated) {
        drawAnimatedImage()
      } else {
        ctx.drawImage(state.image, 0, 0)
      }
    } else {
      clearInterval(frameInterval)
    }
  }

  function updatePreview(tileSize, columns, rows) {
    const { colorA, colorB } = state.siteSettings

    // Draw the tile overlay
    tileCtx.clearRect(0, 0, tileCanvas.width, tileCanvas.height)
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < columns; x++) {
        // Set to transparent as a placeholder if either colorA or colorB is invalid
        tileCtx.fillStyle = 'transparent'
        tileCtx.fillStyle = (x + y) % 2 === 0 ? colorA : colorB
        tileCtx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize)
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
      setState({ isSplitting: true })
      tileCtx.clearRect(0, 0, tileCanvas.width, tileCanvas.height)
      worker.postMessage({
        state: JSON.parse(JSON.stringify(state)),
        imageData: ctx.getImageData(0, 0, canvas.width, canvas.height),
      })
    }
  }

  function terminateWorker() {
    if (worker) {
      worker.terminate()
      worker = null
    }
  }

  function cancel() {
    terminateWorker()
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
        <div>
          <canvas ref={canvas}></canvas>
          <canvas class={styles.TileOverlayCanvas} ref={tileCanvas}></canvas>
        </div>
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
