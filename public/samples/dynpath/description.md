
This example shows how dynamic data path can be used through the `[expression]` notation:

[#output]

As you could expect the 'square bracket' JavaScript notation is supported to access some data in a dynamic way. In practice **square brackets can contain any expressions**, including function calls and arithmetic expressions - e.g.:


- {d.person[d.pp]}
- {d.person[d.pp1+d.pp2]}
- {d.person[d[d.prop]].value}
- {d.person[d.pp1][d.pp2]}
- etc.

As you can see as well **square bracket expressions also support double data-binding** on input fiels - cf. column C