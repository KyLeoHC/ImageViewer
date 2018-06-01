/* eslint no-unused-vars:0 */
import polyfill from './common/polyfill';
import ImageViewer from './core/imageViewer';
import css from './css/index.styl';

polyfill();

/* eslint no-undef:0 */
ImageViewer.version = __VERSION__;

export default ImageViewer;
