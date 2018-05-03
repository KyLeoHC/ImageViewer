let supportPassive = false;
try {
    let opts = Object.defineProperty({}, 'passive', {
        get: function () {
            supportPassive = true;
        }
    });
    window.addEventListener('test-passive', null, opts);
} catch (e) {
}

export default supportPassive;
