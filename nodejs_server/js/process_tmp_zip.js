// Copyright Neal Raulerson 2019. All Rights Reserved.

"use strict";

/* requires */
const fs = require("fs");
const child_process = require("child_process");

const file_sys = require("../Mary/node_modules/file_sys.js");

const consts = require("./consts.js");
const Queue = require("./Queue.js");
const IP_Tracker = require("./IP_Tracker.js");
const meta = require("./meta.js");

/* constants */
const zip_requests = {};
const zip_queue = Queue();
const zip_ip_tracker = IP_Tracker({
    limit: 2
});

async function process_tmp_zip(req, res, pathname) {
    if (req.method === "POST") {
        if (pathname === "/tmp/zip/generate") {
            return process_tmp_zip_post_generate(req, res);
        } else {
            return consts.write_400(res, "Not a valid url in POST.");
        }
    } else if (req.method === "GET") {
        if (pathname.includes("/tmp/zip/progress/")) {
            return process_tmp_zip_get_progress(req, res, pathname);
        } else {
            return process_tmp_zip_get(req, res, pathname); // unused by shared server
        }
    } else if (req.method === "PUT") {
        if (pathname.includes("/tmp/zip/cancel/")) {
            return process_tmp_zip_put_cancel(req, res, pathname);
        } else {
            return consts.write_400(res);
        }
    } else if (req.method === "DELETE") {
        return process_tmp_zip_delete(req, res, pathname);
    } else {
        return consts.write_501(res);
    }
};

async function process_tmp_zip_post_generate(req, res) {
    // validate request
    if (req.headers["content-type"] !== "application/json") {
        consts.write_415(res, "Request needs to have a 'content-type' of 'application/json'.");
        return;
    }

    if (req.headers["accept"] !== "text/plain") {
        consts.write_406(res, "Request needs to have an 'accept' of 'text/plain'.");
        return;
    }

    const ip_address = consts.get_ip_address(req);
    if (zip_ip_tracker.should_limit(ip_address)) {
        consts.write_429(res, "Too many zip generation requests.");
        return;
    } else {
        zip_ip_tracker.add(ip_address);
    }

    // get json data
    let data = await consts.get_req_data(req);
    if (data === null) {
        // this may leak ip tracks
        consts.write_413(res);
        req.connection.destroy();
        return;
    } else {
        data = JSON.parse(data);
    }
    const photos_arr = data.photos_arr;
    const add_related = data.add_related;

    // validate, handle, and respond
    if (photos_arr && photos_arr.push && photos_arr.length !== 0) {
        const zip_id = await tmp_zip_generate_id();
        zip_queue.push(async function () {
            return tmp_zip_generate(zip_id, photos_arr, add_related, ip_address);
        });
        consts.write_201(res, zip_id, "text/plain");
        return;
    } else {
        consts.write_400(res, "Failed to generate a zip_id. Canceling.");
        return;
    }
};

async function process_tmp_zip_get_progress(req, res, pathname) {
    const zip_id = pathname.replace("/tmp/zip/progress/", "").trim();

    if (zip_id === "" || zip_requests[zip_id] === undefined || zip_requests[zip_id].canceled === true) {
        consts.write_204(res, "Either there is no zip_id, or the zip was canceled.", "text/plain");
        return;
    }

    if (zip_requests[zip_id].passed === false) {
        consts.write_500(res, zip_requests[zip_id].error_msg, "text/plain");
        return;
    }

    if (zip_requests[zip_id].passed === true) {
        consts.write_201(res, "Created", "text/plain");
        return;
    }

    if (zip_requests[zip_id].started === false) {
        consts.write_200(res, "Your request has been queued and will begin automatically as soon as possible.", "text/plain");
        return;
    }

    consts.write_200(res, zip_requests[zip_id].progress, "text/plain");
    return;
};

async function process_tmp_zip_put_cancel(req, res, pathname) {
    const zip_id = pathname
        .replace("/tmp/zip/cancel/", "")
        .replace(".zip", "")
        .trim();

    if (zip_requests[zip_id] === undefined) {
        // may want to delete the zip file in this case
        consts.write_400(res, "Outdated request: no zip file to cancel.");
        return;
    }

    zip_requests[zip_id].canceled = true;

    consts.write_200(res, "true", "text/plain");
    return;
};

async function process_tmp_zip_get(req, res, pathname) {
    const public_path = consts.resolve_public_path(pathname);

    if (!await consts.fs_exists(public_path)) {
        consts.write_404(res, "The zip file doesn't exist.");
        return;
    }

    const zip_id = pathname
        .replace("/tmp/zip/", "")
        .replace(".zip", "")
        .trim();

    if (zip_requests[zip_id] === undefined) {
        // may want to delete the zip file in this case
        consts.write_400(res, "Outdated request: please generate the zip file again.");
        return;
    }

    if (zip_requests[zip_id].passed === null) {
        consts.write_400(res, "Server is still zipping, please wait.");
        return;
    }

    if (zip_requests[zip_id].passed === false) {
        // may want to delete the zip file in this case
        consts.write_500(res, "There was a problem zipping the files.");
        return;
    }

    if (zip_requests[zip_id].passed !== true) {
        // may want to delete the zip file in this case
        consts.write_500(res, "Internal error occured while zipping, please contact Neal.");
        return;
    }

    const zip_data = await consts.fs_readFile(public_path, null);

    if (zip_data === null) {
        consts.write_500(res, "Error reading the zip file, please try again.");
        return;
    }

    consts.write_200(res, zip_data, "application/zip");
    return;
};

