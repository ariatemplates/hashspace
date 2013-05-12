var fs = require("fs");

/**
 * Return the template part of a template sample
 * @param {String} sampleName the sample name - e.g. "basic1"
 * @return {String}
 */
exports.getSampleContent = function (sampleName) {
	var content = fs.readFileSync(__dirname+"/../samples/"+sampleName+".txt","utf-8");
	var c=content.split(/\r?\n?#####[^\n]*\n/), sz=c.length;

	var tests=[], s, idx, cf={};
	if (sz>3) {
		for (var i=4;sz>i;i++) {
            s=c[i];
            idx=s.indexOf('=');
            cf[s.slice(0,idx)]=s.slice(idx+1);
		}
	}

	var res={
		template:   sz>1? c[1] : "",
		parsedTree: sz>2? eval(c[2]) : null,
		syntaxTree: sz>3? eval(c[3]) : null,
		codeFragments: cf
	}
	return res;
}

/**
 * Return the template part of a template sample
 * @param {String} sampleName the sample name - e.g. "basic1"
 * @return {String}
 */
exports.getErrorSampleContent = function (sampleName) {
    var content = fs.readFileSync(__dirname+"/../errsamples/"+sampleName+".txt","utf-8");
    var c=content.split(/\r?\n?#####[^\n]*\n/), sz=c.length;

    var res={
        template:   sz>1? c[1] : "",
        errors:     sz>2? eval(c[2]) : null
    }
    return res;
}

/**
 * Compare 2 JS code strings, ignore white spaces and carriage returns;
 */
exports.compareJSCode=function(s1,s2) {
    var i1=0, i2=0, c1, c2, next=true;

    while (next) {
        // get next char for each string
        i1=getNextNWCharIdx(s1,i1);
        i2=getNextNWCharIdx(s2,i2);

        if (i1===-1 && i2===-1) {
            // end of string reached
            next=false;
        } else {
            if (i1===-1) {
                return "end of string found: s1";
            } 
            if (i2===-1) {
                return "end of string found: s2";
            }
            if (s1[i1] != s2[i2]) {
                var msg=[
                    'char mismatch: s1['+i1+']="'+s1.charAt(i1)+'" vs s2['+i2+']="'+s2.charAt(i2)+'" ',
                    's1:'+s1.slice(0,i1+1)+" <<<<  ",
                    's2:'+s2.slice(0,i2+1)+" <<<<  ",
                    ''
                ]
                return msg.join('\n');
            }
            i1++;
            i2++;
        }
    }

    return "";
}

/**
 * Return the index of the first non-whitespace char as of startIdx
 * Return -1 if end of string found
 */
function getNextNWCharIdx(s,startIdx) {
    if (s===undefined) {
        return -1;
    }
    var idx=startIdx, next=true, c, max=s.length-1;
    while (next) {
        if (idx>max) {
            idx=-1;
            next=false;
        } else {
            c=s.charAt(idx);
            if (c!==' ' && c!=='\r' && c!=='\n' && c!=='\t') {
                // ok
                next=false;
            } else {
                idx++;    
            }
        }
    }
    return idx;
}

/**
* Check if the value is an array
* @param {Object} value
* @return {Boolean} isArray
*/
function isArray (value) {
	return Object.prototype.toString.apply(value) === "[object Array]";
}

/**
* Check if the value is an object
* @param {Object} value
* @return {Boolean} isObject return false if value is null or undefined.
*/
function isObject (value) {
    // check that the value is not null or undefined, because otherwise,
    // in IE, if value is undefined or null, the toString method returns Object anyway
    if (value) {
        return Object.prototype.toString.apply(value) === "[object Object]";
    } else {
        return false;
    }
}

/**
* Check if the value is a js Date
* @param {Object} value
* @return {Boolean} isDate
*/
function isDate (value) {
    return Object.prototype.toString.apply(value) === "[object Date]";
}

/**
* Checks whether a JSON object is fully contained in another.
* @param {Object} big the container JSON structure
* @param {Object} small the contained JSON structure
* @param {String} optKey an aopttional key name representing a reference to the current big object
* @return {Boolean} true if <i>small</i> is contained in <i>big</i>
*/
function jsonContains (big, small, optKey) {
    var isBigArray = isArray(big), isBigObject = isObject(big), isSmallArray = isArray(small), isSmallObject = isObject(small), r;
    if (!optKey) optKey="$";

    if (isBigArray && isSmallArray) {
        for (var i = 0, l = small.length; i < l; i++) {
            r=jsonContains(big[i], small[i], optKey+"["+i+"]");
            if (r!=="") return r;
        }
    } else if (isBigObject && isSmallObject) {
        for (var key in small) {
            if (small.hasOwnProperty(key)) {
                if (key.match(/:/)) {
                    continue; // meta-data: we don't compare them
                }
                if (small.hasOwnProperty(key)) {
                    r=jsonContains(big[key], small[key], optKey+"."+key);
                    if (r!=="") {
                    	return r;
                    }
                }
            }
        }
    } else if ( (isBigObject && isSmallArray) || (isBigArray && isSmallObject) ) {
    	return "Incompatible property type for "+optKey+ " (one is an Array, the other one an Object)";
    } else {
        var allTime = (isDate(big) && isDate(small));
        if (allTime) {
            if (small!==big) {
                return "Different date values found for "+optKey;
            }
            return "";
        } else {
        	if (small!==big) {
        		return "Different value found for "+optKey+" : '"+escapeNewLines(small)+"' found insted of '"+escapeNewLines(big)+"'";
        	}
        	return "";
        }
    }
    return "";
}
exports.jsonContains=jsonContains;

function escapeNewLines (text) {
    return (''+text).replace(/\r/g, "\\r").replace(/\n/g, "\\n");
}