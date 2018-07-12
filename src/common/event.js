class Event {
    /**
     * 构造器
     * @param _enableMultiple 标记该事件实例是否允许同一事件挂载多个处理函数
     */
    constructor(_enableMultiple = true) {
        this._enableMultiple = _enableMultiple;
        this._handlers = {};
    }

    /**
     * 增加handler
     * @param name
     * @param fn
     * @param enableMultiple
     * @param once
     */
    addHandlers(name, fn, enableMultiple, once = false) {
        enableMultiple = enableMultiple === undefined ? this._enableMultiple : enableMultiple;
        if (enableMultiple) {
            if (!this._handlers[name]) {
                this._handlers[name] = [];
            }
            this._handlers[name].push({
                once,
                fn
            });
        } else {
            this._handlers[name] = [{
                once,
                fn
            }];
        }
    }

    /**
     * 绑定事件处理函数
     * @param name 事件名字
     * @param handler 对应的事件处理函数
     * @param enableMultiple 标记该事件是否允许挂载多个处理函数
     */
    on(name, handler, enableMultiple) {
        this.addHandlers(name, handler, enableMultiple, false);
    }

    /**
     * 绑定事件处理函数(执行一次之后就自动移除)
     */
    once(name, handler, enableMultiple) {
        this.addHandlers(name, handler, enableMultiple, true);
    }

    /**
     * 销毁对应的处理函数
     * @param name 事件名
     */
    off(name) {
        delete this._handlers[name];
    }

    /**
     * 触发事件
     * @param name 事件名
     * @param args 参数数组，传递给各个事件处理函数
     */
    emit(name, ...args) {
        const handlers = this._handlers[name] || [];
        if (handlers.length) {
            // 保留的handler，除去那些执行一次的handler
            const stayHandlers = [];
            // 仅当存在处理函数时才执行
            handlers.forEach(handler => {
                !handler.once && stayHandlers.push(handler);
                handler.fn.apply(handler, args);
            });
            this._handlers[name] = stayHandlers;
        }
    }
}

export default Event;
