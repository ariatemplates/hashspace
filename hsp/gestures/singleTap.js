var hsp = require("../rt");
var klass = require("../klass");
var touchEvent = require("./touchEvent");
var Gesture = require("./gesture").Gesture;

var SingleTap = klass({
    $extends : Gesture,

    /**
     * The move tolerance to validate the gesture.
     * @type Integer
     */
    MARGIN : 10,

    /**
     * The delay before validating the gesture, after the end event.
     * @type Integer
     */
    FINAL_DELAY : 250,

    /**
     * Initial listeners for the SingleTap gesture.
     * @protected
     */
    _getInitialListenersList : function () {
        return [{
                    evt : this.touchEventMap.touchstart,
                    cb : this._singleTapStart.bind(this)
                }];
    },

    /**
     * Additional listeners for the SingleTap gesture.
     * @protected
     */
    _getAdditionalListenersList : function () {
        return [{
                    evt : this.touchEventMap.touchmove,
                    cb : this._singleTapMove.bind(this)
                }, {
                    evt : this.touchEventMap.touchend,
                    cb : this._singleTapEnd.bind(this)
                }];
    },

    /**
     * The fake events raised during the SingleTap lifecycle.
     * @protected
     */
    _getFakeEventsMap : function () {
        return {
            start : "singletapstart",
            cancel : "singletapcancel",
            finalize : "singletap"
        };
    },

    /**
     * SingleTap start mgmt: gesture is started if only one touch.
     * @param {Object} event the original event
     * @protected
     * @return {Boolean} false if preventDefault is true
     */
    _singleTapStart : function (event) {
        if (this.timerId) {
            // Cancels the current gesture if a start event occurs during the FINAL_DELAY ms period.
            return this._singleTapFinalCancel(event);
        } else {
            var status = this._gestureStart(event);
            return (status == null)
                    ? (event.returnValue != null) ? event.returnValue : !event.defaultPrevented
                    : status;
        }
    },

    /**
     * singleTap move mgmt: gesture continues if only one touch and if the move is within margins.
     * @param {Object} event the original event
     * @protected
     * @return {Boolean} false if preventDefault is true
     */
    _singleTapMove : function (event) {
        var position = touchEvent.getPositions(event);
        if (this.MARGIN >= this._calculateDistance(this.startData.positions[0].x, this.startData.positions[0].y, position[0].x, position[0].y)) {
            var status = this._gestureMove(event);
            return (status == null) ? this._singleTapCancel(event) : status;
        } else {
            return this._singleTapCancel(event);
        }
    },

    /**
     * SingleTap end mgmt: if only one touch, the gesture will be finalized FINAL_DELAY ms later, if no start event
     * in between.
     * @param {Object} event the original event
     * @protected
     * @return {Boolean} false if preventDefault is true
     */
    _singleTapEnd : function (event) {
        var status = this._gestureEnd(event);
        if (status != null) {
            var _this = this;
            var eventCopy = {};
            for (var i in event) {
                eventCopy[i] = event[i];
            }
            this.timerId = setTimeout(function () {
                _this._singleTapFinalize(eventCopy);
            }, this.FINAL_DELAY);
            return status;
        } else {
            return this._singleTapCancel(event);
        }
    },

    /**
     * SingleTap cancellation.
     * @param {Object} event the original event
     * @protected
     * @return {Boolean} false if preventDefault is true
     */
    _singleTapCancel : function (event) {
        if (this.timerId) {
            clearTimeout(this.timerId);
            this.timerId = null;
        }
        return this._gestureCancel(event);
    },

    /**
     * SingleTap finalization by firing the fake "singletap" event
     * @param {Object} event the original event
     * @protected
     */
    _singleTapFinalize : function (event) {
        if (this.timerId) {
            clearTimeout(this.timerId);
            this.timerId = null;
        }
        this._raiseFakeEvent(event, this._getFakeEventsMap().finalize);
    },

    /**
     * SingleTap cancellation outside the lifecycle window.
     * @param {Object} event the original event
     * @protected
     * @return {Boolean} false if preventDefault is true
     */
    _singleTapFinalCancel : function (event) {
        if (this.timerId) {
            clearTimeout(this.timerId);
            this.timerId = null;
        }
        return this._raiseFakeEvent(event, this._getFakeEventsMap().cancel);
    }

});

hsp.registerCustomAttributes(["onsingletap", "onsingletapstart", "onsingletapcancel"], SingleTap);
