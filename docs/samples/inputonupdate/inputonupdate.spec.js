var hsp=require("hsp/rt");
var sample = require('./inputonupdate.hsp');
var fireEvent = require("hsp/utils/eventgenerator").fireEvent;

describe('"Input onupdate" sample', function () {

    var clock;
    beforeEach(function () {
        clock = sinon.useFakeTimers();
    });

    afterEach(function () {
        clock.restore();
    });

    it('should should fire onpudate on input after default 500ms timer', function () {
        var n = sample.template.apply(this, sample.data);

        var input = n.node.querySelectorAll("input")[0];
        var span = n.node.querySelectorAll("span")[0];

        expect(span.innerHTML).to.equal("Oninput result: ");
        input.value = "a";
        fireEvent("keyup", input);
        hsp.refresh();

        clock.tick(300);
        expect(span.innerHTML).to.equal("Oninput result: ");
        clock.tick(300);
        expect(span.innerHTML).to.equal("Oninput result: a");

        n.$dispose();
    });

    it('should should fire onpudate on input after custom 500ms', function () {
        var n = sample.template.apply(this, sample.data);

        var input = n.node.querySelectorAll("input")[1];
        var span = n.node.querySelectorAll("span")[1];

        expect(span.innerHTML).to.equal("Oninput result: ");
        input.value = "a";
        fireEvent("keyup", input);
        hsp.refresh();

        clock.tick(1500);
        expect(span.innerHTML).to.equal("Oninput result: ");
        clock.tick(1000);
        expect(span.innerHTML).to.equal("Oninput result: a");

        n.$dispose();
    });

    it('should should fire onpudate on textarea after default 500ms timer', function () {
        var n = sample.template.apply(this, sample.data);

        var textarea = n.node.querySelectorAll("textarea")[0];
        var span = n.node.querySelectorAll("span")[2];

        expect(span.innerHTML).to.equal("Oninput result: ");
        textarea.value = "a";
        fireEvent("keyup", textarea);
        hsp.refresh();

        clock.tick(300);
        expect(span.innerHTML).to.equal("Oninput result: ");
        clock.tick(300);
        expect(span.innerHTML).to.equal("Oninput result: a");

        n.$dispose();
    });
});