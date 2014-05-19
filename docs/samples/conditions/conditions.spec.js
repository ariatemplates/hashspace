var hashTester = require('hsp/utils/hashtester');
var sample = require('./conditions.hsp');

describe('conditionals handling sample', function () {

    describe('regular JavaScript tests for the utility class', function () {

        var numberTester;
        beforeEach(function () {
            numberTester = new sample.data()[0];
        });

        it('should have initial value', function () {
            expect(numberTester.number).to.equal(0);
        });

        it('should increment the value', function () {
            numberTester.increment(5);
            expect(numberTester.number).to.equal(5);
            numberTester.increment(3);
            expect(numberTester.number).to.equal(8);
            numberTester.increment(-4);
            expect(numberTester.number).to.equal(4);
            numberTester.increment(-10);
            expect(numberTester.number).to.equal(-6);
        });
    });

    describe('DOM-based testing', function () {

        var h;
        beforeEach(function () {
            h = hashTester.newTestContext();
            sample.template.apply(this, sample.data()).render(h.container);
        });

        afterEach(function () {
            h.$dispose();
        });

        it('should render initial state', function () {
            expect(h('span.textvalue:eq(0)').text()).to.equal('0');
            expect(h('div:eq(0)').text()).to.match(/Number equals zero/);
            expect(h('span.textvalue:eq(1)').text()).to.equal('negative or null');
        });

        it('should increment number and change text on click', function () {
            h('div.section2 > a:eq(0)').click();
            expect(h('span.textvalue:eq(0)').text()).to.equal('1');
            expect(h('div:eq(0)').text()).to.match(/Number is greater than zero/);
            expect(h('span.textvalue:eq(1)').text()).to.equal('strictly positive');
        });

        it('should decrement number and change text on click', function () {
            h('div.section2 > a:eq(1)').click();
            expect(h('span.textvalue:eq(0)').text()).to.equal('-1');
            expect(h('div:eq(0)').text()).to.match(/Number is less than zero/);
            expect(h('span.textvalue:eq(1)').text()).to.equal('negative or null');
        });
    });
});