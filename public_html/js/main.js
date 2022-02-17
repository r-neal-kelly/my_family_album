// Copyright Neal Raulerson 2019. All Rights Reserved.

"use strict";

Mary.execute([
    "Mary/parse",
    "raul-pics/init.js"
], function (parse, Raul_Pics) {
    
    Raul_Pics({
        top_element: Mary.body_element,
        fonts_path: "./fonts",
        photos_path: "./photos",
        check_before_unload: true,
        link: document.location.search ? parse.url.query(document.location.search) : null
    }).init();

});
