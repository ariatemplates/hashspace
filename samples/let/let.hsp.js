var $set=require("hsp/$set"); 
// ################################################################ 
//  This file has been generated by the hashspace compiler          
//  Direct MODIFICATIONS WILL BE LOST when the file is recompiled!  
// ################################################################ 
var test = require("hsp/rt").template(["m"], function(n){
  var _m,_p1,_p11,_m21,_updateModel;try {_m=m} catch(e) {_m=n.g('m')};try {_p1=p1} catch(e) {_p1=n.g('p1')};try {_p11=p11} catch(e) {_p11=n.g('p11')};try {_m21=m21} catch(e) {_m21=n.g('m21')};try {_updateModel=updateModel} catch(e) {_updateModel=n.g('updateModel')};
  var __s = {m : typeof m === 'undefined' ? n.g('m') : m, p1 : typeof p1 === 'undefined' ? n.g('p1') : p1, p11 : typeof p11 === 'undefined' ? n.g('p11') : p11, m21 : typeof m21 === 'undefined' ? n.g('m21') : m21, updateModel : typeof updateModel === 'undefined' ? n.g('updateModel') : updateModel};
  return [__s,n.let({e1:[9,"p1=m.part1, m21=m.part2.part21.msg+\"!\""]}),n.elt("div",0,0,0,[n.let({e1:[9,"p11=p1.part11"]}),n.$text(0,["Part 1.1: "]),n.elt("span",0,{"class":"textValue"},0,[n.$text({e1:[9,"p11.msg"]},["",1])]),n.elt("br",0,0,0)],1),n.elt("div",0,0,0,[n.$text(0,["Part 2.1: "]),n.elt("span",0,{"class":"textValue"},0,[n.$text({e1:[9,"m21"]},["",1])]),n.$text(0,[" - "]),n.$if({e1:[9,"!p11"]},1,[n.$text(0,["p11 is of course not visible in the 2nd element scope "])])]),n.elt("a",{e1:[9,"updateModel()"]},{"href":"javascript:void(0)"},{"click":1},[n.$text(0,["Change Model"])])];
});


var model={
  part1:{
    part11: {msg: "Message 1.1"}
  },
  part2:{
    part21: {msg: "Message 2.1"}
  }
};

var count=0;
function updateModel() {
  count++;
  $set(model.part1.part11, "msg", "(1.1 update: "+count+")");
  $set(model.part2.part21, "msg", "(2.1 update: "+count+")");
}

// Needed by the playground application.
// Update it, but do not remove it!
$set(module, "exports", {
    template: test,
    data: [model]
});