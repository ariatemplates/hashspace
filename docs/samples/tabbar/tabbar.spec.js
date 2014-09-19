var hashTester = require('hsp/utils/hashtester');
var sample = require('./tabbar.hsp');

describe('"Tab bar" sample', function () {

    var h;
    beforeEach(function () {
        h = hashTester.newTestContext();
        sample.template.apply(this, []).render(h.container);
    });

    afterEach(function () {
        h.$dispose();
    });

    it('should render "Tab bar"', function () {
        
    });
});