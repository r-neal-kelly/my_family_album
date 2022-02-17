// Copyright Neal Raulerson 2019. All Rights Reserved.

"use strict";

/* requires */
const fs = require("fs");
const pth = require("path");
const child_process = require("child_process");

const consts = require("./consts.js");
const IP_Tracker = require("./IP_Tracker.js");
const Sessions = require("./Sessions.js");
const meta = require("./meta.js");

/* constants */
const sessions = Sessions("./json/sessions.json", {
    lifetime_minutes: 15,
    //refresh_minutes: 5,
    ip_limit: 16
});
const registrations_per_ip = IP_Tracker({
    limit: 3,
    json_path: "./json/registrations_by_ip.json"
});
const password_attempts_ips = IP_Tracker({
    limit: 12,
    period_ms: consts.minutes_to_milliseconds(5),
    json_path: "./json/password_attempts_ips.json"
});
consts.sessions = sessions;

/* process */
async function process_user(req, res, pathname) {
    if (req.method === "POST") {
        if (pathname === "/user/pre-session") {
            return process_post_user_pre_session(req, res);
        } else if (pathname === "/user/register") {
            return process_post_user_register(req, res);
        } else if (pathname === "/user/login") {
            return process_post_user_login(req, res);
        } else if (pathname === "/user/logout") {
            return process_post_user_logout(req, res);
        } else {
            return consts.write_400(res);
        }
    } else if (req.method === "PUT") {
        if (pathname.includes("/user/add/")) {
            return process_put_add_user_item(req, res, pathname);
        } else if (pathname.includes("/user/del/")) {
            return process_put_del_user_item(req, res, pathname);
        } else {
            return consts.write_400(res);
        }
    } else {
        return consts.write_501(res);
    }
};

async function process_post_user_pre_session(req, res) {
    const ip_address = consts.get_ip_address(req);
    const prev_session_id = consts.parse_cookies(req.headers.cookie).session_id;
    const results = sessions.create(ip_address, prev_session_id);

    if (results === Sessions.static.IS_INVALID) {
        return consts.write_429(res);
    }

    res.setHeader("Set-Cookie", results.cookies);
    return consts.write_201(res, "created", "text/plain; charset=utf-8");
};

async function process_post_user_register(req, res) {
    if (req.headers["content-type"] !== "application/json") {
        consts.write_415(res, "Request needs to have a 'content-type' of 'application/json'.");
        return;
    }

    let data = await consts.get_req_data(req);
    if (data === null) {
        consts.write_413(res);
        req.connection.destroy();
        return;
    } else {
        data = JSON.parse(data);
    }

    const ip_address = consts.get_ip_address(req);
    const session_id = consts.parse_cookies(req.headers.cookie).session_id;
    const results = await register_user(ip_address, session_id, data);
    if (results.passed === true) {
        consts.write_201(res, "registered", "text/plain; charset=utf-8");
        return;
    } else {
        consts.write_400(res, JSON.stringify(results.failures), "application/json");
        return;
    }
};

async function process_post_user_login(req, res) {
    if (req.headers["content-type"] !== "application/json") {
        return consts.write_415(res, "Request needs to have a 'content-type' of 'application/json'.");
    }

    let data = await consts.get_req_data(req);
    if (data === null) {
        consts.write_413(res);
        req.connection.destroy();
        return;
    } else {
        data = JSON.parse(data);
    }

    const ip_address = consts.get_ip_address(req);
    const session_id = consts.parse_cookies(req.headers.cookie).session_id;
    const results = await login_user(ip_address, session_id, data);
    if (results.passed === true) {
        res.setHeader("Set-Cookie", results.cookies);
        return consts.write_201(res, "logged in", "text/plain; charset=utf-8");
    } else {
        return consts.write_400(res, JSON.stringify(results.failures), "application/json");
    }
};

async function process_post_user_logout(req, res) {
    if (req.headers["content-type"] !== "application/json") {
        return consts.write_415(res, "Request needs to have a 'content-type' of 'application/json'.");
    }

    let data = await consts.get_req_data(req);
    if (data === null) {
        consts.write_413(res);
        req.connection.destroy();
        return;
    } else {
        data = JSON.parse(data);
    }

    const session_id = consts.parse_cookies(req.headers.cookie).session_id;
    const results = await logout_user(session_id, data);

    if (results.passed === true) {
        return consts.write_201(res, "logged out", "text/plain; charset=utf-8");
    } else {
        return consts.write_401(res, JSON.stringify(results.failures), "application/json");
    }
};

/* helper funcs */
async function password_hash(password, cost) {
    let result;
    await new Promise(function (resolve) {
        const php = child_process.spawn("php", [
            "./php/password.php",
            "hash",
            password,
            cost
        ]);
        php.stdout.on("data", data => {
            result = data.toString();
            resolve();
        });
    });
    return result;
};

async function password_verify(password, hash) {
    let result;
    await new Promise(function (resolve) {
        const php = child_process.spawn("php", [
            "./php/password.php",
            "verify",
            password,
            hash
        ]);
        php.stdout.on("data", data => {
            result = data.toString();
            resolve();
        });
    });
    return result === "true" ? true : false;
};

