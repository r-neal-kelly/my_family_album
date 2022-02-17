// Copyright Neal Raulerson 2019. All Rights Reserved.

"use strict";

Mary.define("Mary/modules/html", [
    "Mary/modules/utils"
], function (utils) {

    /* constants */
    const html = utils.proto(null, {
        div: "<div></div>",
        span: "<span></span>",
        button: "<button></button>",
        select: "<select></select>",
        textarea: "<textarea></textarea>",
        input: "<input></input>",
        checkbox: "<input type='checkbox'></input>",
        editDiv: "<div contentEditable='true'></div>",
        canvas: "<canvas></canvas>",
        img: "<img>",
        h1: "<h1></h1>",
        h2: "<h2></h2>",
        h3: "<h3></h3>",
        a: "<a></a>",
        pre: "<pre></pre>"
    });

    Object.freeze(html);

    /* exports */
    return html;

});
