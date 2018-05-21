import {
    debug
} from '../common/debug';
import {
    query,
    removeElement,
    setTranslateStyle
} from '../common/dom';
import {
    LOCK_NAME,
    ITEM_ANIMATION_CLASS,
    LEFT_IMG,
    CENTER_IMG,
    RIGHT_IMG
} from '../common/profile';
import {isNumber, isPlainObject} from '../common/utils';
import lock from '../common/lock';
import Touch from './touch';
import Viewer from './viewer';

const defaultImgOption = {thumbnail: '', url: ''};

class ImageViewer {
    constructor(images = [], opt = {}) {
        this.opt = opt;
        this.duration = this.opt.duration || 10;
        this.el = null;
        this.headerEl = null;
        this.bodyEl = null;
        this.footerEl = null;
        this.viewerWrapperEl = null;
        this.animationEl = null;
        this.currentNumberEl = null;
        this.totalNumberEl = null;
        this.loadingEl = null;
        this.images = images; // 图片数据
        this.imagesLength = images.length; // 图片数据
        this.container = opt.container || 'body';
        this.enableScale = !!opt.enableScale; // 是否开启图片缩放功能
        this.currentIndex = opt.startIndex || 0; // 起始坐标，从0开始
        this.viewers = [];
        this.scaleStart = 1;
        this.isScale = false;
        this.width = 0;
        this.height = 0;
        this.itemList = []; // 各个图片容器元素的dom节点
        this.translateX = 0;
        this.touch = null;
    }

    _create() {
        this.el = query('.image-viewer')[0];
        this.destroy();
        let imageViewerTemplate =
            `<div class="image-viewer">
                <div class="image-header"></div>
                <div class="image-body">
                    <div class="viewer-wrapper">
                        <div class="viewer"><div class="panel"><img><span></span></div></div>
                        <div class="viewer"><div class="panel"><img><span></span></div></div>
                        <div class="viewer"><div class="panel"><img><span></span></div></div>     
                    </div>
                </div>
                <div class="image-footer"></div>
                <div class="image-animation hide"><img></div> 
                <div class="ball-clip-rotate hide"><div></div></div>
            </div>`;

        const divEl = document.createElement('div');
        divEl.innerHTML = imageViewerTemplate;
        this.el = divEl.firstElementChild;
        query(this.container)[0].appendChild(this.el);
        this.headerEl = query('.image-header', this.el)[0];
        this.bodyEl = query('.image-body', this.el)[0];
        this.footerEl = query('.image-footer', this.el)[0];
        this.viewerWrapperEl = query('.image-body .viewer-wrapper', this.el)[0];
        this.animationEl = query('.image-animation', this.el)[0];
        this.loadingEl = query('.ball-clip-rotate', this.el)[0];
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
    }

    _init() {
        this.viewers = [];
        for (let i = 0, length = this.itemList.length, item; i < length; i++) {
            item = this.itemList[i];
            this.viewers.push(new Viewer(this, item, this.width, this.height, i));
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
        touch.on('panstart', event => this._dealPanAction(event, 'panstart'));
        touch.on('panmove', event => this._dealPanAction(event, 'panmove'));
        touch.on('panend', event => this._dealPanAction(event, 'panend'));
        if (this.enableScale) {
            touch.on('tap', () => {
                console.log('tap', new Date());
                this.opt.enableTapClose && this.close();
            });
            touch.on('doubleTap', this.reset.bind(this));
            touch.on('pinchstart', event => this._dealScaleAction(event, 'pinchstart'));
            touch.on('pinch', event => this._dealScaleAction(event, 'pinch'));
            touch.on('pinchend', event => this._dealScaleAction(event, 'pinchend'));
        }
        this.touch = touch;
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
        if (lock.getLockState(LOCK_NAME)) {
            this._getCurrentViewer()._translatePanelStart(event);
        } else {
            this.viewerWrapperEl.classList.remove(ITEM_ANIMATION_CLASS);
            this.opt.beforeSwipe && this.opt.beforeSwipe(this.currentIndex);
            this.viewerWrapperEl.style.willChange = 'transform';
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
        if (lock.getLockState(LOCK_NAME) && !force) {
            this._getCurrentViewer()._translatePanelEnd(event);
        } else {
            const distance = event.deltaX;
            let needSwipe = false;
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
                    this._updateCountElement();
                } else {
                    setTranslateStyle(this.viewerWrapperEl, this.translateX, 0);
                }
                this.opt.afterSwipe && this.opt.afterSwipe(this.currentIndex);
            }
            this.viewerWrapperEl.style.willChange = 'auto';
            return needSwipe;
        }
    }

