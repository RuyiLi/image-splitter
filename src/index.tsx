import './styles/index.scss';

import { FileDrop } from './components';
import { SplitSettings } from './components/SplitSettings';
import { render } from 'solid-js/web';
import styles from './styles/App.module.scss';

function App() {
  return (
    <div class={styles.App}>
      <SplitSettings />
      <FileDrop />
    </div>
  );
}

render(() => <App />, document.getElementById('root'));
