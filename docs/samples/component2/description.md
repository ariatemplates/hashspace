
This example shows a simple component that allows entering a numeric value. The value entered by the user will be considered as valid if it can be interpreted as a number, and if it is included within the *min* and *max* boundaries. When the value is incorrect, the field background is set to orange. The component also shows a button next to the field in order to let the user reset the value to a predetermined value.

[#output]

This component exposes 4 public attributes and 2 internal values (*internalValue* and *isValid*) to the component template. Of course, only the attributes are accessible to the component's host template. The main point of this example is to show how internal properties can be synchronized with public attributes - for instance:

- when the *internalValue* changes, its value should be propagated to the value attribute only if it is considered valid
- the *value* attribute should be propagated to the field only if valid
- the *isValid* property has to change depending on the *internalValue* and on the attribute values, etc.

To manage these internal constraints the controller can implement $onXxxChange() methods that will be automatically called when properties or bound attributes are updated

It is important to note that **change handlers are not called when changes are performed by the controller itself** - i.e. **if a controller property is changed in a change handler, the change handler of the corresponding property will not be called**. This allows avoiding infinite loops and strange side effects.
