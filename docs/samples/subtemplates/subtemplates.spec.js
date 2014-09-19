var hashTester = require('hsp/utils/hashtester');
var sample = require('./subtemplates.hsp');

describe('"Sub templates" sample', function () {

    var h;
    beforeEach(function () {
        h = hashTester.newTestContext();
        sample.template.apply(this, sample.data).render(h.container);
    });

    afterEach(function () {
        h.$dispose();
    });

    it('should render "Sub templates"', function () {
        
    });
});