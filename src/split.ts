/**
 * We can potentially distribute this task over multiple workers?
 */

import { zipSync, strToU8 } from 'fflate'
import { GIFEncoder, quantize, applyPalette } from 'gifenc'
import { type IAppState } from './store'

interface ISplitTransferData {
  state: IAppState
  imageData: ImageData
}

function createGridMessage(prefix, rows, columns) {
  const msgRows = []
  for (let y = 0; y < rows; y++) {
    const currRow = Array.from(
      { length: columns },
      (_, x) => `:${prefix}_${y}_${x}:`
    )
    msgRows.push(currRow.join(''))
  }
  return strToU8(msgRows.join('\n'))
}

function splitStaticImage(data: ISplitTransferData) {
  const { state, imageData } = data
  const { tileSize, filePrefix, columns, rows } = state.splitSettings

  const zip = {}
  const splitCanvas = new OffscreenCanvas(tileSize, tileSize)
  const splitCtx = splitCanvas.getContext('2d', {
    willReadFrequently: true,
  }) as OffscreenCanvasRenderingContext2D

  function getImageData(x: number, y: number) {
    const arr = new Uint8ClampedArray(tileSize * tileSize * 4)
    const start = y * tileSize * imageData.width * 4 + x * tileSize * 4
    for (let row = 0; row < tileSize; row++) {
      const i = start + row * imageData.width * 4
      arr.set(imageData.data.subarray(i, i + tileSize * 4), row * tileSize * 4)
    }
    return new ImageData(arr, tileSize, tileSize)
  }

  let tilesLeft = rows * columns
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < columns; x++) {
      const tile = getImageData(x, y)
      splitCtx.clearRect(0, 0, tileSize, tileSize)
      splitCtx.putImageData(tile, 0, 0)

      self.postMessage({
        type: 'update1',
        data: [x, y],
      })

      splitCanvas.convertToBlob().then(async function (blob) {
        const buf = await blob.arrayBuffer()
        const fname = `${filePrefix}_${y}_${x}.png`
        zip[fname] = new Uint8Array(buf)

        --tilesLeft

        self.postMessage({
          type: 'update2',
          data: [x, y],
        })

        if (tilesLeft <= 0) {
          return zip
        }
      })
    }
  }
  return {}
}

function splitAnimatedImage(data: ISplitTransferData) {
  const { state, imageData } = data
  const { tileSize, filePrefix, columns, rows } = state.splitSettings

  const zip = {}
  const splitCanvas = new OffscreenCanvas(tileSize, tileSize)
  const splitCtx = splitCanvas.getContext('2d', {
    willReadFrequently: true,
  }) as OffscreenCanvasRenderingContext2D

  function getImageData(x: number, y: number) {
    const arr = new Uint8ClampedArray(tileSize * tileSize * 4)
    const start = y * tileSize * imageData.width * 4 + x * tileSize * 4
    for (let row = 0; row < tileSize; row++) {
      const i = start + row * imageData.width * 4
      arr.set(imageData.data.subarray(i, i + tileSize * 4), row * tileSize * 4)
    }
    return new ImageData(arr, tileSize, tileSize)
  }

  imageData

  return {}
}

self.addEventListener(
  'message',
  function ({ data }: { data: ISplitTransferData }) {
    const { filePrefix, columns, rows } = data.state.splitSettings

    const startTime = Date.now()
    console.time('split')

    const zip = data.state.isAnimated
      ? splitAnimatedImage(data)
      : splitStaticImage(data)
    zip['grid.txt'] = createGridMessage(filePrefix, rows, columns)

    // Create the zip file
    const out = zipSync(zip, {})
    const time = Date.now() - startTime
    console.timeEnd('split')
    self.postMessage({
      type: 'finish',
      data: { out, time },
    })
  }
)
