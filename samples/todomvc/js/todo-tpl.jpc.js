
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

// WARNING: this is only pseudo-code as the template parser is not implemented yet
// The purpose of this file is to give an idea on the syntax targetted by hashspace

# --
 Main template
 @param ds the data set
 @parm ctl the controller to containing the event handler callbacks
# --
# template todos(ds, ctl)
	<section class="todoapp">
		<header>
			<h1>todos</h1>
			<form onsubmit="{ctl.addTodo()}">
				<input placeholder="What needs to be done?" autofocus value="{=ds.newTodo.title}">
			</form>
		</header>
		# if (todos.length)
			<section class="main">
				// TODO remove fixed ids
				<input id="toggle-all" type="checkbox" value="{=ds.allChecked}" onchange="{ctl.markAllDone()}">
				<label for="toggle-all">Mark all as complete</label>
				<ul class="todo-list"> 
					# foreach (todo in ds.todos)
						# if (ctl.isInFilter(todo))
							# insert todoItem(todo,ds,ctl)
						# /if
					# /foreach
				</ul>
			</section>
			<footer>
				<span id="todo-count">
					<strong>{ds.remainingCount}</strong>
					// TODO better way to pluralize?
					# if (ds.remainingCount===1)
						item left
					# else
						items left
					# /if
				</span>
				<ul class="filters">
					# insert filterLink(ds, ctl, "All", "all")
					# insert filterLink(ds, ctl, "Active", "active")
					# insert filterLink(ds, ctl, "Completed", "completed")
				</ul>
				# if (ds.doneCount)
					<button class="clear-completed" onclick="{ctl.clearDoneTodos()}">Clear completed ({ds.doneCount})</button>
				# /if
			</footer>
		# /if
	</section>
# /template

# --
 template displaying the todo element
 @param todo the todo data model
 @param ctl the general controller
# --
# template todoItem(todo, ds, ctl) 
	<li>
		# @class.add(todo.completed? "completed")
		# @class.add(todo.editMode? "editing")

		# if (todo.editMode)
			<form onsubmit="{ctl.doneEditing(todo)">
				<input class="edit" value="{ds.editTodo.title}">
				// TODO  todo-blur="doneEditing(todo)" todo-focus="todo == editedTodo"
			</form>
		# else
			<div class="view">
				<input class="toggle" type="checkbox" value="{=todo.completed}">
				<label ondblclick="{ctl.editTodo(todo)}">{=todo.title}</label>
				<button class="destroy" onclick="{ctl.removeTodo(todo)}"></button>
			</div>
		# /if
	</li>
# /template

# --
 display a link to activate a filter on the todo list
 @param ds the data set
 @param ctl the general controller
 @param {String} label the label to display in the link - e.g. "All"
 @param {String} filterCode the corresponding filter code used in the data model - e.g. "all"
# --
# template filterLink(ds, ctl, label, filterCode)	
	<li>
		<a onclick="{ctl.selectFilter(filterCode)}"> // TODO: href="#/"?
			# @class.add(ds.filter===filterCode? "selected")
			{label}
		</a>
	</li>
# /template

module.exports.todoTemplate=todos;
