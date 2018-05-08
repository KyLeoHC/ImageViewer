import Event from '../common/event';
import supportPassive from '../common/supportPassive';

let id = 0;

class EventWrapper {
    constructor(event, prevEvent, touch) {
        this.time = new Date().getTime();
        this.srcEvent = event;
        this.prevEvent = prevEvent;
        this.touch = touch; // Touch类的实例
        this.type = [];
        this.valid = false;
        this.threshold = 4; // 事件有效的最小移动距离

        this.preventDefault();
        this.stopPropagation();

        this._getTouches();
        this._initDelta();
        this._initScale();
        this._initTap();
    }

    _getTouches() {
        const list = this.srcEvent.touches.length ? this.srcEvent.touches : this.srcEvent.changedTouches;
        this.touches = Array.prototype.slice.call(list, 0); // 手指的数量
    }

    _initDelta() {
        // delta值为位移的距离
        let deltaX = this.touches[0].clientX;
        let deltaY = this.touches[0].clientY;
        if (this.prevEvent) {
            deltaX -= this.prevEvent.touches[0].clientX;
            deltaY -= this.prevEvent.touches[0].clientY;
        } else {
            deltaX = deltaY = 0;
        }
        this.deltaX = deltaX;
        this.deltaY = deltaY;
        if (Math.abs(deltaX) > this.threshold
            || Math.abs(deltaY) > this.threshold) {
            this.type.push('pan');
            this.valid = true;
        }
    }

    _initScale() {
        // scale值为缩放的倍数
        let scale = 1;
        if (this.touch.enableScale
            && this.prevEvent
            && this.prevEvent.touches.length > 1
            && this.touches.length > 1) {
            // 仅当有两个手指操作时才会有缩放值
            const currentWidth = Math.abs(this.touches[0].clientX - this.touches[1].clientX);
            const currentHeight = Math.abs(this.touches[0].clientY - this.touches[1].clientY);
            const prevWidth = Math.abs(this.prevEvent.touches[0].clientX - this.prevEvent.touches[1].clientX);
            const prevHeight = Math.abs(this.prevEvent.touches[0].clientY - this.prevEvent.touches[1].clientY);
            const currentDistance = Math.sqrt(currentWidth * currentWidth + currentHeight * currentHeight);
            const preDistance = Math.sqrt(prevWidth * prevWidth + prevHeight * prevHeight);
            scale = currentDistance / preDistance;
            this.type.push('pinch');
        }
        this.scale = scale;
    }

    _initTap() {
        const startEvent = this.touch._startEvent;
        if (startEvent
            && this.srcEvent.type === 'touchstart'
            && startEvent.touches.length === 1
            && this.touches.length === 1) {
            const timeGap = this.time - startEvent.time;
            if (timeGap < 250
                && Math.abs(this.touches[0].clientX - startEvent.touches[0].clientX) < 30
                && Math.abs(this.touches[0].clientY - startEvent.touches[0].clientY) < 30) {
                this.type = ['doubleTap'];
                this.valid = true;
            }
        }
    }

    stopPropagation() {
        this.srcEvent.stopPropagation && this.srcEvent.stopPropagation();
    }

    preventDefault() {
        this.srcEvent.preventDefault && this.srcEvent.preventDefault();
    }
}

class Touch {
    constructor(el, options = {}) {
        if (el) {
            this.id = ++id;
            this.el = el;
            this.enableScale = !!options.enableScale;
            this.hasTriggerStart = false;
            this._startEvent = null;
            this._prevEvent = null;
            this._commonEvent = new Event();
            this._bindEvent();
        }
    }

    _bindEvent() {
        const options = supportPassive ? {passive: false} : false;
        this.el.addEventListener('touchstart', this, options);
        this.el.addEventListener('touchmove', this, options);
        this.el.addEventListener('touchend', this, options);
        this.el.addEventListener('touchcancel', this, options);
    }

    _start(event) {
        this._startEvent = new EventWrapper(event, null, this);
    }

    _move(event) {
        if (this._startEvent) {
            const newEvent = new EventWrapper(event, this._startEvent, this);

            if (newEvent.valid) {
                // 满足最小移动间距的要求，事件才是有效的
                // 这时才触发相关移动和缩放事件
                if (!this.hasTriggerStart) {
                    this.hasTriggerStart = true;
                    newEvent.type.includes('pinch') && this._commonEvent.emit('pinchstart', this._startEvent);
                    newEvent.type.includes('pan') && this._commonEvent.emit('panstart', this._startEvent);
                }
                newEvent.type.includes('pinch') && this._commonEvent.emit('pinch', newEvent);
                newEvent.type.includes('pan') && this._commonEvent.emit('panmove', newEvent);
                this._prevEvent = newEvent;
            }
        }
    }

    _end(event) {
        if (this._startEvent) {
            const endEvent = new EventWrapper(event, this._startEvent, this);

            if (endEvent.valid) {
                if (this._prevEvent) {
                    this._prevEvent.type.includes('pinch') && this._commonEvent.emit('pinchend', endEvent);
                    endEvent.type.includes('pan') && this._commonEvent.emit('panend', endEvent);
                    this.hasTriggerStart = false;
                }
                this._startEvent = null;
            }
            // 需要注意的是，双击事件不需要满足最小移动距离的要求
            this._startEvent && this._startEvent.type.includes('doubleTap') && this._commonEvent.emit('doubleTap', endEvent);
        }
    }

    _cancel() {
    }

    handleEvent(event) {
        switch (event.type) {
            case 'touchstart':
                this._start(event);
                break;
            case 'touchmove':
                this._move(event);
                break;
            case 'touchend':
                this._end(event);
                break;
            case 'touchcancel':
                this._cancel(event);
                break;
        }
    }

    on(event, fn) {
        this._commonEvent.on(event, fn);
    }
}

export default Touch;