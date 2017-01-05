import {
    warn
} from '../common/debug';
import {
    query,
    removeElement
} from '../common/dom';
import {
    LOCK_NAME
} from '../common/profile';
import lock from '../common/lock';
import Hammer from '../lib/hammer';
import Viewer from './viewer';

class ImageViewer {
    constructor(images = [], opt = {}) {
        this.el = null;
        this.images = images; //图片数据
        this.opt = opt;
        this.enableScale = opt.enableScale === undefined ? true : opt.enableScale;//是否开启图片缩放功能
        this.currentIndex = opt.startIndex || 0; //起始坐标，从0开始
        this.viewers = [];
        this.scaleStart = 1;
        this.width = 0;
        this.height = 0;
        this.itemList = [];//各个图片容器元素的dom节点
    }

    _generateViewerDom() {
        return this.images.map(function () {
            return `<div class="viewer"><div class="panel"><img></div></div>`
        }).join();
    }

    _create() {
        this.el = query('.image-viewer')[0];
        this.destroy();
        let imageViewerTemplate =
            `<div class="image-viewer">
            ${this._generateViewerDom()}
            </div>`;

        let divEl = document.createElement('div');
        divEl.innerHTML = imageViewerTemplate;
        this.el = divEl.firstElementChild;
        query('body')[0].appendChild(this.el);
        this.itemList = this.el.children;
        this.width = this.el.clientWidth;
        this.height = this.el.clientHeight;
    };

    _init() {
        let i, length, item;
        this.viewers = [];
        for (i = 0, length = this.itemList.length; i < length; i++) {
            item = this.itemList[i];
            this.viewers.push(new Viewer(this.images[i], item, i, this.width, this.height, this.currentIndex));
        }
        this.swipeInByIndex(undefined, false);
        lock.addLock(LOCK_NAME);
    };

    _bindEvent() {
        let mc = new Hammer.Manager(this.el);
        let hPinch = new Hammer.Pinch(),//前缀h代表hammer
            hPan = new Hammer.Pan(),
            hTap = new Hammer.Tap({taps: 2});
        mc.add([hPinch, hPan, hTap]);
        mc.on('panstart', this._dealWithMoveActionStart.bind(this));
        mc.on('panmove', this._dealWithMoveAction.bind(this));
        mc.on('panend', this._dealWithMoveActionEnd.bind(this));
        if (this.enableScale) {
            mc.on('tap', this._reset.bind(this));
            mc.on('pinchstart', this._dealWithScaleActionStart.bind(this));
            mc.on('pinch', this._dealWithScaleAction.bind(this));
            mc.on('pinchend', this._dealWithScaleActionEnd.bind(this));
        }
    };

    _reset() {
        this.getCurrentViewer().swipeToCurrent(true);
    };

    _dealWithMoveActionStart() {
        if (lock.getLockState(LOCK_NAME))return;
        let prevViewer = this.getPrevViewer(),
            currentViewer = this.getCurrentViewer(),
            nextViewer = this.getNextViewer();

        this.opt.beforeSwipe && this.opt.beforeSwipe(currentViewer.index);

        prevViewer && prevViewer.removeAnimation();
        currentViewer && currentViewer.removeAnimation();
        nextViewer && nextViewer.removeAnimation();
    };

    _dealWithMoveAction(event) {
        if (lock.getLockState(LOCK_NAME))return;
        let prevViewer = this.getPrevViewer(),
            currentViewer = this.getCurrentViewer(),
            nextViewer = this.getNextViewer();

        prevViewer && prevViewer._translate(event.deltaX);
        currentViewer && currentViewer._translate(event.deltaX);
        nextViewer && nextViewer._translate(event.deltaX);
    };

    _dealWithMoveActionEnd(event) {
        if (lock.getLockState(LOCK_NAME))return;
        let distanceX = event.deltaX, index;
        let prevViewer = this.getPrevViewer(),
            nextViewer = this.getNextViewer();

        if (Math.abs(distanceX) < this.width / 5) {
            index = undefined;
        } else if (distanceX > 0) {
            index = prevViewer ? prevViewer.index : undefined;
        } else {
            index = nextViewer ? nextViewer.index : undefined;
        }
        this.swipeInByIndex(index);
        this.opt.afterSwipe && this.opt.afterSwipe(index || this.getCurrentViewer().index);
    };

    _dealWithScaleActionStart(event) {
        this.scaleStart = event.scale;
    };

    _dealWithScaleAction(event) {
        this.getCurrentViewer()._pinch(event.scale - this.scaleStart);
    };

    _dealWithScaleActionEnd() {
        this.getCurrentViewer()._pinchEnd();
    };

    getPrevViewer() {
        return this.viewers[this.currentIndex - 1] || null;
    };

    getCurrentViewer() {
        return this.viewers[this.currentIndex];
    };

    getNextViewer() {
        return this.viewers[this.currentIndex + 1] || null;
    };

    swipeInByIndex(index, needAnimation) {
        let currentIndex = isNaN(index) ? this.currentIndex : index;
        let prevViewer, currentViewer, nextViewer;
        if (-1 < currentIndex && currentIndex < this.images.length) {
            this.currentIndex = currentIndex;
            prevViewer = this.getPrevViewer();
            currentViewer = this.getCurrentViewer();
            nextViewer = this.getNextViewer();

            prevViewer && prevViewer.swipeToPrev(needAnimation);
            currentViewer && currentViewer.swipeToCurrent(true, needAnimation);
            nextViewer && nextViewer.swipeToNext(needAnimation);
        } else {
            warn('illegal index!');
        }
    };

    setImageOption(images = [], startIndex = 0) {
        if (!images.length) {
            warn('images array can not be empty!')
        }
        this.images = images;
        this.currentIndex = startIndex;
        this.el.innerHTML = this._generateViewerDom();
        this.itemList = this.el.children;
        this._init();
    }

    destroy() {
        this.el && removeElement(this.el);
    };

    close() {
        if (this.el) {
            this.el.style.display = 'none';
        }
    };

    open() {
        if (!this.el) {
            //仅仅实例化，但尚未初始化
            this._create();
            this._init();
            this._bindEvent();
        }
        this.el.style.display = 'block';
    };
}

export default ImageViewer;