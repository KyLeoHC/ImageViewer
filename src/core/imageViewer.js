import {
    debug
} from '../common/debug';
import {
    query,
    removeElement,
    setTranslateStyle,
    setScaleAndTranslateStyle
} from '../common/dom';
import {
    LOCK_NAME,
    ITEM_ANIMATION_CLASS,
    LEFT_IMG,
    CENTER_IMG,
    RIGHT_IMG
} from '../common/profile';
import {
    isNumber,
    isPlainObject
} from '../common/utils';
import lock from '../common/lock';
import Touch from './touch';
import Viewer from './viewer';
import template from '../html/template.html';

const defaultImgOption = {thumbnail: '', url: ''};

class ImageViewer {
    constructor(images = [], opt) {
        this.setOption(opt);
        this.el = null;
        this.headerEl = null;
        this.bodyEl = null;
        this.footerEl = null;
        this.viewerWrapperEl = null;
        this.animationEl = null;
        this.animationImgEl = null;
        this.currentNumberEl = null;
        this.totalNumberEl = null;
        this.images = images; // 图片数据
        this.imagesLength = images.length; // 图片数据
        this.viewers = [];
        this.scaleStart = 1;
        this.isScale = false;
        this.isMove = false;
        this.width = 0;
        this.height = 0;
        this.itemList = []; // 各个图片容器元素的dom节点
        this.translateX = 0;
        this.touch = null;
        this.isOpen = false;
    }

    _create() {
        this.el = query('.image-viewer')[0];
        this.destroy();

        const divEl = document.createElement('div');
        divEl.innerHTML = template;
        this.el = divEl.firstElementChild;
        query(this.container)[0].appendChild(this.el);
        this.bgEl = query('.image-viewer-bg', this.el)[0];
        this.headerEl = query('.image-header', this.el)[0];
        this.bodyEl = query('.image-body', this.el)[0];
        this.footerEl = query('.image-footer', this.el)[0];
        this.viewerWrapperEl = query('.image-body .viewer-wrapper', this.el)[0];
        this.animationEl = query('.image-animation', this.el)[0];
        this.animationImgEl = this.animationEl.children[0];
        this.itemList = this.viewerWrapperEl.children;
        this.width = this.el.clientWidth;
        this.height = this.el.clientHeight;

        if (this.opt.headerRender) {
            this.headerEl.innerHTML = this.opt.headerRender();
        }
        if (this.opt.footerRender) {
            this.footerEl.innerHTML = this.opt.footerRender();
        }
        this.currentNumberEl = query('.number-current', this.el)[0]; // 当前滑动所在的图片下标的元素节点
        this.totalNumberEl = query('.number-total', this.el)[0]; // 图片总数的元素节点

        this._initDuration();
    }

    _init() {
        this.viewers = [];
        for (let i = 0, length = this.itemList.length, item; i < length; i++) {
            item = this.itemList[i];
            this.viewers.push(new Viewer(this, item, i));
        }
        lock.createLock(LOCK_NAME);
    }

    _updateCountElement() {
        if (this.currentNumberEl) {
            this.currentNumberEl.innerText = this.currentIndex + 1;
        }
        if (this.totalNumberEl) {
            this.totalNumberEl.innerText = this.imagesLength;
        }
    }

    _bindEvent() {
        const touch = new Touch(this.bodyEl, {enableScale: this.enableScale});
        touch.on('tap', () => this._dealTap());
        touch.on('panstart', event => this._dealPanAction(event, 'panstart'));
        touch.on('panmove', event => this._dealPanAction(event, 'panmove'));
        touch.on('panend', event => this._dealPanAction(event, 'panend'));
        if (this.enableScale) {
            touch.on('pinchstart', event => this._dealScaleAction(event, 'pinchstart'));
            touch.on('pinch', event => this._dealScaleAction(event, 'pinch'));
            touch.on('pinchend', event => this._dealScaleAction(event, 'pinchend'));
        }
        this.touch = touch;
    }

    /**
     * 处理单击事件
     * 如果有缩放，则先还原图片尺寸，否则就关闭图片预览
     * @private
     */
    _dealTap() {
        const currentViewer = this._getCurrentViewer();
        if (currentViewer.isScale()) {
            this.reset();
        } else {
            this.opt.enableTapClose && this.close();
        }
    }

    _dealPanAction(event, type) {
        if (this.isScale) return;
        switch (type) {
            case 'panstart':
                this._dealWithMoveActionStart(event);
                break;
            case 'panmove':
                this._dealWithMoveAction(event);
                break;
            case 'panend':
                this._dealWithMoveActionEnd(event);
                break;
        }
    }

