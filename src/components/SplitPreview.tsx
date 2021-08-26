import { createEffect, onMount } from 'solid-js';
import { useStore } from '../store';
import styles from '../styles/SplitPreview.module.scss';

export function SplitPreview() {
  let canvas, container;

  const [state, setState] = useStore();

  const img = new Image();

  createEffect(function () {
    img.src = URL.createObjectURL(state.file);
    img.addEventListener('load', function () {
      const ctx: CanvasRenderingContext2D = canvas.getContext('2d');
      const width = (img.width * canvas.height) / img.height;
      ctx.drawImage(img, canvas.width / 2 - width / 2, 0, width, canvas.height);
    });
  });

  function resizeCanvas() {
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    const ctx: CanvasRenderingContext2D = canvas.getContext('2d');
    const width = (img.width * canvas.height) / img.height;
    ctx.drawImage(img, canvas.width / 2 - width / 2, 0, width, canvas.height);
  }

  onMount(resizeCanvas);
  window.addEventListener('resize', resizeCanvas);
  document.addEventListener('resize', resizeCanvas);
  document.body.addEventListener('resize', resizeCanvas);

  function mouseDownHandler(evt: MouseEvent) {
    evt.preventDefault();
    console.log(evt);
  }

  function mouseUpHandler() {}

  function removeFile() {
    setState({ file: null });
  }

  return (
    <div ref={container} class={styles.SplitPreview}>
      <a class={styles.back} onClick={removeFile}>
        X
      </a>
      <canvas
        ref={canvas}
        class={styles.canvas}
        onMouseDown={mouseDownHandler}
        onMouseUp={mouseUpHandler}
      ></canvas>
    </div>
  );
}
