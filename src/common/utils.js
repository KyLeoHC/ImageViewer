/**
 * 判断是不是数值
 * @param value
 * @returns {boolean}
 */
const isNumber = value => {
    const numberValue = parseFloat(value);
    return numberValue === value;
};

export {
    isNumber
};
