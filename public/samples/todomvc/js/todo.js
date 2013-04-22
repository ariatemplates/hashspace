
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

// as hashspace and angular JS are very close, parts of this code has been copied from the angular MVC controller at
// https://github.com/addyosmani/todomvc/blob/gh-pages/architecture-examples/angularjs/js/controllers/todoCtrl.js

var klass=require("hsp/klass"),
	json=require("hsp/json"),
	todoTemplate=require("samples/todomvc/js/todo-tpl").todoTemplate;

/**
 * Main Todo Controller
 */

var TodoCtrl=klass({
	$constructor:function() {
		// todo data set
		var d={
			newTodo:{			// todo structure used to create a new todo
				title:""	
			},
			editTodo:{			// todo used for the edition so that cancelling edition doesn't result in a change in the initial todo
				title:""
			},
			allChecked:false,	// tells if all tasks are checked (bound to all tasks)
			remainingCount:1,	// number of remaining tasks (bound to all tasks)
			doneCount:0,		// number of items done (bound to all tasks)
			todos:[				// todo list - empty by default
				// sample item: {title:"task text", completed:false, editMode:false}
			]
			
		}
		this.ds=d; // dataset

		// TODO: use internal observer to synchronize bound data - or rely on explicit calls to syncData (TBD)
		// TODO observe allChecked to mark/unmark all items? or implement markAll()? (TBD)
	},

	/**
	 * Synchronize bound data in the data structure
	 * Could be called by observers - but would require one observer per todo item
	 * (not worth in this case - this is why the function is called directly)
	 */
	syncData: function() {
		var doneCount=0, d=this.ds, todos=d.todos, sz=todos.length;
		for (var i=0;sz>i;i++) {
			if (todos[i].completed) doneCount++;
		}
		json.set(d,"doneCount", doneCount);
		json.set(d,"remainingCount", sz-doneCount);
		json.set(d,"allChecked", doneCount===sz);
	},

	/** 
	 * add a new todo item from the newTodo structure in the data set
	 */
	addTodo:function() {
		var newTodo=this.ds.newTodo;
		if (newTodo.title.length>0) {
			// ignore empty entries
			json.push(this.ds, "todos", {title: newTodo.title, completed: false, editMode:false});
			json.set(newTodo,"title","");
			this.syncData();
		}
	},

	/**
	 * activate the edit mode for the current todo item and copies the todo values in the editTodo structure
	 */
	editTodo:function(todo) {
		json.set(todo,"editMode",true);
		json.set(this.ds.ediTodo,"title",todo.title);
	},

	/**
	 * copy the value of the editTodo in the currently edited todo and remove the editMode flag
	 */
	doneEditing:function(todo) {
		var editTodo=this.ds.editTodo;
		if (!editTodo.title) {
			this.removeTodo(todo);
		} else {
			json.set(todo,"title",editTodo.title);
			json.set(todo,"editMode",false);
		}
	},

	/**
	 * cancel the edition for a todo a keeps the previous value
	 */
	cancelEditing:function(todo) {
		json.set(this.ds.editTodo,"title","");
		json.set(todo,"editMode",false);
	},

	/**
	 * remove a todo item from the todo list
	 */
	removeTodo:function(todo) {
		json.splice(this.ds,"todos",this.ds.todos.indexOf(todo), 1);
		this.syncData();
	},

	/**
	 * remove all the completed todos from the todo list
	 */
	clearDoneTodos:function() {
		json.set(this.ds, "todos", this.ds.todos.filter( function(val) {return !val.completed;} ));
		this.syncData();
	}

});

/**
 * UI Module Controller - dealing with the filter part and managing the template display
 */
var TodoModule=klass({
	$extends: TodoCtrl,

	/**
	 * Create a new panel object
	 * @param {DOMElement} DOMElt a html DOM element where the panel should be displayed (optional)
	 */
	$constructor:function(DOMElt) {
		// call super constructor
		TodoCtrl.$constructor.call(this);
		// add ui-items to the datamodel
		this.ds.filter="all" // possible value: "all" or "active" or "completed"
		this.display(DOMElt);
	},

	/**
	 * Display the todo list in an html element passed as argument
	 */
	display:function(DOMElt) {
		if (DOMElt) {
			var root=todoTemplate(this.ds, this);
			DOMElt.appendChild(root.node);
		}
	},

	/**
	 * Tells if a todo item should be displayed based on the current ui filter
	 */
	isInFilter:function(todo) {
		var f=this.ds.filter;
		if (f==="active" && todo.completed) return false;
		if (f==="completed" && !todo.completed) return false;
		return true;
	},

	/**
	 * Select a new filter
	 */
	selectFilter:function(filter) {
		if (filter == "all" || filter == "active" || filter == "completed") {
			json.set(this.ds,"filter",filter);
		}
	}
});

module.exports=TodoModule;
