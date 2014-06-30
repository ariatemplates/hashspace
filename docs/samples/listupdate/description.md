
This example shows how a list implemented with a *foreach* loop can be dynamically updated: simply click on the links at the top of the example to add, delete or replace some elements.

[#output]

As you can see, the list update is automatically managed by the data-binding engine. For this you simply need to update the list array with one of the standard JavaScript methods that mutate arrays:

- [splice]: to add and remove multiple elements in one single operation
- [push]: to append new elements to the array
- [pop]: to remove and get the last element of an array
- [shift]: to remove and get the first element of an array
- [unshift]: to insert new elements at the beginning of an array
- [reverse]: to reverse the array element order
- [sort]: to sort array elements according to a sort function
- splice2: which behaves as [splice] but that takes an array of items as 3rd argument - on the contrary to splice() that requires items to be passed as independent arguments (cf. example). Note: this method is not part of ECMAScript, but is automatically added to the Array prototype by Hashspace.

Technically those methods have been overridden on the Array object prototype so that the binding engine can detect the changes and automatically trigger template updates. 

[splice]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/splice
[push]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/push
[shift]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/shift
[unshift]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/unshift
[pop]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/pop
[reverse]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reverse
[sort]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort
