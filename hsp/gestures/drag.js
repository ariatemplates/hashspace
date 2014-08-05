var hsp = require("../rt");
var klass = require("../klass");
var touchEvent = require("./touchEvent");
var Gesture = require("./gesture").Gesture;

var Drag = klass({
    $extends : Gesture,

    /**
     * Initial listeners for the Drag gesture.
     * @protected
     */
    _getInitialListenersList : function () {
        return [{
                    evt : this.touchEventMap.touchstart,
                    cb : this._dragStart.bind(this)
                }];
    },

    /**
     * Additional listeners for the Drag gesture.
     * @protected
     */
    _getAdditionalListenersList : function () {
        return [{
                    evt : this.touchEventMap.touchmove,
                    cb : this._dragMove.bind(this)
                }, {
                    evt : this.touchEventMap.touchend,
                    cb : this._dragEnd.bind(this)
                }];
    },

    /**
     * The fake events raised during the Drag lifecycle.
     * @protected
     */
    _getFakeEventsMap : function () {
        return {
            dragstart : "dragstart",
            dragmove : "dragmove",
            dragend : "drag",
            cancel : "dragcancel"
        };
    },

    /**
     * Drag start mgmt: gesture is started if only one touch, first fake event to be fired with the first move.
     * @param {Object} event the original event
     * @protected
     * @return {Boolean} false if preventDefault is true
     */
    _dragStart : function (event) {
        var alreadyStarted = this.currentData != null;
        var status = this._gestureStart(event);
        if (status == null && alreadyStarted) {
            // if the gesture has already started, it has to be cancelled
            this.currentData = {
                positions : touchEvent.getPositions(event),
                time : (new Date()).getTime()
            };
            return this._raiseFakeEvent(event, this._getFakeEventsMap().cancel);
        } else {
            return status == null
                    ? ((event.returnValue != null) ? event.returnValue : !event.defaultPrevented)
                    : status;
        }
    },

    /**
     * Tap move mgmt: gesture starts/continues if only one touch.
     * @param {Object} event the original event
     * @protected
     * @return {Boolean} false if preventDefault is true
     */
    _dragMove : function (event) {
        var alreadyStarted = this.currentData != null;
        var status = this._gestureMove(event);
        if (status != null) {
            // Gesture starts
            var eventName = this._getFakeEventsMap().dragstart;
            if (alreadyStarted) {
                // Gesture moves
                eventName = this._getFakeEventsMap().dragmove;
            }
            return this._raiseFakeEvent(event, eventName);
        } else {
            this.currentData = null;
            return (alreadyStarted) ? this._gestureCancel(event) : (event.returnValue != null)
                    ? event.returnValue
                    : !event.defaultPrevented;
        }
    },

    /**
     * Drag end mgmt: gesture ends if only one touch.
     * @param {Object} event the original event
     * @protected
     * @return {Boolean} false if preventDefault is true
     */
    _dragEnd : function (event) {
        var alreadyStarted = this.currentData != null;
        var status = this._gestureEnd(event);
        if (alreadyStarted) {
            return (status == null)
                    ? ((event.returnValue != null) ? event.returnValue : !event.defaultPrevented)
                    : this._raiseFakeEvent(event, this._getFakeEventsMap().dragend);
        } else {
            return (event.returnValue != null) ? event.returnValue : !event.defaultPrevented;
        }

    }

});

hsp.registerCustomAttributes(["ondrag", "ondragstart", "ondragmove", "ondragcancel"], Drag);
