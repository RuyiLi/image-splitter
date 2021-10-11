import { createEffect, createSignal, onMount } from 'solid-js';
import { useStore } from '../store';
import type { IAppState } from '../store';
import styles from '../styles/ImagePreview.module.scss';
import PinchZoom from 'pinch-zoom-element';
import { createStore, produce } from 'solid-js/store';
import { SplitInfo } from './SplitInfo';
import * as fflate from 'fflate';

interface SetTransformOpts {
  scale?: number;
  x?: number;
  y?: number;
}

export function ImagePreview() {
  let canvas, pinchZoom: PinchZoom;
  const [state, setState] = useStore();
  const [zoom, setZoom] = createSignal(100);
  const [isSplitting, setIsSplitting] = createSignal(false);

  const [baseTransform, setBaseTransform] = createStore<SetTransformOpts>({});

  onMount(function () {
    // Scale to fit screen
    const { width, height } = state.image;
    const { clientWidth, clientHeight } = pinchZoom;
    const scale = Math.min(clientWidth / width, clientHeight / height, 1);
    setBaseTransform({
      scale,
      x: clientWidth / 2 - (width * scale) / 2,
      y: clientHeight / 2 - (height * scale) / 2,
    });
  });

  createEffect(function () {
    pinchZoom.setTransform(baseTransform);
    adjustZoom();
  });

  createEffect(updatePreview);

  function updatePreview() {
    const ctx = canvas.getContext('2d');

    const { tileSize } = state.splitSettings;
    const { colorA, colorB } = state.siteSettings;
    const { width, height } = state.image;

    const columns = Math.ceil(width / tileSize);
    const rows = Math.ceil(height / tileSize);

    canvas.width = tileSize * columns;
    canvas.height = tileSize * rows;

    ctx.drawImage(state.image, 0, 0);

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < columns; x++) {
        // Set to transparent as a placeholder if either colorA or colorB is invalid
        ctx.fillStyle = 'transparent';
        ctx.fillStyle = (x + y) % 2 === 0 ? colorA : colorB;
        ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
      }
    }

    setState(
      produce<IAppState>((state) => {
        // Use produce to mutate individual props so it doesn't
        // trigger a dependency update on state.splitSettings
        state.splitSettings.columns = columns;
        state.splitSettings.rows = rows;
      }),
    );
  }

  function adjustZoom() {
    setTimeout(function () {
      setZoom(Math.round(pinchZoom.scale * 100));
    });
  }

  function resetTransform() {
    pinchZoom.setTransform(baseTransform);
    adjustZoom();
  }

  async function split() {
    console.time('split1');
    console.time('split2');

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(state.image, 0, 0);

    const { tileSize, columns, rows } = state.splitSettings;
    const splitCanvas = document.createElement('canvas');
    const splitCtx = splitCanvas.getContext('2d');
    splitCanvas.width = splitCanvas.height = tileSize;

    setIsSplitting(true);

    const zip = {};

    let left = rows * columns;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < columns; x++) {
        if (!isSplitting()) {
          return;
        }

        const tile = ctx.getImageData(
          x * tileSize,
          y * tileSize,
          tileSize,
          tileSize,
        );
        splitCtx.putImageData(tile, 0, 0);

        splitCanvas.toBlob(async function (blob) {
          const buf = await blob.arrayBuffer();
          const fname = `${state.splitSettings.filePrefix}_${x}_${y}.png`;
          zip[fname] = new Uint8Array(buf);

          if (--left <= 0) {
            fflate.zip(zip, {}, (err, out) => {
              if (err) console.error(err);
              const a = document.createElement('a');
              a.href = URL.createObjectURL(new Blob([out]));
              a.download = 'poggers.zip';
              a.click();
              URL.revokeObjectURL(a.href);
            });
            console.timeEnd('split1');
          }
        });
      }
    }

    console.timeEnd('split2');
  }

  function cancel() {
    setIsSplitting(false);
    setState({ image: null });
  }

  const createZoom = (sign) =>
    function () {
      const { left } = pinchZoom.getBoundingClientRect();
      pinchZoom.dispatchEvent(
        new WheelEvent('wheel', {
          deltaY: sign * 40,
          clientX: pinchZoom.clientWidth / 2 + left,
          clientY: pinchZoom.clientHeight / 2,
        }),
      );
    };

  return (
    <div class={styles.ImagePreview}>
      <SplitInfo onSplit={split} />

      <pinch-zoom ref={pinchZoom} onWheel={adjustZoom}>
        <canvas ref={canvas}></canvas>
      </pinch-zoom>

      <div class={styles.ZoomControls}>
        <button title="Cancel" onClick={cancel}>
          <i class="fas fa-times"></i>
        </button>
        <button title="Zoom Out" onClick={createZoom(1)}>
          <i class="fas fa-minus"></i>
        </button>
        <h1>{zoom()}%</h1>
        <button title="Zoom In" onClick={createZoom(-1)}>
          <i class="fas fa-plus"></i>
        </button>
        <button title="Reset Position" onClick={resetTransform}>
          <i class="fas fa-redo"></i>
        </button>
      </div>
    </div>
  );
}
