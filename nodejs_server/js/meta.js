// Copyright Neal Raulerson 2019. All Rights Reserved.

"use strict";

/* requires */
const fs = require("fs");
const child_process = require("child_process");

const consts = require("./consts.js");
const Queue = require("./Queue.js");

/* consts */
const albums_json_path = "./json/albums.json";
const photos_json_path = "./json/photos.json";
const tags_json_path = "./json/tags.json";
const users_json_path = "./json/users.json";
const albums_obj = JSON.parse(fs.readFileSync(albums_json_path, "utf8"));
const photos_obj = JSON.parse(fs.readFileSync(photos_json_path, "utf8"));
const tags_obj = JSON.parse(fs.readFileSync(tags_json_path, "utf8"));
const users_obj = JSON.parse(fs.readFileSync(users_json_path, "utf8"));

const TAG_HAS_COMMENT = "GvCFNj";
const TAG_HAS_OPPOSITE = "ybfuLH";
const TAG_HAS_OVERLAY = "z97rnv";
const TAG_HAS_ALTERNATE = "TVcuHh";
const TAG_HAS_ORIGINAL = "idISgJ";
const TAG_IS_DIGITAL = "w8HO1w";
const TAG_IS_PHYSICAL = "2faocc";

const LEGACY_ALBUMS = {
    "1972-1973 (The Powells)": "IxBQTq",
    "Vacation June 1973 (The Powells)": "g1gvVQ",
    "46th Anniversary (The Hendersons)": "WlVzJu",
    "Our Family Album (The Powells)": "FKMjhC",
    "Fishing and Stuff (The Powells)": "58yFvS",
    "Maw Maw's Stash (The Hendersons)": "HdK1Bi",
    "The Good Ole Spots and Stripes (The Raulersons)": "YwNbar",
    "The Powell Henderson Family Album": "ZZ9SOc",
    "Karen's Cache (The Powells)": "PfdgPH"
};

const meta = {};

/* albums_obj */
meta.has_album_id = function (album_id) {
    return albums_obj.hasOwnProperty(album_id);
};
meta.has_legacy_album_name = function (album_name) {
    return LEGACY_ALBUMS.hasOwnProperty(album_name);
};
meta.get_album_photo_random = function (album_id) {
    const album_obj = albums_obj[album_id];
    if (!album_obj) {
        throw new Error("must be a valid album_id");
    }
    const photo_idx = consts.utils_number_random(0, album_obj.photos.length - 1);
    return album_obj.photos[photo_idx];
};
meta.get_album_ids = function () {
    const album_ids = Object.keys(albums_obj);
    return album_ids;
};
meta.get_album_names = function () {
    const album_names = Object.values(albums_obj)
        .map(obj => obj.name)
        .sort();
    return album_names;
};
meta.get_album_names_by_user_id = function (user_id) {
    const album_names = [];
    for (const album_obj of Object.values(albums_obj)) {
        if (album_obj.user_id === user_id) {
            if (album_obj.name !== "Favorites") {
                album_names.push(album_obj.name);
            }
        }
    }
    return album_names;
};
meta.get_album_ids_and_names = function () {
    const album_ids_and_names = [];
    for (const album_id of meta.get_album_ids()) {
        const album_name = albums_obj[album_id].name;
        album_ids_and_names.push([album_id, album_name]);
    }
    album_ids_and_names.sort(function ([, a], [, b]) {
        if (a < b) {
            return -1;
        } else if (a > b) {
            return 1;
        } else {
            return 0;
        }
    });
    return album_ids_and_names;
};
meta.get_album_ids_and_names_by_user_id = function (user_id) {
    const album_ids_and_names = [];
    for (const album_id of meta.get_album_ids()) {
        if (albums_obj[album_id].user_id === user_id) {
            const album_name = albums_obj[album_id].name;
            if (album_name !== "Favorites") {
                album_ids_and_names.push([album_id, album_name]);
            }
        }
    }
    album_ids_and_names.sort(function ([, a], [, b]) {
        if (a < b) {
            return -1;
        } else if (a > b) {
            return 1;
        } else {
            return 0;
        }
    });
    return album_ids_and_names;
};
meta.get_legacy_album_id = function (album_name) {
    const album_id = LEGACY_ALBUMS[album_name];
    return album_id ? album_id : undefined;
};
meta.get_album_name = function (album_id) {
    const album_obj = albums_obj[album_id];
    return album_obj ? album_obj.name : undefined;
};
meta.get_album_photos = function (album_id) {
    const album_obj = albums_obj[album_id];
    return album_obj ? Array.from(album_obj.photos) : undefined;
};
meta.set_album_name = function (album_id, album_name) {
    const album_obj = albums_obj[album_id];
    if (!album_obj) {
        throw new Error("must be a valid album_id");
    }
    album_obj.name = album_name.trim().replace(/\s+/g, " ");
};
meta.add_album_photo_id = function (album_id, photo_id) {
    // validate
    const album_obj = albums_obj[album_id];
    if (!album_obj) {
        throw new Error("must be a valid album_id");
    }
    const photo_obj = photos_obj[photo_id];
    if (!photo_obj) {
        throw new Error("must be a valid photo_id");
    }

    // add to album_obj
    if (!album_obj.photos.includes(photo_id)) {
        album_obj.photos.push(photo_id);
    }

    // add to photo obj
    if (!photo_obj.albums.includes(album_id)) {
        photo_obj.albums.push(album_id);
        photo_obj.albums.sort();
    }
};
meta.del_album_photo_id = function (album_id, photo_id) {
    // validate
    const album_obj = albums_obj[album_id];
    if (!album_obj) {
        throw new Error("must be a valid album_id");
    }
    const photo_obj = photos_obj[photo_id];
    if (!photo_obj) {
        throw new Error("must be a valid photo_id");
    }

    // del from album_obj
    const photo_idx = album_obj.photos.findIndex(id => id === photo_id);
    if (photo_idx !== -1) {
        album_obj.photos.splice(photo_idx, 1);
    }

    // del from photo_obj
    const album_idx = photo_obj.albums.findIndex(id => id === album_id);
    if (album_idx !== -1) {
        photo_obj.albums.splice(album_idx, 1);
    }
};
meta.add_album = function (user_id, album_name = "New Album") {
    if (!users_obj[user_id]) {
        throw new Error("invalid user_id");
    }
    album_name = album_name.trim().replace(/ +/g, " ");
    const album_id = meta.get_unique_id();
    albums_obj[album_id] = {
        name: album_name,
        user_id: user_id,
        photos: [],
        added: Date.now()
    };
    return album_id;
};
meta.add_album_photo = function (user_id, album_id, photo_type) {
    if (!users_obj[user_id]) {
        throw new Error("invalid user_id");
    }
    const album_obj = albums_obj[album_id];
    if (!album_obj) {
        throw new Error("invalid album_id");
    }
    let type_tag;
    if (photo_type.match(/digital/i)) {
        type_tag = TAG_IS_DIGITAL;
    } else if (photo_type.match(/physical/i)) {
        type_tag = TAG_IS_PHYSICAL;
    } else {
        throw new Error("invalid photo_type");
    }

    const photo_id = meta.get_unique_id();
    photos_obj[photo_id] = {};
    photos_obj[photo_id].albums = [];
    photos_obj[photo_id].tags = [];
    photos_obj[photo_id].added = Date.now();
    photos_obj[photo_id].user_id = user_id;

    meta.add_album_photo_id(album_id, photo_id);
    meta.add_tag_photo_id(type_tag, photo_id);

    return photo_id;
};

