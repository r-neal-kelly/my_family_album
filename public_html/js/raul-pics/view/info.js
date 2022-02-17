// Copyright Neal Raulerson 2019. All Rights Reserved.

"use strict";

Mary.define("raul-pics/view/info", [
    "Mary/utils",
    "Mary/dom",
    "Mary/html",
    "raul-pics/meta",
    "raul-pics/news",
    "raul-pics/css/info"
], function (utils, dom, html, meta, news_text, CSS_Info) {

    /* constructor */
    async function Info(general, pubsub, viewport) {
        /* init */
        const self = utils.newObj();
        self.general = general;
        self.pubsub = pubsub;
        self.viewport = viewport;
        self.wrapper = dom(html.div, viewport)
            .class("Info_Wrapper");
        CSS_Info(general.css);
        generate_dom(self);
        hide(self);

        /* subs */
        pubsub.sub("resize", function (data) {
            const viewport_element = self.viewport.first;
            const wrapper_element = self.wrapper.first;
            if (viewport_element.clientWidth !== wrapper_element.clientWidth) {
                const diff = viewport_element.clientWidth - wrapper_element.clientWidth;
                self.up_button.first.style["right"] = `${diff}px`;
            }
        });
        self.pubsub.sub("galleries_to_info", function (data) {
            show(self);
            self.wrapper.first.scrollTo(0, 0);
            pubsub.pub("resize");
        });
        self.pubsub.sub("info_to_galleries", function (data) {
            hide(self);
        });
        self.pubsub.sub("resize", function () {
            resize_viewport(self);
        });
    }

    /* functions */
    function show(self) {
        self.viewport.show();
    }

    function hide(self) {
        self.viewport.hide();
    }

    function resize_viewport(self) {
        const viewport_element = self.viewport.first;
        const wrapper_element = self.wrapper.first;
        const diff = viewport_element.clientWidth - wrapper_element.clientWidth;
        self.up_button.first.style["right"] = `${diff}px`;
    };

    function getDate() {
        const months = [
            "January", "February", "March", "April",
            "May", "June", "July", "August",
            "September", "October", "November", "December"
        ];
        const date_obj = new Date();
        const day = date_obj.getDate();
        const month = months[date_obj.getMonth()];
        const year = date_obj.getFullYear();

        return `${month} ${day} ${year}`;
    }

    function generate_dom(self) {
        self.up_button = dom(html.button, self.viewport)
            .setText("↑")
            .class(["Main_Button", "Up_Button"])
            .on("click", () => self.pubsub.pub("info_to_galleries"));

        // news
        const news_wrap = dom(html.div, self.wrapper)
            .class("News_Wrap");
        {
            const closed_text = "News ▼";
            const opened_text = "News ▲";
            const header = dom(html.div, news_wrap)
                .class("Wrap_Header")
                .setText(closed_text)
                .on("click", evt_click => {
                    if (body.is_shown()) {
                        header.setText(closed_text);
                        body.hide();
                        footer.hide();
                    } else {
                        header.setText(opened_text);
                        body.show();
                        footer.show();
                    }
                    resize_viewport(self);
                });
            const body = dom(html.div, news_wrap)
                .class("News_Text")
                .setHTML(news_text) // should be safe from xss
                .hide();
            const footer = dom(html.div, news_wrap)
                .class("Wrap_Footer")
                .setText(opened_text)
                .hide()
                .on("click", evt_click => {
                    header.click();
                    header.scroll_into_view();
                });
        }
        // options
        const options_wrap = dom(html.div, self.wrapper)
            .class("Options_Wrap");
        {
            const closed_text = "Options ▼";
            const opened_text = "Options ▲";
            const header = dom(html.div, options_wrap)
                .class("Wrap_Header")
                .setText(closed_text)
                .on("click", evt_click => {
                    if (body.is_shown()) {
                        header.setText(closed_text);
                        body.hide();
                    } else {
                        header.setText(opened_text);
                        body.show();
                    }
                    resize_viewport(self);
                });
            const body = dom(html.div, options_wrap)
                .class("Options_Body")
                .hide();
            {
                const to_circles_msg = "Change Thumbs to Circles!";
                const to_squares_msg = "Change Thumbs to Squares!";
                const change_thumb_mode_button = dom(html.div, body)
                    .class("Option_Button")
                    .setText(self.general.vars.curr_thumb_mode === self.general.consts.THUMB_MODE_CIRCLE ? to_squares_msg : to_circles_msg)
                    .on("click", function (event) {
                        if (self.general.vars.curr_thumb_mode === self.general.consts.THUMB_MODE_CIRCLE) {
                            self.general.vars.curr_thumb_mode = self.general.consts.THUMB_MODE_SQUARE;
                            change_thumb_mode_button.setText(to_circles_msg);
                        } else {
                            self.general.vars.curr_thumb_mode = self.general.consts.THUMB_MODE_CIRCLE;
                            change_thumb_mode_button.setText(to_squares_msg);
                        }
                        if (self.general.consts.has_local_storage) {
                            localStorage.setItem("curr_thumb_mode", self.general.vars.curr_thumb_mode);
                        }
                    });
                /*const download_site_link = dom(html.a, body)
                    .class("Download_Site_Link")
                    .attr("href='./my_family_album.zip")
                    .attr(`download='my_family_album (${getDate()}).zip'`);
                const download_site_button = dom(html.div, body)
                    .class("Option_Button")
                    .setText("Download the Site!")
                    .on("click", function () {
                        download_site_link.click();
                    });*/
            }
        }
        // stats
        const stats_wrap = dom(html.div, self.wrapper)
            .class("Stats_Wrap");
        {
            const closed_text = "Stats ▼";
            const opened_text = "Stats ▲";
            const header = dom(html.div, stats_wrap)
                .class("Wrap_Header")
                .setText(closed_text)
                .on("click", evt_click => {
                    if (body.is_shown()) {
                        header.setText(closed_text);
                        body.hide();
                    } else {
                        header.setText(opened_text);
                        body.show();
                    }
                    resize_viewport(self);
                });
            const body = dom(html.div, stats_wrap)
                .class("Stats_Body")
                .hide();
            {
                async function list_stats() {
                    body.removeChildren();
                    const stats_obj = await meta.get_stats();
                    function add_entry(key, value) {
                        dom(html.div, body)
                            .class("Stats_Entry")
                            .setText(`${key}: ${value}`);
                    };
                    add_entry("albums", stats_obj.albums);
                    add_entry("tags", stats_obj.tags);
                    add_entry("tag instances", stats_obj.tag_instances);
                    add_entry("photos", stats_obj.photos);
                    add_entry("defaults", stats_obj.defaults);
                    add_entry("opposites", stats_obj.opposites);
                    add_entry("overlays", stats_obj.overlays);
                    add_entry("alternates", stats_obj.alternates);
                    add_entry("originals", stats_obj.originals);
                    add_entry("digitals", stats_obj.digitals);
                    add_entry("physicals", stats_obj.physicals);
                    add_entry("comments", stats_obj.comments);
                    add_entry("cat pics", stats_obj.cat_pics);
                    add_entry("panda pics", stats_obj.panda_pics);
                };
                list_stats();
            }
        }
        // license
        const license_wrap = dom(html.div, self.wrapper)
            .class("License_Wrap");
        {
            const closed_text = "Licenses ▼";
            const opened_text = "Licenses ▲";
            const header = dom(html.div, license_wrap)
                .class("Wrap_Header")
                .setText(closed_text)
                .on("click", evt_click => {
                    if (body.is_shown()) {
                        header.setText(closed_text);
                        body.hide();
                    } else {
                        header.setText(opened_text);
                        body.show();
                    }
                    resize_viewport(self);
                });
            const body = dom(html.a, license_wrap)
                .class("Font_Licenses_Link")
                .setText("(click here for font licenses)")
                .attr("href='./fonts'")
                .hide();
        }
    }

    /* exports */
    return Info;

});
