// Copyright Neal Raulerson 2019. All Rights Reserved.

"use strict";

Mary.define("raul-pics/view/thumbs", [
    "Mary/utils",
    "Mary/dom",
    "Mary/html",
    "Mary/css",
    "Mary/gui/Context_Menu",
    "Mary/gui/Message_Box",
    "raul-pics/global/consts",
    "raul-pics/meta",
    "raul-pics/dialog/Link",
    "raul-pics/dialog/Zip"
], function (utils, dom, html, CSS, Context_Menu, Message_Box, consts, meta, Dialog_Link, Dialog_Zip) {

    /* constants */
    const DEFAULT_THUMBS_PER_PAGE = 50;
    const THUMB_CIRCLE_SIZE = 180;

    /* constructor */
    async function Thumbs(general, pubsub, viewport) {
        /* init */
        const self = utils.newObj();
        self.general = general;
        self.pubsub = pubsub;
        self.viewport = viewport;
        self.wrapper = dom(html.div, viewport)
            .class(["Thumbs_Wrapper", "Disabled_Text_Selection"]);
        self.css = CSS("Raul_Pics__View_Thumbs");
        self.thumbs_per_page = DEFAULT_THUMBS_PER_PAGE; // make a variable in self.general instead.
        define_css(self);
        register_subs(self);
        hide(self);
    };

    /* functions */
    function define_css(self) {
        // fixed viewport
        self.css.define("", `
            position: absolute;
            width: 100%;
            height: 100%;
            overflow: hidden;
        `);

        self.css.define(".Thumbs_Wrapper", `
            position: relative;
            width: 100%;
            height: 100%;
            overflow: auto;
            -webkit-overflow-scrolling: touch;
        `);

        // Title
        self.css.define(".Thumbs_Title_Div, .Hidden_Thumbs_Title_Div", `
            display: flex;
            width: 100%;
            max-height: 144px;
        `);

        self.css.define(".Thumbs_Title_Div", `
            position: absolute;
            top: 0;
            left: 0;
            z-index: 100;
        `);

        self.css.define(".Hidden_Thumbs_Title_Div", `
            z-index: 0;
            visibility: hidden;
        `);

        self.css.define(".Thumbs_Title_Inner_Wrap", `
            font-family: "Orkney Regular";
            color: white;
            background: rgba(0, 0, 0, 0.6);
            margin: 0;
            padding: 6px;
            border-radius: 0 18px 18px 0;
            z-index: 100;
            cursor: default;
            max-width: max-content;
            min-width: min-content;
        `);

        self.css.define(".Thumbs_Title_Break", `
            flex-basis: 72px;
            flex-shrink: 0;
        `);

        self.css.define(".Thumbs_Title_Text", `
            font-size: 17px;
            max-height: 114px;
            overflow-y: auto;
            padding: 0 2px;
        `);

        self.css.define(".Thumbs_Title_Page_Num", `
            font-family: "Orkney Regular Italic";
            font-size: 12px;
            text-align: right;
            padding-top: 5px;
            padding-right: 3px;
        `);

        // main block
        self.css.define(".Thumbs_Div", `
            position: relative;
            display: flex;
            flex-wrap: wrap;
            width: 100%;
            margin-bottom: 66px;
        `);

        self.css.define(".Thumb_Div", `
            display: flex;
            position: relative;
            justify-content: center;
            align-items: center;
            padding: 0;
            position: relative;
            overflow: hidden;
        `);

        self.css.define(".Thumb_Div_Rectangle, .Thumb_Div_Circle", `
            width: ${THUMB_CIRCLE_SIZE}px;
            height: ${THUMB_CIRCLE_SIZE}px;
            margin: 6px;
        `);

        self.css.define(".Thumb_Div_Square", `
            width: 150px;
            height: 150px;
            margin: 6px;
        `);

        self.css.define(".Thumb_Num", `
            position: absolute;
            bottom: 0;
            left: 0;
            font-family: "Orkney Regular";
            font-size: 12px;
            color: rgba(192, 192, 192, 0.6);
            cursor: default;
        `);

        self.css.define(".Thumb_Num_Circle, .Thumb_Num_Rectangle", `
            background-color: rgba(14, 31, 57, .9);
            padding: 3px 3px 0 0px;
            color: #ffffff80;
            min-width: 1.2em;
            text-align: center;
            /*border-radius: 6px;*/
        `);

        self.css.define(".Thumb_Num_Square", `
            background-color: rgba(14, 31, 57, .5);
            padding: 3px 3px 0 3px;
            color: #fffc;
            min-width: 1.2em;
            text-align: center;
        `);

        self.css.define(".Add_Thumbs_Instruction", `
            font-family: "Orkney Regular";
            font-size: 18px;
            color: rgba(255, 255, 255, 0.9);
            margin: 12px auto;
            padding: 12px;
        `);
    };

    function register_subs(self) {
        self.pubsub.sub("resize", function (data) {
            resize_viewport(self);
        });
        self.pubsub.sub("galleries_to_thumbs", function ({
            gallery_type_num, gallery_id, gallery_title_str, gallery_photos_arr, gallery_photo_idx = 0,
            is_authenticated = false, is_favorites = false
        }) {
            show(self);
            self.type_num = gallery_type_num;
            self.gallery_id = gallery_id;
            self.title_str = gallery_title_str;
            self.photos_arr = gallery_photos_arr;
            self.is_authenticated = is_authenticated;
            self.is_favorites = is_favorites;
            self.curr_page_idx = 0;
            self.total_pages = self.photos_arr.length > 0 ?
                Math.ceil(self.photos_arr.length / self.thumbs_per_page) : 1;
            goto_thumb(self, gallery_photo_idx, true); // this forces a "thumbs__load_thumbs"
        });
        self.pubsub.sub("thumbs_to_galleries", function (data) {
            hide(self);
        });
        self.pubsub.sub("thumbs_to_full", function (data) {
            hide(self);
        });
        self.pubsub.sub("full_to_thumbs", function ({ curr_photo_idx }) {
            goto_thumb(self, curr_photo_idx);
            resize_viewport(self);
        });
        self.pubsub.sub("thumbs__load_thumbs", async function (data = {}) {
            if (data.photos_arr) {
                self.photos_arr = data.photos_arr;
            }
            const first_photo_idx = self.curr_page_idx * self.thumbs_per_page; // being calc'd twice, another time in generate_dom. smells bad.
            self.page_photos_arr = self.photos_arr.slice(first_photo_idx, first_photo_idx + self.thumbs_per_page);
            await generate_dom(self);
            resize_viewport(self);
            self.wrapper.first.scrollTo(0, self.wrapper.first.scrollTop);
            self.pubsub.pub("thumbs__thumbs_loaded", {
                type_num: self.type_num,
                title_str: self.title_str,
                photos_arr: self.photos_arr,
                thumb_dom_arr: self.thumb_dom_arr,
                thumb_ctx_arr: self.thumb_ctx_arr,
                page_photos_arr: self.page_photos_arr
            });
        });
    };

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
        const diff_px = `${diff}px`;
        if (self.to_galleries_button) {
            self.to_galleries_button.first.style["right"] = diff_px;
        }
        if (self.next_page_button) {
            self.next_page_button.first.style["right"] = diff_px;
        }
    };

    async function goto_thumb(self, photo_idx, force = false) {
        show(self);
        self.curr_photo_idx = photo_idx;

        if (self.photos_arr.length === 0) {
            self.curr_page_idx = 0;
            self.pubsub.pub("thumbs__load_thumbs");
            return;
        }

        const thumb_page_idx = Math.floor(self.curr_photo_idx / self.thumbs_per_page);

        if (!force && thumb_page_idx === self.curr_page_idx) {
            put_thumb_in_view(self);
        } else {
            self.curr_page_idx = thumb_page_idx;
            await self.pubsub.pub("thumbs__load_thumbs");
            put_thumb_in_view(self);
        }

        function put_thumb_in_view(self) {
            const thumb_div = dom(".Thumb_Div", self.wrapper).eq(
                self.curr_photo_idx - (self.curr_page_idx * self.thumbs_per_page)
            );
            if (self.general.vars.is_fullscreen) {
                self.general.funcs.exit_fullscreen().then(() => {
                    if (!self.general.funcs.element_is_in_viewport(self.wrapper.first, thumb_div.first)) {
                        self.wrapper.first.scrollTo(0, thumb_div.getOffset().t - 24);
                    }
                });
            } else {
                if (!self.general.funcs.element_is_in_viewport(self.wrapper.first, thumb_div.first)) {
                    self.wrapper.first.scrollTo(0, thumb_div.getOffset().t - 24);
                }
            }
        }
    }

    // we should prob separate generating the viewport from the wrapper, and gen the viewport only once.
    async function generate_dom(self) {
        self.viewport.removeChildren();
        self.wrapper.appendTo(self.viewport).removeChildren();

        self.to_galleries_button = dom(html.button, self.viewport, 1, true)
            .setText("↑")
            .class(["Main_Button", "Up_Button"])
            .on("click", function () {
                self.pubsub.pub("thumbs_to_galleries");
            });

        if (self.photos_arr.length > self.thumbs_per_page) {
            const prev_page_button = dom(html.button, self.viewport, 1, true)
                .setText("←")
                .class(["Main_Button", "Back_Button"])
                .on("click", () => goto_prev_page(self));
            self.next_page_button = dom(html.button, self.viewport, 1, true)
                .setText("→")
                .class(["Main_Button", "Next_Button"])
                .on("click", () => goto_next_page(self));
        }

        { // Title Bar
            const info_text =
                `${self.photos_arr.length} ${self.photos_arr.length === 1 ? "pic" : "pics"}, ` +
                `page ${self.curr_page_idx + 1} of ${self.total_pages}`;
            // shown.
            const thumbs_title_div = dom(html.div, self.viewport, 1, true)
                .class("Thumbs_Title_Div");
            const thumbs_title_inner_wrap = dom(html.div, thumbs_title_div, 1, true)
                .class("Thumbs_Title_Inner_Wrap");
            const thumbs_title_break = dom(html.div, thumbs_title_div, 1, true)
                .class("Thumbs_Title_Break");
            const thumbs_title_text = dom(html.div, thumbs_title_inner_wrap, 1, true)
                .class("Thumbs_Title_Text")
                .setText(self.title_str);
            const thumbs_title_page_num = dom(html.div, thumbs_title_inner_wrap, 1, true)
                .class("Thumbs_Title_Page_Num")
                .setText(info_text);

            // hidden, for the sake of auto adjusting layout.
            const hidden_thumbs_title_div = dom(html.div, self.wrapper, 1, true)
                .class("Hidden_Thumbs_Title_Div");
            const hidden_thumbs_title_inner_wrap = dom(html.div, hidden_thumbs_title_div, 1, true)
                .class("Thumbs_Title_Inner_Wrap");
            const hidden_thumbs_title_break = dom(html.div, hidden_thumbs_title_div, 1, true)
                .class("Thumbs_Title_Break");
            const hidden_thumbs_title_text = dom(html.div, hidden_thumbs_title_inner_wrap, 1, true)
                .class("Thumbs_Title_Text")
                .setText(self.title_str);
            const hidden_thumbs_title_page_num = dom(html.div, hidden_thumbs_title_inner_wrap, 1, true)
                .class("Thumbs_Title_Page_Num")
                .setText(info_text);
            
            // this should only be done for tags and not albums/filters.
            if (self.type_num === consts.GALLERY_TYPE_TAG) {
                const possible_tag_font = await meta.get_tag_font(self.gallery_id);
                self.general.funcs.set_tag_font_on_element(possible_tag_font, thumbs_title_text.first);
                self.general.funcs.set_tag_font_on_element(possible_tag_font, hidden_thumbs_title_text.first);
            }

            // context menu
            const title_ctx = Context_Menu(self.viewport, thumbs_title_div, consts.context_menu_options)
                .section(self.title_str)
                .button("close");
            const title_ctx_zip = title_ctx.sub_menu("make a zip")
                .section("with related pics?")
                .button("yes", evt_button => {
                    Dialog_Zip(self.viewport, self.title_str, self.photos_arr, true);
                })
                .button("no", evt_button => {
                    Dialog_Zip(self.viewport, self.title_str, self.photos_arr, false);
                });
        }

        /* thumbs */
        const thumbs_div = dom(html.div, self.wrapper, 1, true)
            .class("Thumbs_Div");

        // instruction on how to add a picture.
        if (self.photos_arr.length === 0) {
            const instruction = dom(html.div, thumbs_div)
                .class("Add_Thumbs_Instruction")
                .setText("In order to add photos to your album, login, right click or tap and hold on any picture, and hit 'add to favorites'");
            return;
        }

        self.thumb_dom_arr = [];
        self.thumb_ctx_arr = [];

        let curr_photo_idx = self.curr_page_idx * self.thumbs_per_page;
        for (const photo_id of self.page_photos_arr) {
            curr_photo_idx += 1;
            const photo_src = self.general.funcs.resolve_photo_src(photo_id, "thumbs");
            const photo_name = consts.get_picture_name(self.title_str, curr_photo_idx);

            const thumb_div = dom(html.div, thumbs_div, 1, true)
                .class(["Thumb_Div", "Disabled_Text_Selection"]);
            const thumb_num = dom(html.div, thumb_div, 1, true)
                .class("Thumb_Num")
                .setText(curr_photo_idx);
            const thumb = dom(html.div, thumb_div, 1, true)
                .class("Thumb")
                .style(`background-image: url('${photo_src}')`)
                .hide();
            const thumb_ctx = Context_Menu(self.viewport, thumb, consts.context_menu_options)
                .section(curr_photo_idx)
                .button("close")
                .button("get link", () => {
                    const link_str = consts.get_link_url(self.type_num, self.gallery_id, photo_id);
                    Dialog_Link(self.viewport, link_str);
                })
                .download("download", self.general.funcs.resolve_photo_src(photo_id), `${photo_name}.jpg`);

            if (self.is_authenticated) {
                if (!self.is_favorites) {
                    thumb_ctx.button("add to favorites", async function (evt_button) {
                        const [passed, data] = await meta.add_user_favorite(photo_id);
                        if (!passed) {
                            Message_Box(self.viewport, self.viewport, consts.message_box_options)
                                .section(data.error)
                                .button("Okay");
                        }
                    });
                } else {
                    thumb_ctx.button("delete from favorites", async function (evt_button) {
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

            const is_physical = false; // temp until later.
            const is_circle = self.general.vars.curr_thumb_mode === self.general.consts.THUMB_MODE_CIRCLE;
            const is_square = self.general.vars.curr_thumb_mode === self.general.consts.THUMB_MODE_SQUARE;
            if (is_square) {
                thumb_div.class("Thumb_Div_Square");
                thumb_num.class("Thumb_Num_Square");
            } else if (is_physical) {
                thumb_div.class("Thumb_Div_Rectangle");
                thumb_num.class("Thumb_Num_Rectangle");
            } else if (is_circle) {
                thumb_div.class("Thumb_Div_Circle");
                thumb_num.class("Thumb_Num_Circle");
            }

            const thumb_img = new Image();
            new Promise(function (resolve, reject) {
                thumb_img.onload = () => resolve();
                thumb_img.onerror = () => reject();
            }).then(function () {
                const img_w = thumb_img.width;
                const img_h = thumb_img.height;
                if (is_square) {
                    if (img_w >= img_h) {
                        thumb.class("Thumb_Wide_Square");
                    } else {
                        thumb.class("Thumb_Tall_Square");
                    }
                } else {
                    const thumb_size = THUMB_CIRCLE_SIZE;
                    if (img_w >= img_h) {
                        if (is_physical) {
                            thumb.class("Thumb_Wide_Rectangle");
                        } else {
                            thumb.class("Thumb_Wide_Circle");
                        }
                        thumb
                            .style(`width: ${thumb_size}px`)
                            .style(`height: ${thumb_size * img_h / img_w}px`);
                    } else {
                        if (is_physical) {
                            thumb.class("Thumb_Tall_Rectangle");
                        } else {
                            thumb.class("Thumb_Tall_Circle");
                        }
                        thumb
                            .style(`height: ${thumb_size}px`)
                            .style(`width: ${thumb_size * img_w / img_h}px`);
                    }
                }
                thumb.show();
            });
            thumb_img.src = photo_src;
            self.thumb_dom_arr.push(thumb);
            self.thumb_ctx_arr.push(thumb_ctx);
        }

        dom(self.thumb_dom_arr).on("click", function (event, node_data) {
            self.curr_photo_idx = node_data.index + self.curr_page_idx * self.thumbs_per_page;
            const curr_photo_idx = self.curr_photo_idx;
            self.pubsub.pub("thumbs_to_full", { curr_photo_idx });
        });
    };

    async function goto_prev_page(self) {
        if (self.curr_page_idx === 0) {
            self.curr_page_idx = self.total_pages - 1;
        } else {
            self.curr_page_idx -= 1;
        }
        await self.pubsub.pub("thumbs__load_thumbs");
        self.wrapper.first.scrollTo(0, self.wrapper.first.scrollHeight);
    }

    async function goto_next_page(self) {
        self.curr_page_idx += 1;
        if (self.curr_page_idx >= self.total_pages) {
            self.curr_page_idx = 0;
        }
        await self.pubsub.pub("thumbs__load_thumbs");
        self.wrapper.first.scrollTo(0, 0);
    }

    /* exports */
    return Thumbs;

});