    _dealScaleAction(event, type) {
        if (this.isMove) return;
        switch (type) {
            case 'pinchstart':
                this._dealWithScaleActionStart(event);
                break;
            case 'pinch':
                this._dealWithScaleAction(event);
                break;
            case 'pinchend':
                this._dealWithScaleActionEnd(event);
                break;
        }
    }

    _dealWithMoveActionStart(event) {
        this.isMove = true;
        if (lock.getLockState(LOCK_NAME)) {
            this._getCurrentViewer()._translatePanelStart(event);
        } else {
            this.viewerWrapperEl.classList.remove(ITEM_ANIMATION_CLASS);
            this.opt.beforeSwipe && this.opt.beforeSwipe(this.currentIndex);
        }
    }

    _dealWithMoveAction(event, force) {
        if (lock.getLockState(LOCK_NAME) && !force) {
            this._getCurrentViewer()._translatePanel(event);
        } else {
            force && this.viewerWrapperEl.classList.remove(ITEM_ANIMATION_CLASS);
            setTranslateStyle(this.viewerWrapperEl, this.translateX + event.deltaX, 0);
        }
    }

    _dealWithMoveActionEnd(event, force) {
        let needSwipe = false;
        if (lock.getLockState(LOCK_NAME) && !force) {
            this._getCurrentViewer()._translatePanelEnd(event);
        } else {
            const distance = event.deltaX;
            let needBreak = false;

            if (this.currentIndex === 0 && distance > 0 && this.opt.swipeFirstRight) {
                // 当前图片是第一张，并且向右滑动
                needBreak = this.opt.swipeFirstRight(this, Math.abs(distance));
            } else if (this.currentIndex === (this.imagesLength - 1) && distance < 0 && this.opt.swipeLastLeft) {
                // 当前图片是最后一张，并且向左滑动
                needBreak = this.opt.swipeLastLeft(this, Math.abs(distance));
            }

            if (!needBreak) {
                distance !== 0 && this.viewerWrapperEl.classList.add(ITEM_ANIMATION_CLASS);
                if (distance !== 0 && this._checkDistance(distance)) {
                    this.viewers.forEach(viewer => viewer.removeAnimation());
                    needSwipe = distance > 0 ? this.swipeToPrev() : this.swipeToNext();
                } else {
                    setTranslateStyle(this.viewerWrapperEl, this.translateX, 0);
                }
                this.opt.afterSwipe && this.opt.afterSwipe(this.currentIndex);
            }
        }
        setTimeout(() => {
            this.isMove = false;
        }, 0);
        return needSwipe;
    }

    _dealWithScaleActionStart(event) {
        this.viewerWrapperEl.classList.remove(ITEM_ANIMATION_CLASS);
        this.isScale = true;
        this.scaleStart = event.scale;
        this._getCurrentViewer()._pinchStart();
    }

    _dealWithScaleAction(event) {
        this._getCurrentViewer()._pinch(event.scale - this.scaleStart);
    }

    _dealWithScaleActionEnd() {
        this._getCurrentViewer()._pinchEnd();
        setTimeout(() => {
            this.isScale = false;
        }, 0);
    }

    _getCurrentViewer() {
        return this.viewers[1];
    }

    _checkDistance(distance = 0) {
        return Math.abs(distance) > this.width / 5;
    }

    _getPrevImage() {
        let minuend = this.currentIndex;
        if (this.opt.loop && this.imagesLength > 2) {
            minuend = this.currentIndex === 0 ? this.imagesLength : this.currentIndex;
        }
        return this.images[minuend - 1] || defaultImgOption;
    }

    _getCurrentImage() {
        return this.images[this.currentIndex] || defaultImgOption;
    }

    _getNextImage() {
        let addend = this.currentIndex;
        if (this.opt.loop && this.imagesLength > 2) {
            addend = this.currentIndex === this.imagesLength - 1 ? -1 : this.currentIndex;
        }
        return this.images[addend + 1] || defaultImgOption;
    }

    _getSpecificImage(index) {
        return this.images[index] || defaultImgOption;
    }

    _getPositionAndSize(value) {
        if (isPlainObject(value)) {
            return {
                top: value.top || 0,
                left: value.left || 0,
                width: value.width || 1,
                height: value.height || 1
            };
        } else if (value && value.getBoundingClientRect) {
            const rect = value.getBoundingClientRect();
            return {
                top: rect.top,
                left: rect.left,
                width: rect.width,
                height: rect.height
            };
        } else {
            return {top: 0, left: 0, width: 0, height: 0};
        }
    }

