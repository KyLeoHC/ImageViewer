(function (window, document, undefined) {
    var touch = window.touch, Hammer = window.Hammer;
    var itemAnimationClass = 'item-animation';
    var debugEl = query('#debug')[0];
    var stopSwipe = false;

    function getTranslateStyle(x, y) {
        var strStyle = 'translate3d($X, $Y, 0)';
        var style = strStyle.replace('$X', x + 'px').replace('$Y', y + 'px');
        return style;
    }

    function getScaleStyle(scale) {
        var strStyle = 'scale3d($scale,$scale,1)';
        var style = strStyle.replace(/\$scale/g, scale + '');
        return style;
    }

    function getScaleAndTranslateStyle(scale, x, y) {
        var strStyle = 'scale3d($scale,$scale,1) translate3d($X, $Y, 0)';
        var style = strStyle.replace(/\$scale/g, scale + '').replace('$X', x + 'px').replace('$Y', y + 'px');
        return style;
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
        this.el.style.transform = getTranslateStyle(this.translateX, this.translateY);
        this._bindEvent();
    }

    Viewer.prototype._init = function (displayIndex, resetScale) {
        var image = query('img', this.el)[0];
        image.src = this.src;
        image.onload = function () {
            this.scale = resetScale ? 1 : this.scale;
            this.translateX = displayIndex * this.width;
            this.translateY = -this.el.clientHeight * this.scale / 2;
            this.translatePanelX = 0;
            this.translatePanelY = 0;
            this.el.style.transform = getTranslateStyle(this.translateX, this.translateY);
            this.panelEl.style.transform = getScaleAndTranslateStyle(this.scale, 0, 0);
        }.bind(this);
        return this;
    };

    Viewer.prototype._bindEvent = function () {
        var mc = new Hammer.Manager(this.panelEl);
        mc.add(new Hammer.Pan());
        mc.on('panstart', function (event) {
            stopSwipe = this.panelEl.clientWidth * this.scale > this.width;
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
        /*
         touch.on(this.panelEl, 'dragstart', function (event) {
         stopSwipe = this.panelEl.clientWidth * this.scale > this.width;
         if (stopSwipe) {
         event.stopPropagation();
         }
         }.bind(this));
         touch.on(this.panelEl, 'drag', function (event) {
         if (stopSwipe) {
         event.stopPropagation();
         this.translatePanel(event.distanceX, event.distanceY);
         }
         }.bind(this));
         touch.on(this.panelEl, 'dragend', function (event) {
         if (stopSwipe) {
         event.stopPropagation();
         this.translatePanelEnd();
         }
         }.bind(this));*/
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
        //debugEl.innerText = this.currentScale + '/' + scale;
        this.currentScale = isNaN(scale) ? this.scale : (scale + this.scale);
        if (this.currentScale > 1) {
            this.currentScale = this.currentScale > 2 ? 2 : this.currentScale;
        } else {
            this.currentScale = this.currentScale < 0.5 ? 0.5 : this.currentScale;
        }
        this.panelEl.style.transform = getScaleAndTranslateStyle(this.currentScale, this.translatePanelX, this.translatePanelY);
        return this;
    };

    Viewer.prototype.pinchEnd = function (scale) {
        this.scale = isNaN(scale) ? this.currentScale : scale;
        return this;
    };

    Viewer.prototype.translatePanel = function (translatePanelX, translatePanelY) {
        this.currentPanelX = isNaN(translatePanelX) ? this.translatePanelX : ((translatePanelX + this.translatePanelX) / this.scale);
        this.currentPanelY = isNaN(translatePanelY) || this.el.clientHeight * this.scale <= this.height
            ? this.translatePanelY : ((translatePanelY + this.translatePanelY) / this.scale);
        this.panelEl.style.transform = getScaleAndTranslateStyle(this.scale, this.currentPanelX, this.currentPanelY);
        return this;
    };

    Viewer.prototype.translatePanelEnd = function (translatePanelX, translatePanelY) {
        this.translatePanelX = isNaN(translatePanelX) ? this.currentPanelX : translatePanelX;
        this.translatePanelY = isNaN(translatePanelY) ? this.currentPanelY : translatePanelY;
        return this;
    };

    Viewer.prototype.translate = function (translateX, translateY) {
        this.currentX = isNaN(translateX) ? this.translateX : (translateX + this.translateX);
        this.currentY = this.translateY;
        /*
        this.currentY = isNaN(translateY) || this.el.clientHeight * this.scale < this.height
            ? this.translateY : (translateY + this.translateY);*/
        this.el.style.transform = getTranslateStyle(this.currentX, this.currentY);
        return this;
    };

    Viewer.prototype.translateEnd = function (translateX, translateY) {
        this.translateX = isNaN(translateX) ? this.currentX : translateX;
        this.translateY = isNaN(translateY) ? this.currentY : translateY;
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
        console.log(event);
        prevViewer && prevViewer.translate(event.deltaX);
        currentViewer && currentViewer.translate(event.deltaX, event.deltaY);
        nextViewer && nextViewer.translate(event.deltaX);
    };

    ImageViewer.prototype.dealWithMoveActionEnd = function (event) {
        if (stopSwipe)return;
        var distanceX = event.deltaX, index;
        var prevViewer = this.getPrevViewer(),
            nextViewer = this.getNextViewer();
        console.log(event);
        if (Math.abs(distanceX) < this.width / 3) {
            index = undefined;
        } else if (distanceX > 0) {
            index = prevViewer ? prevViewer.index : undefined;
        } else {
            index = nextViewer ? nextViewer.index : undefined;
        }
        this.swipeInByIndex(index);
    };

    ImageViewer.prototype.dealWithScaleActionStart = function (event) {
        //console.log(event);
        this.scaleStart = event.scale;
    };

    ImageViewer.prototype.dealWithScaleAction = function (event) {
        //console.log(this.getCurrentViewer());
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