/* photos_obj */
meta.is_photo_physical = function (photo_id) {
    const photo_obj = photos_obj[photo_id];
    if (!photo_id) {
        throw new Error("must be a valid photo_id");
    }
    return photo_obj.tags.includes(TAG_IS_PHYSICAL);
};
meta.is_photo_digital = function (photo_id) {
    const photo_obj = photos_obj[photo_id];
    if (!photo_id) {
        throw new Error("must be a valid photo_id");
    }
    return photo_obj.tags.includes(TAG_IS_DIGITAL);
};
meta.has_photo_opposite = function (photo_id) {
    const photo_obj = photos_obj[photo_id];
    if (!photo_id) {
        throw new Error("must be a valid photo_id");
    }
    return photo_obj.tags.includes(TAG_HAS_OPPOSITE);
};
meta.has_photo_overlay = function (photo_id) {
    const photo_obj = photos_obj[photo_id];
    if (!photo_id) {
        throw new Error("must be a valid photo_id");
    }
    return photo_obj.tags.includes(TAG_HAS_OVERLAY);
};
meta.has_photo_alternate = function (photo_id) {
    const photo_obj = photos_obj[photo_id];
    if (!photo_id) {
        throw new Error("must be a valid photo_id");
    }
    return photo_obj.tags.includes(TAG_HAS_ALTERNATE);
};
meta.has_photo_original = function (photo_id) {
    const photo_obj = photos_obj[photo_id];
    if (!photo_id) {
        throw new Error("must be a valid photo_id");
    }
    return photo_obj.tags.includes(TAG_HAS_ORIGINAL);
};
meta.has_photo_comment = function (photo_id) {
    const photo_obj = photos_obj[photo_id];
    if (!photo_id) {
        throw new Error("must be a valid photo_id");
    }
    return photo_obj.tags.includes(TAG_HAS_COMMENT);
};
meta.has_photo_id = function (photo_id) {
    return photos_obj.hasOwnProperty(photo_id);
};
meta.has_photo_tag_id = function (photo_id, tag_id) {
    const photo_obj = photos_obj[photo_id];
    return photo_obj ? photo_obj.tags.includes(tag_id) : undefined;
};
meta.get_photo_ids = function () {
    const photo_ids = Object.keys(photos_obj);
    return photo_ids;
};
meta.get_photo_album_names = function (photo_id) {
    const photo_obj = photos_obj[photo_id];
    if (!photo_obj) {
        return undefined;
    }
    const album_names = photo_obj.albums.map(album_id => {
        return albums_obj[album_id].name;
    }).sort();
    return album_names;
};
meta.get_photo_album_ids_and_names = async function (photo_id) {
    const photo_obj = photos_obj[photo_id];
    if (!photo_obj) {
        return undefined;
    }
    const album_ids_and_names = [];
    for (const album_id of photo_obj.albums) {
        const album_name = albums_obj[album_id].name;
        album_ids_and_names.push([album_id, album_name]);
    }
    album_ids_and_names.sort(function ([, a], [, b]) {
        if (a < b) {
            return -1;
        } else if (a > b) {
            return 1;
        } else {
            return 0;
        }
    });
    return album_ids_and_names;
};
meta.get_photo_tag_ids = function (photo_id) {
    const photo_obj = photos_obj[photo_id];
    return photo_obj ? Array.from(photo_obj.tags) : undefined;
};
meta.get_photo_tag_names = function (photo_id) {
    const photo_obj = photos_obj[photo_id];
    if (!photo_obj) {
        return undefined;
    }
    const tag_names = photo_obj.tags.map(tag_id => {
        return tags_obj[tag_id].name;
    }).sort();
    return tag_names;
};
meta.get_photo_tag_ids_and_names = function (photo_id) {
    const photo_obj = photos_obj[photo_id];
    if (!photo_obj) {
        return undefined;
    }
    const tag_ids_and_names = [];
    for (const tag_id of photo_obj.tags) {
        const tag_name = tags_obj[tag_id].name;
        tag_ids_and_names.push([tag_id, tag_name]);
    }
    tag_ids_and_names.sort(function ([, a], [, b]) {
        if (a < b) {
            return -1;
        } else if (a > b) {
            return 1;
        } else {
            return 0;
        }
    });
    return tag_ids_and_names;
};
meta.get_photo_tag_ids_and_names_and_fonts = async function (photo_id) {
    const photo_obj = photos_obj[photo_id];
    if (!photo_obj) {
        return undefined;
    }
    const photo_tag_ids_and_names_and_fonts = [];
    for (const [tag_id, tag_obj] of photo_obj.tags.map(tag_id => [tag_id, tags_obj[tag_id]])) {
        const arr = [tag_id, tag_obj.name];
        if (tag_obj.font) {
            arr.push(Object.assign({}, tag_obj.font));
        }
        photo_tag_ids_and_names_and_fonts.push(arr);
    }
    photo_tag_ids_and_names_and_fonts.sort(function ([, a], [, b]) {
        if (a < b) {
            return -1;
        } else if (a > b) {
            return 1;
        } else {
            return 0;
        }
    });
    return photo_tag_ids_and_names_and_fonts;
};
meta.get_photo_comment = function (photo_id) {
    const photo_obj = photos_obj[photo_id];
    if (!photo_obj) {
        return undefined;
    }
    return photo_obj.comment;
};
meta.get_photo_comment_async = async function (photo_id) {
    const photo_obj = photos_obj[photo_id];
    if (!photo_obj) {
        return undefined;
    }
    return photo_obj.comment;
};
meta.get_photo_flags_arr = async function (photo_id) {
    const photo_obj = photos_obj[photo_id];
    if (!photo_id) {
        throw new Error("must be a valid photo_id");
    }
    return [
        photo_obj.tags.includes(TAG_IS_DIGITAL) ? 1 : 0,
        photo_obj.tags.includes(TAG_IS_PHYSICAL) ? 1 : 0,
        photo_obj.tags.includes(TAG_HAS_OPPOSITE) ? 1 : 0,
        photo_obj.tags.includes(TAG_HAS_OVERLAY) ? 1 : 0,
        photo_obj.tags.includes(TAG_HAS_ALTERNATE) ? 1 : 0,
        photo_obj.tags.includes(TAG_HAS_ORIGINAL) ? 1 : 0,
        photo_obj.tags.includes(TAG_HAS_COMMENT) ? 1 : 0
    ];
};
meta.set_photo_comment = function (user_id, photo_id, comment) {
    const photo_obj = photos_obj[photo_id];
    if (!photo_obj) {
        throw new Error("must be a valid photo_id");
    }
    comment = comment.trim().replace(/ +/g, " ");
    if (comment === "") {
        meta.unset_photo_comment(user_id, photo_id);
    } else {
        photo_obj.comment = comment;
        meta.add_photo_tag_id(photo_id, TAG_HAS_COMMENT);
    }
};
meta.unset_photo_comment = function (user_id, photo_id) {
    const photo_obj = photos_obj[photo_id];
    if (!photo_obj) {
        throw new Error("must be a valid photo_id");
    }
    delete photo_obj.comment;
    meta.del_photo_tag_id(photo_id, TAG_HAS_COMMENT);
};
meta.add_photo_tag_id = function (photo_id, tag_id) {
    // validate
    const photo_obj = photos_obj[photo_id];
    if (!photo_obj) {
        throw new Error("must be a valid photo_id");
    }
    const tag_obj = tags_obj[tag_id];
    if (!tag_obj) {
        throw new Error("must be a valid tag_id");
    }

    // add to photo obj
    if (!photo_obj.tags.includes(tag_id)) {
        photo_obj.tags.push(tag_id);
        photo_obj.tags.sort(); // meta.sort_tags
    }

    // add to tags_obj
    if (!tag_obj.photos.includes(photo_id)) {
        tag_obj.photos.push(photo_id);
        meta.sort_photos(tag_obj.photos);
    }
};
meta.del_photo_tag_id = function (photo_id, tag_id) {
    // validate
    const photo_obj = photos_obj[photo_id];
    if (!photo_obj) {
        throw new Error("must be a valid photo_id");
    }
    const tag_obj = tags_obj[tag_id];
    if (!tag_obj) {
        throw new Error("must be a valid tag_id");
    }

    // del from photo_obj
    const tag_idx = photo_obj.tags.findIndex(id => id === tag_id);
    if (tag_idx !== -1) {
        photo_obj.tags.splice(tag_idx, 1);
    }

    // del from tags_obj
    const photo_idx = tag_obj.photos.findIndex(id => id === photo_id);
    if (photo_idx !== -1) {
        tag_obj.photos.splice(photo_idx, 1);
    }
};
meta.add_photo_tag_name = function (user_id, photo_id, tag_name) {
    tag_name = tag_name.trim().replace(/\s+/g, " ");
    if (!/\S/.test(tag_name)) {
        throw new Error("must have a tag_name");
    }

    let tag_id;
    if (!meta.has_tag_name(tag_name)) {
        tag_id = meta.add_tag(tag_name, user_id);
    } else {
        tag_id = meta.get_tag_id(tag_name);
    }

    meta.add_photo_tag_id(photo_id, tag_id);
};
meta.del_photo_tag_name = function (user_id, photo_id, tag_name) {
    tag_name = tag_name.trim().replace(/\s+/g, " ");
    if (!/\S/.test(tag_name)) {
        throw new Error("must have a tag_name");
    }

    const tag_id = meta.get_tag_id(tag_name);
    if (tag_id) {
        meta.del_photo_tag_id(photo_id, tag_id);
    }
};
meta.del_photo = function (user_id, photo_id) {
    if (!users_obj[user_id]) {
        throw new Error("invalid user_id");
    }
    const photo_obj = photos_obj[photo_id];
    if (!photo_obj) {
        throw new Error("invalid photo_id");
    }
    for (const album_id of photo_obj.albums) {
        meta.del_album_photo_id(album_id, photo_id);
    }
    for (const tag_id of photo_obj.tags) {
        meta.del_tag_photo_id(tag_id, photo_id);
    }
    delete photos_obj[photo_id];
};
meta.add_photo_tag_has_opposite = function (user_id, photo_id) {
    meta.add_photo_tag_id(photo_id, TAG_HAS_OPPOSITE);
};
meta.add_photo_tag_has_overlay = function (user_id, photo_id) {
    meta.add_photo_tag_id(photo_id, TAG_HAS_OVERLAY);
};
meta.add_photo_tag_has_alternate = function (user_id, photo_id) {
    meta.add_photo_tag_id(photo_id, TAG_HAS_ALTERNATE);
};
meta.add_photo_tag_has_original = function (user_id, photo_id) {
    meta.add_photo_tag_id(photo_id, TAG_HAS_ORIGINAL);
};

