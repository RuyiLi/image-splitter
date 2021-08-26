import styles from '../styles/FileUpload.module.scss';
import { useStore } from '../store';

export function FileUpload() {
  const [state, setState] = useStore();

  function openFileDialog(evt: MouseEvent) {
    const fileInput = document.createElement('input');
    fileInput.setAttribute('type', 'file');

    function handleFileChange() {
      const file = fileInput.files[0];
      console.log(file);
      if (file) {
        setState({ file });
        fileInput.removeEventListener('change', handleFileChange);
      }
    }

    fileInput.addEventListener('change', handleFileChange);
    fileInput.click();
  }

  return (
    <div class={styles.FileUpload} onClick={openFileDialog}>
      <h1>Click to upload an image.</h1>
      <h2>Dropping and pasting images works too!</h2>
    </div>
  );
}
