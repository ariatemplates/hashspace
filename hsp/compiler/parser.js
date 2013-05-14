var PEG = require("pegjs");
var fs = require("fs");
var grammar = fs.readFileSync(__dirname + "/hspblocks.pegjs", "utf-8");
var klass= require("../klass");
var blockParser = PEG.buildParser(grammar,{trackLineAndColumn:true});

/**
 * Return the list of instruction blocks that compose a template file
 * at this stage the template AST is not complete - cf. parse() function
 * to get the complete syntax tree
 * Note: this function is exposed for unit test purposes and should not be used
 * directly
 * @param {String} template the template to parse
 */
function getBlockList (template) {
	// add a last line feed a the end of the template as the parser parses the plaintext
	// sequences only when ending  with a new line sequence (workaround to solve pegjs issue)
	return blockParser.parse(template+"\r\n");
};
exports.getBlockList=getBlockList;

exports.parse = function (template) {
	var bl= getBlockList(template);
	var st=new SyntaxTree();
	st.generateTree(bl);
	//st.displayErrors();
	return {syntaxTree:st.tree.content, errors:st.errors};
};

/**
 * Node of the Syntax tree
 */
var Node=klass({
	$constructor:function(type, parent) {
		this.type=type;
		this.parent=parent;
	}
})

