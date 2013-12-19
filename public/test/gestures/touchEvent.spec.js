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
 * Taken from Aria Templates: https://github.com/ariatemplates/ariatemplates/blob/master/test/aria/touch/EventTest.js
 */

var touchEvent = require("hsp/gestures/touchEvent");

describe("Touch Event", function () {

    it("tests IE10+ events", function () {
        var backup = window.navigator.msPointerEnabled;
        window.navigator.msPointerEnabled = true;

        var primaryEvent = {};
        primaryEvent.pageX = 12;
        primaryEvent.pageY = 24;
        primaryEvent.isPrimary = true;
        expect(touchEvent.getFingerIndex(primaryEvent)).toEqual(0);
        var positions = touchEvent.getPositions(primaryEvent);
        expect(positions.length == 1 && positions[0].x == 12 && positions[0].y == 24).toEqual(true);

        var secondaryEvent = {};
        secondaryEvent.pageX = 13;
        secondaryEvent.pageY = 25;
        secondaryEvent.isPrimary = false;
        expect(touchEvent.getFingerIndex(secondaryEvent)).toEqual(1);
        var positions = touchEvent.getPositions(secondaryEvent);
        expect(positions.length == 1 && positions[0].x == 13 && positions[0].y == 25).toEqual(true);

        window.navigator.msPointerEnabled = backup;
    });

    it("tests desktop events", function () {
        var event = {};
        event.pageX = 35;
        event.pageY = 36;
        event.isPrimary = true;
        expect(touchEvent.getFingerIndex(event)).toEqual(0);
        var positions = touchEvent.getPositions(event);
        expect(positions.length == 1 && positions[0].x == 35 && positions[0].y == 36).toEqual(true);
    });

    it("tests single touch events", function () {
        var startEvent = {};
        startEvent.type = touchEvent.touchEventMap.touchstart;
        startEvent.touches = [{
                    pageX : 10,
                    pageY : 17
                }];
        startEvent.changedTouches = [{
                    pageX : 10,
                    pageY : 17
                }];
        startEvent.isPrimary = true;
        expect(touchEvent.getFingerIndex(startEvent)).toEqual(0);
        var positions = touchEvent.getPositions(startEvent);
        expect(positions.length == 1 && positions[0].x == 10 && positions[0].y == 17).toEqual(true);

        var moveEvent = {};
        moveEvent.type = touchEvent.touchEventMap.touchmove;
        moveEvent.touches = [{
                    pageX : 10,
                    pageY : 17
                }];
        moveEvent.changedTouches = [{
                    pageX : 10,
                    pageY : 17
                }];
        moveEvent.isPrimary = true;
        expect(touchEvent.getFingerIndex(moveEvent)).toEqual(0);
        var positions = touchEvent.getPositions(moveEvent);
        expect(positions.length == 1 && positions[0].x == 10 && positions[0].y == 17).toEqual(true);

        var endEvent = {};
        endEvent.type = touchEvent.touchEventMap.touchend;
        endEvent.touches = [];
        endEvent.changedTouches = [{
                    pageX : 10,
                    pageY : 17
                }];
        endEvent.isPrimary = true;
        expect(touchEvent.getFingerIndex(endEvent)).toEqual(0);
        var positions = touchEvent.getPositions(endEvent);
        expect(positions.length == 1 && positions[0].x == 10 && positions[0].y == 17).toEqual(true);
    });

    it("tests double touch events", function () {
        var isIE10 = window.navigator.msPointerEnabled || false;

        // Two fingers starting together
        var startEvent = {};
        if (!isIE10) {
            startEvent.type = touchEvent.touchEventMap.touchstart;
            startEvent.touches = [{
                        pageX : 10,
                        pageY : 17
                    }, {
                        pageX : 31,
                        pageY : 35
                    }];
            startEvent.changedTouches = [{
                        pageX : 10,
                        pageY : 17
                    }, {
                        pageX : 31,
                        pageY : 35
                    }];
            expect(touchEvent.getFingerIndex(startEvent)).toEqual(102);
            var positions = touchEvent.getPositions(startEvent);
            expect(positions.length == 2 && positions[0].x == 10 && positions[0].y == 17
                    && positions[1].x == 31 && positions[1].y == 35).toEqual(true);
        }

        // Second finger starts after first one is already touching
        startEvent.touches = [{
                    pageX : 10,
                    pageY : 17
                }, {
                    pageX : 31,
                    pageY : 35
                }];
        startEvent.changedTouches = [{
                    pageX : 31,
                    pageY : 35
                }];
        startEvent.isPrimary = false;
        expect(touchEvent.getFingerIndex(startEvent)).toEqual(1);
        var positions = touchEvent.getPositions(startEvent);
        expect(positions.length == 2 && positions[0].x == 10 && positions[0].y == 17
                && positions[1].x == 31 && positions[1].y == 35).toEqual(true);

        // First finger moving
        var moveEvent = {};
        moveEvent.type = touchEvent.touchEventMap.touchmove;
        moveEvent.touches = [{
                    pageX : 10,
                    pageY : 17
                }, {
                    pageX : 31,
                    pageY : 35
                }];
        moveEvent.changedTouches = [{
                    pageX : 31,
                    pageY : 35
                }];
        moveEvent.isPrimary = false;
        expect(touchEvent.getFingerIndex(moveEvent)).toEqual(1);
        var positions = touchEvent.getPositions(moveEvent);
        expect(positions.length == 2 && positions[0].x == 10 && positions[0].y == 17
                && positions[1].x == 31 && positions[1].y == 35).toEqual(true);

        // Second finger moving
        moveEvent.changedTouches = [{
                    pageX : 10,
                    pageY : 17
                }];
        moveEvent.isPrimary = true;
        expect(touchEvent.getFingerIndex(moveEvent)).toEqual(0);
        var positions = touchEvent.getPositions(moveEvent);
        expect(positions.length == 2 && positions[0].x == 10 && positions[0].y == 17
                && positions[1].x == 31 && positions[1].y == 35).toEqual(true);

        // Both fingers moving together
        if (!isIE10) {
            moveEvent.changedTouches = [{
                        pageX : 10,
                        pageY : 17
                    }, {
                        pageX : 31,
                        pageY : 35
                    }];
            expect(touchEvent.getFingerIndex(moveEvent)).toEqual(102);
            var positions = touchEvent.getPositions(moveEvent);
            expect(positions.length == 2 && positions[0].x == 10 && positions[0].y == 17
                    && positions[1].x == 31 && positions[1].y == 35).toEqual(true);
        }

        // One finger ending while the other is still touching
        var endEvent = {};
        endEvent.type = touchEvent.touchEventMap.touchend;
        endEvent.touches = [{
                    pageX : 10,
                    pageY : 17
                }];
        endEvent.changedTouches = [{
                    pageX : 31,
                    pageY : 35
                }];
        endEvent.isPrimary = false;
        expect(touchEvent.getFingerIndex(endEvent)).toEqual(1);
        var positions = touchEvent.getPositions(endEvent);
        expect(positions.length == 2 && positions[0].x == 10 && positions[0].y == 17
                && positions[1].x == 31 && positions[1].y == 35).toEqual(true);

        // Both fingers ending together
        if (!isIE10) {
            endEvent.touches = [];
            endEvent.changedTouches = [{
                        pageX : 10,
                        pageY : 17
                    }, {
                        pageX : 31,
                        pageY : 35
                    }];
            expect(touchEvent.getFingerIndex(endEvent)).toEqual(102);
            var positions = touchEvent.getPositions(endEvent);
            expect(positions.length == 2 && positions[0].x == 10 && positions[0].y == 17
                    && positions[1].x == 31 && positions[1].y == 35).toEqual(true);
        }
    });

    it("tests fake event creation", function () {
        var fakeEvent = touchEvent.getFakeEvent("tap", window.document.body);
        expect(fakeEvent.type).toEqual("tap");
    });
});