import { classes, isAnimated } from '../util'
import { createSignal, onCleanup, onMount } from 'solid-js'

import styles from '../styles/FileUpload.module.scss'
import { useStore } from '../store'

export function FileUpload() {
  let fileInput, uploadContainer
  const [state, setState] = useStore()
  const [covering, setCovering] = createSignal(false)

  onMount(() => document.addEventListener('keydown', handlePaste))
  onCleanup(() => document.removeEventListener('keydown', handlePaste))

  function getImage(urlOrBlob: string | Blob) {
    const image = new Image()
    image.src = typeof urlOrBlob === 'string' ? urlOrBlob : URL.createObjectURL(urlOrBlob)
    return new Promise<HTMLImageElement>((res) => {
      image.addEventListener('load', () => res(image), { once: true })
    })
  }

  async function handlePaste(evt: KeyboardEvent) {
    if (evt.code === 'KeyV' && (evt.metaKey || evt.ctrlKey)) {
      try {
        var items = await navigator.clipboard.read()
      } catch {
        alert("Sorry, your browser doesn't support reading from the clipboard.")
        return
      }
      const item = items[0]
      const imageType = item.types.find((type) => type.startsWith('image/'))
      if (imageType) {
        // An image was pasted
        const blob = await item.getType(imageType)
        setState({
          isAnimated: false, // gifs cannot be copy/pasted
          image: await getImage(blob),
        })
      } else if (item.types.includes('text/plain')) {
        // Assume a URL was pasted
        const url = await item.getType('text/plain').then((blob) => blob.text())
        setState({ isAnimated: isAnimated(url), image: await getImage(url) })
      }
    }
  }

  function handleClick() {
    fileInput.click()
  }

  async function handleFile(evt: InputEvent) {
    evt.preventDefault()
    const file = (evt.target as HTMLInputElement).files[0]
    setState({ isAnimated: isAnimated(file.name), image: await getImage(file) })
  }

  async function handleDrop(evt: DragEvent) {
    evt.preventDefault()
    const file = evt.dataTransfer.files[0]
    setState({ isAnimated: isAnimated(file.name), image: await getImage(file) })
  }

  function showCover(evt: Event) {
    evt.preventDefault()
    setCovering(true)
  }

  function hideCover(evt: Event) {
    evt.preventDefault()
    setCovering(false)
  }

  return (
    <div
      ref={uploadContainer}
      class={styles.FileUpload}
      onDragOver={showCover}
      onDragLeave={hideCover}
      onMouseOver={showCover}
      onMouseLeave={hideCover}
      onClick={handleClick}
      onDrop={handleDrop}
    >
      <div class={classes('no-select', styles.UploadCover, covering() && styles.active)}>
        <i class={`no-select fas fa-file-upload ${styles.Icon}`}></i>
      </div>

      <input
        ref={fileInput}
        type="file"
        class="invisible"
        accept="image/png,image/jpeg,image/gif"
        onInput={handleFile}
      />

      <h1 class="no-select">Drag/click to upload an image.</h1>
      <h2 class="no-select">
        Or use <kbd>ctrl</kbd>+<kbd>v</kbd> to paste an image/URL.
      </h2>
    </div>
  )
}