/* tags_obj */
meta.has_tag_id = function (tag_id) {
    return tags_obj.hasOwnProperty(tag_id);
};
meta.has_tag_name = function (tag_name) {
    const results = Object.values(tags_obj).find(tag_obj => {
        return tag_obj.name === tag_name;
    });
    return results === undefined ? false : true;
};
meta.get_tag_ids = function () {
    const tag_ids = Object.keys(tags_obj);
    return tag_ids;
};
meta.get_tag_names = function () {
    const tag_names = Object.values(tags_obj)
        .map(obj => obj.name)
        .sort();
    return tag_names;
};
meta.get_tag_ids_and_names = function () {
    const tag_ids_and_names = [];
    for (const tag_id of meta.get_tag_ids()) {
        const tag_name = tags_obj[tag_id].name;
        tag_ids_and_names.push([tag_id, tag_name]);
    }
    tag_ids_and_names.sort(function ([, a], [, b]) {
        if (a < b) {
            return -1;
        } else if (a > b) {
            return 1;
        } else {
            return 0;
        }
    });
    return tag_ids_and_names;
};
meta.get_tag_id = function (tag_name) {
    const results = Object.entries(tags_obj).find(([, tag_obj]) => {
        return tag_obj.name === tag_name;
    });
    return results ? results[0] : undefined;
};
meta.get_tag_name = function (tag_id) {
    const tag_obj = tags_obj[tag_id];
    return tag_obj ? tag_obj.name : undefined;
};
meta.get_tag_photos = function (tag_id) {
    const tag_obj = tags_obj[tag_id];
    return tag_obj ? Array.from(tag_obj.photos) : undefined;
};
meta.get_tag_font = function (tag_id) {
    const tag_obj = tags_obj[tag_id];
    if (!tag_obj || !tag_obj.font) {
        return undefined;
    }
    const font = Object.assign({}, tag_obj.font);
    return font;
};
meta.get_tag_ids_and_names_and_fonts = function () {
    const tag_ids_and_names_and_fonts = [];
    for (const [tag_id, tag_obj] of Object.entries(tags_obj)) {
        const arr = [tag_id, tag_obj.name];
        if (tag_obj.font) {
            arr.push(Object.assign({}, tag_obj.font));
        }
        tag_ids_and_names_and_fonts.push(arr);
    }
    tag_ids_and_names_and_fonts.sort(function ([, a], [, b]) {
        if (a < b) {
            return -1;
        } else if (a > b) {
            return 1;
        } else {
            return 0;
        }
    });
    return tag_ids_and_names_and_fonts;
};
meta.get_tag_possibles = function (tag_partial) {
    tag_partial = tag_partial.trim();
    const tag_possibles = [];
    if (tag_partial) {
        const regex_str = consts.utils_regex_escape(tag_partial).split(/\s+/).join(".*(\\b|\\s)");
        const regex = new RegExp(`\\b${regex_str}`, "i");
        for (let tag_name of meta.get_tag_names()) {
            if ((tag_name.length >= tag_partial.length) && regex.test(tag_name)) {
                tag_possibles.push(tag_name);
            }
        }
    }
    return tag_possibles;
};
meta.set_tag_name = function (tag_id, tag_name) {
    const tag_obj = tags_obj[tag_id];
    if (!tag_obj) {
        return undefined;
    }
    tag_obj.name = tag_name;
    // this is insufficient because we want to merge tags that have the same name...
};
meta.add_tag = function (tag_name = "", user_id) {
    if (!users_obj[user_id]) {
        throw new Error("invalid user_id");
    }
    consts.Filter.static.validate_tag_name(tag_name); // can throw
    const tag_id = meta.get_unique_id();
    tags_obj[tag_id] = {
        name: tag_name,
        user_id: user_id,
        photos: [],
        added: Date.now()
    };
    return tag_id;
};
meta.del_tag = function (user_id, tag_id) {
    if (!users_obj.hasOwnProperty(user_id)) {
        throw new Error("invalid user_id");
    }
    if (!tags_obj.hasOwnProperty(tag_id)) {
        throw new Error("must be a valid tag_id");
    }
    const tag_obj = tags_obj[tag_id];
    const tag_photos = Array.from(tag_obj.photos);
    for (const photo_id of tag_photos) {
        meta.del_tag_photo_id(tag_id, photo_id);
    }
    delete tags_obj[tag_id];
};
meta.add_tag_photo_id = function (tag_id, photo_id) {
    // validate
    const tag_obj = tags_obj[tag_id];
    if (!tag_obj) {
        throw new Error("must be a valid tag_id");
    }
    const photo_obj = photos_obj[photo_id];
    if (!photo_obj) {
        throw new Error("must be a valid photo_id");
    }

    // add to tags_obj
    if (!tag_obj.photos.includes(photo_id)) {
        tag_obj.photos.push(photo_id);
        meta.sort_photos(tag_obj.photos);
    }

    // add to photo obj
    if (!photo_obj.tags.includes(tag_id)) {
        photo_obj.tags.push(tag_id);
        photo_obj.tags.sort(); // meta.sort_tags
    }
};
meta.del_tag_photo_id = function (tag_id, photo_id) {
    // validate
    const tag_obj = tags_obj[tag_id];
    if (!tag_obj) {
        throw new Error("must be a valid tag_id");
    }
    const photo_obj = photos_obj[photo_id];
    if (!photo_obj) {
        throw new Error("must be a valid photo_id");
    }

    // del from tags_obj
    const photo_idx = tag_obj.photos.findIndex(id => id === photo_id);
    if (photo_idx !== -1) {
        tag_obj.photos.splice(photo_idx, 1);
    }

    // del from photo_obj
    const tag_idx = photo_obj.tags.findIndex(id => id === tag_id);
    if (tag_idx !== -1) {
        photo_obj.tags.splice(tag_idx, 1);
    }
};
meta.del_tags_unused = function (user_id) {
    if (!users_obj.hasOwnProperty(user_id)) {
        throw new Error("invalid user_id");
    }
    const del_tag_names = [];
    for (const [tag_id, tag_obj] of Object.entries(tags_obj)) {
        if (tag_obj.photos.length === 0) {
            del_tag_names.push(tag_obj.name);
            meta.del_tag(user_id, tag_id);
        }
    }
    return del_tag_names;
};

/* albums_obj or tags_obj */
meta.add_gallery_photos_tag_name = function (user_id, gallery_id, tag_name) {
    const gallery_obj = albums_obj[gallery_id] || tags_obj[gallery_id];

    let photo_ids;
    if (gallery_obj) {
        photo_ids = gallery_obj.photos;
    } else {
        try {
            photo_ids = consts.Filter(gallery_id).execute().matches;
        } catch (err) {
            throw new Error("invalid gallery_id");
        }
    }

    tag_name = tag_name.trim().replace(/\s+/g, " ");
    if (!/\S/.test(tag_name)) {
        throw new Error("must have a tag_name");
    }

    let tag_id;
    if (!meta.has_tag_name(tag_name)) {
        tag_id = meta.add_tag(tag_name, user_id);
    } else {
        tag_id = meta.get_tag_id(tag_name);
    }

    for (const photo_id of photo_ids) {
        meta.add_photo_tag_id(photo_id, tag_id);
    }
};
meta.del_gallery_photos_tag_name = function (user_id, gallery_id, tag_name) {
    const gallery_obj = albums_obj[gallery_id] || tags_obj[gallery_id];

    let photo_ids;
    if (gallery_obj) {
        photo_ids = gallery_obj.photos;
    } else {
        try {
            photo_ids = consts.Filter(gallery_id).execute().matches;
        } catch (err) {
            throw new Error("invalid gallery_id");
        }
    }

    tag_name = tag_name.trim().replace(/\s+/g, " ");
    if (!/\S/.test(tag_name)) {
        throw new Error("must have a tag_name");
    }

    const tag_id = meta.get_tag_id(tag_name);

    if (tag_id) {
        for (const photo_id of photo_ids) {
            meta.del_photo_tag_id(photo_id, tag_id);
        }
    }
};

