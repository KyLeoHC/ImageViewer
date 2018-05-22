/* eslint no-unused-vars:0 */
import polyfillAnimation from './common/polyfillAnimation';
import ImageViewer from './core/imageViewer';
import css from './css/index.styl';

polyfillAnimation();
window.ImageViewer = ImageViewer;

export default ImageViewer;