    _dealWithScaleActionStart(event) {
        this.isScale = true;
        this.scaleStart = event.scale;
        this._getCurrentViewer()._pinchStart();
    }

    _dealWithScaleAction(event) {
        this._getCurrentViewer()._pinch(event.scale - this.scaleStart);
    }

    _dealWithScaleActionEnd() {
        this._getCurrentViewer()._pinchEnd();
        window.requestAnimationFrame(() => {
            this.isScale = false;
        });
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
                width: value.width || 0,
                height: value.height || 0
            };
        } else if (value.getBoundingClientRect) {
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

    _fadeIn(callback) {
        if (this.opt.fadeInFn) {
            const image = this._getCurrentImage();
            const duration = this.duration;
            const data = this._getPositionAndSize(this.opt.fadeInFn(this.currentIndex));
            const style = this.animationEl.style;
            style.top = data.top + 'px';
            style.left = data.left + 'px';
            style.width = data.width + 'px';
            style.height = data.height + 'px';

            const currentViewer = this._getCurrentViewer();
            const rect = this._getPositionAndSize(currentViewer.el);
            let stepTop = (rect.top - data.top) / duration;
            let stepLeft = (rect.left - data.left) / duration;
            let stepWidth = (rect.width - data.width) / duration;
            let stepHeight = (rect.height - data.height) / duration;
            let stepOpacity = 1 / duration;
            let currentOpacity = 0;
            let offsetTop = 0;
            let offsetLeft = 0;
            let nextAnimation = true;

            const animationFn = () => {
                if (nextAnimation) {
                    nextAnimation = false;
                    if (Math.abs(rect.top - data.top - offsetTop) >= 0.5) {
                        offsetTop += stepTop;
                        nextAnimation = true;
                    }
                    if (Math.abs(rect.left - data.left - offsetLeft) >= 0.5) {
                        offsetLeft += stepLeft;
                        nextAnimation = true;
                    }
                    if (Math.abs(rect.width - data.width) >= 0.5) {
                        data.width += stepWidth;
                        style.width = data.width + 'px';
                        nextAnimation = true;
                    }
                    if (Math.abs(rect.height - data.height) >= 0.5) {
                        data.height += stepHeight;
                        style.height = data.height + 'px';
                        nextAnimation = true;
                    }
                    if (currentOpacity < 1) {
                        currentOpacity += stepOpacity;
                        this.el.style.opacity = currentOpacity;
                        nextAnimation = true;
                    }
                    setTranslateStyle(this.animationEl, offsetLeft.toFixed(4), offsetTop.toFixed(4));
                    window.requestAnimationFrame(animationFn);
                } else {
                    window.requestAnimationFrame(() => {
                        this.animationEl.classList.add('hide');
                        callback();
                    });
                }
            };
            this.animationEl.children[0].src = image.thumbnail || image.url;
            this.animationEl.classList.remove('hide');
            animationFn();
        } else {
            callback();
        }
    }

    _fadeOut(callback) {
        if (this.opt.fadeOutFn) {
            const image = this._getCurrentImage();
            const duration = this.duration;
            const data = this._getPositionAndSize(this.opt.fadeOutFn(this.currentIndex));
            const style = this.animationEl.style;
            style.top = data.top + 'px';
            style.left = data.left + 'px';

            const currentViewer = this._getCurrentViewer();
            const rect = this._getPositionAndSize(currentViewer.el);
            let differTop = rect.top - data.top;
            let differLeft = rect.left - data.left;
            let differWidth = rect.width - data.width;
            let differHeight = rect.height - data.height;
            let stepTop = differTop / duration;
            let stepLeft = differLeft / duration;
            let stepWidth = differWidth / duration;
            let stepHeight = differHeight / duration;
            let stepOpacity = 1 / duration;
            let currentOpacity = 1;
            let currentWidth = rect.width;
            let currentHeight = rect.height;
            let nextAnimation = true;

            setTranslateStyle(this.animationEl, differLeft, differTop);
            style.width = rect.width + 'px';
            style.height = rect.height + 'px';
            const animationFn = () => {
                if (nextAnimation) {
                    nextAnimation = false;
                    if (Math.abs(differTop) > 0.5) {
                        differTop -= stepTop;
                        nextAnimation = true;
                    }
                    if (Math.abs(differLeft) > 0.5) {
                        differLeft -= stepLeft;
                        nextAnimation = true;
                    }
                    if (currentWidth >= data.width) {
                        currentWidth -= stepWidth;
                        style.width = currentWidth + 'px';
                        nextAnimation = true;
                    }
                    if (currentHeight >= data.height) {
                        currentHeight -= stepHeight;
                        style.height = currentHeight + 'px';
                        nextAnimation = true;
                    }
                    if (currentOpacity > 0) {
                        currentOpacity -= stepOpacity;
                        this.el.style.opacity = currentOpacity;
                        nextAnimation = true;
                    }
                    setTranslateStyle(this.animationEl, differLeft.toFixed(4), differTop.toFixed(4));
                    window.requestAnimationFrame(animationFn);
                } else {
                    window.requestAnimationFrame(() => {
                        this.animationEl.classList.add('hide');
                        callback();
                    });
                }
            };
            this.animationEl.children[0].src = image.url;
            this.animationEl.classList.remove('hide');
            animationFn();
        } else {
            callback();
        }
    }

    showLoading() {
        this.loadingEl.classList.remove('hide');
    }

    hideLoading() {
        this.loadingEl.classList.add('hide');
    }

    /**
     * 重置当前图片的缩放
     */
    reset() {
        const viewer = this.viewers[1];
        viewer.addAnimation();
        viewer._initImage(true);
        window.requestAnimationFrame(() => {
            lock.releaseLock(LOCK_NAME);
        });
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
        if (this._getPrevImage().url) {
            this.currentIndex--;
            this.translateX += this.width;
            setTranslateStyle(this.viewerWrapperEl, this.translateX, 0);

            const image = this._getSpecificImage(this.currentIndex - 1);
            if (image.url || this.currentIndex === 0) {
                const viewer = this.loopViewers(1);
                viewer.init(image, viewer.displayIndex - 3, true);
                this._getCurrentViewer().init();
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
        if (this._getNextImage().url) {
            this.currentIndex++;
            this.translateX -= this.width;
            setTranslateStyle(this.viewerWrapperEl, this.translateX, 0);

            const image = this._getSpecificImage(this.currentIndex + 1);
            if (image.url || this.currentIndex === this.imagesLength - 1) {
                const viewer = this.loopViewers(0);
                viewer.init(image, viewer.displayIndex + 3, true);
                this._getCurrentViewer().init();
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
        if (!isNaN(index) && index > -1 && index < this.imagesLength) {
            this.currentIndex = index;
            this.translateX = 0;
            setTranslateStyle(this.viewerWrapperEl, 0, 0);

            this.viewers = this.viewers.sort((a, b) => {
                return a.index - b.index;
            });
            this.viewers[0].init(this._getPrevImage(), LEFT_IMG, true);
            this.viewers[1].init(this._getCurrentImage(), CENTER_IMG, true, needLoadLarge, callback);
            this.viewers[2].init(this._getNextImage(), RIGHT_IMG, true);

            this._updateCountElement();
        } else {
            debug('illegal index!');
        }
    }

    setImageOption(images = [], startIndex = 0) {
        if (!images.length) {
            debug('images array can not be empty!');
        }
        this.images = images;
        this.imagesLength = images.length;
        this.currentIndex = startIndex;
        this._init();
        this.swipeInByIndex(this.currentIndex);
    }

    destroy() {
        this.el && removeElement(this.el);
    }

    close() {
        if (this.el) {
            this.bodyEl.style.visibility = 'hidden';
            this._fadeOut(() => {
                this.el.style.display = 'none';
                this._getCurrentViewer().clearImg();
            });
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

        if (this.opt.fadeInFn) {
            this.el.style.opacity = 0;
            this.bodyEl.style.visibility = 'hidden';
        }
        this.el.style.display = 'block';
        this.swipeInByIndex(this.currentIndex, false, () => {
            window.requestAnimationFrame(() => {
                // @todo: 没有提供el元素选项时，采用从屏幕中间渐变出来(关闭)的动画
                this._fadeIn(() => {
                    this.el.style.opacity = 1;
                    this.bodyEl.style.visibility = 'visible';
                    // 下面这个再次调用是为了加载大图
                    this.swipeInByIndex(this.currentIndex);
                });
            });
        });
    }
}

export default ImageViewer;