/* users_obj */
meta.add_user = function ({ name, type, hash, hash_type, ip_address }) {
    const user_id = meta.get_unique_id();
    users_obj[user_id] = {
        name: name,
        type: type,
        hash: hash,
        hash_type: hash_type,
        ips: [ip_address],
        added: Date.now()
    };
    users_obj[user_id].public = {
        favorites_id: meta.add_album(user_id, "Favorites"), // user_obj must exist, so do this after defining it
        albums: {}
    };
    users_obj[user_id].private = {
        albums: {},
        options: {},
        vars: {}
    };
    return user_id;
};
meta.add_user_ip_address = function (user_id, ip_address) {
    const user_obj = users_obj[user_id];
    if (!user_obj) {
        throw new Error("must be a valid user_id");
    }
    if (!/\d/.test(ip_address)) {
        throw new Error("must have a ip_address");
    }
    if (!user_obj.ips.includes(ip_address)) {
        user_obj.ips.push(ip_address);
    }
};
meta.get_user_id = function (user_name) {
    for (const [user_id, user_obj] of Object.entries(users_obj)) {
        if (user_obj.name === user_name) {
            return user_id;
        }
    }
};
meta.get_user_name = function (user_id) {
    const user_obj = users_obj[user_id];
    if (!user_obj) {
        throw new Error("must be a valid user_id");
    }
    return user_obj.name;
};
meta.get_user_type = function (user_id) {
    const user_obj = users_obj[user_id];
    if (!user_obj) {
        throw new Error("must be a valid user_id");
    }
    return user_obj.type;
};
meta.get_user_hash = function (user_id) {
    const user_obj = users_obj[user_id];
    if (!user_obj) {
        throw new Error("must be a valid user_id");
    }
    return user_obj.hash;
};
meta.get_user_favorites_id = function (user_id) {
    const user_obj = users_obj[user_id];
    if (!user_obj) {
        throw new Error("must be a valid user_id");
    }
    return user_obj.public.favorites_id;
};
meta.get_user_variables = function (user_id) {
    const user_obj = users_obj[user_id];
    if (!user_obj) {
        throw new Error("must be a valid user_id");
    }
    return Object.assign({}, user_obj.private.vars);
};
meta.has_user_id = function (user_id) {
    return users_obj.hasOwnProperty(user_id);
};
meta.has_user_name = function (user_name) {
    return meta.get_user_id(user_name) ? true : false;
};
meta.add_user_favorite = function (user_id, photo_id) {
    const user_obj = users_obj[user_id];
    if (!user_obj) {
        throw new Error("must be a valid user_id");
    }
    if (!meta.has_photo_id(photo_id)) {
        throw new Error("must be a valid photo_id");
    }
    meta.add_album_photo_id(meta.get_user_favorites_id(user_id), photo_id);
};
meta.del_user_favorite = function (user_id, photo_id) {
    const user_obj = users_obj[user_id];
    if (!user_obj) {
        throw new Error("must be a valid user_id");
    }
    if (!meta.has_photo_id(photo_id)) {
        throw new Error("must be a valid photo_id");
    }
    meta.del_album_photo_id(meta.get_user_favorites_id(user_id), photo_id);
};
meta.set_user_variable = function (user_id, variable_name, expression) {
    const user_obj = users_obj[user_id];
    if (!user_obj) {
        throw new Error("must be a valid user_id");
    }
    if (!/\S/.test(variable_name)) {
        throw new Error("must have a variable_name");
    }
    consts.Filter.static.validate_variable_name(variable_name); // can throw
    if (/\S/.test(expression)) {
        consts.Filter.static.validate_expression(expression); // can throw
        expression = expression.trim().replace(/\s+/g, " ");
        expression = "(" + expression + ")";
        user_obj.private.vars[variable_name] = expression;
    } else {
        meta.unset_user_variable(user_id, variable_name);
    }
};
meta.unset_user_variable = function (user_id, variable_name) {
    const user_obj = users_obj[user_id];
    if (!user_obj) {
        throw new Error("must be a valid user_id");
    }
    if (!/\S/.test(variable_name)) {
        throw new Error("must have a variable_name");
    }
    consts.Filter.static.validate_variable_name(variable_name); // can throw
    delete user_obj.private.vars[variable_name];
};

