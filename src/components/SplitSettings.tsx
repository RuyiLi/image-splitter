import { createSignal } from 'solid-js';
import styles from '../styles/SplitSettings.module.scss';
import { classes } from '../util';
import { useStore } from '../store';

export function SplitSettings() {
  const [state, setState] = useStore();
  const [shrink, setShrink] = createSignal(false);

  function toggleShrink() {
    setShrink(!shrink());
  }

  return (
    <div class={classes(styles.SplitSettings, state.file && styles.collapsed)}>
      <form class={classes(styles.settings, 'box')} autocomplete="off">
        <label for="tileSize">Tile Size</label>
        <input id="tileSize" type="number" placeholder="64" />

        <label for="horizontalTiles"># of Horizontal Tiles</label>
        <input id="horizontalTiles" type="text" placeholder="5" />

        <label for="verticalTiles"># of Vertical Tiles</label>
        <input id="verticalTiles" type="text" placeholder="5" />
        <label for="filePrefix">File Prefix</label>
        <input id="filePrefix" type="text" placeholder="image_" />

        <label for="frameDelay">Frame Delay (ms)</label>
        <input id="frameDelay" type="text" placeholder="10" />

        <label>Shrink</label>
        <input id="shrink" type="checkbox" onClick={toggleShrink} />
        <label for="shrink">{shrink() ? 'Yes' : 'No'}</label>
      </form>
    </div>
  );
}
