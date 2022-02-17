// Copyright Neal Raulerson 2019. All Rights Reserved.

"use strict";

/* requires */
const consts = require("./consts.js");
const meta = require("./meta.js");

/* constants */
const FLAG_END = 1;
const FLAG_TAG = 2;
const FLAG_NOT = 3;
const FLAG_AND = 4; // this and FLAG_TAG are essentially the same
const FLAG_XOR = 5;
const FLAG_OR = 6;
const FLAG_FUZZY = 7;
const FLAG_COMMENT = 8;
const NULL_OUT = -1;
const NULL_VAR = -1;
const EXEC_DEFAULT = 0;
const EXEC_FUZZY = 1;
const EXEC_COMMENT = 2;

// currently ops must be one char long.
// there are still loose parens in here.
const OP_OPEN_PAREN = "(";
const OP_CLOSE_PAREN = ")";
const OP_NOT = "!";
const OP_AND = "&";
const OP_OR = "|";
const OP_XOR = "^";
const OP_FUZZY = "*";
const OP_COMMENT = "@";
const ops_arr = [
    OP_OPEN_PAREN,
    OP_CLOSE_PAREN,
    OP_AND,
    OP_OR,
    OP_XOR,
    OP_NOT,
    OP_FUZZY,
    OP_COMMENT
];
const ops_binary_arr = [
    OP_AND,
    OP_OR,
    OP_XOR
];
const ops_unary_arr = [
    OP_NOT,
    OP_FUZZY,
    OP_COMMENT
];

const re_operator_str = consts.utils_regex_from(ops_arr, "[]", true);
const re_operand_str = consts.utils_regex_from(ops_arr, "[^]", true);
const re_operator = new RegExp(re_operator_str);
const re_operand = new RegExp(re_operand_str);
const re_g_operator = new RegExp(re_operator_str, "g");
const re_g_operator_and_space = new RegExp(`\\s*(${re_operator_str})\\s*`, "g");

const re_not_a_good_op_str = consts.utils_regex_from(ops_arr.filter(op => op !== OP_CLOSE_PAREN), "[^]", true);
const re_unary_and_open_paren_op_str = consts.utils_regex_from(ops_unary_arr.concat(OP_OPEN_PAREN), "[]", true);
const re_bad_unary_op = new RegExp(`${re_not_a_good_op_str}(${re_unary_and_open_paren_op_str})`);

const re_binary_op_str = consts.utils_regex_from(ops_binary_arr, "[]", true);
const re_binary_op = new RegExp(re_binary_op_str);
const re_binary_double_op = new RegExp(`${re_binary_op_str}{2,}`);

const re_empty_parens = new RegExp(`\\(\\s*\\)`);

/* private statics */
function normalize(query_str) {
    query_str = query_str.replace(re_g_operator_and_space, "$1");
    query_str = query_str.trim();
    return query_str;
};

function split(filter_str) {
    const SPLIT_CHAR = "\uFFFF";
    const filter_arr = filter_str.replace(re_g_operator_and_space, `${SPLIT_CHAR}$&${SPLIT_CHAR}`)
        .split(SPLIT_CHAR)
        .map(item => item.trim())
        .filter(item => item !== "");
    return filter_arr;
};

