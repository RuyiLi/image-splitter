import { createSignal } from 'solid-js';
import styles from '../styles/FileDrop.module.scss';
import { classes } from '../util';
import { useStore } from '../store';

export function FileDrop({ children }) {
  const [state, setState] = useStore();
  const [hovering, setHovering] = createSignal(false);

  function dropHandler(evt: DragEvent) {
    evt.preventDefault();
    const file = evt.dataTransfer.files[0];
    setState({ file });
    setHovering(false);
  }

  function dragOverHandler(evt: Event) {
    evt.preventDefault();
    setHovering(true);
  }

  function dragLeaveHandler(evt: Event) {
    evt.preventDefault();
    setHovering(false);
  }

  return (
    <div
      class={styles.FileDrop}
      onDrop={dropHandler}
      onDragOver={dragOverHandler}
      onDragLeave={dragLeaveHandler}
    >
      <div class={classes(styles.cover, hovering() || styles.hidden)}>
        <i class="fas fa-file-upload"></i>
      </div>
      {children}
    </div>
  );
}
