// Copyright Neal Raulerson 2019. All Rights Reserved.

"use strict";

Mary.define("raul-pics/filter", [
    "Mary/utils",
    "Mary/parse",
    "Mary/svr/Server_Request",
    "raul-pics/global/consts",
    "raul-pics/meta"
], function (utils, parse, Server_Request, consts, meta) {

    /* constants */
    const filter = {};

    /* functions */
    filter.execute = async function (expression) {
        if (expression.length > 1024) {
            return [false, { error: "expression is too long" }];
        }
        return await new Promise(function (res) {
            const url = `/filter/execute/` +
                `${encodeURIComponent(expression)}`;
            Server_Request("GET", url)
                .headers({ "csrf-token": consts.get_csrf_token() })
                .listen(200, data => res([true, JSON.parse(data)]))
                .listen(null, (status, data) => res([false, JSON.parse(data)]))
                .send();
        });
    };

    filter.get_possible_operands = async function (expression, cursor_idx) {
        if (expression.length > 1024) {
            return [false, { error: "expression is too long" }];
        }
        return await new Promise(function (res) {
            const url = `/filter/get/possible_operands/` +
                `${encodeURIComponent(expression)}/` +
                `${encodeURIComponent(cursor_idx)}`;
            Server_Request("GET", url)
                .listen(200, data => res([true, JSON.parse(data)]))
                .listen(null, (status, data) => res([false, JSON.parse(data)]))
                .send();
        });
    };

    /* exports */
    return filter;

});
