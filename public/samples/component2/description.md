
This example shows a simple component which purpose is to enter a numeric value. The value entered by the user will be considered as valid if it can be interpreted as a number, and if it is included withing the *min* and *max* boundaries. When the value is incorrect, the field background is set to orange. On top of this, the component shows a button along with the field in order to let the user reset the field value.

[#output]

It is interesting to note that this component exposes 4 public attributes, and 2 internal values (*internalValue* and *isValid*) to the component template. Of course, only the attributes are accessible to the component's caller. The difficulty is that attributes and properties are bound. Indeed:

- when the *internalValue* - that is bound to the field - changes, its value should be propagated to the value attribute only if it is considered valid
- same for the *value* attribute that should be propagated to the field only if valid
- the *isValid* property has to change depending on the *internalValue* and on the attribute values, etc.

To manage these internal constraints the controller can implement two methods that will be automatically called:

- **onAttributeChange()** that is called when an attribute is changed by the host or the component templates
- **onPropertyChange()** that is called when an internal property is changed by the component template

It is important to note that **change handlers are not called when changes are performed by the controller itself**. This allows avoiding infinite loops and strange side effects.
