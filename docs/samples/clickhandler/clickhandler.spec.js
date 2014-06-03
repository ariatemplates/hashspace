var hashTester = require('hsp/utils/hashtester');
var messageSample = require('./clickhandler.hsp');

describe('"Simple event handler" sample', function () {

    var h;
    beforeEach(function () {
        h = hashTester.newTestContext();
        messageSample.message(messageSample.msg).render(h.container);
    });

    afterEach(function () {
        h.$dispose();
    });

    it('should render initial state', function () {
        expect(h('div').text()).to.equal('Click me to discover hashspace event handlers');
    });

    it('should cycle through messages on click', function () {
        h('div').click();
        expect(h('div > span').text()).to
            .equal('Well done - you called the event handler and updated the data model in a row!');

        h('div').click();
        expect(h('div > span.warning').text()).to.match(/WARNING/);
        expect(h('div > span:eq(1)').text()).to.equal('If you click again you will be back to first step!');

        h('div').click();
        expect(h('div > span').text()).to.equal('Click me to discover hashspace event handlers');
    });
});