async function process_tmp_zip_delete(req, res, pathname) {
    const public_path = consts.resolve_public_path(pathname);
    const zip_id = pathname
        .replace("/tmp/zip/", "")
        .replace(".zip", "")
        .trim();

    if (await consts.fs_exists(public_path) || zip_requests[zip_id]) {
        const did_delete = await tmp_zip_delete(zip_id);
        if (did_delete) {
            consts.write_200(res, "true", "text/plain; charset=utf-8");
            return;
        } else {
            consts.write_500(res, "Error deleting the zip file, please try again.");
            return;
        }
    } else {
        consts.write_200(res, "true", "text/plain; charset=utf-8");
        return;
    }
};

async function tmp_zip_generate_id() {
    let id_str = consts.utils_number_random().toString();

    while (zip_requests[id_str]) {
        id_str = consts.utils_number_random().toString();
        while (await consts.fs_exists(`${consts.tmp_zip_path}/${id_str}.zip`)) {
            id_str = consts.utils_number_random().toString();
        }
    }

    zip_requests[id_str] = {
        passed: null,
        canceled: null,
        started: false,
        progress: "0%",
        error_msg: "",
        link_paths: null
    };

    return id_str;
};

function get_target_path(photo_id, folder = undefined) {
    // is relative to link_path, not cwd
    return `../../../photos/${folder ? folder + "/" : ""}${photo_id}.jpg`;
};

function get_link_path(zip_id, photo_idx, related_name = undefined) {
    let photo_name = `${consts.parse_str_pad(photo_idx + 1, "0", 4)}`;
    if (related_name) {
        photo_name += `${related_name}`;
    }
    return `${consts.tmp_img_path}/${zip_id}/${photo_name}.jpg`;
};

