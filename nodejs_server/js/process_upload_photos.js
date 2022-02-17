// Copyright Neal Raulerson 2019. All Rights Reserved.

"use strict";

/* requires */
const fs = require("fs");

const consts = require("./consts.js");
const Sessions = require("./Sessions.js");
const IP_Tracker = require("./IP_Tracker.js");
const meta = require("./meta.js");

/* consts */
const requests_json_path = "./json/upload_photos.json";
const request_ips = IP_Tracker({
    limit: 1,
    json_path: "./json/upload_photos_ips.json"
});
const requests_obj = fs.existsSync(requests_json_path) ?
    JSON.parse(fs.readFileSync(requests_json_path, "utf8")) :
    {};
const photo_folders = [
    "defaults",
    "thumbs",
    "opposites",
    "overlays",
    "alternates",
    "originals"
];

/* vars */
let save_timeout;

/* funcs */
async function save_requests_json() {
    if (!await consts.fs_writeFile(requests_json_path, JSON.stringify(requests_obj), "utf8")) {
        consts.logger.log("Failed to save upload_photos json:", requests_json_path, new Error().stack);
    }
};

/* router */
async function process_upload_photos(req, res, pathname) {
    const return_data = {};
    if (req.method === "POST") {
        if (pathname === "/upload/photos/create") {
            return process_post_create(req, res, return_data);
        } else if (pathname === "/upload/photos/destroy") {
            return process_post_destroy(req, res, return_data);
        } else if (pathname === "/upload/photos/cancel") {
            return process_post_cancel(req, res, return_data);
        } else if (pathname === "/upload/photos/job") {
            return process_post_job(req, res, return_data);
        } else {
            return_data.error = "Forbidden path.";
            return consts.write_403(res, JSON.stringify(return_data), "application/json");
        }
    } else if (req.method === "PUT") {
        if (pathname === "/upload/photos/job") {
            return process_put_job(req, res, return_data);
        } else if (pathname === "/upload/photos/individual") {
            return process_put_individual(req, res, return_data);
        } else {
            return_data.error = "Forbidden path.";
            return consts.write_403(res, JSON.stringify(return_data), "application/json");
        }
    } else {
        return_data.error = "Method is not implemented.";
        return consts.write_501(res, JSON.stringify(return_data), "application/json");
    }
};

/* create request */
async function process_post_create(req, res, return_data) {
    const ip_address = consts.get_ip_address(req);

    const [passed, user_id] = await consts.authenticate(req, res, ["user", "modder"], true);
    if (!passed) {
        return_data.error = "Only an admin can complete this operation.";
        return consts.write_401(res, JSON.stringify(return_data), "application/json");
    }

    let data = await consts.get_req_data(req);
    if (data === null) {
        return_data.error = "Payload is too large.";
        return consts.write_413(res, JSON.stringify(return_data), "application/json");
    } else if (!data) {
        return_data.error = "Request must have a payload.";
        return consts.write_403(res, JSON.stringify(return_data), "application/json");
    }
    data = JSON.parse(data);

    try {
        return_data.request_id = await request_create(ip_address, user_id, data.album_id);
        return consts.write_201(res, JSON.stringify(return_data), "application/json");
    } catch (err) {
        return_data.error = err.message;
        return consts.write_403(res, JSON.stringify(return_data), "application/json");
    }
};

async function request_create(ip_address, user_id, album_id) {
    // validate ip_address
    if (request_ips.should_limit(ip_address)) {
        throw new Error("Only one upload_photos operation can be done at a time.");
    } else {
        request_ips.add(ip_address);
    }
    // validate user_id
    if (!user_id) {
        throw new Error("Missing user_id.");
    }
    if (!await meta.has_user_id(user_id)) {
        throw new Error("Invalid user_id.");
    }
    // validate album_id
    if (!album_id) {
        throw new Error("Missing album_id.");
    }
    if (!await meta.has_album_id(album_id)) {
        throw new Error("Invalid album_id.");
    }
    // request_id
    let request_id;
    do {
        request_id = consts.utils_number_random().toString();
    } while (requests_obj.hasOwnProperty(request_id));
    // request_obj
    requests_obj[request_id] = {
        ip_address: ip_address,
        user_id: user_id,
        album_id: album_id,
        photo_names_to_photo_ids: {},
        jobs: {},
        saved: false,
        canceled: false
    };
    // backup meta data
    meta.backup();
    // returns
    return request_id;
};

