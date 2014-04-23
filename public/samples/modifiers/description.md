This example shows how modifiers can be used to adapt the value of an expression to the desired display. Modifiers are functions that take as first argument the value of the expression to be adapted and that return the new value. They can also take other arguments that should be separated with colons - e.g. ```{some.expression|modifier1:arg2:arg3|modifier2}```

[#output]

Hashspace acually supports two types of modifiers:

 - either **simple functions** that take the value to be modified as first argument and return the new value. Those values could be of any JavaScript type, e.g. Strings or Arrays *- cf. changeCase function in the code sample*
 - or **JavaScript objects** that expose transformation functions. As objects can hold state, this provides a simple way to change and expose internal modifier properties without overloading the main controller with this logic *- cf. Sorter example in the code sample*.

Notes:

  - Modifiers must always return a copy of the values passed as argument. Otherwise modifiers will create side effects on other expressions bound to the same data.
  - As hashspace use the pipe sign for modifiers, the JavaScript bitwise operator (also using the pipe sign) is not supported in hashspace expressions.
