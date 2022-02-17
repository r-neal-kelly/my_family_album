// Copyright Neal Raulerson 2019. All Rights Reserved.

"use strict";

Mary.define("raul-pics/view/full", [
    "Mary/utils",
    "Mary/parse",
    "Mary/dom",
    "Mary/html",
    "Mary/gui/Context_Menu",
    "Mary/gui/Message_Box",
    "Mary/svr/Server_Request",
    "raul-pics/global/consts",
    "raul-pics/dialog/Link",
    "raul-pics/dialog/Error",
    "raul-pics/css/full",
    "raul-pics/meta"
], function (utils, parse, dom, html, Context_Menu, Message_Box, Server_Request, consts, Dialog_Link, Dialog_Error, CSS_Full, meta) {

    /* constants */
    const MENU_OPEN_TEXT = "···";
    const MENU_CLOSE_TEXT = "X";
    const MENU_SPECIAL_TEXT = "!!";
    const OPPOSITE = 1;
    const OVERLAY = 2;
    const ALTERNATE = 3;
    const ORIGINAL = 4;

    /* constructor */
    async function Full(general, pubsub, viewport) {
        /* init */
        const self = utils.newObj();
        self.general = general;
        self.pubsub = pubsub;
        self.viewport = viewport;
        self.wrapper = dom(html.div, viewport)
            .class("Full_Wrapper");
        CSS_Full(self.general.css);
        self.curr_flag = null;
        self.edit = {};
        hide(self);
        generate_dom(self);
        generate_edit_dom(self);

        /* subs */
        pubsub.sub("resize", function () {
            resize_viewport(self);
        });
        pubsub.sub("galleries_to_thumbs", function ({ gallery_type_num, gallery_id, gallery_title_str, gallery_photos_arr, is_authenticated = false, is_favorites = false }) {
            self.type_num = gallery_type_num;
            self.gallery_id = gallery_id;
            self.title_str = gallery_title_str;
            self.photos_arr = gallery_photos_arr;
            self.is_authenticated = is_authenticated;
            self.is_favorites = is_favorites;
        });
        pubsub.sub("thumbs_to_full", function ({ curr_photo_idx }) {
            show(self);
            self.curr_photo_idx = curr_photo_idx;
            update_photo_img(self);
            update_photo_meta(self);
            update_photo_edit(self);
            preload_photos_prev(self, 1);
            preload_photos_next(self, 1);
        });
        pubsub.sub("full_to_thumbs", function () {
            clear_full_photo(self);
            hide(self);
        });
        pubsub.sub("full_to_thumbs_by_album", function () {
            clear_full_photo(self);
            hide(self);
            if (self.general.vars.is_fullscreen) {
                self.general.funcs.exit_fullscreen();
            }
        });
        pubsub.sub("full_to_thumbs_by_tag", function () {
            clear_full_photo(self);
            hide(self);
            if (self.general.vars.is_fullscreen) {
                self.general.funcs.exit_fullscreen();
            }
        });
        pubsub.sub("destroy", function () {
            if (self.fullscreen_button) {
                dom(Mary.body_element).off("on_full_screen_change", null, {
                    namespace: self.namespace
                });
            }
        });
        self.pubsub.sub("thumbs__load_thumbs", async function (data = {}) {
            if (data.photos_arr) {
                self.photos_arr = data.photos_arr;
            }
        });
        self.pubsub.sub("before_leaving_photo", async function () {
            if (!self.edit.comment_might_need_saving) {
                return;
            }
            const should_save = await new Promise(function (res) {
                Message_Box(self.viewport, self.viewport, consts.message_box_options)
                    .section("Do you want to save the changed comment?")
                    .button("Yes", () => res(true))
                    .button("No", () => res(false));
            });
            if (should_save) {
                await edit_save_comment(self, false);
            } else {
                self.edit.comment_might_need_saving = false;
            }
        });
        self.pubsub.sub("login", async function ({ user_type }) {
            if (!user_type === "user") {
                show_edit(self);
            }
        });
        self.pubsub.sub("logout", async function () {
            hide_edit(self);
        });
    }

    /* functions */
    function show(self) {
        self.viewport.show();
    };

    function hide(self) {
        self.viewport.hide();
    };

    function resize_viewport(self) {
        const viewport_element = self.viewport.first;
        const wrapper_element = self.wrapper.first;
        const diff = viewport_element.clientHeight - wrapper_element.clientHeight;
        self.back_button.first.style["bottom"] = `${diff}px`;
        self.next_button.first.style["bottom"] = `${diff}px`;
        self.edit.tags_div.first.style["bottom"] = `${diff}px`;
    };

    function open_menu(self) {
        self.menu_toggle_button
            .class("Menu_Toggle_Button_Opened");
        self.menu_toggle_text
            .setText(MENU_CLOSE_TEXT);
        self.menu_div
            .show();
        preload_photos_related(self);
    };

    function close_menu(self) {
        self.menu_toggle_button
            .removeClass("Menu_Toggle_Button_Opened");
        self.menu_toggle_text
            .setText(MENU_OPEN_TEXT);
        self.menu_div
            .hide();
    };

    function get_curr_photo_id(self) {
        return self.photos_arr[self.curr_photo_idx];
    };

    function get_curr_photo_name(self) {
        return `${self.title_str} ${parse.pad(String(self.curr_photo_idx + 1), "0", 4)}`;
    };

    async function preload_photos_related(self) {
        const photo_id = self.photos_arr[self.curr_photo_idx];
        if (await meta.has_photo_opposite(photo_id)) {
            new Image().src = self.general.funcs.resolve_photo_src(photo_id, "opposites");
        }
        if (await meta.has_photo_overlay(photo_id)) {
            new Image().src = self.general.funcs.resolve_photo_src(photo_id, "overlays");
        }
        if (await meta.has_photo_alternate(photo_id)) {
            new Image().src = self.general.funcs.resolve_photo_src(photo_id, "alternates");
        }
        if (await meta.has_photo_original(photo_id)) {
            new Image().src = self.general.funcs.resolve_photo_src(photo_id, "originals");
        }
    };

    function toggle_photo(self, new_state) {
        const photo_id = self.photos_arr[self.curr_photo_idx];
        const photo_name = get_curr_photo_name(self);
        let source, download;

        if (new_state === OPPOSITE && self.curr_flag !== OPPOSITE) {
            self.curr_flag = OPPOSITE;
            source = self.general.funcs.resolve_photo_src(photo_id, "opposites");
            download = `download="${photo_name} opposite.jpg"`;
        } else if (new_state === OVERLAY && self.curr_flag !== OVERLAY) {
            self.curr_flag = OVERLAY;
            source = self.general.funcs.resolve_photo_src(photo_id, "overlays");
            download = `download="${photo_name} overlay.jpg"`;
        } else if (new_state === ALTERNATE && self.curr_flag !== ALTERNATE) {
            self.curr_flag = ALTERNATE;
            source = self.general.funcs.resolve_photo_src(photo_id, "alternates");
            download = `download="${photo_name} alternate.jpg"`;
        } else if (new_state === ORIGINAL && self.curr_flag !== ORIGINAL) {
            self.curr_flag = ORIGINAL;
            source = self.general.funcs.resolve_photo_src(photo_id, "originals");
            download = `download="${photo_name} original.jpg"`;
        } else {
            self.curr_flag = null;
            source = self.general.funcs.resolve_photo_src(photo_id);
            download = `download="${photo_name}.jpg"`;
        }

        self.full_dom.src(source);
    };

    async function to_prev_photo(self) {
        await self.pubsub.pub("before_leaving_photo");
        if (self.curr_photo_idx === 0) {
            self.curr_photo_idx = self.photos_arr.length - 1;
        } else {
            self.curr_photo_idx -= 1;
        }
        update_photo_img(self);
        update_photo_meta(self);
        update_photo_edit(self);
        preload_photos_prev(self, 6);
    };

    async function to_next_photo(self) {
        await self.pubsub.pub("before_leaving_photo");
        if (self.curr_photo_idx === self.photos_arr.length - 1) {
            self.curr_photo_idx = 0;
        } else {
            self.curr_photo_idx += 1;
        }
        update_photo_img(self);
        update_photo_meta(self);
        update_photo_edit(self);
        preload_photos_next(self, 6);
    };

    async function preload_photos_prev(self, count) {
        const photo_count = self.photos_arr.length;
        if (count > photo_count) {
            count = photo_count;
        }
        for (let cnt = count, idx = self.curr_photo_idx; cnt > 0; cnt -= 1) {
            idx = idx === 0 ? photo_count - 1 : idx - 1;
            await new Promise(function (res) {
                const img = new Image();
                img.onload = res;
                img.onerror = res;
                img.src = self.general.funcs.resolve_photo_src(self.photos_arr[idx]);
            });
        }
    };

    async function preload_photos_next(self, count) {
        const photo_count = self.photos_arr.length;
        if (count > photo_count) {
            count = photo_count;
        }
        for (let cnt = count, idx = self.curr_photo_idx; cnt > 0; cnt -= 1) {
            idx = idx === photo_count - 1 ? 0 : idx + 1;
            await new Promise(function (res) {
                const img = new Image();
                img.onload = res;
                img.onerror = res;
                img.src = self.general.funcs.resolve_photo_src(self.photos_arr[idx]);
            });
        }
    };

    function generate_dom(self) {
        self.menu_toggle_button = dom(html.div, self.viewport)
            .class(["Main_Button", "Menu_Toggle_Button"])
            .on("click", function () {
                if (self.menu_div.is_shown()) {
                    close_menu(self);
                } else {
                    open_menu(self);
                }
            });
        self.menu_toggle_text = dom(html.div, self.menu_toggle_button)
            .setText(MENU_OPEN_TEXT);

        const menu_toggle_button_offset = (() => {
            show(self);
            const offset = self.menu_toggle_button.getOffset();
            hide(self);
            return offset;
        })();
        self.menu_div = dom(html.div, self.viewport)
            .class("Menu_Div")
            .style([`left: ${menu_toggle_button_offset.l + menu_toggle_button_offset.w}px`, `top: ${menu_toggle_button_offset.t}px`])
            .hide();
        self.menu_wrap = dom(html.div, self.menu_div)
            .class("Menu_Wrap");

        self.menu_title_wrap = dom(html.div, self.menu_wrap)
            .class("Menu_Title_Wrap");
        self.menu_title_text = dom(html.div, self.menu_title_wrap)
            .class("Menu_Title_Text");
        self.menu_title_page = dom(html.div, self.menu_title_wrap)
            .class("Menu_Title_Page");

        // I do want a history button too, so that you can go back...use the thumbs in a list,
        // in tertiary menu window.

        if (!self.general.consts.is_iOS) {
            self.fullscreen_button = dom(html.button, self.menu_wrap)
                .class("Menu_Button")
                .setText("Go Fullscreen")
                .on("click", function () {
                    if (self.general.vars.is_fullscreen) {
                        self.general.funcs.exit_fullscreen();
                    } else {
                        self.general.funcs.enter_fullscreen();
                    }
                });
            self.namespace = `View_Full: ${utils.number.unique()}`;
            dom(Mary.body_element).on("fullscreenchange", function on_full_screen_change() {
                if (document.fullscreenElement) {
                    // go_fullscreen
                    self.fullscreen_button.setText("Exit Fullscreen");
                } else if (!document.fullscreenElement) {
                    // exit_fullscreen
                    self.fullscreen_button.setText("Go Fullscreen");
                }
            }, null, { namespace: self.namespace });
        }

        self.loading_text = dom(html.div, self.menu_wrap)
            .class("Menu_Loading_Text")
            .setText("Loading...")
            .hide();

        self.opposite_button = dom(html.button, self.menu_wrap)
            .class("Menu_Button")
            .setText("Toggle Opposite")
            .hide()
            .on("click", () => toggle_photo(self, OPPOSITE));
        self.overlay_button = dom(html.button, self.menu_wrap)
            .class("Menu_Button")
            .setText("Toggle Overlay")
            .hide()
            .on("click", () => toggle_photo(self, OVERLAY));
        self.alternate_button = dom(html.button, self.menu_wrap)
            .class("Menu_Button")
            .setText("Toggle Alternate")
            .hide()
            .on("click", () => toggle_photo(self, ALTERNATE));
        self.original_button = dom(html.button, self.menu_wrap)
            .class("Menu_Button")
            .setText("Toggle Original")
            .hide()
            .on("click", () => toggle_photo(self, ORIGINAL));
        self.comment_textarea = dom(html.div, self.menu_wrap)
            .class("Menu_Comment_Text")
            .hide();
        self.photo_albums_div = dom(html.div, self.menu_wrap)
            .class("Menu_Wrap_Albums");
        self.photo_tags_div = dom(html.div, self.menu_wrap)
            .class("Menu_Wrap_Tags");

        self.edit.toggle_tags_button = dom(html.button, self.menu_wrap)
            .class("Menu_Button")
            .setText("Edit Tags")
            .hide()
            .on("click", () => {
                self.edit.comment_div.hide();
                if (self.edit.tags_div.is_shown()) {
                    self.edit.tags_div.hide();
                } else {
                    self.edit.tags_div.show();
                    update_edit_tags(self);
                }
            });
        self.edit.toggle_comment_button = dom(html.button, self.menu_wrap)
            .class("Menu_Button")
            .setText("Edit Comment")
            .hide()
            .on("click", () => {
                self.edit.tags_div.hide();
                if (self.edit.comment_div.is_shown()) {
                    self.edit.comment_div.hide();
                } else {
                    self.edit.comment_div.show();
                    update_edit_comment(self);
                }
            });

        self.up_button = dom(html.button, self.viewport)
            .setText("↑")
            .class(["Main_Button", "Up_Button"])
            .on("click", async function () {
                const curr_photo_idx = self.curr_photo_idx;
                await self.pubsub.pub("before_leaving_photo");
                self.pubsub.pub("full_to_thumbs", { curr_photo_idx });
            });
        self.back_button = dom(html.button, self.viewport)
            .setText("←")
            .class(["Main_Button", "Back_Button"])
            .on("click", () => to_prev_photo(self));
        self.next_button = dom(html.button, self.viewport)
            .setText("→")
            .class(["Main_Button", "Next_Button"])
            .on("click", () => to_next_photo(self));

        self.full_dom = dom(html.img, self.wrapper)
            .class("Full_Picture")
            .on("dragover", evt_dragover => {
                evt_dragover.preventDefault();
                evt_dragover.dataTransfer.dropEffect = "copy";
            })
            .on("drop", async function (evt_drop) {
                evt_drop.preventDefault();
                const files = Array.from(evt_drop.dataTransfer.files);
                if (await meta.get_user_type() === "admin") {
                    upload_individual_photo(self, files);
                }
            });
        self.full_ctx = Context_Menu(self.viewport, self.full_dom, consts.context_menu_options);
    };

    function clear_full_photo(self) {
        self.curr_flag = null;
        self.curr_photo_idx = null;
        self.full_dom.src("");
        close_menu(self);
        self.edit.tags_div.hide();
    };

    async function should_update_photo_xhr(self) {
        return new Promise(function (res) {
            const curr_photo_idx = self.curr_photo_idx;
            setTimeout(() => {
                curr_photo_idx === self.curr_photo_idx ? res(true) : res(false);
            }, 100);
        });
    };

    async function update_photo_img(self) {
        if (utils.isNull(self.curr_photo_idx)) {
            self.full_dom.src("");
            return;
        }

        const photo_id = self.photos_arr[self.curr_photo_idx];
        const source = self.general.funcs.resolve_photo_src(photo_id);
        self.full_dom.src(source);
        { // resize
            // we need to know when the scrollbar has loaded 
            // to adjust the arrows at the bottom of viewport
            const img = new Image();
            window.requestAnimationFrame(function check() {
                if (img.width && img.height) {
                    // this is before img is done drawing,
                    // and _hopefully_ after scrollbar is drawn
                    resize_viewport(self);
                } else {
                    window.requestAnimationFrame(check);
                }
            });
            // just in case it missed,
            // better late than never!
            img.onload = () => resize_viewport(self);
            img.src = source;
        }
    };

    async function update_photo_meta(self) {
        if (utils.isNull(self.curr_photo_idx)) {
            return;
        }

        self.curr_flag = null; // maybe we could intelligently determine this, but preloading would have to take into account what related photo is to be loaded

        const photo_id = self.photos_arr[self.curr_photo_idx];
        const source = self.general.funcs.resolve_photo_src(photo_id);

        /* menu */
        self.menu_title_text.setText(self.title_str);
        self.menu_title_page.setText(`${self.curr_photo_idx + 1} of ${self.photos_arr.length}`);
        self.loading_text.show();
        self.opposite_button.hide();
        self.overlay_button.hide();
        self.alternate_button.hide();
        self.original_button.hide();
        self.comment_textarea.removeChildren().hide();
        self.photo_albums_div.removeChildren();
        self.photo_tags_div.removeChildren();

        if (await should_update_photo_xhr(self)) {
            self.loading_text.hide();
        } else {
            return;
        }

        const flags_promise = meta.get_photo_flags_arr(photo_id);
        const comment_promise = update_menu_comment(self, photo_id);
        const albums_promise = update_menu_albums(self, photo_id);
        const tags_promise = update_menu_tags(self, photo_id);

        flags_promise.then(flags_arr => {
            if (!flags_arr) {
                return;
            }
            const [is_digital, is_physical, has_opposite, has_overlay, has_alternate, has_original, has_comment] = flags_arr;
            if (has_opposite || has_overlay || has_alternate || has_original || has_comment) {
                self.menu_toggle_text.setText(MENU_SPECIAL_TEXT);
            } else {
                if (self.menu_div.is_shown()) {
                    self.menu_toggle_text.setText(MENU_CLOSE_TEXT);
                } else {
                    self.menu_toggle_text.setText(MENU_OPEN_TEXT);
                }
            }
            has_opposite ? self.opposite_button.show() : self.opposite_button.hide();
            has_overlay ? self.overlay_button.show() : self.overlay_button.hide();
            has_alternate ? self.alternate_button.show() : self.alternate_button.hide();
            has_original ? self.original_button.show() : self.original_button.hide();
        });

        /* context menu */
        flags_promise.then(async function (flags_arr) {
            if (!flags_arr) {
                return;
            }
            const [is_digital, is_physical, has_opposite, has_overlay, has_alternate, has_original, has_comment] = flags_arr;
            const photo_name = consts.get_picture_name(self.title_str, self.curr_photo_idx + 1);
            self.full_ctx.destroy();
            self.full_ctx = Context_Menu(self.viewport, self.full_dom, consts.context_menu_options)
                .section(photo_name)
                .button("close")
                .button("get link", evt_button => {
                    const link_str = consts.get_link_url(self.type_num, self.gallery_id, photo_id);
                    Dialog_Link(self.viewport, link_str);
                });
            const dl_ctx = self.full_ctx.sub_menu("download")
                .section("Which one?")
                .download("default", source, `${photo_name}.jpg`);
            if (has_opposite) {
                const src = self.general.funcs.resolve_photo_src(photo_id, "opposites");
                dl_ctx.download("opposite", src, `${photo_name} opposite.jpg`);
            }
            if (has_overlay) {
                const src = self.general.funcs.resolve_photo_src(photo_id, "overlays");
                dl_ctx.download("overlay", src, `${photo_name} overlay.jpg`);
            }
            if (has_alternate) {
                const src = self.general.funcs.resolve_photo_src(photo_id, "alternates");
                dl_ctx.download("alternate", src, `${photo_name} alternate.jpg`);
            }
            if (has_original) {
                const src = self.general.funcs.resolve_photo_src(photo_id, "originals");
                dl_ctx.download("original", src, `${photo_name} original.jpg`);
            }
            if (self.is_authenticated) {
                if (!self.is_favorites) {
                    self.full_ctx.button("add to favorites", async function (evt_button) {
                        const [passed, data] = await meta.add_user_favorite(photo_id);
                        if (!passed) {
                            Message_Box(self.viewport, self.viewport, consts.message_box_options)
                                .section(data.error)
                                .button("Okay");
                        }
                    });
                } else {
                    self.full_ctx.button("delete from favorites", async function (evt_button) {
                        const [passed, data] = await meta.del_user_favorite(photo_id);
                        if (!passed) {
                            Message_Box(self.viewport, self.viewport, consts.message_box_options)
                                .section(data.error)
                                .button("Okay");
                        } else {
                            const photos_arr = await meta.get_album_photos(self.gallery_id);
                            self.pubsub.pub("thumbs__load_thumbs", { photos_arr });
                        }
                    });
                }
            }
        });

        Promise.all([flags_promise, comment_promise, albums_promise, tags_promise]).then(() => {
            // this needs to be done after menu generation because
            // we need accurate scrollbar to be drawn for calculation
            if (!self.menu_div.is_shown()) {
                self.menu_div.show();
                self.menu_div.first.scrollTo(0, 0);
                self.menu_div.hide();
            } else {
                self.menu_div.first.scrollTo(0, 0);
            }
        });
    };

    async function update_menu_comment(self, photo_id) {
        self.comment_textarea.removeChildren().hide();
        return meta.get_photo_comment(photo_id).then(photo_comment => {
            if (!photo_comment) {
                return;
            }
            self.comment_textarea.show();
            for (const comment_para of photo_comment.split("\n")) {
                const para_dom = dom(html.div, self.comment_textarea)
                    .class("Menu_Comment_Para")
                    .setText(comment_para);
            }
        });
    };

    async function update_menu_albums(self, photo_id) {
        self.photo_albums_div.removeChildren();
        return meta.get_photo_album_ids_and_names(photo_id).then(album_ids_and_names => {
            if (album_ids_and_names) {
                for (const [album_id, album_name] of album_ids_and_names) {
                    if (album_name === "Favorites") {
                        continue; // hack. we really need to just get all public albums.
                    }
                    const album_button = dom(html.button, self.photo_albums_div)
                        .class("Bubble_Album")
                        .setText(album_name)
                        .on("click", async function () {
                            await self.pubsub.pub("before_leaving_photo");
                            self.pubsub.pub("full_to_thumbs_by_album", { album_id, album_name, photo_id });
                        });
                }
            }
        });
    };

    async function update_menu_tags(self, photo_id) {
        self.photo_tags_div.removeChildren();
        return meta.get_photo_tag_ids_and_names_and_fonts(photo_id).then(tag_ids_and_names_and_fonts => {
            if (tag_ids_and_names_and_fonts) {
                for (const [tag_id, tag_name, tag_font] of tag_ids_and_names_and_fonts) {
                    const tag_button = dom(html.button, self.photo_tags_div)
                        .class("Bubble_Tag")
                        .setText(tag_name)
                        .on("click", async function () {
                            await self.pubsub.pub("before_leaving_photo");
                            self.pubsub.pub("full_to_thumbs_by_tag", { tag_id, tag_name, photo_id });
                        });
                    self.general.funcs.set_tag_font_on_element(tag_font, tag_button.first);
                }
            }
        });
    };

    async function upload_individual_photo(self, files) {
        if (files.length === 0) {
            Dialog_Error(self.viewport, "Error:", "No photo selected for upload.");
            return;
        }
        if (files.length > 1) {
            Dialog_Error(self.viewport, "Error:", "Can only upload one photo at a time.");
            return;
        }
        const file = files[0];
        if (!/\.jpg$/.test(file.name)) {
            Dialog_Error(self.viewport, "Error:", "Can only upload a jpg at this time.");
            return;
        }

        const msg_box_options = Object.assign({ auto_close: false }, consts.message_box_options);
        const msg_box_main = Message_Box(self.viewport, self.viewport, msg_box_options)
            .section("Upload As:")
            .button("Default", () => handle("Default", "defaults"))
            .button("Thumb", () => handle("Thumb", "thumbs"))
            .button("Opposite", () => handle("Opposite", "opposites"))
            .button("Overlay", () => handle("Overlay", "overlays"))
            .button("Alternate", () => handle("Alternate", "alternates"))
            .button("Original", () => handle("Original", "originals"))
            .button("Cancel", () => msg_box_main.close());

        async function handle(photo_type, photo_folder) {
            msg_box_main.close();
            const photo_id = get_curr_photo_id(self);
            const photo_file = file;
            if (photo_folder === "defaults") {
                // get thumb
                const thumb_file = await new Promise(function (res) {
                    const msg_box_thumb = Message_Box(self.viewport, self.viewport, msg_box_options)
                        .section("Choose a Thumb:")
                        .dropzone({
                            text: "Drop a Thumb Here",
                            on_drop: async function (files) {
                                msg_box_thumb.close();
                                res(files[0]);
                            }
                        })
                        .button("Cancel", async function () {
                            msg_box_thumb.close();
                            res(null);
                        });
                });
                if (!thumb_file) {
                    return;
                }
                // confirm
                const should_upload = await new Promise(function (res) {
                    const msg_box_confirm = Message_Box(self.viewport, self.viewport, msg_box_options)
                        .section(`Ready to Upload ${photo_type}?`)
                        .button("Yes", async function () {
                            msg_box_confirm.close();
                            res(true);
                        })
                        .button("Cancel", async function () {
                            msg_box_confirm.close();
                            res(false);
                        });
                });
                // upload
                if (should_upload) {
                    const msg_box_wait = Message_Box(self.viewport, self.viewport, msg_box_options)
                        .section("Please Wait...");
                    const photo_data = await consts.get_file_data_base64(photo_file);
                    const thumb_data = await consts.get_file_data_base64(thumb_file);
                    const [passed, return_data] = await put_individual({ photo_id, photo_folder, photo_data, thumb_data });
                    msg_box_wait.close();
                    if (passed) {
                        const msg_box_success = Message_Box(self.viewport, self.viewport, msg_box_options)
                            .section("Photos have been uploaded.")
                            .button("Okay", () => msg_box_success.close());
                    } else {
                        Dialog_Error(self.viewport, "Error:", return_data.error);
                    }
                }
            } else {
                // confirm
                const should_upload = await new Promise(function (res) {
                    const msg_box_confirm = Message_Box(self.viewport, self.viewport, msg_box_options)
                        .section(`Ready to Upload ${photo_type}?`)
                        .button("Yes", async function () {
                            msg_box_confirm.close();
                            res(true);
                        })
                        .button("Cancel", async function () {
                            msg_box_confirm.close();
                            res(false);
                        });
                });
                // upload
                if (should_upload) {
                    const msg_box_wait = Message_Box(self.viewport, self.viewport, msg_box_options)
                        .section("Please Wait...");
                    const photo_data = await consts.get_file_data_base64(photo_file);
                    const [passed, return_data] = await put_individual({ photo_id, photo_folder, photo_data });
                    msg_box_wait.close();
                    if (passed) {
                        const msg_box_success = Message_Box(self.viewport, self.viewport, msg_box_options)
                            .section("Photo has been uploaded.")
                            .button("Okay", () => msg_box_success.close());
                    } else {
                        Dialog_Error(self.viewport, "Error:", return_data.error);
                    }
                }
            }
        };

        async function put_individual(request_data) {
            return new Promise(function (res) {
                Server_Request("PUT", "/upload/photos/individual")
                    .headers({ "csrf-token": consts.get_csrf_token() })
                    .listen(200, data => res([true, data ? JSON.parse(data) : undefined]))
                    .listen(null, (status, data) => res([false, data ? JSON.parse(data) : undefined]))
                    .listen("error", () => res([false]))
                    .listen("abort", () => res([false]))
                    .send(JSON.stringify(request_data));
            });
        };
    };

    async function generate_edit_dom(self) {
        // when adding a new tag, you need to refresh the galleries view. it would be better if it always did so automatically.
        /* tags */
        self.edit.tags_div = dom(html.div, self.viewport)
            .class("Edit_Tags_Div")
            .hide();
        {
            self.edit.tags_list_div = dom(html.div, self.edit.tags_div)
                .class("Edit_Tags_List_Div")
                .hide();
            self.edit.likely_tags_div = dom(html.div, self.edit.tags_div)
                .class("Edit_Likely_Tags_Div");
            /*const tags_input_clear = dom(html.div, self.edit.tags_div)
                .class(["Edit_Tags_Input_Button", "Edit_Tags_Input_Button_Left"])
                .setText("x")
                .on("click", function () {
                    edit_reset_tags_input(self);
                });*/
            const tags_input_show = dom(html.div, self.edit.tags_div)
                .class(["Edit_Tags_Input_Button", "Edit_Tags_Input_Button_Left"])
                .setText("^")
                .on("click", function () {
                    if (self.edit.tags_list_div.is_shown()) {
                        self.edit.tags_list_div.removeChildren().hide();
                    } else {
                        edit_list_tags(self);
                    }
                });
            self.edit.tags_input = dom(html.input, self.edit.tags_div)
                .class("Edit_Tags_Input")
                .placeholder("type a tag")
                .on("keyup", function (event) {
                    if (event.key === "Enter") {
                        tags_input_add.click();
                    } else if (event.key === "Delete") {
                        tags_input_del.click();
                    } else if (
                        event.key !== "ArrowLeft" && event.key !== "ArrowRight" &&
                        event.key !== "ArrowUp" && event.key !== "ArrowDown"
                    ) {
                        edit_list_likely_tags(self);
                    }
                });
            const tags_input_add = dom(html.div, self.edit.tags_div)
                .class(["Edit_Tags_Input_Button", "Edit_Tags_Input_Button_Right"])
                .setText("+")
                .on("click", async function () {
                    const tag_name = self.edit.tags_input.value();
                    if (tag_name.trim() === "") {
                        return;
                    }
                    const photo_id = self.photos_arr[self.curr_photo_idx];
                    const [passed, data] = await meta.add_photo_tag_name(photo_id, tag_name);
                    if (passed) {
                        edit_reset_tags_input(self);
                        update_menu_tags(self, photo_id);
                        if (self.edit.tags_list_div.is_shown()) {
                            edit_list_tags(self);
                        }
                    } else {
                        Message_Box(self.viewport, self.viewport, consts.message_box_options)
                            .section(data.error)
                            .button("Okay");
                    }
                });
            const tags_input_del = dom(html.div, self.edit.tags_div)
                .class(["Edit_Tags_Input_Button", "Edit_Tags_Input_Button_Right"])
                .setText("-")
                .on("click", async function () {
                    const tag_name = self.edit.tags_input.value();
                    if (tag_name.trim() === "") {
                        return;
                    }
                    const photo_id = self.photos_arr[self.curr_photo_idx];
                    const [passed, data] = await meta.del_photo_tag_name(photo_id, tag_name);
                    if (passed) {
                        edit_reset_tags_input(self);
                        update_menu_tags(self, photo_id);
                        if (self.edit.tags_list_div.is_shown()) {
                            edit_list_tags(self);
                        }
                    } else {
                        Message_Box(self.viewport, self.viewport, consts.message_box_options)
                            .section(data.error)
                            .button("Okay");
                    }
                });
            const tags_input_add_all = dom(html.div, self.edit.tags_div)
                .class(["Edit_Tags_Input_Button", "Edit_Tags_Input_Button_Right"])
                .setText("⊕")
                .on("click", async function () {
                    const tag_name = self.edit.tags_input.value();
                    if (tag_name.trim() === "") {
                        return;
                    }
                    const should_continue = await new Promise(function (res) {
                        Message_Box(self.viewport, self.viewport, consts.message_box_options)
                            .section("Are you sure you want to add tag to all photos in the gallery?")
                            .button("Yes", () => res(true))
                            .button("No", () => res(false));
                    });
                    if (should_continue) {
                        const photo_id = self.photos_arr[self.curr_photo_idx];
                        const [passed, data] = await meta.add_gallery_photos_tag_name(self.gallery_id, tag_name);
                        if (passed) {
                            edit_reset_tags_input(self);
                            update_menu_tags(self, photo_id);
                            if (self.edit.tags_list_div.is_shown()) {
                                edit_list_tags(self);
                            }
                        } else {
                            Message_Box(self.viewport, self.viewport, consts.message_box_options)
                                .section(data.error)
                                .button("Okay");
                        }
                    }
                });
            const tags_input_del_all = dom(html.div, self.edit.tags_div)
                .class(["Edit_Tags_Input_Button", "Edit_Tags_Input_Button_Right"])
                .setText("⊖")
                .on("click", async function () {
                    const tag_name = self.edit.tags_input.value();
                    if (tag_name.trim() === "") {
                        return;
                    }
                    const should_continue = await new Promise(function (res) {
                        Message_Box(self.viewport, self.viewport, consts.message_box_options)
                            .section("Are you sure you want to delete tag from all photos in the gallery?")
                            .button("Yes", () => res(true))
                            .button("No", () => res(false));
                    });
                    if (should_continue) {
                        const photo_id = self.photos_arr[self.curr_photo_idx];
                        const [passed, data] = await meta.del_gallery_photos_tag_name(self.gallery_id, tag_name);
                        if (passed) {
                            edit_reset_tags_input(self);
                            update_menu_tags(self, photo_id);
                            if (self.edit.tags_list_div.is_shown()) {
                                edit_list_tags(self);
                            }
                        } else {
                            Message_Box(self.viewport, self.viewport, consts.message_box_options)
                                .section(data.error)
                                .button("Okay");
                        }
                    }
                });
        }

        /* comment */
        self.edit.comment_div = dom(html.div, self.viewport)
            .class("Edit_Comment_Div")
            .hide();
        {
            self.edit.comment_might_need_saving = false;
            self.edit.comment_textarea = dom(html.textarea, self.edit.comment_div)
                .class("Edit_Comment_Textarea")
                .placeholder("type a comment")
                .on("keyup", async function () {
                    self.edit.comment_might_need_saving = true;
                });
            self.edit.comment_save_button = dom(html.div, self.edit.comment_div)
                .class("Edit_Comment_Button")
                .setText("Save")
                .on("click", event => {
                    edit_save_comment(self);
                });
            self.edit.comment_delete_button = dom(html.div, self.edit.comment_div)
                .class("Edit_Comment_Button")
                .setText("Delete")
                .on("click", async function () {
                    if (self.edit.comment_textarea.value().trim() !== "") {
                        const should_continue = await new Promise(function (res) {
                            Message_Box(self.viewport, self.viewport, consts.message_box_options)
                                .section("Are you sure you want to delete the comment?")
                                .button("Yes", () => res(true))
                                .button("No", () => res(false));
                        });
                        if (should_continue) {
                            self.edit.comment_textarea.value("");
                            edit_save_comment(self);
                        }
                    }
                });
        }
    };

    async function edit_list_tags(self) {
        const photo_id = self.photos_arr[self.curr_photo_idx];
        return meta.get_photo_tag_names(photo_id).then(photo_tag_names => {
            self.edit.tags_list_div.removeChildren().show();
            if (photo_tag_names) {
                for (const photo_tag_name of photo_tag_names) {
                    dom(html.div, self.edit.tags_list_div)
                        .class("Edit_Tag_Div")
                        .setText(photo_tag_name);
                }
            }
        });
    };

    async function edit_list_likely_tags(self) {
        const tag_partial = self.edit.tags_input.value();
        const tag_possibles = await meta.get_tag_possibles(tag_partial);
        self.edit.likely_tags_div.removeChildren();
        if (!tag_possibles) {
            return;
        }
        for (let tag_possible of tag_possibles) {
            dom(html.div, self.edit.likely_tags_div)
                .class("Edit_Likely_Tag_Div")
                .setText(tag_possible)
                .on("click", function () {
                    self.edit.tags_input.value(tag_possible);
                    self.edit.likely_tags_div.removeChildren();
                    self.edit.tags_input.focus();
                });
        }
    };

    async function edit_reset_tags_input(self) {
        self.edit.tags_input.value("");
        self.edit.tags_input.focus();
        self.edit.likely_tags_div.removeChildren();
    };

    async function edit_save_comment(self, should_notify = true) {
        const photo_id = self.photos_arr[self.curr_photo_idx];
        const comment = self.edit.comment_textarea.value();
        const [passed, data] = await meta.set_photo_comment(photo_id, comment);
        if (passed) {
            self.edit.comment_might_need_saving = false;
            if (should_notify) {
                update_menu_comment(self, photo_id);
                update_menu_tags(self, photo_id);
                const popup_msg = dom(html.div, self.edit.comment_div)
                    .class("Edit_Comment_Saved_Message")
                    .setText("saved")
                    .on("click", () => msg_box.remove());
                setTimeout(() => popup_msg.remove(), 1500);
            }
        } else {
            Message_Box(self.viewport, self.viewport, consts.message_box_options)
                .section(data.error)
                .button("Okay");
        }
    };

    function hide_edit(self) {
        self.edit.toggle_tags_button.hide();
        self.edit.toggle_comment_button.hide();
        self.edit.tags_div.hide();
        self.edit.comment_div.hide();
    };

    function show_edit(self) {
        self.edit.toggle_tags_button.show();
        self.edit.toggle_comment_button.show();
    };

    async function update_edit_tags(self) {
        if (self.edit.tags_list_div.is_shown()) {
            edit_list_tags(self);
        }
    };

    async function update_edit_comment(self) {
        self.edit.comment_div.show();
        const photo_id = self.photos_arr[self.curr_photo_idx];
        const comment = await meta.get_photo_comment(photo_id);
        if (comment) {
            self.edit.comment_textarea.value(comment);
        } else {
            self.edit.comment_textarea.value("");
        }
    };

    async function update_photo_edit(self) {
        if (!await should_update_photo_xhr(self)) {
            return;
        }

        if (!await meta.is_user_logged_in()) {
            hide_edit(self);
            return;
        }

        const user_type = await meta.get_user_type();
        if (user_type === "user") {
            hide_edit(self);
            return;
        }

        show_edit(self);

        if (self.edit.tags_div.is_shown()) {
            update_edit_tags(self);
        }

        if (self.edit.comment_div.is_shown()) {
            update_edit_comment(self);
        }
    };

    /* exports */
    return Full;

});
