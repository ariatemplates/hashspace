var hsp = require("../rt");
var klass = require("../klass");
var touchEvent = require("./touchEvent");
var Gesture = require("./gesture").Gesture;

var Pinch = klass({
    $extends : Gesture,

    /**
     * Defines the number of touch for the gesture.
     */
    NB_TOUCHES : 2,

    /**
     * Initial listeners for the Pinch gesture.
     * @protected
     */
    _getInitialListenersList : function () {
        return [{
                    evt : this.touchEventMap.touchstart,
                    cb : this._pinchStart.bind(this)
                }];
    },

    /**
     * Additional listeners for the Pinch gesture.
     * @protected
     */
    _getAdditionalListenersList : function () {
        return [{
                    evt : this.touchEventMap.touchmove,
                    cb : this._pinchMove.bind(this)
                }, {
                    evt : this.touchEventMap.touchend,
                    cb : this._pinchEnd.bind(this)
                }];
    },

    /**
     * The fake events raised during the Pinch lifecycle.
     * @protected
     */
    _getFakeEventsMap : function () {
        return {
            start : "pinchstart",
            move : "pinchmove",
            end : "pinch",
            cancel : "pinchcancel"
        };
    },

    /**
     * Pinch start mgmt: gesture is started if only two touches.
     * @param {Object} event the original event
     * @protected
     * @return {Boolean} false if preventDefault is true
     */
    _pinchStart : function (event) {
        // Standard touch
        if (event.touches && event.touches.length >= 2) {
            var positions = touchEvent.getPositions(event);
            this.primaryPoint = positions[0];
            this.secondaryPoint = positions[1];
        }
        // IE10 primary touch
        else if (event.isPrimary) {
            this.primaryPoint = touchEvent.getPositions(event)[0];
        }
        // IE10 secondary touch
        else if (typeof event.isPrimary != 'undefined' && event.isPrimary === false) {
            this.secondaryPoint = touchEvent.getPositions(event)[0];
        }
        if (event.touches && event.touches.length >= 2 || typeof event.isPrimary != 'undefined'
                && event.isPrimary === false) {
            var dist = this._calculateDistance(this.primaryPoint.x, this.primaryPoint.y, this.secondaryPoint.x, this.secondaryPoint.y);
            var angle = this.__calculateAngle(this.primaryPoint.x, this.primaryPoint.y, this.secondaryPoint.x, this.secondaryPoint.y);
            this.initialPinchData = {
                distance : dist,
                dVariation : 0,
                angle : angle
            };
            this.lastKnownAngle = angle;
            return this._gestureStart(event, this.initialPinchData);
        } else {
            return (event.returnValue != null) ? event.returnValue : !event.defaultPrevented;
        }
    },

    /**
     * Pinch move mgmt: gesture continues if only two touches.
     * @param {Object} event the original event
     * @protected
     * @return {Boolean} false if preventDefault is true
     */
    _pinchMove : function (event) {
        // Standard touch
        if (event.touches && event.touches.length >= 2) {
            var positions = touchEvent.getPositions(event);
            this.primaryPoint = positions[0];
            this.secondaryPoint = positions[1];
        }
        // IE 10 touch
        else if (typeof event.isPrimary != 'undefined') {
            if (event.isPrimary) {
                this.primaryPoint = touchEvent.getPositions(event);
            } else {
                this.secondaryPoint = touchEvent.getPositions(event);
            }
        } else {
            this.$raiseEvent({
                name : "pinchcancel"
            });
            return this._gestureCancel(event);
        }
        var currentDist = this._calculateDistance(this.primaryPoint.x, this.primaryPoint.y, this.secondaryPoint.x, this.secondaryPoint.y);
        var currentAngle = this.__calculateAngle(this.primaryPoint.x, this.primaryPoint.y, this.secondaryPoint.x, this.secondaryPoint.y);
        this.lastKnownAngle = currentAngle;
        var currentData = {
            distance : currentDist,
            dVariation : (currentDist - this.initialPinchData.distance),
            angle : currentAngle
        };
        return this._gestureMove(event, currentData);

    },

    /**
     * Pinch end mgmt: gesture ends if only two touches.
     * @param {Object} event the original event
     * @protected
     * @return {Boolean} false if preventDefault is true
     */
    _pinchEnd : function (event) {
        // Standard touch
        if (event.touches && event.changedTouches
                && (event.changedTouches.length || 0) + (event.touches.length || 0) >= 2) {
            var positions = touchEvent.getPositions(event);
            this.primaryPoint = positions[0];
            this.secondaryPoint = positions[1];
        }
        // IE10 touch
        if (typeof event.isPrimary != 'undefined') {
            if (event.isPrimary) {
                this.primaryPoint = touchEvent.getPositions(event);
            } else {
                this.secondaryPoint = touchEvent.getPositions(event);
            }
        }
        if (event.touches && event.changedTouches
                && (event.changedTouches.length || 0) + (event.touches.length || 0) >= 2
                || typeof event.isPrimary != 'undefined') {
            var finalDist = this._calculateDistance(this.primaryPoint.x, this.primaryPoint.y, this.secondaryPoint.x, this.secondaryPoint.y);
            var finalAngle = this.__calculateAngle(this.primaryPoint.x, this.primaryPoint.y, this.secondaryPoint.x, this.secondaryPoint.y);
            if (Math.abs(finalAngle - this.lastKnownAngle) > 150) {
                finalAngle = this.__calculateAngle(this.secondaryPoint.x, this.secondaryPoint.y, this.primaryPoint.x, this.primaryPoint.y);
            }
            var finalData = {
                distance : finalDist,
                dVariation : (finalDist - this.initialPinchData.distance),
                angle : finalAngle
            };
            return this._gestureEnd(event, finalData);
        } else {
            return this._gestureCancel(event);
        }
    },

    /**
     * Returns the angle of the line defined by two points, and the x axes.
     * @param {Integer} x1 x of the first point
     * @param {Integer} y1 y of the first point
     * @param {Integer} x2 x of the second point
     * @param {Integer} y2 y of the second point
     * @private
     * @return {Number} the angle in degrees ]-180; 180]
     */
    __calculateAngle : function (x1, y1, x2, y2) {
        return Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
    }

});

hsp.registerCustomAttributes(["onpinch", "onpinchstart", "onpinchmove", "onpinchcancel"], Pinch);
