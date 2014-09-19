var hashTester = require('hsp/utils/hashtester');
var sample = require('./timer.hsp');

describe('"Cpt Timer" sample', function () {

    var h;
    beforeEach(function () {
        h = hashTester.newTestContext();
        sample.template.apply(this, []).render(h.container);
    });

    afterEach(function () {
        h.$dispose();
    });

    it('should render "Cpt Timer"', function () {
        
    });
});