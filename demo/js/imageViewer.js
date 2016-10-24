/**
 * 图片滚动预览插件
 * by KyLeo 2016.10.14
 */
(function (window, document, undefined) {
    var Hammer = window.Hammer;
    var itemAnimationClass = 'viewer-animation';
    var stopSwipe = false;
    var transformProp = (function getTransformProperty() {
        var props = ['transform', 'webkitTransform', 'MozTransform', 'oTransform', 'msTransform'];
        var style = document.createElement('div').style, availProp = '';
        props.forEach(function (prop) {
            if (style[prop] !== undefined) {
                availProp = prop;
            }
        });
        return availProp;
    })();

    function warn(msg) {
        console.warn('[ImageViewer]:' + msg);
    }

    function query(selector, el) {
        el = el || document;
        return el.querySelectorAll(selector);
    }

    function removeElement(element) {
        var parentElement = element.parentNode;
        if (parentElement) {
            parentElement.removeChild(element);
        }
    }

    function setTranslateStyle(el, x, y) {
        var styleTemplate = 'translate3d($X,$Y,0)';
        el.style[transformProp] = styleTemplate.replace('$X', x + 'px').replace('$Y', y + 'px');
    }

    function setScaleAndTranslateStyle(el, scale, x, y) {
        var styleTemplate = 'scale3d($scale,$scale,1) translate3d($X,$Y,0)';
        el.style[transformProp] = styleTemplate.replace(/\$scale/g, scale + '').replace('$X', x + 'px').replace('$Y', y + 'px');
    }

    /********************* Viewer类 start***************************/
    function Viewer(src, el, index, width, height, currentIndex) {
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

    Viewer.prototype._init = function (displayIndex, resetScale, fn) {
        var _initImage = function (displayIndex) {
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
        }.bind(this);
        if (this.imageEl) {
            _initImage(displayIndex);
        } else {
            this.imageEl = query('img', this.el)[0];
            this.imageEl.src = this.src;
            this.imageEl.onload = function () {
                _initImage(displayIndex);
            }.bind(this);
        }
        return this;
    };

    Viewer.prototype._bindEvent = function () {
        var mc = new Hammer.Manager(this.panelEl);
        mc.add(new Hammer.Pan());
        mc.on('panstart', function (event) {
            if (stopSwipe) {
                event.srcEvent.stopPropagation();
            }
        }.bind(this));
        mc.on('panmove', function (event) {
            if (stopSwipe) {
                event.srcEvent.stopPropagation();
                this._translatePanel(event.deltaX, event.deltaY);
            }
        }.bind(this));
        mc.on('panend', function (event) {
            if (stopSwipe) {
                event.srcEvent.stopPropagation();
                this._translatePanelEnd();
            }
        }.bind(this));
    };

    Viewer.prototype._pinch = function (scale) {
        var currentScale = scale + this.scale;
        if (currentScale > 0.5 && currentScale < 2) {
            this.currentScale = currentScale;
            setScaleAndTranslateStyle(this.panelEl, this.currentScale, this.translatePanelX, this.translatePanelY);
        }
        return this;
    };

    Viewer.prototype._pinchEnd = function (scale) {
        this.scale = isNaN(scale) ? this.currentScale : scale;
        this.realWidth = this.panelEl.clientWidth * this.scale;
        this.realHeight = this.panelEl.clientHeight * this.scale;
        if (this.realWidth < this.width || this.realHeight < this.height) {
            this._init();
        }
        stopSwipe = this.isScale();
        return this;
    };

    Viewer.prototype._translatePanel = function (translatePanelX, translatePanelY) {
        if (this.realWidth <= this.width && this.realHeight <= this.height)return this;

        var currentPanelX, currentPanelY, differ;
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

    Viewer.prototype._translatePanelEnd = function (translatePanelX, translatePanelY) {
        if (this.realWidth <= this.width && this.realHeight <= this.height)return this;
        this.translatePanelX = isNaN(translatePanelX) ? this.currentPanelX : translatePanelX;
        this.translatePanelY = isNaN(translatePanelY) ? this.currentPanelY : translatePanelY;
        return this;
    };

    Viewer.prototype._translate = function (translateX) {
        this.currentX = isNaN(translateX) ? this.translateX : (translateX + this.translateX);
        this.currentY = this.translateY;
        setTranslateStyle(this.el, this.currentX, this.currentY);
        return this;
    };

    Viewer.prototype.isScale = function () {
        return Math.abs(this.scale - 1) > 0.01;
    };

    Viewer.prototype.addAnimation = function (needAnimation) {
        if (needAnimation || needAnimation === undefined) {
            this.el.classList.add(itemAnimationClass);
        }
        return this;
    };

    Viewer.prototype.removeAnimation = function () {
        this.el.classList.remove(itemAnimationClass);
        return this;
    };

    Viewer.prototype.swipeToPrev = function (needAnimation) {
        this.addAnimation(needAnimation)._init(-1, true);
        return this;
    };

    Viewer.prototype.swipeToCurrent = function (needReset, needAnimation) {
        this.addAnimation(needAnimation)._init(0, needReset, function () {
            stopSwipe = this.isScale();
        });
        return this;
    };

    Viewer.prototype.swipeToNext = function (needAnimation) {
        this.addAnimation(needAnimation)._init(1, true);
        return this;
    };
    /********************* Viewer类 end***************************/

    /********************* ImageViewer类 start***************************/
    function ImageViewer(images, opt) {
        opt = opt || {};
        this.images = images || []; //图片数据
        this.enableScale = opt.enableScale === undefined ? true : opt.enableScale;//是否开启图片缩放功能
        this.currentIndex = opt.startIndex || 0; //起始坐标，从0开始

        this._create();
        this.width = this.el.clientWidth;
        this.height = this.el.clientHeight;
        this.viewers = [];
        this.scaleStart = 1;
        this._init();
        this._bindEvent();
    }

    ImageViewer.prototype._create = function () {
        var imageViewerTemplate = '<div class="image-viewer">{{viewers}}</div>',
            viewerTemplate = '<div class="viewer"><div class="panel"><img></div></div>';
        var viewers = '', divEl;
        this.el = query('.image-viewer')[0];
        this.destroy();
        this.images.forEach(function () {
            viewers += viewerTemplate;
        });
        imageViewerTemplate = imageViewerTemplate.replace('{{viewers}}', viewers);

        divEl = document.createElement('div');
        divEl.innerHTML = imageViewerTemplate;
        this.el = divEl.firstElementChild;
        query('body')[0].appendChild(this.el);
        this.itemList = this.el.childNodes;
    };

    ImageViewer.prototype._init = function () {
        var i, length, item;
        for (i = 0, length = this.itemList.length; i < length; i++) {
            item = this.itemList[i];
            this.viewers.push(new Viewer(this.images[i], item, i, this.width, this.height, this.currentIndex));
        }
        this.swipeInByIndex(undefined, false);
    };

    ImageViewer.prototype._bindEvent = function () {
        var mc = new Hammer.Manager(this.el);
        mc.add([new Hammer.Pinch(), new Hammer.Pan(), new Hammer.Tap({
            taps: 2
        })]);
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

    ImageViewer.prototype._reset = function () {
        this.getCurrentViewer().swipeToCurrent(true);
    };

    ImageViewer.prototype._dealWithMoveActionStart = function () {
        if (stopSwipe)return;
        var prevViewer = this.getPrevViewer(),
            currentViewer = this.getCurrentViewer(),
            nextViewer = this.getNextViewer();

        prevViewer && prevViewer.removeAnimation();
        currentViewer && currentViewer.removeAnimation();
        nextViewer && nextViewer.removeAnimation();
    };

    ImageViewer.prototype._dealWithMoveAction = function (event) {
        if (stopSwipe)return;
        var prevViewer = this.getPrevViewer(),
            currentViewer = this.getCurrentViewer(),
            nextViewer = this.getNextViewer();

        prevViewer && prevViewer._translate(event.deltaX);
        currentViewer && currentViewer._translate(event.deltaX);
        nextViewer && nextViewer._translate(event.deltaX);
    };

    ImageViewer.prototype._dealWithMoveActionEnd = function (event) {
        if (stopSwipe)return;
        var distanceX = event.deltaX, index;
        var prevViewer = this.getPrevViewer(),
            nextViewer = this.getNextViewer();

        if (Math.abs(distanceX) < this.width / 5) {
            index = undefined;
        } else if (distanceX > 0) {
            index = prevViewer ? prevViewer.index : undefined;
        } else {
            index = nextViewer ? nextViewer.index : undefined;
        }
        this.swipeInByIndex(index);
    };

    ImageViewer.prototype._dealWithScaleActionStart = function (event) {
        this.scaleStart = event.scale;
    };

    ImageViewer.prototype._dealWithScaleAction = function (event) {
        this.getCurrentViewer()._pinch(event.scale - this.scaleStart);
    };

    ImageViewer.prototype._dealWithScaleActionEnd = function (event) {
        this.getCurrentViewer()._pinchEnd();
    };

    ImageViewer.prototype.getPrevViewer = function () {
        return this.viewers[this.currentIndex - 1] || null;
    };

    ImageViewer.prototype.getCurrentViewer = function () {
        return this.viewers[this.currentIndex];
    };

    ImageViewer.prototype.getNextViewer = function () {
        return this.viewers[this.currentIndex + 1] || null;
    };

    ImageViewer.prototype.swipeInByIndex = function (index, needAnimation) {
        var currentIndex = isNaN(index) ? this.currentIndex : index;
        var prevViewer, currentViewer, nextViewer;
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

    ImageViewer.prototype.destroy = function () {
        this.el && removeElement(this.el);
    };

    ImageViewer.prototype.close = function () {
        this.el.style.display = 'none';
    };

    ImageViewer.prototype.open = function () {
        this.el.style.display = 'block';
    };
    /********************* ImageViewer类 end***************************/

    window.ImageViewer = ImageViewer;
})(window, document, undefined);