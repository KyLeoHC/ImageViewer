(function (window, document, undefined) {
    var Hammer = window.Hammer;
    var itemAnimationClass = 'item-animation';
    var stopSwipe = false;

    function setTranslateStyle(el, x, y) {
        var styleTemplate = 'translate3d($X, $Y, 0)';
        el.style.transform = styleTemplate.replace('$X', x + 'px').replace('$Y', y + 'px');
    }

    function setScaleAndTranslateStyle(el, scale, x, y) {
        var styleTemplate = 'scale3d($scale,$scale,1) translate3d($X, $Y, 0)';
        el.style.transform = styleTemplate.replace(/\$scale/g, scale + '').replace('$X', x + 'px').replace('$Y', y + 'px');
    }

    function query(selector, el) {
        el = el || document;
        return el.querySelectorAll(selector);
    }

    /********************* Viewer类 start***************************/
    function Viewer(src, el, index, width, height) {
        this.el = el;
        this.panelEl = el.firstElementChild;
        this.src = src;
        this.index = index;
        this.width = width;
        this.height = height;
        this.realWidth = 0;
        this.realHeight = 0;
        this.translateX = this.index * this.width;
        this.translateY = 0;
        this.currentX = 0; //当前正在移动的X轴距离(临时保存,当事件结束后,会赋值回translateX)
        this.currentY = 0; //当前正在移动的Y轴距离(临时保存,当事件结束后,会赋值回translateY)
        this.scale = 1;
        this.currentScale = 1; //当前正在缩放的倍数(临时保存,当事件结束后,会赋值回scale)
        this.translatePanelX = 0;
        this.translatePanelY = 0;
        this.currentPanelX = 0;
        this.currentPanelY = 0;
        setTranslateStyle(this.el, this.translateX, this.translateY);
        this._bindEvent();
    }

    Viewer.prototype._init = function (displayIndex, resetScale) {
        var image = query('img', this.el)[0];
        image.src = this.src;
        displayIndex = displayIndex || 0;
        image.onload = function () {
            if (resetScale) {
                this.scale = 1;
            }
            this.translatePanelX = 0;
            this.translatePanelY = 0;
            this.currentPanelX = 0;
            this.currentPanelY = 0;
            this.realWidth = this.panelEl.clientWidth * this.scale;
            this.realHeight = this.panelEl.clientHeight * this.scale;
            this.translateX = displayIndex * this.width;
            this.translateY = -this.el.clientHeight / 2;
            setScaleAndTranslateStyle(this.panelEl, this.scale, this.translatePanelX, this.translatePanelY);
            setTranslateStyle(this.el, this.translateX, this.translateY);
        }.bind(this);
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
                this.translatePanel(event.deltaX, event.deltaY);
            }
        }.bind(this));
        mc.on('panend', function (event) {
            if (stopSwipe) {
                event.srcEvent.stopPropagation();
                this.translatePanelEnd();
            }
        }.bind(this));
    };

    Viewer.prototype.isScale = function () {
        var difference = Math.abs(this.scale - 1);
        return difference > 0.01;
    };

    Viewer.prototype.addAnimation = function () {
        this.el.classList.add(itemAnimationClass);
        return this;
    };

    Viewer.prototype.removeAnimation = function () {
        this.el.classList.remove(itemAnimationClass);
        return this;
    };

    Viewer.prototype.pinch = function (scale) {
        var currentScale = isNaN(scale) ? this.scale : (scale + this.scale);
        if (currentScale > 0.5 && currentScale < 2) {
            this.currentScale = currentScale;
            setScaleAndTranslateStyle(this.panelEl, this.currentScale, this.translatePanelX, this.translatePanelY);
        }
        return this;
    };

    Viewer.prototype.pinchEnd = function (scale) {
        this.scale = isNaN(scale) ? this.currentScale : scale;
        this.realWidth = this.panelEl.clientWidth * this.scale;
        this.realHeight = this.panelEl.clientHeight * this.scale;
        if (this.realWidth < this.width || this.realHeight < this.height) {
            this._init();
        }
        stopSwipe = this.isScale();
        return this;
    };

    Viewer.prototype.translatePanel = function (translatePanelX, translatePanelY) {
        if (this.realWidth <= this.width && this.realHeight <= this.height)return;
        this.currentPanelX = isNaN(translatePanelX) || this.realWidth <= this.width
            ? this.translatePanelX : (translatePanelX / this.scale + this.translatePanelX);
        this.currentPanelY = isNaN(translatePanelY) || this.realHeight <= this.height
            ? this.translatePanelY : (translatePanelY / this.scale + this.translatePanelY);
        setScaleAndTranslateStyle(this.panelEl, this.scale, this.currentPanelX, this.currentPanelY);
        return this;
    };

    Viewer.prototype.translatePanelEnd = function (translatePanelX, translatePanelY) {
        if (this.realWidth <= this.width && this.realHeight <= this.height)return;
        this.translatePanelX = isNaN(translatePanelX) ? this.currentPanelX : translatePanelX;
        this.translatePanelY = isNaN(translatePanelY) ? this.currentPanelY : translatePanelY;
        return this;
    };

    Viewer.prototype.translate = function (translateX, translateY) {
        this.currentX = isNaN(translateX) ? this.translateX : (translateX + this.translateX);
        this.currentY = this.translateY;
        setTranslateStyle(this.el, this.currentX, this.currentY);
        return this;
    };

    Viewer.prototype.swipeToPrev = function () {
        this.addAnimation()._init(-1, true);
        return this;
    };

    Viewer.prototype.swipeToCurrent = function (needReset) {
        this.addAnimation()._init(0, needReset);
        return this;
    };

    Viewer.prototype.swipeToNext = function () {
        this.addAnimation()._init(1, true);
        return this;
    };
    /********************* Viewer类 end***************************/

    /********************* ImageViewer类 start***************************/
    function ImageViewer(images) {
        this.el = query('.image-viewer')[0];
        this.itemList = query('.viewer');
        this.width = this.el.clientWidth;
        this.height = this.el.clientHeight;
        this.images = images;
        this.viewers = [];
        this.currentIndex = 1;
        this.scaleStart = 1;
        this._init();
        this._bindEvent();
    }

    ImageViewer.prototype.swipeInByIndex = function (index) {
        this.currentIndex = isNaN(index) ? this.currentIndex : index;

        var prevViewer = this.getPrevViewer(),
            currentViewer = this.getCurrentViewer(),
            nextViewer = this.getNextViewer();

        prevViewer && prevViewer.swipeToPrev();
        currentViewer && currentViewer.swipeToCurrent();
        nextViewer && nextViewer.swipeToNext();
    };

    ImageViewer.prototype._init = function () {
        this.itemList.forEach(function (item, index) {
            this.viewers.push(new Viewer(this.images[index], item, index, this.width, this.height));
        }.bind(this));
        this.swipeInByIndex();
    };

    ImageViewer.prototype._bindEvent = function () {
        var mc = new Hammer.Manager(this.el);
        mc.add([new Hammer.Pinch(), new Hammer.Pan(), new Hammer.Tap({
            taps: 2
        })]);
        mc.on('tap', this.reset.bind(this));
        mc.on('panstart', this.dealWithMoveActionStart.bind(this));
        mc.on('panmove', this.dealWithMoveAction.bind(this));
        mc.on('panend', this.dealWithMoveActionEnd.bind(this));
        mc.on('pinchstart', this.dealWithScaleActionStart.bind(this));
        mc.on('pinch', this.dealWithScaleAction.bind(this));
        mc.on('pinchend', this.dealWithScaleActionEnd.bind(this));
    };

    ImageViewer.prototype.reset = function () {
        this.getCurrentViewer().swipeToCurrent(true);
    };

    ImageViewer.prototype.dealWithMoveActionStart = function () {
        if (stopSwipe)return;
        var prevViewer = this.getPrevViewer(),
            currentViewer = this.getCurrentViewer(),
            nextViewer = this.getNextViewer();

        prevViewer && prevViewer.removeAnimation();
        currentViewer && currentViewer.removeAnimation();
        nextViewer && nextViewer.removeAnimation();
    };

    ImageViewer.prototype.dealWithMoveAction = function (event) {
        if (stopSwipe)return;
        var prevViewer = this.getPrevViewer(),
            currentViewer = this.getCurrentViewer(),
            nextViewer = this.getNextViewer();

        prevViewer && prevViewer.translate(event.deltaX);
        currentViewer && currentViewer.translate(event.deltaX, event.deltaY);
        nextViewer && nextViewer.translate(event.deltaX);
    };

    ImageViewer.prototype.dealWithMoveActionEnd = function (event) {
        if (stopSwipe)return;
        var distanceX = event.deltaX, index;
        var prevViewer = this.getPrevViewer(),
            nextViewer = this.getNextViewer();

        if (Math.abs(distanceX) < this.width / 4) {
            index = undefined;
        } else if (distanceX > 0) {
            index = prevViewer ? prevViewer.index : undefined;
        } else {
            index = nextViewer ? nextViewer.index : undefined;
        }
        this.swipeInByIndex(index);
    };

    ImageViewer.prototype.dealWithScaleActionStart = function (event) {
        this.scaleStart = event.scale;
    };

    ImageViewer.prototype.dealWithScaleAction = function (event) {
        this.getCurrentViewer().pinch(event.scale - this.scaleStart);
    };

    ImageViewer.prototype.dealWithScaleActionEnd = function (event) {
        this.getCurrentViewer().pinchEnd();
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
    /********************* ImageViewer类 end***************************/
    window.ImageViewer = ImageViewer;
})(window, document, undefined);