// other
meta.sort_photos = function (photos = []) {
    photos.sort(function (a, b) {
        const a_is_physical = meta.has_photo_tag_id(a, TAG_IS_PHYSICAL);
        const b_is_physical = meta.has_photo_tag_id(b, TAG_IS_PHYSICAL);
        if ((a_is_physical && b_is_physical) || (!a_is_physical && !b_is_physical)) {
            const a_added = photos_obj[a].added;
            const b_added = photos_obj[b].added;
            if (a_added < b_added) {
                return -1;
            } else if (a_added > b_added) {
                return 1;
            } else {
                return 0;
            }
        } else {
            if (a_is_physical) {
                return 1;
            } else {
                return -1;
            }
        }
    });
    return photos;
};

meta.save_albums = async function () {
    consts.fs_writeFile(
        albums_json_path,
        JSON.stringify(albums_obj),
        "utf8"
    );
};

meta.save_photos = async function () {
    consts.fs_writeFile(
        photos_json_path,
        JSON.stringify(photos_obj),
        "utf8"
    );
};

meta.save_tags = async function () {
    consts.fs_writeFile(
        tags_json_path,
        JSON.stringify(tags_obj),
        "utf8"
    );
};

meta.save_users = async function () {
    consts.fs_writeFile(
        users_json_path,
        JSON.stringify(users_obj),
        "utf8"
    );
};

const save_queue = Queue();
meta.save = async function () {
    save_queue.push(async function () {
        await Promise.all([
            meta.save_albums(),
            meta.save_photos(),
            meta.save_tags(),
            meta.save_users()
        ]);
    });
};

meta.get_unique_id = (() => {
    const alpha_nums = [
        "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m",
        "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z",
        "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M",
        "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z",
        "1", "2", "3", "4", "5", "6", "7", "8", "9", "0"
    ];
    const alpha_num_slots = 6;
    const get_random_id = function () {
        let str = "";
        for (let i = 0; i < alpha_num_slots; i += 1) {
            str += alpha_nums[consts.utils_number_random(0, alpha_nums.length - 1)];
        }
        return str;
    };
    return function () {
        let id = get_random_id();
        while (
            photos_obj.hasOwnProperty(id) ||
            albums_obj.hasOwnProperty(id) ||
            tags_obj.hasOwnProperty(id) ||
            users_obj.hasOwnProperty(id)
        ) {
            id = get_random_id();
        }
        return id;
    };
})();

