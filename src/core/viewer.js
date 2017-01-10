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
import Hammer from '../lib/hammer';

class Viewer {
    constructor(src, el, index, width, height, currentIndex) {
        this.el = el;
        this.panelEl = el.firstElementChild;
        this.imageEl = null;
        this.src = src;
        this.index = index;
        this.width = width;
        this.height = height;
        this.realWidth = 0;
        this.realHeight = 0;
        this.translateX = (this.index < currentIndex ? -2 : 2) * this.width;
        this.translateY = 0;
        this.currentX = 0;         //当前正在移动的X轴距离(临时保存,当事件结束后,会赋值回translateX)
        this.currentY = 0;         //当前正在移动的Y轴距离(临时保存,当事件结束后,会赋值回translateY)
        this.scale = 1;            //缩放比例
        this.currentScale = 1;     //当前正在缩放的倍数(临时保存,当事件结束后,会赋值回scale)
        this.translatePanelX = 0;  //最终图片面板所在的X轴坐标
        this.translatePanelY = 0;  //最终图片面板所在的Y轴坐标
        this.currentPanelX = 0;    //当前图片面板所在的X轴坐标（手指尚未离开屏幕）
        this.currentPanelY = 0;    //当前图片面板所在的Y轴坐标（手指尚未离开屏幕）
        this.allowDistanceX = 0;   //图片放大后，允许拖动的最大X轴距离
        this.allowDistanceY = 0;   //图片放大后，允许拖动的最大Y轴距离
        this.needResetX = false;   //拖动图片超出边界时，需要重置一下x轴的坐标
        this.needResetY = false;   //拖动图片超出边界时，需要重置一下y轴的坐标

        setTranslateStyle(this.el, this.translateX, this.translateY);
        this._bindEvent();
    }

    _init(displayIndex, resetScale, fn, needLoad = true) {
        let _initImage = (displayIndex) => {
            if (resetScale) {
                this.scale = 1;
                this.allowDistanceX = this.allowDistanceY = 0;
                if (this.imageEl) {
                    this.imageEl.style.width = this.imageEl.width > this.width ?
                        '100%' : (this.imageEl.width + 'px');
                    this.imageEl.style.height = this.imageEl.height > this.height ?
                        '100%' : (this.imageEl.height + 'px');
                }
            }
            this.translatePanelX = 0;
            this.translatePanelY = 0;
            this.currentPanelX = 0;
            this.currentPanelY = 0;
            this.realWidth = this.panelEl.clientWidth * this.scale;
            this.realHeight = this.panelEl.clientHeight * this.scale;
            this.translateX = (displayIndex || 0) * this.width;
            this.translateY = -this.el.clientHeight / 2;
            setScaleAndTranslateStyle(this.panelEl, this.scale, this.translatePanelX, this.translatePanelY);
            setTranslateStyle(this.el, this.translateX, this.translateY);
            fn && fn.apply(this);
        };
        if (this.imageEl || !needLoad) {
            _initImage(displayIndex);
        } else {
            this.imageEl = query('img', this.el)[0];
            this.imageEl.src = this.src;
            this.imageEl.onload = () => {
                _initImage(displayIndex);
            };
        }
        return this;
    };

    _bindEvent() {
        let mc = new Hammer.Manager(this.panelEl);
        mc.add(new Hammer.Pan());
        mc.on('panstart', (event) => {
            if (lock.getLockState(LOCK_NAME)) {
                event.preventDefault();
                event.srcEvent.stopPropagation();
            }
        });
        mc.on('panmove', (event) => {
            if (lock.getLockState(LOCK_NAME)) {
                event.preventDefault();
                event.srcEvent.stopPropagation();
                this._translatePanel(event.deltaX, event.deltaY);
            }
        });
        mc.on('panend', (event) => {
            if (lock.getLockState(LOCK_NAME)) {
                event.preventDefault();
                event.srcEvent.stopPropagation();
                this._translatePanelEnd();
            }
        });
    };

    _pinch(scale) {
        let currentScale = scale + this.scale;
        if (currentScale > 0.5 && currentScale < 2) {
            this.currentScale = currentScale;
            setScaleAndTranslateStyle(this.panelEl, this.currentScale, this.translatePanelX, this.translatePanelY);
        }
        return this;
    };

    _pinchEnd(scale) {
        this.scale = isNaN(scale) ? this.currentScale : scale;
        this.realWidth = this.panelEl.clientWidth * this.scale;
        this.realHeight = this.panelEl.clientHeight * this.scale;
        this.allowDistanceX = (this.realWidth - this.width) / 2;
        this.allowDistanceY = (this.realHeight - this.height) / 2;
        if (this.realWidth < this.width || this.realHeight < this.height) {
            this._init();
        }
        if (this.isScale()) {
            lock.getLock(LOCK_NAME);
        } else {
            lock.releaseLock(LOCK_NAME);
        }
        return this;
    };

    _translatePanel(translatePanelX, translatePanelY) {
        if (this.realWidth <= this.width && this.realHeight <= this.height)return this;

        if (this.allowDistanceX > 0) {
            this.currentPanelX = translatePanelX / this.scale + this.translatePanelX;
            this.needResetX = !(-this.allowDistanceX < this.currentPanelX && this.currentPanelX < this.allowDistanceX);
        }

        if (this.allowDistanceY > 0) {
            this.currentPanelY = translatePanelY / this.scale + this.translatePanelY;
            this.needResetY = !(-this.allowDistanceY < this.currentPanelY && this.currentPanelY < this.allowDistanceY);
        }

        setScaleAndTranslateStyle(this.panelEl, this.scale, this.currentPanelX, this.currentPanelY);
        return this;
    };

    _translatePanelEnd() {
        if (this.realWidth <= this.width && this.realHeight <= this.height)return this;
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
        (this.needResetX || this.needResetY) && setScaleAndTranslateStyle(this.panelEl, this.scale, this.translatePanelX, this.translatePanelY);
        this.needResetX = this.needResetY = false;
        return this;
    };

    _translate(translateX) {
        this.currentX = isNaN(translateX) ? this.translateX : (translateX + this.translateX);
        this.currentY = this.translateY;
        setTranslateStyle(this.el, this.currentX, this.currentY);
        return this;
    };

    isScale() {
        return Math.abs(this.scale - 1) > 0.01;
    };

    addAnimation(needAnimation) {
        if (needAnimation || needAnimation === undefined) {
            this.el.classList.add(ITEM_ANIMATION_CLASS);
        }
        return this;
    };

    removeAnimation() {
        this.el.classList.remove(ITEM_ANIMATION_CLASS);
        return this;
    };

    swipeToPrev(needAnimation) {
        this.addAnimation(needAnimation)._init(-1, true);
        return this;
    };

    swipeToCurrent(needReset, needAnimation) {
        this.addAnimation(needAnimation)._init(0, needReset, () => {
            if (this.isScale()) {
                lock.getLock(LOCK_NAME);
            } else {
                lock.releaseLock(LOCK_NAME);
            }
        });
        return this;
    };

    swipeToNext(needAnimation) {
        this.addAnimation(needAnimation)._init(1, true);
        return this;
    };

    swipeOut(currentIndex) {
        this.removeAnimation()._init(this.index < currentIndex ? -2 : 2, true, undefined, false);
        return this;
    };
}

export default Viewer;