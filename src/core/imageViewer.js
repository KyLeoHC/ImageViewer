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
    ITEM_ANIMATION_CLASS
} from '../common/profile';
import lock from '../common/lock';
import Hammer from '../lib/hammer';
import Touch from './touch';
import Viewer from './viewer';

class ImageViewer {
    constructor(images = [], opt = {}) {
        this.opt = opt;
        this.el = null;
        this.headerEl = null;
        this.bodyEl = null;
        this.footerEl = null;
        this.currentNumberEl = null;
        this.totalNumberEl = null;
        this.images = images; // 图片数据
        this.imagesLength = images.length; // 图片数据
        this.container = opt.container || 'body';
        this.enableScale = opt.enableScale === undefined ? true : opt.enableScale; // 是否开启图片缩放功能
        this.currentIndex = opt.startIndex || 0; // 起始坐标，从0开始
        this.viewers = [];
        this.scaleStart = 1;
        this.width = 0;
        this.height = 0;
        this.itemList = []; // 各个图片容器元素的dom节点
        this.translateX = 0;
        this.hammer = null;
    }

    _create() {
        this.el = query('.image-viewer')[0];
        this.destroy();
        let imageViewerTemplate =
            `<div class="image-viewer">
                <div class="image-header"></div>
                <div class="image-body">
                    <div class="viewer"><div class="panel"><img></div></div>
                    <div class="viewer"><div class="panel"><img></div></div>
                    <div class="viewer"><div class="panel"><img></div></div>
                </div>
                <div class="image-footer"></div>
            </div>`;

        const divEl = document.createElement('div');
        divEl.innerHTML = imageViewerTemplate;
        this.el = divEl.firstElementChild;
        query(this.container)[0].appendChild(this.el);
        this.headerEl = query('.image-header', this.el)[0];
        this.bodyEl = query('.image-body', this.el)[0];
        this.footerEl = query('.image-footer', this.el)[0];
        this.itemList = query('.image-body', this.el)[0].children;
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
        this.swipeInByIndex(this.currentIndex);
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
        const touch = new Touch(this.el, {enableScale: this.enableScale});
        let mc = new Hammer.Manager(this.el);
        let hPinch = new Hammer.Pinch(), // 前缀h代表hammer
            hPan = new Hammer.Pan({direction: Hammer.DIRECTION_HORIZONTAL}),
            hTap = new Hammer.Tap({taps: 2});
        mc.add([hPinch, hPan, hTap]);
        touch.on('panstart', this._dealWithMoveActionStart.bind(this));
        touch.on('panmove', this._dealWithMoveAction.bind(this));
        touch.on('panend', this._dealWithMoveActionEnd.bind(this));
        if (this.enableScale) {
            mc.on('tap', this.reset.bind(this));
            touch.on('pinchstart', this._dealWithScaleActionStart.bind(this));
            touch.on('pinch', this._dealWithScaleAction.bind(this));
            touch.on('pinchend', this._dealWithScaleActionEnd.bind(this));
        }
        this.hammer = touch;
    }

    _dealWithMoveActionStart(event) {
        console.log(event, '_dealWithMoveActionStart');
        if (lock.getLockState(LOCK_NAME)) return;
        this.bodyEl.classList.remove(ITEM_ANIMATION_CLASS);
        this.opt.beforeSwipe && this.opt.beforeSwipe(this.currentIndex);
        this.bodyEl.style.willChange = 'transform';
    }

    _dealWithMoveAction(event, force) {
        // console.log(event, '_dealWithMoveAction');
        if (lock.getLockState(LOCK_NAME) && !force) return;
        force && this.bodyEl.classList.remove(ITEM_ANIMATION_CLASS);
        setTranslateStyle(this.bodyEl, this.translateX + event.deltaX, 0);
    }