meta.get_stats = function () {
    const stats = {};
    const album_ids = meta.get_album_ids();
    const photo_ids = meta.get_photo_ids();
    const tag_ids = meta.get_tag_ids();

    stats.albums = album_ids.length;
    stats.defaults = photo_ids.length;
    stats.tags = tag_ids.length;
    stats.comments = meta.get_tag_photos(TAG_HAS_COMMENT).length;
    stats.opposites = meta.get_tag_photos(TAG_HAS_OPPOSITE).length;
    stats.overlays = meta.get_tag_photos(TAG_HAS_OVERLAY).length;
    stats.alternates = meta.get_tag_photos(TAG_HAS_ALTERNATE).length;
    stats.originals = meta.get_tag_photos(TAG_HAS_ORIGINAL).length;
    stats.digitals = meta.get_tag_photos(TAG_IS_DIGITAL).length;
    stats.physicals = meta.get_tag_photos(TAG_IS_PHYSICAL).length;
    stats.photos =
        stats.defaults +
        stats.opposites +
        stats.overlays +
        stats.alternates +
        stats.originals;
    // a pictures for photos + cards + papers.
    stats.panda_pics = photo_ids.filter(photo_id => {
        const tag_names = meta.get_photo_tag_names(photo_id);
        for (const tag_name of tag_names) {
            if (/\bpanda\b/i.test(tag_name)) {
                return true;
            }
        }
    }).length;
    stats.cat_pics = photo_ids.filter(photo_id => {
        const tag_names = meta.get_photo_tag_names(photo_id);
        for (const tag_name of tag_names) {
            if (/\bcat\b/i.test(tag_name)) {
                return true;
            }
        }
    }).length;

    stats.tag_instances = 0;
    for (const tag_id of tag_ids) {
        stats.tag_instances += meta.get_tag_photos(tag_id).length;
    }

    Object.freeze(stats);

    return stats;
};

