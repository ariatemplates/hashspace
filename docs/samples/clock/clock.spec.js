var hashTester = require('hsp/utils/hashtester');
var sample = require('./clock.hsp');
var browser = require("hsp/rt/browser.js");

describe('"Clock" sample', function () {

    var h;
    beforeEach(function () {
        h = hashTester.newTestContext();
        sample.template.apply(this, []).render(h.container);
    });

    afterEach(function () {
        h.logs.clear();
        h.$dispose();
    });

    it('should render "Clock"', function () {
        if (browser.supportsSvg()) {
            var circles = h.container.querySelectorAll("circle");
            for (var i = 0; i < circles.length; i++) {
                expect(circles[i].className.baseVal).to.equal("clock-face");
            }
        }
    });
});