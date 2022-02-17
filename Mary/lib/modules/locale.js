// Copyright Neal Raulerson 2019. All Rights Reserved.

"use strict";

Mary.define("Mary/modules/locale", [
    "Mary/utils"
], function (utils) {

    const locale = utils.newObj();

    locale.is_node_js =
        typeof window === "undefined" &&
        typeof global !== "undefined" &&
        typeof module !== "undefined" &&
        typeof process !== "undefined";

    locale.is_browser =
        typeof window !== "undefined" &&
        typeof window.document !== "undefined";

    // perhaps quite unreliable...
    locale.is_iOS = (() => {
        if (typeof navigator !== "undefined") {
            return navigator.platform ?
                /iPad|iPhone|iPod/.test(navigator.platform) :
                /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        } else {
            false;
        }
    })();


    Object.freeze(locale);

    /* exports */
    return locale;

});