/* handlers */
async function register_user(ip_address, session_id, data) {
    let results = {
        passed: null,
        failures: []
    };

    if (sessions.validate(session_id, data.csrf_token) !== Sessions.static.IS_VALID) {
        results.failures.push("could not complete registration, please try again after refreshing the page");
        results.passed = false;
        return results;
    }

    if (registrations_per_ip.should_limit(ip_address)) {
        results.failures.push("too many registrations have been made with this ip, please contact Neal");
        results.passed = false;
        // I should log the ip and why this happens when it happens
        return results;
    }

    const user_name = data.user_name;
    if (!user_name) {
        results.failures.push("there is no user name");
    } else {
        if (user_name.length < 4) {
            results.failures.push("the user name needs to be at least 4 letters long");
        }
        if (meta.has_user_name(user_name)) {
            results.failures.push("this user name is not available");
        }
        if (user_name.trim() !== user_name) {
            results.failures.push("the user name has one or more spaces on the ends.");
        }
    }

    if (!data.password) {
        results.failures.push("there is no password (or passphrase)");
    } else if (/\s/.test(data.password)) {
        // is passphrase
        if (/\s{2,}/.test(data.password)) {
            results.failures.push("passphrase has multiple spaces in a row");
        }
        if (/^\s/.test(data.password)) {
            results.failures.push("the passphrase has a space at the front");
        }
        if (/\s$/.test(data.password)) {
            results.failures.push("the passphrase has a space at the back");
        }
        const words = data.password.match(/\S+/g);
        if (words.length < 5) {
            results.failures.push("the passphrase needs to have at least 5 words");
        }
        if (words.filter(word => word.length < 5).length !== 0) {
            results.failures.push("each word in the passphrase needs to be at least 5 letters long");
        }
        for (const [idx, word] of words.entries()) {
            if (idx !== words.indexOf(word)) {
                results.failures.push("the passphrase has a repeated word");
                break;
            }
        }
    } else {
        // is password
        if (data.password.length < 12) {
            results.failures.push("password needs to be 12 letters long");
        }
        if (!/[!-/:-@\[-`{-~]/.test(data.password)) {
            results.failures.push("password needs at least one symbol");
        }
        if (!/[a-zA-Z]/.test(data.password) && !/[^\x00-\x7f]/.test(data.password)) {
            results.failures.push("password needs at least one letter");
        }
        if (!/\d/.test(data.password)) {
            results.failures.push("password needs at least one digit");
        }
    }

    if (!data.confirm_password) {
        results.failures.push("there is no confirmation for the password");
    } else if (data.confirm_password !== data.password) {
        results.failures.push("the password confirmation does not match the password");
    }

    if (results.failures.length === 0) {
        // request return data
        results.passed = true;

        // create user_obj
        const user_id = meta.add_user({
            name: user_name,
            type: "user",
            hash: await password_hash(data.password, 13),
            hash_type: "php_bcrypt",
            ip_address: ip_address
        });
        meta.save();

        // track registrations
        registrations_per_ip.add(ip_address);

        // log
        consts.logger.log(`Registered: ${user_name}, ${user_id}, ${ip_address}`);
    } else {
        results.passed = false;
    }

    return results;
};

async function login_user(ip_address, session_id, data) {
    let results = {
        passed: null,
        failures: []
    };

    if (sessions.validate(session_id, data.csrf_token) !== Sessions.static.IS_VALID) {
        results.failures.push("could not complete login, please try again after refreshing the page");
        results.passed = false;
        return results;
    }

    if (password_attempts_ips.should_limit(ip_address)) {
        results.failures.push("could not complete login, please try again later");
        results.passed = false;
        return results;
    }

    const user_name = data.user_name;
    const user_id = meta.get_user_id(user_name);
    const user_password = data.password;

    if (!user_id) {
        results.failures.push("this user name does not exist");
    }
    if (!user_password) {
        results.failures.push("there is no password (or passphrase)");
    }
    if (user_id && user_password && await password_verify(user_password, meta.get_user_hash(user_id)) !== true) {
        results.failures.push("the password is not valid");
    }

    if (results.failures.length === 0) {
        // return data
        results.passed = true;

        // add new ip
        meta.add_user_ip_address(user_id, ip_address);
        meta.save();

        // new session
        results.cookies = sessions.set_user_id(session_id, data.csrf_token, user_id).cookies;

        // log
        consts.logger.log(`Logged in: ${user_name}, ${user_id}, ${ip_address}`);
    } else {
        password_attempts_ips.add(ip_address);
        results.passed = false;
    }

    return results;
};

async function logout_user(session_id, data) {
    let results = {
        passed: null,
        failures: []
    };

    if (sessions.destroy(session_id, data.csrf_token) !== Sessions.static.IS_VALID) {
        results.failures.push("could not complete logout, please try again after refreshing the page");
        results.passed = false;
        return results;
    }

    if (results.failures.length === 0) {
        results.passed = true;
    } else {
        results.passed = false;
    }

    return results;
};

/* exports */
module.exports = process_user;
