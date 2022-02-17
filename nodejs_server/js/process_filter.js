// Copyright Neal Raulerson 2019. All Rights Reserved.

"use strict";

/* requires */
const url = require("url");
const querystring = require("querystring");

const consts = require("./consts.js");
const Sessions = require("./Sessions.js");
const Filter = require("./Filter.js");
const meta = require("./meta.js");

/* process */
async function process_filter(req, res, pathname) {
    if (req.method === "GET") {
        if (pathname.includes("/filter/execute/")) {
            return process_filter_execute(req, res, pathname);
        } else if (pathname.includes("/filter/get/possible_operands/")) {
            return process_filter_get_possible_operands(req, res, pathname);
        } else {
            return consts.write_404(res);
        }
    } else {
        return consts.write_501(res);
    }
};

async function process_filter_execute(req, res, pathname) {
    const [expression] = pathname.replace("/filter/execute/", "").split("/").map(_ => decodeURIComponent(_));
    if (expression.length > 1024) {
        return consts.write_414(res, JSON.stringify({ error: "expression is too long" }), "application/json");
    }
    try {
        const [passed, user_id_or_error] = await consts.authenticate(req, res);
        if (passed) {
            const user_id = user_id_or_error;
            const user_variables = meta.get_user_variables(user_id);
            const filter = Filter(expression, user_variables);
            const results = filter.execute();
            return consts.write_200(res, JSON.stringify(results), "application/json");
        } else {
            const filter = Filter(expression);
            const results = filter.execute();
            return consts.write_200(res, JSON.stringify(results), "application/json");
        }
    } catch (err) {
        return consts.write_400(res, JSON.stringify({ error: err.message }), "application/json");
    }
};

async function process_filter_get_possible_operands(req, res, pathname) {
    const [expression, cursor_idx] = pathname.replace("/filter/get/possible_operands/", "").split("/").map(_ => decodeURIComponent(_));
    if (expression.length > 1024) {
        return consts.write_414(res, JSON.stringify({ error: "expression is too long" }), "application/json");
    }
    try {
        const results = Filter.static.get_possible_operands(expression, cursor_idx);
        return consts.write_200(res, JSON.stringify(results), "application/json");
    } catch (err) {
        return consts.write_400(res, JSON.stringify({ error: err.message }), "application/json");
    }
};

/* exports */
module.exports = process_filter;
