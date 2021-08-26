import './styles/index.scss';
import { render } from 'solid-js/web';
import { App } from './App';
import { library, dom } from '@fortawesome/fontawesome-svg-core';
import { faLightbulb, faFileUpload } from '@fortawesome/free-solid-svg-icons';

// Load Font Awesome
library.add(faLightbulb, faFileUpload);
dom.watch();

render(() => <App />, document.getElementById('root'));
