This example shows how to create local variables through the **{let}** statement

[#output]

As you can imagine `{let}` allows to create one or multiple local variables in the scope of a container block.

The `{let}` statements can be used in the following blocks:

- a template block
- an html element (e.g. *div* in this example)
- an `{if}`, `{else}` or `{else if}` block
- or a `{foreach}` block

As the *{let}* variables are accessible by all the sub-elements of its parent block, **the {let} statements must be defined at the beginning of their containers** - an error will be triggered otherwise.
