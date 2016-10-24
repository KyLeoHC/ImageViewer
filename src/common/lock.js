class Lock {
    constructor() {
        this._locks = {};
    }

    addLock(name) {
        this._locks[name] = false;
    }

    deleteLock(name) {
        delete this._locks[name];
    }

    getLock(name) {
        this._locks[name] = true;
    }

    releaseLock(name) {
        this._locks[name] = false;
    }

    getLockState(name) {
        return this._locks[name];
    }
}

export default new Lock();