import * as fflate from 'fflate'

import { IAppState } from './store'

interface ISplitTransferData {
  state: IAppState
  imageData: ImageData
}

self.addEventListener(
  'message',
  function ({ data }: { data: ISplitTransferData }) {
    const { state, imageData } = data

    const startTime = Date.now()
    console.time('split1')
    console.time('split2')

    const { tileSize, columns, rows, filePrefix } = state.splitSettings
    const splitCanvas = new OffscreenCanvas(tileSize, tileSize)
    const splitCtx = splitCanvas.getContext('2d', {
      willReadFrequently: true,
    }) as OffscreenCanvasRenderingContext2D

    const zip = {}

    function getImageData(x: number, y: number) {
      const arr = new Uint8ClampedArray(tileSize * tileSize * 4)
      const start = y * tileSize * imageData.width * 4 + x * tileSize
      for (let row = 0; row < tileSize; row++) {
        const i = start + row * imageData.width * 4
        arr.set(
          imageData.data.subarray(i, i + tileSize * 4),
          row * tileSize * 4
        )
      }
      return new ImageData(arr, tileSize, tileSize)
    }

    let left = rows * columns
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
          const fname = `${filePrefix}_${x}_${y}.png`
          zip[fname] = new Uint8Array(buf)
          --left
          self.postMessage({
            type: 'update2',
            data: [x, y],
          })
          if (left <= 0) {
            fflate.zip(zip, {}, (err, out) => {
              if (err) console.error(err)
              self.postMessage({
                type: 'finish',
                data: {
                  out,
                  time: Date.now() - startTime,
                },
              })
              console.timeEnd('split2')
            })
            console.timeEnd('split1')
          }
        })
      }
    }
  }
)