function compile(query_str) {
    // precedence: 0: (), 1: OP_NOT, OP_FUZZY, OP_COMMENT, 2: OP_AND, 3: OP_XOR, 4: OP_OR
    const system = {
        flags: [],
        outs: [],
        vars: [],
        length: 0
    };
    const operators = [];
    const fragments = [];
    let op;

    function evaluate() {
        if (op === OP_NOT || op === OP_FUZZY || op === OP_COMMENT) {
            // give a match to unary interior frag, and make it a closed system.
            const match_system_idx = system.length;
            system.length += 1;
            system.flags[match_system_idx] = FLAG_END;
            system.outs[match_system_idx] = NULL_OUT;
            system.vars[match_system_idx] = NULL_VAR;

            const operand_frag = fragments.pop();
            for (let system_idx of operand_frag.outs) {
                system.outs[system_idx] = match_system_idx;
            }

            let flag;
            if (op === OP_NOT) {
                flag = FLAG_NOT;
            } else if (op === OP_FUZZY) {
                flag = FLAG_FUZZY;
            } else {
                flag = FLAG_COMMENT;
            }
            const operator_frag = {
                system_idx: system.length,
                outs: [system.length]
            };
            system.length += 1;
            system.flags[operator_frag.system_idx] = flag;
            system.outs[operator_frag.system_idx] = NULL_OUT;
            system.vars[operator_frag.system_idx] = operand_frag.system_idx;
            fragments.push(operator_frag);
        } else if (op === OP_AND) {
            const back_frag = fragments.pop();
            const front_frag = fragments.pop();
            for (let out_idx of front_frag.outs) {
                system.outs[out_idx] = back_frag.system_idx;
            }
            front_frag.outs = back_frag.outs;
            fragments.push(front_frag);
        } else if (op === OP_XOR || op === OP_OR) {
            const back_frag = fragments.pop();
            const front_frag = fragments.pop();
            const operator_frag = {
                system_idx: system.length,
                outs: front_frag.outs.concat(back_frag.outs)
            };
            system.length += 1;
            system.flags[operator_frag.system_idx] = op === OP_XOR ? FLAG_XOR : FLAG_OR;
            system.outs[operator_frag.system_idx] = back_frag.system_idx;
            system.vars[operator_frag.system_idx] = front_frag.system_idx;
            fragments.push(operator_frag);
        }
    }

    const query_arr = split(query_str);
    const END_OF_QUERY = "\uF001";
    query_arr.push(END_OF_QUERY);

    for (let x of query_arr) {
        if (x === "(") {
            operators.push(x);
        } else if (x === ")") {
            while (op = operators.pop(), op !== "(") {
                evaluate();
            }
        } else if (x === OP_NOT || x === OP_FUZZY || x === OP_COMMENT) {
            // remember, right associative does not need to eval same precedence in this algorithm
            operators.push(x);
        } else if (x === OP_AND) {
            while (op = operators[operators.length - 1], op === OP_NOT || op === OP_FUZZY || op === OP_COMMENT || op === OP_AND) {
                evaluate();
                operators.pop();
            }
            operators.push(OP_AND);
        } else if (x === OP_XOR) {
            while (op = operators[operators.length - 1], op === OP_NOT || op === OP_FUZZY || op === OP_COMMENT || op === OP_AND || op === OP_XOR) {
                evaluate();
                operators.pop();
            }
            operators.push(OP_XOR);
        } else if (x === OP_OR) {
            while (op = operators[operators.length - 1], op === OP_NOT || op === OP_FUZZY || op === OP_COMMENT || op === OP_AND || op === OP_XOR || op === OP_OR) {
                evaluate();
                operators.pop();
            }
            operators.push(OP_OR);
        } else if (x !== END_OF_QUERY) {
            // is a tag
            const tag = x;
            const frag = {
                system_idx: system.length,
                outs: [system.length]
            };
            system.length += 1;
            system.flags[frag.system_idx] = FLAG_TAG;
            system.outs[frag.system_idx] = NULL_OUT;
            system.vars[frag.system_idx] = tag;
            fragments.push(frag);
        } else {
            // END_OF_QUERY
            while (op = operators[operators.length - 1], operators.length !== 0) {
                evaluate();
                operators.pop();
            }

            const match_system_idx = system.length;
            system.length += 1;
            system.flags[match_system_idx] = FLAG_END;
            system.outs[match_system_idx] = NULL_OUT;
            system.vars[match_system_idx] = NULL_VAR;

            const frag = fragments.pop();
            for (let system_idx of frag.outs) {
                system.outs[system_idx] = match_system_idx;
            }

            const system_start = frag.system_idx;
            return { system, system_start };
        }
    }
};

