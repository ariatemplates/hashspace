
var todos=require("todomvc/todo.hsp").todos;
var ht=require("hsp/utils/hashtester");

var NEW_TODO="#new-todo";
var TODO_ITEMS="#todo-list li";
//var FILTER_ALL="#filters .all";

describe("TODO MVC component", function () {

  it("validates default display", function() {
    var h = ht.newTestContext();
    todos().render(h.container);

    // check that field is present
    expect(h(NEW_TODO).length).toEqual(1);

    // check that no todo is displayed
    expect(h(TODO_ITEMS).length).toEqual(0);

    // TODO uncomment next lines when type() is implemented
    /*
    // add a task
    h(NEW_TODO).type("task 1[enter]");
    
    // check that we have one item in the list
    expect(h(TODO_ITEMS).length).toEqual(1);

    // add another task
    h(NEW_TODO).type("task 2[enter]");

    var tasks=h(TODO_ITEMS);
    expect(tasks.length).toEqual(2);
    expect(tasks.item(0).text()).toEqual("task 2");  // last task first
    expect(tasks.item(1).text()).toEqual("task 1");

    // edit last task
    tasks.item(0).dblclick();

    // check that field is visible
    var input0=tasks.item(0).find("input");
    expect(input0.length).toEqual(1);
    expect(input0.value()).toEqual("task 2");

    // change value and validate
    input0.type("new task2[enter]");

    // validate change
    expect(tasks.item(0).find("input").length).toEqual(0);
    expect(tasks.item(0).text()).toEqual("new task2");

    // also
    expect(h(FILTER_ALL).hasClass("selected")).toEqual(true);
    */
    h.$dispose();
  });

});
