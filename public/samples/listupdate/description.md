
This example shows how a list implemented with a *foreach* loop can be dynamically updated: simply click on the links at the top of the example to add, delete, replace some or all elements.

[#output]

As you can see, the list update is automatically managed by the data-binding engine. For this you simply need to update the list array with one of the following method:

 + `json.splice` that can simultaneously add and remove multiple elements at a given position in an array. Signature is similar to the JavaScript [Array.splice][splice] method, with an extra argument at first position, which is the array that must be modified.
 + `json.splice2` that is similar to `json.splice`, except that the elements to inject in the array are passed as an array, instead of independent arguments.

The following other methods can be used as well:

 + `json.push` to append one or multiple elements at the end of an array. Syntax mapped on [Array.push][push]
 + `json.shift` to remove the first element of an array. Synatx similar to [Array.shift][shift]
 + `json.pop` to remove the last element of an array. Syntax also mapped on [Array.pop][pop]



[splice]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/splice
[push]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/push
[shift]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/shift
[pop]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/pop
