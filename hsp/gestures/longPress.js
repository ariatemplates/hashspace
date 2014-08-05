var hsp = require("../rt");
var klass = require("../klass");
var touchEvent = require("./touchEvent");
var Gesture = require("./gesture").Gesture;

var LongPress = klass({
    $extends : Gesture,

    /**
     * The move tolerance to validate the gesture.
     * @type Integer
     */
    MARGIN : 10,
    /**
     * The duration for the press.
     * @type Integer
     */
    PRESS_DURATION : 1000,

    /**
     * Initial listeners for the LongPress gesture.
     * @protected
     */
    _getInitialListenersList : function () {
        return [{
                    evt : this.touchEventMap.touchstart,
                    cb : this._longPressStart.bind(this)
                }];
    },

    /**
     * Additional listeners for the LongPress gesture.
     * @protected
     */
    _getAdditionalListenersList : function () {
        return [{
                    evt : this.touchEventMap.touchmove,
                    cb : this._longPressMove.bind(this)
                }, {
                    evt : this.touchEventMap.touchend,
                    cb : this._longPressCancel.bind(this)
                }];
    },

    /**
     * The fake events raised during the Tap lifecycle.
     * @protected
     */
    _getFakeEventsMap : function () {
        return {
            start : "longpressstart",
            finalize : "longpress",
            cancel : "longpresscancel"
        };
    },

    /**
     * LongPress start mgmt: gesture is started if only one touch.
     * @param {Object} event the original event
     * @protected
     * @return {Boolean} false if preventDefault is true
     */
    _longPressStart : function (event) {
        var status = this._gestureStart(event);
        if (status != null) {
            var _this = this;
            var eventCopy = {};
            for (var i in event) {
                eventCopy[i] = event[i];
            }
            this.timerId = setTimeout(function () {
                _this._longPressFinalize(eventCopy);
            }, this.PRESS_DURATION);
            return status;
        } else {
            if (this.timerId) {
                return this._longPressCancel(event);
            } else {
                return (event.returnValue != null) ? event.returnValue : !event.defaultPrevented;
            }
        }
    },

    /**
     * LongPress move mgmt: gesture continues if only one touch and if the move is within margins.
     * @param {Object} event the original event
     * @protected
     * @return {Boolean} false if preventDefault is true
     */
    _longPressMove : function (event) {
        var position = touchEvent.getPositions(event);
        if (this.MARGIN >= this._calculateDistance(this.startData.positions[0].x, this.startData.positions[0].y, position[0].x, position[0].y)) {
            var status = this._gestureMove(event);
            return (status == null) ? this._longPressCancel(event) : status;
        } else {
            return this._longPressCancel(event);
        }
    },

    /**
     * LongPress cancellation, occurs if wrong start or move (see above), or if an end event occurs before the end.
     * @param {Object} event the original event
     * @protected
     * @return {Boolean} false if preventDefault is true
     */
    _longPressCancel : function (event) {
        if (this.timerId) {
            clearTimeout(this.timerId);
            this.timerId = null;
        }
        return this._gestureCancel(event);
    },

    /**
     * LongPress finalization by firing the fake "longpress" event
     * @param {Object} event the original event
     * @protected
     */
    _longPressFinalize : function (event) {
        if (this.timerId) {
            clearTimeout(this.timerId);
            this.timerId = null;
        }
        this._gestureEnd(event);
        this._raiseFakeEvent(event, this._getFakeEventsMap().finalize);
    }

});

hsp.registerCustomAttributes(["onlongpress", "onlongpressstart", "onlongpresscancel"], LongPress);
