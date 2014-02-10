
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

// ForEachNode implementation
var klass = require("hsp/klass"),
    doc = require("hsp/document"),
    json = require("hsp/json"),
    tnode = require("hsp/rt/tnode"),
    TNode = tnode.TNode,
    isValidCptContent = tnode.isValidCptContent;

/**
 * foreach node Implements the foreach conditional statement that can be used through 3 forms: # foreach (itm in todos) //
 * iteration over an array on the integer indexes - if todos in not an array "in" will be considered as "of" # foreach
 * (itm on todos) // same as Gecko object iteration - i.e. itm is the value of the item, not the key # foreach (itm of
 * todos) // same as Gecko object iteration (i.e. "on" mode), but with an extra hasOwnProperty() validation - so items
 * from the collection prototype will be ignored => memorization trick: On = in for Objects / of is the special on with
 * hasOwnProperty() in all cases the following scope variables will be created: itm the item variable as specfiied in
 * the foreach instruction (can be any valid JS name) itm_key the item key in the collection - maybe a string (for
 * non-array objects) or an integer (for arrays) - note: an explicit value can be passed as argument itm_isfirst
 * indicator telling if this is the first item of the collection (boolean) itm_islast indicator telling if this is the
 * last item of the collection (boolean)
 */
var $ForEachNode = klass({
    $extends : TNode,

    /**
     * ForEach node contstructor
     * @param {Map<Expression>|int} exps the map of the variables used by the node. 0 is passed if no expression is
     * used
     * @param {String} itemName the name of the item variable that should be created
     * @param {String} itemKeyName the name of the item key that should be used
     * @param {Number} colExpIdx the index of the expression of the collection over which the statement must iterate
     * @param {Array} children list of sub-node generators - 0 may be passed if there is not child nodes
     */
    $constructor : function (exps, itemKeyName, itemName, forType, colExpIdx, children) {
        this.isDOMless = true;
        this.itemName = itemName;
        this.itemKeyName = itemKeyName;
        this.forType = 0; // 0=in / 1=of / 2=on
        this.colExpIdx = colExpIdx;

        // force binding for the collection
        exps["e" + colExpIdx][0] = 1;
        TNode.$constructor.call(this, exps);
        this.displayedCol = null; // displayed collection

        this.itemNode = new $ItemNode(children, itemName, itemKeyName); // will be used as generator for each childNode
                                                                        // instance
    },

    $dispose : function () {
        TNode.$dispose.call(this);
        if (this.root && this.displayedCol) {
            this.root.rmObjectObserver(this, this.displayedCol);
        }
        this.displayedCol = null;
    },

    /**
     * Create a node instance referencing the current node as base class As the $ForEachNode is DOMless it will not
     * create a DOM node for itself - but will create nodes for its children instead
     * @return {TNode} the new node instance
     */
    createNodeInstance : function (parent) {
        var ni = TNode.createNodeInstance.call(this, parent);
        ni.TYPE = "# foreach"; // for debugging purposes
        var nd = ni.node; // same as parent node in this case
        ni.node1 = doc.createComment("# foreach");
        ni.node2 = doc.createComment("# /foreach");
        nd.appendChild(ni.node1);

        var col = ni.eh.getValue(ni.colExpIdx, ni.vscope, null); // collection or array
        ni.createChildNodeInstances(col, nd);

        nd.appendChild(ni.node2);
        return ni;
    },

    createChildNodeInstances : function (col, node) {
        var cn, forType = this.forType, itemNode = this.itemNode;
        if (col) {
            // create an observer on the collection to be notified of the changes (cf. refresh)
            this.root.createObjectObserver(this, col);
            this.displayedCol = col;

            this.childNodes = cn = [];
            if (forType === 0 && col.constructor !== Array) {
                forType = 1; // "in" can only be used on arrays as iterates with integer indexes
            }

            if (forType === 0) {
                // foreach in
                var sz = col.length;
                for (var i = 0, idx = 0; sz > i; i++) {
                    if (col[i] != null && col[i] !== undefined) {
                        // null items are ignored
                        cn.push(itemNode.createNodeInstance(this, col[i], idx, idx === 0, idx === sz - 1, node));
                        idx++;
                    }
                }
            } else {
                console.log("[# foreach] for type on and of are not supported yet");
            }
        }
    },

    /**
     * Refresh the foreach nodes Check if the collection has changed - or i
     */
    refresh : function () {
        if (this.adirty) {
            // the collection has changed - let's compare the items in the DOM to the new collection
            var col = this.eh.getValue(this.colExpIdx, this.vscope, null); // collection or array

            if (col !== this.displayedCol || this.childNodes === null || this.childNodes.length === 0) {
                // the whole collection has changed
                this.root.rmObjectObserver(this, this.displayedCol);

                this.deleteAllItems();
                var df = doc.createDocumentFragment();
                this.createChildNodeInstances(col, df);
                this.node.insertBefore(df, this.node2);

                // update the node reference recursively on all child nodes
                for (var i = 0, sz = this.childNodes.length; sz > i; i++) {
                    this.childNodes[i].replaceNodeBy(df, this.node);
                }

                // TODO delete and recreate foreach items on a doc fragment
                // Note: updateCollection could be used as well in this case - but when the whole collection
                // is changed, it is likely that all items are different - and as such the creation
                // through the doc fragment is faster
            } else {
                // collection is the same but some items have been deleted or created
                this.updateCollection(col);
            }
            this.adirty = false;
        }
        TNode.refresh.call(this); // refresh the child nodes if needed
    },

    /**
     * Update the DOM of the displayed collection to match the target collection passed as argument
     * @param {Array} target the target collection
     */
    updateCollection : function (target) {
        var current = [], itnm = this.itemName, sz = this.childNodes.length, tsz = target.length;
        for (var i = 0; sz > i; i++) {
            current[i] = this.childNodes[i].vscope[itnm];
        }

        // iterate over the current items first
        // and compare with the target collection
        var itm, titm, idx, pendingItems = [], domIdx = 0;
        var maxsz = Math.max(sz, tsz);
        for (var i = 0; sz > i; i++) {
            itm = current[i];
            if (i < tsz) {
                titm = target[i];

                if (titm == null || titm === undefined) {
                    // we should skip this item
                    target.splice(i, 1);
                    pendingItems.splice(i, 1);
                    tsz -= 1;
                    maxsz = Math.max(sz, tsz);
                    i -= 1;
                    continue;
                }
            } else {
                // there is no more target item - delete the current item
                titm = null;
                domIdx = this.deleteItem(i, domIdx, false);
                current.splice(i, 1);
                i -= 1; // as item has been removed we need to shift back - otherwise we will skip the next item
                sz -= 1;
                continue;
            }

            if (itm === titm) {
                // this item doesn't need to be moved
                continue;
            }
            // check if item has not been found in a previous iteration
            if (pendingItems[i]) {
                // re-attach pending item in the DOM and in childNodes
                this.childNodes.splice(i, 0, pendingItems[i]);
                current.splice(i, 0, pendingItems[i].vscope[itnm]);
                sz += 1;
                var nextNode = this.node2;
                if (i < sz - 1) {
                    nextNode = this.childNodes[i + 1].node1;
                }

                pendingItems[i].attachDOMNodesBefore(nextNode);
                pendingItems[i] = null;
            } else {

                // check if current item exists in next targets
                idx = target.indexOf(itm, i);
                if (idx > i) {
                    // item will be needed later - let's put it aside
                    pendingItems[idx] = this.childNodes[i];
                    this.childNodes[i].detachDOMNodes(domIdx);
                    this.childNodes.splice(i, 1);
                } else {
                    // item has to be removed
                    domIdx = this.deleteItem(i, domIdx, false);
                }
                // remove item from current array (may have been put in pendingItems list if needed later)
                current.splice(i, 1);
                sz -= 1;

                // check if target exist in next items
                idx = current.indexOf(titm, i);
                if (idx >= i) {
                    // item should be moved to current position
                    if (idx != i) {
                        this.moveItem(idx, i, domIdx, false);
                        var tmp = current.splice(idx, 1);
                        current.splice(i, 0, tmp);
                    }
                } else {
                    // current target item is a new item
                    var ni = this.createItem(titm, i, i === 0, i === maxsz - 1, doc.createDocumentFragment());
                    // attach to the right DOM position
                    var refNode = this.node2;
                    if (this.childNodes[i + 1]) {
                        refNode = this.childNodes[i + 1].node1;
                    }
                    this.node.insertBefore(ni.node, refNode);
                    ni.replaceNodeBy(ni.node, this.node);
                    // update current array
                    current.splice(i, 0, titm);
                    sz += 1;
                }
            }
        }
        // update the item scope variables
        this.resyncItemScopes(0, tsz - 1);

        // if target is bigger than the current collection - we have to create the new items
        if (sz < tsz) {
            for (var i = sz; tsz > i; i++) {
                titm = target[i];
                if (titm == null || titm === undefined) {
                    // we should skip this item
                    target.splice(i, 1);
                    pendingItems.splice(i, 1);
                    tsz -= 1;
                    continue;
                }

                if (pendingItems[i]) {
                    // attach pending item to current position
                    this.childNodes.splice(i, 0, pendingItems[i]);
                    pendingItems[i].attachDOMNodesBefore(this.node2);
                    pendingItems[i].updateScope(i, i === 0, i === maxsz - 1);
                    pendingItems[i] = null;
                } else {
                    // create new item
                    var ni = this.createItem(titm, i, i === 0, i === maxsz - 1, doc.createDocumentFragment());
                    this.node.insertBefore(ni.node, this.node2);
                    ni.replaceNodeBy(ni.node, this.node);
                }
            }
        }
        pendingItems = null;
    },

    /**
     * Delete one of the displayed item
     * @param {Number} idx the item index
     * @param {Number} startIdx the index at which the search should start (optional - default: 0)
     * @param {Boolean} resyncNextItems resynchronize the scope variables (e.g. itm_key) of the next items - optional
     * (default=true)
     * @return the position of the last node removed
     */
    deleteItem : function (idx, startIdx, resyncNextItems) {
        var c = this.childNodes[idx], res = 0;
        if (c) {
            this.childNodes.splice(idx, 1);
            // remove nodes from the DOM
            res = c.detachDOMNodes(startIdx);

            // dispose child nodes
            c.$dispose();

            if (resyncNextItems !== false) {
                this.resyncItemScopes(idx);
            }
        }
        return res;
    },

    /**
     * Delete all child items and remove them from the DOM
     */
    deleteAllItems : function () {
        if (this.node.childNodes) {
            var node = this.node, isInBlock = false, cn = node.childNodes, sz = cn.length, n1 = this.node1, n2 = this.node2;

            for (var i = 0; sz > i; i++) {
                var ch = cn[i];
                if (ch === n1) {
                    isInBlock = true;
                    continue;
                }
                if (isInBlock) {
                    // we are between node1 and node2
                    if (ch === n2) {
                        break;
                    }
                    node.removeChild(ch);
                    i -= 1; // removeChild has shift next item by one
                    sz -= 1;
                }
            }
        }
        if (this.childNodes) {
            var cn = this.childNodes;
            for (var i = 0, sz = cn.length; sz > i; i++) {
                cn[i].$dispose();
            }
            this.childNodes = null;
        }

    },

    /**
     * Moves a displayed item
     * @param {Number} idx the item index
     * @param {Number} newIdx the new - targetted - item index
     * @param {Number} startIdx the index at which the search for nodes should start (optional - internal optimization -
     * default: 0)
     * @param {Boolean} resyncItems resynchronize the scope variables (e.g. itm_key) of the items - optional
     * (default=true)
     */
    moveItem : function (idx, newIdx, startIdx, resyncItems) {
        var cn = this.childNodes, sz = cn.length, ch;
        if (idx === newIdx || idx > sz - 1 || newIdx > sz - 1)
            return; // invalid cases

        // determine the node before which the item should be re-attached
        var nd = this.node2;
        if (newIdx < sz - 1) {
            nd = cn[newIdx].node1;
        }

        // detach item
        ch = cn[idx];
        cn.splice(idx, 1);
        ch.detachDOMNodes(startIdx);

        // re-attach item
        cn.splice(newIdx, 0, ch);
        ch.attachDOMNodesBefore(nd);

        if (resyncItems !== false) {
            this.resyncItemScopes(Math.min(idx, newIdx));
        }
    },

    /**
     * Create a new item and insert it in the childNode array
     * @param {Boolean} createDetached if true the nodes will be created as detached nodes - optional - default: false
     */
    createItem : function (colItem, idx, isfirst, islast, parentDOMNode) {
        var n = this.itemNode.createNodeInstance(this, colItem, idx, isfirst, islast, parentDOMNode);
        this.childNodes.splice(idx, 0, n);
        return n;
    },

    /**
     * Re-synchronize item scope variables when foreach items are moved or deleted
     * @param {Number} startIdx the item index where the synchronization should start (optional - default:0)
     * @param {Number} maxIdx the max index that should be considered to compute the itm_islast variable (optional -
     * default: childNodes length)
     */
    resyncItemScopes : function (startIdx, maxIdx) {
        var sz = this.childNodes.length;
        if (!startIdx)
            startIdx = 0;
        if (maxIdx === undefined)
            maxIdx = sz - 1;
        for (var i = startIdx; sz > i; i++) {
            this.childNodes[i].updateScope(i, i === 0, i === maxIdx);
        }
    },

    /**
     * Tell this node can be found in a component content 
     * $foreach nodes are valid cpt attribute elements if it contains valid sub-elements
     */
    isValidCptAttElement:function () {
        return this.itemNode.isValidCptAttElement();
    },

    /**
    * Helper function used to give contextual error information
    * @return {String} - e.g. "[Component attribute element: @body]"
    */
    toString:function() {
        return "[Foreach]"; // todo add collection description
    }

});