var SyntaxTree=klass({
	/**
	 * Generate the syntax tree from the root block list
	 */
	generateTree:function(blockList) {
		this.errors=[];
		this.tree=new Node("file", null);
		this.tree.content=[];
		
		this._advance(0, blockList, this.tree.content);
	},

	_logError:function(description,errdesc) {
		var desc={description:description};
		if (errdesc) {
			if (errdesc.line) {
				desc.line=errdesc.line;
				desc.column=errdesc.column;
			}
			if (errdesc.code) {
				desc.code=errdesc.code;
			}
		}
		this.errors.push(desc);
	},

	displayErrors:function() {
		if (this.errors.length) {
			for (var i=0, sz=this.errors.length;sz>i;i++) {
				console.log("Error "+(i+1)+"/"+sz+": "+this.errors[i].description);
			}
		}
	},

	/**
	 * Process a list of blocks and advance the cursor index that scans the collection
	 * @param {function} optEndFn an optional end function that takes a node type as argument
	 * @return {int} the index of the block where the function stopped or -1 if all blocks have been handled
	 */
	_advance:function(startIdx, blocks, out, optEndFn) {
		var b, type;
		if (blocks) {
			for (var i = startIdx, sz=blocks.length; sz>i; i++) {
				b=blocks[i];
				type = b.type;

				if (optEndFn && optEndFn(type,b.name)) {
					// we stop here
					return i;
				}
				if (this["_"+type]) {
					i=this["_"+type](i, blocks, out);
				} else {
					this._logError("Invalid statement: "+type,b);
				}
			}
			return blocks.length;
		}
	},

	/**
	 * Template block management
	 */
	_template:function(idx,blocks,out) {
		var n=new Node("template"), b=blocks[idx];
		n.name=b.name;
		n.args=b.args;
		n.export=b.mod==="export";
		n.content=[];
		out.push(n);

		if (b.mod!=='' && b.mod!=="export") {
			this._logError("Invalid template template modifier: "+b.mod,blocks[idx]);
		}

		if (!b.closed) {
			this._logError("Missing end template statement",b);
		}

		// parse sub-list of blocks
		this._advance(0, b.content, n.content);
		return idx;
	},

	
	/**
	 * Catch invalid template definitions
	 */
	_invalidtemplate:function(idx,blocks,out) {
		this._logError("Invalid template arguments",blocks[idx]);
		return idx;
	},

	/**
	 * Text block management
	 */
	_plaintext:function(idx,blocks,out) {
		var n=new Node("plaintext"), b=blocks[idx];
		n.value=b.value;
		out.push(n);
		return idx;
	},

	/**
	 * Text block management: regroups adjacent text and expression blocks
	 */
	_text:function(idx,blocks,out) {
		var sz=blocks.length, idx2=idx, goahead=(sz>idx2), b, buf=[], n=null;

		while (goahead) {
			b=blocks[idx2];
			if (b.type==="text") {
				if (b.value!=="") {
					buf.push(b);
				}
			} else if (b.type==="expression") {
				if (b.category==="invalidexpression") {
					this._logError("Invalid expression",b);
				} else if (b.category!=="functionref") {
					buf.push(b);
				} else  {
					// this is an insert statement
					goahead=false;
				}
			} else if (b.type==="comment") {
				// ignore comments
			} else {
				goahead=false;
			}

			if (goahead) {
				idx2++;
				goahead=(sz>idx2);
			}
		}

		if (buf.length===1 && buf[0].type==="text") {
			// only one text block
			n=new Node("text");
			n.value=buf[0].value;
		} else if (buf.length>0) {
			// an expression or several blocks have to be aggregated
			n=new Node("textblock");
			n.content=buf;
		}
		if (n) {
			out.push(n);
		}

		// return the last index that was handled
		return idx2>idx? idx2-1 : idx;
	},

	/**
	 * Text block management: regroups adjacent text and expression blocks
	 */
	_expression:function(idx,blocks,out) {
		var b=blocks[idx], cat=b.category;
		if (cat==="functionref") {
			return this._insert(idx,blocks,out);
		} else if (cat==="invalidexpression") {
			this._logError("Invalid expression",b);
			return idx;
		}
		return this._text(idx,blocks,out);
	},

	/**
	 * Catch invalid expressions
	 */
	_invalidexpression:function(idx,blocks,out) {
		this._logError("Invalid expression",blocks[idx]);
		return idx;
	},

	/**
	 * Insert
	 */
	_insert:function(idx,blocks,out) {
		var n=new Node("insert"), b=blocks[idx];
		n.path=b.path;
		n.args=b.args;

		if (n.path.length>1) {
			this._logError("Long paths for insert statements are not supported yet: "+n.path.join("."),b);
		} else {
			out.push(n);
		}
		return idx;
	},

	/**
	 * If block management
	 */
	_if:function(idx,blocks,out) {
		var n=new Node("if"), b=blocks[idx], lastValidIdx=idx;
		n.condition=b.condition; // TODO reprocess
		n.condition.bound=true;
		n.content1=[];
		out.push(n);

		var endFound=false, out2=n.content1, idx2=idx;

		if (n.condition.type==="invalidexpression") {
			this._logError("Invalid if condition",n.condition);
		}

		while(!endFound) {
			idx2=this._advance(idx2+1, blocks, out2, this._ifEndTypes);
			if (idx2<0 || !blocks[idx2]) {
				this._logError("Missing end if statement",blocks[lastValidIdx]);
				endFound=true;
			} else {
				var type=blocks[idx2].type;
				if (type==="endif") {
					endFound=true;
				} else if (type==="else") {
					n.content2=[];
					out2=n.content2;
					lastValidIdx=idx2;
				} else if (type==="elseif") {
					n=new Node("if");
					n.condition=blocks[idx2].condition; // TODO reprocess
					n.content1=[];
					out2.push(n);
					out2=n.content1;
					lastValidIdx=idx2;
				}
			}
		}

		return idx2;
	},

	/**
	 * Detects if blocks end types
	 */
	_ifEndTypes:function(type) {
		return (type==="endif" || type==="else" || type==="elseif");
	},

	_endif:function(idx,blocks,out) {
		// only called in case of error
		var b=blocks[idx], nm=b.name;
		this._logError("{/if} statement does not match any {if} block",b);
		return idx;
	},

	_else:function(idx,blocks,out) {
		// only called in case of error
		var b=blocks[idx], nm=b.name;
		this._logError("{else} statement found outside any {if} block",b);
		return idx;
	},

	_elseif:function(idx,blocks,out) {
		// only called in case of error
		var b=blocks[idx], nm=b.name;
		this._logError("{else if} statement found outside any {if} block",b);
		return idx;
	},

	/**
	 * Foreach block management
	 */
	_foreach:function(idx,blocks,out) {
		var n=new Node("foreach"), b=blocks[idx];
		n.item=b.item;
		n.key=b.key;
		n.collection=b.colref;
		n.collection.bound=true;
		n.content=[];
		out.push(n);

		var idx2=this._advance(idx+1, blocks, n.content, this._foreachEndTypes);
		if (idx2<0 || !blocks[idx2]) {
			this._logError("Missing end foreach statement",blocks[idx]);
		} 

		return idx2;
	},

	/**
	 * Detects foreach end
	 */
	_foreachEndTypes:function(type) {
		return (type==="endforeach");
	},

	_endforeach:function(idx,blocks,out) {
		// only called in case of error
		var b=blocks[idx], nm=b.name;
		this._logError("{/foreach} statement does not match any {foreach} block",b);
		return idx;
	},


	/**
	 * Element block management
	 */
	_element:function(idx,blocks,out) {
		var n=new Node("element"), b=blocks[idx];
		n.name=b.name;
		n.closed=b.closed;

		// Handle attributes
		var atts=b.attributes, att, att2, type;
		n.attributes=[];

		for (var i=0, sz=atts.length;sz>i;i++) {
			att=atts[i];
			var sz2=att.value.length;
			if (sz2===0) {
				// we should normally not get there as the parser shall not generate this case
				this._logError("Missing attribute value: "+att.name, att);
				continue; // ignore this attribute
			} else if (sz2===1) {
				// literal or expression
				type=att.value[0].type;
			
				if (type==="text" || type==="expression") {
					if (type==="expression") {
						var v=att.value[0], cat=v.category;
						if (cat==="invalidexpression") {
							this._logError("Invalid expression",v);
						} else if (att.name.match(/^on/i) && cat !=="functionref") {
							this._logError("Event handler attribute only support function expressions",v);
						}
					}
					att2=att.value[0];
					att2.name=att.name;
				} else {
					this._logError("Invalid attribute type: "+type, att);
					continue;
				}
			} else {
				// length > 1 so attribute is a text block

				// if attribute is an event handler, raise an error
				if (att.name.match(/^on/i)) {
					this._logError("Event handler attributes don't support text and expression mix",att);
				}
				// raise errors if we have invalid attributes
				for (var j=0;sz2>j;j++) {
					var v=att.value[j];
					if (v.type==="expression" && v.category==="invalidexpression") {
						this._logError("Invalid expression",v);
					}
				}
				att2={name:att.name, type:"textblock", content:att.value}
			}

			n.attributes.push(att2);
		}

		n.content=[];
		out.push(n);

		var idx2=idx;
		if (!b.closed) {
			var endFound=false, out2=n.content, ename=b.name;

			while(!endFound) {
				idx2=this._advance(idx2+1, blocks, out2, function(type, name) {
					return (type==="endelement"); // && name===ename
				});
				if (idx2<0 || !blocks[idx2]) {
					this._logError("Missing end element </"+ename+">",b);
					endFound=true;
				} else {
					if (blocks[idx2].name!==ename) {
						this._logError("Missing end element </"+ename+">",b);
						idx2-=1; // the current end element may be caught by a container element
					}
					endFound=true;
				}
			}
		}

		return idx2;
	},

	/**
	 * Catch invalid element errors
	 */
	_invalidelement:function(idx,blocks,out) {
		// only called in case of error
		var b=blocks[idx], nm=b.name;
		this._logError("Invalid HTML element syntax",b);
		return idx;
	},

	/**
	 * Ignore comment blocks
	 */
	_comment:function(idx,blocks,out) {
		return idx;
	},

	_endelement:function(idx,blocks,out) {
		// only called in case of error
		var b=blocks[idx], nm=b.name;
		this._logError("End element </"+nm+"> does not match any <"+nm+"> element",b);
		return idx;
	}

});

