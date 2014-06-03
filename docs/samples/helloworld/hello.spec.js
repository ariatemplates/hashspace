var hashTester = require('hsp/utils/hashtester');
var helloTpl = require('./hello.hsp').hello;

describe('"Hello World" sample', function () {

    var h;
    beforeEach(function () {
        h = hashTester.newTestContext();
    });

    afterEach(function () {
        h.$dispose();
    });

    it('should render "Hello World" from a template', function () {
        helloTpl('World').render(h.container);
        expect(h('div.msg').text()).to.equal('Hello World!');
    });
});