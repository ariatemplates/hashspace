
This example shows how lists can be ordered:

[#output]

Hashspace actually proposes two built-in methods to manage sorting:

 - for simple cases, sorting can be handled with the **orderBy** method that accepts 2 arguments:
   - first an expression describing the type of sort should be performed. This expression can be either a string that should correspond to an item property name, or a function that will be used to sort. The signature of the sort function should be the same as the [Array.sort()][sort] argument.
   - second a boolean telling if the sort ordered should be reversed (default: false) 
 - for advanced cases, sorting can be done with a **Sorter** instance that can handle a sort state, and proposes simple methods to dynamically change the sorting state. The Sorter constructor accepts the following *options* through a configuration object:
   - **property**: a property name corresponding to the item property to sort
   - **sortFunction**: a function to use to sort the collection passed to apply()
     Note: either property or sortfunction must be provided - they will be internally passed as expression 
     to the orderBy() function. If both are provided sortFunction is used and property is ignored.
   - **states**: a string representing the possible sorting states. This string must be composed of the following letters:
**"A"** for ascending sort, **"D"** for descending sort and **"N"** for no sort (i.e. keep original order). As such using "NAD" (default) means that first sort order will be None, then Ascending, then Descending. Then the sort order can be changed through the nextState() or setState() methods 


*Note 1:* orderBy and Sorter are defined in the hashspace global collection and are available in all templates.

*Note 2:* Sorter exposes an apply() method that is automatically called when used in a pipe expression - this is why it doesn't need to be explicitely called in the sample template.


[sort]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort
