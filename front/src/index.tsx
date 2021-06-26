import ReactDOM from 'react-dom';
import { App } from './components/app';

declare global {
  interface Window {
    showDirectoryPicker: any;
  }
}

ReactDOM.render(<App />, document.getElementById('root'));