    _initDuration() {
        if (this.opt.hasOwnProperty('duration')) {
            const duration = this.opt.duration;
            if (this.bgEl.style.hasOwnProperty('transitionDuration')) {
                this.animationEl.style.transitionDuration =
                    this.bgEl.style.transitionDuration = `${duration}ms`;
            } else if (this.bgEl.style.hasOwnProperty('webkitTransitionDuration')) {
                this.animationEl.style.webkitTransitionDuration =
                    this.bgEl.style.webkitTransitionDuration = `${duration}ms`;
            } else {
                debug('transition duration prop not found.');
            }
        }
    }

    /**
     * 显示/隐藏viewer容器
     * @param type 1:显示 2:隐藏
     * @private
     */
    _toggleViewerWrapper(type = 1) {
        const className = 'hide';
        type === 1
            ? this.viewerWrapperEl.classList.add(className)
            : this.viewerWrapperEl.classList.remove(className);
    }

    /**
     * 渐变动画函数
     * @param url 图片链接
     * @param type 1: 渐变打开 2: 渐变关闭
     * @param callback 动画完成的回调
     * @private
     */
    _animation(url, type, callback) {
        const duration = this.duration;
        const currentViewer = this._getCurrentViewer();
        // 动画起始的position数据
        const start = this._getPositionAndSize(type === 1 ? this.opt.fadeInFn(this.currentIndex) : currentViewer.panelEl);
        // 动画结束的position数据
        const end = this._getPositionAndSize(type === 1 ? currentViewer.panelEl : this.opt.fadeOutFn(this.currentIndex));
        const scale = end.width / start.width;
        this.animationEl.style.width = start.width + 'px';
        this.animationEl.style.height = start.height + 'px';
        setScaleAndTranslateStyle(this.animationEl, 1, start.left, start.top);

        this.animationImgEl.src = url;
        this.animationEl.classList.remove('hide');
        // 延迟20ms是为了确保动画元素节点完全呈现出来了
        // 避免部分机型因为快速显示和隐藏元素导致的闪烁现象
        setTimeout(() => {
            this._toggleViewerWrapper(1);
            this.el.classList.add('animation');
            this.bgEl.style.opacity = type === 1 ? 1 : 0.001;
            setScaleAndTranslateStyle(this.animationEl, scale, end.left, end.top);
            setTimeout(() => {
                callback(() => {
                    this.el.classList.remove('animation');
                    this.animationEl.classList.add('hide');
                    this.animationImgEl.src = '';
                });
            }, duration + 20); // 在原来动画时间的基础上再加20ms，确保动画真正完成(或许该用动画完成事件?)
        }, 20);
    }

    _fadeIn(callback) {
        if (this.opt.fadeInFn) {
            const image = this._getCurrentImage();
            this._animation(image.thumbnail || image.url, 1, callback);
        } else {
            callback();
        }
    }

    _fadeOut(callback) {
        if (this.opt.fadeOutFn) {
            // 如果图片有缩放，则先重置回默认尺寸再进行开始动画
            this.reset(false);
            const image = this._getCurrentImage();
            this._animation(image.url, 2, callback);
        } else {
            callback();
        }
    }

    /**
     * 重置当前图片的缩放
     */
    reset(enableAnimate = true) {
        const viewer = this.viewers[1];
        if (viewer.isScale()) {
            enableAnimate ? viewer.addAnimation() : viewer.removeAnimation();
            viewer._initImage(true);
            setTimeout(() => {
                lock.releaseLock(LOCK_NAME);
            }, 0);
        }
    }

    /**
     * 移动循环队列
     * @param direction 方向，0：队首移动到队尾，1：队尾移动到队首
     * @returns {*}
     */
    loopViewers(direction) {
        let viewer = null;
        if (direction === 0) {
            viewer = this.viewers.shift();
            this.viewers.push(viewer);
        } else if (direction === 1) {
            viewer = this.viewers.pop();
            this.viewers = [viewer].concat(this.viewers);
        }
        return viewer;
    }

    /**
     * 滑动到上一张
     * @returns {boolean}
     */
    swipeToPrev() {
        if (!this.isOpen) return;
        if (this._getPrevImage().url) {
            this.currentIndex--;
            this.translateX += this.width;
            this.viewerWrapperEl.classList.add(ITEM_ANIMATION_CLASS);
            setTranslateStyle(this.viewerWrapperEl, this.translateX, 0);

            const image = this._getSpecificImage(this.currentIndex - 1);
            if (image.url || this.currentIndex === 0) {
                const viewer = this.loopViewers(1);
                viewer.init({
                    imageOption: image,
                    displayIndex: viewer.displayIndex - 3,
                    resetScale: true
                });
                this._getCurrentViewer().init();
                this._updateCountElement();
            }
            return true;
        } else {
            setTranslateStyle(this.viewerWrapperEl, this.translateX, 0);
            return false;
        }
    }

