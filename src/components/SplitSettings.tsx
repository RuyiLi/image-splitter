import { createSignal } from 'solid-js';
import styles from '../styles/SplitSettings.module.scss';
import wave from '../assets/wave.svg';

export function SplitSettings() {
  const [open, setOpen] = createSignal(false);

  function toggleSettings() {
    setOpen(!open());
  }

  return (
    <div class={styles.SplitSettings}>
      <div class={styles.settings + ' ' + (open() ? '' : styles.collapsed)}>
        <h1>Settings</h1>
      </div>
      <img class={styles.wave} src={wave} onClick={toggleSettings} />
    </div>
  );
}
