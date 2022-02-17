// Copyright Neal Raulerson 2019. All Rights Reserved.

"use strict";

/* requires */
const fs = require("fs");

const consts = require("./consts.js");

/* constructor */
function IP_Tracker({ limit = 1, period_ms = undefined, json_path = undefined }) {
    const inst = Object.create(IP_Tracker.prototype);
    inst.ips = {};
    inst.limit = limit;
    if (period_ms) {
        inst.period_ms = period_ms;
    }
    if (json_path) {
        inst.json_path = json_path;
    }
    inst.save_timeout_handle = null;

    if (inst.json_path) {
        load_json(inst);
    }

    return inst;
};

IP_Tracker.prototype = {};

/* statics */
function load_json(inst) {
    if (!inst.json_path) {
        throw new Error("not a valid json_path");
    }

    if (fs.existsSync(inst.json_path)) {
        try {
            inst.ips = JSON.parse(fs.readFileSync(inst.json_path, "utf8"));
        } catch (err) {
            inst.ips = {};
            consts.logger.log("Failed to load tracker ips at path:", inst.json_path, err.stack);
        }
    } else {
        inst.ips = {};
    }

    return inst;
};

function save_json(inst) {
    if (!inst.json_path) {
        throw new Error("not a valid json_path");
    }

    if (!inst.save_timeout_handle) {
        inst.save_timeout_handle = setTimeout(async function () {
            if (!await consts.fs_writeFile(inst.json_path, JSON.stringify(inst.ips), "utf8")) {
                consts.logger.log("Failed to save tracker ips at path:", inst.json_path, new Error().stack);
            }
            inst.save_timeout_handle = null;
        }, 200);
    }

    return inst;
};

function filter_expires(inst, ip_address) {
    if (inst.hasOwnProperty("period_ms")) {
        inst.ips[ip_address].expires_arr = inst.ips[ip_address].expires_arr.filter(expires => {
            if (Date.now() > expires) {
                inst.ips[ip_address].count -= 1;
                return false;
            } else {
                return true;
            }
        });
    }
};

/* methods */
IP_Tracker.prototype.add = function (ip_address) {
    const inst = this;

    if (!inst.ips[ip_address]) {
        inst.ips[ip_address] = { count: 1 };
        if (inst.hasOwnProperty("period_ms")) {
            inst.ips[ip_address].expires_arr = [Date.now() + inst.period_ms];
        }
    } else {
        filter_expires(inst, ip_address);
        inst.ips[ip_address].count += 1;
        if (inst.hasOwnProperty("period_ms")) {
            inst.ips[ip_address].expires_arr.push(Date.now() + inst.period_ms);
        }
    }

    if (inst.ips[ip_address].count > inst.limit) {
        throw new Error("over limit");
    }

    if (inst.json_path) {
        save_json(inst);
    }

    return inst;
};

IP_Tracker.prototype.sub = function (ip_address) {
    const inst = this;

    if (inst.ips[ip_address]) {
        inst.ips[ip_address].count -= 1;
        if (inst.hasOwnProperty("period_ms")) {
            inst.ips[ip_address].expires_arr.splice(0, 1);
        }
        if (inst.ips[ip_address].count === 0) {
            delete inst.ips[ip_address];
        }
    }

    if (inst.json_path) {
        save_json(inst);
    }

    return inst;
};

IP_Tracker.prototype.count = function (ip_address) {
    const inst = this;
    if (inst.ips.hasOwnProperty(ip_address)) {
        filter_expires(inst, ip_address);
        if (inst.json_path) {
            save_json(inst);
        }
        return inst.ips[ip_address].count;
    } else {
        return 0;
    }
};

IP_Tracker.prototype.should_limit = function (ip_address) {
    const inst = this;
    if (!inst.ips[ip_address]) {
        return false;
    } else {
        filter_expires(inst, ip_address);
        if (inst.json_path) {
            save_json(inst);
        }
        return inst.ips[ip_address].count >= inst.limit;
    }
};

/* exports */
module.exports = IP_Tracker;
