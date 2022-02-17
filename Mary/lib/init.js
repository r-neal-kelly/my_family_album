// Copyright Neal Raulerson 2019. All Rights Reserved.

"use strict";

(function (root) {

    /* initialize Mary */
    const Mary = {};
    root.Mary = Mary;

    /* user variables */
    let script_folder_path = "js";
    const script_expansions = [];

    Mary.set_script_folder_path = function (path) {
        // might want to set a variable to stop this if it's too late.
        script_folder_path = path.replace(/\\/g, "/").replace(/\/+$/, "");
    }
    Mary.add_script_expansion = function (short, expansion) {
        short = cleanup_path(short);
        expansion = cleanup_path(expansion);

        if (script_expansions.find(function ([short_elem,]) {
            short_elem === short;
        })) {
            // might want to give the expansion_elem, to show what
            // module is currently using the short.
            throw new Error("already have this short in expansions");
        }

        // expansions can only occur at the beginning of the string
        // so that multiple libraries don't overwrite one another
        // in each other's scope.
        const re_short = new RegExp(`^${short}\\/`);
        const re_expansion = new RegExp(`^${expansion}\\/`);

        script_expansions.push([
            short,
            expansion,
            re_short,
            re_expansion
        ]);
        script_expansions.sort(function ([short_a,], [short_b,]) {
            if (short_a < short_b) {
                return -1;
            } else if (short_a > short_b) {
                return 1;
            } else {
                return 0;
            }
        });
    }

    Mary.add_script_expansion("Mary", "Mary/modules");

    /* general vars */
    // might want to put these in 'dom' or 'html' or something.
    if (root.document) {
        Mary.html_element = document.documentElement;
        Mary.head_element = document.head;
        Mary.body_element = document.body;
    }

    /* modules and script loading */
    const modules = {};

    function cleanup_path(path) {
        path = path.trim();
        path = path.replace(/\\/g, "/");
        path = path.replace(/^\//, "");
        if (path[path.length - 1] === "/") {
            path = path.replace(/\/$/, "");
        }
        return path;
    }

    function resolve_path(path) {
        if (/\/\s*$/.test(path)) {
            throw new Error("can only require files, not folders");
        }
        path = cleanup_path(path);
        if (!/\.js$/.test(path)) {
            path = path + ".js";
        }

        // if we do make script_expansions into an obj again
        // maybe we can just test the string until there are no
        // more section divided by "/" left, to see if it's in the obj.
        // that should be quicker if there are lots of expansions.
        for (const [short, expansion, re_short, re_expansion] of script_expansions) {
            if (!re_expansion.test(path) && re_short.test(path)) {
                path = path.replace(re_short, `${expansion}/`);
                break;
            }
        }

        return `${script_folder_path}/${path}`;
    }

    function load(path) {
        if (!modules[path]) {
            if (root.document) {
                const script = document.createElement("script");
                script.setAttribute("type", "text/javascript");
                //script.setAttribute("src", `${path}/?date=${Date.now()}`);
                script.setAttribute("src", path);
                script.async = true;
                Mary.head_element.appendChild(script);
                modules[path] = {
                    loaded: false,
                    element: script
                };
            } else {
                const EventEmitter = require("events");
                modules[path] = {
                    loaded: false,
                    element: new EventEmitter()
                };
                require(path);
            }
        }

        return new Promise(function (resolve) {
            const module = modules[path];
            if (module.loaded === true) {
                resolve();
            } else {
                if (root.document) {
                    module.element.addEventListener("mary-loaded", function () {
                        resolve();
                    });
                } else {
                    module.element.on("mary-loaded", function () {
                        resolve();
                    });
                }
            }
        });
    };

    function mary_require(req_path) {
        return modules[req_path].export;
    }

    Mary.define = async function (path = "", require_paths = [], callback) {
        if (!/\S/.test(path)) {
            throw new Error("must have a path to define a module. Use 'execute' if you don't want to define.");
        }
        path = resolve_path(path);
        if (!modules[path]) {
            throw new Error(`fatal loading error: "${path}". Make sure that each module has its own file and the right path in the define() function.`);
        }
        if (modules[path].loaded === true) {
            throw new Error("attempting to define module with path already in use");
        }
        require_paths = require_paths.map(req_path => resolve_path(req_path));
        const require_promises = require_paths.map(req_path => load(req_path));
        await Promise.all(require_promises);
        modules[path].export = await callback.apply(null, require_paths.map(mary_require));
        // we are only truly done loading here, and not when the script tag has loaded
        // because we are finally finished executing the callback that contains the module.
        // in other words, we actually have the export available for require now
        modules[path].loaded = true;
        if (root.document) {
            modules[path].element.dispatchEvent(new CustomEvent("mary-loaded"));
        } else {
            modules[path].element.emit("mary-loaded");
        }
    };

    Mary.execute = async function (require_paths = [], callback) {
        require_paths = require_paths.map(req_path => resolve_path(req_path));
        const require_promises = require_paths.map(req_path => load(req_path));
        await Promise.all(require_promises);
        return callback.apply(null, require_paths.map(mary_require));
    };

    Mary.list_loaded_modules = function () {
        return Object.keys(modules).sort();
    }

    /* exports */
    if (typeof module !== "undefined") {
        module.exports = Mary;
    } else {
        return Mary;
    }

}(this.document ? window : global));
