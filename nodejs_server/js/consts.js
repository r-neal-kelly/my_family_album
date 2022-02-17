// Copyright Neal Raulerson 2019. All Rights Reserved.

"use strict";

/* requires */
const fs = require("fs");
const os = require("os");
const pth = require("path");
const child_process = require("child_process");

/* constants */
const consts = {};

/* paths */
consts.public_html = "../public_html";
//consts.public_js = "./public_js";
consts.default_html = "/index.html";
consts.tmp_img_path = `${consts.public_html}/tmp/img`;
consts.tmp_txt_path = `${consts.public_html}/tmp/txt`;
consts.tmp_zip_path = `${consts.public_html}/tmp/zip`;
consts.photos_path = `${consts.public_html}/photos`;

/* bools */
consts.is_local = fs.existsSync("./run.bat");
consts.is_windows = os.platform() === "win32";
consts.is_linux = os.platform() === "linux";

/* arrs */
consts.binary_exts = [
    ".ttf", ".jpg", ".ico", ".otf", ".zip"
];

/* funcs */
consts.delay = async function (ms) {
    return new Promise(function (res) {
        setTimeout(() => res(), ms);
    });
};

consts.minutes_to_milliseconds = function (minutes) {
    return Math.floor(minutes * 60 * 1000);
};

consts.megabytes_to_bytes = function (megabytes) {
    return Math.floor(megabytes * 1024 * 1024);
};

// copied from Mary utils
consts.utils_number_random = function (from = 0, to_inclusive = Number.MAX_SAFE_INTEGER) {
    return Math.floor(Math.random() * (to_inclusive - from + 1) + from);
};

consts.utils_is = function (object, regex) {
    return regex.test(Object.prototype.toString.call(object.replace(/^[^ ]+ |.$/g, "")));
};

consts.utils_bool_is_string = function (object) {
    return utils_bool_is(object, /String/);
};

consts.utils_array_undupe = arr => {
    return arr.filter((elem, index, self) => {
        return index === self.indexOf(elem);
    });
};

consts.utils_regex_escape = (str = "") => {
    return str.replace(/[.*+?^${}()|[\]\-\\]/g, "\\$&");
};

