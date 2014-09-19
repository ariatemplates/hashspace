var hashTester = require('hsp/utils/hashtester');
var sample = require('./logs.hsp');

describe('"Logs" sample', function () {

    var h;
    beforeEach(function () {
        h = hashTester.newTestContext();
        sample.template.apply(this, sample.data).render(h.container);
    });

    afterEach(function () {
        h.logs.clear();
        h.$dispose();
    });

    it('should render "Logs"', function () {
        expect(h.logs().length).to.equal(4);
    });
});