/* destroy request */
async function process_post_destroy(req, res, return_data) {
    const [passed, user_id] = await consts.authenticate(req, res, ["user", "modder"], true);
    if (!passed) {
        return_data.error = "Only an admin can complete this operation.";
        return consts.write_401(res, JSON.stringify(return_data), "application/json");
    }

    let data = await consts.get_req_data(req);
    if (data === null) {
        return_data.error = "Payload is too large.";
        return consts.write_413(res, JSON.stringify(return_data), "application/json");
    } else if (!data) {
        return_data.error = "Request must have a payload.";
        return consts.write_403(res, JSON.stringify(return_data), "application/json");
    }
    data = JSON.parse(data);

    try {
        await request_destroy(data.request_id);
        return consts.write_201(res, JSON.stringify(return_data), "application/json");
    } catch (err) {
        return_data.error = err.message;
        return consts.write_403(res, JSON.stringify(return_data), "application/json");
    }
};

async function request_destroy(request_id) {
    // validate request_id
    const request_obj = requests_obj[request_id];
    if (!request_obj) {
        throw new Error("Invalid request_id.");
    }
    if (request_obj.canceled) {
        throw new Error("Request has been canceled.");
    }
    // sub ip_address
    request_ips.sub(request_obj.ip_address);
    // delete reqeust
    delete requests_obj[request_id];
    // save
    meta.save();
};

/* cancel */
async function process_post_cancel(req, res, return_data) {
    const [passed, user_id] = await consts.authenticate(req, res, ["user", "modder"], true);
    if (!passed) {
        return_data.error = "Only an admin can complete this operation.";
        return consts.write_401(res, JSON.stringify(return_data), "application/json");
    }

    let data = await consts.get_req_data(req);
    if (data === null) {
        return_data.error = "Payload is too large.";
        return consts.write_413(res, JSON.stringify(return_data), "application/json");
    } else if (!data) {
        return_data.error = "Request must have a payload.";
        return consts.write_403(res, JSON.stringify(return_data), "application/json");
    }
    data = JSON.parse(data);

    try {
        await request_cancel(data.request_id);
        return consts.write_201(res, JSON.stringify(return_data), "application/json");
    } catch (err) {
        return_data.error = err.message;
        return consts.write_403(res, JSON.stringify(return_data), "application/json");
    }
};

async function request_cancel(request_id) {
    // validate request_id
    const request_obj = requests_obj[request_id];
    if (!request_obj) {
        throw new Error("Invalid request_id.");
    }
    if (request_obj.canceled) {
        throw new Error("Request has been canceled.");
    }
    // set flag
    request_obj.canceled = true;
    // cleanup and revert
    for (const [job_id, job_obj] of Object.entries(request_obj.jobs)) {
        if (job_obj.started) {
            const photo_id = request_obj.photo_names_to_photo_ids[job_obj.photo_name];
            if (job_obj.photo_folder === "defaults") {
                // del from meta data
                await meta.del_photo(request_obj.user_id, photo_id);
                // del from disk
                const photo_path = consts.resolve_photo_path(photo_id);
                if (await consts.fs_exists(photo_path)) {
                    await consts.fs_unlink(photo_path);
                }
            } else {
                const photo_path = consts.resolve_photo_path(photo_id, job_obj.photo_folder);
                if (await consts.fs_exists(photo_path)) {
                    await consts.fs_unlink(photo_path);
                }
            }
        }
    }
    // sub ip_address
    request_ips.sub(request_obj.ip_address);
    // delete reqeust
    delete requests_obj[request_id];
    // save
    meta.save();
};

/* create job */
async function process_post_job(req, res, return_data) {
    const [passed, user_id] = await consts.authenticate(req, res, ["user", "modder"]);
    if (!passed) {
        return_data.error = "Only an admin can complete this operation.";
        return consts.write_401(res, JSON.stringify(return_data), "application/json");
    }

    let data = await consts.get_req_data(req);
    if (data === null) {
        return_data.error = "Payload is too large.";
        return consts.write_413(res, JSON.stringify(return_data), "application/json");
    } else if (!data) {
        return_data.error = "Request must have a payload.";
        return consts.write_403(res, JSON.stringify(return_data), "application/json");
    }
    data = JSON.parse(data);

    try {
        return_data.job_id = await request_job(data);
        return consts.write_201(res, JSON.stringify(return_data), "application/json");
    } catch (err) {
        return_data.error = err.message;
        return consts.write_403(res, JSON.stringify(return_data), "application/json");
    }
};