meta.is_valid = async function () {
    const errors = [];

    // photos_obj
    for (let photo_id of Object.keys(photos_obj)) {
        const photo_obj = photos_obj[photo_id];
        // photo
        if (!await consts.fs_exists(consts.resolve_photo_path(photo_id))) {
            errors.push(`${photo_id} in photos_obj does not exist on disc!!!`);
        }
        // thumb
        if (!await consts.fs_exists(consts.resolve_photo_path(photo_id, "thumbs"))) {
            errors.push(`${photo_id} in photos_obj does not have a thumb on disc!!!`);
        }
        // opposite
        if (await consts.fs_exists(consts.resolve_photo_path(photo_id, "opposites"))) {
            if (!photo_obj.tags.includes(TAG_HAS_OPPOSITE)) {
                errors.push(`${photo_id} in photos_obj has a missing tag for an existing opposite photo!!!`);
            }
        } else {
            if (photo_obj.tags.includes(TAG_HAS_OPPOSITE)) {
                errors.push(`${photo_id} in photos_obj has an existing tag for a missing opposite photo!!!`);
            }
        }
        // overlay
        if (await consts.fs_exists(consts.resolve_photo_path(photo_id, "overlays"))) {
            if (!photo_obj.tags.includes(TAG_HAS_OVERLAY)) {
                errors.push(`${photo_id} in photos_obj has a missing tag for an existing overlay photo!!!`);
            }
        } else {
            if (photo_obj.tags.includes(TAG_HAS_OVERLAY)) {
                errors.push(`${photo_id} in photos_obj has an existing tag for a missing overlay photo!!!`);
            }
        }
        // alternate
        if (await consts.fs_exists(consts.resolve_photo_path(photo_id, "alternates"))) {
            if (!photo_obj.tags.includes(TAG_HAS_ALTERNATE)) {
                errors.push(`${photo_id} in photos_obj has a missing tag for an existing alternate photo!!!`);
            }
        } else {
            if (photo_obj.tags.includes(TAG_HAS_ALTERNATE)) {
                errors.push(`${photo_id} in photos_obj has an existing tag for a missing alternate photo!!!`);
            }
        }
        // original
        if (await consts.fs_exists(consts.resolve_photo_path(photo_id, "originals"))) {
            if (!photo_obj.tags.includes(TAG_HAS_ORIGINAL)) {
                errors.push(`${photo_id} in photos_obj has a missing tag for an existing original photo!!!`);
            }
        } else {
            if (photo_obj.tags.includes(TAG_HAS_ORIGINAL)) {
                errors.push(`${photo_id} in photos_obj has an existing tag for a missing original photo!!!`);
            }
        }
        // albums
        for (let album_id of photo_obj.albums) {
            if (!albums_obj[album_id].photos.includes(photo_id)) {
                errors.push(`${photo_id} in photos_obj has an album mismatch! Related album does not include this photo!!!`);
            }
        }
        // tags
        for (let tag_str of photo_obj.tags) {
            if (!tags_obj[tag_str].photos.includes(photo_id)) {
                errors.push(`${photo_id} in photos_obj has a tag mismatch! Related tag does not include this photo!!!`);
            }
        }
        // comment
        if (photo_obj.tags.includes(TAG_HAS_COMMENT)) {
            if (!photo_obj.hasOwnProperty("comment")) {
                errors.push(`${photo_id} in photos_obj has a tag indicating comment, but with no comment on obj!!!`);
            }
        } else {
            if (photo_obj.hasOwnProperty("comment")) {
                errors.push(`${photo_id} in photos_obj has no tag indicating comment, but with a comment on obj!!!`);
            }
        }
        // added
        if (!photo_obj.hasOwnProperty("added")) {
            errors.push(`${photo_id} in photos_obj is missing an 'added' field!!!`);
        }
        // user_id
        if (!photo_obj.hasOwnProperty("user_id")) {
            errors.push(`${photo_id} in photos_obj is missing a 'user_id' field!!!`);
        }
        // album dupes
        const album_count = photo_obj.albums.length;
        if (consts.utils_array_undupe(photo_obj.albums).length !== album_count) {
            errors.push(`${photo_id} albums array contains duplicates!`);
        }
        // tag dupes
        const tag_count = photo_obj.tags.length;
        if (consts.utils_array_undupe(photo_obj.tags).length !== tag_count) {
            errors.push(`${photo_id} tags array contains duplicates!`);
        }
    }

    // albums_obj
    for (let [album_id, album_obj] of Object.entries(albums_obj)) {
        // photos
        for (let photo_id of album_obj.photos) {
            if (!photos_obj[photo_id].albums.includes(album_id)) {
                errors.push(`${album_id} in albums_obj has a photo mismatch! Related photo does not include this album!!!`);
            }
        }
        // added
        if (!album_obj.hasOwnProperty("added")) {
            errors.push(`${album_id} in albums_obj is missing an 'added' field!!!`);
        }
        // user_id
        if (!album_obj.hasOwnProperty("user_id")) {
            errors.push(`${album_id} in albums_obj is missing a 'user_id' field!!!`);
        }
        // photo dupes
        const photo_count = album_obj.photos.length;
        if (consts.utils_array_undupe(album_obj.photos).length !== photo_count) {
            errors.push(`${album_id} contains duplicates!`);
        }
    }

    // tags_obj
    for (let [tag_id, tag_obj] of Object.entries(tags_obj)) {
        // photos
        for (let photo_id of tag_obj.photos) {
            if (!photos_obj[photo_id].tags.includes(tag_id)) {
                errors.push(`${tag_id} in tags_obj has a photo mismatch! Related photo does not include this tag!!!`);
            }
        }
        // added
        if (!tag_obj.hasOwnProperty("added")) {
            errors.push(`${tag_id} in tags_obj is missing an 'added' field!!!`);
        }
        // user_id
        if (!tag_obj.hasOwnProperty("user_id")) {
            errors.push(`${tag_id} in tags_obj is missing a 'user_id' field!!!`);
        }
        // photo dupes
        const photo_count = tag_obj.photos.length;
        if (consts.utils_array_undupe(tag_obj.photos).length !== photo_count) {
            errors.push(`${tag_id} contains duplicates!`);
        }
    }

    // users_obj
    // tbd

    // unused files
    const photo_dir_paths = [
        consts.photos_path,
        `${consts.photos_path}/thumbs`,
        `${consts.photos_path}/opposites`,
        `${consts.photos_path}/overlays`,
        `${consts.photos_path}/alternates`,
        `${consts.photos_path}/originals`
    ];
    for (const path of photo_dir_paths) {
        const dir = await consts.fs_readdir(path);
        if (!dir) {
            errors.push(`${path} could not be read!`);
            continue;
        }
        for (let file_name of dir) {
            const file_path = `${path}/${file_name}`;
            const stats = await consts.fs_stat(file_path);
            if (!stats) {
                errors.push(`${file_path} could not be read!`);
                continue;
            }
            if (!stats.isDirectory()) {
                const photo_id = file_name.replace(/\.jpg$/, "");
                if (!photos_obj.hasOwnProperty(photo_id)) {
                    errors.push(`${file_path} is unused!!!`);
                }
            }
        }
    }

    if (errors.length > 0) {
        consts.logger.log("Meta Data failed validation:", errors.join("\n"), new Error().stack);
        return [false, errors];
    } else {
        consts.logger.log("Meta Data passed validation.");
        return [true];
    }
};

meta.backup = async function () {
    try {
        const now = new Date();
        const month = consts.parse_str_pad(now.getMonth() + 1, "0", 2);
        const date = consts.parse_str_pad(now.getDate(), "0", 2);
        const year = consts.parse_str_pad(now.getFullYear(), "0", 2);
        const hours = consts.parse_str_pad(now.getHours(), "0", 2);
        const minutes = consts.parse_str_pad(now.getMinutes(), "0", 2);
        const seconds = consts.parse_str_pad(now.getSeconds(), "0", 2);
        const zip_path = `"./backup/meta/meta_${month}-${date}-${year}_${hours}-${minutes}-${seconds}.zip"`;
        const files = `"${albums_json_path}" "${photos_json_path}" "${tags_json_path}" "${users_json_path}"`;

        let command;
        if (consts.is_linux) {
            command = `zip -j -q ${zip_path} ${files}`;
        } else if (consts.is_windows) {
            command = `7z a ${zip_path} ${files}`;
        }

        const [passed, data] = await new Promise(function (res, rej) {
            child_process.exec(command, (err, stdout, stderr) => {
                err ? res([false, { err, stdout, stderr }]) : res([true]);
            });
        });

        if (passed) {
            consts.logger.log("Backed up meta data.");
            return [true];
        } else {
            consts.logger.log(
                "Child process Failed:",
                data.err.message + "\n" + data.stdout + "\n" + data.stderr,
                new Error().stack
            );
            return [false, data.err.message];
        }
    } catch (err) {
        consts.logger.log(
            "Backup function failed:",
            err.message,
            err.stack
        );
        return [false, err.message];
    }
};

/* exports */
module.exports = meta;