consts.utils_regex_from = (arr_or_str = [], mode = null, should_escape = false) => {
    let arr = [].concat(arr_or_str);

    if (should_escape) {
        arr = arr.map(item => consts.utils_regex_escape(item));
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

// copied from Mary parse
consts.parse_str_pad = function (str = "0", pad_str = '0', upto_num = 1) {
    str = String(str);
    let padding = "";
    for (let pad_num = upto_num - str.length; pad_num > 0; pad_num -= 1) {
        padding += pad_str;
    }
    return padding + str;
};

// paths
consts.resolve_public_path = function (pathname) {
    if (pathname === "/" || pathname === "\\") {
        pathname = `${consts.public_html}${consts.default_html}`;
    } else {
        pathname = `${consts.public_html}${pathname}`;
    }
    return pth.normalize(pathname).replace(/%20/g, " "); // decodeURIComponent
};

consts.resolve_private_path = function (pathname) {
    return pth.normalize(pathname).replace(/%20/g, " ");
};

consts.resolve_photo_path = function (photo_id, folder = "") {
    return `${consts.photos_path}/${folder ? folder + "/" : ""}${photo_id}.jpg`;
};

// nodejs wrappers
consts.fs_exists = async function (path) {
    return await new Promise(function (res) {
        fs.stat(path, function (err, stats_obj) {
            err && err.code === "ENOENT" ? res(false) : res(true);
        });
    });
};

consts.fs_stat = async function (path) {
    return await new Promise(function (res, rej) {
        fs.stat(path, function (err, stats_obj) {
            err ? res(null) : res(stats_obj);
        });
    }).catch(err => { });
};

consts.fs_readFile = async function (path, options) {
    return await new Promise(function (res, rej) {
        fs.readFile(path, options, function (err, data) {
            err ? res(null) : res(data);
        });
    }).catch(err => { });
};

consts.fs_writeFile = async function (path, data, options) {
    return await new Promise(function (res, rej) {
        fs.writeFile(path, data, options, function (err) {
            err ? res(false) : res(true);
        });
    }).catch(err => { });
};

consts.fs_copyFile = async function (path_src, path_dest) {
    return new Promise(function (res) {
        fs.copyFile(path_src, path_dest, err => {
            err ? res(false) : res(true);
        })
    }).catch(err => { });
};

consts.fs_unlink = async function (path) {
    return await new Promise(function (res, rej) {
        fs.unlink(path, function (err) {
            err ? res(false) : res(true);
        });
    }).catch(err => { });
};

consts.fs_readdir = async function (path, options) {
    return await new Promise(function (res) {
        fs.readdir(path, options, function (err, files) {
            err ? res(null) : res(files);
        });
    }).catch(err => { });
};

consts.fs_rmdir = async function (path) {
    return await new Promise(function (res, rej) {
        fs.rmdir(path, function (err) {
            err ? res(false) : res(true);
        });
    }).catch(err => { });
};

consts.get_req_data = async function (req, limit = 1e6) {
    return await new Promise(function (res) {
        let data = "";
        req.on("data", req_data => {
            data += req_data;
            if (data.length > limit) {
                res(null);
            }
        });
        req.on("end", () => {
            res(data);
        });
    });
};

consts.get_ip_address = function (req) {
    if (req.headers["x-forwarded-for"]) {
        return req.headers["x-forwarded-for"].split(/,\s*/)[0];
    } else {
        return req.connection.remoteAddress;
    }
};

// html
consts.get_basic_html = function (title, body) {
    return (`
        <!-- Copyright Neal Raulerson 2019. All Rights Reserved. -->
        <!DOCTYPE html>
        <html>
        <head>
            <title>${title}</title>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <link rel="shortcut icon" href="/favicon.ico" type="image/x-icon" />
        </head>
        <body>
            ${body}
        </body>
        </html>
    `);
};

consts.get_status_html = function (code, meaning, msg) {
    return consts.get_basic_html(code, `
        <h1>${code}: ${meaning}</h1>
        <p>${msg}</p>
    `);
};

consts.get_ext_mime = function (ext) {
    if (ext === ".jpg" || ext === ".jpeg") {
        return "image/jpeg";
    } else if (ext === ".json") {
        return "application/json; charset=utf-8";
    } else if (ext === ".js") {
        return "text/javascript; charset=utf-8";
    } else if (ext === ".html") {
        return "text/html; charset=utf-8";
    } else if (ext === ".zip") {
        return "application/zip";
    } else if (ext === ".ttf") {
        return "application/x-font-ttf";
    } else if (ext === ".otf") {
        return "application/x-font-opentype";
    } else if (ext === ".ico") {
        return "image/x-icon";
    } else {
        return "text/plain; charset=utf-8";
    }
};

consts.parse_cookies = function (document_cookie) {
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

consts.authenticate = async function (req, res, type_exclusions = [], should_renew = false) {
    try {
        const cookies = consts.parse_cookies(req.headers.cookie);
        const session_id = cookies.session_id;
        const csrf_token = req.headers["csrf-token"];
        if (!csrf_token || !cookies.csrf_token || csrf_token !== cookies.csrf_token) {
            return [false, "Invalid request."];
        }
        if (consts.sessions.authenticate(session_id, csrf_token) === consts.Sessions.static.IS_INVALID) {
            return [false, "Not logged in."];
        }
        const user_id = consts.sessions.get_user_id(session_id, csrf_token);
        if (!consts.meta.has_user_id(user_id)) {
            return [false, "Invalid User ID."];
        }
        const user_type = consts.meta.get_user_type(user_id);
        if (type_exclusions.includes(user_type)) {
            return [false, `A '${user_type}' cannot complete this operation.`];
        }
        if (should_renew) {
            const session_cookies = consts.sessions.renew_cookies(session_id, csrf_token);
            res.setHeader("Set-Cookie", session_cookies);
        }
        return [true, user_id];
    } catch (err) {
        return [false, err.message];
    }
};

// write
consts.write_200 = function (res, content, content_type, headers = {}) {
    res.writeHead(200, "OK", Object.assign({ "Content-Type": content_type }, headers));
    res.write(content);
    res.end();
};

consts.write_201 = function (res, content, content_type, headers = {}) {
    res.writeHead(201, "Created", Object.assign({ "Content-Type": content_type }, headers));
    res.write(content);
    res.end();
};

consts.write_204 = function (res, content, content_type, headers = {}) {
    res.writeHead(204, "No Content", Object.assign({ "Content-Type": content_type }, headers));
    res.write(content);
    res.end();
};

consts.write_400 = function (res, content, content_type, headers = {}) {
    if (!content) {
        content = "The server cannot handle the malformed request.";
        content = consts.get_status_html(400, "Bad Request", content);
    }
    if (!content_type) {
        content_type = "text/html; charset=utf-8";
    }
    res.writeHead(400, "Bad Request", Object.assign({ "Content-Type": content_type }, headers));
    res.write(content);
    res.end();
};

consts.write_401 = function (res, content, content_type, headers = {}) {
    if (!content) {
        content = "The server cannot authenticate the request.";
        content = consts.get_status_html(401, "Unauthorized", content);
    }
    if (!content_type) {
        content_type = "text/html; charset=utf-8";
    }
    res.writeHead(401, "Unauthorized", Object.assign({ "Content-Type": content_type }, headers));
    res.write(content);
    res.end();
};

consts.write_403 = function (res, content, content_type, headers = {}) {
    if (!content) {
        content = "The server has forbidden the request.";
        content = consts.get_status_html(403, "Forbidden", content);
    }
    if (!content_type) {
        content_type = "text/html; charset=utf-8";
    }
    res.writeHead(403, "Forbidden", Object.assign({ "Content-Type": content_type }, headers));
    res.write(content);
    res.end();
};

consts.write_404 = function (res, content, content_type, headers = {}) {
    if (!content) {
        content = "The server cannot find the url of the request.";
        content = consts.get_status_html(404, "Not Found", content);
    }
    if (!content_type) {
        content_type = "text/html; charset=utf-8";
    }
    res.writeHead(404, "Not Found", Object.assign({ "Content-Type": content_type }, headers));
    res.write(content);
    res.end();
};

consts.write_406 = function (res, content, content_type, headers = {}) {
    if (!content) {
        content = "The server cannot handle the 'accept' of the request.";
        content = consts.get_status_html(406, "Not Acceptable", content);
    }
    if (!content_type) {
        content_type = "text/html; charset=utf-8";
    }
    res.writeHead(406, "Not Acceptable", Object.assign({ "Content-Type": content_type }, headers));
    res.write(content);
    res.end();
};

consts.write_413 = function (res, content, content_type, headers = {}) {
    if (!content) {
        content = "The server cannot handle the size of the data of the request.";
        content = consts.get_status_html(413, "Payload Too Large", content);
    }
    if (!content_type) {
        content_type = "text/html; charset=utf-8";
    }
    res.writeHead(413, "Payload Too Large", Object.assign({ "Content-Type": content_type }, headers));
    res.write(content);
    res.end();
};

consts.write_414 = function (res, content, content_type, headers = {}) {
    if (!content) {
        content = "The server cannot handle the size of the URI/URL of the request.";
        content = consts.get_status_html(414, "Request-URI Too Long", content);
    }
    if (!content_type) {
        content_type = "text/html; charset=utf-8";
    }
    res.writeHead(414, "Request-URI Too Long", Object.assign({ "Content-Type": content_type }, headers));
    res.write(content);
    res.end();
};

consts.write_415 = function (res, content, content_type, headers = {}) {
    if (!content) {
        content = "The server cannot handle the 'content-type' of the request.";
        content = consts.get_status_html(415, "Unsupported Media Type", content);
    }
    if (!content_type) {
        content_type = "text/html; charset=utf-8";
    }
    res.writeHead(415, "Unsupported Media Type", Object.assign({ "Content-Type": content_type }, headers));
    res.write(content);
    res.end();
};

consts.write_429 = function (res, content, content_type, headers = {}) {
    if (!content) {
        content = "The server cannot handle all of the requests made.";
        content = consts.get_status_html(429, "Too Many Requests", content);
    }
    if (!content_type) {
        content_type = "text/html; charset=utf-8";
    }
    res.writeHead(429, "Too Many Requests", Object.assign({ "Content-Type": content_type }, headers));
    res.write(content);
    res.end();
};

consts.write_500 = function (res, content, content_type, headers = {}) {
    if (!content) {
        content = "The server has run into an internal error with the request.";
        content = consts.get_status_html(500, "Internal Server Error", content);
    }
    if (!content_type) {
        content_type = "text/html; charset=utf-8";
    }
    res.writeHead(500, "Internal Server Error", Object.assign({ "Content-Type": content_type }, headers));
    res.write(content);
    res.end();
};

consts.write_501 = function (res, content, content_type, headers = {}) {
    if (!content) {
        content = "The server has not implemented the METHOD of the request.";
        content = consts.get_status_html(501, "Not Implemented", content);
    }
    if (!content_type) {
        content_type = "text/html; charset=utf-8";
    }
    res.writeHead(501, "Not Implemented", Object.assign({ "Content-Type": content_type }, headers));
    res.write(content);
    res.end();
};

// children processes
consts.make_link = async function (target_path, link_path) {
    let command;
    if (consts.is_linux) {
        command = `ln -s "${target_path}" "${link_path}"`;
    } else if (consts.is_windows) {
        command = `mklink "${link_path.replace(/\//g, "\\")}" "${target_path.replace(/\//g, "\\")}"`;
    } else {
        throw new Error("unsupported operating system.");
    }

    return new Promise(function (res) {
        child_process.exec(command, (err, stdout, stderr) => {
            err ? res([false, err, stdout, stderr]) : res([true]);
        });
    }).then(([passed, err, stdout, stderr]) => {
        if (passed) {
            return true;
        } else {
            consts.logger.log("Failed to make link:", stdout, err.stack);
            return false;
        }
    });
};

/* exports */
module.exports = consts;