function execute(system, curr_system_idx, match_arr, exec_mode = EXEC_DEFAULT) {
    const flag = system.flags[curr_system_idx];
    if (flag === FLAG_COMMENT) {
        const var_idx = system.vars[curr_system_idx];
        const match_arr_comment = execute(system, var_idx, match_arr, EXEC_COMMENT);
        const out_idx = system.outs[curr_system_idx];
        match_arr = execute(system, out_idx, match_arr_comment, exec_mode);
        return match_arr;
    } else if (flag === FLAG_FUZZY) {
        const var_idx = system.vars[curr_system_idx];
        const match_arr_fuzzy = execute(system, var_idx, match_arr, EXEC_FUZZY);
        const out_idx = system.outs[curr_system_idx];
        match_arr = execute(system, out_idx, match_arr_fuzzy, exec_mode);
        return match_arr;
    } else if (flag === FLAG_NOT) {
        const var_idx = system.vars[curr_system_idx];
        const match_arr_not = execute(system, var_idx, match_arr, exec_mode);
        match_arr = match_arr.filter(photo_id => {
            return !match_arr_not.includes(photo_id);
        });
        const out_idx = system.outs[curr_system_idx];
        match_arr = execute(system, out_idx, match_arr, exec_mode);
        return match_arr;
    } else if (flag === FLAG_XOR) {
        const idx_a = system.outs[curr_system_idx];
        const idx_b = system.vars[curr_system_idx];
        const match_arr_a = execute(system, idx_a, match_arr, exec_mode);
        const match_arr_b = execute(system, idx_b, match_arr, exec_mode);
        const match_arr_a_f = match_arr_a.filter(photo_id => {
            return !match_arr_b.includes(photo_id);
        });
        const match_arr_b_f = match_arr_b.filter(photo_id => {
            return !match_arr_a.includes(photo_id);
        });
        match_arr = match_arr_a_f.concat(match_arr_b_f);
        return match_arr;
    } else if (flag === FLAG_OR) {
        const idx_a = system.outs[curr_system_idx];
        const idx_b = system.vars[curr_system_idx];
        const match_arr_a = execute(system, idx_a, match_arr, exec_mode);
        const match_arr_b = execute(system, idx_b, match_arr, exec_mode);
        match_arr = consts.utils_array_undupe(match_arr_a.concat(match_arr_b));
        return match_arr;
    } else if (flag === FLAG_TAG) {
        // FLAG_AND
        if (exec_mode === EXEC_COMMENT) {
            const search_term = system.vars[curr_system_idx];
            const re_str = consts.utils_regex_escape(search_term).split(/\s+/).join(")|((\\b|\\s)");
            const re = new RegExp(`((\\b|\\s)${re_str})`, "i");
            match_arr = match_arr.filter(function (photo_id) {
                const comment = meta.get_photo_comment(photo_id);
                if (comment && re.test(comment)) {
                    return true;
                }
            });
        } else if (exec_mode === EXEC_FUZZY) {
            const tag_name = system.vars[curr_system_idx];
            const re_str = consts.utils_regex_escape(tag_name).split(/\s+/).join(".*(\\b|\\s)");
            const re = new RegExp(`(\\b|\\s)${re_str}(\\b|\\s)`, "i");
            match_arr = match_arr.filter(function (photo_id) {
                let matches = false;
                const photo_tag_names = meta.get_photo_tag_names(photo_id);
                for (let photo_tag_name of photo_tag_names) {
                    if (re.test(photo_tag_name)) {
                        matches = true;
                        break;
                    }
                }
                return matches;
            });
        } else {
            // EXEC_DEFAULT
            const tag_name = system.vars[curr_system_idx].toLowerCase();
            match_arr = match_arr.filter(function (photo_id) {
                let photo_obj_tags_arr = meta.get_photo_tag_names(photo_id)
                photo_obj_tags_arr = photo_obj_tags_arr.map(t => t.toLowerCase());
                return photo_obj_tags_arr.includes(tag_name);
            });
        }
        const out_idx = system.outs[curr_system_idx];
        match_arr = execute(system, out_idx, match_arr, exec_mode);
        return match_arr;
    } else if (flag === FLAG_END) {
        return match_arr;
    } else {
        throw new Error("unknown flag");
    }
};

/* constructor */
function Filter(expression, expansions = undefined) {
    const inst = Object.create(Filter.prototype);
    inst.expr = expansions ?
        Filter.static.expand_expression(expression, expansions).trim() :
        expression.trim();
    inst.expr_norm = normalize(inst.expr);
    Filter.static.validate_expression(inst.expr_norm);
    if (inst.expr_norm) {
        const { system, system_start } = compile(inst.expr_norm);
        inst.system = system;
        inst.system_start = system_start;
    }
    return inst;
};

Filter.prototype = {};
Filter.static = {};

