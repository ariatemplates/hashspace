var json = require("./json");

/**
 * Shortcut to json.$set()
 */
var $set = module.exports = function (object, property, value) {
    return json.$set(object, property, value);
};

/**
 * Shortcut to json.$delete()
 */
$set.del = json.$delete;

var cachedOperators = {};

function createOperator (operator) {
    /*jshint -W061,-W093 */
    return cachedOperators[operator] = Function("a", "b", "a" + operator + "b;return a;");
    /*jshint +W061,+W093*/
}

/**
 * Does an assignment operation but also notifies listeners.
 * <code>$set.op(a,b,"+=",c)</code> is equivalent to <code>a[b] += c</code>
 */
$set.op = function (object, property, operator, value) {
    var opFn = cachedOperators[operator] || createOperator(operator);
    return $set(object, property, opFn(object[property], value));
};

/**
 * Increments a property on an object and notifies listeners.
 * <code>$set.inc(a,b)</code> is equivalent to <code>a[b]++</code>
 */
$set.inc = function (object, property) {
    var previousValue = object[property];
    $set(object, property, previousValue + 1);
    return previousValue;
};

/**
 * Decrements a property on an object and notifies listeners.
 * <code>$set.dec(a,b)</code> is equivalent to <code>a[b]--</code>
 */
$set.dec = function (object, property) {
    var previousValue = object[property];
    $set(object, property, previousValue - 1);
    return previousValue;
};
