
/*
 * Copyright 2012 Amadeus s.a.s.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Parts of this code has been copied from the angular MVC controller at
// https://github.com/addyosmani/todomvc/blob/gh-pages/architecture-examples/angularjs/js/controllers/todoCtrl.js
var klass = require("hsp/klass"), $set = require("hsp/$set");

/**
 * Main Todo Controller
 */

var TodoCtrl = klass({
    /**
     * Object constructor: intialization of the data model
     */
    $constructor : function () {
        // todo structure used to create a new todo
        this.newTodo = {title : ""};
        // todo used for the edition so that cancelling edition change the initial todo
        this.editTodo = {title : ""};
        this.allChecked = false; // tells if all tasks are checked (cf. syncData)
        this.remainingCount = 1; // number of remaining tasks (cf. syncData)
        this.doneCount = 0;      // number of items done (cf. syncData)
        this.todos = [ // todo list - empty by default
        // sample item: {title:"task text", completed:false, editMode:false}
        ];
    },

    /**
     * Synchronize bound data in the data structure Could be called by observers - but would require one observer per
     * todo item (not worth in this case - as using observers in the controller can then easily lead to infinite
     * loops..)
     */
    syncData : function () {
        var doneCount = 0, todos = this.todos, sz = todos.length;
        for (var i = 0; sz > i; i++) {
            if (todos[i].completed)
                doneCount++;
        }
        $set(this, "doneCount", doneCount);
        $set(this, "remainingCount", sz - doneCount);
        $set(this, "allChecked", doneCount === sz);
    },

    /**
     * add a new todo item from the newTodo structure in the data set
     */
    addTodo : function () {
        this.doneEditingAll();
        var newTodo = this.newTodo;
        // ignore empty entries
        if (newTodo.title.length > 0) {
            // put new todo at the beginning of the list
            this.todos.unshift({
                title : newTodo.title,
                completed : false,
                editMode : false
            });
            $set(newTodo, "title", "");
            this.syncData();
        }
        return false; // to prevent default behaviour
    },

    /**
     * activate the edit mode for the current todo item and copies the todo values in the editTodo structure
     */
    edit : function (todo) {
        this.doneEditingAll();
        $set(todo, "editMode", true);
        $set(this.editTodo, "title", todo.title);
    },

    /**
     * remove a todo item from the todo list
     */
    remove : function (todo) {
        var idx = this.todos.indexOf(todo);
        this.todos.splice(idx, 1);
        this.syncData();
    },

    /**
     * copy the value of the editTodo in the currently edited todo and remove the editMode flag
     */
    doneEditing : function (todo) {
        if (!this.editTodo.title) {
            this.remove(todo); // remove todo if title is empty
        } else {
            $set(todo, "title", this.editTodo.title);
            $set(todo, "editMode", false);
        }
        return false;
    },

    /**
     * automatically close all todo in that may be in edit mode
     */
    doneEditingAll : function() {
        // cancel current edit if any
        var td;
        for (var i=this.todos.length-1; i>-1; i--) {
            td=this.todos[i];
            if (td.editMode) {
                this.doneEditing(td);
            }
        }
    },

    /**
     * cancel the edition for a todo a keeps the previous value
     */
    cancelEditing : function (todo) {
        $set(this.editTodo, "title", "");
        $set(todo, "editMode", false);
    },

    /**
     * remove all the completed todos from the todo list
     */
    clearDoneTodos : function () {
        $set(this, "todos", this.todos.filter(function (val) {
            return !val.completed;
        }));
        this.syncData();
    },

    /**
     * Toggle all todo item completed states
     */
    toggleAllDone : function () {
        var newState = this.allChecked, todos = this.todos;
        for (var i = 0, sz = todos.length; sz > i; i++) {
            $set(todos[i], "completed", newState);
        }
        this.syncData();
    }

});

/**
 * UI Module Controller - dealing with the filter part and managing the template display
 */
exports.TodoUICtrl = klass({
    $extends : TodoCtrl,

    /**
     * Create a new panel object
     * @param {DOMElement} DOMElt a html DOM element where the panel should be displayed (optional)
     */
    $constructor : function (DOMElt) {
        // call super constructor
        TodoCtrl.$constructor.call(this);
        // add ui-items to the datamodel
        this.filter = "all"; // possible value: "all" or "active" or "completed"
    },

    /**
     * Tells if a todo item should be displayed based on the current ui filter
     */
    isInFilter : function (todo, filter) {
        var f = this.filter;
        if (f === "active" && todo.completed)
            return false;
        if (f === "completed" && !todo.completed)
            return false;
        return true;
    },

    /**
     * Select a new filter
     */
    selectFilter : function (filter) {
        if (filter === "all" || filter === "active" || filter === "completed") {
            $set(this, "filter", filter);
        }
    }
});
