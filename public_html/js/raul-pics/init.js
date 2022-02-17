// Copyright Neal Raulerson 2019. All Rights Reserved.

"use strict";

Mary.define("raul-pics/init", [
    "Mary/utils",
    "Mary/pubsub",
    "raul-pics/view/general",
    "raul-pics/view/galleries",
    "raul-pics/view/info",
    "raul-pics/view/thumbs",
    "raul-pics/view/full"
], function (utils, Pubsub, View_General, View_Galleries, View_Info, View_Thumbs, View_Full) {

    /* constructor */
    function Raul_Pics(options) {
        // options
        if (!options.top_element) {
            options.top_element = Mary.body_element;
        }
        if (!options.fonts_path) {
            options.fonts_path = "./fonts";
        }
        if (!options.photos_path) {
            options.photos_path = "./photos";
        }
        if (!options.hasOwnProperty("check_before_unload")) {
            options.check_before_unload = true;
        }
        if (!options.link) {
            options.link = null;
        }
        Object.freeze(options);

        async function init() {
            const pubsub = Pubsub();
            const general = await View_General(pubsub, options);
            await Promise.all([
                View_Galleries(general, pubsub, general.consts.wrapper_galleries),
                View_Info(general, pubsub, general.consts.wrapper_info),
                View_Thumbs(general, pubsub, general.consts.wrapper_thumbs),
                View_Full(general, pubsub, general.consts.wrapper_full)
            ]);

            pubsub.pub("resize");
            if (options.link) {
                pubsub.pub("link", { link: options.link });
            }

            if (options.check_before_unload) {
                window.addEventListener("beforeunload", function (event) {
                    const is_not_galleries =
                        !general.consts.wrapper_galleries.is_shown();
                    if (is_not_galleries) {
                        event.preventDefault();
                        event.returnValue = "";
                    }
                });
            }

            return { general, pubsub };
        };

        return { init };
    }

    /* exports */
    return Raul_Pics;

});
