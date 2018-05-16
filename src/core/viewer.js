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
import {isNumber} from '../common/utils';

let id = 0;
const noop = () => {
};

class Viewer {
    constructor(imageViewer, el, width, height, index) {
        this.id = ++id;
        this.src = ''; // 当前图片的url，会同步赋值到图片标签的src属性
        this.event = new Event(false);
        this.imageViewer = imageViewer;
        this.el = el; // .viewer类
        this.panelEl = el.firstElementChild; // .panel类
        this.imageEl = query('img', this.el)[0];
        this.tipsEl = query('span', this.el)[0];
        this.imageOption = null;
        this.index = index; // viewer排序用，记录原始的数组位置
        this.displayIndex = 0;
        this.width = width;
        this.height = height;
        this.realWidth = 0;
        this.realHeight = 0;
        this.translateX = 0;
        this.translateY = 0;
        this.scale = 1; // 缩放比例
        this.currentScale = 1; // 当前正在缩放的倍数(临时保存,当事件结束后,会赋值回scale)
        this.translatePanelX = 0; // 最终图片面板所在的X轴坐标
        this.translatePanelY = 0; // 最终图片面板所在的Y轴坐标
        this.currentPanelX = 0; // 当前图片面板所在的X轴坐标（手指尚未离开屏幕）
        this.currentPanelY = 0; // 当前图片面板所在的Y轴坐标（手指尚未离开屏幕）
        this.allowDistanceX = 0; // 图片放大后，允许拖动的最大X轴距离
        this.allowDistanceY = 0; // 图片放大后，允许拖动的最大Y轴距离
        this.needResetX = false; // 拖动图片超出边界时，需要重置一下x轴的坐标
        this.needResetY = false; // 拖动图片超出边界时，需要重置一下y轴的坐标
        this.SUCCESS_EVENT = 'LOAD_COMPLETE';
        this.FAIL_EVENT = 'LOAD_FAIL';
        this._bindEvent();
    }

