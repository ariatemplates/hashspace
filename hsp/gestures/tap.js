var hsp = require("../rt");
var klass = require("../klass");
var touchEvent = require("./touchEvent");
var Gesture = require("./gesture").Gesture;

var Tap = klass({
    $extends : Gesture,

    /**
     * The move tolerance to validate the gesture.
     * @type Integer
     */
    MARGIN : 10,

    /**
     * Initial listeners for the Tap gesture.
     * @protected
     */
    _getInitialListenersList : function () {
        return [{
                    evt : this.touchEventMap.touchstart,
                    cb : this._tapStart.bind(this)
                }];
    },

    /**
     * Additional listeners for the Tap gesture.
     * @protected
     */
    _getAdditionalListenersList : function () {
        return [{
                    evt : this.touchEventMap.touchmove,
                    cb : this._tapMove.bind(this)
                }, {
                    evt : this.touchEventMap.touchend,
                    cb : this._tapEnd.bind(this)
                }];
    },

    /**
     * The fake events raised during the Tap lifecycle.
     * @protected
     */
    _getFakeEventsMap : function () {
        return {
            start : "tapstart",
            end : "tap",
            cancel : "tapcancel"
        };
    },

    /**
     * Tap start mgmt: gesture is started if only one touch.
     * @param {Object} event the original event
     * @protected
     * @return {Boolean} false if preventDefault is true
     */
    _tapStart : function (event) {
        var status = this._gestureStart(event);
        return (status == null)
                ? ((event.returnValue != null) ? event.returnValue : !event.defaultPrevented)
                : status;
    },

    /**
     * Tap move mgmt: gesture continues if only one touch and if the move is within margins.
     * @param {Object} event the original event
     * @protected
     * @return {Boolean} false if preventDefault is true
     */
    _tapMove : function (event) {
        var position = touchEvent.getPositions(event);
        if (this.MARGIN >= this._calculateDistance(this.startData.positions[0].x, this.startData.positions[0].y, position[0].x, position[0].y)) {
            var status = this._gestureMove(event);
            return (status == null) ? this._gestureCancel(event) : status;
        } else {
            return this._gestureCancel(event);
        }
    },

    /**
     * Tap end mgmt: gesture ends if only one touch.
     * @param {Object} event the original event
     * @protected
     * @return {Boolean} false if preventDefault is true
     */
    _tapEnd : function (event) {
        var status = this._gestureEnd(event);
        return (status == null) ? this._gestureCancel(event) : (event.returnValue != null)
                ? event.returnValue
                : !event.defaultPrevented;
    }

});

hsp.registerCustomAttributes(["ontap", "ontapstart", "ontapcancel"], Tap);
