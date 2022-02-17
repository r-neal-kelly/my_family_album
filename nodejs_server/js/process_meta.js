// Copyright Neal Raulerson 2019. All Rights Reserved.

"use strict";

/* requires */
const consts = require("./consts.js");
const Sessions = require("./Sessions.js");
const meta = require("./meta.js");

/* constants */
const ADD_USER_ID = 101;
const ADD_REQ_RES = 102;

// [func, return_name, add_param = undefined, type_exclusions = [], should_renew = false]
const jumps_get = {
    "get_album_ids_and_names_by_user_id":
        [meta.get_album_ids_and_names_by_user_id, "album_ids_and_names"],
    "get_album_photos":
        [meta.get_album_photos, "album_photos"],
    "get_album_photo_random":
        [meta.get_album_photo_random, "photo_id"],
    "get_photo_album_ids_and_names":
        [meta.get_photo_album_ids_and_names, "photo_album_ids_and_names"],
    "get_photo_comment":
        [meta.get_photo_comment_async, "photo_comment"],
    "get_photo_flags_arr":
        [meta.get_photo_flags_arr, "photo_flags_arr"],
    "get_photo_ids":
        [meta.get_photo_ids, "photo_ids"],
    "get_photo_tag_ids_and_names_and_fonts":
        [meta.get_photo_tag_ids_and_names_and_fonts, "photo_tag_ids_and_names_and_fonts"],
    "get_photo_tag_names":
        [meta.get_photo_tag_names, "photo_tag_names"],
    "get_stats":
        [meta.get_stats, "stats"],
    "get_tag_font":
        [meta.get_tag_font, "tag_font"],
    "get_tag_id":
        [meta.get_tag_id, "tag_id"],
    "get_tag_ids_and_names":
        [meta.get_tag_ids_and_names, "tag_ids_and_names"],
    "get_tag_ids_and_names_and_fonts":
        [meta.get_tag_ids_and_names_and_fonts, "tag_ids_and_names_and_fonts"],
    "get_tag_photos":
        [meta.get_tag_photos, "tag_photos"],
    "get_tag_possibles":
        [meta.get_tag_possibles, "tag_possibles"],
    "get_user_favorites_id":
        [meta.get_user_favorites_id, "user_favorites_id", ADD_USER_ID],
    "get_user_name":
        [meta.get_user_name, "user_name", ADD_USER_ID],
    "get_user_type":
        [meta.get_user_type, "user_type", ADD_USER_ID],
    "get_user_variables":
        [meta.get_user_variables, "user_variables", ADD_USER_ID],
    "has_photo_alternate":
        [meta.has_photo_alternate, "bool"],
    "has_photo_comment":
        [meta.has_photo_comment, "bool"],
    "has_photo_opposite":
        [meta.has_photo_opposite, "bool"],
    "has_photo_original":
        [meta.has_photo_original, "bool"],
    "has_photo_overlay":
        [meta.has_photo_overlay, "bool"],
    "has_photo_tag_id":
        [meta.has_photo_tag_id, "bool"],
    "is_photo_physical":
        [meta.is_photo_physical, "bool"],
    "is_photo_digital":
        [meta.is_photo_digital, "bool"],
    "is_user_logged_in":
        [meta_is_user_logged_in, "bool", ADD_REQ_RES],
    "is_valid":
        [meta.is_valid, "results", ADD_USER_ID, ["user"], true],
};

// [func, return_name = undefined, type_exclusions = [], should_renew = true]
const jumps_put = {
    "add_album":
        [meta.add_album, "album_id", ["user", "modder"]],
    "add_gallery_photos_tag_name":
        [meta.add_gallery_photos_tag_name, null, ["user"]],
    "add_photo_tag_name":
        [meta.add_photo_tag_name, null, ["user"]],
    "add_user_favorite":
        [meta.add_user_favorite],
    "backup":
        [meta.backup, "results", ["user", "modder"]],
    "del_gallery_photos_tag_name":
        [meta.del_gallery_photos_tag_name, null, ["user"]],
    "del_photo_tag_name":
        [meta.del_photo_tag_name, null, ["user"]],
    "del_tags_unused":
        [meta.del_tags_unused, "del_tag_names", ["user"]],
    "del_user_favorite":
        [meta.del_user_favorite],
    "set_photo_comment":
        [meta.set_photo_comment, null, ["user"]],
    "set_user_variable":
        [meta.set_user_variable],
    "unset_photo_comment":
        [meta.unset_photo_comment, null, ["user"]],
    "unset_user_variable":
        [meta.unset_user_variable],
};