async function tmp_zip_generate(zip_id, photos_arr, add_related, ip_address) {
    zip_requests[zip_id].started = true;

    const zip_path = `${consts.tmp_zip_path}/${zip_id}.zip`;
    const zip_list_path = `${consts.tmp_txt_path}/zip_${zip_id}.txt`;
    const zip_link_dir_path = `${consts.tmp_img_path}/${zip_id}`;

    if (!await consts.fs_exists(zip_link_dir_path)) {
        file_sys.folder.create(zip_link_dir_path); // sync at the moment...
    }

    if (!await consts.fs_exists(consts.tmp_txt_path)) {
        file_sys.folder.create(consts.tmp_txt_path); // sync at the moment...
    }

    if (!await consts.fs_exists(consts.tmp_zip_path)) {
        file_sys.folder.create(consts.tmp_zip_path); // sync at the moment...
    }

    try {
        // we hard limit the amount of photos to conserve memory and cpu usage on the shared server
        let photo_count = photos_arr.length;
        if (add_related) {
            for (const photo_id of photos_arr) {
                if (meta.has_photo_opposite(photo_id)) {
                    photo_count += 1;
                }
                if (meta.has_photo_overlay(photo_id)) {
                    photo_count += 1;
                }
                if (meta.has_photo_alternate(photo_id)) {
                    photo_count += 1;
                }
                if (meta.has_photo_original(photo_id)) {
                    photo_count += 1;
                }
            }
        }
        const max_zip_count = 1000;
        if (photo_count > max_zip_count) {
            throw new Error(`
                I'm sorry, but we can only zip upto ${max_zip_count}
                photos at a time. Try the filter to narrow some photos down!
                Related photos count too, if you're using that option.
            `);
        }

        // we generate symlinks and zip those, so that we can rename the photos efficiently
        zip_requests[zip_id].link_paths = [];
        for (const [photo_idx, photo_id] of photos_arr.entries()) {
            if (zip_requests[zip_id].canceled === true) {
                zip_requests[zip_id].passed = false;
                zip_ip_tracker.sub(ip_address);
                await tmp_zip_delete(zip_id);
                return;
            }

            // verifies that photo_id exists
            if (!meta.has_photo_id(photo_id)) {
                throw new Error(`photo_id '${photo_id}' does not exist`);
            }

            // default
            const target_path = get_target_path(photo_id);
            const link_path = get_link_path(zip_id, photo_idx);
            if (!await consts.make_link(target_path, link_path)) {
                throw new Error("problem generating zip file links, bailing.");
            }
            zip_requests[zip_id].link_paths.push(link_path);
            await consts.delay(12);

            if (add_related) {
                // opposite
                if (meta.has_photo_opposite(photo_id)) {
                    const target_path = get_target_path(photo_id, "opposites");
                    const link_path = get_link_path(zip_id, photo_idx, "_opposite");
                    if (!await consts.make_link(target_path, link_path)) {
                        throw new Error("problem generating zip file links, bailing.");
                    }
                    zip_requests[zip_id].link_paths.push(link_path);
                    await consts.delay(12);
                }
                // overlay
                if (meta.has_photo_overlay(photo_id)) {
                    const target_path = get_target_path(photo_id, "overlays");
                    const link_path = get_link_path(zip_id, photo_idx, "_overlay");
                    if (!await consts.make_link(target_path, link_path)) {
                        throw new Error("problem generating zip file links, bailing.");
                    }
                    zip_requests[zip_id].link_paths.push(link_path);
                    await consts.delay(12);
                }
                // alternate
                if (meta.has_photo_alternate(photo_id)) {
                    const target_path = get_target_path(photo_id, "alternates");
                    const link_path = get_link_path(zip_id, photo_idx, "_alternate");
                    if (!await consts.make_link(target_path, link_path)) {
                        throw new Error("problem generating zip file links, bailing.");
                    }
                    zip_requests[zip_id].link_paths.push(link_path);
                    await consts.delay(12);
                }
                // original
                if (meta.has_photo_original(photo_id)) {
                    const target_path = get_target_path(photo_id, "originals");
                    const link_path = get_link_path(zip_id, photo_idx, "_original");
                    if (!await consts.make_link(target_path, link_path)) {
                        throw new Error("problem generating zip file links, bailing.");
                    }
                    zip_requests[zip_id].link_paths.push(link_path);
                    await consts.delay(12);
                }
            }

            zip_requests[zip_id].progress = parseInt(100 * (photo_idx + 1) / photo_count).toString() + "%";
        }
        zip_requests[zip_id].progress = "Finalizing...";

        // write zip list file, so we can avoid stdin's buffer limits
        await new Promise(async function (res, rej) {
            const did_write = await new Promise(function (res) {
                fs.writeFile(zip_list_path, zip_requests[zip_id].link_paths.join("\n"), "utf8", function (err) {
                    if (err) {
                        consts.logger.log("Failed to write zip list file.", null, err.stack);
                        res(false);
                    } else {
                        res(true);
                    }
                });
            });
            if (did_write) {
                res();
            } else {
                rej("error writing to zip list file");
            }
        }).catch(err => {
            throw new Error(err);
        });

        // we need specific commands depending on the os
        let command_zip;
        if (consts.is_linux) {
            command_zip = `cat "${zip_list_path}" | zip -j -q -0 -@ "${zip_path}"`;
        } else if (consts.is_windows) {
            command_zip = `7z a -mx0 "${zip_path}" @"${zip_list_path}"`;
        } else {
            throw new Error("unsupported operating system.");
        }

        // zip the file
        await new Promise(function (res, rej) {
            child_process.exec(command_zip, (err, stdout, stderr) => {
                err ? rej([err, stdout, stderr]) : res();
            });
        }).catch(function ([err, stdout, stderr]) {
            consts.logger.log("Failed to generate zip file.", stdout, err.stack);
            throw new Error("problem generating zip file, bailing.");
        });

        if (zip_requests[zip_id].canceled === true) {
            zip_requests[zip_id].passed = false;
            zip_ip_tracker.sub(ip_address);
            await tmp_zip_delete(zip_id);
            return;
        }

        // success!
        zip_requests[zip_id].passed = true;
        zip_requests[zip_id].progress = "Succeeded!";
        zip_ip_tracker.sub(ip_address);
    } catch (error) {
        // failure...
        zip_requests[zip_id].passed = false;
        zip_requests[zip_id].progress = "Failed!";
        zip_requests[zip_id].error_msg = error.message;
        zip_ip_tracker.sub(ip_address);
    }
};

async function tmp_zip_delete(zip_id) {
    let results = true;
    const zip_path = `${consts.tmp_zip_path}/${zip_id}.zip`;
    const zip_list_path = `${consts.tmp_txt_path}/zip_${zip_id}.txt`;
    const zip_link_dir_path = `${consts.tmp_img_path}/${zip_id}`;
    const zip_link_paths = zip_requests[zip_id].link_paths;

    delete zip_requests[zip_id];

    if (!await consts.fs_unlink(zip_path)) {
        results = false;
    }

    if (!await consts.fs_unlink(zip_list_path)) {
        results = false;
    }

    if (zip_link_paths) {
        for (const link_path of zip_link_paths) {
            if (!await consts.fs_unlink(link_path)) {
                results = false;
            }
        }
    }

    if (!await consts.fs_rmdir(zip_link_dir_path)) {
        results = false;
    }

    return results;
};

/* exports */
module.exports = process_tmp_zip;
