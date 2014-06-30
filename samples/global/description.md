This sample shows how templates, components or any JavaScript object can be defined in the `global` Hashspace scope so that they can be used anywhere without being defined in the local scope.

[#output]

In this sample, the *item* template is defined as *label* in the global scope - and is used through this reference in the *test* template. The same thing applies for the *ln* variable.

In a general manner, the `global` scope should be used to reference components, templates or general functions that are expected to be used in many places and that should not be systematically redefined or *required* in the local file scope.

**Note:** variables defined in the `global` Hashspace scope are of course considered global. As such **no data-binding** will be performed on their reference.