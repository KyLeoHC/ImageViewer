(function (window, document, undefined) {
    var touch = window.touch;
    var itemAnimationClass = 'item-animation';

    function getTransformStyle(scale, x, y) {
        var strStyle = 'scale($scale) translate3d($X, $Y, 0)';
        var style = strStyle.replace('$scale', scale + '').replace('$X', x + 'px').replace('$Y', y + 'px');
        console.log(style);
        return style;
    }

    function query(selector, el) {
        el = el || document;
        return el.querySelectorAll(selector);
    }

    /********************* Viewer类 start***************************/
    function Viewer(src, el, index, width) {
        this.el = el;
        this.src = src;
        this.index = index;
        this.width = width;
        this.scale = 1;
        this.translateX = this.index * this.width;
        this.translateY = 0;
        this.currentX = 0; //当前正在移动的X轴距离(临时保存,当事件结束后,会赋值回translateX)
        this.currentY = 0; //当前正在移动的Y轴距离(临时保存,当事件结束后,会赋值回translateY)
        this.el.style.transform = getTransformStyle(this.scale, this.translateX, this.translateY);
    }

    Viewer.prototype.init = function (displayIndex) {
        var image = query('img', this.el)[0];
        image.src = this.src;
        image.onload = function () {
            this.scale = 1;
            this.translateX = displayIndex * this.width;
            this.translateY = -this.el.clientHeight / 2;
            this.el.style.transform = getTransformStyle(this.scale, this.translateX, this.translateY);
        }.bind(this);
    };

    Viewer.prototype.removeAnimation = function () {
        this.el.classList.remove(itemAnimationClass);
        return this;
    };

    Viewer.prototype.scale = function (scale) {
        scale = isNaN(scale) ? this.scale : scale;
        this.el.style.transform = getTransformStyle(scale, this.translateX, this.translateY);
        return this;
    };

    Viewer.prototype.translate = function (translateX, translateY) {
        this.currentX = isNaN(translateX) ? this.translateX : (translateX + this.translateX);
        this.currentY = isNaN(translateY) ? this.translateY : (translateY + this.translateY);
        this.el.style.transform = getTransformStyle(this.scale, this.currentX, this.currentY);
        return this;
    };

    Viewer.prototype.translateEnd = function (translateX, translateY) {
        this.translateX = isNaN(translateX) ? this.currentX : translateX;
        this.translateY = isNaN(translateY) ? this.currentY : translateY;
        return this;
    };

    Viewer.prototype.swipeToPrev = function () {
        this.init(-1);
        return this;
    };

    Viewer.prototype.swipeToCurrent = function () {
        this.init(0);
        return this;
    };

    Viewer.prototype.swipeToNext = function () {
        this.init(1);
        return this;
    };
    /********************* Viewer类 end***************************/

    /********************* ImageViewer类 start***************************/
    function ImageViewer(images) {
        this.el = query('.image-viewer')[0];
        this.itemList = query('.item');
        this.width = this.el.clientWidth;
        this.height = this.el.clientHeight;
        this.images = images;
        this.viewers = [];
        this.currentIndex = 1;
        this.init();
        this.bindEvent();
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

    ImageViewer.prototype.init = function () {
        this.itemList.forEach(function (item, index) {
            this.viewers.push(new Viewer(this.images[index], item, index, this.width));
        }.bind(this));
        this.swipeInByIndex();
    };

    ImageViewer.prototype.bindEvent = function () {
        touch.on(this.el, 'dragstart', '.item', this.dealWithMoveActionStart.bind(this));
        touch.on(this.el, 'drag', '.item', this.dealWithMoveAction.bind(this));
        touch.on(this.el, 'dragend', '.item', this.dealWithMoveActionEnd.bind(this));
        touch.on(this.el, 'pinch', '.item', this.dealWithScaleAction.bind(this));
        touch.on(this.el, 'pinchend', '.item', this.dealWithScaleActionEnd.bind(this));
    };

    ImageViewer.prototype.dealWithMoveActionStart = function () {
        var prevViewer = this.getPrevViewer(),
            currentViewer = this.getCurrentViewer(),
            nextViewer = this.getNextViewer();

        prevViewer && prevViewer.removeAnimation();
        currentViewer && currentViewer.removeAnimation();
        nextViewer && nextViewer.removeAnimation();
    };

    ImageViewer.prototype.dealWithMoveAction = function (event) {
        var prevViewer = this.getPrevViewer(),
            currentViewer = this.getCurrentViewer(),
            nextViewer = this.getNextViewer();

        prevViewer && prevViewer.translate(event.distanceX, event.distanceY);
        currentViewer && currentViewer.translate(event.distanceX, event.distanceY);
        nextViewer && nextViewer.translate(event.distanceX, event.distanceY);
    };

    ImageViewer.prototype.dealWithMoveActionEnd = function (event) {
        var prevViewer = this.getPrevViewer(),
            currentViewer = this.getCurrentViewer(),
            nextViewer = this.getNextViewer();

        prevViewer && prevViewer.translateEnd();
        currentViewer && currentViewer.translateEnd();
        nextViewer && nextViewer.translateEnd();
    };

    ImageViewer.prototype.dealWithScaleAction = function (event) {

    };

    ImageViewer.prototype.dealWithScaleActionEnd = function (event) {

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