async function request_job({ request_id, photo_name, photo_folder, default_type }) {
    // validate request_id
    const request_obj = requests_obj[request_id];
    if (!request_obj) {
        throw new Error("Invalid request_id.");
    }
    if (request_obj.canceled) {
        throw new Error("Request has been canceled.");
    }
    // validate photo_name
    if (!photo_name) {
        throw new Error("Missing photo_name.");
    }
    if (photo_folder !== "defaults" && !request_obj.photo_names_to_photo_ids.hasOwnProperty(photo_name)) {
        throw new Error("Invalid photo_name.");
    }
    // validate photo_folder
    if (!photo_folder) {
        throw new Error("Missing photo_folder.");
    }
    if (!photo_folders.includes(photo_folder)) {
        throw new Error("Invalid photo_folder.");
    }
    if (photo_folder === "defaults") {
        // validate default_type
        if (photo_folder === "defaults" && !default_type) {
            throw new Error("Missing default_type.");
        }
        if (photo_folder === "defaults" && default_type !== "digital" && default_type !== "physical") {
            throw new Error("Invalid default_type.");
        }
    }
    // job_id
    let job_id;
    do {
        job_id = consts.utils_number_random().toString();
    } while (request_obj.jobs.hasOwnProperty(job_id));
    // job_obj
    const job_obj = {
        started: false,
        photo_name,
        photo_folder
    };
    if (photo_folder === "defaults") {
        job_obj.default_type = default_type;
        request_obj.photo_names_to_photo_ids[photo_name] = null;
    }
    // add to request_obj
    request_obj.jobs[job_id] = job_obj;
    // returns
    return job_id;
};

/* fulfill job */
async function process_put_job(req, res, return_data) {
    const [passed, user_id] = await consts.authenticate(req, res, ["user", "modder"]);
    if (!passed) {
        return_data.error = "Only an admin can complete this operation.";
        return consts.write_401(res, JSON.stringify(return_data), "application/json");
    }

    let data = await consts.get_req_data(req, consts.megabytes_to_bytes(3));
    if (data === null) {
        return_data.error = "Payload is too large.";
        return consts.write_413(res, JSON.stringify(return_data), "application/json");
    } else if (!data) {
        return_data.error = "Request must have a payload.";
        return consts.write_403(res, JSON.stringify(return_data), "application/json");
    }
    data = JSON.parse(data);

    try {
        await fulfill_job(data);
        return consts.write_200(res, JSON.stringify(return_data), "application/json");
    } catch (err) {
        return_data.error = err.message;
        return consts.write_403(res, JSON.stringify(return_data), "application/json");
    }
};

async function fulfill_job({ request_id, job_id, photo_data }) {
    // validate request_id
    const request_obj = requests_obj[request_id];
    if (!request_obj) {
        throw new Error("Invalid request_id.");
    }
    if (request_obj.canceled) {
        throw new Error("Request has been canceled.");
    }
    // validate job_id
    const job_obj = request_obj.jobs[job_id];
    if (!job_obj) {
        throw new Error("Invalid job_id.");
    }
    // validate photo_data
    if (!photo_data) {
        throw new Error("Missing photo_data.");
    }
    // save request
    if (!request_obj.saved) {
        save_requests_json();
        request_obj.saved = true;
    }
    // execute job
    job_obj.started = true;
    if (job_obj.photo_folder === "defaults") {
        // add to meta data
        const photo_id = await meta.add_album_photo(request_obj.user_id, request_obj.album_id, job_obj.default_type);
        // add to request_obj
        request_obj.photo_names_to_photo_ids[job_obj.photo_name] = photo_id;
        // add to disk
        const photo_path = consts.resolve_photo_path(photo_id);
        const photo_buffer = Buffer.from(photo_data, "base64");
        if (!await consts.fs_writeFile(photo_path, photo_buffer, null)) {
            throw new Error(`Failed to copy '${photo_name}'`);
        }
    } else {
        // get photo_id
        const photo_id = request_obj.photo_names_to_photo_ids[job_obj.photo_name];
        // add to meta data
        if (job_obj.photo_folder === "opposites") {
            await meta.add_photo_tag_has_opposite(request_obj.user_id, photo_id);
        } else if (job_obj.photo_folder === "overlays") {
            await meta.add_photo_tag_has_overlay(request_obj.user_id, photo_id);
        } else if (job_obj.photo_folder === "alternates") {
            await meta.add_photo_tag_has_alternate(request_obj.user_id, photo_id);
        } else if (job_obj.photo_folder === "originals") {
            await meta.add_photo_tag_has_original(request_obj.user_id, photo_id);
        } /* else is thumb */
        // add to disk
        const photo_path = consts.resolve_photo_path(photo_id, job_obj.photo_folder);
        const photo_buffer = Buffer.from(photo_data, "base64");
        if (!await consts.fs_writeFile(photo_path, photo_buffer, null)) {
            throw new Error(`Failed to copy '${photo_name}'`);
        }
    }
    clearTimeout(save_timeout);
    save_timeout = setTimeout(meta.save, 2000);
};

