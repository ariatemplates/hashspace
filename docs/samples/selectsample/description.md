
Hashspace listens to the change event of the select elements in order to synchronize its value with the data referenced through the value or model expression.
The options can also be bound, and changing the options list can impact the select value.

For example, in the following select, we can add or remove the fourth option.
  - If we try to set the data model value to 'four' when the option doesn't exist, the select value and the data model will remain unchanged,
  - If we remove the option 'four' when this one is selected, the value will be set automatically to the first one.

[#output]

**Note:**
  - An invalid value (not existing in its options) can't be set in the data model.
  - The options list can be change completely. In this case, a valid select value will be kept, otherwise, the first one will be selected.

