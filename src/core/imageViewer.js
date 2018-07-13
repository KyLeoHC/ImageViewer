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
    LOAD_IMG_COMPLETE,
    LOAD_IMG_FAIL,
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
import Event from '../common/event';
import lock from '../common/lock';
import Touch from './touch';
import Viewer from './viewer';
import template from '../html/template.html';

const defaultImgOption = {thumbnail: '', url: ''};

class ImageViewer {
    constructor(images = [], opt = {}) {
        this.opt = opt;
        this.duration = this.opt.duration || 333;
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
        this.container = opt.container || 'body';
        this.enableScale = !!opt.enableScale; // 是否开启图片缩放功能
        this.currentIndex = opt.startIndex || 0; // 起始坐标，从0开始
        this.viewers = [];
        this.scaleStart = 1;
        this.isScale = false;
        this.isMove = false;
        this.width = 0;
        this.height = 0;
        this.itemList = []; // 各个图片容器元素的dom节点
        this.translateX = 0;
        this.touch = null;
        this.event = new Event(false);
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

        this.animationImgEl.addEventListener('load', () => {
            this.event.emit(LOAD_IMG_COMPLETE);
        }, false);
        this.animationImgEl.addEventListener('error', () => {
            this.event.emit(LOAD_IMG_FAIL);
        }, false);
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
                width: value.width || 0,
                height: value.height || 0
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
        const duration = this.opt.duration;
        if (duration !== undefined) {
            if (this.bgEl.style.transitionDuration !== undefined) {
                this.animationEl.style.transitionDuration =
                    this.bgEl.style.transitionDuration = `${duration}ms`;
            } else if (this.bgEl.style.webkitTransitionDuration !== undefined) {
                this.animationEl.style.webkitTransitionDuration =
                    this.bgEl.style.webkitTransitionDuration = `${duration}ms`;
            } else {
                debug('transition duration prop not found.');
            }
        }
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
        const imgEl = this.animationEl.children[0];
        const currentViewer = this._getCurrentViewer();
        // 动画起始的position数据
        const start = this._getPositionAndSize(type === 1 ? this.opt.fadeInFn(this.currentIndex) : currentViewer.panelEl);
        // 动画结束的position数据
        const end = this._getPositionAndSize(type === 1 ? currentViewer.panelEl : this.opt.fadeInFn(this.currentIndex));
        const scale = end.width / start.width;
        this.animationEl.style.width = start.width + 'px';
        this.animationEl.style.height = start.width + 'px';
        setScaleAndTranslateStyle(this.animationEl, 1, start.left, start.top);

        imgEl.src = url;
        this.event.once(LOAD_IMG_COMPLETE, () => {
            this.animationEl.classList.remove('hide');
            // 延迟20ms是为了确保动画元素节点完全呈现出来了，避免部分机型因为快速显示和隐藏元素导致的闪烁现象
            setTimeout(() => {
                this.viewerWrapperEl.style.visibility = 'hidden';
                this.el.classList.add('animation');
                this.bgEl.style.opacity = type === 1 ? 1 : 0.001;
                setScaleAndTranslateStyle(this.animationEl, scale, end.left, end.top);
                setTimeout(() => {
                    this.el.classList.remove('animation');
                    this.animationEl.classList.add('hide');
                    callback();
                }, duration + 20);
            }, 20);
        });
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
        if (this._getPrevImage().url) {
            this.currentIndex--;
            this.translateX += this.width;
            this.viewerWrapperEl.classList.add(ITEM_ANIMATION_CLASS);
            setTranslateStyle(this.viewerWrapperEl, this.translateX, 0);

            const image = this._getSpecificImage(this.currentIndex - 1);
            if (image.url || this.currentIndex === 0) {
                const viewer = this.loopViewers(1);
                viewer.init(image, viewer.displayIndex - 3, true);
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
        if (this._getNextImage().url) {
            this.currentIndex++;
            this.translateX -= this.width;
            this.viewerWrapperEl.classList.add(ITEM_ANIMATION_CLASS);
            setTranslateStyle(this.viewerWrapperEl, this.translateX, 0);

            const image = this._getSpecificImage(this.currentIndex + 1);
            if (image.url || this.currentIndex === this.imagesLength - 1) {
                const viewer = this.loopViewers(0);
                viewer.init(image, viewer.displayIndex + 3, true);
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
        if (isNumber(index) && index > -1 && index < this.imagesLength) {
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
        this.swipeInByIndex(this.currentIndex);
    }

    destroy() {
        this.el && removeElement(this.el);
    }

    close() {
        if (this.el) {
            this._fadeOut(() => {
                this.animationEl.children[0].src = '';
                this._getCurrentViewer().clearImg();
                this.el.style.display = 'none';
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
            this.bgEl.style.opacity = 0.001;
            this.viewerWrapperEl.style.visibility = 'hidden';
        }
        this.el.style.display = 'block';
        this.swipeInByIndex(this.currentIndex, false, () => {
            this._getCurrentViewer().removeAnimation();
            this._fadeIn(() => {
                this.bgEl.style.opacity = 1;
                this.viewerWrapperEl.style.visibility = 'visible';
                // 下面这个再次调用是为了加载大图
                this._getCurrentImage().thumbnail && this.viewers[1].init(this._getCurrentImage(), CENTER_IMG, true);
            });
        });
    }
}

export default ImageViewer;
