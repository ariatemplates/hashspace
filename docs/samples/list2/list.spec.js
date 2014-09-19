var hashTester = require('hsp/utils/hashtester');
var sample = require('./list.hsp');

describe('"List #2" sample', function () {

    var h;
    beforeEach(function () {
        h = hashTester.newTestContext();
        sample.template.apply(this, sample.data).render(h.container);
    });

    afterEach(function () {
        h.$dispose();
    });

    it('should render "List #2"', function () {
        
    });
});