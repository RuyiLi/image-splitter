import {
  FileDrop,
  SplitPreview,
  SplitSettings,
  SiteSettings,
  FileUpload,
} from './components';
import styles from './styles/App.module.scss';
import { useStore } from './store';

export function App() {
  const [state, setState] = useStore();

  return (
    <div class={styles.App}>
      <FileDrop>
        <SplitSettings />
        <SiteSettings />
        {state.file ? <SplitPreview /> : <FileUpload />}
      </FileDrop>
    </div>
  );
}
