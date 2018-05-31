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

/**
 * 比较两个值(取绝对值)
 * @param a
 * @param b
 */
const compareNumberABS = (a = 0, b = 0) => {
    return Math.abs(a - b) > 0.05;
};

export {
    isNumber,
    isPlainObject,
    compareNumberABS
};
