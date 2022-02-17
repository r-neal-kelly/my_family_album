// Copyright Neal Raulerson 2019. All Rights Reserved.

"use strict";

Mary.define("raul-pics/view/galleries", [
    "Mary/utils",
    "Mary/dom",
    "Mary/html",
    "Mary/gui/Message_Box",
    "Mary/gui/Context_Menu",
    "raul-pics/global/consts",
    "raul-pics/meta",
    "raul-pics/filter",
    "raul-pics/dialog/Zip",
    "raul-pics/dialog/Upload_Photos",
    "raul-pics/dialog/Login",
    "raul-pics/dialog/Error",
    "raul-pics/css/galleries"
], function (utils, dom, html, Message_Box, Context_Menu, consts, meta, filter, Dialog_Zip, Dialog_Upload_Photos, Dialog_Login, Dialog_Error, CSS_Galleries) {

    /* constants */
    const album_peek_timeout_ms = 4000;

    /* constructor */
    async function Galleries(general, pubsub, viewport) {
        /* init */
        const self = utils.newObj();
        self.general = general;
        self.pubsub = pubsub;
        self.viewport = viewport;
        self.wrapper = dom(html.div, viewport)
            .class("Galleries_Wrapper");
        CSS_Galleries(self.general.css);
        register_subs(self);
        self.pubsub.pub("load_galleries");
        self.is_authenticated = false;
    };

    function register_subs(self) {
        self.pubsub.sub("load_galleries", async function () {
            const wrapper_scroll_top = self.wrapper.first.scrollTop;
            await generate_dom(self); // break this up into several generate functions and put each pub at the end
            self.pubsub.pub("galleries__loaded_albums", {
                albums_wrapper: self.albums_wrapper,
                albums: self.albums
            });
            self.wrapper.first.scrollTo(0, wrapper_scroll_top);
            self.pubsub.pub("galleries__loaded_galleries");
        });
        self.pubsub.sub("resize", function () {
            resize_viewport(self);
        });
        self.pubsub.sub("link", async function ({ link }) {
            // need to work on this some more. if it's a filter string, go through the actual filter bar?
            const link_info = await consts.get_link_info(link);
            if (!link_info) {
                return;
            }
            const {
                gallery_type_num,
                gallery_id,
                gallery_title_str,
                gallery_photos_arr,
                gallery_photo_idx
            } = link_info;
            if (gallery_type_num === self.general.consts.GALLERY_TYPE_ALBUM) {
                const gallery_dom_idx = self.albums.findIndex(album => album.album_id === gallery_id);
                self.curr_gallery_dom = self.albums[gallery_dom_idx].album_dom;
            } else if (gallery_type_num === self.general.consts.GALLERY_TYPE_TAG) {
                const gallery_dom_idx = self.tags.findIndex(tag => tag.tag_id === gallery_id);
                self.curr_gallery_dom = self.tags[gallery_dom_idx].tag_dom;
            } else {
                self.curr_gallery_dom = self.tags_filter_div;
            }
            link_info.is_authenticated = self.is_authenticated;
            await self.pubsub.pub("galleries_to_thumbs", link_info);
            if (gallery_photo_idx !== undefined) {
                self.pubsub.pub("thumbs_to_full", { curr_photo_idx: link_info.gallery_photo_idx });
            }
        });
        self.pubsub.sub("galleries_to_info", function () {
            hide(self);
            stop_album_peeks(self);
        });
        self.pubsub.sub("galleries_to_login", function () {

        });
        self.pubsub.sub("galleries_to_thumbs", function () {
            hide(self);
            stop_album_peeks(self);
        });
        self.pubsub.sub("thumbs_to_galleries", function () {
            show(self);
            start_album_peeks(self);
            if (!self.general.funcs.element_is_in_viewport(self.wrapper.first, self.curr_gallery_dom.first)) {
                self.wrapper.first.scrollBy(0, self.curr_gallery_dom.first.getBoundingClientRect().top);
            }
            resize_viewport(self);
        });
        self.pubsub.sub("full_to_thumbs_by_album", async function ({ album_id, album_name, photo_id }) {
            const gallery_type_num = self.general.consts.GALLERY_TYPE_ALBUM;
            const gallery_id = album_id;
            const gallery_title_str = album_name;
            const gallery_photos_arr = await meta.get_album_photos(album_id);
            const gallery_photo_idx = gallery_photos_arr.indexOf(photo_id);
            const gallery_dom_idx = self.albums.findIndex(album => album.album_id === album_id);
            const is_authenticated = self.is_authenticated;
            self.curr_gallery_dom = self.albums[gallery_dom_idx].album_dom;
            self.pubsub.pub("galleries_to_thumbs", { gallery_type_num, gallery_id, gallery_title_str, gallery_photos_arr, gallery_photo_idx, is_authenticated });
        });
        self.pubsub.sub("full_to_thumbs_by_tag", async function ({ tag_id, tag_name, photo_id }) {
            const gallery_type_num = self.general.consts.GALLERY_TYPE_TAG;
            const gallery_id = tag_id;
            const gallery_title_str = tag_name;
            const gallery_photos_arr = await meta.get_tag_photos(tag_id);
            const gallery_photo_idx = gallery_photos_arr.indexOf(photo_id);
            const gallery_dom_idx = self.tags.findIndex(tag => tag.tag_id === tag_id);
            const is_authenticated = self.is_authenticated;
            self.curr_gallery_dom = self.tags[gallery_dom_idx].tag_dom;
            self.pubsub.pub("galleries_to_thumbs", { gallery_type_num, gallery_id, gallery_title_str, gallery_photos_arr, gallery_photo_idx, is_authenticated });
        });
        self.pubsub.sub("info_to_galleries", function () {
            show(self);
            start_album_peeks(self);
            resize_viewport(self);
        });
        self.pubsub.sub("login", async function ({ should_notify, user_name, user_type }) {
            self.is_authenticated = true;
            if (should_notify) {
                Message_Box(self.viewport, self.viewport, consts.message_box_options)
                    .section("Logged in!")
                    .text(`${user_type}: ${user_name}`)
                    .button("Okay");
            }
            generate_user_button(self, user_name, user_type);
            show_user_variables(self);
            clearInterval(self.authenticate_interval);
            /*self.authenticate_interval = setInterval(function () {
                meta.is_user_logged_in().then(is_authenticated => {
                    if (!is_authenticated) {
                        self.pubsub.pub("logout", { should_notify: true });
                    }
                });
            }, utils.time.minutes_to_milliseconds(1));*/
        });
        self.pubsub.sub("logout", async function ({ should_notify }) {
            self.is_authenticated = false;
            if (should_notify) {
                Message_Box(self.viewport, self.viewport, consts.message_box_options)
                    .section("Logged out!")
                    .button("Okay");
            }
            clearInterval(self.authenticate_interval);
            generate_login_button(self);
            hide_user_variables(self);
        });
    };

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
        const diff = viewport_element.clientWidth - wrapper_element.clientWidth;
        self.info_button.first.style["right"] = `${diff}px`;
    };

    function start_album_peeks(self) {
        if (!self.is_peeking) {
            peek_albums(self);
            self.album_peek_handle = setInterval(peek_albums, album_peek_timeout_ms, self);
            self.is_peeking = true;
        }
    };

    function stop_album_peeks(self) {
        if (self.is_peeking) {
            clearInterval(self.album_peek_handle);
            self.is_peeking = false;
        }
    };

    function peek_albums(self) {
        if (!self.viewport.is_shown()) {
            return;
        }
        self.peek_albums.forEach(async function ([album_id, photo_dom]) {
            const photo_id = await meta.get_album_photo_random(album_id);
            if (photo_id) {
                const photo_src = self.general.funcs.resolve_photo_src(photo_id, "thumbs");
                const photo_img = new Image();
                new Promise(function (resolve) {
                    photo_img.onload = () => resolve();
                }).then(function () {
                    photo_dom
                        .style(`background-image: url('${photo_src}')`)
                        .removeClass("Thumb_Wide_Square")
                        .removeClass("Thumb_Tall_Square");
                    const img_w = photo_img.width;
                    const img_h = photo_img.height;
                    if (img_w >= img_h) {
                        photo_dom.class("Thumb_Wide_Square");
                    } else {
                        photo_dom.class("Thumb_Tall_Square");
                    }
                });
                photo_img.src = photo_src;
                // it might be a cool effect to have the timeout start here, after successful wait.
                // this would make all the pics load at different times.
            }
        });
    };

    function reset(self) {
        function blur_input_on_click(evt_click) {
            // we do this because some mobile browers will not remove keyboard otherwise.
            const input_nodes = [
                self.tags_input.first,
                self.user_variable_name_input.first,
                self.user_variable_expression_input.first
            ];
            if (!input_nodes.includes(evt_click.target)) {
                self.wrapper.focus();
            }
        };

        stop_album_peeks(self);
        self.wrapper.off(blur_input_on_click); // it's silly that we off and on it. but need to figure a better place to do it.
        self.viewport.removeChildren();
        self.wrapper.appendTo(self.viewport).removeChildren();
        self.wrapper.on("click", blur_input_on_click, { capture: true }); // capture so that if anything focuses them, it works.
    };

    function show_error_message(element, error) {
        const error_div = dom(html.div, element)
            .class("Message_Box")
            .setText(error)
            .style(`top: 0`)
            .on("click", function () {
                error_div.remove();
            });
        setTimeout(function () {
            error_div.remove();
        }, 5000);
    };

    async function set_user_variable(self) {
        const variable_name = self.user_variable_name_input.value();
        const expression = self.user_variable_expression_input.value();
        const [passed, data] = await meta.set_user_variable(variable_name, expression);
        if (passed) {
            self.user_variable_name_input.value("");
            self.user_variable_expression_input.value("");
            self.user_variable_expression_possible_tags_div.removeChildren();
            show_user_variables(self);
        } else {
            //self.general.funcs.show_dom_message(name_input_div, data.error);
            //self.general.funcs.show_dom_message(expression_input_div, data.error);
            show_error_message(self.user_variables_div, data.error);
        }
    };

    async function show_user_variables(self) {
        self.user_variables_div.show();
        const user_variables = await meta.get_user_variables();
        if (!user_variables) {
            return;
        }
        self.user_variables_view_div.removeChildren();
        for (let [variable_name, expression] of Object.entries(user_variables).sort()) {
            const expression_tag = dom(html.div, self.user_variables_view_div)
                .class("Variables_View_Expansion")
                .setText(`${variable_name} = ${expression}`);
            const destroy_button = dom(html.div, expression_tag)
                .class("Variables_View_Expansion_Destroy_Button")
                .setText("x")
                .on("click", async function () {
                    await meta.unset_user_variable(variable_name);
                    show_user_variables(self);
                });
        }
    };

    function hide_user_variables(self) {
        self.user_variables_view_div.removeChildren();
        self.user_variables_div.hide();
    };

    async function generate_login_button(self) {
        destroy_user_button(self);

        self.login_button = dom(html.button, self.viewport)
            .setText("Login")
            .class(["Main_Button", "Login_Button"])
            .on("click", function () {
                consts.get_pre_session();
                Dialog_Login(self.viewport, async function (data) {
                    self.pubsub.pub("login", {
                        should_notify: true,
                        user_name: await meta.get_user_name(),
                        user_type: await meta.get_user_type()
                    });
                });
            });
    };

    async function destroy_login_button(self) {
        if (self.login_button) {
            self.login_button.remove();
            self.login_button = undefined;
        }
    };

    async function generate_user_button(self, user_name, user_type) {
        destroy_login_button(self);

        function toggle_user_menu() {
            if (self.user_menu_outer.is_shown()) {
                self.user_button.style(`
                    border-top-right-radius
                    border-bottom-right-radius
                `);
                self.user_menu_outer.hide();
            } else {
                const left = `${self.user_button.rect().right}px`;
                self.user_button.style(`
                    border-top-right-radius: 0;
                    border-bottom-right-radius: 0;
                `);
                self.user_menu_outer.show();
                self.user_menu_outer.style(`left: ${left}`);
            }
        };

        self.user_button = dom(html.button, self.viewport)
            .class(["Main_Button", "User_Button"])
            .setText("User")
            .on("click", toggle_user_menu);
        self.user_menu_outer = dom(html.div, self.viewport)
            .class("User_Menu_Outer")
            .hide();
        self.user_menu_inner = dom(html.div, self.user_menu_outer)
            .class("User_Menu_Inner");

        const msg_box_options = Object.assign({ auto_close: false }, consts.message_box_options);
        const user_favorites_id = await meta.get_user_favorites_id();
        const user_name_div = dom(html.div, self.user_menu_inner)
            .class("User_Menu_Name_Div")
            .setText(`${user_type}: ${user_name}`);
        const logout_button = dom(html.button, self.user_menu_inner)
            .class("User_Menu_Button")
            .setText("Logout")
            .on("click", async function (evt_click) {
                const [passed, data] = await consts.logout();
                if (passed) {
                    self.pubsub.pub("logout", {
                        should_notify: true
                    });
                } else {
                    const errors_arr = data;
                    Dialog_Error(self.viewport, "Error:", errors_arr);
                }
            });
        const favorites_button = dom(html.button, self.user_menu_inner)
            .class("User_Menu_Button")
            .setText("Favorites")
            .on("click", async function (evt_click) {
                toggle_user_menu();
                const gallery_type_num = self.general.consts.GALLERY_TYPE_ALBUM;
                const gallery_id = user_favorites_id;
                const gallery_title_str = "Favorites";
                const gallery_photos_arr = await meta.get_album_photos(user_favorites_id);
                const is_authenticated = true;
                const is_favorites = true;
                self.curr_gallery_dom = self.wrapper;
                self.pubsub.pub("galleries_to_thumbs", { gallery_type_num, gallery_id, gallery_title_str, gallery_photos_arr, is_authenticated, is_favorites });
            });
        if (user_type === "admin") {
            const add_album_button = dom(html.button, self.user_menu_inner)
                .class("User_Menu_Button")
                .setText("Add Album")
                .on("click", async function () {
                    toggle_user_menu();
                    let name_input;
                    Message_Box(self.viewport, self.viewport, consts.message_box_options)
                        .section("Name the Album:")
                        .input("type an album name", data => name_input = data.input)
                        .button("Okay", async function () {
                            await meta.add_album(name_input.value());
                            generate_albums(self);
                        })
                        .button("Cancel");
                });
            const backup_meta_button = dom(html.button, self.user_menu_inner)
                .class("User_Menu_Button")
                .setText("Backup Meta Data")
                .on("click", async function () {
                    toggle_user_menu();
                    const please_wait_msg_box = Message_Box(self.viewport, self.viewport, msg_box_options)
                        .section("Please wait...");
                    const [passed, data] = await meta.backup();
                    please_wait_msg_box.close();
                    if (passed) {
                        const [did_backup, error] = data.results;
                        if (did_backup) {
                            Message_Box(self.viewport, self.viewport, msg_box_options)
                                .section("Backed up Meta Data.")
                                .button("Okay");
                        } else {
                            Dialog_Error(self.viewport, "Request to server failed.", error);
                        }
                    } else {
                        Dialog_Error(self.viewport, "Request to server failed.");
                    }
                });
        }
        if (user_type !== "user") {
            const validate_button = dom(html.button, self.user_menu_inner)
                .class("User_Menu_Button")
                .setText("Validate Meta Data")
                .on("click", async function () {
                    toggle_user_menu();
                    const please_wait_msg_box = Message_Box(self.viewport, self.viewport, msg_box_options)
                        .section("Please wait...");
                    const results = await meta.is_valid();
                    please_wait_msg_box.close();
                    if (results) {
                        const [passed, errors] = results;
                        if (passed) {
                            Message_Box(self.viewport, self.viewport, msg_box_options)
                                .section("Meta Data is Valid.")
                                .button("Okay");
                        } else {
                            Dialog_Error(self.viewport, "Meta Data Failed Validation!", errors);
                        }
                    }
                });
            const clean_tags_button = dom(html.button, self.user_menu_inner)
                .class("User_Menu_Button")
                .setText("Clean Tags")
                .on("click", async function () {
                    toggle_user_menu();
                    const please_wait_msg_box = Message_Box(self.viewport, self.viewport, msg_box_options)
                        .section("Please wait...");
                    const results = await meta.del_tags_unused();
                    please_wait_msg_box.close();
                    if (results) {
                        const [passed, data] = results;
                        if (passed) {
                            const del_tag_names = data.del_tag_names;
                            if (del_tag_names.length > 0) {
                                const msg_box = Message_Box(self.viewport, self.viewport, msg_box_options)
                                    .section("The following tags were removed:");
                                for (const del_tag_name of del_tag_names) {
                                    msg_box.text(del_tag_name);
                                }
                                msg_box.button("Okay");
                            } else {
                                Message_Box(self.viewport, self.viewport, msg_box_options)
                                    .section("No tags were removed.")
                                    .button("Okay");
                            }
                        } else {
                            Dialog_Error(self.viewport, "Error:", data.error);
                        }
                    }
                });
        }
    };

    async function destroy_user_button(self) {
        if (self.user_button) {
            self.user_button.remove();
            self.user_menu_outer.remove();
            self.user_button = undefined;
            self.user_menu_outer = undefined;
            self.user_menu_inner = undefined;
        }
    };

    async function generate_albums(self) {
        self.albums_wrapper.removeChildren();
        self.peek_albums = [];
        self.albums = [];
        for (const [album_id, album_name] of await meta.get_album_ids_and_names_by_user_id("S2WEv9")) { // hack...
            const album_div = dom(html.div, self.albums_wrapper)
                .class(["Gallery", "Album"])
                .on("click", async function (event) {
                    const gallery_type_num = self.general.consts.GALLERY_TYPE_ALBUM;
                    const gallery_id = album_id;
                    const gallery_title_str = album_name;
                    const gallery_photos_arr = await meta.get_album_photos(album_id);
                    const is_authenticated = self.is_authenticated;
                    self.curr_gallery_dom = album_div;
                    self.pubsub.pub("galleries_to_thumbs", { gallery_type_num, gallery_id, gallery_title_str, gallery_photos_arr, is_authenticated });
                });
            const album_text = dom(html.div, album_div)
                .class("Album_Text")
                .setText(album_name);
            const album_peek = dom(html.div, album_div)
                .class("Album_Peek");
            const album_peek_pic = dom(html.div, album_peek)
                .class("Thumb")
                .style("border: 0");
            const album_ctx = Context_Menu(self.viewport, album_div, consts.context_menu_options)
                .section(album_name)
                .button("close");
            const album_ctx_zip = album_ctx.sub_menu("make a zip")
                .section("with related pics?")
                .button("yes", async function (evt_button) {
                    const album_photos_arr = await meta.get_album_photos(album_id);
                    Dialog_Zip(self.viewport, album_name, album_photos_arr, true);
                })
                .button("no", async function (evt_button) {
                    const album_photos_arr = await meta.get_album_photos(album_id);
                    Dialog_Zip(self.viewport, album_name, album_photos_arr, false);
                })
                .button("cancel");
            album_ctx.button("upload photos", async function () {
                Dialog_Upload_Photos(self.viewport, album_id);
            }, async function () {
                return await meta.is_user_logged_in() && await meta.get_user_type() === "admin";
            });

            // combine these two together.
            self.albums.push({
                album_id: album_id,
                album_name: album_name, // prob. shouldn't cache
                album_dom: album_div,
                album_text_dom: album_text
            });
            self.peek_albums.push([album_id, album_peek_pic]);
        }

        // album peeks
        self.on_visibility_change = function () {
            if (document[self.general.consts.api_hidden]) {
                stop_album_peeks(self);
            } else {
                if (self.wrapper.is_shown()) {
                    start_album_peeks(self);
                }
            }
        };
        document.removeEventListener(self.general.consts.api_visibility_change, self.on_visibility_change); // in case it was already there
        document.addEventListener(self.general.consts.api_visibility_change, self.on_visibility_change);
        start_album_peeks(self);
    };

    async function generate_filter(self) {
        const tags_filter_div = self.tags_filter_div;
        const tags_input_div = dom(html.div, tags_filter_div)
            .class("Tags_Input_Div");
        self.tags_input_div = tags_input_div;
        const tags_input_clear_button = dom(html.div, tags_input_div)
            .class("Tags_Input_Button")
            .setText("x")
            .on("click", () => {
                self.tags_input
                    .value("")
                    .focus();
                likely_tags_div
                    .removeChildren();
            });
        self.tags_input = dom(html.input, tags_input_div)
            .class("Tags_Input")
            .placeholder("filter tags")
            .on("click", (event) => {
                event.stopPropagation();
                list_likely_tags(self.tags_input, likely_tags_div);
            })
            .on("keyup", (event) => {
                if (event.key === "Enter") {
                    event.preventDefault();
                    test_and_publish_results();
                } else if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
                    list_likely_tags(self.tags_input, likely_tags_div);
                }
            });
        const tags_input_enter_button = dom(html.div, tags_input_div)
            .class("Tags_Input_Button")
            .setText("✓")
            .on("click", () => {
                test_and_publish_results();
            });
        const likely_tags_div = dom(html.div, tags_input_div)
            .class("Likely_Tags_Div");

        // options
        const options_obj = {
            is_always_fuzzy: false
        };
        const options_div = dom(html.div, tags_filter_div)
            .class("Filter_View_Div");
        {
            const closed_text = "Show Options";
            const opened_text = "Hide Options";
            const toggle_button = dom(html.div, options_div)
                .class("Filter_Toggle_Button")
                .setText(closed_text)
                .on("click", function () {
                    if (inner_div.is_shown()) {
                        inner_div.hide();
                        toggle_button.setText(closed_text);
                    } else {
                        inner_div.show();
                        toggle_button.setText(opened_text);
                    }
                });
            const inner_div = dom(html.div, options_div)
                .class("Options_Inner_Div")
                .hide();
            {
                const always_fuzzy_wrap = dom(html.div, inner_div)
                    .class("Filter_Option_Wrap");
                {
                    const checkbox = dom(html.checkbox, always_fuzzy_wrap)
                        .class("Filter_Option_Checkbox");
                    const text = dom(html.div, always_fuzzy_wrap)
                        .class("Filter_Option_Text")
                        .setText("Always Fuzzy");
                    const glass = dom(html.div, always_fuzzy_wrap)
                        .class("Filter_Option_Glass")
                        .on("click", evt_click => {
                            evt_click.stopPropagation();
                            if (checkbox.is_checked()) {
                                checkbox.uncheck();
                                options_obj.is_always_fuzzy = false;
                            } else {
                                checkbox.check();
                                options_obj.is_always_fuzzy = true;
                            }
                        });
                }
            }
        }

        { // vars
            let name_input_div, expression_input_div;

            self.user_variables_div = dom(html.div, tags_filter_div)
                .class("Filter_View_Div")
                .hide();
            {
                const variables_closed_text = "Show Variables";
                const variables_opened_text = "Hide Variables";
                const variables_toggle_button = dom(html.div, self.user_variables_div)
                    .class("Filter_Toggle_Button")
                    .setText(variables_closed_text)
                    .on("click", function () {
                        if (variables_toggle_button.getText() === variables_closed_text) {
                            variables_inner_div.show();
                            variables_toggle_button.setText(variables_opened_text);
                        } else {
                            variables_inner_div.hide();
                            variables_toggle_button.setText(variables_closed_text);
                        }
                    });
                const variables_inner_div = dom(html.div, self.user_variables_div)
                    .class("Variables_Inner_Div")
                    .hide();
                {
                    const variables_set_div = dom(html.div, variables_inner_div)
                        .class("Variables_Set_Div");
                    {
                        const name_wrap = dom(html.div, variables_set_div)
                            .class("Variable_Name_Wrap");
                        {
                            const let_text = dom(html.div, name_wrap)
                                .class("Variables_Text")
                                .setText("let");
                            name_input_div = dom(html.div, name_wrap)
                                .class("Variables_Input_Div");
                            {
                                const clear_button = dom(html.div, name_input_div)
                                    .class("Tags_Input_Button")
                                    .setText("x")
                                    .on("click", () => {
                                        self.user_variable_name_input
                                            .value("")
                                            .focus();
                                    });
                                self.user_variable_name_input = dom(html.input, name_input_div)
                                    .class("Tags_Input")
                                    .placeholder("variable name")
                                    .on("keyup", (event) => {
                                        if (event.key === "Enter") {
                                            event.preventDefault();
                                            set_user_variable(self);
                                        }
                                    });
                            }
                        }
                        const expression_wrap = dom(html.div, variables_set_div)
                            .class("Variable_Expression_Wrap");
                        {
                            const equal_text = dom(html.div, expression_wrap)
                                .class("Variables_Text")
                                .setText("=");
                            expression_input_div = dom(html.div, expression_wrap)
                                .class("Variables_Input_Div");
                            {
                                self.user_variable_expression_possible_tags_div = dom(html.div, expression_input_div)
                                    .class("Likely_Tags_Div");
                                const clear_button = dom(html.div, expression_input_div)
                                    .class("Tags_Input_Button")
                                    .setText("x")
                                    .on("click", () => {
                                        self.user_variable_expression_input
                                            .value("")
                                            .focus();
                                        self.user_variable_expression_possible_tags_div
                                            .removeChildren();
                                    });
                                self.user_variable_expression_input = dom(html.input, expression_input_div)
                                    .class("Tags_Input")
                                    .placeholder("variable expression")
                                    .on("click", (event) => {
                                        list_likely_tags(self.user_variable_expression_input, self.user_variable_expression_possible_tags_div);
                                    })
                                    .on("keyup", (event) => {
                                        if (event.key === "Enter") {
                                            event.preventDefault();
                                            set_user_variable(self);
                                        } else if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
                                            list_likely_tags(self.user_variable_expression_input, self.user_variable_expression_possible_tags_div);
                                        }
                                    });
                            }
                            const enter_button = dom(html.div, expression_wrap)
                                .class("Variables_Input_Button")
                                .setText("ok") // ✓
                                .on("click", () => {
                                    set_user_variable(self);
                                });
                        }
                    }
                    self.user_variables_view_div = dom(html.div, variables_inner_div)
                        .class("Variables_View_Div");
                }
            }
        }

        const help_div = dom(html.div, tags_filter_div)
            .class("Filter_View_Div");
        {
            const help_closed_text = "Show Help";
            const help_opened_text = "Hide Help";
            const help_toggle_button = dom(html.div, help_div)
                .class("Filter_Toggle_Button")
                .setText(help_closed_text)
                .on("click", function () {
                    if (help_toggle_button.getText() === help_closed_text) {
                        help_inner_div.show();
                        help_toggle_button.setText(help_opened_text);
                    } else {
                        help_inner_div.hide();
                        help_toggle_button.setText(help_closed_text);
                    }
                });
            const help_inner_div = dom(html.div, help_div)
                .class("Help_Inner_Div")
                .hide();
            {
                const operators_div = dom(html.div, help_inner_div)
                    .class("Help_Section_Div");
                {
                    const header = dom(html.div, operators_div)
                        .class("Help_Header")
                        .setText("Operators");

                    function create_op_div(symbol_str, title_str, talk_str) {
                        const op_div = dom(html.div, operators_div)
                            .class("Operator_Bubble_Div");
                        {
                            const symbol = dom(html.div, op_div)
                                .class("Operator_Symbol_Div")
                                .setText(symbol_str);
                            const explain = dom(html.div, op_div)
                                .class("Operator_Explain_Div")
                            {
                                const title = dom(html.div, explain)
                                    .class("Operator_Title_Div")
                                    .setText(title_str);
                                const talk = dom(html.div, explain)
                                    .class("Operator_Talk_Div")
                                    .setText(talk_str);
                            }
                        }
                        return op_div;
                    }

                    const op_and_div = create_op_div("&", "AND", "Finds a photo that matches both operands.");
                    const op_or_div = create_op_div("|", "OR", "Finds a photo that matches either operand.");
                    const op_xor_div = create_op_div("^", "XOR", "Finds a photo that matches either operand, but not both.");
                    const op_not_div = create_op_div("!", "NOT", "Finds a photo that does not match its operand.");
                    const op_fuzzy_div = create_op_div("*", "FUZZY", "Finds a photo that somewhat matches its operand.");
                    const op_comment_div = create_op_div("@", "COMMENT", "Finds a photo with a comment that somewhat matches its operand.");
                    const op_group_div = create_op_div("()", "GROUP", "Changes the order of operations, just like in math.");
                }
                const examples_div = dom(html.div, help_inner_div)
                    .class("Help_Section_Div");
                {
                    const header = dom(html.div, examples_div)
                        .class("Help_Header")
                        .setText("Examples");

                    async function create_example_div(expression_str) {
                        const example_div = dom(html.div, examples_div)
                            .class("Example_Bubble_Div");
                        {
                            const [passed, data] = await filter.execute(expression_str);
                            if (!passed) {
                                console.log(data.error);
                                return; // can display error message from data.error
                            }
                            const title = dom(html.div, example_div)
                                .class("Example_Title_Div")
                                .setText(`${data.expression}`);
                            const thumbs = dom(html.div, example_div)
                                .class("Example_Thumbs_Div");
                            {
                                const photos_arr = data.matches;
                                const random_arr = [];
                                const random_count = photos_arr.length >= 3 ? 3 : photos_arr.length;
                                while (random_arr.length < random_count) {
                                    let photo_id = photos_arr[utils.random(0, photos_arr.length - 1)];
                                    while (random_arr.includes(photo_id)) {
                                        photo_id = photos_arr[utils.random(0, photos_arr.length - 1)];
                                    }
                                    random_arr.push(photo_id);
                                }
                                for (let photo_id of random_arr) {
                                    const photo_src = self.general.funcs.resolve_photo_src(photo_id, "thumbs");
                                    const thumb_wrap = dom(html.div, thumbs)
                                        .class("Example_Thumb_Wrap");
                                    const thumb = dom(html.div, thumb_wrap)
                                        .class(["Thumb", "Thumb_Square"])
                                        .style(`background-image: url('${photo_src}')`)
                                        .style(["border: 0", "cursor: default"]);
                                }
                            }
                        }
                    }

                    create_example_div("Dog | Cat");
                    create_example_div("Karen Ann Powell & Solo");
                    create_example_div("Elizabeth 'Betty' 'Nana' Mae Henderson Powell ^ Kenneth 'Kenny' Powell");
                    create_example_div("Linda Jessie Henderson & ! Is Physical");
                    create_example_div("*powell");
                    create_example_div("*(henderson & !powell)");
                    create_example_div("*(kim & karen & kevin) & !*(betty | kenny | paw paw | maw maw) & Is Digital");
                    create_example_div("*powell & *(henderson & !betty)");
                    create_example_div("@nana");
                }
                const help_close_button = dom(html.div, help_inner_div)
                    .class("Filter_Toggle_Button")
                    .setText(help_opened_text)
                    .on("click", function () {
                        self.wrapper.first.scrollBy(0, self.tags_filter_div.rect().top);
                        help_toggle_button.click();
                    });
            }
        }

        async function test_and_publish_results() {
            let expression = self.tags_input.value().trim();
            if (options_obj.is_always_fuzzy) {
                expression = "*(" + expression + ")";
            }

            const [passed, data] = await filter.execute(expression);
            if (!passed) {
                self.general.funcs.show_dom_message(tags_input_div, data.error);
                self.tags_input.focus();
                return;
            }

            if (data.matches.length) {
                likely_tags_div.removeChildren();
                self.curr_gallery_dom = self.tags_filter_div;
                self.pubsub.pub("galleries_to_thumbs", {
                    gallery_type_num: self.general.consts.GALLERY_TYPE_FILTER,
                    gallery_id: data.expression,
                    gallery_title_str: data.expression,
                    gallery_photos_arr: data.matches,
                    is_authenticated: self.is_authenticated
                });
                self.tags_input.blur();
            } else {
                self.general.funcs.show_dom_message(tags_input_div, "no results");
                self.tags_input.focus();
            }
        };

        async function list_likely_tags(input, likley_tags_div) {
            const [passed, data] = await filter.get_possible_operands(input.value(), input.first.selectionStart);

            if (!passed) {
                self.general.funcs.show_dom_message(tags_input_div, data.error);
                self.tags_input.focus();
                return;
            }

            const { possible_operands: likely_tags_arr, from, to_exclusive } = data;
            likley_tags_div.removeChildren();
            for (let likely_tag_str of likely_tags_arr) {
                dom(html.div, likley_tags_div)
                    .class("Likely_Tag")
                    .setText(likely_tag_str)
                    .on("click", function () {
                        let filter_str = input.value();
                        let filter_arr = filter_str.split("");
                        filter_arr.splice(from, to_exclusive - from, ` ${likely_tag_str} `);
                        filter_str = filter_arr.join("");
                        let front_space_count = 0;
                        const re_front_space_results = /^\s+/.exec(filter_str);
                        if (re_front_space_results) {
                            front_space_count = re_front_space_results.length;
                        }
                        filter_str = filter_str.trim();
                        input.value(filter_str);
                        likley_tags_div.removeChildren();
                        input.focus();
                        input.first.selectionStart = from + likely_tag_str.length + 1 - front_space_count;
                        input.first.selectionEnd = input.first.selectionStart;
                    });
            }
        }
    };

    async function generate_tags(self) {
        const wrap_tags = self.tags_wrapper;
        const alphabet_obj = {};
        self.tags = [];
        for (const [tag_id, tag_name, tag_font] of await meta.get_tag_ids_and_names_and_fonts()) {
            const char = tag_name[0] < '0' || tag_name[0] > '9' ? tag_name[0].toUpperCase() : '#';
            if (!alphabet_obj[char]) {
                const alphabet_tag_div = dom(html.div, wrap_tags)
                    .class("Alphabet_Tag_Div");
                const alphabet_tag_header = dom(html.div, alphabet_tag_div)
                    .class("Alphabet_Tag_Header")
                    .setText(char);
                const alphabet_tag_body = dom(html.div, alphabet_tag_div)
                    .class("Alphabet_Tag_Body");
                alphabet_obj[char] = alphabet_tag_body;
            }
            const tag_div = dom(html.div, alphabet_obj[char])
                .class(["Gallery", "Bubble_Tag"])
                .setText(tag_name)
                .on("click", async function (event) {
                    const gallery_type_num = self.general.consts.GALLERY_TYPE_TAG;
                    const gallery_id = tag_id;
                    const gallery_title_str = tag_name;
                    const gallery_photos_arr = await meta.get_tag_photos(tag_id);
                    const is_authenticated = self.is_authenticated;
                    self.curr_gallery_dom = tag_div;
                    self.pubsub.pub("galleries_to_thumbs", { gallery_type_num, gallery_id, gallery_title_str, gallery_photos_arr, is_authenticated });
                });
            const tag_ctx = Context_Menu(self.viewport, tag_div, consts.context_menu_options)
                .section(tag_name)
                .button("close");
            const tag_ctx_zip = tag_ctx.sub_menu("make a zip")
                .section("with related pics?")
                .button("yes", async function (evt_button) {
                    const tag_photos_arr = await meta.get_tag_photos(tag_id);
                    Dialog_Zip(self.viewport, tag_name, tag_photos_arr, true);
                })
                .button("no", async function (evt_button) {
                    const tag_photos_arr = await meta.get_tag_photos(tag_id);
                    Dialog_Zip(self.viewport, tag_name, tag_photos_arr, false);
                });
            self.general.funcs.set_tag_font_on_element(tag_font, tag_div.first);
            self.tags.push({
                tag_id: tag_id,
                tag_name: tag_name,
                tag_dom: tag_div
            });
        }
        self.pubsub.pub("loaded_galleries_tags", {
            tags_wrapper: wrap_tags,
            tags: self.tags
        });
    };

    async function generate_dom(self) {
        reset(self);

        self.info_button = dom(html.button, self.viewport)
            .setText("?")
            .class(["Main_Button", "Info_Button"])
            .on("click", function () {
                self.pubsub.pub("galleries_to_info");
            });

        self.albums_wrapper = dom(html.div, self.wrapper)
            .class("Albums_Wrapper");
        self.tags_filter_div = dom(html.div, self.wrapper)
            .class("Tags_Filter_Div");
        self.tags_wrapper = dom(html.div, self.wrapper)
            .class("Wrap_Tags");

        await Promise.all([
            generate_albums(self),
            generate_filter(self),
            generate_tags(self),
        ]);

        resize_viewport(self);

        const user_is_logged_in = await meta.is_user_logged_in();
        if (user_is_logged_in === true) {
            self.pubsub.pub("login", {
                should_notify: false,
                user_name: await meta.get_user_name(),
                user_type: await meta.get_user_type()
            });
        } else {
            self.pubsub.pub("logout", {
                should_notify: false
            });
        }
    };

    /* exports */
    return Galleries;

});