    _dealWithMoveActionEnd(event, force) {
        if (lock.getLockState(LOCK_NAME) && !force) return;
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
            distance !== 0 && this.bodyEl.classList.add(ITEM_ANIMATION_CLASS);
            if (distance !== 0 && this._checkDistance(distance)) {
                this.viewers.forEach((viewer) => {
                    viewer.removeAnimation();
                });
                needSwipe = distance > 0 ? this.swipeToPrev() : this.swipeToNext();
                this._updateCountElement();
            } else {
                setTranslateStyle(this.bodyEl, this.translateX, 0);
            }
            this.opt.afterSwipe && this.opt.afterSwipe(this.currentIndex);
        }
        this.bodyEl.style.willChange = 'auto';
        return needSwipe;
    }

    _dealWithScaleActionStart(event) {
        console.log(event, '_dealWithScaleActionStart');
        this.scaleStart = event.scale;
        this.viewers[1]._pinchStart();
    }

    _dealWithScaleAction(event) {
        this.viewers[1]._pinch(event.scale - this.scaleStart);
    }

    _dealWithScaleActionEnd() {
        this.viewers[1]._pinchEnd();
    }

    _checkDistance(distance = 0) {
        return Math.abs(distance) > this.width / 5;
    }

    _getPrevImage() {
        let minuend = this.currentIndex;
        if (this.opt.loop && this.imagesLength > 2) {
            minuend = this.currentIndex === 0 ? this.imagesLength : this.currentIndex;
        }
        return this.images[minuend - 1] || '';
    }

    _getCurrentImage() {
        return this.images[this.currentIndex] || '';
    }

    _getNextImage() {
        let addend = this.currentIndex;
        if (this.opt.loop && this.imagesLength > 2) {
            addend = this.currentIndex === this.imagesLength - 1 ? -1 : this.currentIndex;
        }
        return this.images[addend + 1] || '';
    }

    _getSpecificImage(index) {
        return this.images[index] || '';
    }

    _getPositionAndSize(index) {
        // TODO: 默认的获取元素相对viewport坐标和尺寸函数
    }

    /**
     * 重置当前图片的缩放
     */
    reset() {
        const viewer = this.viewers[1];
        viewer.init(viewer.displayIndex, true, null, false);
        setTimeout(() => {
            lock.releaseLock(LOCK_NAME);
        }, 0);
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
        let prevImage = this._getPrevImage();
        if (prevImage) {
            this.currentIndex--;
            this.translateX += this.width;
            setTranslateStyle(this.bodyEl, this.translateX, 0);

            let image = this._getSpecificImage(this.currentIndex - 1);
            if (image || this.currentIndex === 0) {
                let viewer = this.loopViewers(1);
                viewer.init(viewer.displayIndex - 3, true, null, true, image);
            }
            return true;
        } else {
            setTranslateStyle(this.bodyEl, this.translateX, 0);
            return false;
        }
    }

    /**
     * 滑动到下一张
     * @returns {boolean}
     */
    swipeToNext() {
        let nextImage = this._getNextImage();
        if (nextImage) {
            this.currentIndex++;
            this.translateX -= this.width;
            setTranslateStyle(this.bodyEl, this.translateX, 0);

            let image = this._getSpecificImage(this.currentIndex + 1);
            if (image || this.currentIndex === this.imagesLength - 1) {
                let viewer = this.loopViewers(0);
                viewer.init(viewer.displayIndex + 3, true, null, true, image);
            }
            return true;
        } else {
            setTranslateStyle(this.bodyEl, this.translateX, 0);
            return false;
        }
    }

    /**
     * 根据给定的下标移动到指定图片处
     * @param index 数组下标，从0开始
     */
    swipeInByIndex(index) {
        if (!isNaN(index) && -1 < index && index < this.imagesLength) {
            this.currentIndex = index;
            this.translateX = 0;
            setTranslateStyle(this.bodyEl, 0, 0);

            this.viewers = this.viewers.sort(function (a, b) {
                return a.index < b.index;
            });
            this.viewers[0].init(-1, true, null, true, this._getPrevImage());
            this.viewers[1].init(0, true, null, true, this._getCurrentImage());
            this.viewers[2].init(1, true, null, true, this._getNextImage());

            this._updateCountElement();
        } else {
            debug('illegal index!');
        }
    }

    setImageOption(images = [], startIndex = 0) {
        if (!images.length) {
            debug('images array can not be empty!')
        }
        this.images = images;
        this.imagesLength = images.length;
        this.currentIndex = startIndex;
        this._init();
    }

    destroy() {
        this.el && removeElement(this.el);
    }

    close() {
        if (this.el) {
            this.el.style.display = 'none';
        }
    }

    open(index) {
        this.currentIndex = index === undefined ? this.currentIndex : index;
        if (!this.el) {
            // 仅仅实例化，但尚未初始化
            this._create();
            this._init();
            this._bindEvent();
        } else {
            this.swipeInByIndex(this.currentIndex);
        }
        this.el.style.display = 'block';
    }
}

export default ImageViewer;