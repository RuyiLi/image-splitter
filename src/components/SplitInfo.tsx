import { createEffect } from 'solid-js';
import { useStore } from '../store';
import styles from '../styles/SplitInfo.module.scss';

export function SplitInfo(props: { onSplit: () => unknown }) {
  const [state, setState] = useStore();

  return (
    <div class={styles.SplitInfo}>
      <ul>
        <li>Columns: {state.splitSettings.columns}</li>
        <li>Rows: {state.splitSettings.rows}</li>
        <li>
          Overflow X:{' '}
          {state.splitSettings.columns * state.splitSettings.tileSize -
            state.image.width}
          px
        </li>
        <li>
          Overflow Y:{' '}
          {state.splitSettings.rows * state.splitSettings.tileSize -
            state.image.height}
          px
        </li>
        <button onClick={props.onSplit}>Split</button>
      </ul>
    </div>
  );
}
