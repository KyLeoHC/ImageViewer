import {
    query,
    setTranslateStyle,
    setScaleAndTranslateStyle
} from '../common/dom';
import {
    ITEM_ANIMATION_CLASS,
    LOCK_NAME
} from '../common/profile';
import lock from '../common/lock';
import Event from '../common/event';
import Hammer from '../lib/hammer';

class Viewer {
    constructor(imageViewer, el, width, height, index) {
        this.event = new Event(false);
        this.imageViewer = imageViewer;
        this.el = el;              // .viewer类
        this.panelEl = el.firstElementChild; // .panel类
        this.imageEl = query('img', this.el)[0];
        this.src = '';
        this.index = index;        // viewer排序用，记录原始的数组位置
        this.displayIndex = 0;
        this.width = width;
        this.height = height;
        this.realWidth = 0;
        this.realHeight = 0;
        this.translateX = 0;
        this.translateY = 0;
        this.scale = 1;            // 缩放比例
        this.currentScale = 1;     // 当前正在缩放的倍数(临时保存,当事件结束后,会赋值回scale)
        this.translatePanelX = 0;  // 最终图片面板所在的X轴坐标
        this.translatePanelY = 0;  // 最终图片面板所在的Y轴坐标
        this.currentPanelX = 0;    // 当前图片面板所在的X轴坐标（手指尚未离开屏幕）
        this.currentPanelY = 0;    // 当前图片面板所在的Y轴坐标（手指尚未离开屏幕）
        this.allowDistanceX = 0;   // 图片放大后，允许拖动的最大X轴距离
        this.allowDistanceY = 0;   // 图片放大后，允许拖动的最大Y轴距离
        this.needResetX = false;   // 拖动图片超出边界时，需要重置一下x轴的坐标
        this.needResetY = false;   // 拖动图片超出边界时，需要重置一下y轴的坐标
        this.deltaX = 0;           // 存储起始的X轴偏移量
        this.deltaY = 0;           // 存储起始的Y轴偏移量
        this.EVENT_NAME = 'IMG_LOAD_COMPLETE';
        this._bindEvent();
    }

    init(displayIndex = 0, resetScale, fn, needLoad = true, src) {
        const _initImage = () => {
            if (resetScale) {
                this.scale = 1;
                this.allowDistanceX = this.allowDistanceY = 0;
            }
            if (needLoad) {
                this.imageEl.style.display = '';
            }
            this.translatePanelX = 0;
            this.translatePanelY = 0;
            this.currentPanelX = 0;
            this.currentPanelY = 0;
            this.realWidth = this.panelEl.clientWidth * this.scale;
            this.realHeight = this.panelEl.clientHeight * this.scale;
            this.translateX = this.displayIndex * this.width;
            this.translateY = -this.el.clientHeight / 2;
            this.needResetX = this.needResetY = false;
            setScaleAndTranslateStyle(this.panelEl, this.scale, this.translatePanelX, this.translatePanelY);
            setTranslateStyle(this.el, this.translateX, this.translateY);
            fn && fn.apply(this);
        };
        this.displayIndex = displayIndex;

        if (needLoad) {
            this.src = src;
            this.imageEl.src = this.src;
            this.imageEl.style.display = 'none';
            this.event.on(this.EVENT_NAME, () => {
                _initImage();
            });
            setTranslateStyle(this.el, this.displayIndex * this.width, this.translateY);
        } else {
            _initImage();
        }
        return this;
    }

    _bindEvent() {
        let mc = new Hammer.Manager(this.panelEl);
        mc.add(new Hammer.Pan());
        mc.on('panstart', (event) => {
            this.removeAnimation();
            if (lock.getLockState(LOCK_NAME)) {
                this.deltaX = event.deltaX;
                this.deltaY = event.deltaY;
            }
        });
        mc.on('panmove', (event) => {
            if (lock.getLockState(LOCK_NAME)) {
                event.preventDefault();
                this._translatePanel(event.deltaX - this.deltaX, event.deltaY - this.deltaY);
            }
        });
        mc.on('panend', (event) => {
            if (lock.getLockState(LOCK_NAME)) {
                this._translatePanelEnd(event.deltaX - this.deltaX);
            }
        });

        this.imageEl.addEventListener('load', () => {
            this.event.emit(this.EVENT_NAME);
        }, false);
    }

    _pinchStart() {
        this.removeAnimation();
        this.panelEl.style.willChange = 'transform';
    }

