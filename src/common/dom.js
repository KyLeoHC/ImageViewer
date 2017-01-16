let transitionEndEvent = (function () {
    let body = document.body || document.documentElement,
        style = body.style;
    let transEndEventNames = {
        WebkitTransition: 'webkitTransitionEnd',
        MozTransition: 'transitionend',
        OTransition: 'oTransitionEnd otransitionend',
        transition: 'transitionend'
    };
    for (let name in transEndEventNames) {
        if (typeof style[name] === "string") {
            return transEndEventNames[name];
        }
    }
})();
let transformProp = (function getTransformProperty() {
    let props = ['transform', 'webkitTransform', 'MozTransform', 'oTransform', 'msTransform'];
    let style = document.createElement('div').style, availProp = '';
    props.forEach(function (prop) {
        if (style[prop] !== undefined) {
            availProp = prop;
        }
    });
    return availProp;
})();

function query(selector, el) {
    el = el || document;
    return el.querySelectorAll(selector);
}

function removeElement(element) {
    let parentElement = element.parentNode;
    if (parentElement) {
        parentElement.removeChild(element);
    }
}

function setTranslateStyle(el, x, y) {
    el.style[transformProp] = `translate3d(${x + 'px'},${y + 'px'},0)`;
}

function setScaleAndTranslateStyle(el, scale, x, y) {
    el.style[transformProp] = `scale3d(${scale},${scale},1) translate3d(${x + 'px'},${y + 'px'},0)`;
}

export {
    query,
    removeElement,
    setTranslateStyle,
    setScaleAndTranslateStyle,
    transitionEndEvent
};