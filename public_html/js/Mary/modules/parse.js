// Copyright Neal Raulerson 2019. All Rights Reserved.

"use strict";

Mary.define("Mary/modules/parse", [
    "Mary/modules/utils"
], function (utils) {

    /* constants */
    const parse = Object.create(null);

    /* numbers */
    parse.pad = function (str = "0", pad_str = '0', upto_num = 1) {
        str = String(str);
        let padding = "";
        for (let pad_num = upto_num - str.length; pad_num > 0; pad_num -= 1) {
            padding += pad_str;
        }
        return padding + str;
    }

    parse.padOneNumber = function (number) { // make more general
        let num = String(number);
        num = (num.length < 2) ?
            "0" + num : num;
        return num;
    };

    parse.numberize = function (string) {
        // stop Number from casting "" to 0
        if (string !== "") {
            return Number(string);
        }
    };

    parse.hours24 = function (hours24) {
        const hours12 = Object.create(null);
        if (hours24 > 12) {
            hours12.hours = hours24 - 12;
            hours12.cycle = "PM";
        } else if (hours24 === 12) {
            hours12.hours = 12;
            hours12.cycle = "PM";
        } else if (hours24 === 0) {
            hours12.hours = 12;
            hours12.cycle = "AM";
        } else {
            hours12.hours = hours24;
            hours12.cycle = "AM";
        }
        return hours12;
    };

    // url
    parse.url = utils.newObj();

    parse.url.decode_segment = function (url_segment, is_query_str = false) {
        // this doesn't work for utf8 streams yet...
        if (is_query_str) {
            url_segment = url_segment.replace(/\+/g, " ");
        }
        let decoded_str = url_segment.replace(/%(..)/g, (match, group_1) => {
            return String.fromCharCode(parseInt(`0x${group_1}`));
        });
        return decoded_str;
    };

    parse.url.encode_segment = function (url_segment, is_query_str = false) {
        // this doesn't work for utf8 streams yet...
        let encoded_str = url_segment.replace(/([^a-zA-Z0-9\-_.~])/g, (match, group_1) => { // maybe escape "/"?
            return `%${group_1.charCodeAt(0).toString(16)}`;
        });
        if (is_query_str) {
            encoded_str = encoded_str.replace(/%20/g, "+");
        }
        return encoded_str;
    };

    parse.url.query = function (url_query_str) {
        if (url_query_str[0] !== "?") {
            throw new Error("url_query_str must only be the query part of the url, starting with '?'");
        }
        const query_obj = {};
        const url_query_arr = url_query_str.slice(1).split("&").map(pair => pair.split("="));
        for (const [key, value] of url_query_arr) {
            query_obj[parse.url.decode_segment(key, true)] = parse.url.decode_segment(value, true);
        }
        return query_obj;
    };

    // cookies
    parse.cookies = function (document_cookie) {
        const cookies = {};
        if (document_cookie) {
            document_cookie.split(";").map(pair => {
                const idx = pair.indexOf("=");
                return [pair.slice(0, idx), pair.slice(idx + 1)];
            }).forEach(([key, value = ""]) => {
                cookies[key.trim()] = value.trim();
            });
        }
        return cookies;
    };

    // css
    parse.css = utils.newObj();
    
    parse.css.declarations = function (declarations_str) {
        const is_comment_regex = /^\/\//;
        return declarations_str.split(/\n+/)
            .map(rule => rule.trim())
            .filter(rule => !!rule && !is_comment_regex.exec(rule));
    };

    /* statements */
    parse.statement = function (statement, delimiter) {
        const result = [];
        let isAssigned, left, right, removes;
        if (utils.isArray(statement)) {
            // assumed to already be parsed
            return statement;
        }
        if (delimiter === ":") {
            isAssigned = /:(\s*)?\S/;
            left = /[^:]+/;
            right = /:.+/;
            removes = /:\s*|;/g;
        } else if (delimiter === "=") {
            isAssigned = /=(\s*)?\S/;
            left = /[^=]+/;
            right = /=.+/;
            removes = /=\s*|'|"/g;
        }
        result[0] = statement.match(left)[0].trim();
        if (isAssigned.test(statement)) {
            result[1] = statement.match(right)[0].replace(removes, "").trim();
        } else {
            result[1] = "";
        }
        return result;
    };

    parse.style = declaration => parse.statement(declaration, ":");

    parse.attribute = pair => parse.statement(pair, "=");

    /* exports */
    return parse;

});
