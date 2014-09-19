var hashTester = require('hsp/utils/hashtester');
var sample = require('./dynpath.hsp');

describe('"Dynamic data path" sample', function () {

    var h;
    beforeEach(function () {
        h = hashTester.newTestContext();
        sample.template.apply(this, sample.data).render(h.container);
    });

    afterEach(function () {
        h.$dispose();
    });

    it('should render "Dynamic data path"', function () {
        
    });
});