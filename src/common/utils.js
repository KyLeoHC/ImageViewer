/**
 * 判断是不是数值
 * @param value
 * @returns {boolean}
 */
const isNumber = value => {
    const numberValue = parseFloat(value);
    return numberValue === value;
};

/**
 * 判断给定的值是不是纯粹的对象
 * @param value
 */
const isPlainObject = value => {
    return Object.prototype.toString.call(value) === '[object Object]';
};

export {
    isNumber,
    isPlainObject
};
