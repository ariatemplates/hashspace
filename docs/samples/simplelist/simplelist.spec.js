var hashTester = require('hsp/utils/hashtester');
var sample = require('./simplelist.hsp');

describe('simple list', function () {

    var h;
    beforeEach(function () {
        h = hashTester.newTestContext();
        sample.template.apply(this, sample.data).render(h.container);
    });

    afterEach(function () {
        h.$dispose();
    });

    it('should display initial state', function () {
        expect(h('li:eq(0)').text()).to.equal('Homer');
        expect(h('li:eq(1)').text()).to.equal('Marge');
        expect(h('li:eq(2)').text()).to.equal('Bart');
        expect(h('li:eq(3)').text()).to.equal('Lisa');
        expect(h('li:eq(4)').text()).to.equal('Maggie');
    });

    it('should toggle message on list item click', function () {
        h('li:eq(1)').click();
        expect(h('li:eq(1)').text()).to.equal('Marge\n            : 38 years old');
        expect(h('li:eq(1)').hasClass('details')).to.be.ok();
        h('li:eq(1)').click();
        expect(h('li:eq(1)').text()).to.equal('Marge');
        expect(h('li:eq(1)').hasClass('details')).to.not.be.ok();
    });

    it('should have special CSS class for Bart', function () {
        expect(h('li:eq(1)').hasClass('special')).to.not.be.ok();
        expect(h('li:eq(2)').hasClass('special')).to.be.ok();
    });
});