function get_jump(jumps, pathname) {
    const pths = pathname.replace("/meta/", "").split("/").map(decodeURIComponent);
    const jump = jumps[pths[0]];
    if (!jump) {
        return {};
    }
    const args = pths.slice(1);
    return { jump, args };
};

async function meta_is_user_logged_in(req, res) {
    const [bool] = await consts.authenticate(req, res);
    return bool;
};

async function process_get(req, res, pathname) {
    const { jump, args } = await get_jump(jumps_get, pathname);
    if (!jump) {
        const error = "Internal server failure.";
        return consts.write_500(res, JSON.stringify({ error }), "application/json");
    }
    if (!jump.length) {
        const error = "Not a valid meta function.";
        return consts.write_403(res, JSON.stringify({ error }), "application/json");
    }
    try {
        const [func, rtrn_name, add_param] = jump;
        const data = {};
        if (add_param === ADD_USER_ID) {
            const [, , , type_exclusions = [], should_renew = false] = jump;
            const [passed, user_id_or_error] = await consts.authenticate(req, res, type_exclusions, should_renew);
            if (!passed) {
                data.error = user_id_or_error;
                return consts.write_401(res, JSON.stringify(data), "application/json");
            } else {
                const user_id = user_id_or_error;
                data[rtrn_name] = await func.apply(null, [user_id].concat(args));
            }
        } else if (add_param === ADD_REQ_RES) {
            data[rtrn_name] = await func.apply(null, [req, res].concat(args));
        } else {
            data[rtrn_name] = await func.apply(null, args);
        }
        return consts.write_200(res, JSON.stringify(data), "application/json");
    } catch (err) {
        const error = err.message;
        console.log(err);
        return consts.write_400(res, JSON.stringify({ error }), "application/json");
    }
};

async function process_put(req, res, pathname) {
    const { jump } = await get_jump(jumps_put, pathname);
    if (!jump) {
        const error = "Internal server failure.";
        return consts.write_500(res, JSON.stringify({ error }), "application/json");
    }
    if (!jump.length) {
        const error = "Not a valid meta function.";
        return consts.write_403(res, JSON.stringify({ error }), "application/json");
    }
    try {
        let data = await consts.get_req_data(req);
        if (data === null) {
            return consts.write_413(res, "{}", "application/json");
        } else if (!data) {
            const error = "PUT request must have a payload.";
            return consts.write_403(res, JSON.stringify({ error }), "application/json");
        } else {
            data = JSON.parse(data);
        }
        const args = data.args;
        if (!args) {
            const error = "PUT request must have a valid args array.";
            return consts.write_403(res, JSON.stringify({ error }), "application/json");
        }
        const [func, return_name = undefined, type_exclusions = [], should_renew = true] = jump;
        const return_data = {};
        const [passed, user_id_or_error] = await consts.authenticate(req, res, type_exclusions, should_renew);
        if (!passed) {
            return_data.error = user_id_or_error;
            return consts.write_401(res, JSON.stringify(return_data), "application/json");
        } else {
            const user_id = user_id_or_error;
            if (return_name) {
                return_data[return_name] = await func.apply(null, [user_id].concat(args));
            } else {
                await func.apply(null, [user_id].concat(args));
            }
            meta.save();
        }
        return consts.write_200(res, JSON.stringify(return_data), "application/json");
    } catch (err) {
        const error = err.message;
        return consts.write_400(res, JSON.stringify({ error }), "application/json");
    }
};

/* process */
async function process_meta(req, res, pathname) {
    if (req.method === "GET") {
        process_get(req, res, pathname);
    } else if (req.method === "PUT") {
        process_put(req, res, pathname);
    } else {
        consts.write_501(res);
    }
};

/* exports */
module.exports = process_meta;
