// Copyright Neal Raulerson 2019. All Rights Reserved.

"use strict";

Mary.define("Mary/modules/dom", [
    "Mary/utils",
    "Mary/parse"
], function (utils, parse) {

    /* constants */
    const {
        newObj,
        isNone,
        isMaryDom,
        isNode,
        isWindow,
        isString,
        isBoolean,
        isFunction,
        isArray,
        isObject,
        isMap,
        isNumber,
        getIteratorNodes
    } = utils;
    const nk = Symbol("Each node passed is given a locked state.");

    /* constructor */
    const MaryDom = function MaryDom(args, context, multiple, append = true) {
        const MaryDomObj = newObj(MaryDom.prototype);
        Object.defineProperties(MaryDomObj, {
            "size": { writable: true, value: 0 },
            "first": { writable: true },
            "last": { writable: true },
            "length": { writable: true },
            "parent_dom": { writable: true }
        });
        const results = filter(args, context, multiple);
        for (let node of results) {
            MaryDomObj[MaryDomObj.size] = node;
            MaryDomObj.size += 1;
            if (!node[nk]) node[nk] = newObj();
        }
        MaryDomObj.first = MaryDomObj[0];
        MaryDomObj.last = MaryDomObj[MaryDomObj.size - 1];
        MaryDomObj.length = MaryDomObj.size;
        // may want to check if the first parentNode is the same node as the first context node...
        if (context && !MaryDomObj.first.parentNode) {
            if (append === "spread") {
                MaryDomObj.appendTo(context, append);
            } else if (append) {
                MaryDomObj.appendTo(context);
            }
        }
        return MaryDomObj;
    };

    /* filters */
    const filter = function (args, context, multiple) { // add regex
        let result;
        if (isNone(args)) result = whenNull;
        else if (isMaryDom(args)) result = whenMaryDom;
        else if (isNode(args)) result = whenNode;
        else if (isWindow(args)) result = whenWindow;
        else if (isString(args)) result = whenString;
        else if (isBoolean(args)) result = whenBoolean;
        else if (isNumber(args)) result = whenNumber;
        else if (isFunction(args)) result = whenFunction;
        else if (isObject(args)) result = whenObject;
        else if (isMap(args)) result = whenMap;
        else if (isArray(args)) result = whenArray;
        else result = whenNull;
        return result(args, context, multiple);
    };

    const whenNull = function () {
        // context: not used; multiple: not used;
        return [];
    };

    const whenMaryDom = function (dom, context, multiple) {
        // context: pattern; multiple: node clones;
        let results = [];
        dom = dom.array();
        if (multiple == null) {
            return dom;
        }
        if (context === "between") {
            dom.forEach(function (node) {
                results = results.concat(whenNode(node, null, multiple));
            });
            return results;
        }
        dom.forEach(function (node) {
            results = results.concat(whenNode(node, null, multiple).slice(1));
        });
        if (context === "before") {
            results = results.concat(dom);
        } else {
            // defaults to "after"
            results = dom.concat(results);
        }
        return results;
    };

    const whenNode = function (node, context, multiple = 1) {
        // context: not used; multiple: node clones;
        const results = [];
        results.push(node);
        multiple -= 1;
        for (let i = 0; i < multiple; i += 1) {
            results.push(node.cloneNode(true));
        }
        return results;
    };

    const whenWindow = function (win) {
        // context: not used; multiple: not used;
        return [win];
    };

    const whenString = function (string, context, multiple) {
        // context: parent node; multiple: copies or node limit
        let results, wrap;
        context = filter(context)[0] || document;
        if (string === "") {
            results = whenNull();
        } else if (/^<\S[^>]*>/.test(string)) {
            // html
            if (isNumber(multiple)) {
                string = utils.string.multiply(string, multiple);
            }
            wrap = document.createElement("div");
            wrap.innerHTML = string;
            results = Array.from(wrap.children);
            results.forEach(function (node) {
                node.remove();
            });
        } else if (/^SHOW_/.test(string)) {
            // node iterator
            results = whenNumber(NodeFilter[string], context, multiple);
        } else {
            // querySelectorAll
            results = Array.from(context.querySelectorAll(string));
            if (isNumber(multiple)) {
                results = results.slice(0, multiple);
            }
        }
        return results;
    };

    const whenBoolean = function (boolean, context, multiple) {
        // context: parent node; multiple: node limit
        let results = whenNumber(-1, context, multiple);
        if (boolean === false) {
            results = results.reverse();
        }
        return results;
    };

    const whenNumber = function (number, context, multiple) {
        // context: parent node; multiple: node limit
        let results, iterator;
        context = filter(context)[0] || document;
        iterator = document.createNodeIterator(context, number);
        results = getIteratorNodes(iterator);
        if (isNumber(multiple)) {
            results = results.slice(0, multiple);
        }
        return results;
    };

    const whenFunction = function (func, context, multiple) {
        // context: carried; multiple: carried;
        let results = [];
        results = results.concat(filter(func(), context, multiple));
        return results;
    };

    const whenObject = function (object, context, multiple) {
        // context: carried; multiple: carried;
        let results = [];
        Object.keys(object).forEach(function (key) {
            let value = object[key];
            results = results.concat(filter(value, context, multiple));
        });
        return results;
    };

    const whenMap = function (map, context, multiple) {
        // context: carried; multiple: carried;
        return whenArray(map, context, multiple);
    };

    const whenArray = function (array, context, multiple) {
        // context: carried; multiple: carried;
        let results = [];
        array.forEach(function (element) {
            results = results.concat(filter(element, context, multiple));
        });
        return results;
    };

    /* statics */
    MaryDom.nodeKey = nk;
    MaryDom.type_str = "MaryDom";

    /* prototype */
    MaryDom.prototype = newObj();
    MaryDom.prototype.constructor = MaryDom;
    MaryDom.prototype[Symbol.toStringTag] = MaryDom.type_str;

    /* base */
    MaryDom.prototype.forEach = function (callback) {
        const iterator = Array.from(this).entries();
        for (let [i, node] of iterator) {
            let result = callback.call(this[i], this[i], i, this);
            if (result === "break") {
                break;
            }
        }
        return this;
    };

    MaryDom.prototype.wrapEach = function (callback) {
        const iterator = Array.from(this).entries();
        for (let [i, node] of iterator) {
            let node = MaryDom(this[i]);
            let result = callback.call(node, node, i, this);
            if (result === "break") {
                break;
            }
        }
        return this;
    };

    MaryDom.prototype.contains = function (node) {
        // chain-breaker
        if (this.indexOf(node) != null) return true;
        else return false;
    };

    MaryDom.prototype.has = MaryDom.prototype.contains;

    MaryDom.prototype.restore = function () {
        return this.parent_dom || this;
    };

    /* nodes */
    MaryDom.prototype.array = function (type) {
        let result = Array.from(this);
        if (type === "wrap") {
            result = result.map(dNode => MaryDom(dNode));
        }
        Object.defineProperty(result, "restore", {
            value: this.restore,
            writable: true
        });
        Object.defineProperty(result, "parent_dom", {
            value: this,
            writable: true
        });
        return result;
    };

    MaryDom.prototype.findIndex = function (query) {
        // chain-breaker
        let result = null;
        this.forEach(function (dNode, dIndex, dObj) {
            if (result !== null) {
                return;
            }
            if (isNode(query) && query === dNode) {
                result = dIndex;
            }
            if (isFunction(query) && query(dNode, dIndex, dObj) === true) {
                result = dIndex;
            }
        });
        return result;
    };

    MaryDom.prototype.indexOf = MaryDom.prototype.findIndex;

    MaryDom.prototype.eq = function (indexes) {
        let result = [];
        //if (indexes == null || isString(indexes)) {
        //  return this;
        //}
        if (!isNumber(indexes) && !isArray(indexes)) {
            return this;
        }
        indexes = [].concat(indexes);
        for (let index of indexes) {
            if (this[index] != null) {
                result.push(this[index]);
            }
        }
        result = MaryDom(result);
        result.parent_dom = this;
        return result;
    };

    MaryDom.prototype.filter = function (query, posCall, negCall) {
        let positives = [];
        let negatives = [];
        if (query == null) {
            return this;
        }
        if (isNode(query) || isNumber(query)) {
            // if a node or a number
            this.forEach(function (dNode, dIndex) {
                if (query === dNode || query === dIndex) {
                    positives.push(dNode);
                } else {
                    negatives.push(dNode);
                }
            });
        } else if (isFunction(query)) {
            // if a function
            this.forEach(function (dNode, dIndex, dObj) {
                if (query.call(dNode, dNode, dIndex, dObj)) {
                    positives.push(dNode);
                } else {
                    negatives.push(dNode);
                }
            });
        } else {
            // assumed to be a querySelectorAll string
            this.forEach(function (dNode) {
                var foster, clone, parent, result;
                if (dNode === window || dNode === document) {
                    return;
                }
                if (dNode.parentNode != null) {
                    parent = dNode.parentNode;
                } else {
                    clone = dNode.cloneNode(true);
                    foster = MaryDom("<div></div>")
                        .appendChildren(clone);
                }
                result = MaryDom(query, parent || foster);
                if (result.contains(dNode) || result.contains(clone)) {
                    positives.push(dNode);
                } else {
                    negatives.push(dNode);
                }
            });
        }
        positives = MaryDom(positives);
        negatives = MaryDom(negatives);
        if (!isFunction(posCall) && !isFunction(negCall)) {
            // just return positives
            positives.parent_dom = this;
            return positives;
        } else {
            // invoke callbacks
            if (isFunction(posCall)) {
                this.forEach(function (dNode, dIndex, dObj) {
                    if (positives.contains(dNode)) {
                        posCall.call(dObj, dNode, dIndex, dObj);
                    }
                });
            }
            if (isFunction(negCall)) {
                this.forEach(function (dNode, dIndex, dObj) {
                    if (negatives.contains(dNode)) {
                        negCall.call(dObj, dNode, dIndex, dObj);
                    }
                });
            }
            return this;
        }
    };

    MaryDom.prototype.find = function (query, posCall, negCall) {
        let positives = [];
        let negatives = [];
        if (query == null) {
            return this;
        }
        if (isNode(query) || isNumber(query)) {
            // if a node or a number
            this.forEach(function (dNode, dIndex) {
                this.children(dIndex).forEach(function (cNode, cIndex) {
                    if (query === cNode || query === cIndex) {
                        positives.push(cNode);
                    } else {
                        negatives.push(cNode);
                    }
                });
            }.bind(this));
        } else if (isFunction(query)) {
            // if a function
            this.children().forEach(function (cNode, cIndex, cObj) {
                if (query.call(cNode, cNode, cIndex, cObj)) {
                    positives.push(cNode);
                } else {
                    negatives.push(cNode);
                }
            });
        } else {
            // assumed to be a querySelectorAll string
            this.forEach(function (dNode) {
                if (dNode === window) {
                    return;
                }
                let result = MaryDom(query, dNode)
                    .forEach(function (node) {
                        positives.push(node);
                    });
                this.children().forEach(function (cNode) {
                    if (!result.contains(cNode)) {
                        negatives.push(cNode);
                    }
                });
            }.bind(this));
        }
        positives = MaryDom(positives);
        negatives = MaryDom(negatives);
        if (!isFunction(posCall) && !isFunction(negCall)) {
            // just return positives
            positives.parent_dom = this;
            return positives;
        } else {
            // invoke callbacks
            if (isFunction(posCall)) {
                this.forEach(function (dNode, dIndex, dObj) {
                    if (positives.contains(dNode)) {
                        posCall.call(dObj, dNode, dIndex, dObj);
                    }
                });
            }
            if (isFunction(negCall)) {
                this.forEach(function (dNode, dIndex, dObj) {
                    if (negatives.contains(dNode)) {
                        negCall.call(dObj, dNode, dIndex, dObj);
                    }
                });
            }
            return this;
        }
    };

    MaryDom.prototype.reverse = function () {
        const result = MaryDom(this.array.reverse());
        result.parent_dom = this.parent_dom;
        return result;
    };

    MaryDom.prototype.add = function (args, context, multiple) {
        const additions = MaryDom(args, context, multiple).array();
        return MaryDom([this].concat(additions));
    };

    MaryDom.prototype.remove = function (index) {
        if (isNumber(index) || isArray(index)) {
            this.eq(index).remove();
        } else {
            this.forEach(function (dNode) {
                dNode.remove();
            });
        }
        return this;
    };

    MaryDom.prototype.wrapFirst = function () {
        const result = MaryDom(this.first);
        result.parent_dom = this;
        return result;
    };

    MaryDom.prototype.wrapLast = function () {
        const result = MaryDom(this.last);
        result.parent_dom = this;
        return result;
    };

    MaryDom.prototype.focus = function (index) {
        if (isNumber(index) || isArray(index)) {
            this.eq(index).focus();
        } else if (this.first && this.first.focus) {
            this.first.focus();
        }
        return this;
    };

    MaryDom.prototype.is_focused = function () {
        // chain breaker
        return Mary.body_element.activeElement === this.first;
    };

    MaryDom.prototype.blur = function () {
        if (this.first && this.first.blur) {
            this.first.blur();
        }
        return this;
    };

    MaryDom.prototype.click = function (index) {
        if (isNumber(index) || isArray(index)) {
            this.eq(index).click();
        } else if (this.first && this.first.click) {
            this.first.click();
        } else {
            this.focus();
        }
        return this;
    };

    /* text */
    MaryDom.prototype.setHTML = function (HTML, index) {
        if (HTML == null) {
            return this;
        }
        HTML = [].concat(HTML);
        if (isNumber(index) || isArray(index)) {
            this.eq(index).setHTML(HTML);
        } else if (index === "spread") {
            this.forEach(function (dNode, dIndex) {
                if (HTML[dIndex] != null) {
                    dNode.innerHTML = HTML[dIndex];
                }
            });
        } else {
            this.forEach(function (dNode) {
                dNode.innerHTML = HTML.join("");
            });
        }
        return this;
    };

    MaryDom.prototype.addHTML = function (HTML, index) {
        if (HTML == null) {
            return this;
        }
        HTML = [].concat(HTML);
        if (isNumber(index) || isArray(index)) {
            this.eq(index).addHTML(HTML);
        } else if (index === "spread") {
            this.forEach(function (dNode, dIndex) {
                if (HTML[dIndex] != null) {
                    dNode.insertAdjacentHTML("beforeend", HTML[dIndex]);
                }
            });
        } else {
            this.forEach(function (dNode) {
                dNode.insertAdjacentHTML("beforeend", HTML.join(""));
            });
        }
        return this;
    };

    MaryDom.prototype.getHTML = function (index) {
        // chain-breaker
        if (isNumber(index)) {
            return this[index].innerHTML;
        } else {
            return this.first.innerHTML;
        }
    };

    MaryDom.prototype.getAsHTML = function (index) {
        // chain-breaker
        if (isNumber(index)) {
            return this[index].outerHTML;
        } else {
            return this.first.outerHTML;
        }
    };

    MaryDom.prototype.setText = function (text, index) {
        if (text == null) {
            return this;
        }
        text = [].concat(text);
        if (isNumber(index) || isArray(index)) {
            this.eq(index).setText(text);
        } else if (index === "spread") {
            this.forEach(function (dNode, dIndex) {
                if (text[dIndex] != null) {
                    dNode.textContent = text[dIndex];
                }
            });
        } else {
            this.forEach(function (dNode) {
                dNode.textContent = text.join("");
            });
        }
        return this;
    };

    MaryDom.prototype.addText = function (text, index) {
        if (text == null) {
            return this;
        }
        text = [].concat(text);
        if (isNumber(index) || isArray(index)) {
            this.eq(index).addText(text);
        } else if (index === "spread") {
            this.forEach(function (dNode, dIndex) {
                if (text[dIndex] != null) {
                    dNode.insertAdjacentText("beforeend", text[dIndex]);
                }
            });
        } else {
            this.forEach(function (dNode) {
                dNode.insertAdjacentText("beforeend", text.join(""));
            });
        }
        return this;
    };

    MaryDom.prototype.getText = function (index) {
        // chain-breaker
        if (isNumber(index)) {
            return this[index].textContent;
        } else {
            return this.first.textContent;
        }
    };

    /* values */
    MaryDom.prototype.value = function (values, index) {
        if (values == null) { // maybe "spread" to get array of all values
            // chain-breaker
            if (isNumber(index)) {
                return this[index].value;
            } else {
                return this.first.value;
            }
        }
        values = [].concat(values);
        if (isNumber(index) || isArray(index)) {
            this.eq(index).value(values);
        } else if (index === "spread") {
            this.forEach(function (dNode, dIndex) {
                if (values[dIndex] != null) {
                    dNode.value = values[dIndex];
                }
            });
        } else {
            this.forEach(function (dNode) {
                dNode.value = values.join("");
            });
        }
        return this;
    };

    MaryDom.prototype.placeholder = function (holders, index) {
        if (holders == null) {
            // chain-breaker
            if (isNumber(index)) {
                return this[index].placeholder || "";
            } else {
                return this.first.placeholder || "";
            }
        }
        holders = [].concat(holders);
        if (isNumber(index) || isArray(index)) {
            this.eq(index).placeholder(holders);
        } else if (index === "spread") {
            this.forEach(function (dNode, dIndex) {
                if (holders[dIndex] != null) {
                    dNode.placeholder = holders[dIndex];
                }
            });
        } else {
            this.forEach(function (dNode) {
                dNode.placeholder = holders.join("");
            });
        }
        return this;
    };

    MaryDom.prototype.check = function () {
        if (!utils.isNone(this.first.checked)) {
            this.first.checked = true;
        }
        return this;
    };

    MaryDom.prototype.uncheck = function () {
        if (!utils.isNone(this.first.checked)) {
            this.first.checked = false;
        }
        return this;
    };

    MaryDom.prototype.is_checked = function () {
        // chain-breaker
        if (!utils.isNone(this.first.checked)) {
            if (this.first.checked === true) {
                return true;
            } else {
                return false;
            }
        } else {
            return false;
        }
    }

    // out of date. I don't like the whole index thing. I'd rather just eq when I need to.
    MaryDom.prototype.checked = function (checks, index) {
        if (checks == null) {
            // chain-breaker
            if (isNumber(index)) {
                return this[index].checked;
            } else {
                return this.first.checked;
            }
        }
        checks = [].concat(checks);
        if (isNumber(index) || isArray(index)) {
            this.eq(index).checked(checks);
        } else if (index === "all") {
            this.forEach(function (dNode) {
                dNode.checked = checks[0];
            });
        } else {
            // defaults to "spread" behavior
            this.forEach(function (dNode, dIndex) {
                if (checks[dIndex] != null) {
                    dNode.checked = checks[dIndex];
                }
            });
        }
        return this;
    };

    MaryDom.prototype.src = function (sources, index) {
        if (sources == null) {
            // chain-breaker
            if (isNumber(index)) {
                return this[index].src;
            } else {
                return this.first.src;
            }
        }
        sources = [].concat(sources);
        if (isNumber(index) || isArray(index)) {
            this.eq(index).src(sources);
        } else {
            // defaults to "spread" behavior
            this.forEach(function (dNode, dIndex) {
                if (sources[dIndex] != null) {
                    dNode.src = sources[dIndex];
                }
            });
        }
        return this;
    };

    MaryDom.prototype.option = function (options, index) {
        /////////////////////////////////////////////////////////////////////////FIX ME XSS
        if (options == null) {
            return this;
        }
        options = [].concat(options).map(function (option) {
            return "<option>" + option + "</option>";
        });
        this.setHTML(options, index); // this could be an XSS vector if not careful! try to switch to setText or create the actual nodes and add them to the elem
        return this;
    };

    MaryDom.prototype.options = MaryDom.prototype.option;

    MaryDom.prototype.selectOption = function (options, index) {
        if (options == null) {
            return this;
        }
        options = [].concat(options);
        if (isNumber(index) || isArray(index)) {
            this.eq(index).selectOption(options);
        } else {
            // defaults to "spread" behavior
            this.wrapEach(function (dNode, dI) {
                dNode.find("option").wrapEach(function (cNode, cI) {
                    if (cNode.getText() === options[dI] || cI === options[dI]) {
                        cNode.attr("selected=true");
                    }
                });
            });
        }
        return this;
    };

    MaryDom.prototype.hasOption = function (option, index) {
        // chain-breaker
        if (option == null) {
            return this;
        }
        if (isNumber(index)) {
            this.eq(index).hasOption(option);
        } else {
            return this.find("option").array()
                .map(o => o.textContent).includes(option);
        }
    };

    MaryDom.prototype.setOption = MaryDom.prototype.selectOption;

    /* family */
    MaryDom.prototype.children = function (index) {
        let results = [];
        if (isNumber(index) || isArray(index)) {
            results = this.eq(index).children();
        } else {
            this.forEach(function (dNode) {
                results = results.concat(Array.from(dNode.children));
            });
        }
        results = MaryDom(results);
        results.parent_dom = this;
        return results;
    };

    MaryDom.prototype.parent = function (idx) {
        let results = [];
        if (isNumber(idx) || isArray(idx)) {
            results = this.eq(idx).parent();
        } else {
            this.forEach(function (dNode) {
                results.push(dNode.parentNode);
            })
        }
        results = MaryDom(results);
        results.parent_dom = this;
        return results;
    }

    MaryDom.prototype.firstChildren = function (index) {
        let results = [];
        if (isNumber(index) || isArray(index)) {
            results = this.eq(index).firstChildren();
        } else {
            this.forEach(function (dNode) {
                results.push(dNode.firstChild);
            });
        }
        results = MaryDom(results);
        results.parent_dom = this;
        return results;
    };

    MaryDom.prototype.appendTo = function (parents, index) {
        parents = MaryDom(parents);
        if (isNumber(index) || isArray(index)) {
            this.eq(index).appendTo(parents);
        } else if (index === "spread") {
            parents.forEach(function (pNode, pIndex) {
                if (this[pIndex]) {
                    pNode.appendChild(this[pIndex]);
                }
            }.bind(this));
        } else {
            this.forEach(function (dNode) {
                parents.forEach(function (pNode) {
                    pNode.appendChild(dNode);
                });
            });
        }
        return this;
    };

    MaryDom.prototype.append = function (...args) {
        return this.appendChildren(args);
    };

    MaryDom.prototype.appendChildren = function (children, index) {
        children = MaryDom(children);
        if (isNumber(index) || isArray(index)) {
            this.eq(index).appendChildren(children);
        } else if (index === "spread") {
            this.forEach(function (dNode, dIndex) {
                if (children[dIndex]) {
                    dNode.appendChild(children[dIndex]);
                }
            });
        } else {
            this.forEach(function (dNode) {
                children.forEach(function (cNode) {
                    dNode.appendChild(cNode);
                });
            });
        }
        return this;
    };

    MaryDom.prototype.removeChildren = function (index) {
        if (isNumber(index) || isArray(index)) {
            this.eq(index).children().remove();
        } else {
            this.forEach(function (dNode) {
                MaryDom(dNode).children().remove();
            });
        }
        return this;
    };

    /* styles */
    MaryDom.prototype.style = function (styles, index) {
        // ex. "color: red" styles and just "color" unstyles
        if (styles == null) {
            return this;
        }
        if (isString(styles)) {
            styles = parse.css.declarations(styles);
        }
        styles.forEach(function (declaration, i) {
            styles[i] = parse.style(declaration);
        });
        if (isNumber(index) || isArray(index)) {
            this.eq(index).style(styles);
        } else if (index === "spread") {
            this.forEach(function (dNode, dIndex) {
                if (styles[dIndex] != null) {
                    dNode.style[styles[dIndex][0]] = styles[dIndex][1];
                }
            });
        } else {
            this.forEach(function (dNode) {
                styles.forEach(function (declaration) {
                    dNode.style[declaration[0]] = declaration[1];
                });
            });
        }
        return this;
    };

    MaryDom.prototype.getStyle = function (style, index) {
        // chain-breaker
        if (style == null) {
            return this;
        }
        if (isNumber(index)) {
            return this.eq(index).getStyle(style);
        } else {
            return (
                this.first.style[style] ||
                window.getComputedStyle(this.first)
                    .getPropertyValue(style)
            );
        }
    };

    MaryDom.prototype.width = function (index) {
        return this.getStyle("width", index);
    }

    MaryDom.prototype.height = function (index) {
        return this.getStyle("height", index);
    }

    MaryDom.prototype.getStyles = function (index) {
        // chain-breaker
        // needs work!
        if (isNumber(index)) {
            return this.eq(index).getStyles();
        } else {
            return window.getComputedStyle(this.first);
        }
    };

    MaryDom.prototype.class = function (classes, index) {
        if (classes == null) {
            // chain-breaker
            if (isNumber(index)) {
                return this.getAttr("class", index);
            } else {
                return this.getAttr("class", 0);
            }
        }
        classes = [].concat(classes);
        if (isNumber(index) || isArray(index)) {
            this.eq(index).class(classes);
        } else if (index === "spread") {
            this.wrapEach(function (dNode, dIndex) {
                if (classes[dIndex] != null) {
                    dNode.class(classes[dIndex]);
                }
            });
        } else if (index === "checker") {
            this.forEach(function (dNode, dIndex) {
                if (classes[dIndex] == null) {
                    classes = classes.concat(classes);
                }
                if (!dNode[nk].defaultClasses)
                    dNode[nk].defaultClasses = classes[dIndex];
                dNode.classList.add(classes[dIndex]);
            });
        } else {
            this.forEach(function (dNode) {
                if (!dNode[nk].defaultClasses)
                    dNode[nk].defaultClasses = classes;
                classes.forEach(function (className) {
                    dNode.classList.add(className);
                });
            });
        }
        return this;
    };

    MaryDom.prototype.setClass = function (classes, index) {
        this.eq(index).forEach(function (dNode) {
            if (dNode.classList) {
                dNode[nk].defaultClasses = classes;
                dNode.setAttribute("class", "");
            }
        });
        return this.class(classes, index);
    };

    MaryDom.prototype.defaultClass = function (index) {
        if (isNumber(index) || isArray(index)) {
            this.eq(index).defaultClass();
        } else {
            this.wrapEach(function (dNode) {
                const classes = dNode.first[nk].defaultClasses;
                if (classes) dNode.setClass(classes);
            });
        }
        return this;
    };

    MaryDom.prototype.removeClass = function (classes, index) {
        if (classes == null) {
            if (isNumber(index) || isArray(index)) {
                this.eq(index).removeClass();
            } else {
                this.wrapEach(function (dNode) {
                    dNode.removeAttr("class");
                });
            }
            return this;
        }
        classes = [].concat(classes);
        if (isNumber(index) || isArray(index)) {
            this.eq(index).removeClass(classes);
        } else {
            this.forEach(function (dNode) {
                classes.forEach(function (className) {
                    dNode.classList.remove(className);
                });
            });
        }
        return this;
    };

    MaryDom.prototype.hasClass = function (classes, index) {
        // chain-breaker
        classes = [].concat(classes);
        if (isNumber(index)) {
            for (let className of classes) {
                if (!this[index].classList.contains(className)) {
                    return false;
                }
            }
        } else {
            for (let className of classes) {
                if (!this.first.classList.contains(className)) {
                    return false;
                }
            }
        }
        return true;
    };

    MaryDom.prototype.id = function (id, index) {
        return this.attr(`id="${id}"`, index);
    }

    /* display */
    MaryDom.prototype.show = function (index) {
        if (isNumber(index) || isArray(index)) {
            this.eq(index).show();
        } else {
            this.wrapEach(function (dNode) {
                dNode.style("display");
            });
        }
        return this;
    };

    MaryDom.prototype.hide = function (index) {
        if (isNumber(index) || isArray(index)) {
            this.eq(index).hide();
        } else {
            this.wrapEach(function (dNode) {
                dNode.style("display: none");
            });
        }
        return this;
    };

    MaryDom.prototype.toggle = function (index) {
        if (isNumber(index) || isArray(index)) {
            this.eq(index).toggle();
        } else {
            this.wrapEach(function (dNode) {
                const display = dNode.getStyle("display");
                if (["none"].includes(display)) {
                    dNode.show();
                } else {
                    dNode.hide();
                }
            });
        }
        return this;
    };

    MaryDom.prototype.is_shown = function (index = 0) {
        // chain-breaker
        return this.getStyle("display", index) !== "none";
    };

    MaryDom.prototype.rect = function () {
        // chain-breaker
        return this.first.getBoundingClientRect();
    };

    MaryDom.prototype.getOffset = function (index) {
        // chain-breaker
        const result = newObj();
        const node = this.eq(index).first;
        const { offsetLeft
            , offsetTop
            , offsetWidth
            , offsetHeight
        } = node;
        return {
            offsetLeft
            , offsetTop
            , offsetWidth
            , offsetHeight
            , l: offsetLeft
            , t: offsetTop
            , w: offsetWidth
            , h: offsetHeight
        };
    };

    MaryDom.prototype.get_viewport_coords = function (idx = 0) {
        // chain-breaker
        const node = this.eq(idx).first;
        return getBoundingClientRect();
    };

    MaryDom.prototype.scroll_into_view = function (options = {}) {
        const node = this.first;
        if (node) {
            // we could make this custom and have some pretty cool options
            // like top_offset, should_center, etc. but this works for now
            node.scrollIntoView();
        }
        return this;
    }

    /* attributes */
    MaryDom.prototype.attr = function (attributes, index) {
        // ex. "class = MyClass" sets and just "class" sets ""
        if (attributes == null) {
            return this;
        }
        attributes = [].concat(attributes);
        attributes.forEach(function (pair, i) {
            attributes[i] = parse.attribute(pair);
        });
        if (isNumber(index) || isArray(index)) {
            this.eq(index).attr(attributes);
        } else if (index === "spread") {
            this.forEach(function (dNode, dIndex) {
                if (attributes[dIndex] != null) {
                    dNode.setAttribute(
                        attributes[dIndex][0],
                        attributes[dIndex][1]
                    );
                }
            });
        } else {
            this.forEach(function (dNode) {
                attributes.forEach(function (pair) {
                    dNode.setAttribute(pair[0], pair[1]);
                });
            });
        }
        return this;
    };

    MaryDom.prototype.removeAttr = function (attributes, index) {
        // completely removes attribute
        if (attributes == null) {
            return this;
        }
        attributes = [].concat(attributes);
        if (isNumber(index) || isArray(index)) {
            this.eq(index).removeAttr(attributes);
        } else {
            this.forEach(function (dNode) {
                attributes.forEach(function (attribute) {
                    dNode.removeAttribute(attribute);
                });
            });
        }
        return this;
    };

    MaryDom.prototype.getAttr = function (attribute, index) {
        // chain-breaker
        if (attribute == null) {
            return this;
        }
        if (isArray(index)) {
            return this.eq(index).getAttr(attribute, "all");
        } else if (isNumber(index)) {
            this.eq(index).getAttr(attribute);
        } else if (index === "all") {
            return this.array().map(node => {
                return node.getAttribute(attribute);
            });
        } else {
            return this.first.getAttribute(attribute);
        }
    };

    MaryDom.prototype.hasAttr = function (attribute, index) {
        // chain-breaker
        if (attribute == null) {
            return this;
        }
        if (isArray(index)) {
            return this.eq(index).hasAttr(attribute, "all");
        } else if (isNumber(index)) {
            this.eq(index).hasAttr(attribute);
        } else if (index === "all") {
            return this.array().map(node => {
                return node.hasAttribute(attribute);
            });
        } else {
            return this.first.hasAttribute(attribute);
        }
    };

    /* handlers */
    MaryDom.prototype.on = function (types, listeners, index, options) {
        if (types == null || listeners == null) {
            return this;
        }
        if (isNumber(index) || isArray(index)) {
            this.eq(index).on(types, listeners, null, options);
        } else if (index === "spread") {
            this.wrapEach(function (dNode, dIndex) {
                if (listeners[dIndex] != null) {
                    dNode.on(types, listeners[dIndex], null, options);
                }
            });
        } else {
            if (!options && !!index && isObject(index)) {
                options = index;
            } else {
                options = {};
            }
            types = [].concat(types);
            listeners = [].concat(listeners);
            const names = [].concat(options.names || options.name);
            const capture = options.capture || false;
            const once = options.once || false;
            const args = options.args || null;
            const regOpt = { capture, once };
            this.forEach(function (dNode, dIndex, dObj) {
                listeners.forEach(function (listener, lIndex) {
                    const name = listener.name || listener.toString();
                    const elemInfo = { node: dNode, index: dIndex, obj: dObj };
                    const thisObj = options.thisObj || elemInfo;
                    listener = listener.bind(thisObj);
                    for (let type of types) { // when more than one, only one gets turned off at the moment in .off. need to fix all of this sometime.
                        const wrap = event => listener(event, elemInfo, args);
                        wrap.type = type;
                        wrap.regular_options = regOpt;
                        dNode.addEventListener(type, wrap, regOpt);
                        if (once) {
                            return;
                        }
                        const space = options.namespace || options.ns || "global";
                        dNode[nk].listeners = dNode[nk].listeners || newObj();
                        const lstners = dNode[nk].listeners;
                        lstners[space] = lstners[space] || newObj();
                        lstners[space][names[lIndex] || name] = wrap;
                    }
                });
            });
        }
        return this;
    };

    MaryDom.prototype.off = function (listeners, index, options = {}) {
        if (listeners == null) {
            return this;
        }
        if (isNumber(index) || isArray(index)) {
            this.eq(index).off(listeners);
        } else if (index === "spread") {
            this.wrapEach(function (dNode, dIndex) {
                if (listeners[dIndex] != null) {
                    dNode.off(listeners[dIndex]);
                }
            });
        } else {
            listeners = [].concat(listeners);
            this.forEach(function (dNode) {
                listeners.forEach(function (listener) {
                    if (!dNode[nk].listeners) {
                        return;
                    }
                    const name = listener.name || listener.toString();
                    const space = options.namespace || options.ns || "global";
                    listener = dNode[nk].listeners[space][name];
                    if (!listener) return;
                    dNode.removeEventListener(listener.type, listener, listener.regular_options);
                    delete dNode[nk].listeners[space][name];
                });
            });
        }
        return this;
    };

    MaryDom.prototype.once = function (type, listeners, index, options = {}) {
        options.once = true;
        return this.on(type, listeners, index, options);
    };

    MaryDom.prototype.send = function (type, detail, index) {
        const evt = new CustomEvent(type, { detail });
        return this.eq(index).forEach(function (dNode) {
            if (dNode.dispatchEvent) dNode.dispatchEvent(evt);
        });
    };

    MaryDom.prototype.trigger = MaryDom.prototype.send;

    /* exports */
    return MaryDom;

});
