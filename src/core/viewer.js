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
    constructor(imageViewer, src, el, index, width, height, currentIndex) {
        this.imageViewer = imageViewer;
        this.el = el;             //.viewer类
        this.panelEl = el.firstElementChild;//.panel类
        this.imageEl = null;
        this.src = src;
        this.index = index;
        this.displayIndex = 2;
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
        let _initImage = () => {
            if (resetScale) {
                this.scale = 1;
                this.allowDistanceX = this.allowDistanceY = 0;
                if (this.imageEl && this.imageEl.width && this.imageEl.height) {
                    this.imageEl.style.display = '';
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
            this.translateX = (this.displayIndex || 0) * this.width;
            this.translateY = -this.el.clientHeight / 2;
            setScaleAndTranslateStyle(this.panelEl, this.scale, this.translatePanelX, this.translatePanelY);
            setTranslateStyle(this.el, this.translateX, this.translateY);
            fn && fn.apply(this);
        };
        this.displayIndex = displayIndex;

        if (this.imageEl || !needLoad) {
            _initImage();
        } else {
            this.imageEl = query('img', this.el)[0];
            this.imageEl.src = this.src;
            this.imageEl.style.display = 'none';
            this.imageEl.addEventListener('load', () => {
                _initImage();
            }, false);
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

        this.el.addEventListener('webkitTransitionEnd', () => {
            this.removeAnimation();
            this.panelEl.classList.remove(ITEM_ANIMATION_CLASS);
        }, false);
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
        this.allowDistanceX = (this.realWidth - this.width) / 2 / this.scale + 2;
        this.allowDistanceY = (this.realHeight - this.height) / 2 / this.scale + 2;
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

    calculate(a, b) {
        return a > 0 ? (a - b) : (a + b);
    }

    _translatePanel(translatePanelX, translatePanelY) {
        if (this.realWidth <= this.width && this.realHeight <= this.height)return this;
        if (this.allowDistanceX > 0 && translatePanelX) {
            this.currentPanelX = translatePanelX / this.scale + this.translatePanelX;
            this.needResetX = !(-this.allowDistanceX < this.currentPanelX && this.currentPanelX < this.allowDistanceX);
        }

        if (this.allowDistanceY > 0 && translatePanelY) {
            this.currentPanelY = translatePanelY / this.scale + this.translatePanelY;
            this.needResetY = !(-this.allowDistanceY < this.currentPanelY && this.currentPanelY < this.allowDistanceY);
        }

        if (this.needResetX
            && ((this.index === 0 && this.currentPanelX < 0)
            || (this.index !== 0 && this.index !== this.imageViewer.imagesLength - 1)
            || (this.index === this.imageViewer.imagesLength - 1 && this.currentPanelX > 0))) {
            //满足以下三个条件才允许外部容器移动(前提条件是当前图片在面板容器内滑动到了X轴允许的最大边界)
            //1.当前图片是第一张并且是往左滑动切换到下一张时
            //2.图片数量超过2张，并且当前图片既不是第一张也不是最后一张
            //3.当前图片是最后一张并且是往右滑动切换到上一张时
            this.imageViewer._dealWithMoveAction({deltaX: this.calculate(this.currentPanelX, this.allowDistanceX)}, true);
            setScaleAndTranslateStyle(this.panelEl, this.scale, this.currentPanelX > 0 ? this.allowDistanceX : -this.allowDistanceX, this.currentPanelY);
        } else {
            if (this.imageViewer.imagesLength > 1) {
                if (this.index === 0 && this.currentPanelX >= 0) {
                    this.imageViewer.viewers[1].removeAnimation();
                } else if (this.index === this.imageViewer.imagesLength - 1 && this.currentPanelX <= 0) {
                    this.imageViewer.viewers[this.imageViewer.imagesLength - 2].removeAnimation();
                }
            }
            this.imageViewer._dealWithMoveAction({deltaX: 0}, true);
            setScaleAndTranslateStyle(this.panelEl, this.scale, this.currentPanelX, this.currentPanelY);
        }
        return this;
    };

    _translatePanelEnd() {
        if (this.realWidth <= this.width && this.realHeight <= this.height)return this;
        let index;
        if (this.needResetX) {
            index = this.imageViewer._dealWithMoveActionEnd({deltaX: this.calculate(this.currentPanelX, this.allowDistanceX)}, true);
        }
        if (index === undefined) {
            this._translate(0);
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
                this.panelEl.classList.add(ITEM_ANIMATION_CLASS);
                this.addAnimation();
                setScaleAndTranslateStyle(this.panelEl, this.scale, this.translatePanelX, this.translatePanelY);
            }
        }

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
            setTimeout(() => {
                if (this.isScale()) {
                    lock.getLock(LOCK_NAME);
                } else {
                    lock.releaseLock(LOCK_NAME);
                }
            }, 0);
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