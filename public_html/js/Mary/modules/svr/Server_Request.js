// Copyright Neal Raulerson 2019. All Rights Reserved.

"use strict";

Mary.define("Mary/svr/Server_Request", [
    "Mary/utils"
], function (utils) {

    const _ = Symbol("SERVER_REQUEST_KEY");

    function Server_Request(method = "", url = "", async = true) {
        // might be able to add "progress" events onto xhr,
        // but not sure how that works...prob. will not work
        const inst = utils.newObj(Server_Request.prototype);
        inst[_] = {};
        inst[_].xhr = new XMLHttpRequest();
        inst[_].xhr_method = method;
        inst[_].xhr_url = url;
        inst[_].xhr_async = async;
        inst[_].xhr.open(inst[_].xhr_method, inst[_].xhr_url, inst[_].xhr_async);
        inst[_].xhr.onreadystatechange = function () {
            if (inst[_].xhr.readyState === 4) {
                const status = inst[_].xhr.status;
                const response_text = inst[_].xhr.responseText;
                // need to check for more status codes
                if (status === 200 && inst[_]["200"]) {
                    inst[_]["200"](response_text);
                } else if (status === 201 && inst[_]["201"]) {
                    inst[_]["201"](response_text);
                } else if (status === 204 && inst[_]["204"]) {
                    inst[_]["204"](response_text);
                } else if (status === 400 && inst[_]["400"]) {
                    inst[_]["400"](response_text);
                } else if (status === 401 && inst[_]["401"]) {
                    inst[_]["401"](response_text);
                } else if (status === 403 && inst[_]["403"]) {
                    inst[_]["403"](response_text);
                } else if (status === 404 && inst[_]["404"]) {
                    inst[_]["404"](response_text);
                } else if (status === 406 && inst[_]["406"]) {
                    inst[_]["406"](response_text);
                } else if (status === 429 && inst[_]["429"]) {
                    inst[_]["429"](response_text);
                } else if (status === 500 && inst[_]["500"]) {
                    inst[_]["500"](response_text);
                } else if (inst[_].default) {
                    inst[_].default(status, response_text);
                }
            }
        };
        if (inst[_]["error"]) {
            inst[_].xhr.addEventListener("error", inst[_]["error"]);
        }
        if (inst[_]["abort"]) {
            inst[_].xhr.addEventListener("abort", inst[_]["abort"]);
        }
        return inst;
    };

    Server_Request.prototype.headers = function (headers = {}) {
        const inst = this;
        for (const [key, value] of Object.entries(headers)) {
            inst[_].xhr.setRequestHeader(key, value);
        }
        return inst;
    };

    Server_Request.prototype.listen = function (status = undefined, callback = () => { }) {
        const inst = this;
        if (status) {
            inst[_][status.toString()] = callback;
        } else {
            inst[_].default = callback;
        }
        return inst;
    };

    Server_Request.prototype.timeout = function (ms, callback = () => { }) {
        const inst = this;
        inst[_].xhr.timeout = ms;
        inst[_].xhr.ontimeout = callback;
        return inst;
    };

    Server_Request.prototype.send = function (data) {
        const inst = this;
        inst[_].xhr_send_data = data;
        inst[_].xhr.send(data);
        return inst;
    };

    Server_Request.prototype.abort = function () {
        const inst = this;
        inst[_].xhr.abort();
        return inst;
    };

    Server_Request.prototype.retry = function () {
        const inst = this;
        inst[_].xhr.open(inst[_].xhr_method, inst[_].xhr_url, inst[_].xhr_async);
        inst[_].xhr.send(inst[_].xhr_send_data);
        return inst;
    };

    /* exports */
    return Server_Request;

});