/* public statics */
Filter.static.validate_expression = function (expression) {
    expression = normalize(expression);

    // check for mismatching parens
    let l_parens = 0;
    let r_parens = 0;
    for (const char of expression) {
        if (char === "(") {
            l_parens += 1;
        } else if (char === ")") {
            r_parens += 1;
        }
        if (r_parens > l_parens) {
            // will catch something like "())("
            throw new Error("error: missing a '('");
        }
    }
    if (l_parens !== r_parens) {
        if (l_parens > r_parens) {
            throw new Error("error: missing a ')'");
        } else {
            throw new Error("error: missing a '('");
        }
    }

    // check for any empty parens
    if (re_empty_parens.test(expression)) {
        throw new Error("error: cannot use an empty set of parentheses");
    }

    // check for dangling op
    const last_char = expression[expression.length - 1];
    if (last_char === OP_NOT || last_char === OP_AND || last_char === OP_XOR || last_char === OP_OR) {
        throw new Error("error: dangling operator, please remove operator at the end");
    }

    // check for any unary or open paren without an op before it, mid string.
    const re_bad_unary_op_result = re_bad_unary_op.exec(expression);
    if (re_bad_unary_op_result) {
        throw new Error(`error: misused '${re_bad_unary_op_result[1]}' sign, make sure an operator comes before it`);
    }

    // check for any ops at front that shouldn't be there.
    if (re_binary_op.test(expression[0])) {
        throw new Error("error: dangling operator, please remove operator at the front");
    }

    // check for any double binary ops
    if (re_binary_double_op.test(expression)) {
        throw new Error("error: cannot use but one binary opertaor in a row");
    }
};

Filter.static.validate_variable_name = function (variable_name) {
    if (re_operator.test(variable_name)) {
        throw new Error("variable name must not contain any filter operators");
    } else if (variable_name !== variable_name.trim()) {
        throw new Error("hidden spaces on the front or end of the varialbe name");
    } else if (/\s\s/.test(variable_name)) {
        throw new Error("hidden spaces in the middle of the variable name");
    }
};

Filter.static.validate_tag_name = function (tag_name) {
    const matches = tag_name.match(re_g_operator);
    if (matches) {
        throw new Error(
            `tag name contains reserved filter ` +
            `${matches.length > 1 ? "operators" : "operator"}: ` +
            `${consts.utils_array_undupe(matches).join(" ")}`
        );
    }
};

Filter.static.get_possible_operands = function (expression, cursor_idx) {
    cursor_idx = parseInt(cursor_idx);
    const front = expression.slice(0, cursor_idx);
    const back = expression.slice(cursor_idx);

    let from;
    for (from = front.length - 1; from >= 0; from -= 1) {
        if (re_operator.test(front[from])) {
            break;
        }
    }
    from += 1;

    let to_exclusive;
    for (to_exclusive = 0; to_exclusive < back.length; to_exclusive += 1) {
        if (re_operator.test(back[to_exclusive])) {
            break;
        }
    }
    to_exclusive += cursor_idx;

    const operand = expression.slice(from, to_exclusive).trim();
    const possible_operands = [];
    if (operand) {
        const regex_str = consts.utils_regex_escape(operand).split(/\s+/).join(".*(\\b|\\s)");
        const regex = new RegExp(`\\b${regex_str}`, "i");
        for (let tag_str of meta.get_tag_names()) {
            if ((tag_str.length >= operand.length) && regex.test(tag_str)) {
                possible_operands.push(tag_str);
            }
        }
    }

    return { possible_operands, from, to_exclusive };
};

Filter.static.expand_expression = function (expression, expansions) {
    const expression_arr = split(expression);
    for (let i = 0; i < expression_arr.length; i += 1) {
        const expansion = expansions[expression_arr[i]];
        if (expansion) {
            expression_arr[i] = expansion;
        }
    }
    return expression_arr.join(" ").replace("( ", "(").replace(" )", ")");
};

/* methods */
Filter.prototype.execute = function () {
    const inst = this;
    const photos_arr = meta.get_photo_ids();
    const results = {};

    if (!re_operand.test(inst.expr_norm)) {
        results.expression = "All Pictures";
        results.matches = meta.sort_photos(photos_arr);
    } else {
        results.expression = inst.expr;
        results.matches = meta.sort_photos(execute(inst.system, inst.system_start, photos_arr));
    }

    return results;
};

/* exports */
module.exports = Filter;
