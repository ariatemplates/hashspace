var hashTester = require('hsp/utils/hashtester');
var sample = require('./modifiers.hsp');

describe('"Modifiers" sample', function () {

    var h;
    beforeEach(function () {
        h = hashTester.newTestContext();
        sample.template.apply(this, sample.data).render(h.container);
    });

    afterEach(function () {
        h.$dispose();
    });

    it('should render "Modifiers"', function () {
        
    });
});