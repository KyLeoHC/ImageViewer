/**
 * Touch多点触摸模块
 */
import Event from '../common/event';
import supportPassive from '../common/supportPassive';

let id = 0;

class EventWrapper {
    constructor(event) {
        this.time = new Date().getTime();
        this.srcEvent = event;
        this.type = [];
        this.deltaX = 0;
        this.deltaY = 0;
        this.scale = 1;
        this._getTouches();
        this.preventDefault();
        this.stopPropagation();
    }

    _getTouches() {
        const list = this.srcEvent.touches.length ? this.srcEvent.touches : this.srcEvent.changedTouches;
        this.touches = Array.prototype.slice.call(list, 0); // 手指的数量
    }

    stopPropagation() {
        this.srcEvent.stopPropagation && this.srcEvent.stopPropagation();
    }

    preventDefault() {
        this.srcEvent.preventDefault
            ? this.srcEvent.preventDefault()
            : (this.srcEvent.returnValue = false);
    }
}

class Touch {
    constructor(el, options = {}) {
        if (el) {
            this.id = ++id;
            this.el = el;
            this.threshold = 4; // 事件有效的最小移动距离
            this.enableScale = !!options.enableScale;
            this.hasTriggerStart = false;
            this._doubleTapStartEvent = null;
            this._startEvent = null;
            this._moveEvent = null;
            this.tapTimeoutId = null;
            this.isTapStart = false;
            this._commonEvent = new Event();
            this._bindEvent();
        }
    }

    _cancelTap() {
        if (this.tapTimeoutId) {
            clearTimeout(this.tapTimeoutId);
            this.isTapStart = false;
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
        this._startEvent = new EventWrapper(event);
        if (this._startEvent.touches.length > 1) {
            this._cancelTap();
        } else {
            this.isTapStart = true;
            this.tapTimeoutId = setTimeout(() => {
                this._cancelTap();
            }, 300);
        }
    }

    _move(event) {
        const startEvent = this._startEvent;
        if (startEvent) {
            let canTrigger = false;
            const moveEvent = new EventWrapper(event);

            // 计算位移的水平和垂直距离
            moveEvent.deltaX = moveEvent.touches[0].clientX - startEvent.touches[0].clientX;
            moveEvent.deltaY = moveEvent.touches[0].clientY - startEvent.touches[0].clientY;
            if (Math.abs(moveEvent.deltaX) > this.threshold ||
                Math.abs(moveEvent.deltaY) > this.threshold) {
                moveEvent.type.push('pan');
                canTrigger = true;
            }

            // 计算缩放的倍数
            let scale = 1;
            if (this.enableScale &&
                startEvent.touches.length > 1 &&
                moveEvent.touches.length > 1) {
                // 仅当有两个手指操作时才会有缩放值
                const currentWidth = Math.abs(moveEvent.touches[0].clientX - moveEvent.touches[1].clientX);
                const currentHeight = Math.abs(moveEvent.touches[0].clientY - moveEvent.touches[1].clientY);
                const prevWidth = Math.abs(startEvent.touches[0].clientX - startEvent.touches[1].clientX);
                const prevHeight = Math.abs(startEvent.touches[0].clientY - startEvent.touches[1].clientY);
                const currentDistance = Math.sqrt(currentWidth * currentWidth + currentHeight * currentHeight);
                const preDistance = Math.sqrt(prevWidth * prevWidth + prevHeight * prevHeight);
                scale = currentDistance / preDistance;
                moveEvent.type.push('pinch');
            }
            moveEvent.scale = scale;

            if (canTrigger) {
                // 满足最小移动间距的要求时，才触发相关移动和缩放事件
                if (!this.hasTriggerStart) {
                    this.hasTriggerStart = true;
                    moveEvent.type.indexOf('pinch') > -1 && this._commonEvent.emit('pinchstart', startEvent);
                    moveEvent.type.indexOf('pan') > -1 && this._commonEvent.emit('panstart', startEvent);
                }
                moveEvent.type.indexOf('pinch') > -1 && this._commonEvent.emit('pinch', moveEvent);
                moveEvent.type.indexOf('pan') > -1 && this._commonEvent.emit('panmove', moveEvent);
                this._moveEvent = moveEvent;
            }
        }
    }

    _end(event) {
        const startEvent = this._startEvent;
        if (startEvent) {
            const moveEvent = this._moveEvent;

            if (moveEvent) {
                moveEvent.type.indexOf('pinch') > -1 && this._commonEvent.emit('pinchend', moveEvent);
                moveEvent.type.indexOf('pan') > -1 && this._commonEvent.emit('panend', moveEvent);
                this.hasTriggerStart = false;
                this._startEvent = null;
                this._moveEvent = null;
            } else {
                const endEvent = new EventWrapper(event);
                // 判断触发单击事件
                if (this.isTapStart) {
                    // 触发单击事件
                    endEvent.type = ['tap'];
                    this._commonEvent.emit('tap', endEvent);
                }
                // 判断触发双击事件
                if (startEvent.touches.length === 1 &&
                    endEvent.touches.length === 1) {
                    if (this._doubleTapStartEvent) {
                        const timeGap = endEvent.time - this._doubleTapStartEvent.time;
                        if (timeGap < 300) {
                            endEvent.type = ['doubleTap'];
                            this._commonEvent.emit('doubleTap', endEvent);
                        }
                        this._doubleTapStartEvent = null;
                    } else {
                        this._doubleTapStartEvent = this._startEvent;
                    }
                } else {
                    this._doubleTapStartEvent = null;
                }
            }
        }
        this._cancelTap();
    }

    _cancel() {
        this._startEvent = null;
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
