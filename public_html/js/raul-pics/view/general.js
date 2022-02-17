// Copyright Neal Raulerson 2019. All Rights Reserved.

"use strict";

Mary.define("raul-pics/view/general", [
    "Mary/utils",
    "Mary/parse",
    "Mary/dom",
    "Mary/html",
    "raul-pics/meta",
    "raul-pics/filter",
    "raul-pics/css/general"
], function (utils, parse, dom, html, meta, filter, CSS_General) {

    async function constructor(pubsub, options) {
        /* constants */
        const general = {};
        general.consts = {};
        general.funcs = {};
        general.vars = {};
        general.css = CSS_General(options.fonts_path);

        const consts = general.consts;
        const funcs = general.funcs;
        const vars = general.vars;

        /* constant exports */
        {
            consts.top_element = options.top_element;

            consts.fonts_path = options.fonts_path;
            consts.photos_path = options.photos_path;

            consts.THUMB_MODE_CIRCLE = 0;
            consts.THUMB_MODE_SQUARE = 1;

            // can't change these, because we are using them for links. just add more if you need to, but don't change.
            consts.GALLERY_TYPE_ALBUM = 0;
            consts.GALLERY_TYPE_TAG = 1;
            consts.GALLERY_TYPE_FILTER = 2;

            consts.is_iOS = navigator.platform ?
                /iPad|iPhone|iPod/.test(navigator.platform) :
                /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

            consts.has_local_storage = storage_is_available("localStorage");
            consts.has_session_storage = storage_is_available("sessionStorage");

            if (typeof document.hidden !== "undefined") {
                consts.api_hidden = "hidden";
                consts.api_visibility_change = "visibilitychange";
            } else if (typeof document.msHidden !== "undefined") {
                consts.api_hidden = "msHidden";
                consts.api_visibility_change = "msvisibilitychange";
            } else if (typeof document.webkitHidden !== "undefined") {
                consts.api_hidden = "webkitHidden";
                consts.api_visibility_change = "webkitvisibilitychange";
            }

            consts.wrapper_top = dom(consts.top_element)
                .id("Raul_Pics__View_Top");
            consts.wrapper_galleries = dom(html.div, consts.top_element, 1, true)
                .id("Raul_Pics__View_Galleries");
            consts.wrapper_info = dom(html.div, consts.top_element, 1, true)
                .id("Raul_Pics__View_Info");
            consts.wrapper_thumbs = dom(html.div, consts.top_element, 1, true)
                .id("Raul_Pics__View_Thumbs");
            consts.wrapper_full = dom(html.div, consts.top_element, 1, true)
                .id("Raul_Pics__View_Full");

            Object.freeze(consts);
        }

        /* function exports */
        {
            funcs.resolve_photo_src = function (photo_id, folder_str = null) {
                return `${consts.photos_path}/${folder_str ? folder_str + "/" : ""}${photo_id}.jpg`;
            };
            funcs.enter_fullscreen = function () {
                if (Mary.body_element.requestFullscreen) {
                    Mary.body_element.requestFullscreen();
                } else if (Mary.body_element.mozRequestFullScreen) {
                    Mary.body_element.mozRequestFullScreen();
                } else if (Mary.body_element.webkitRequestFullscreen) {
                    Mary.body_element.webkitRequestFullscreen();
                } else if (Mary.body_element.msRequestFullscreen) {
                    Mary.body_element.msRequestFullscreen();
                } else {
                    return;
                }
            };
            funcs.exit_fullscreen = function () {
                let promise;
                if (document.exitFullscreen) {
                    promise = document.exitFullscreen();
                } else if (document.mozCancelFullScreen) {
                    promise = document.mozCancelFullScreen();
                } else if (document.webkitExitFullscreen) {
                    promise = document.webkitExitFullscreen();
                } else if (document.msExitFullscreen) {
                    promise = document.msExitFullscreen();
                } else {
                    return;
                }
                return promise;
            };
            funcs.element_is_in_viewport = function (viewport, element) {
                const viewport_rect = viewport.getBoundingClientRect();
                const element_rect = element.getBoundingClientRect();
                return (
                    element_rect.top >= viewport_rect.top &&
                    element_rect.left >= viewport_rect.left &&
                    element_rect.bottom <= viewport_rect.bottom &&
                    element_rect.right <= viewport_rect.right
                );
            };
            funcs.set_tag_font_on_element = async function (tag_font, element) {
                if (tag_font) {
                    const ff = "font-family";
                    const ls = "letter-spacing";
                    if (tag_font[ff]) {
                        element.style[ff] = tag_font[ff];
                    }
                    if (tag_font[ls]) {
                        element.style[ls] = tag_font[ls];
                    }
                }
            };
            funcs.show_dom_message = function (dom_element, message = "", position = "bottom") {
                const message_div = dom(html.div, dom_element)
                    .class("Message_Box")
                    .setText(message)
                    .on("click", function () {
                        message_div.remove();
                    });
                if (position === "bottom") {
                    message_div.style(`
                        top: 100%;
                    `);
                } else if (position === "top") {
                    message_div.style(`
                        bottom: 100%;
                    `);
                }
                window.setTimeout(function () {
                    message_div.remove();
                }, 5000);
            };
            Object.freeze(funcs);
        }

        /* variable exports */
        {
            vars.is_fullscreen = false;
            vars.curr_thumb_mode = (() => {
                if (consts.has_local_storage) {
                    let mode = localStorage.getItem("curr_thumb_mode");
                    if (mode) {
                        return Number(mode);
                    } else {
                        return consts.THUMB_MODE_CIRCLE;
                    }
                } else {
                    return consts.THUMB_MODE_CIRCLE;
                }
            })();
        }

        /* functions */
        function storage_is_available(type_str) {
            if (type_str !== "sessionStorage" && type_str !== "localStorage") {
                throw new Error("not a valid storage type_str");
            }
            try {
                const storage = window[type_str];
                const test_item = "testing storage";
                storage.setItem(test_item, test_item);
                storage.removeItem(test_item);
                return true;
            } catch {
                return false;
            }
        }

        /* listeners */
        // should this be on top_element?
        Mary.body_element.addEventListener("fullscreenchange", (event) => {
            if (document.fullscreenElement) {
                // go_fullscreen
                vars.is_fullscreen = true;
            } else if (!document.fullscreenElement && vars.is_fullscreen) {
                // exit_fullscreen
                vars.is_fullscreen = false;
            }
        });

        function on_resize(event) {
            pubsub.pub("resize");
        }
        window.addEventListener("resize", on_resize);
        pubsub.sub("destroy", function () {
            window.removeEventListener("resize", on_resize);
        });

        return general;
    }

    /* exports */
    return constructor;

});
