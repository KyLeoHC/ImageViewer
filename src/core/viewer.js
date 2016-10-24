import {
    query,
    setTranslateStyle,
    setScaleAndTranslateStyle
} from '../common/dom';
import {
    itemAnimationClass,
    lockName
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
        this.translateX = this.index < currentIndex ? (-2 * this.width) : (2 * this.width);
        this.translateY = 0;
        this.currentX = 0;         //当前正在移动的X轴距离(临时保存,当事件结束后,会赋值回translateX)
        this.currentY = 0;         //当前正在移动的Y轴距离(临时保存,当事件结束后,会赋值回translateY)
        this.scale = 1;
        this.currentScale = 1;     //当前正在缩放的倍数(临时保存,当事件结束后,会赋值回scale)
        this.translatePanelX = 0;
        this.translatePanelY = 0;
        this.currentPanelX = 0;
        this.currentPanelY = 0;

        setTranslateStyle(this.el, this.translateX, this.translateY);
        this._bindEvent();
    }

    _init(displayIndex, resetScale, fn) {
        let _initImage = (displayIndex) => {
            if (resetScale) {
                this.scale = 1;
                this.imageEl.style.width = this.imageEl.width > this.width ?
                    '100%' : (this.imageEl.width + 'px');
                this.imageEl.style.height = this.imageEl.height > this.height ?
                    '100%' : (this.imageEl.height + 'px');
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
        if (this.imageEl) {
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
            if (lock.getLockState(lockName)) {
                event.srcEvent.stopPropagation();
            }
        });
        mc.on('panmove', (event) => {
            if (lock.getLockState(lockName)) {
                event.srcEvent.stopPropagation();
                this._translatePanel(event.deltaX, event.deltaY);
            }
        });
        mc.on('panend', (event) => {
            if (lock.getLockState(lockName)) {
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
        if (this.realWidth < this.width || this.realHeight < this.height) {
            this._init();
        }
        //stopSwipe = this.isScale();
        return this;
    };

    _translatePanel(translatePanelX, translatePanelY) {
        if (this.realWidth <= this.width && this.realHeight <= this.height)return this;

        let currentPanelX, currentPanelY, differ;
        differ = (this.realWidth - this.width) / 2;//拖动边界判断
        if (differ > 0) {
            currentPanelX = translatePanelX / this.scale + this.translatePanelX;
            this.currentPanelX = currentPanelX > -differ && currentPanelX < differ ? currentPanelX : this.currentPanelX;
        }

        differ = (this.realHeight - this.height) / 2;//拖动边界判断
        if (differ > 0) {
            currentPanelY = translatePanelY / this.scale + this.translatePanelY;
            this.currentPanelY = currentPanelY > -differ && currentPanelY < differ ? currentPanelY : this.currentPanelY;
        }

        setScaleAndTranslateStyle(this.panelEl, this.scale, this.currentPanelX, this.currentPanelY);
        return this;
    };

    _translatePanelEnd(translatePanelX, translatePanelY) {
        if (this.realWidth <= this.width && this.realHeight <= this.height)return this;
        this.translatePanelX = isNaN(translatePanelX) ? this.currentPanelX : translatePanelX;
        this.translatePanelY = isNaN(translatePanelY) ? this.currentPanelY : translatePanelY;
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
            this.el.classList.add(itemAnimationClass);
        }
        return this;
    };

    removeAnimation() {
        this.el.classList.remove(itemAnimationClass);
        return this;
    };

    swipeToPrev(needAnimation) {
        this.addAnimation(needAnimation)._init(-1, true);
        return this;
    };

    swipeToCurrent(needReset, needAnimation) {
        this.addAnimation(needAnimation)._init(0, needReset, () => {
            if (this.isScale()) {
                lock.getLock(lockName);
            } else {
                lock.releaseLock(lockName);
            }
        });
        return this;
    };

    swipeToNext(needAnimation) {
        this.addAnimation(needAnimation)._init(1, true);
        return this;
    };
}

export default Viewer;