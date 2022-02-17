// Copyright Neal Raulerson 2019. All Rights Reserved.

"use strict";

/* requires */
const consts = require("./consts.js");
const meta = require("./meta.js");
const Filter = require("./Filter.js");

/* consts */
const GALLERY_TYPE_ALBUM = 0;
const GALLERY_TYPE_TAG = 1;
const GALLERY_TYPE_FILTER = 2;

/* process */
async function process_link(req, res, pathname) {
    if (req.method === "POST") {
        let data = await consts.get_req_data(req);
        if (data === null) {
            return consts.write_413(res);
        } else if (data) {
            data = JSON.parse(data);
        } else {
            data = null;
        }
        if (!data || !data.link_obj) {
            return consts.write_403(res);
        }
        const link_info = await get_link_info(data.link_obj);
        return consts.write_201(res, JSON.stringify({ link_info }), "application/json");
    } else {
        return consts.write_501(res);
    }
};

/* handler */
async function get_link_info(link_obj) {
    let type_num = link_obj.hasOwnProperty("t") ? parseInt(link_obj.t) : undefined;
    let gallery_id = link_obj.hasOwnProperty("g") ? link_obj.g.trim() : undefined;
    let photo_id = link_obj.hasOwnProperty("p") ? link_obj.p.trim() : undefined;

    if (!meta.has_photo_id(photo_id)) {
        if (photo_id) {
            const sliced_photo_id = photo_id.slice(0, 6);
            if (meta.has_photo_id(sliced_photo_id)) {
                photo_id = sliced_photo_id;
            } else {
                photo_id = undefined;
            }
        }
    }

    if (gallery_id === undefined && photo_id === undefined) {
        return undefined;
    }

    if (gallery_id === undefined) {
        type_num = GALLERY_TYPE_FILTER;
    } else {
        if (
            (type_num === undefined || type_num === null) ||
            (type_num === GALLERY_TYPE_ALBUM && !meta.has_album_id(gallery_id)) ||
            (type_num === GALLERY_TYPE_TAG && !meta.has_tag_id(gallery_id))
        ) {
            if (meta.has_album_id(gallery_id)) {
                type_num = GALLERY_TYPE_ALBUM;
            } else if (meta.has_tag_id(gallery_id)) {
                type_num = GALLERY_TYPE_TAG;
            } else if (meta.has_legacy_album_name(gallery_id)) {
                type_num = GALLERY_TYPE_ALBUM;
                gallery_id = meta.get_legacy_album_id(gallery_id);
            } else if (meta.has_tag_name(gallery_id)) {
                type_num = GALLERY_TYPE_TAG;
                gallery_id = meta.get_tag_id(gallery_id);
            } else {
                type_num = GALLERY_TYPE_FILTER;
            }
        }
    }

    const info_obj = {
        gallery_type_num: undefined,
        gallery_id: undefined,
        gallery_title_str: undefined,
        gallery_photos_arr: undefined,
        gallery_photo_idx: undefined
    };

    if (type_num === GALLERY_TYPE_ALBUM) {
        info_obj.gallery_type_num = GALLERY_TYPE_ALBUM;
        info_obj.gallery_id = gallery_id;
        info_obj.gallery_title_str = meta.get_album_name(gallery_id);
        info_obj.gallery_photos_arr = meta.get_album_photos(gallery_id);
    } else if (type_num === GALLERY_TYPE_TAG) {
        info_obj.gallery_type_num = GALLERY_TYPE_TAG;
        info_obj.gallery_id = gallery_id;
        info_obj.gallery_title_str = meta.get_tag_name(gallery_id);
        info_obj.gallery_photos_arr = meta.get_tag_photos(gallery_id);
    } else /* type_num === GALLERY_TYPE_FILTER */ {
        try {
            const expression = gallery_id ? gallery_id : "";
            const results = Filter(expression).execute();
            info_obj.gallery_type_num = GALLERY_TYPE_FILTER;
            info_obj.gallery_id = expression;
            info_obj.gallery_title_str = results.expression;
            info_obj.gallery_photos_arr = results.matches;
        } catch (err) {
            info_obj.gallery_type_num = GALLERY_TYPE_FILTER;
            info_obj.gallery_id = "";
            info_obj.gallery_title_str = "All Pictures";
            info_obj.gallery_photos_arr = meta.get_photo_ids();
        }
    }

    info_obj.gallery_photo_idx = info_obj.gallery_photos_arr.indexOf(photo_id);

    return info_obj;
};

/* exports */
module.exports = process_link;
