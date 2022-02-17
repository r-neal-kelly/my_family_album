// Copyright Neal Raulerson 2019. All Rights Reserved.

"use strict";

/* requires */
const fs = require("fs");
const pth = require("path");
const crypto = require("crypto");

const consts = require("./consts.js");
const IP_Tracker = require("./IP_Tracker.js");

/* constants */
const _ = Symbol("SESSIONS_KEY");

/* constructor */
function Sessions(json_path, options = {}) {
    if (!options.hasOwnProperty("lifetime_minutes")) {
        options.lifetime_minutes = 15;
    }
    if (!options.hasOwnProperty("refresh_minutes")) {
        options.refresh_minutes = 5;
    }
    if (!options.hasOwnProperty("ip_limit")) {
        options.ip_limit = 16;
    }

    if (!json_path) {
        throw new Error("requires a json path to save sessions.");
    }
    if (!/.json$/.test(json_path)) {
        json_path += ".json";
    }

    const inst = Object.create(Sessions.prototype);
    inst.json_path = json_path;
    inst.json_path_ips = inst.json_path.replace(/.json$/, "_ips.json");
    inst.lifetime_ms = consts.minutes_to_milliseconds(options.lifetime_minutes);
    inst.refresh_ms = consts.minutes_to_milliseconds(options.refresh_minutes);
    inst.ip_tracker = IP_Tracker({ limit: options.ip_limit, json_path: inst.json_path_ips });
    inst.ids = load_json(inst);
    inst.save_timeout_handle = null;

    setInterval(() => {
        clean_sessions(inst);
        save_json(inst);
    }, consts.minutes_to_milliseconds(1))

    return inst;
};

Sessions.prototype = {};

/* public statics */
Sessions.static = {
    IS_VALID: 12,
    IS_INVALID: 13
};

/* private statics */
function load_json(inst) {
    if (!inst.json_path) {
        throw new Error("not a valid json_path");
    }

    if (fs.existsSync(inst.json_path)) {
        try {
            inst.ids = JSON.parse(fs.readFileSync(inst.json_path, "utf8"));
            clean_sessions(inst);
        } catch (err) {
            inst.ids = {};
            consts.logger.log("Failed to load session ids at path:", inst.json_path, err.stack);
        }
    } else {
        inst.ids = {};
    }

    return inst.ids;
};

function save_json(inst) {
    if (!inst.json_path) {
        throw new Error("not a valid json_path");
    }

    if (!inst.save_timeout_handle) {
        inst.save_timeout_handle = setTimeout(async function () {
            if (!await consts.fs_writeFile(inst.json_path, JSON.stringify(inst.ids), "utf8")) {
                consts.logger.log("Failed to save session ids at path:", inst.json_path, new Error().stack);
            }
            inst.save_timeout_handle = null;
        }, 1000);
    }
};

function clean_sessions(inst) {
    for (const [session_id, session] of Object.entries(inst.ids)) {
        if (session.expires <= Date.now()) {
            inst.destroy(session_id, session.csrf_token);
        }
    }
};

function get_unique_id(inst) {
    let session_id;
    do {
        session_id = crypto.randomBytes(128).toString("base64");
    } while (inst.hasOwnProperty(session_id));
    return session_id;
};

/* methods */
Sessions.prototype.create = function (ip_address, prev_session_id) {
    const inst = this;

    let prev_session = inst.ids[prev_session_id];
    if (prev_session) {
        if (inst.destroy(prev_session_id, prev_session.csrf_token) !== Sessions.static.IS_VALID) {
            prev_session = null;
        }
    }

    if (inst.ip_tracker.should_limit(ip_address)) {
        return Sessions.static.IS_INVALID;
    }

    const session_id = get_unique_id(inst);
    const session = {};
    session.ip_address = ip_address;
    session.csrf_token = crypto.randomBytes(128).toString("base64");
    session.expires = Date.now() + inst.lifetime_ms;
    session.expires_utc = new Date(session.expires).toUTCString();
    session.user_id = prev_session ? prev_session.user_id : null;

    inst.ip_tracker.add(ip_address);
    inst.ids[session_id] = session;
    save_json(inst); // needs to save in unison with ips

    return {
        session_id: session_id,
        csrf_token: session.csrf_token,
        cookies: inst.get_cookies(session_id, session.csrf_token)
    };
};

Sessions.prototype.destroy = function (session_id, csrf_token) {
    const inst = this;
    const session = inst.ids[session_id];

    if (!session) {
        return Sessions.static.IS_INVALID;
    }

    if (session.csrf_token !== csrf_token) {
        return Sessions.static.IS_INVALID;
    }

    delete inst.ids[session_id];
    inst.ip_tracker.sub(session.ip_address);
    save_json(inst);

    if (session.expires <= Date.now()) {
        return Sessions.static.IS_INVALID;
    }

    return Sessions.static.IS_VALID;
};

Sessions.prototype.validate = function (session_id, csrf_token) {
    const inst = this;

    if (!session_id || !csrf_token) {
        return Sessions.static.IS_INVALID;
    }

    const session = inst.ids[session_id];

    if (!session) {
        return Sessions.static.IS_INVALID;
    }

    if (session.expires <= Date.now()) {
        inst.destroy(session_id, session.csrf_token);
        return Sessions.static.IS_INVALID;
    }

    if (session.csrf_token !== csrf_token) {
        return Sessions.static.IS_INVALID;
    }

    return Sessions.static.IS_VALID;
};

Sessions.prototype.authenticate = function (session_id, csrf_token) {
    const inst = this;

    if (!session_id || !csrf_token) {
        return Sessions.static.IS_INVALID;
    }

    const session = inst.ids[session_id];

    if (!session) {
        return Sessions.static.IS_INVALID;
    }

    if (session.expires <= Date.now()) {
        inst.destroy(session_id, session.csrf_token);
        return Sessions.static.IS_INVALID;
    }

    if (session.csrf_token !== csrf_token) {
        return Sessions.static.IS_INVALID;
    }

    if (!session.user_id) {
        return Sessions.static.IS_INVALID;
    }

    return Sessions.static.IS_VALID;
};

Sessions.prototype.get_cookies = function (session_id, csrf_token) {
    const inst = this;
    const session = inst.ids[session_id];

    if (inst.validate(session_id, csrf_token) !== Sessions.static.IS_VALID) {
        return Sessions.static.IS_INVALID;
    }

    return [
        `session_id=${session_id}; expires=${session.expires_utc}; path=/; HttpOnly;`,
        `csrf_token=${csrf_token}; expires=${session.expires_utc}; path=/;`
    ];
};

Sessions.prototype.renew_cookies = function (session_id, csrf_token) {
    const inst = this;
    const session = inst.ids[session_id];

    if (inst.validate(session_id, csrf_token) !== Sessions.static.IS_VALID) {
        return Sessions.static.IS_INVALID;
    }

    return inst.create(session.ip_address, session_id).cookies;
};

Sessions.prototype.set_user_id = function (session_id, csrf_token, user_id) {
    const inst = this;
    const session = inst.ids[session_id];

    if (inst.validate(session_id, csrf_token) !== Sessions.static.IS_VALID) {
        return Sessions.static.IS_INVALID;
    }

    session.user_id = user_id;

    return inst.create(session.ip_address, session_id);
};

Sessions.prototype.get_user_id = function (session_id, csrf_token) {
    const inst = this;
    const session = inst.ids[session_id];

    if (inst.authenticate(session_id, csrf_token) !== Sessions.static.IS_VALID) {
        return Sessions.static.IS_INVALID;
    }

    return session.user_id;
};

/* exports */
module.exports = Sessions;