/* individual */
async function process_put_individual(req, res, return_data) {
    const [passed, user_id] = await consts.authenticate(req, res, ["user", "modder"]);
    if (!passed) {
        return_data.error = "Only an admin can complete this operation.";
        return consts.write_401(res, JSON.stringify(return_data), "application/json");
    }

    let data = await consts.get_req_data(req, consts.megabytes_to_bytes(3));
    if (data === null) {
        return_data.error = "Payload is too large.";
        return consts.write_413(res, JSON.stringify(return_data), "application/json");
    } else if (!data) {
        return_data.error = "Request must have a payload.";
        return consts.write_403(res, JSON.stringify(return_data), "application/json");
    }
    data = JSON.parse(data);
    data.user_id = user_id;

    try {
        await put_individual(data);
        return consts.write_200(res, JSON.stringify(return_data), "application/json");
    } catch (err) {
        return_data.error = err.message;
        return consts.write_403(res, JSON.stringify(return_data), "application/json");
    }
};

async function put_individual({ user_id, photo_id, photo_folder, photo_data, thumb_data = undefined }) {
    // validate user_id
    if (!user_id) {
        throw new Error("Missing user_id.");
    }
    if (!await meta.has_user_id(user_id)) {
        throw new Error("Invalid user_id.");
    }
    // validate photo_id
    if (!photo_id) {
        throw new Error("Missing photo_id.");
    }
    if (!await meta.has_photo_id(photo_id)) {
        throw new Error("Invalid photo_id.");
    }
    // validate photo_folder
    if (!photo_folder) {
        throw new Error("Missing photo_folder.");
    }
    if (!photo_folders.includes(photo_folder)) {
        throw new Error("Invalid photo_folder.");
    }
    // validate photo_data
    if (!photo_data) {
        throw new Error("Missing photo_data.");
    }
    // validate thumb_data
    if (photo_folder === "defaults" && !thumb_data) {
        throw new Error("Missing thumb_data.");
    }

    if (photo_folder === "defaults") {
        // add default to disk
        const photo_path = consts.resolve_photo_path(photo_id);
        const photo_buffer = Buffer.from(photo_data, "base64");
        if (!await consts.fs_writeFile(photo_path, photo_buffer, null)) {
            throw new Error(`Failed to copy into defaults.`);
        }
        // add thumb to disk
        const thumb_path = consts.resolve_photo_path(photo_id, "thumbs");
        const thumb_buffer = Buffer.from(thumb_data, "base64");
        if (!await consts.fs_writeFile(thumb_path, thumb_buffer, null)) {
            throw new Error(`Failed to copy into thumbs.`);
        }
    } else {
        // add to meta data
        if (photo_folder === "opposites") {
            await meta.add_photo_tag_has_opposite(user_id, photo_id);
        } else if (photo_folder === "overlays") {
            await meta.add_photo_tag_has_overlay(user_id, photo_id);
        } else if (photo_folder === "alternates") {
            await meta.add_photo_tag_has_alternate(user_id, photo_id);
        } else if (photo_folder === "originals") {
            await meta.add_photo_tag_has_original(user_id, photo_id);
        } /* else is thumb */
        // add to disk
        const photo_path = consts.resolve_photo_path(photo_id, photo_folder);
        const photo_buffer = Buffer.from(photo_data, "base64");
        if (!await consts.fs_writeFile(photo_path, photo_buffer, null)) {
            throw new Error(`Failed to copy into ${photo_folder}`);
        }
    }

    clearTimeout(save_timeout);
    save_timeout = setTimeout(meta.save, 2000);
};

/* exports */
module.exports = process_upload_photos;
