/* eslint no-unused-vars:0 */
import ImageViewer from './core/imageViewer';
import css from './css/index.styl';

/* eslint no-undef:0 */
try {
    ImageViewer.version = __VERSION__;
} catch (e) {
}

export default ImageViewer;
