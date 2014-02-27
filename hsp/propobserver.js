
/*
 * Copyright 2012 Amadeus s.a.s.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var klass = require("./klass");
var json = require("./json");
var ALL = "**ALL**";

/**
 * Property observer - used by $Rootnode to gather all observers for one given object
 */
var PropObserver = klass({
    $constructor : function (target) {
        this.id = 0; // optional id that can be set by the PropObserver user
        this.target = target;
        this.props = {}; // map of all properties to observe
        var self = this;

        // create the callback to assign to the target through json.observe
        this.callback = function (chglist) {
            PropObserver_notifyChanges.call(self, chglist);
        };
        json.observe(target, this.callback);
    },
    /**
     * Safely delete all internal dependencies Must be called before deleting the object
     */
    $dispose : function () {
        json.unobserve(this.target, this.callback);
        delete this.props;
        delete this.callback;
        delete this.target;
    },
    /**
     * Add a new observer for a given property
     * @param {object} observer object with a onPropChange() method
     * @param {string} property the property name to observe (optional)
     */
    addObserver : function (observer, property) {
        if (!property)
            property = ALL;
        var arr = this.props[property];
        if (!arr) {
            // property is not observed yet
            arr = [];
            this.props[property] = arr;
        }
        arr.push(observer);
    },
    /**
     * Remove an observer - previously added with addObserver()
     * @param {object} observer object with a onPropChange() method
     * @param {string} property the property name to observe (optional)
     */
    rmObserver : function (observer, property) {
        if (!property)
            property = ALL;
        var arr = this.props[property];
        if (arr) {
            for (var i = 0, sz = arr.length; sz > i; i++) {
                if (arr[i] === observer) {
                    arr.splice(i, 1);
                    sz -= 1;
                    i -= 1;
                }
            }
            if (arr.length === 0) {
                delete this.props[property];
            }
        }
    }
});

/**
 * Notify the change to the registered observers i.e. call their onPropChange method with the change description as
 * parameter
 * @private
 */
function PropObserver_notifyChanges (chglist) {
    var c;
    for (var i = 0, sz = chglist.length; sz > i; i++) {
        c = chglist[i];
        if (!c)
            continue;
        // check if we listen to this property
        if (this.props[c.name]) {
            PropObserver_notifyChange(this, c, c.name);
        }
    }
    if (this.props[ALL]) {
        PropObserver_notifyChange(this, c, ALL);
    }
}

function PropObserver_notifyChange (po, chge, chgName) {
    var plist = po.props[chgName];

    for (var j = 0, sz2 = plist.length; sz2 > j; j++) {
        plist[j].onPropChange(chge);
    }
}

module.exports = PropObserver;
