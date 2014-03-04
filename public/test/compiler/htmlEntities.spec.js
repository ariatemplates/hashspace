var assert = require("assert");
var htmlEntitiesToUtf8 = require("../../../hsp/compiler/htmlEntities").htmlEntitiesToUtf8;

describe('Html Entities To Utf8 converter', function() {


  describe('numeric entities', function(){

    it('should replace decimal entities', function(){
      assert.equal(htmlEntitiesToUtf8('foo &#215; bar'), 'foo \u00D7 bar');
    });

    it('should replace hexadecimal entities', function(){
      assert.equal(htmlEntitiesToUtf8('foo &#x00D7; bar'), 'foo \u00D7 bar');
      assert.equal(htmlEntitiesToUtf8('foo &#X00D7; bar'), 'foo \u00D7 bar');
    });
  });

  describe('named entities', function(){

    it('should left strings without html entities untouched', function(){
      assert.equal(htmlEntitiesToUtf8('no entities'), 'no entities');
      assert.equal(htmlEntitiesToUtf8('foo &nbsp bar'), 'foo &nbsp bar');
      assert.equal(htmlEntitiesToUtf8('foo nbsp; bar'), 'foo nbsp; bar');
      assert.equal(htmlEntitiesToUtf8(undefined), undefined);
      assert.equal(htmlEntitiesToUtf8(null), null);
    });

    it('should replace a single named entity', function(){
      assert.equal(htmlEntitiesToUtf8('foo &times; bar'), 'foo \u00D7 bar');
    });

    it('should replace multiple named entities', function(){
      assert.equal(htmlEntitiesToUtf8('foo &times; bar &nbsp; baz'), 'foo \u00D7 bar \u00A0 baz');
    });

    it('should throw for an invalid named entity', function(){
      assert.throws(function(){
        htmlEntitiesToUtf8('foo &bad;');
      }, function(err){
        if ( (err instanceof Error) ) {
          return err.message == '"&bad;" is not a valid HTML entity.';
        }
      });
    });
  });

});
