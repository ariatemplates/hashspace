var hashTester = require('hsp/utils/hashtester');
var sample = require('./hello.hsp');

describe('"Hello World" sample', function () {

    var h;
    beforeEach(function () {
        h = hashTester.newTestContext();
        sample.template.apply(this, sample.data).render(h.container);
    });

    afterEach(function () {
        h.$dispose();
    });

    it('should render "Hello World" from a template', function () {
        expect(h('div.msg').text().trim()).to.equal('Hello World!');
    });
});