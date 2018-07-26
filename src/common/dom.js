const transformProp = (function () {
    const style = document.createElement('div').style;
    let props = ['transform', 'webkitTransform', 'MozTransform', 'oTransform', 'msTransform'];
    let availProp = '';
    props.forEach(function (prop) {
        if (style[prop] !== undefined) {
            availProp = prop;
        }
    });
    return availProp;
})();

// const transformOriginProp = (function () {
//     const style = document.createElement('div').style;
//     let props = ['transformOrigin', 'webkitTransformOrigin'];
//     let availProp = '';
//     props.forEach(function (prop) {
//         if (style[prop] !== undefined) {
//             availProp = prop;
//         }
//     });
//     return availProp;
// })();

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

// function setTransformOrigin(el, x, y) {
//     el.style[transformOriginProp] = `${x} ${y}`;
// }

function setTranslateStyle(el, x, y) {
    el.style[transformProp] = `translate3d(${x + 'px'},${y + 'px'},0)`;
}

function setScaleAndTranslateStyle(el, scale, x, y) {
    el.style[transformProp] = `translate3d(${x + 'px'},${y + 'px'},0) scale(${scale})`;
}

export {
    query,
    removeElement,
    setTranslateStyle,
    setScaleAndTranslateStyle
};
