import {
    query,
    setTranslateStyle,
    setScaleAndTranslateStyle
} from '../common/dom';
import {
    LOAD_IMG_COMPLETE,
    LOAD_IMG_FAIL,
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
    constructor(imageViewer, el, index) {
        this.id = ++id;
        this.src = ''; // 当前图片的url，会同步赋值到图片标签的src属性
        this.event = new Event(false);
        this.imageViewer = imageViewer;
        this.el = el; // .viewer类
        this.panelEl = el.firstElementChild; // .panel类
        this.imageEl = query('img', this.el)[0];
        this.tipsEl = query('span', this.el)[0];
        this.loadingEl = query('.ball-clip-rotate', this.el)[0];
        this.imageOption = null;
        this.index = index; // viewer排序用，记录原始的数组位置
        this.displayIndex = 0;
        this.realWidth = 0;
        this.realHeight = 0;
        this.translateX = 0;
        this.translateY = 0;
        this.canScale = false;
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
        this.translateX = this.displayIndex * this.imageViewer.width;
        // 在IOS的safari下，css中的100%高度并不等同于我们视觉上的可视区域高度
        // 实际上还包括了上导航栏和下工具栏的高度，所以这里可以考虑取元素高度和window可视区域高度中的最小值
        this.translateY = (this.imageViewer.height - this.el.clientHeight) / 2;
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
     * @param needLoadLarge 布尔值代表是否加载大图，数值1代表直接加载大图(忽略缩略图初始化)
     * @param fn 初始化完成的回调函数
     */
    init(
        imageOption = this.imageOption,
        displayIndex = this.displayIndex,
        resetScale = false,
        needLoadLarge = true,
        fn = noop
    ) {
        let src = '';
        const success = force => {
            if (this.src === src || force) {
                this.canScale = true;
                this.tipsEl.innerText = '';
                this.imageEl.style.display = '';
                this._initImage(resetScale, fn);
            }
        };
        const fail = force => {
            if (this.src === src || force) {
                this.imageEl.style.display = 'none';
                if (src && this.isActive()) {
                    this._initImage(resetScale);
                    this.tipsEl.innerText = 'load image fail';
                } else {
                    this.tipsEl.innerText = '';
                }
                fn();
            }
        };

        this.canScale = false;
        this.imageOption = imageOption;
        this.displayIndex = displayIndex;
        this.hideLoading();
        if (needLoadLarge) {
            if (imageOption._hasLoadLarge) {
                // 大图已加载好的情况下
                src = imageOption.url;
            } else {
                src = imageOption.thumbnail;
                if (src) {
                    // 缩略图存在的情况下
                    // 如果是当前图片则后台加载大图
                    if (this.isActive() && imageOption.url) {
                        this.showLoading();
                        // 缩略图存在的情况下，后台加载大图
                        this.loadImg(imageOption.url, () => {
                            // 判断当前viewer的url是否和当时正在加载的图片一致
                            if (this.isActive()) {
                                // 当前所展示的图片，加载完之后需要立即初始化尺寸
                                this.event.once(LOAD_IMG_COMPLETE, () => {
                                    success(true);
                                });
                                this._setImageUrl(imageOption.url);
                            }
                        }, () => {
                            this.isActive() && fail(true);
                        }, () => {
                            this.hideLoading();
                            imageOption._hasLoadLarge = true;
                        });
                    }
                } else {
                    // 没有缩略图的情况下
                    src = imageOption.url;
                    this.imageEl.style.display = 'none';
                }
            }
            if (needLoadLarge === 1) {
                // 直接返回，不执行后续初始化
                return;
            }
        } else {
            src = imageOption.thumbnail || imageOption.url;
        }

        this.event.once(LOAD_IMG_COMPLETE, success);
        this.event.once(LOAD_IMG_FAIL, fail);
        this._setImageUrl(src);
        this._initImage(true);
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
     * @param end
     */
    loadImg(url = '', success, fail, end) {
        const img = new Image();
        img.src = url;
        if (img.width || img.height) {
            success();
            end();
        } else {
            img.onload = () => {
                success();
                end();
            };
            img.onerror = () => {
                fail();
                end();
            };
        }
    }

    showLoading() {
        this.loadingEl.classList.remove('hide');
    }

    hideLoading() {
        this.loadingEl.classList.add('hide');
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
            this.isActive() && this.event.emit(LOAD_IMG_COMPLETE);
        }, false);
        this.imageEl.addEventListener('error', () => {
            this.isActive() && this.event.emit(LOAD_IMG_FAIL);
        }, false);
    }

    _pinchStart() {
        if (!this.canScale) {
            return;
        }
        this.removeAnimation();
    }

    _pinch(scale) {
        if (!this.canScale) {
            return;
        }
        let currentScale = scale * this.scale + this.scale;
        if (currentScale > 0.5 && currentScale < 8) {
            this.currentScale = currentScale;
            setScaleAndTranslateStyle(this.panelEl, this.currentScale, this.translatePanelX, this.translatePanelY);
        }
    }

    _pinchEnd(scale) {
        if (!this.canScale) {
            return;
        }
        this.scale = isNumber(scale) ? scale : this.currentScale;
        this.realWidth = this.panelEl.clientWidth * this.scale;
        this.realHeight = this.panelEl.clientHeight * this.scale;
        this.allowDistanceX = (this.realWidth - this.imageViewer.width) / 2 + 2;
        this.allowDistanceY = (this.realHeight - this.imageViewer.height) / 2 + 2;

        const rect = this.panelEl.getBoundingClientRect();
        if (this.realWidth < this.imageViewer.width ||
            this.realHeight < this.imageViewer.height ||
            rect.left > 0 ||
            rect.right < this.imageViewer.width ||
            rect.top > 0 ||
            rect.bottom < this.imageViewer.height) {
            this.addAnimation();
            this._initImage(false);
        }
        setTimeout(() => {
            if (this.isScale()) {
                lock.getLock(LOCK_NAME);
            } else {
                lock.releaseLock(LOCK_NAME);
            }
        }, 0);
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
        if (this.realWidth <= this.imageViewer.width && translatePanelX) {
            this.imageViewer._dealWithMoveAction({deltaX: translatePanelX}, true);
        } else {
            if (this.allowDistanceX > 0 && translatePanelX) {
                this.currentPanelX = translatePanelX + this.translatePanelX;
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
            this.currentPanelY = translatePanelY + this.translatePanelY;
            this.needResetY = !(-this.allowDistanceY < this.currentPanelY && this.currentPanelY < this.allowDistanceY);
        }
        setScaleAndTranslateStyle(this.panelEl, this.scale, tempX, this.currentPanelY);
    }

    _translatePanelEnd(event) {
        let needSwipe = false;
        const translatePanelX = event.deltaX;
        if (this.realWidth <= this.imageViewer.width && translatePanelX) {
            needSwipe = this.imageViewer._dealWithMoveActionEnd({deltaX: translatePanelX}, true);
        } else if (this.needResetX) {
            needSwipe = this.imageViewer._dealWithMoveActionEnd({deltaX: this._calculate(this.currentPanelX, this.allowDistanceX)}, true);
        }
        if (needSwipe) {
            // 滑动到下一张，重置当前图片的尺寸
            this._initImage(true);
            setTimeout(() => {
                lock.releaseLock(LOCK_NAME);
            }, 0);
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
                setTimeout(() => {
                    this.addAnimation();
                    setScaleAndTranslateStyle(this.panelEl, this.scale, this.translatePanelX, this.translatePanelY);
                }, 0);
            }
            this.needResetX = this.needResetY = false;
        }
    }

    isScale() {
        return Math.abs(this.scale - 1) > 0.001;
    }

    addAnimation() {
        this.el.classList.add(ITEM_ANIMATION_CLASS);
        this.panelEl.classList.add(ITEM_ANIMATION_CLASS);
    }

    removeAnimation() {
        this.el.classList.remove(ITEM_ANIMATION_CLASS);
        this.panelEl.classList.remove(ITEM_ANIMATION_CLASS);
    }

    clearImg() {
        this.src = '';
        this.imageEl.src = '';
        this.imageOption = null;
    }
}

export default Viewer;
