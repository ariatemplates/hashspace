var hashTester = require('hsp/utils/hashtester');
var sample = require('./clock.hsp');

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
        
    });
});