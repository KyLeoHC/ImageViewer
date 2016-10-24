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
    let styleTemplate = 'translate3d($X,$Y,0)';
    el.style[transformProp] = styleTemplate.replace('$X', x + 'px').replace('$Y', y + 'px');
}

function setScaleAndTranslateStyle(el, scale, x, y) {
    let styleTemplate = 'scale3d($scale,$scale,1) translate3d($X,$Y,0)';
    el.style[transformProp] = styleTemplate.replace(/\$scale/g, scale + '').replace('$X', x + 'px').replace('$Y', y + 'px');
}

export {
    query,
    removeElement,
    setTranslateStyle,
    setScaleAndTranslateStyle
};