    /**
     * 滑动到下一张
     * @returns {boolean}
     */
    swipeToNext() {
        if (!this.isOpen) return;
        if (this._getNextImage().url) {
            this.currentIndex++;
            this.translateX -= this.width;
            this.viewerWrapperEl.classList.add(ITEM_ANIMATION_CLASS);
            setTranslateStyle(this.viewerWrapperEl, this.translateX, 0);

            const image = this._getSpecificImage(this.currentIndex + 1);
            if (image.url || this.currentIndex === this.imagesLength - 1) {
                const viewer = this.loopViewers(0);
                viewer.init({
                    imageOption: image,
                    displayIndex: viewer.displayIndex + 3,
                    resetScale: true
                });
                this._getCurrentViewer().init();
                this._updateCountElement();
            }
            return true;
        } else {
            setTranslateStyle(this.viewerWrapperEl, this.translateX, 0);
            return false;
        }
    }

    /**
     * 根据给定的下标移动到指定图片处
     * @param index 数组下标，从0开始
     * @param needLoadLarge 是否加载大图
     * @param callback 任务完成时的回调函数
     */
    swipeInByIndex(index, needLoadLarge, callback) {
        if (!this.isOpen) return;
        if (isNumber(index) && index > -1 && index < this.imagesLength) {
            this.currentIndex = index;
            this.translateX = 0;
            setTranslateStyle(this.viewerWrapperEl, 0, 0);

            this.viewers = this.viewers.sort((a, b) => (a.index - b.index));
            this.viewers[0].init({
                imageOption: this._getPrevImage(),
                displayIndex: LEFT_IMG,
                resetScale: true
            });
            this.viewers[1].init({
                imageOption: this._getCurrentImage(),
                displayIndex: CENTER_IMG,
                resetScale: true,
                needLoadLarge,
                fn: callback
            });
            this.viewers[2].init({
                imageOption: this._getNextImage(),
                displayIndex: RIGHT_IMG,
                resetScale: true
            });

            this._updateCountElement();
        } else {
            debug('illegal index!');
        }
    }

    open(index) {
        this.currentIndex = isNumber(index) ? index : this.currentIndex;
        if (!this.el) {
            // 仅仅实例化，但尚未初始化
            this._create();
            this._init();
            this._bindEvent();
        }
        this._toggleViewerWrapper(1);
        this.bgEl.style.opacity = 0.001;
        this.el.style.display = 'block';
        this.isOpen = true;
        const currentImageOption = this._getCurrentImage();
        this._getCurrentViewer().removeAnimation();
        if (this.opt.fadeInFn && currentImageOption.w && currentImageOption.h) {
            this._getCurrentViewer().preInitSize(currentImageOption.w, currentImageOption.h);
            this._fadeIn(done => {
                this.bgEl.style.opacity = 1;
                // 下面这个再次调用是为了加载大图
                this.swipeInByIndex(this.currentIndex, true, () => {
                    this._toggleViewerWrapper(2);
                    done && done();
                });
            });
        } else {
            this.bgEl.style.opacity = 1;
            this.swipeInByIndex(this.currentIndex, true, () => {
                this._toggleViewerWrapper(2);
            });
        }
    }

    /**
     * 设置图片数据
     * @param images
     * @param startIndex
     */
    setImageOption(images = [], startIndex = 0) {
        if (!images.length) {
            debug('images array can not be empty!');
        }
        this.images = images;
        this.imagesLength = images.length;
        this.currentIndex = startIndex;
        this.swipeInByIndex(this.currentIndex);
    }

    /**
     * 设置预览参数选项
     * @param opt
     */
    setOption(opt = {}) {
        this.opt = opt;
        this.duration = opt.duration || 333;
        this.container = opt.container || 'body';
        // 是否开启图片缩放功能
        this.enableScale = !!opt.enableScale;
        if (!this.isOpen) {
            // 起始坐标，从0开始
            this.currentIndex = opt.startIndex || this.currentIndex || 0;
        }
    }

    destroy() {
        this.isOpen = false;
        this.el && removeElement(this.el);
    }

    close() {
        if (this.el) {
            this.isOpen = false;
            this.viewerWrapperEl.classList.remove(ITEM_ANIMATION_CLASS);
            this._fadeOut(done => {
                this.animationImgEl.src = '';
                this._getCurrentViewer().clearImg();
                this.el.style.display = 'none';
                done && done();
            });
        }
    }
}

export default ImageViewer;
