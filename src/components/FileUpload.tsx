import { Show, createSignal, onCleanup, onMount } from 'solid-js'
import { classes, isGif } from '../util'

import styles from '../styles/FileUpload.module.scss'
import { useStore } from '../store'

export function FileUpload() {
  let fileInput, uploadContainer
  const [state, setState] = useStore()
  const [covering, setCovering] = createSignal(false)

  onMount(() => {
    document.addEventListener('keydown', handlePaste)
  })

  onCleanup(() => {
    document.removeEventListener('keydown', handlePaste)
  })

  function setImage(urlOrBlob: string | Blob) {
    const image = new Image()
    if (typeof urlOrBlob === 'string') {
      image.src = urlOrBlob
    } else {
      image.src = URL.createObjectURL(urlOrBlob)
    }
    image.addEventListener('load', () => setState({ image }), {
      once: true,
    })
  }

  async function handlePaste(evt: KeyboardEvent) {
    if (evt.code === 'KeyV' && (evt.metaKey || evt.ctrlKey)) {
      const items = await navigator.clipboard.read()
      const item = items[0]
      const imageType = item.types.find((type) => type.startsWith('image/'))
      if (imageType) {
        // An image was pasted
        const blob = await item.getType(imageType)
        setImage(blob)
        setState({ isAnimated: false }) // gifs cannot be copy/pasted
      } else if (item.types.includes('text/plain')) {
        // Assume a URL was pasted
        const url = await item.getType('text/plain').then((blob) => blob.text())
        setImage(url)
        setState({ isAnimated: isGif(url) })
      }
    }
  }

  function handleClick() {
    fileInput.click()
  }

  function handleFile(evt: InputEvent) {
    evt.preventDefault()
    const file = (evt.target as HTMLInputElement).files[0]
    setImage(file)
    setState({ isAnimated: isGif(file.name) })
  }

  function handleDrop(evt: DragEvent) {
    evt.preventDefault()
    const file = evt.dataTransfer.files[0]
    setImage(file)
    setState({ isAnimated: isGif(file.name) })
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
      <div
        class={classes(
          'no-select',
          styles.UploadCover,
          covering() && styles.active
        )}
      >
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
