import Event from '../common/event';
import supportPassive from '../common/supportPassive';

class EventWrapper {
    constructor(event, prevEvent, touch) {
        this.srcEvent = event;
        this.prevEvent = prevEvent;
        this.touch = touch;
        this.type = 'pan';
        this._initTouches();
        this._initDelta();
        this._initScale();
    }

    _initTouches() {
        const touches = [];
        const list = this.srcEvent.targetTouches.length ? this.srcEvent.targetTouches : this.srcEvent.changedTouches
        ;
        if (list.length === 1) {
            touches.push(list[0]);
        } else {
            touches.push(list[0]);
            touches.push(list[1]);
        }
        this.touches = touches;
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
            this.type = 'pinch';
        }
        this.scale = scale;
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
            this.el = el;
            this.enableScale = !!options.enableScale;
            this.hasTriggerStart = false;
            this._startEvent = null;
            this._endEvent = null;
            this._commonEvent = new Event();
            this._bindEvent();
        }
    }

    _bindEvent() {
        const options = supportPassive ? {passive: true} : false;
        this.el.addEventListener('touchstart', this, options);
        this.el.addEventListener('touchmove', this, options);
        this.el.addEventListener('touchend', this, options);
    }

    _start(event) {
        // console.log(event, 'start');
        this._startEvent = new EventWrapper(event, null, this);
    }

    _move(event) {
        // console.log(event, 'move');
        let startEvent = 'panstart';
        let moveEvent = 'panmove';
        const newEvent = new EventWrapper(event, this._startEvent, this);

        if (newEvent.type === 'pinch') {
            startEvent = 'pinchstart';
            moveEvent = 'pinch';
        }

        !this.hasTriggerStart && this._commonEvent.emit(startEvent, this._startEvent);
        this._commonEvent.emit(moveEvent, newEvent);
    }

    _end(event) {
        // console.log(event, 'end');
        let endEvent = 'panend';
        this._endEvent = new EventWrapper(event, this._startEvent, this);

        if (this._endEvent.type === 'pinch') {
            endEvent = 'pinchend';
        }

        this._commonEvent.emit(endEvent, this._endEvent);
        this.hasTriggerStart = false;
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
        }
    }

    on(event, fn) {
        this._commonEvent.on(event, fn);
    }
}

export default Touch;