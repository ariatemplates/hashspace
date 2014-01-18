/*
 * Copyright 2012 Amadeus s.a.s.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Taken from Aria Templates: https://github.com/ariatemplates/ariatemplates/blob/master/test/aria/touch/gestures/Tap.js
 */

 var fireDomEvent = require("hsp/utils/fireDomEvent");
 var touchEventMap = require("hsp/gestures/touchEvent").touchEventMap;

 /***
# template test1(ctl)
    <div title="test1" ontap="{ctl.handleTap(event)}" ontapstart="{ctl.handleTap(event)}" ontapcancel="{ctl.handleTap(event)}">
        Hello!
    </div>
# /template
***/
var test1 = require("hsp/rt").template(["ctl"], function(n) {
    return [n.elt(
        "div",
        {e1:[3,2,"ctl","handleTap",1,2],e2:[0,1,"event"],e3:[3,2,"ctl","handleTap",1,4],e4:[0,1,"event"],e5:[3,2,"ctl","handleTap",1,6],e6:[0,1,"event"]},
        {"title":"test1"},
        {"tap":1,"tapstart":3,"tapcancel":5},
        [n.$text(0,["Hello! "])]
    )];
});

describe("Tap gesture", function () {

    function validate(expected, result) {
        expect(expected.length).toEqual(result.length);
        for (var i = 0; i < expected.length; i ++) {
            expect(expected[i]).toEqual(result[i]);
        }
    }

    it("tests a cancel tap: touchstart, touchmove with 2 fingers", function () {
        var expected =  ["tapstart", "tapcancel"];
        var result = [];
        var ctl = {
            handleTap : function (evt) {
                result.push(evt.type);
            }
        };
        var n = test1(ctl);
        fireDomEvent.fireEvent(touchEventMap.touchstart, n.node.firstChild, {
            isPrimary : true,
            touches : [{
                        clientX : 0,
                        clientY : 0
                    }],
            changedTouches : [{
                        clientX : 0,
                        clientY : 0
                    }]
        });
        fireDomEvent.fireEvent(touchEventMap.touchmove, n.node.firstChild, {
            isPrimary : false,
            touches : [{
                        clientX : 0,
                        clientY : 0
                    }, {
                        clientX : 5,
                        clientY : 5
                    }],
            changedTouches : [{
                        clientX : 5,
                        clientY : 5
                    }]
        });
        validate(expected, result);
        n.$dispose();
    });

    it("tests a cancel tap: touchstart, touchmove with distance > 10", function () {
        var expected =  ["tapstart", "tapcancel"];
        var result = [];
        var ctl = {
            handleTap : function (evt) {
                result.push(evt.type);
            }
        };
        var n = test1(ctl);
        fireDomEvent.fireEvent(touchEventMap.touchstart, n.node.firstChild, {
            clientX : 0,
            clientY : 0
        });
        fireDomEvent.fireEvent(touchEventMap.touchmove, n.node.firstChild, {
            clientX : 100,
            clientY : 100
        });
        fireDomEvent.fireEvent(touchEventMap.touchend, n.node.firstChild, {
            clientX : 100,
            clientY : 100
        });
        validate(expected, result);
        n.$dispose();
    });

    it("tests a valid tap: touchstart, touchmove with distance <= 10, touchend", function () {
        var expected =  ["tapstart", "tap"];
        var result = [];
        var ctl = {
            handleTap : function (evt) {
                result.push(evt.type);
            }
        };
        var n = test1(ctl);
        fireDomEvent.fireEvent(touchEventMap.touchstart, n.node.firstChild, {
            clientX : 0,
            clientY : 0
        });
        fireDomEvent.fireEvent(touchEventMap.touchmove, n.node.firstChild, {
            clientX : 5,
            clientY : 5
        });
        fireDomEvent.fireEvent(touchEventMap.touchend, n.node.firstChild, {
            clientX : 5,
            clientY : 5
        });
        validate(expected, result);
        n.$dispose();
    });

});
