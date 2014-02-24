
Hashspace automatically listens to the main change events of its input elements (*click*, *keypress* and *keyup*) in order to transparently synchronize the input values with the data referenced through the value expression.

The following example shows the same value referenced by two several text fields and a read-only span:

[#output]

For the time being, only simple path expressions are supported to reference input values in a bi-directional way.

You can note that *radio* inputs have to use a **model** attribute in order to be bind their selection to the data-model. All radio buttons referencing the same model property will automatically belong the same group - and they don't need to have the same *name* attribute as in classical HTML forms.

For the sake of consistency the **model** attribute can also be used on all input types, even if the *value* attribute can be used as well, as shown in the previous example.
