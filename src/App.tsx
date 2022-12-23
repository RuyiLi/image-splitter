import { FileUpload } from './components/FileUpload'
import { ImagePreview } from './components/ImagePreview'
import { Settings } from './components/Settings'
import styles from './styles/App.module.scss'
import { useStore } from './store'

export function App() {
  const [state, setState] = useStore()

  return (
    <div class={styles.App}>
      <Settings />
      <main>{state.image ? <ImagePreview /> : <FileUpload />}</main>
    </div>
  )
}
