// Copyright Neal Raulerson 2019. All Rights Reserved.

"use strict;"

Mary.define("raul-pics/meta.js", [
    "Mary/svr/Server_Request",
    "raul-pics/global/consts"
], async function (Server_Request, consts) {

    /* constants */
    const meta = {};

    /* functions */
    function request(method, url, data, authenticate) {
        return new Promise(function (res) {
            const svr_req = Server_Request(method, url)
                .listen(200, data => res([true, data ? JSON.parse(data) : undefined]))
                .listen(201, data => res([true, data ? JSON.parse(data) : undefined]))
                .listen(null, (status, data) => res([false, data ? JSON.parse(data) : undefined]))
                .listen("error", () => res([false]))
                .listen("abort", () => res([false]))
                .timeout(10000);
            if (authenticate) {
                svr_req.headers({ "csrf-token": consts.get_csrf_token() });
            }
            if (data) {
                svr_req.send(JSON.stringify(data));
            } else {
                svr_req.send();
            }
        });
    };

    /******** GET ********/

    /* get_album */
    meta.get_album_ids_and_names_by_user_id = async function (user_id) {
        const [passed, data] = await request("GET", `/meta/get_album_ids_and_names_by_user_id/${user_id}`);
        return passed ? data.album_ids_and_names : null;
    };
    meta.get_album_photos = async function (album_id) {
        const [passed, data] = await request("GET", `/meta/get_album_photos/${album_id}`);
        return passed ? data.album_photos : null;
    };
    meta.get_album_photo_random = async function (album_id) {
        const [passed, data] = await request("GET", `/meta/get_album_photo_random/${album_id}`);
        return passed ? data.photo_id : null;
    };

    /* get_tag */
    meta.get_tag_id = async function (tag_name) {
        const [passed, data] = await request("GET", `/meta/get_tag_id/${tag_name}`);
        return passed ? data.tag_id : null;
    };
    meta.get_tag_ids_and_names = async function () {
        const [passed, data] = await request("GET", "/meta/get_tag_ids_and_names");
        return passed ? data.tag_ids_and_names : null;
    };
    meta.get_tag_ids_and_names_and_fonts = async function () {
        const [passed, data] = await request("GET", "/meta/get_tag_ids_and_names_and_fonts");
        return passed ? data.tag_ids_and_names_and_fonts : null;
    };
    meta.get_tag_photos = async function (tag_id) {
        const [passed, data] = await request("GET", `/meta/get_tag_photos/${tag_id}`);
        return passed ? data.tag_photos : null;
    };
    meta.get_tag_font = async function (tag_id) {
        const [passed, data] = await request("GET", `/meta/get_tag_font/${tag_id}`);
        return passed ? data.tag_font : null;
    };
    meta.get_tag_possibles = async function (tag_partial) {
        const [passed, data] = await request("GET", `/meta/get_tag_possibles/${tag_partial}`);
        return passed ? data.tag_possibles : null;
    };

    /* get_photo */
    meta.get_photo_comment = async function (photo_id) {
        const [passed, data] = await request("GET", `/meta/get_photo_comment/${photo_id}`);
        return passed ? data.photo_comment : null;
    };
    meta.get_photo_ids = async function () {
        const [passed, data] = await request("GET", "/meta/get_photo_ids");
        return passed ? data.photo_ids : null;
    };
    meta.get_photo_album_ids_and_names = async function (photo_id) {
        const [passed, data] = await request("GET", `/meta/get_photo_album_ids_and_names/${photo_id}`);
        return passed ? data.photo_album_ids_and_names : null;
    };
    meta.get_photo_tag_names = async function (photo_id) {
        const [passed, data] = await request("GET", `/meta/get_photo_tag_names/${photo_id}`);
        return passed ? data.photo_tag_names : null;
    };
    meta.get_photo_tag_ids_and_names_and_fonts = async function (photo_id) {
        const [passed, data] = await request("GET", `/meta/get_photo_tag_ids_and_names_and_fonts/${photo_id}`);
        return passed ? data.photo_tag_ids_and_names_and_fonts : null;
    };
    meta.get_photo_flags_arr = async function (photo_id) {
        const [passed, data] = await request("GET", `/meta/get_photo_flags_arr/${photo_id}`);
        return passed ? data.photo_flags_arr : null;
    };

    /* get_other */
    meta.get_stats = async function () {
        const [passed, data] = await request("GET", "/meta/get_stats");
        return passed ? data.stats : null;
    };

    /* get_user */
    meta.get_user_favorites_id = async function () {
        const [passed, data] = await request("GET", `/meta/get_user_favorites_id`, null, true);
        return passed ? data.user_favorites_id : null;
    };
    meta.get_user_name = async function () {
        const [passed, data] = await request("GET", `/meta/get_user_name`, null, true);
        return passed ? data.user_name : null;
    };
    meta.get_user_type = async function () {
        const [passed, data] = await request("GET", `/meta/get_user_type`, null, true);
        return passed ? data.user_type : null;
    };
    meta.get_user_variables = async function () {
        const [passed, data] = await request("GET", `/meta/get_user_variables`, null, true);
        return passed ? data.user_variables : null;
    };

    /* has_photo */
    meta.has_photo_comment = async function (photo_id) {
        const [passed, data] = await request("GET", `/meta/has_photo_comment/${photo_id}`);
        return passed ? data.bool : null;
    };
    meta.has_photo_opposite = async function (photo_id) {
        const [passed, data] = await request("GET", `/meta/has_photo_opposite/${photo_id}`);
        return passed ? data.bool : null;
    };
    meta.has_photo_overlay = async function (photo_id) {
        const [passed, data] = await request("GET", `/meta/has_photo_overlay/${photo_id}`);
        return passed ? data.bool : null;
    };
    meta.has_photo_alternate = async function (photo_id) {
        const [passed, data] = await request("GET", `/meta/has_photo_alternate/${photo_id}`);
        return passed ? data.bool : null;
    };
    meta.has_photo_original = async function (photo_id) {
        const [passed, data] = await request("GET", `/meta/has_photo_original/${photo_id}`);
        return passed ? data.bool : null;
    };
    meta.has_photo_tag_id = async function (photo_id, tag_id) {
        const [passed, data] = await request("GET", `/meta/has_photo_tag_id/${photo_id}/${tag_id}`);
        return passed ? data.bool : null;
    };

    /* is_other */
    meta.is_valid = async function () {
        const [passed, data] = await request("GET", `/meta/is_valid`, null, true);
        return passed ? data.results : null;
    };

    /* is_photo */
    meta.is_photo_physical = async function (photo_id) {
        const [passed, data] = await request("GET", `/meta/is_photo_physical/${photo_id}`);
        return passed ? data.bool : null;
    };
    meta.is_photo_digital = async function (photo_id) {
        const [passed, data] = await request("GET", `/meta/is_photo_digital/${photo_id}`);
        return passed ? data.bool : null;
    };

    /* is_user */
    meta.is_user_logged_in = async function () {
        const [passed, data] = await request("GET", `/meta/is_user_logged_in`, null, true);
        return passed ? data.bool : null;
    };

    /******** PUT ********/

    /* add */
    meta.add_album = async function (album_name) {
        return await request("PUT", "/meta/add_album", { args: [album_name] }, true);
    };
    meta.add_gallery_photos_tag_name = async function (gallery_id, tag_name) {
        return await request("PUT", "/meta/add_gallery_photos_tag_name", { args: [gallery_id, tag_name] }, true);
    };
    meta.add_photo_tag_name = async function (photo_id, tag_name) {
        return await request("PUT", "/meta/add_photo_tag_name", { args: [photo_id, tag_name] }, true);
    };
    meta.add_user_favorite = async function (photo_id) {
        return await request("PUT", "/meta/add_user_favorite", { args: [photo_id] }, true);
    };

    meta.backup = async function () {
        return await request("PUT", "/meta/backup", { args: [] }, true);
    };

    /* del */
    meta.del_gallery_photos_tag_name = async function (gallery_id, tag_name) {
        return await request("PUT", "/meta/del_gallery_photos_tag_name", { args: [gallery_id, tag_name] }, true);
    };
    meta.del_photo_tag_name = async function (photo_id, tag_name) {
        return await request("PUT", "/meta/del_photo_tag_name", { args: [photo_id, tag_name] }, true);
    };
    meta.del_tags_unused = async function () {
        return await request("PUT", "/meta/del_tags_unused", { args: [] }, true);
    };
    meta.del_user_favorite = async function (photo_id) {
        return await request("PUT", "/meta/del_user_favorite", { args: [photo_id] }, true);
    };

    /* set */
    meta.set_photo_comment = async function (photo_id, comment) {
        return await request("PUT", "/meta/set_photo_comment", { args: [photo_id, comment] }, true);
    };
    meta.set_user_variable = async function (variable_name, expression) {
        return await request("PUT", "/meta/set_user_variable", { args: [variable_name, expression] }, true);
    };

    /* unset */
    meta.unset_photo_comment = async function (photo_id) {
        return await request("PUT", "/meta/unset_photo_comment", { args: [photo_id] }, true);
    };
    meta.unset_user_variable = async function (variable_name) {
        return await request("PUT", "/meta/unset_user_variable", { args: [variable_name] }, true);
    };

    /* exports */
    return meta;

});
