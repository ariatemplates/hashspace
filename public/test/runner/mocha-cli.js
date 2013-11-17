var Runner = require ("mocha-runner");

new Runner ({
	tests: ["../alltests"]
}).run (function (error){
    //It's not the Mocha stderr
    if (error) console.log (error);
});