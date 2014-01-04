var json=require("hsp/json");

/**
 * Shortcut to json.set()
 */
module.exports = function(object, property, value) {
    json.set(object, property, value);
};
