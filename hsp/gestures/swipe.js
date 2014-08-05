var hsp = require("../rt");
var klass = require("../klass");
var touchEvent = require("./touchEvent");
var Gesture = require("./gesture").Gesture;

var Swipe = klass({
    $extends : Gesture,

    /**
     * The move tolerance to validate the gesture.
     * @type Integer
     */
    MARGIN : 20,

    /**
     * Initial listeners for the Swipe gesture.
     * @protected
     */
    _getInitialListenersList : function () {
        return [{
                    evt : this.touchEventMap.touchstart,
                    cb : this._swipeStart.bind(this)
                }];
    },

    /**
     * Additional listeners for the Swipe gesture.
     * @protected
     */
    _getAdditionalListenersList : function () {
        return [{
                    evt : this.touchEventMap.touchmove,
                    cb : this._swipeMove.bind(this)
                }, {
                    evt : this.touchEventMap.touchend,
                    cb : this._swipeEnd.bind(this)
                }];
    },

    /**
     * The fake events raised during the Swipe lifecycle.
     * @protected
     */
    _getFakeEventsMap : function () {
        return {
            start : "swipestart",
            move : "swipemove",
            end : "swipe",
            cancel : "swipecancel"
        };
    },

    /**
     * Swipe start mgmt: gesture is started if only one touch.
     * @param {Object} event the original event
     * @protected
     * @return {Boolean} false if preventDefault is true
     */
    _swipeStart : function (event) {
        var status = this._gestureStart(event);
        if (status != null) {
            return status;
        } else {
            return (event.returnValue != null) ? event.returnValue : !event.defaultPrevented;
        }

    },

    /**
     * Swipe move mgmt: gesture continues if only one touch and if the move is within margins.
     * @param {Object} event the original event
     * @protected
     * @return {Boolean} false if preventDefault is true
     */
    _swipeMove : function (event) {
        var route = this._getRoute(this.startData.positions[0], touchEvent.getPositions(event)[0]);
        if (route) {
            var status = this._gestureMove(event, route);
            if (status != null) {
                return status;
            } else {
                return this._swipeCancel(event);
            }
        } else {
            return this._swipeCancel(event);
        }
    },

    /**
     * Swipe end mgmt: gesture ends if only one touch and if the end is within margins.
     * @param {Object} event the original event
     * @protected
     * @return {Boolean} false if preventDefault is true
     */
    _swipeEnd : function (event) {
        var route = this._getRoute(this.startData.positions[0], touchEvent.getPositions(event)[0]);
        if (route) {
            var status = this._gestureEnd(event, route);
            if (status != null) {
                return status;
            } else {
                return this._swipeCancel(event);
            }
        } else {
            return this._swipeCancel(event);
        }
    },

    /**
     * SingleTap cancellation.
     * @param {Object} event the original event
     * @protected
     * @return {Boolean} false if preventDefault is true
     */
    _swipeCancel : function (event) {
        return this._gestureCancel(event);
    },

    /**
     * Returns the direction and the distance of the swipe. Direction: left, right, up, down. Distance: positive
     * integer measured from touchstart and touchend. Will return false if the gesture is not a swipe.
     * @param {Object} startPosition contains the x,y position of the start of the gesture
     * @param {Object} startPosition contains the current x,y position of the gesture
     * @public
     * @return {Object} contains the direction and distance
     */
    _getRoute : function (startPosition, endPosition) {
        var directionX = endPosition.x - startPosition.x;
        var directionY = endPosition.y - startPosition.y;
        var absDirectionX = Math.abs(directionX);
        var absDirectionY = Math.abs(directionY);
        var vertical = ((absDirectionY >= absDirectionX) && (absDirectionX <= this.MARGIN));
        var horizontal = ((absDirectionX > absDirectionY) && (absDirectionY <= this.MARGIN));
        if (vertical) {
            return {
                "direction" : (directionY < 0) ? "up" : "down",
                "distance" : absDirectionY,
                "startX" : startPosition.x,
                "startY" : startPosition.y,
                "endX" : endPosition.x,
                "endY" : endPosition.y
            };
        }
        if (horizontal) {
            return {
                "direction" : (directionX < 0) ? "left" : "right",
                "distance" : absDirectionX,
                "startX" : startPosition.x,
                "startY" : startPosition.y,
                "endX" : endPosition.x,
                "endY" : endPosition.y
            };
        }
        return false;
    }

});

hsp.registerCustomAttributes(["onswipe", "onswipestart", "onswipemove", "onswipecancel"], Swipe);
