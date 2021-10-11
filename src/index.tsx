import './styles/index.scss';
import { render } from 'solid-js/web';
import { App } from './App';
import { library, dom } from '@fortawesome/fontawesome-svg-core';
import {
  faLightbulb,
  faFileUpload,
  faPlus,
  faMinus,
  faRedo,
  faTimes,
} from '@fortawesome/free-solid-svg-icons';
import 'pinch-zoom-element';

// Load Font Awesome
// There has to be a better way to do this lol
library.add(faLightbulb, faFileUpload, faPlus, faMinus, faRedo, faTimes);
// dom.watch();

render(() => <App />, document.getElementById('root'));
