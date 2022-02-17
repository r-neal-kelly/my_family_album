// Copyright Neal Raulerson 2019. All Rights Reserved.

"use strict";

Mary.define("Mary/modules/utils", [
    
], function () {

    /* constants */
    const utils = Object.create(null);
    const toString = x => Object.prototype.toString.call(x);
    const is = (x, regex) => regex.test(toString(x).replace(/^[^ ]+ |.$/g, ""));

    /* objects */
    utils.object = {};

    utils.newObj = (proto = null) => Object.create(proto);

    utils.proto = (proto, obj) => Object.setPrototypeOf(obj, proto);

    utils.object.shallowCopy = obj => Object.assign({}, obj);

    /* booleans */
    utils.bool = {};

    utils.bool.exists = value => value !== undefined && value !== null;

    utils.rdmBool = () => Math.random() > 0.5; // rename this to utils.bool.random();

    utils.bit_set = (bits, idx) => bits | (1 << idx);

    utils.bit_unset = (bits, idx) => bits & ~(1 << idx);

    utils.bit_is_set = (bits, idx) => (1 & (bits >> idx)) === 1 ? true : false;

    utils.bit_toggle = (bits, idx) => bits ^ (1 << idx);

    utils.bit_clear = (bits) => 0;

    /* strings */
    utils.string = utils.newObj();

    utils.toString = toString; // waiting to add this to obj

    utils.string.multiply = function (str, multiple) {
        if (utils.isNumber(multiple)) {
            return Array(multiple + 1).join(str);
        } else {
            return str;
        }
    };

    utils.string.unique_from = function (str, other_strs) {
        let unique_str = str;
        let count = 0;
        if (utils.isArray(other_strs)) {
            while (other_strs.indexOf(unique_str) !== -1) {
                count += 1;
                unique_str = `${str} ${count}`;
            }
        } else {
            while (other_strs[unique_str]) {
                count += 1;
                unique_str = `${str} ${count}`;
            }
        }
        return unique_str;
    };

    utils.words = str => str.split(" ");

    utils.unwords = arr => arr.join(" ");

    utils.titleCap = str => str.replace(/(^|\s)\S/g, l => l.toUpperCase());

    /* numbers */
    utils.number = utils.newObj();

    utils.round = (num, precision = 0) => {
        const factor = Math.pow(10, precision);
        return Math.round(num * factor) / factor;
    };

    utils.random = (from = 0, to_inclusive = Number.MAX_SAFE_INTEGER) => {
        return Math.floor(Math.random() * (to_inclusive - from + 1) + from);
    };

    utils.number.unique = (() => {
        const randoms = {};
        return (from, to_inclusive) => {
            let random = utils.random(from, to_inclusive);
            let tries = 0;
            while (randoms[random]) {
                tries += 1;
                random = utils.random(from, to_inclusive);
                if (tries > 10000) {
                    throw new Error("maximum number of tries exceeded.");
                }
            }
            return random;
        };
    })();

    /* booleans */
    utils.isWindow = x => is(x, /Window|global/);
    utils.isNone = x => is(x, /Null|Undefined/);
    utils.isNull = x => is(x, /Null/);
    utils.isUndefined = x => is(x, /Undefined/);
    utils.isString = x => is(x, /String/);
    utils.isBoolean = x => is(x, /Boolean/);
    utils.isRegex = x => is(x, /RegExp/);
    utils.isFunction = x => is(x, /Function/);
    utils.isArray = x => is(x, /Array/);
    utils.isObject = x => is(x, /Object/);
    utils.isMap = x => is(x, /Map/);
    utils.isDate = x => is(x, /Date/);
    utils.isSymbol = x => is(x, /Symbol/);
    utils.isMaryDom = x => is(x, /MaryDom/);
    utils.isNumber = x => is(x, /Number/) && (x === x);
    utils.isNode = x => !utils.isNone(x) && !!x.nodeType;
    utils.isElement = x => !utils.isNone(x) && x.nodeType === 1;
    utils.isInfinity = x => (x === x + 1) && (x === x);
    utils.isNaN = x => x !== x;
    utils.is = (type, obj) => toString(obj) === type;

    /* async */
    utils.async = {};

    utils.async.delay = async function (milliseconds) {
        return new Promise(function (res) {
            setTimeout(() => res(), milliseconds);
        });
    };

    /* time */
    utils.time = {};
    
    utils.time.minutes_to_milliseconds = function (minutes) {
        return Math.floor(minutes * 60 * 1000);
    };

    /* dom */
    // dom funcs can't be used in main electron process.
    utils.freezeEvent = function (event) {
        event.preventDefault();
        event.stopPropagation();
    };

    utils.getIteratorNodes = function (iterator, array = []) {
        let node = iterator.nextNode();
        while (node != null) {
            array.push(node);
            node = iterator.nextNode();
        }
        return array;
    };

    utils.bubbleCheck = function (target, classes) {
        if (target === document.documentElement) {
            return false;
        }
        classes = [].concat(classes);
        for (let className of classes) {
            if (target.classList && target.classList.contains(className)) {
                return true;
            }
        }
        return utils.bubbleCheck(target.parentNode, classes);
    };

    utils.element_is_in_viewport = function (element, viewport) {
        const viewport_rect = viewport.getBoundingClientRect();
        const element_rect = element.getBoundingClientRect();
        return (
            element_rect.top >= viewport_rect.top &&
            element_rect.left >= viewport_rect.left &&
            element_rect.bottom <= viewport_rect.bottom &&
            element_rect.right <= viewport_rect.right
        );
    };

    utils.rect_is_in_viewport = function (element_rect, viewport_rect) {
        return (
            element_rect.top >= viewport_rect.top &&
            element_rect.left >= viewport_rect.left &&
            element_rect.bottom <= viewport_rect.bottom &&
            element_rect.right <= viewport_rect.right
        );
    };

    /* arrays */
    utils.array = utils.newObj(); // maybe make a class

    utils.array.head = arr => arr[0];

    utils.array.last = arr => arr[arr.length - 1];

    utils.array.init = arr => {
        const copy = [].concat(arr);
        copy.pop();
        return copy;
    };

    utils.array.tail = arr => {
        const copy = [].concat(arr);
        copy.shift();
        return copy;
    };

    utils.array.cons = (...args) => {
        const arr = [].concat(args.pop());
        for (let arg of args.reverse()) {
            arr.unshift(arg);
        }
        return arr;
    };

    utils.array.unDupe = arr => {
        return arr.filter((elem, index, self) => {
            return index === self.indexOf(elem);
        });
    };

    utils.array.isEmpty = arr => arr.length === 0;

    utils.array.length = arr => arr.length;

    utils.array.concat = (...arrays) => {
        let concat = [];
        if (arrays.length === 1) arrays = arrays[0];
        for (let arr of arrays) {
            concat = concat.concat(arr);
        }
        return concat;
    };

    utils.array.zip = (...arrays) => {
        const zip = [];
        if (arrays.length === 1) arrays = arrays[0];
        for (let array of arrays) {
            for (let [i, elem] of array.entries()) {
                if (!zip[i]) zip[i] = [];
                zip[i].push(elem);
            }
        }
        return zip;
    };

    utils.array.unzip = utils.array.zip;

    utils.array.includes_every = (arr, items) => {
        const results = [];
        items = [].concat(items);
        for (let item of items) {
            if (arr.includes(item)) results.push(true);
            else results.push(false);
        }
        return !results.includes(false);
    };

    utils.array.includes_any = (arr, items) => {
        const results = [];
        items = [].concat(items);
        for (let item of items) {
            if (arr.includes(item)) results.push(true);
            else results.push(false);
        }
        return results.includes(true);
    };

    utils.array.sortStr = (a, b) => {
        const max = Math.max(a.length, b.length);
        let result = 0;
        for (let i = 0; i <= max; i += 1) {
            if (result !== 0) break;
            const charA = (a.charCodeAt(i) || -1);
            const charB = (b.charCodeAt(i) || -1);
            result = charA - charB;
        }
        return result;
    };

    utils.array.getRandom = function (arr, splice = false) {
        const i = Math.floor(Math.random() * arr.length);
        const elem = arr[i];
        if (splice && i > -1) arr.splice(i, 1);
        return elem;
    };

    utils.range = (start, stop, step = 1) => {
        if (utils.isString(start)) return utils.rangeStr(start);
        const length = Math.floor((stop - start) / step) + 1;
        return Array(length).fill().map((_, i) => start + (i * step));
    };

    utils.rangeStr = str => {
        const ranges = str.split(",");
        let nums = [];
        for (let range of ranges) {
            if (/-/.test(range)) {
                range = code.split("-").map(Number);
                nums = nums.concat(utils.range(...range).map(String));
            } else {
                nums.push(range);
            }
        }
        return nums;
    };

    utils.array.shuffle = arr => {
        for (let i = arr.length - 1; i > 0; i -= 1) {
            let j = Math.floor(Math.random() * (i + 1));
            let temp = arr[i];
            arr[i] = arr[j];
            arr[j] = temp;
        }
        return arr;
    };

    /* maps */
    utils.map = utils.newObj();

    utils.map.head = map => {
        const head = map.entries().next().value || [];
        head.key = head[0];
        head.value = head[1];
        return head;
    };

    utils.map.last = map => {
        const entries = utils.map.entries(map);
        const last = entries[entries.length - 1] || [];
        last.key = last[0];
        last.value = last[1];
        return last;
    };

    utils.map.entries = map => {
        const entries = [];
        for (let entry of map.entries()) {
            entries.push(entry);
        }
        return entries;
    };

    utils.map.keys = map => {
        const keys = [];
        for (let key of map.keys()) {
            keys.push(key);
        }
        return keys;
    };

    utils.map.values = map => {
        const values = [];
        for (let value of map.values()) {
            values.push(value);
        }
        return values;
    };

    utils.map.combine = (...maps) => {
        let result = [];
        for (let map of maps) {
            result = result.concat(utils.map.entries(map));
        }
        return new Map(result);
    };

    utils.map.merge = (...maps) => {
        const merge = new Map();
        if (maps.length === 1) maps = maps[0];
        for (let map of maps) {
            for (let [k, v] of map.entries()) {
                merge.set(k, v);
            }
        }
        return merge;
    };

    /* regex */
    utils.regex = utils.newObj();

    utils.regex.escape = (str = "") => {
        return str.replace(/[.*+?^${}()|[\]\-\\]/g, "\\$&");
    };

    utils.regex.from = (arr_or_str = [], mode = null, should_escape = false) => {
        let arr = [].concat(arr_or_str);

        if (should_escape) {
            arr = arr.map(item => utils.regex.escape(item));
        }

        if (mode === "|") {
            return arr.join("|");
        } else if (mode === "[]") {
            return "[" + arr.join("") + "]";
        } else if (mode === "[^]") {
            return "[^" + arr.join("") + "]";
        } else {
            return arr.join("");
        }
    };

    /* exports */
    return utils;

});
