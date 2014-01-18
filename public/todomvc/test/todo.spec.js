
var todos=require("todomvc/todo.hsp").todos,
    ht=require("hsp/utils/hashtester");

var NEW_TODO="#new-todo";
var TODO_ITEMS="#todo-list li";
//var FILTER_ALL="#filters .all";

describe("TODO MVC component", function () {

  it("validates default display", function() {
    var h = ht.newTestContext();
    todos().render(h.container);

    // check that field is present
    expect(h(NEW_TODO).length).to.equal(1);

    // check that no todo is displayed
    expect(h(TODO_ITEMS).length).to.equal(0);

    // TODO uncomment next lines when type() is implemented
    /*
    // add a task
    h(NEW_TODO).type("task 1[enter]");
    
    // check that we have one item in the list
    expect(h(TODO_ITEMS).length).to.equal(1);

    // add another task
    h(NEW_TODO).type("task 2[enter]");

    var tasks=h(TODO_ITEMS);
    expect(tasks.length).to.equal(2);
    expect(tasks.item(0).text()).to.equal("task 2");  // last task first
    expect(tasks.item(1).text()).to.equal("task 1");

    // edit last task
    tasks.item(0).dblclick();

    // check that field is visible
    var input0=tasks.item(0).find("input");
    expect(input0.length).to.equal(1);
    expect(input0.value()).to.equal("task 2");

    // change value and validate
    input0.type("new task2[enter]");

    // validate change
    expect(tasks.item(0).find("input").length).to.equal(0);
    expect(tasks.item(0).text()).to.equal("new task2");

    // also
    expect(h(FILTER_ALL).hasClass("selected")).to.equal(true);
    */
    h.$dispose();
  });

});