/**
 * Pseudo node acting as a container for each item element
 */
var $ItemNode = klass({
    $extends : TNode,

    /**
     * ForEach Item node constructor This is a domless node that groups all the tnodes associated to a foreach item
     * @param {Array<TNodes>} the child node generators
     * @param {String} itemName the name of the item variable used in the scope
     */
    $constructor : function (children, itemName, itemKeyName) {
        TNode.$constructor.call(this, 0);
        this.isDOMless = true;
        this.itemName = itemName;
        this.itemKeyName = itemKeyName;
        if (children && children !== 0) {
            this.children = children;
        }
        this.detachedNodes = null; // Array of nodes that have been detached
    },

    /**
     * Remove DOM dependencies prior to instance deletion
     */
    $dispose : function () {
        TNode.$dispose.call(this);
        this.node1 = null;
        this.node2 = null;
        this.detachedNodes = null;
    },

    /**
     * Create the node instance corresponding to a for loop item
     * @param {TNode} parent the foreach node
     * @param {Object} item the collection item associated to the node
     * @param {Number} key the item index in the collection
     * @param {Boolean} isfirst tells if item is first in the collection
     * @param {Boolean} islast tells if the item is last in the collection
     * @param {DOMElement} parentDOMNode the parent DOM node where the element should be inserted
     */
    createNodeInstance : function (parent, item, key, isfirst, islast, parentDOMNode) {
        var vs = klass.createObject(parent.vscope), itnm = this.itemName;
        vs["scope"] = vs;
        vs[itnm] = item;
        vs[this.itemKeyName] = key;
        vs[itnm + "_isfirst"] = isfirst;
        vs[itnm + "_islast"] = islast;

        var ni = TNode.createNodeInstance.call(this, parent);
        ni.TYPE = "# item"; // for debugging purposes
        var nd = ni.node;
        ni.vscope = vs;
        ni.node1 = doc.createComment("# item");
        ni.node2 = doc.createComment("# /item");

        if (parentDOMNode) {
            ni.node = nd = parentDOMNode;
        }
        nd.appendChild(ni.node1);
        if (this.children) {
            ni.childNodes = [];
            for (var i = 0, sz = this.children.length; sz > i; i++) {
                ni.childNodes[i] = this.children[i].createNodeInstance(ni);
            }
        }
        nd.appendChild(ni.node2);
        return ni;
    },

    /**
     * Detach the nodes corresponding to this item from the DOM
     */
    detachDOMNodes : function (startIdx) {
        if (!startIdx)
            startIdx = 0;
        var res = startIdx;
        if (!this.node.childNodes) {
            return res;
        }
        var node = this.node, isInBlock = false, res, ch, sz = node.childNodes.length, n1 = this.node1, n2 = this.node2;
        if (this.detachedNodes)
            return; // already detached
        this.detachedNodes = [];

        for (var i = startIdx; sz > i; i++) {
            ch = node.childNodes[i];
            if (ch === n1) {
                isInBlock = true;
            }
            if (isInBlock) {
                // we are between node1 and node2
                this.detachedNodes.push(ch);
                node.removeChild(ch);
                i -= 1; // removeChild has shift next item by one

                if (ch === n2) {
                    res = i;
                    break;
                }
            }
        }
        return res;
    },

    /**
     * Insert the childNodes DOM nodes before a given node This assumes removeNodesFromDOM() has been called before
     * @param {DOMNode} node the DOM node before which the
     */
    attachDOMNodesBefore : function (node) {
        if (this.detachedNodes) {
            var dn = this.detachedNodes, sz = dn.length;
            if (!node || !this.detachedNodes)
                return;

            var df = doc.createDocumentFragment();
            for (var i = 0; sz > i; i++) {
                df.appendChild(dn[i]);
            }
            node.parentNode.insertBefore(df, node);
        }
        this.detachedNodes = null;
    },

    /**
     * Update the scope variables (must be called when an item is moved)
     */
    updateScope : function (key, isfirst, islast) {
        var vs = this.vscope, itnm = this.itemName;
        json.set(vs, this.itemKeyName, key);
        json.set(vs, itnm + "_isfirst", isfirst);
        json.set(vs, itnm + "_islast", islast);
    },


    /**
     * Tell this node can be found in a component content 
     * Item nodes are valid cpt attribute elements if they only contain valid sub-elements
     */
    isValidCptAttElement:function () {
        return isValidCptContent(this.children);
    },

    /**
    * Helper function used to give contextual error information
    * @return {String} - e.g. "[Component attribute element: @body]"
    */
    toString:function() {
        return "[Foreach item]"; // todo add index
    }

});

module.exports = $ForEachNode;
