import { createSignal } from 'solid-js';
import logo from '../assets/logo.svg';
import styles from '../styles/FileDrop.module.scss';

export function FileDrop() {
  const [file, setFile] = createSignal(null);

  function dropHandler(evt: DragEvent) {
    evt.preventDefault();
    const file = evt.dataTransfer.files[0];
    setFile(file);
  }

  function dragOverHandler(evt) {
    console.log(evt);
    evt.preventDefault();
  }

  return (
    <div
      class={styles.FileDrop}
      onDrop={dropHandler}
      onDragOver={dragOverHandler}
    >
      <img src={logo} class={styles.logo} />
      <h1>Drop an image to start splitting.</h1>
      <h2>Pasting an image/URL works too.</h2>
      <p>{file}</p>
    </div>
  );
}
