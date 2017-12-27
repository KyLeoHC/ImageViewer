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
     * 绑定事件处理函数
     * @param name 事件名字
     * @param handler 对应的事件处理函数
     * @param enableMultiple 标记该事件是否允许挂载多个处理函数
     */
    on(name, handler, enableMultiple) {
        enableMultiple = enableMultiple === undefined ? this._enableMultiple : enableMultiple;
        if (enableMultiple) {
            if (!this._handlers[name]) {
                this._handlers[name] = [];
            }
            this._handlers[name].push(handler);
        } else {
            this._handlers[name] = [handler];
        }
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
        let handlers = this._handlers[name] || [], event = {stop: false}, length = handlers.length;
        // 传递给事件处理函数的第一个参数为事件对象
        // 该对象拥有一些可能会有用的属性和函数（比如可以终止处理函数链的执行exit）
        args = args.concat([{
            name: name, // 事件名
            length: length, // 事件处理函数的数量
            /**
             * 阻止继续执行函数处理链并退出
             */
            exit() {
                event.stop = true;
            }
        }]);
        if (length) {
            // 仅当存在处理函数时才执行
            handlers.forEach((handler) => {
                !event.stop && handler.apply(this, args);
            });
        }
    }
}

export default Event;