    _initImage(resetScale, fn = noop) {
        if (resetScale) {
            this.scale = 1;
            this.allowDistanceX = this.allowDistanceY = 0;
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
        fn();
    }

    /**
     * 初始化图片以及容器
     * @param imageOption 图片选项数据
     * @param displayIndex 显示的位置
     * @param resetScale 是否重置缩放倍数
     * @param needLoadLarge 是否加载大图
     * @param fn 初始化完成的回调函数
     */
    init(imageOption = this.imageOption, displayIndex = this.displayIndex, resetScale = false, needLoadLarge = true, fn) {
        let src = '';
        const success = force => {
            if (this.src === src || force) {
                this.imageEl.style.display = '';
                this.tipsEl.innerText = '';
                this._initImage(resetScale, fn);
            }
        };
        const fail = force => {
            if (this.src === src || force) {
                this.imageEl.style.display = 'none';
                if (src) {
                    this.tipsEl.innerText = '图片加载失败';
                }
            }
        };

        this.imageOption = imageOption;
        this.displayIndex = displayIndex;

        if (needLoadLarge && this.src !== this.imageOption.url) {
            if (imageOption._hasLoadLarge) {
                // 大图已加载好的情况下
                src = imageOption.url;
            } else {
                src = imageOption.thumbnail;
                if (src) {
                    if (this.isActive()) {
                        this.imageViewer.showLoading();
                        window.requestAnimationFrame(() => {
                            // 缩略图存在的情况下，后台加载大图
                            this.loadImg(imageOption.url, () => {
                                // 判断当前viewer的url是否和当时正在加载的图片一致
                                // 因为存在可能图片尚未加载完用户就切换到下一张图片的情况
                                if (this.src === imageOption.thumbnail && this.isActive()) {
                                    this.imageViewer.hideLoading();
                                    this._setImageUrl(imageOption.url);
                                    success(true);
                                }
                                imageOption._hasLoadLarge = true;
                            }, () => {
                                if (this.src === imageOption.thumbnail && this.isActive()) {
                                    this.imageViewer.hideLoading();
                                    fail(true);
                                }
                                imageOption._hasLoadLarge = true;
                            });
                        });
                    }
                } else {
                    src = imageOption.url;
                    this.imageEl.style.display = 'none';
                }
            }
        } else {
            src = imageOption.thumbnail || imageOption.url;
        }

        this._setImageUrl(src);
        this.event.on(this.SUCCESS_EVENT, success);
        this.event.on(this.FAIL_EVENT, fail);
        setTranslateStyle(this.el, this.displayIndex * this.width, this.translateY);
    }

    /**
     * 设置图片链接
     * @param url
     * @private
     */
    _setImageUrl(url) {
        this.imageEl.src = this.src = url;
    }

    /**
     * 加载图片
     * @param url
     * @param success
     * @param fail
     */
    loadImg(url = '', success, fail) {
        const img = new Image();
        img.onload = () => success();
        img.onerror = () => fail();
        img.src = url;
    }

    /**
     * 判断是否是当前所展示的viewer
     * @returns {boolean}
     */
    isActive() {
        return this.imageViewer._getCurrentViewer().id === this.id;
    }

    _bindEvent() {
        this.imageEl.addEventListener('load', () => {
            this.event.emit(this.SUCCESS_EVENT);
        }, false);
        this.imageEl.addEventListener('error', () => {
            this.event.emit(this.FAIL_EVENT);
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
    }

    _pinchEnd(scale) {
        this.scale = isNumber(scale) ? scale : this.currentScale;
        this.realWidth = this.panelEl.clientWidth * this.scale;
        this.realHeight = this.panelEl.clientHeight * this.scale;
        this.allowDistanceX = (this.realWidth - this.width) / 2 / this.scale + 2;
        this.allowDistanceY = (this.realHeight - this.height) / 2 / this.scale + 2;
        if (this.realWidth < this.width || this.realHeight < this.height) {
            this.addAnimation();
            this._initImage(false);
        }
        window.requestAnimationFrame(() => {
            if (this.isScale()) {
                lock.getLock(LOCK_NAME);
            } else {
                lock.releaseLock(LOCK_NAME);
            }
            this.panelEl.style.willChange = 'auto';
        });
    }

    _calculate(a, b) {
        return a > 0 ? (a - b) : (a + b);
    }

    _translatePanelStart() {
        this.removeAnimation();
    }

    _translatePanel(event) {
        let tempX = 0;
        const translatePanelX = event.deltaX;
        const translatePanelY = event.deltaY;
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
    }

    _translatePanelEnd(event) {
        let needSwipe = false;
        const translatePanelX = event.deltaX;
        if (this.realWidth <= this.width && translatePanelX) {
            needSwipe = this.imageViewer._dealWithMoveActionEnd({deltaX: translatePanelX}, true);
        } else if (this.needResetX) {
            needSwipe = this.imageViewer._dealWithMoveActionEnd({deltaX: this._calculate(this.currentPanelX, this.allowDistanceX)}, true);
        }
        if (needSwipe) {
            // 滑动到下一张，重置当前图片的尺寸
            this._initImage(true);
            window.requestAnimationFrame(() => {
                lock.releaseLock(LOCK_NAME);
            });
        } else {
            if (this.needResetX) {
                this.translatePanelX = this.currentPanelX > 0
                    ? this.allowDistanceX : -this.allowDistanceX;
            } else {
                this.translatePanelX = this.currentPanelX;
            }
            if (this.needResetY) {
                this.translatePanelY = this.currentPanelY > 0
                    ? this.allowDistanceY : -this.allowDistanceY;
            } else {
                this.translatePanelY = this.currentPanelY;
            }
            if (this.needResetX || this.needResetY) {
                window.requestAnimationFrame(() => {
                    this.addAnimation();
                    setScaleAndTranslateStyle(this.panelEl, this.scale, this.translatePanelX, this.translatePanelY);
                });
            }
            this.needResetX = this.needResetY = false;
        }
    }

    isScale() {
        return Math.abs(this.scale - 1) > 0.001;
    }

    addAnimation() {
        this.panelEl.classList.add(ITEM_ANIMATION_CLASS);
        this.el.classList.add(ITEM_ANIMATION_CLASS);
    }

    removeAnimation() {
        this.panelEl.classList.remove(ITEM_ANIMATION_CLASS);
        this.el.classList.remove(ITEM_ANIMATION_CLASS);
    }

    clearImg() {
        this.src = '';
        this.imageEl.src = '';
        this.imageOption = null;
    }
}

export default Viewer;
