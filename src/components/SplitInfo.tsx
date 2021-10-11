import { Tooltip } from './Tooltip';
import { useStore } from '../store';
import styles from '../styles/SplitInfo.module.scss';
import { classes } from '../util';

export function SplitInfo(props: { onSplit: () => unknown }) {
  const [state, setState] = useStore();

  return (
    <div class={styles.SplitInfo}>
      <div class="row">
        <div class={classes('col', styles.KeyContainer)}>
          <Tooltip text="Number of horizontal tiles" position="left">
            <p>Columns</p>
          </Tooltip>
          <Tooltip text="Number of vertical tiles" position="left">
            <p>Rows</p>
          </Tooltip>
          <Tooltip
            text="Number of transparent pixels on the right of the rightmost tiles"
            position="left"
          >
            <p>Overflow X</p>
          </Tooltip>
          <Tooltip
            text="Number of transparent pixels below the bottommost tiles"
            position="left"
          >
            <p>Overflow Y</p>
          </Tooltip>
        </div>
        <div class="col">
          <p>{state.splitSettings.columns}</p>
          <p>{state.splitSettings.rows}</p>
          <p>
            {state.splitSettings.columns * state.splitSettings.tileSize -
              state.image.width}
            px
          </p>
          <p>
            {state.splitSettings.rows * state.splitSettings.tileSize -
              state.image.height}
            px
          </p>
        </div>
      </div>
      <button onClick={props.onSplit}>Split</button>
    </div>
  );
}
