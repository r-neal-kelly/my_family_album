// Copyright Neal Raulerson 2019. All Rights Reserved.

"use strict";

Mary.define("Mary/modules/css", [
    "Mary/utils",
    "Mary/parse",
    "Mary/dom"
], function (utils, parse, dom) {

    /* constructor */
    const css = function (style_id = "#Mary", is_global = false) {
        const css_obj = utils.newObj(css.prototype);
        let id = String(style_id);
        
        if (!/^#/.test(id)) {
            id = `#${id}`;
        }

        const tag = `${id}_Style`;
        if (document.querySelector(tag)) {
            css_obj.sheet = dom(tag);
        } else {
            css_obj.sheet = dom(`<style id="${tag.substring(1)}">`)
                .appendTo(Mary.head_element)
                .setText("\n");
        }

        // when global, the id needs to be blank for 'get_selector'
        // which puts the id after commas in the selector, and
        // get_style_header which leaves out blank ids.
        // this effectively means that 'local' puts the id
        // before every selector, to keep it in scope of the id,
        // whereas global is unscoped.
        css_obj.id = (id === "#Mary" || is_global) ? "" : id;

        css_obj.constructor = css;

        return css_obj;
    };

    /* functions */
    const unCss = str => str.replace(/#|\./, "");

    const get_selector = (id, selector) => {
        if (unCss(id) === unCss(selector)) {
            selector = "";
        }
        selector = selector.replace(/( +)?,( +)?/g, `, ${id} `);
        return selector;
    };

    const get_style_header = (id, selector, meta = "") => {
        let header;

        if (id && selector) {
            header = `${id} ${selector} {\n`;
        } else if (id) {
            header = `${id} {\n`;
        } else if (selector) {
            header = `${selector} {\n`;
        }

        if (meta) {
            header = `${meta} {\n  ${header}`;
        }

        return header;
    };

    /* prototype */
    css.prototype = utils.newObj();

    css.prototype.define = function (selector, rules) {
        selector = get_selector(this.id, selector);
        let style = get_style_header(this.id, selector);
        rules = utils.isString(rules) ?
            parse.css.declarations(rules) : rules;

        for (let declaration of rules) {
            declaration = (/;$/.test(declaration)) ?
                declaration : `${declaration};`;
            style += `    ${declaration}\n`;
        }
        style += "}\n";

        this.sheet.addText(style);
    }

    css.prototype.undefine = function (selector) {
        // this needs more parsing work obviously, but you get the idea.
        // this needs work!!!
        this.sheet.setText(this.sheet.getText.replace("\n" + selector, ""));
    }

    css.prototype.meta = function (meta, selector, rules) {
        selector = get_selector(this.id, selector);
        let style = get_style_header(this.id, selector, meta);
        rules = utils.isString(rules) ?
            parse.css.declarations(rules) : rules;

        for (let declaration of rules) {
            declaration = (/;$/.test(declaration)) ?
                declaration : `${declaration};`;
            style += `        ${declaration}\n`;
        }
        style += "  }\n}\n";

        this.sheet.addText(style);
    }

    css.prototype.comment = function (comment) {
        if (!/^\/\*/.test(comment)) {
            comment = `/* ${comment}`;
        }
        if (!/\*\/$/.test(comment)) {
            comment = `${comment} */`;
        }
        this.sheet.addText("\n\n" + comment);
    }

    css.prototype.has = function (selector) {
        return new RegExp(`\\s${selector}:`).test(this.sheet.getText());
    }

    // helpers
    css.prototype.color = function (r, g, b, a) {
        return `rgba(${String(r)}, ${String(g)}, ${String(b)}, ${String(a)})`;
    };

    css.prototype.white = function (alpha) {
        return this.color(255, 255, 255, alpha || 1.0);
    };

    css.prototype.black = function (alpha) {
        return this.color(0, 0, 0, alpha || 1.0);
    };

    /* exports */
    return css;

});
