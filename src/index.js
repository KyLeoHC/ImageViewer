/* eslint no-unused-vars:0 */
import polyfillAnimation from './common/polyfillAnimation';
import ImageViewer from './core/imageViewer';
import css from './css/index.styl';

// import VConsole from 'vconsole';
// new VConsole();

polyfillAnimation();
window.ImageViewer = ImageViewer;

export default ImageViewer;
