import './styles/index.scss'
import 'pinch-zoom-element'

import {
  faFileUpload,
  faLightbulb,
  faMinus,
  faPlus,
  faRedo,
  faTimes,
} from '@fortawesome/free-solid-svg-icons'

import { App } from './App'
import { library } from '@fortawesome/fontawesome-svg-core'
import { render } from 'solid-js/web'

// Load Font Awesome
// There has to be a better way to do this lol
library.add(faLightbulb, faFileUpload, faPlus, faMinus, faRedo, faTimes)
// dom.watch();

render(() => <App />, document.getElementById('root'))
