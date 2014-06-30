
Hashspace automatically listens to the main change events of its input elements (*click*, *focus* and *keyup*) in order to transparently synchronize the input values with the data referenced through the value expression.

The following example shows the same value referenced by two several text fields and a read-only span:

[#output]

You can note that *radio* inputs have to use a **model** attribute in order to bind their selection to the data-model. All radio buttons referencing the same model property will automatically belong the same group - and they don't need to have the same *name* attribute as in classical HTML forms.

For the sake of consistency the **model** attribute can also be used on all input types, even if the *value* attribute can be used as well, as shown in the previous example.

**Note:** When users type in an input field, **Hashspace synchronizes the data model on the input event** (except in IE8/9 for which keyup is used). As a consequence, applications that need to validate (and potentially change) user inputs should listen to this **keyup** event, and not to the *keydown* event as text fields are not updated yet at this stage.
