var hashTester = require('hsp/utils/hashtester');
var sample = require('./pagination.hsp');

describe('"Pagination" sample', function () {

    var h;
    beforeEach(function () {
        h = hashTester.newTestContext();
        sample.template.apply(this, sample.data).render(h.container);
    });

    afterEach(function () {
        h.$dispose();
    });

    it('should render "Pagination"', function () {
        
    });
});