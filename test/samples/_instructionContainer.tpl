# template instruction (obj)
# foreach something in obj
   <span># insert another() {something.text}</span>
# /foreach
The one above is not an insert instruction
# if false
  This should not be in the output
# /if
  # if (obj && false)
    This neither
  # /if
# /template

EOT

<span># insert another() One</span>
<span># insert another() Two</span>
<span># insert another() Three</span>
The one above is not an insert instruction

ARGS

[
  [
    {"text" : "One"},
    {"text" : "Two"},
    {"text" : "Three"}
  ]
]