    _pinch(scale) {
        let currentScale = scale * this.scale + this.scale;
        if (currentScale > 0.5 && currentScale < 8) {
            this.currentScale = currentScale;
            setScaleAndTranslateStyle(this.panelEl, this.currentScale, this.translatePanelX, this.translatePanelY);
        }
        return this;
    }

    _pinchEnd(scale) {
        this.scale = isNaN(scale) ? this.currentScale : scale;
        this.realWidth = this.panelEl.clientWidth * this.scale;
        this.realHeight = this.panelEl.clientHeight * this.scale;
        this.allowDistanceX = (this.realWidth - this.width) / 2 / this.scale + 2;
        this.allowDistanceY = (this.realHeight - this.height) / 2 / this.scale + 2;
        if (this.realWidth < this.width || this.realHeight < this.height) {
            this.init(this.displayIndex, false, null, false);
        }
        if (this.isScale()) {
            lock.getLock(LOCK_NAME);
        } else {
            lock.releaseLock(LOCK_NAME);
        }
        this.panelEl.style.willChange = 'auto';
        return this;
    }

    _calculate(a, b) {
        return a > 0 ? (a - b) : (a + b);
    }

    _translatePanel(translatePanelX, translatePanelY) {
        let tempX = 0;
        if (this.realWidth <= this.width && translatePanelX) {
            this.imageViewer._dealWithMoveAction({deltaX: translatePanelX}, true);
        } else {
            if (this.allowDistanceX > 0 && translatePanelX) {
                this.currentPanelX = translatePanelX / this.scale + this.translatePanelX;
                this.needResetX = !(-this.allowDistanceX < this.currentPanelX && this.currentPanelX < this.allowDistanceX);
            }

            if (this.needResetX) {
                this.imageViewer._dealWithMoveAction({deltaX: this._calculate(this.currentPanelX, this.allowDistanceX)}, true);
                tempX = this.currentPanelX > 0 ? this.allowDistanceX : -this.allowDistanceX;
            } else {
                this.imageViewer._dealWithMoveAction({deltaX: 0}, true);
                tempX = this.currentPanelX;
            }
        }
        if (this.allowDistanceY > 0 && translatePanelY) {
            this.currentPanelY = translatePanelY / this.scale + this.translatePanelY;
            this.needResetY = !(-this.allowDistanceY < this.currentPanelY && this.currentPanelY < this.allowDistanceY);
        }
        setScaleAndTranslateStyle(this.panelEl, this.scale, tempX, this.currentPanelY);
        return this;
    }

    _translatePanelEnd(translatePanelX) {
        let needSwipe = false;
        if (this.realWidth <= this.width && translatePanelX) {
            needSwipe = this.imageViewer._dealWithMoveActionEnd({deltaX: translatePanelX}, true);
        } else if (this.needResetX) {
            needSwipe = this.imageViewer._dealWithMoveActionEnd({deltaX: this._calculate(this.currentPanelX, this.allowDistanceX)}, true);
        }
        if (needSwipe) {
            // 滑动到下一张，重置当前图片的尺寸
            this.init(this.displayIndex, true, null, false);
            setTimeout(() => {
                lock.releaseLock(LOCK_NAME);
            }, 0);
        } else {
            if (this.needResetX) {
                this.translatePanelX = this.currentPanelX > 0 ? this.allowDistanceX : -this.allowDistanceX;
            } else {
                this.translatePanelX = this.currentPanelX;
            }
            if (this.needResetY) {
                this.translatePanelY = this.currentPanelY > 0 ? this.allowDistanceY : -this.allowDistanceY;
            } else {
                this.translatePanelY = this.currentPanelY;
            }
            if (this.needResetX || this.needResetY) {
                this.addAnimation();
                setScaleAndTranslateStyle(this.panelEl, this.scale, this.translatePanelX, this.translatePanelY);
            }
            this.needResetX = this.needResetY = false;
        }
        return this;
    }

    isScale() {
        return Math.abs(this.scale - 1) > 0.01;
    }

    addAnimation() {
        this.panelEl.classList.add(ITEM_ANIMATION_CLASS);
        this.el.classList.add(ITEM_ANIMATION_CLASS);
    }

    removeAnimation() {
        this.panelEl.classList.remove(ITEM_ANIMATION_CLASS);
        this.el.classList.remove(ITEM_ANIMATION_CLASS);
    }
}

export default Viewer;