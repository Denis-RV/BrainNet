'use strict';

var obsidian = require('obsidian');

/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

// @ts-nocheck
var HINT_ELEMENT_CLASS = "CodeMirror-hint";
var ACTIVE_HINT_ELEMENT_CLASS = "CodeMirror-hint-active";
// This is the old interface, kept around for now to stay
// backwards-compatible.
CodeMirror.showHint = function (cm, getHints, options) {
    if (!getHints)
        return cm.showHint(options);
    if (options && options.async)
        getHints.async = true;
    var newOpts = { hint: getHints };
    if (options)
        for (var prop in options)
            newOpts[prop] = options[prop];
    return cm.showHint(newOpts);
};
CodeMirror.defineExtension("showHint", function (options) {
    options = parseOptions(this, this.getCursor("start"), options);
    var selections = this.listSelections();
    if (selections.length > 1)
        return;
    // By default, don't allow completion when something is selected.
    // A hint function can have a `supportsSelection` property to
    // indicate that it can handle selections.
    if (this.somethingSelected()) {
        if (!options.hint.supportsSelection)
            return;
        // Don't try with cross-line selections
        for (var i = 0; i < selections.length; i++)
            if (selections[i].head.line != selections[i].anchor.line)
                return;
    }
    if (this.state.completionActive)
        this.state.completionActive.close();
    var completion = (this.state.completionActive = new Completion(this, options));
    if (!completion.options.hint)
        return;
    CodeMirror.signal(this, "startCompletion", this);
    completion.update(true);
});
CodeMirror.defineExtension("closeHint", function () {
    if (this.state.completionActive)
        this.state.completionActive.close();
});
function Completion(cm, options) {
    this.cm = cm;
    this.options = options;
    this.widget = null;
    this.debounce = 0;
    this.tick = 0;
    this.startPos = this.cm.getCursor("start");
    this.startLen =
        this.cm.getLine(this.startPos.line).length - this.cm.getSelection().length;
    if (this.options.updateOnCursorActivity) {
        var self = this;
        cm.on("cursorActivity", (this.activityFunc = function () {
            self.cursorActivity();
        }));
    }
}
var requestAnimationFrame = window.requestAnimationFrame ||
    function (fn) {
        return setTimeout(fn, 1000 / 60);
    };
var cancelAnimationFrame = window.cancelAnimationFrame || clearTimeout;
Completion.prototype = {
    close: function () {
        if (!this.active())
            return;
        this.cm.state.completionActive = null;
        this.tick = null;
        if (this.options.updateOnCursorActivity) {
            this.cm.off("cursorActivity", this.activityFunc);
        }
        if (this.widget && this.data)
            CodeMirror.signal(this.data, "close");
        if (this.widget)
            this.widget.close();
        CodeMirror.signal(this.cm, "endCompletion", this.cm);
    },
    active: function () {
        return this.cm.state.completionActive == this;
    },
    pick: function (data, i) {
        var completion = data.list[i], self = this;
        this.cm.operation(function () {
            if (completion.hint)
                completion.hint(self.cm, data, completion);
            else
                self.cm.replaceRange(getText(completion), completion.from || data.from, completion.to || data.to, "complete");
            CodeMirror.signal(data, "pick", completion);
            self.cm.scrollIntoView();
        });
        if (this.options.closeOnPick) {
            this.close();
        }
    },
    cursorActivity: function () {
        if (this.debounce) {
            cancelAnimationFrame(this.debounce);
            this.debounce = 0;
        }
        var identStart = this.startPos;
        if (this.data) {
            identStart = this.data.from;
        }
        var pos = this.cm.getCursor(), line = this.cm.getLine(pos.line);
        if (pos.line != this.startPos.line ||
            line.length - pos.ch != this.startLen - this.startPos.ch ||
            pos.ch < identStart.ch ||
            this.cm.somethingSelected() ||
            !pos.ch ||
            this.options.closeCharacters.test(line.charAt(pos.ch - 1))) {
            this.close();
        }
        else {
            var self = this;
            this.debounce = requestAnimationFrame(function () {
                self.update();
            });
            if (this.widget)
                this.widget.disable();
        }
    },
    update: function (first) {
        if (this.tick == null)
            return;
        var self = this, myTick = ++this.tick;
        fetchHints(this.options.hint, this.cm, this.options, function (data) {
            if (self.tick == myTick)
                self.finishUpdate(data, first);
        });
    },
    finishUpdate: function (data, first) {
        if (this.data)
            CodeMirror.signal(this.data, "update");
        var picked = (this.widget && this.widget.picked) ||
            (first && this.options.completeSingle);
        if (this.widget)
            this.widget.close();
        this.data = data;
        if (data && data.list.length) {
            if (picked && data.list.length == 1) {
                this.pick(data, 0);
            }
            else {
                this.widget = new Widget(this, data);
                CodeMirror.signal(data, "shown");
            }
        }
    },
};
function parseOptions(cm, pos, options) {
    var editor = cm.options.hintOptions;
    var out = {};
    for (var prop in defaultOptions)
        out[prop] = defaultOptions[prop];
    if (editor)
        for (var prop in editor)
            if (editor[prop] !== undefined)
                out[prop] = editor[prop];
    if (options)
        for (var prop in options)
            if (options[prop] !== undefined)
                out[prop] = options[prop];
    if (out.hint.resolve)
        out.hint = out.hint.resolve(cm, pos);
    return out;
}
function getText(completion) {
    if (typeof completion == "string")
        return completion;
    else
        return completion.text;
}
function buildKeyMap(completion, handle) {
    var baseMap = {
        Up: function () {
            handle.moveFocus(-1);
        },
        Down: function () {
            handle.moveFocus(1);
        },
        PageUp: function () {
            handle.moveFocus(-handle.menuSize() + 1, true);
        },
        PageDown: function () {
            handle.moveFocus(handle.menuSize() - 1, true);
        },
        Home: function () {
            handle.setFocus(0);
        },
        End: function () {
            handle.setFocus(handle.length - 1);
        },
        Enter: handle.pick,
        Tab: handle.pick,
        Esc: handle.close,
    };
    var mac = /Mac/.test(navigator.platform);
    if (mac) {
        baseMap["Ctrl-P"] = function () {
            handle.moveFocus(-1);
        };
        baseMap["Ctrl-N"] = function () {
            handle.moveFocus(1);
        };
    }
    var custom = completion.options.customKeys;
    var ourMap = custom ? {} : baseMap;
    function addBinding(key, val) {
        var bound;
        if (typeof val != "string")
            bound = function (cm) {
                return val(cm, handle);
            };
        // This mechanism is deprecated
        else if (baseMap.hasOwnProperty(val))
            bound = baseMap[val];
        else
            bound = val;
        ourMap[key] = bound;
    }
    if (custom)
        for (var key in custom)
            if (custom.hasOwnProperty(key))
                addBinding(key, custom[key]);
    var extra = completion.options.extraKeys;
    if (extra)
        for (var key in extra)
            if (extra.hasOwnProperty(key))
                addBinding(key, extra[key]);
    return ourMap;
}
function getHintElement(hintsElement, el) {
    while (el && el != hintsElement) {
        if (el.nodeName.toUpperCase() === "LI" && el.parentNode == hintsElement)
            return el;
        el = el.parentNode;
    }
}
function Widget(completion, data) {
    this.completion = completion;
    this.data = data;
    this.picked = false;
    var widget = this, cm = completion.cm;
    var ownerDocument = cm.getInputField().ownerDocument;
    var parentWindow = ownerDocument.defaultView || ownerDocument.parentWindow;
    var hints = (this.hints = ownerDocument.createElement("ul"));
    var theme = completion.cm.options.theme;
    hints.className = "CodeMirror-hints " + theme;
    this.selectedHint = data.selectedHint || 0;
    var completions = data.list;
    for (var i = 0; i < completions.length; ++i) {
        var elt = hints.appendChild(ownerDocument.createElement("li")), cur = completions[i];
        var className = HINT_ELEMENT_CLASS +
            (i != this.selectedHint ? "" : " " + ACTIVE_HINT_ELEMENT_CLASS);
        if (cur.className != null)
            className = cur.className + " " + className;
        elt.className = className;
        if (cur.render)
            cur.render(elt, data, cur);
        else
            elt.appendChild(ownerDocument.createTextNode(cur.displayText || getText(cur)));
        elt.hintId = i;
    }
    var container = completion.options.container || ownerDocument.body;
    var pos = cm.cursorCoords(completion.options.alignWithWord ? data.from : null);
    var left = pos.left, top = pos.bottom, below = true;
    var offsetLeft = 0, offsetTop = 0;
    if (container !== ownerDocument.body) {
        // We offset the cursor position because left and top are relative to the offsetParent's top left corner.
        var isContainerPositioned = ["absolute", "relative", "fixed"].indexOf(parentWindow.getComputedStyle(container).position) !== -1;
        var offsetParent = isContainerPositioned
            ? container
            : container.offsetParent;
        var offsetParentPosition = offsetParent.getBoundingClientRect();
        var bodyPosition = ownerDocument.body.getBoundingClientRect();
        offsetLeft =
            offsetParentPosition.left - bodyPosition.left - offsetParent.scrollLeft;
        offsetTop =
            offsetParentPosition.top - bodyPosition.top - offsetParent.scrollTop;
    }
    hints.style.left = left - offsetLeft + "px";
    hints.style.top = top - offsetTop + "px";
    // If we're at the edge of the screen, then we want the menu to appear on the left of the cursor.
    var winW = parentWindow.innerWidth ||
        Math.max(ownerDocument.body.offsetWidth, ownerDocument.documentElement.offsetWidth);
    var winH = parentWindow.innerHeight ||
        Math.max(ownerDocument.body.offsetHeight, ownerDocument.documentElement.offsetHeight);
    container.appendChild(hints);
    var box = completion.options.moveOnOverlap
        ? hints.getBoundingClientRect()
        : new DOMRect();
    var scrolls = completion.options.paddingForScrollbar
        ? hints.scrollHeight > hints.clientHeight + 1
        : false;
    // Compute in the timeout to avoid reflow on init
    var startScroll;
    setTimeout(function () {
        startScroll = cm.getScrollInfo();
    });
    var overlapY = box.bottom - winH;
    if (overlapY > 0) {
        var height = box.bottom - box.top, curTop = pos.top - (pos.bottom - box.top);
        if (curTop - height > 0) {
            // Fits above cursor
            hints.style.top = (top = pos.top - height - offsetTop) + "px";
            below = false;
        }
        else if (height > winH) {
            hints.style.height = winH - 5 + "px";
            hints.style.top = (top = pos.bottom - box.top - offsetTop) + "px";
            var cursor = cm.getCursor();
            if (data.from.ch != cursor.ch) {
                pos = cm.cursorCoords(cursor);
                hints.style.left = (left = pos.left - offsetLeft) + "px";
                box = hints.getBoundingClientRect();
            }
        }
    }
    var overlapX = box.right - winW;
    if (overlapX > 0) {
        if (box.right - box.left > winW) {
            hints.style.width = winW - 5 + "px";
            overlapX -= box.right - box.left - winW;
        }
        hints.style.left = (left = pos.left - overlapX - offsetLeft) + "px";
    }
    if (scrolls)
        for (var node = hints.firstChild; node; node = node.nextSibling)
            node.style.paddingRight = cm.display.nativeBarWidth + "px";
    cm.addKeyMap((this.keyMap = buildKeyMap(completion, {
        moveFocus: function (n, avoidWrap) {
            widget.changeActive(widget.selectedHint + n, avoidWrap);
        },
        setFocus: function (n) {
            widget.changeActive(n);
        },
        menuSize: function () {
            return widget.screenAmount();
        },
        length: completions.length,
        close: function () {
            completion.close();
        },
        pick: function () {
            widget.pick();
        },
        data: data,
    })));
    if (completion.options.closeOnUnfocus) {
        var closingOnBlur;
        cm.on("blur", (this.onBlur = function () {
            closingOnBlur = setTimeout(function () {
                completion.close();
            }, 100);
        }));
        cm.on("focus", (this.onFocus = function () {
            clearTimeout(closingOnBlur);
        }));
    }
    cm.on("scroll", (this.onScroll = function () {
        var curScroll = cm.getScrollInfo(), editor = cm.getWrapperElement().getBoundingClientRect();
        var newTop = top + startScroll.top - curScroll.top;
        var point = newTop -
            (parentWindow.pageYOffset ||
                (ownerDocument.documentElement || ownerDocument.body).scrollTop);
        if (!below)
            point += hints.offsetHeight;
        if (point <= editor.top || point >= editor.bottom)
            return completion.close();
        hints.style.top = newTop + "px";
        hints.style.left = left + startScroll.left - curScroll.left + "px";
    }));
    CodeMirror.on(hints, "dblclick", function (e) {
        var t = getHintElement(hints, e.target || e.srcElement);
        if (t && t.hintId != null) {
            widget.changeActive(t.hintId);
            widget.pick();
        }
    });
    CodeMirror.on(hints, "click", function (e) {
        var t = getHintElement(hints, e.target || e.srcElement);
        if (t && t.hintId != null) {
            widget.changeActive(t.hintId);
            if (completion.options.completeOnSingleClick)
                widget.pick();
        }
    });
    CodeMirror.on(hints, "mousedown", function () {
        setTimeout(function () {
            cm.focus();
        }, 20);
    });
    // The first hint doesn't need to be scrolled to on init
    var selectedHintRange = this.getSelectedHintRange();
    if (selectedHintRange.from !== 0 || selectedHintRange.to !== 0) {
        this.scrollToActive();
    }
    CodeMirror.signal(data, "select", completions[this.selectedHint], hints.childNodes[this.selectedHint]);
    return true;
}
Widget.prototype = {
    close: function () {
        if (this.completion.widget != this)
            return;
        this.completion.widget = null;
        this.hints.parentNode.removeChild(this.hints);
        this.completion.cm.removeKeyMap(this.keyMap);
        var cm = this.completion.cm;
        if (this.completion.options.closeOnUnfocus) {
            cm.off("blur", this.onBlur);
            cm.off("focus", this.onFocus);
        }
        cm.off("scroll", this.onScroll);
    },
    disable: function () {
        this.completion.cm.removeKeyMap(this.keyMap);
        var widget = this;
        this.keyMap = {
            Enter: function () {
                widget.picked = true;
            },
        };
        this.completion.cm.addKeyMap(this.keyMap);
    },
    pick: function () {
        this.completion.pick(this.data, this.selectedHint);
    },
    changeActive: function (i, avoidWrap) {
        if (i >= this.data.list.length)
            i = avoidWrap ? this.data.list.length - 1 : 0;
        else if (i < 0)
            i = avoidWrap ? 0 : this.data.list.length - 1;
        if (this.selectedHint == i)
            return;
        var node = this.hints.childNodes[this.selectedHint];
        if (node)
            node.className = node.className.replace(" " + ACTIVE_HINT_ELEMENT_CLASS, "");
        node = this.hints.childNodes[(this.selectedHint = i)];
        node.className += " " + ACTIVE_HINT_ELEMENT_CLASS;
        this.scrollToActive();
        CodeMirror.signal(this.data, "select", this.data.list[this.selectedHint], node);
    },
    scrollToActive: function () {
        var selectedHintRange = this.getSelectedHintRange();
        var node1 = this.hints.childNodes[selectedHintRange.from];
        var node2 = this.hints.childNodes[selectedHintRange.to];
        var firstNode = this.hints.firstChild;
        if (node1.offsetTop < this.hints.scrollTop)
            this.hints.scrollTop = node1.offsetTop - firstNode.offsetTop;
        else if (node2.offsetTop + node2.offsetHeight >
            this.hints.scrollTop + this.hints.clientHeight)
            this.hints.scrollTop =
                node2.offsetTop +
                    node2.offsetHeight -
                    this.hints.clientHeight +
                    firstNode.offsetTop;
    },
    screenAmount: function () {
        return (Math.floor(this.hints.clientHeight / this.hints.firstChild.offsetHeight) || 1);
    },
    getSelectedHintRange: function () {
        var margin = this.completion.options.scrollMargin || 0;
        return {
            from: Math.max(0, this.selectedHint - margin),
            to: Math.min(this.data.list.length - 1, this.selectedHint + margin),
        };
    },
};
function applicableHelpers(cm, helpers) {
    if (!cm.somethingSelected())
        return helpers;
    var result = [];
    for (var i = 0; i < helpers.length; i++)
        if (helpers[i].supportsSelection)
            result.push(helpers[i]);
    return result;
}
function fetchHints(hint, cm, options, callback) {
    if (hint.async) {
        hint(cm, callback, options);
    }
    else {
        var result = hint(cm, options);
        if (result && result.then)
            result.then(callback);
        else
            callback(result);
    }
}
function resolveAutoHints(cm, pos) {
    var helpers = cm.getHelpers(pos, "hint"), words;
    if (helpers.length) {
        var resolved = function (cm, callback, options) {
            var app = applicableHelpers(cm, helpers);
            function run(i) {
                if (i == app.length)
                    return callback(null);
                fetchHints(app[i], cm, options, function (result) {
                    if (result && result.list.length > 0)
                        callback(result);
                    else
                        run(i + 1);
                });
            }
            run(0);
        };
        resolved.async = true;
        resolved.supportsSelection = true;
        return resolved;
    }
    else if ((words = cm.getHelper(cm.getCursor(), "hintWords"))) {
        return function (cm) {
            return CodeMirror.hint.fromList(cm, { words: words });
        };
    }
    else if (CodeMirror.hint.anyword) {
        return function (cm, options) {
            return CodeMirror.hint.anyword(cm, options);
        };
    }
    else {
        return function () { };
    }
}
CodeMirror.registerHelper("hint", "auto", {
    resolve: resolveAutoHints,
});
CodeMirror.registerHelper("hint", "fromList", function (cm, options) {
    var cur = cm.getCursor(), token = cm.getTokenAt(cur);
    var term, from = CodeMirror.Pos(cur.line, token.start), to = cur;
    if (token.start < cur.ch &&
        /\w/.test(token.string.charAt(cur.ch - token.start - 1))) {
        term = token.string.substr(0, cur.ch - token.start);
    }
    else {
        term = "";
        from = cur;
    }
    var found = [];
    for (var i = 0; i < options.words.length; i++) {
        var word = options.words[i];
        if (word.slice(0, term.length) == term)
            found.push(word);
    }
    if (found.length)
        return { list: found, from: from, to: to };
});
CodeMirror.commands.autocomplete = CodeMirror.showHint;
var defaultOptions = {
    hint: CodeMirror.hint.auto,
    completeSingle: true,
    alignWithWord: true,
    closeCharacters: /[\s()\[\]{};:>,]/,
    closeOnPick: true,
    closeOnUnfocus: true,
    updateOnCursorActivity: true,
    completeOnSingleClick: true,
    container: null,
    customKeys: null,
    extraKeys: null,
    paddingForScrollbar: true,
    moveOnOverlap: true,
};
CodeMirror.defineOption("hintOptions", null);

// @ts-nocheck
// Because this code is originally javascript code.
// TinySegmenter 0.1 -- Super compact Japanese tokenizer in Javascript
// (c) 2008 Taku Kudo <taku@chasen.org>
// TinySegmenter is freely distributable under the terms of a new BSD licence.
// For details, see http://chasen.org/~taku/software/TinySegmenter/LICENCE.txt
function TinySegmenter() {
    var patterns = {
        "[?????????????????????????????????????????????]": "M",
        "[???-???????????????]": "H",
        "[???-???]": "I",
        "[???-?????????-?????????]": "K",
        "[a-zA-Z???-??????-???]": "A",
        "[0-9???-???]": "N",
    };
    this.chartype_ = [];
    for (var i in patterns) {
        var regexp = new RegExp();
        regexp.compile(i);
        this.chartype_.push([regexp, patterns[i]]);
    }
    this.BIAS__ = -332;
    this.BC1__ = { HH: 6, II: 2461, KH: 406, OH: -1378 };
    this.BC2__ = {
        AA: -3267,
        AI: 2744,
        AN: -878,
        HH: -4070,
        HM: -1711,
        HN: 4012,
        HO: 3761,
        IA: 1327,
        IH: -1184,
        II: -1332,
        IK: 1721,
        IO: 5492,
        KI: 3831,
        KK: -8741,
        MH: -3132,
        MK: 3334,
        OO: -2920,
    };
    this.BC3__ = {
        HH: 996,
        HI: 626,
        HK: -721,
        HN: -1307,
        HO: -836,
        IH: -301,
        KK: 2762,
        MK: 1079,
        MM: 4034,
        OA: -1652,
        OH: 266,
    };
    this.BP1__ = { BB: 295, OB: 304, OO: -125, UB: 352 };
    this.BP2__ = { BO: 60, OO: -1762 };
    this.BQ1__ = {
        BHH: 1150,
        BHM: 1521,
        BII: -1158,
        BIM: 886,
        BMH: 1208,
        BNH: 449,
        BOH: -91,
        BOO: -2597,
        OHI: 451,
        OIH: -296,
        OKA: 1851,
        OKH: -1020,
        OKK: 904,
        OOO: 2965,
    };
    this.BQ2__ = {
        BHH: 118,
        BHI: -1159,
        BHM: 466,
        BIH: -919,
        BKK: -1720,
        BKO: 864,
        OHH: -1139,
        OHM: -181,
        OIH: 153,
        UHI: -1146,
    };
    this.BQ3__ = {
        BHH: -792,
        BHI: 2664,
        BII: -299,
        BKI: 419,
        BMH: 937,
        BMM: 8335,
        BNN: 998,
        BOH: 775,
        OHH: 2174,
        OHM: 439,
        OII: 280,
        OKH: 1798,
        OKI: -793,
        OKO: -2242,
        OMH: -2402,
        OOO: 11699,
    };
    this.BQ4__ = {
        BHH: -3895,
        BIH: 3761,
        BII: -4654,
        BIK: 1348,
        BKK: -1806,
        BMI: -3385,
        BOO: -12396,
        OAH: 926,
        OHH: 266,
        OHK: -2036,
        ONN: -973,
    };
    this.BW1__ = {
        ",???": 660,
        ",???": 727,
        B1???: 1404,
        B1???: 542,
        "??????": 660,
        "??????": 727,
        "??????": 1682,
        ??????: 1505,
        ??????: 1743,
        ??????: -2055,
        ??????: 672,
        ??????: -4817,
        ??????: 665,
        ??????: 3472,
        ??????: 600,
        ??????: -790,
        ??????: 2083,
        ??????: -1262,
        ??????: -4143,
        ??????: 4573,
        ??????: 2641,
        ??????: 1104,
        ??????: -3399,
        ??????: 1977,
        ??????: -871,
        ??????: 1122,
        ??????: 601,
        ??????: 3463,
        ??????: -802,
        ??????: 805,
        ??????: 1249,
        ??????: 1127,
        ??????: 3445,
        ??????: 844,
        ??????: -4915,
        ??????: 1922,
        ??????: 3887,
        ??????: 5713,
        ??????: 3015,
        ??????: 7379,
        ??????: -1113,
        ??????: 2468,
        ??????: 1498,
        ??????: 1671,
        ??????: -912,
        ??????: -501,
        ??????: 741,
        ??????: 2448,
        ??????: 1711,
        ??????: 2600,
        ??????: -2155,
        ??????: -1947,
        ??????: -2565,
        ??????: 2369,
        ??????: -913,
        ??????: 1860,
        ??????: 731,
        ??????: -1886,
        ??????: 2558,
        ??????: -2784,
        ??????: -2604,
        ??????: 1497,
        ??????: -2314,
        ??????: -1336,
        ??????: -195,
        ??????: -2423,
        ??????: -2113,
        ??????: -724,
        ?????????: 1404,
        ?????????: 542,
        "??????": 1682,
    };
    this.BW2__ = {
        "..": -11822,
        11: -669,
        "??????": -5730,
        "??????": -13175,
        ??????: -1609,
        ??????: 2490,
        ??????: -1350,
        ??????: -602,
        ??????: -7194,
        ??????: 4612,
        ??????: 853,
        ??????: -3198,
        ??????: 1941,
        ??????: -1597,
        ??????: -8392,
        ??????: -4193,
        ??????: 4533,
        ??????: 13168,
        ??????: -3977,
        ??????: -1819,
        ??????: -545,
        ??????: 5078,
        ??????: 972,
        ??????: 939,
        ??????: -3744,
        ??????: -1253,
        ??????: -662,
        ??????: -3857,
        ??????: -786,
        ??????: 1224,
        ??????: -939,
        ??????: 4589,
        ??????: 1647,
        ??????: -2094,
        ??????: 6144,
        ??????: 3640,
        ??????: 2551,
        ??????: -3110,
        ??????: -3065,
        ??????: 2666,
        ??????: -1528,
        ??????: -3828,
        ??????: -4761,
        ??????: -4203,
        ??????: 1890,
        ??????: -1746,
        ??????: -2279,
        ??????: 720,
        ??????: 5168,
        ??????: -3941,
        ??????: -2488,
        ??????: -1313,
        ??????: -6509,
        ??????: 2614,
        ??????: 3099,
        ??????: -1615,
        ??????: 2748,
        ??????: 2454,
        ??????: -7236,
        ??????: -14943,
        ??????: -4688,
        ??????: -11388,
        ??????: 2093,
        ??????: -7059,
        ??????: -6041,
        ??????: -6125,
        ??????: 1073,
        ??????: -1033,
        ??????: -2532,
        ??????: 1813,
        ??????: -1316,
        ??????: -6621,
        ??????: 5409,
        ??????: -3153,
        ??????: 2230,
        ??????: -10713,
        ??????: -944,
        ??????: -1611,
        ??????: -1897,
        ??????: 651,
        ??????: 1620,
        ??????: 4270,
        ??????: 849,
        ??????: 4114,
        ??????: 6067,
        ??????: 7901,
        ??????: -11877,
        ??????: 728,
        ??????: -4115,
        ??????: 602,
        ??????: -1375,
        ??????: 970,
        ??????: -1051,
        ??????: -4479,
        ??????: -1116,
        ??????: 2163,
        ??????: -7758,
        ??????: 970,
        ??????: -913,
        ??????: -2471,
        ??????: -1250,
        ??????: -1050,
        ??????: -8669,
        ??????: -1626,
        ??????: -2363,
        ??????: -1982,
        ??????: -4066,
        ??????: -722,
        ??????: -7068,
        ??????: 3372,
        ??????: -601,
        ??????: -2355,
        ??????: -2697,
        ??????: -1543,
        ??????: -1384,
        ??????: -1276,
        ??????: -990,
        ??????: -1612,
        ??????: -4268,
        "??????": -669,
    };
    this.BW3__ = {
        ??????: -2194,
        ??????: 719,
        ??????: 3846,
        "???.": -1185,
        "??????": -1185,
        ??????: 5308,
        ??????: 2079,
        ??????: 3029,
        ??????: 2056,
        ??????: 1883,
        ??????: 5600,
        ??????: 1527,
        ??????: 1117,
        ??????: 4798,
        ??????: 1454,
        "???.": 2857,
        "??????": 2857,
        ??????: -743,
        ??????: -4098,
        ??????: -669,
        ??????: 6520,
        ??????: -2670,
        "???,": 1816,
        "??????": 1816,
        ??????: -4855,
        ??????: -1127,
        ??????: -913,
        ??????: -4977,
        ??????: -2064,
        ??????: 1645,
        ??????: 1374,
        ??????: 7397,
        ??????: 1542,
        ??????: -2757,
        ??????: -714,
        ??????: 976,
        "???,": 1557,
        "??????": 1557,
        ??????: -3714,
        ??????: 3562,
        ??????: 1449,
        ??????: 2608,
        ??????: 1200,
        "???.": -1310,
        "??????": -1310,
        ??????: 6521,
        "???,": 3426,
        "??????": 3426,
        ??????: 841,
        ??????: 428,
        "???.": 8875,
        "??????": 8875,
        ??????: -594,
        ??????: 812,
        ??????: -1183,
        ??????: -853,
        "???.": 4098,
        "??????": 4098,
        ??????: 1004,
        ??????: -4748,
        ??????: 300,
        ??????: 6240,
        ??????: 855,
        ??????: 302,
        ??????: 1437,
        ??????: -1482,
        ??????: 2295,
        ??????: -1387,
        ??????: 2266,
        ??????: 541,
        ??????: -3543,
        ??????: 4664,
        ??????: 1796,
        ??????: -903,
        ??????: 2135,
        "???,": -1021,
        "??????": -1021,
        ??????: 1771,
        ??????: 1906,
        ??????: 2644,
        "???,": -724,
        "??????": -724,
        ??????: -1000,
        "???,": 1337,
        "??????": 1337,
        ??????: 2181,
        ??????: 1113,
        ??????: 6943,
        ??????: -1549,
        ??????: 6154,
        ??????: -793,
        ??????: 1479,
        ??????: 6820,
        ??????: 3818,
        "???,": 854,
        "??????": 854,
        ??????: 1850,
        ??????: 1375,
        ??????: -3246,
        ??????: 1091,
        ??????: -605,
        ??????: 606,
        ??????: 798,
        ??????: 990,
        ??????: 860,
        ??????: 1232,
        ??????: 2217,
        ??????: 1681,
        ???: 965,
        ??????: -5055,
        "???,": 974,
        "??????": 974,
        ??????: 2024,
        ??????: 990,
    };
    this.TC1__ = {
        AAA: 1093,
        HHH: 1029,
        HHM: 580,
        HII: 998,
        HOH: -390,
        HOM: -331,
        IHI: 1169,
        IOH: -142,
        IOI: -1015,
        IOM: 467,
        MMH: 187,
        OOI: -1832,
    };
    this.TC2__ = {
        HHO: 2088,
        HII: -1023,
        HMM: -1154,
        IHI: -1965,
        KKH: 703,
        OII: -2649,
    };
    this.TC3__ = {
        AAA: -294,
        HHH: 346,
        HHI: -341,
        HII: -1088,
        HIK: 731,
        HOH: -1486,
        IHH: 128,
        IHI: -3041,
        IHO: -1935,
        IIH: -825,
        IIM: -1035,
        IOI: -542,
        KHH: -1216,
        KKA: 491,
        KKH: -1217,
        KOK: -1009,
        MHH: -2694,
        MHM: -457,
        MHO: 123,
        MMH: -471,
        NNH: -1689,
        NNO: 662,
        OHO: -3393,
    };
    this.TC4__ = {
        HHH: -203,
        HHI: 1344,
        HHK: 365,
        HHM: -122,
        HHN: 182,
        HHO: 669,
        HIH: 804,
        HII: 679,
        HOH: 446,
        IHH: 695,
        IHO: -2324,
        IIH: 321,
        III: 1497,
        IIO: 656,
        IOO: 54,
        KAK: 4845,
        KKA: 3386,
        KKK: 3065,
        MHH: -405,
        MHI: 201,
        MMH: -241,
        MMM: 661,
        MOM: 841,
    };
    this.TQ1__ = {
        BHHH: -227,
        BHHI: 316,
        BHIH: -132,
        BIHH: 60,
        BIII: 1595,
        BNHH: -744,
        BOHH: 225,
        BOOO: -908,
        OAKK: 482,
        OHHH: 281,
        OHIH: 249,
        OIHI: 200,
        OIIH: -68,
    };
    this.TQ2__ = { BIHH: -1401, BIII: -1033, BKAK: -543, BOOO: -5591 };
    this.TQ3__ = {
        BHHH: 478,
        BHHM: -1073,
        BHIH: 222,
        BHII: -504,
        BIIH: -116,
        BIII: -105,
        BMHI: -863,
        BMHM: -464,
        BOMH: 620,
        OHHH: 346,
        OHHI: 1729,
        OHII: 997,
        OHMH: 481,
        OIHH: 623,
        OIIH: 1344,
        OKAK: 2792,
        OKHH: 587,
        OKKA: 679,
        OOHH: 110,
        OOII: -685,
    };
    this.TQ4__ = {
        BHHH: -721,
        BHHM: -3604,
        BHII: -966,
        BIIH: -607,
        BIII: -2181,
        OAAA: -2763,
        OAKK: 180,
        OHHH: -294,
        OHHI: 2446,
        OHHO: 480,
        OHIH: -1573,
        OIHH: 1935,
        OIHI: -493,
        OIIH: 626,
        OIII: -4007,
        OKAK: -8156,
    };
    this.TW1__ = { ?????????: -4681, ?????????: 2026 };
    this.TW2__ = {
        ?????????: -2049,
        ?????????: -1256,
        ?????????: -2434,
        ?????????: 3873,
        ?????????: -4430,
        ?????????: -1049,
        ?????????: 1833,
        ?????????: -4657,
        ?????????: -4517,
        ?????????: 1882,
        ?????????: -792,
        ?????????: -1512,
        ?????????: -8097,
        ?????????: -1255,
        ?????????: -2721,
        ?????????: -3216,
    };
    this.TW3__ = {
        ?????????: -1734,
        ?????????: 1314,
        ?????????: -4314,
        ?????????: -5483,
        ?????????: -5989,
        ?????????: -6247,
        "??????,": -727,
        "?????????": -727,
        ?????????: -600,
        ?????????: -3752,
        ?????????: -2287,
    };
    this.TW4__ = {
        "??????.": 8576,
        "?????????": 8576,
        ?????????: -2348,
        ?????????: 2958,
        "??????,": 1516,
        "?????????": 1516,
        ?????????: 1538,
        ?????????: 1349,
        ?????????: 5543,
        ?????????: 1097,
        ?????????: -4258,
        ?????????: 5865,
    };
    this.UC1__ = { A: 484, K: 93, M: 645, O: -505 };
    this.UC2__ = { A: 819, H: 1059, I: 409, M: 3987, N: 5775, O: 646 };
    this.UC3__ = { A: -1370, I: 2311 };
    this.UC4__ = {
        A: -2643,
        H: 1809,
        I: -1032,
        K: -3450,
        M: 3565,
        N: 3876,
        O: 6646,
    };
    this.UC5__ = { H: 313, I: -1238, K: -799, M: 539, O: -831 };
    this.UC6__ = { H: -506, I: -253, K: 87, M: 247, O: -387 };
    this.UP1__ = { O: -214 };
    this.UP2__ = { B: 69, O: 935 };
    this.UP3__ = { B: 189 };
    this.UQ1__ = {
        BH: 21,
        BI: -12,
        BK: -99,
        BN: 142,
        BO: -56,
        OH: -95,
        OI: 477,
        OK: 410,
        OO: -2422,
    };
    this.UQ2__ = { BH: 216, BI: 113, OK: 1759 };
    this.UQ3__ = {
        BA: -479,
        BH: 42,
        BI: 1913,
        BK: -7198,
        BM: 3160,
        BN: 6427,
        BO: 14761,
        OI: -827,
        ON: -3212,
    };
    this.UW1__ = {
        ",": 156,
        "???": 156,
        "???": -463,
        ???: -941,
        ???: -127,
        ???: -553,
        ???: 121,
        ???: 505,
        ???: -201,
        ???: -547,
        ???: -123,
        ???: -789,
        ???: -185,
        ???: -847,
        ???: -466,
        ???: -470,
        ???: 182,
        ???: -292,
        ???: 208,
        ???: 169,
        ???: -446,
        ???: -137,
        "???": -135,
        ???: -402,
        ???: -268,
        ???: -912,
        ???: 871,
        ???: -460,
        ???: 561,
        ???: 729,
        ???: -411,
        ???: -141,
        ???: 361,
        ???: -408,
        ???: -386,
        ???: -718,
        "???": -463,
        "???": -135,
    };
    this.UW2__ = {
        ",": -829,
        "???": -829,
        ???: 892,
        "???": -645,
        "???": 3145,
        ???: -538,
        ???: 505,
        ???: 134,
        ???: -502,
        ???: 1454,
        ???: -856,
        ???: -412,
        ???: 1141,
        ???: 878,
        ???: 540,
        ???: 1529,
        ???: -675,
        ???: 300,
        ???: -1011,
        ???: 188,
        ???: 1837,
        ???: -949,
        ???: -291,
        ???: -268,
        ???: -981,
        ???: 1273,
        ???: 1063,
        ???: -1764,
        ???: 130,
        ???: -409,
        ???: -1273,
        ???: 1261,
        ???: 600,
        ???: -1263,
        ???: -402,
        ???: 1639,
        ???: -579,
        ???: -694,
        ???: 571,
        ???: -2516,
        ???: 2095,
        ???: -587,
        ???: 306,
        ???: 568,
        ???: 831,
        ???: -758,
        ???: -2150,
        ???: -302,
        ???: -968,
        ???: -861,
        ???: 492,
        ???: -123,
        ???: 978,
        ???: 362,
        ???: 548,
        ???: -3025,
        ???: -1566,
        ???: -3414,
        ???: -422,
        ???: -1769,
        ???: -865,
        ???: -483,
        ???: -1519,
        ???: 760,
        ???: 1023,
        ???: -2009,
        ???: -813,
        ???: -1060,
        ???: 1067,
        ???: -1519,
        ???: -1033,
        ???: 1522,
        ???: -1355,
        ???: -1682,
        ???: -1815,
        ???: -1462,
        ???: -630,
        ???: -1843,
        ???: -1650,
        ???: -931,
        ???: -665,
        ???: -2378,
        ???: -180,
        ???: -1740,
        ???: 752,
        ???: 529,
        ???: -1584,
        ???: -242,
        ???: -1165,
        ???: -763,
        ???: 810,
        ???: 509,
        ???: -1353,
        ???: 838,
        ???: -744,
        ???: -3874,
        ???: 1010,
        ???: 1198,
        ???: 3041,
        ???: 1758,
        ???: -1257,
        "???": -645,
        "???": 3145,
        ???: 831,
        ???: -587,
        ???: 306,
        ???: 568,
    };
    this.UW3__ = {
        ",": 4889,
        1: -800,
        "???": -1723,
        "???": 4889,
        ???: -2311,
        ???: 5827,
        "???": 2670,
        "???": -3573,
        ???: -2696,
        ???: 1006,
        ???: 2342,
        ???: 1983,
        ???: -4864,
        ???: -1163,
        ???: 3271,
        ???: 1004,
        ???: 388,
        ???: 401,
        ???: -3552,
        ???: -3116,
        ???: -1058,
        ???: -395,
        ???: 584,
        ???: 3685,
        ???: -5228,
        ???: 842,
        ???: -521,
        ???: -1444,
        ???: -1081,
        ???: 6167,
        ???: 2318,
        ???: 1691,
        ???: -899,
        ???: -2788,
        ???: 2745,
        ???: 4056,
        ???: 4555,
        ???: -2171,
        ???: -1798,
        ???: 1199,
        ???: -5516,
        ???: -4384,
        ???: -120,
        ???: 1205,
        ???: 2323,
        ???: -788,
        ???: -202,
        ???: 727,
        ???: 649,
        ???: 5905,
        ???: 2773,
        ???: -1207,
        ???: 6620,
        ???: -518,
        ???: 551,
        ???: 1319,
        ???: 874,
        ???: -1350,
        ???: 521,
        ???: 1109,
        ???: 1591,
        ???: 2201,
        ???: 278,
        "???": -3794,
        ???: -1619,
        ???: -1759,
        ???: -2087,
        ???: 3815,
        ???: 653,
        ???: -758,
        ???: -1193,
        ???: 974,
        ???: 2742,
        ???: 792,
        ???: 1889,
        ???: -1368,
        ???: 811,
        ???: 4265,
        ???: -361,
        ???: -2439,
        ???: 4858,
        ???: 3593,
        ???: 1574,
        ???: -3030,
        ???: 755,
        ???: -1880,
        ???: 5807,
        ???: 3095,
        ???: 457,
        ???: 2475,
        ???: 1129,
        ???: 2286,
        ???: 4437,
        ???: 365,
        ???: -949,
        ???: -1872,
        ???: 1327,
        ???: -1038,
        ???: 4646,
        ???: -2309,
        ???: -783,
        ???: -1006,
        ???: 483,
        ???: 1233,
        ???: 3588,
        ???: -241,
        ???: 3906,
        ???: -837,
        ???: 4513,
        ???: 642,
        ???: 1389,
        ???: 1219,
        ???: -241,
        ???: 2016,
        ???: -1356,
        ???: -423,
        ???: -1008,
        ???: 1078,
        ???: -513,
        ???: -3102,
        ???: 1155,
        ???: 3197,
        ???: -1804,
        ???: 2416,
        ???: -1030,
        ???: 1605,
        ???: 1452,
        ???: -2352,
        ???: -3885,
        ???: 1905,
        ???: -1291,
        ???: 1822,
        ???: -488,
        ???: -3973,
        ???: -2013,
        ???: -1479,
        ???: 3222,
        ???: -1489,
        ???: 1764,
        ???: 2099,
        ???: 5792,
        ???: -661,
        ???: -1248,
        ???: -951,
        ???: -937,
        ???: 4125,
        ???: 360,
        ???: 3094,
        ???: 364,
        ???: -805,
        ???: 5156,
        ???: 2438,
        ???: 484,
        ???: 2613,
        ???: -1694,
        ???: -1073,
        ???: 1868,
        ???: -495,
        ???: 979,
        ???: 461,
        ???: -3850,
        ???: -273,
        ???: 914,
        ???: 1215,
        ???: 7313,
        ???: -1835,
        ???: 792,
        ???: 6293,
        ???: -1528,
        ???: 4231,
        ???: 401,
        ???: -960,
        ???: 1201,
        ???: 7767,
        ???: 3066,
        ???: 3663,
        ???: 1384,
        ???: -4229,
        ???: 1163,
        ???: 1255,
        ???: 6457,
        ???: 725,
        ???: -2869,
        ???: 785,
        ???: 1044,
        ???: -562,
        ???: -733,
        ???: 1777,
        ???: 1835,
        ???: 1375,
        ???: -1504,
        ???: -1136,
        ???: -681,
        ???: 1026,
        ???: 4404,
        ???: 1200,
        ???: 2163,
        ???: 421,
        ???: -1432,
        ???: 1302,
        ???: -1282,
        ???: 2009,
        ???: -1045,
        ???: 2066,
        ???: 1620,
        "???": -800,
        "???": 2670,
        "???": -3794,
        ???: -1350,
        ???: 551,
        ??????: 1319,
        ???: 874,
        ???: 521,
        ???: 1109,
        ???: 1591,
        ???: 2201,
        ???: 278,
    };
    this.UW4__ = {
        ",": 3930,
        ".": 3508,
        "???": -4841,
        "???": 3930,
        "???": 3508,
        ???: 4999,
        "???": 1895,
        "???": 3798,
        "???": -5156,
        ???: 4752,
        ???: -3435,
        ???: -640,
        ???: -2514,
        ???: 2405,
        ???: 530,
        ???: 6006,
        ???: -4482,
        ???: -3821,
        ???: -3788,
        ???: -4376,
        ???: -4734,
        ???: 2255,
        ???: 1979,
        ???: 2864,
        ???: -843,
        ???: -2506,
        ???: -731,
        ???: 1251,
        ???: 181,
        ???: 4091,
        ???: 5034,
        ???: 5408,
        ???: -3654,
        ???: -5882,
        ???: -1659,
        ???: 3994,
        ???: 7410,
        ???: 4547,
        ???: 5433,
        ???: 6499,
        ???: 1853,
        ???: 1413,
        ???: 7396,
        ???: 8578,
        ???: 1940,
        ???: 4249,
        ???: -4134,
        ???: 1345,
        ???: 6665,
        ???: -744,
        ???: 1464,
        ???: 1051,
        ???: -2082,
        ???: -882,
        ???: -5046,
        ???: 4169,
        ???: -2666,
        ???: 2795,
        ???: -1544,
        ???: 3351,
        ???: -2922,
        ???: -9726,
        ???: -14896,
        ???: -2613,
        ???: -4570,
        ???: -1783,
        ???: 13150,
        ???: -2352,
        ???: 2145,
        ???: 1789,
        ???: 1287,
        ???: -724,
        ???: -403,
        ???: -1635,
        ???: -881,
        ???: -541,
        ???: -856,
        ???: -3637,
        "???": -4371,
        ???: -11870,
        ???: -2069,
        ???: 2210,
        ???: 782,
        ???: -190,
        ???: -1768,
        ???: 1036,
        ???: 544,
        ???: 950,
        ???: -1286,
        ???: 530,
        ???: 4292,
        ???: 601,
        ???: -2006,
        ???: -1212,
        ???: 584,
        ???: 788,
        ???: 1347,
        ???: 1623,
        ???: 3879,
        ???: -302,
        ???: -740,
        ???: -2715,
        ???: 776,
        ???: 4517,
        ???: 1013,
        ???: 1555,
        ???: -1834,
        ???: -681,
        ???: -910,
        ???: -851,
        ???: 1500,
        ???: -619,
        ???: -1200,
        ???: 866,
        ???: -1410,
        ???: -2094,
        ???: -1413,
        ???: 1067,
        ???: 571,
        ???: -4802,
        ???: -1397,
        ???: -1057,
        ???: -809,
        ???: 1910,
        ???: -1328,
        ???: -1500,
        ???: -2056,
        ???: -2667,
        ???: 2771,
        ???: 374,
        ???: -4556,
        ???: 456,
        ???: 553,
        ???: 916,
        ???: -1566,
        ???: 856,
        ???: 787,
        ???: 2182,
        ???: 704,
        ???: 522,
        ???: -856,
        ???: 1798,
        ???: 1829,
        ???: 845,
        ???: -9066,
        ???: -485,
        ???: -442,
        ???: -360,
        ???: -1043,
        ???: 5388,
        ???: -2716,
        ???: -910,
        ???: -939,
        ???: -543,
        ???: -735,
        ???: 672,
        ???: -1267,
        ???: -1286,
        ???: -1101,
        ???: -2900,
        ???: 1826,
        ???: 2586,
        ???: 922,
        ???: -3485,
        ???: 2997,
        ???: -867,
        ???: -2112,
        ???: 788,
        ???: 2937,
        ???: 786,
        ???: 2171,
        ???: 1146,
        ???: -1169,
        ???: 940,
        ???: -994,
        ???: 749,
        ???: 2145,
        ???: -730,
        ???: -852,
        ???: -792,
        ???: 792,
        ???: -1184,
        ???: -244,
        ???: -1000,
        ???: 730,
        ???: -1481,
        ???: 1158,
        ???: -1433,
        ???: -3370,
        ???: 929,
        ???: -1291,
        ???: 2596,
        ???: -4866,
        ???: 1192,
        ???: -1100,
        ???: -2213,
        ???: 357,
        ???: -2344,
        ???: -2297,
        ???: -2604,
        ???: -878,
        ???: -1659,
        ???: -792,
        ???: -1984,
        ???: 1749,
        ???: 2120,
        "???": 1895,
        "???": 3798,
        "???": -4371,
        ???: -724,
        ???: -11870,
        ???: 2145,
        ???: 1789,
        ???: 1287,
        ???: -403,
        ???: -1635,
        ???: -881,
        ???: -541,
        ???: -856,
        ???: -3637,
    };
    this.UW5__ = {
        ",": 465,
        ".": -299,
        1: -514,
        E2: -32768,
        "]": -2762,
        "???": 465,
        "???": -299,
        "???": 363,
        ???: 1655,
        ???: 331,
        ???: -503,
        ???: 1199,
        ???: 527,
        ???: 647,
        ???: -421,
        ???: 1624,
        ???: 1971,
        ???: 312,
        ???: -983,
        ???: -1537,
        ???: -1371,
        ???: -852,
        ???: -1186,
        ???: 1093,
        ???: 52,
        ???: 921,
        ???: -18,
        ???: -850,
        ???: -127,
        ???: 1682,
        ???: -787,
        ???: -1224,
        ???: -635,
        ???: -578,
        ???: 1001,
        ???: 502,
        ???: 865,
        ???: 3350,
        ???: 854,
        ???: -208,
        ???: 429,
        ???: 504,
        ???: 419,
        ???: -1264,
        ???: 327,
        ???: 241,
        ???: 451,
        ???: -343,
        ???: -871,
        ???: 722,
        ???: -1153,
        ???: -654,
        ???: 3519,
        ???: -901,
        ???: 848,
        ???: 2104,
        ???: -1296,
        ???: -548,
        ???: 1785,
        ???: -1304,
        ???: -2991,
        ???: 921,
        ???: 1763,
        ???: 872,
        ???: -814,
        ???: 1618,
        ???: -1682,
        ???: 218,
        ???: -4353,
        ???: 932,
        ???: 1356,
        ???: -1508,
        ???: -1347,
        ???: 240,
        ???: -3912,
        ???: -3149,
        ???: 1319,
        ???: -1052,
        ???: -4003,
        ???: -997,
        ???: -278,
        ???: -813,
        ???: 1955,
        ???: -2233,
        ???: 663,
        ???: -1073,
        ???: 1219,
        ???: -1018,
        ???: -368,
        ???: 786,
        ???: 1191,
        ???: 2368,
        ???: -689,
        "???": -514,
        ??????: -32768,
        "???": 363,
        ???: 241,
        ???: 451,
        ???: -343,
    };
    this.UW6__ = {
        ",": 227,
        ".": 808,
        1: -270,
        E1: 306,
        "???": 227,
        "???": 808,
        ???: -307,
        ???: 189,
        ???: 241,
        ???: -73,
        ???: -121,
        ???: -200,
        ???: 1782,
        ???: 383,
        ???: -428,
        ???: 573,
        ???: -1014,
        ???: 101,
        ???: -105,
        ???: -253,
        ???: -149,
        ???: -417,
        ???: -236,
        ???: -206,
        ???: 187,
        ???: -135,
        ???: 195,
        ???: -673,
        ???: -496,
        ???: -277,
        ???: 201,
        ???: -800,
        ???: 624,
        ???: 302,
        ???: 1792,
        ???: -1212,
        ???: 798,
        ???: -960,
        ???: 887,
        ???: -695,
        ???: 535,
        ???: -697,
        ???: 753,
        ???: -507,
        ???: 974,
        ???: -822,
        ???: 1811,
        ???: 463,
        ???: 1082,
        "???": -270,
        ??????: 306,
        ???: -673,
        ???: -496,
    };
    return this;
}
TinySegmenter.prototype.ctype_ = function (str) {
    for (var i in this.chartype_) {
        if (str.match(this.chartype_[i][0])) {
            return this.chartype_[i][1];
        }
    }
    return "O";
};
TinySegmenter.prototype.ts_ = function (v) {
    if (v) {
        return v;
    }
    return 0;
};
TinySegmenter.prototype.segment = function (input) {
    if (input == null || input == undefined || input == "") {
        return [];
    }
    var result = [];
    var seg = ["B3", "B2", "B1"];
    var ctype = ["O", "O", "O"];
    var o = input.split("");
    for (i = 0; i < o.length; ++i) {
        seg.push(o[i]);
        ctype.push(this.ctype_(o[i]));
    }
    seg.push("E1");
    seg.push("E2");
    seg.push("E3");
    ctype.push("O");
    ctype.push("O");
    ctype.push("O");
    var word = seg[3];
    var p1 = "U";
    var p2 = "U";
    var p3 = "U";
    for (var i = 4; i < seg.length - 3; ++i) {
        var score = this.BIAS__;
        var w1 = seg[i - 3];
        var w2 = seg[i - 2];
        var w3 = seg[i - 1];
        var w4 = seg[i];
        var w5 = seg[i + 1];
        var w6 = seg[i + 2];
        var c1 = ctype[i - 3];
        var c2 = ctype[i - 2];
        var c3 = ctype[i - 1];
        var c4 = ctype[i];
        var c5 = ctype[i + 1];
        var c6 = ctype[i + 2];
        score += this.ts_(this.UP1__[p1]);
        score += this.ts_(this.UP2__[p2]);
        score += this.ts_(this.UP3__[p3]);
        score += this.ts_(this.BP1__[p1 + p2]);
        score += this.ts_(this.BP2__[p2 + p3]);
        score += this.ts_(this.UW1__[w1]);
        score += this.ts_(this.UW2__[w2]);
        score += this.ts_(this.UW3__[w3]);
        score += this.ts_(this.UW4__[w4]);
        score += this.ts_(this.UW5__[w5]);
        score += this.ts_(this.UW6__[w6]);
        score += this.ts_(this.BW1__[w2 + w3]);
        score += this.ts_(this.BW2__[w3 + w4]);
        score += this.ts_(this.BW3__[w4 + w5]);
        score += this.ts_(this.TW1__[w1 + w2 + w3]);
        score += this.ts_(this.TW2__[w2 + w3 + w4]);
        score += this.ts_(this.TW3__[w3 + w4 + w5]);
        score += this.ts_(this.TW4__[w4 + w5 + w6]);
        score += this.ts_(this.UC1__[c1]);
        score += this.ts_(this.UC2__[c2]);
        score += this.ts_(this.UC3__[c3]);
        score += this.ts_(this.UC4__[c4]);
        score += this.ts_(this.UC5__[c5]);
        score += this.ts_(this.UC6__[c6]);
        score += this.ts_(this.BC1__[c2 + c3]);
        score += this.ts_(this.BC2__[c3 + c4]);
        score += this.ts_(this.BC3__[c4 + c5]);
        score += this.ts_(this.TC1__[c1 + c2 + c3]);
        score += this.ts_(this.TC2__[c2 + c3 + c4]);
        score += this.ts_(this.TC3__[c3 + c4 + c5]);
        score += this.ts_(this.TC4__[c4 + c5 + c6]);
        //  score += this.ts_(this.TC5__[c4 + c5 + c6]);
        score += this.ts_(this.UQ1__[p1 + c1]);
        score += this.ts_(this.UQ2__[p2 + c2]);
        score += this.ts_(this.UQ3__[p3 + c3]);
        score += this.ts_(this.BQ1__[p2 + c2 + c3]);
        score += this.ts_(this.BQ2__[p2 + c3 + c4]);
        score += this.ts_(this.BQ3__[p3 + c2 + c3]);
        score += this.ts_(this.BQ4__[p3 + c3 + c4]);
        score += this.ts_(this.TQ1__[p2 + c1 + c2 + c3]);
        score += this.ts_(this.TQ2__[p2 + c2 + c3 + c4]);
        score += this.ts_(this.TQ3__[p3 + c1 + c2 + c3]);
        score += this.ts_(this.TQ4__[p3 + c2 + c3 + c4]);
        var p = "O";
        if (score > 0) {
            result.push(word);
            word = "";
            p = "B";
        }
        p1 = p2;
        p2 = p3;
        p3 = p;
        word += seg[i];
    }
    result.push(word);
    return result;
};

// @ts-ignore
const segmenter = new TinySegmenter();
const TRIM_CHAR_PATTERN = /[\[\]()<>"'.,|; `]/g;
const ARABIC_TRIM_CHAR_PATTERN = /[\[\]()<>"'.,|; `????]/g;
function pickTokens(cmEditor, trimPattern) {
    const maxLineIndex = cmEditor.getDoc().lineCount();
    return [...Array(maxLineIndex).keys()]
        .flatMap((x) => cmEditor
        .getLineTokens(x)
        .flatMap((x) => { var _a; return ((_a = x.type) === null || _a === void 0 ? void 0 : _a.includes("hmd-codeblock")) ? x.string.split(" ") : [x.string]; }))
        .map((x) => x.replace(trimPattern, ""))
        .filter((x) => x !== "");
}
function pickTokensAsJapanese(cmEditor) {
    return cmEditor
        .getValue()
        .split(`\n`)
        .flatMap((x) => segmenter.segment(x))
        .map((x) => x.replace(TRIM_CHAR_PATTERN, ""));
}
class DefaultTokenizer {
    constructor(cmEditor) {
        this.trimPattern = TRIM_CHAR_PATTERN;
        this.cmEditor = cmEditor;
    }
    tokenize() {
        const cursor = this.cmEditor.getCursor();
        const token = this.cmEditor.getTokenAt(cursor);
        if (!token.string) {
            return undefined;
        }
        return {
            currentToken: token.string,
            currentTokenStart: token.start,
            tokens: pickTokens(this.cmEditor, this.trimPattern),
        };
    }
}
class ArabicTokenizer extends DefaultTokenizer {
    constructor() {
        super(...arguments);
        this.trimPattern = ARABIC_TRIM_CHAR_PATTERN;
    }
}
/**
 * Japanese needs original logic.
 */
class JapaneseTokenizer {
    constructor(cmEditor) {
        this.cmEditor = cmEditor;
    }
    tokenize() {
        const cursor = this.cmEditor.getCursor();
        const token = this.cmEditor.getTokenAt(cursor);
        if (!token.string) {
            return undefined;
        }
        const words = segmenter.segment(token.string);
        const currentToken = words.pop();
        const currentTokenStart = token.start + words.reduce((t, x) => t + x.length, 0);
        const tokens = pickTokensAsJapanese(this.cmEditor);
        return {
            currentToken,
            currentTokenStart,
            tokens,
        };
    }
}
function createTokenizer(cmEditor, strategy) {
    switch (strategy) {
        case "default":
            return new DefaultTokenizer(cmEditor);
        case "arabic":
            return new ArabicTokenizer(cmEditor);
        case "japanese":
            return new JapaneseTokenizer(cmEditor);
        default:
            throw new Error(`Unexpected strategy name: ${strategy}`);
    }
}

var CodeMirror$1 = window.CodeMirror;
/**
 * This function uses case-sensitive logic if a second argument has an upper case. Otherwise, uses case-insensitive logic.
 */
const caseIncludes = (one, other) => {
    const lowerOther = other.toLowerCase();
    return lowerOther === other
        ? one.toLowerCase().includes(lowerOther)
        : one.includes(other);
};
const lowerStartsWith = (a, b) => a.toLowerCase().startsWith(b.toLowerCase());
function selectSuggestedTokens(tokens, word) {
    return Array.from(new Set(tokens))
        .filter((x) => x !== word)
        .filter((x) => caseIncludes(x, word))
        .sort((a, b) => a.length - b.length)
        .sort((a, b) => Number(lowerStartsWith(b, word)) - Number(lowerStartsWith(a, word)))
        .slice(0, 5);
}
class VariousComponentsPlugin extends obsidian.Plugin {
    execAutoComplete(strategy) {
        const currentView = this.app.workspace.getActiveViewOfType(obsidian.MarkdownView);
        if (!currentView) {
            // Do nothing if the command is triggered outside a MarkdownView
            return;
        }
        const cmEditor = currentView.sourceMode.cmEditor;
        CodeMirror$1.showHint(cmEditor, () => {
            const tokenized = createTokenizer(cmEditor, strategy).tokenize();
            if (!tokenized) {
                return;
            }
            const suggestedTokens = selectSuggestedTokens(tokenized.tokens, tokenized.currentToken);
            if (suggestedTokens.length === 0) {
                return;
            }
            const cursor = cmEditor.getCursor();
            return {
                list: suggestedTokens,
                from: CodeMirror$1.Pos(cursor.line, tokenized.currentTokenStart),
                to: CodeMirror$1.Pos(cursor.line, cursor.ch),
            };
        }, {
            completeSingle: true,
        });
    }
    onload() {
        return __awaiter(this, void 0, void 0, function* () {
            this.addCommand({
                id: "auto-complete",
                name: "Auto Complete",
                hotkeys: [{ modifiers: ["Ctrl"], key: " " }],
                checkCallback: (checking) => {
                    if (checking) {
                        return !!this.app.workspace.getActiveViewOfType(obsidian.MarkdownView);
                    }
                    this.execAutoComplete("default");
                },
            });
            this.addCommand({
                id: "auto-complete-as-arabic",
                name: "Auto Complete as Arabic",
                checkCallback: (checking) => {
                    if (checking) {
                        return !!this.app.workspace.getActiveViewOfType(obsidian.MarkdownView);
                    }
                    this.execAutoComplete("arabic");
                },
            });
            this.addCommand({
                id: "auto-complete-as-japanese",
                name: "Auto Complete as Japanese",
                checkCallback: (checking) => {
                    if (checking) {
                        return !!this.app.workspace.getActiveViewOfType(obsidian.MarkdownView);
                    }
                    this.execAutoComplete("japanese");
                },
            });
        });
    }
}

module.exports = VariousComponentsPlugin;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXMiOlsibm9kZV9tb2R1bGVzL3RzbGliL3RzbGliLmVzNi5qcyIsInNob3ctaGludC50cyIsInRpbnktc2VnbWVudGVyLnRzIiwidG9rZW5pemVyLnRzIiwibWFpbi50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKiEgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcclxuQ29weXJpZ2h0IChjKSBNaWNyb3NvZnQgQ29ycG9yYXRpb24uXHJcblxyXG5QZXJtaXNzaW9uIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBhbmQvb3IgZGlzdHJpYnV0ZSB0aGlzIHNvZnR3YXJlIGZvciBhbnlcclxucHVycG9zZSB3aXRoIG9yIHdpdGhvdXQgZmVlIGlzIGhlcmVieSBncmFudGVkLlxyXG5cclxuVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiBBTkQgVEhFIEFVVEhPUiBESVNDTEFJTVMgQUxMIFdBUlJBTlRJRVMgV0lUSFxyXG5SRUdBUkQgVE8gVEhJUyBTT0ZUV0FSRSBJTkNMVURJTkcgQUxMIElNUExJRUQgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFlcclxuQU5EIEZJVE5FU1MuIElOIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1IgQkUgTElBQkxFIEZPUiBBTlkgU1BFQ0lBTCwgRElSRUNULFxyXG5JTkRJUkVDVCwgT1IgQ09OU0VRVUVOVElBTCBEQU1BR0VTIE9SIEFOWSBEQU1BR0VTIFdIQVRTT0VWRVIgUkVTVUxUSU5HIEZST01cclxuTE9TUyBPRiBVU0UsIERBVEEgT1IgUFJPRklUUywgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIE5FR0xJR0VOQ0UgT1JcclxuT1RIRVIgVE9SVElPVVMgQUNUSU9OLCBBUklTSU5HIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFVTRSBPUlxyXG5QRVJGT1JNQU5DRSBPRiBUSElTIFNPRlRXQVJFLlxyXG4qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiAqL1xyXG4vKiBnbG9iYWwgUmVmbGVjdCwgUHJvbWlzZSAqL1xyXG5cclxudmFyIGV4dGVuZFN0YXRpY3MgPSBmdW5jdGlvbihkLCBiKSB7XHJcbiAgICBleHRlbmRTdGF0aWNzID0gT2JqZWN0LnNldFByb3RvdHlwZU9mIHx8XHJcbiAgICAgICAgKHsgX19wcm90b19fOiBbXSB9IGluc3RhbmNlb2YgQXJyYXkgJiYgZnVuY3Rpb24gKGQsIGIpIHsgZC5fX3Byb3RvX18gPSBiOyB9KSB8fFxyXG4gICAgICAgIGZ1bmN0aW9uIChkLCBiKSB7IGZvciAodmFyIHAgaW4gYikgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChiLCBwKSkgZFtwXSA9IGJbcF07IH07XHJcbiAgICByZXR1cm4gZXh0ZW5kU3RhdGljcyhkLCBiKTtcclxufTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2V4dGVuZHMoZCwgYikge1xyXG4gICAgaWYgKHR5cGVvZiBiICE9PSBcImZ1bmN0aW9uXCIgJiYgYiAhPT0gbnVsbClcclxuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQ2xhc3MgZXh0ZW5kcyB2YWx1ZSBcIiArIFN0cmluZyhiKSArIFwiIGlzIG5vdCBhIGNvbnN0cnVjdG9yIG9yIG51bGxcIik7XHJcbiAgICBleHRlbmRTdGF0aWNzKGQsIGIpO1xyXG4gICAgZnVuY3Rpb24gX18oKSB7IHRoaXMuY29uc3RydWN0b3IgPSBkOyB9XHJcbiAgICBkLnByb3RvdHlwZSA9IGIgPT09IG51bGwgPyBPYmplY3QuY3JlYXRlKGIpIDogKF9fLnByb3RvdHlwZSA9IGIucHJvdG90eXBlLCBuZXcgX18oKSk7XHJcbn1cclxuXHJcbmV4cG9ydCB2YXIgX19hc3NpZ24gPSBmdW5jdGlvbigpIHtcclxuICAgIF9fYXNzaWduID0gT2JqZWN0LmFzc2lnbiB8fCBmdW5jdGlvbiBfX2Fzc2lnbih0KSB7XHJcbiAgICAgICAgZm9yICh2YXIgcywgaSA9IDEsIG4gPSBhcmd1bWVudHMubGVuZ3RoOyBpIDwgbjsgaSsrKSB7XHJcbiAgICAgICAgICAgIHMgPSBhcmd1bWVudHNbaV07XHJcbiAgICAgICAgICAgIGZvciAodmFyIHAgaW4gcykgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChzLCBwKSkgdFtwXSA9IHNbcF07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0O1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIF9fYXNzaWduLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX3Jlc3QocywgZSkge1xyXG4gICAgdmFyIHQgPSB7fTtcclxuICAgIGZvciAodmFyIHAgaW4gcykgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChzLCBwKSAmJiBlLmluZGV4T2YocCkgPCAwKVxyXG4gICAgICAgIHRbcF0gPSBzW3BdO1xyXG4gICAgaWYgKHMgIT0gbnVsbCAmJiB0eXBlb2YgT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyA9PT0gXCJmdW5jdGlvblwiKVxyXG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBwID0gT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyhzKTsgaSA8IHAubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgaWYgKGUuaW5kZXhPZihwW2ldKSA8IDAgJiYgT2JqZWN0LnByb3RvdHlwZS5wcm9wZXJ0eUlzRW51bWVyYWJsZS5jYWxsKHMsIHBbaV0pKVxyXG4gICAgICAgICAgICAgICAgdFtwW2ldXSA9IHNbcFtpXV07XHJcbiAgICAgICAgfVxyXG4gICAgcmV0dXJuIHQ7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2RlY29yYXRlKGRlY29yYXRvcnMsIHRhcmdldCwga2V5LCBkZXNjKSB7XHJcbiAgICB2YXIgYyA9IGFyZ3VtZW50cy5sZW5ndGgsIHIgPSBjIDwgMyA/IHRhcmdldCA6IGRlc2MgPT09IG51bGwgPyBkZXNjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcih0YXJnZXQsIGtleSkgOiBkZXNjLCBkO1xyXG4gICAgaWYgKHR5cGVvZiBSZWZsZWN0ID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiBSZWZsZWN0LmRlY29yYXRlID09PSBcImZ1bmN0aW9uXCIpIHIgPSBSZWZsZWN0LmRlY29yYXRlKGRlY29yYXRvcnMsIHRhcmdldCwga2V5LCBkZXNjKTtcclxuICAgIGVsc2UgZm9yICh2YXIgaSA9IGRlY29yYXRvcnMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIGlmIChkID0gZGVjb3JhdG9yc1tpXSkgciA9IChjIDwgMyA/IGQocikgOiBjID4gMyA/IGQodGFyZ2V0LCBrZXksIHIpIDogZCh0YXJnZXQsIGtleSkpIHx8IHI7XHJcbiAgICByZXR1cm4gYyA+IDMgJiYgciAmJiBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBrZXksIHIpLCByO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19wYXJhbShwYXJhbUluZGV4LCBkZWNvcmF0b3IpIHtcclxuICAgIHJldHVybiBmdW5jdGlvbiAodGFyZ2V0LCBrZXkpIHsgZGVjb3JhdG9yKHRhcmdldCwga2V5LCBwYXJhbUluZGV4KTsgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19tZXRhZGF0YShtZXRhZGF0YUtleSwgbWV0YWRhdGFWYWx1ZSkge1xyXG4gICAgaWYgKHR5cGVvZiBSZWZsZWN0ID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiBSZWZsZWN0Lm1ldGFkYXRhID09PSBcImZ1bmN0aW9uXCIpIHJldHVybiBSZWZsZWN0Lm1ldGFkYXRhKG1ldGFkYXRhS2V5LCBtZXRhZGF0YVZhbHVlKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fYXdhaXRlcih0aGlzQXJnLCBfYXJndW1lbnRzLCBQLCBnZW5lcmF0b3IpIHtcclxuICAgIGZ1bmN0aW9uIGFkb3B0KHZhbHVlKSB7IHJldHVybiB2YWx1ZSBpbnN0YW5jZW9mIFAgPyB2YWx1ZSA6IG5ldyBQKGZ1bmN0aW9uIChyZXNvbHZlKSB7IHJlc29sdmUodmFsdWUpOyB9KTsgfVxyXG4gICAgcmV0dXJuIG5ldyAoUCB8fCAoUCA9IFByb21pc2UpKShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XHJcbiAgICAgICAgZnVuY3Rpb24gZnVsZmlsbGVkKHZhbHVlKSB7IHRyeSB7IHN0ZXAoZ2VuZXJhdG9yLm5leHQodmFsdWUpKTsgfSBjYXRjaCAoZSkgeyByZWplY3QoZSk7IH0gfVxyXG4gICAgICAgIGZ1bmN0aW9uIHJlamVjdGVkKHZhbHVlKSB7IHRyeSB7IHN0ZXAoZ2VuZXJhdG9yW1widGhyb3dcIl0odmFsdWUpKTsgfSBjYXRjaCAoZSkgeyByZWplY3QoZSk7IH0gfVxyXG4gICAgICAgIGZ1bmN0aW9uIHN0ZXAocmVzdWx0KSB7IHJlc3VsdC5kb25lID8gcmVzb2x2ZShyZXN1bHQudmFsdWUpIDogYWRvcHQocmVzdWx0LnZhbHVlKS50aGVuKGZ1bGZpbGxlZCwgcmVqZWN0ZWQpOyB9XHJcbiAgICAgICAgc3RlcCgoZ2VuZXJhdG9yID0gZ2VuZXJhdG9yLmFwcGx5KHRoaXNBcmcsIF9hcmd1bWVudHMgfHwgW10pKS5uZXh0KCkpO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2dlbmVyYXRvcih0aGlzQXJnLCBib2R5KSB7XHJcbiAgICB2YXIgXyA9IHsgbGFiZWw6IDAsIHNlbnQ6IGZ1bmN0aW9uKCkgeyBpZiAodFswXSAmIDEpIHRocm93IHRbMV07IHJldHVybiB0WzFdOyB9LCB0cnlzOiBbXSwgb3BzOiBbXSB9LCBmLCB5LCB0LCBnO1xyXG4gICAgcmV0dXJuIGcgPSB7IG5leHQ6IHZlcmIoMCksIFwidGhyb3dcIjogdmVyYigxKSwgXCJyZXR1cm5cIjogdmVyYigyKSB9LCB0eXBlb2YgU3ltYm9sID09PSBcImZ1bmN0aW9uXCIgJiYgKGdbU3ltYm9sLml0ZXJhdG9yXSA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gdGhpczsgfSksIGc7XHJcbiAgICBmdW5jdGlvbiB2ZXJiKG4pIHsgcmV0dXJuIGZ1bmN0aW9uICh2KSB7IHJldHVybiBzdGVwKFtuLCB2XSk7IH07IH1cclxuICAgIGZ1bmN0aW9uIHN0ZXAob3ApIHtcclxuICAgICAgICBpZiAoZikgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkdlbmVyYXRvciBpcyBhbHJlYWR5IGV4ZWN1dGluZy5cIik7XHJcbiAgICAgICAgd2hpbGUgKF8pIHRyeSB7XHJcbiAgICAgICAgICAgIGlmIChmID0gMSwgeSAmJiAodCA9IG9wWzBdICYgMiA/IHlbXCJyZXR1cm5cIl0gOiBvcFswXSA/IHlbXCJ0aHJvd1wiXSB8fCAoKHQgPSB5W1wicmV0dXJuXCJdKSAmJiB0LmNhbGwoeSksIDApIDogeS5uZXh0KSAmJiAhKHQgPSB0LmNhbGwoeSwgb3BbMV0pKS5kb25lKSByZXR1cm4gdDtcclxuICAgICAgICAgICAgaWYgKHkgPSAwLCB0KSBvcCA9IFtvcFswXSAmIDIsIHQudmFsdWVdO1xyXG4gICAgICAgICAgICBzd2l0Y2ggKG9wWzBdKSB7XHJcbiAgICAgICAgICAgICAgICBjYXNlIDA6IGNhc2UgMTogdCA9IG9wOyBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgNDogXy5sYWJlbCsrOyByZXR1cm4geyB2YWx1ZTogb3BbMV0sIGRvbmU6IGZhbHNlIH07XHJcbiAgICAgICAgICAgICAgICBjYXNlIDU6IF8ubGFiZWwrKzsgeSA9IG9wWzFdOyBvcCA9IFswXTsgY29udGludWU7XHJcbiAgICAgICAgICAgICAgICBjYXNlIDc6IG9wID0gXy5vcHMucG9wKCk7IF8udHJ5cy5wb3AoKTsgY29udGludWU7XHJcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgICAgIGlmICghKHQgPSBfLnRyeXMsIHQgPSB0Lmxlbmd0aCA+IDAgJiYgdFt0Lmxlbmd0aCAtIDFdKSAmJiAob3BbMF0gPT09IDYgfHwgb3BbMF0gPT09IDIpKSB7IF8gPSAwOyBjb250aW51ZTsgfVxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChvcFswXSA9PT0gMyAmJiAoIXQgfHwgKG9wWzFdID4gdFswXSAmJiBvcFsxXSA8IHRbM10pKSkgeyBfLmxhYmVsID0gb3BbMV07IGJyZWFrOyB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9wWzBdID09PSA2ICYmIF8ubGFiZWwgPCB0WzFdKSB7IF8ubGFiZWwgPSB0WzFdOyB0ID0gb3A7IGJyZWFrOyB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHQgJiYgXy5sYWJlbCA8IHRbMl0pIHsgXy5sYWJlbCA9IHRbMl07IF8ub3BzLnB1c2gob3ApOyBicmVhazsgfVxyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0WzJdKSBfLm9wcy5wb3AoKTtcclxuICAgICAgICAgICAgICAgICAgICBfLnRyeXMucG9wKCk7IGNvbnRpbnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIG9wID0gYm9keS5jYWxsKHRoaXNBcmcsIF8pO1xyXG4gICAgICAgIH0gY2F0Y2ggKGUpIHsgb3AgPSBbNiwgZV07IHkgPSAwOyB9IGZpbmFsbHkgeyBmID0gdCA9IDA7IH1cclxuICAgICAgICBpZiAob3BbMF0gJiA1KSB0aHJvdyBvcFsxXTsgcmV0dXJuIHsgdmFsdWU6IG9wWzBdID8gb3BbMV0gOiB2b2lkIDAsIGRvbmU6IHRydWUgfTtcclxuICAgIH1cclxufVxyXG5cclxuZXhwb3J0IHZhciBfX2NyZWF0ZUJpbmRpbmcgPSBPYmplY3QuY3JlYXRlID8gKGZ1bmN0aW9uKG8sIG0sIGssIGsyKSB7XHJcbiAgICBpZiAoazIgPT09IHVuZGVmaW5lZCkgazIgPSBrO1xyXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KG8sIGsyLCB7IGVudW1lcmFibGU6IHRydWUsIGdldDogZnVuY3Rpb24oKSB7IHJldHVybiBtW2tdOyB9IH0pO1xyXG59KSA6IChmdW5jdGlvbihvLCBtLCBrLCBrMikge1xyXG4gICAgaWYgKGsyID09PSB1bmRlZmluZWQpIGsyID0gaztcclxuICAgIG9bazJdID0gbVtrXTtcclxufSk7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19leHBvcnRTdGFyKG0sIG8pIHtcclxuICAgIGZvciAodmFyIHAgaW4gbSkgaWYgKHAgIT09IFwiZGVmYXVsdFwiICYmICFPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwobywgcCkpIF9fY3JlYXRlQmluZGluZyhvLCBtLCBwKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fdmFsdWVzKG8pIHtcclxuICAgIHZhciBzID0gdHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICYmIFN5bWJvbC5pdGVyYXRvciwgbSA9IHMgJiYgb1tzXSwgaSA9IDA7XHJcbiAgICBpZiAobSkgcmV0dXJuIG0uY2FsbChvKTtcclxuICAgIGlmIChvICYmIHR5cGVvZiBvLmxlbmd0aCA9PT0gXCJudW1iZXJcIikgcmV0dXJuIHtcclxuICAgICAgICBuZXh0OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGlmIChvICYmIGkgPj0gby5sZW5ndGgpIG8gPSB2b2lkIDA7XHJcbiAgICAgICAgICAgIHJldHVybiB7IHZhbHVlOiBvICYmIG9baSsrXSwgZG9uZTogIW8gfTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihzID8gXCJPYmplY3QgaXMgbm90IGl0ZXJhYmxlLlwiIDogXCJTeW1ib2wuaXRlcmF0b3IgaXMgbm90IGRlZmluZWQuXCIpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19yZWFkKG8sIG4pIHtcclxuICAgIHZhciBtID0gdHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICYmIG9bU3ltYm9sLml0ZXJhdG9yXTtcclxuICAgIGlmICghbSkgcmV0dXJuIG87XHJcbiAgICB2YXIgaSA9IG0uY2FsbChvKSwgciwgYXIgPSBbXSwgZTtcclxuICAgIHRyeSB7XHJcbiAgICAgICAgd2hpbGUgKChuID09PSB2b2lkIDAgfHwgbi0tID4gMCkgJiYgIShyID0gaS5uZXh0KCkpLmRvbmUpIGFyLnB1c2goci52YWx1ZSk7XHJcbiAgICB9XHJcbiAgICBjYXRjaCAoZXJyb3IpIHsgZSA9IHsgZXJyb3I6IGVycm9yIH07IH1cclxuICAgIGZpbmFsbHkge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGlmIChyICYmICFyLmRvbmUgJiYgKG0gPSBpW1wicmV0dXJuXCJdKSkgbS5jYWxsKGkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmaW5hbGx5IHsgaWYgKGUpIHRocm93IGUuZXJyb3I7IH1cclxuICAgIH1cclxuICAgIHJldHVybiBhcjtcclxufVxyXG5cclxuLyoqIEBkZXByZWNhdGVkICovXHJcbmV4cG9ydCBmdW5jdGlvbiBfX3NwcmVhZCgpIHtcclxuICAgIGZvciAodmFyIGFyID0gW10sIGkgPSAwOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKVxyXG4gICAgICAgIGFyID0gYXIuY29uY2F0KF9fcmVhZChhcmd1bWVudHNbaV0pKTtcclxuICAgIHJldHVybiBhcjtcclxufVxyXG5cclxuLyoqIEBkZXByZWNhdGVkICovXHJcbmV4cG9ydCBmdW5jdGlvbiBfX3NwcmVhZEFycmF5cygpIHtcclxuICAgIGZvciAodmFyIHMgPSAwLCBpID0gMCwgaWwgPSBhcmd1bWVudHMubGVuZ3RoOyBpIDwgaWw7IGkrKykgcyArPSBhcmd1bWVudHNbaV0ubGVuZ3RoO1xyXG4gICAgZm9yICh2YXIgciA9IEFycmF5KHMpLCBrID0gMCwgaSA9IDA7IGkgPCBpbDsgaSsrKVxyXG4gICAgICAgIGZvciAodmFyIGEgPSBhcmd1bWVudHNbaV0sIGogPSAwLCBqbCA9IGEubGVuZ3RoOyBqIDwgamw7IGorKywgaysrKVxyXG4gICAgICAgICAgICByW2tdID0gYVtqXTtcclxuICAgIHJldHVybiByO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19zcHJlYWRBcnJheSh0bywgZnJvbSkge1xyXG4gICAgZm9yICh2YXIgaSA9IDAsIGlsID0gZnJvbS5sZW5ndGgsIGogPSB0by5sZW5ndGg7IGkgPCBpbDsgaSsrLCBqKyspXHJcbiAgICAgICAgdG9bal0gPSBmcm9tW2ldO1xyXG4gICAgcmV0dXJuIHRvO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX19hd2FpdCh2KSB7XHJcbiAgICByZXR1cm4gdGhpcyBpbnN0YW5jZW9mIF9fYXdhaXQgPyAodGhpcy52ID0gdiwgdGhpcykgOiBuZXcgX19hd2FpdCh2KTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fYXN5bmNHZW5lcmF0b3IodGhpc0FyZywgX2FyZ3VtZW50cywgZ2VuZXJhdG9yKSB7XHJcbiAgICBpZiAoIVN5bWJvbC5hc3luY0l0ZXJhdG9yKSB0aHJvdyBuZXcgVHlwZUVycm9yKFwiU3ltYm9sLmFzeW5jSXRlcmF0b3IgaXMgbm90IGRlZmluZWQuXCIpO1xyXG4gICAgdmFyIGcgPSBnZW5lcmF0b3IuYXBwbHkodGhpc0FyZywgX2FyZ3VtZW50cyB8fCBbXSksIGksIHEgPSBbXTtcclxuICAgIHJldHVybiBpID0ge30sIHZlcmIoXCJuZXh0XCIpLCB2ZXJiKFwidGhyb3dcIiksIHZlcmIoXCJyZXR1cm5cIiksIGlbU3ltYm9sLmFzeW5jSXRlcmF0b3JdID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gdGhpczsgfSwgaTtcclxuICAgIGZ1bmN0aW9uIHZlcmIobikgeyBpZiAoZ1tuXSkgaVtuXSA9IGZ1bmN0aW9uICh2KSB7IHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAoYSwgYikgeyBxLnB1c2goW24sIHYsIGEsIGJdKSA+IDEgfHwgcmVzdW1lKG4sIHYpOyB9KTsgfTsgfVxyXG4gICAgZnVuY3Rpb24gcmVzdW1lKG4sIHYpIHsgdHJ5IHsgc3RlcChnW25dKHYpKTsgfSBjYXRjaCAoZSkgeyBzZXR0bGUocVswXVszXSwgZSk7IH0gfVxyXG4gICAgZnVuY3Rpb24gc3RlcChyKSB7IHIudmFsdWUgaW5zdGFuY2VvZiBfX2F3YWl0ID8gUHJvbWlzZS5yZXNvbHZlKHIudmFsdWUudikudGhlbihmdWxmaWxsLCByZWplY3QpIDogc2V0dGxlKHFbMF1bMl0sIHIpOyB9XHJcbiAgICBmdW5jdGlvbiBmdWxmaWxsKHZhbHVlKSB7IHJlc3VtZShcIm5leHRcIiwgdmFsdWUpOyB9XHJcbiAgICBmdW5jdGlvbiByZWplY3QodmFsdWUpIHsgcmVzdW1lKFwidGhyb3dcIiwgdmFsdWUpOyB9XHJcbiAgICBmdW5jdGlvbiBzZXR0bGUoZiwgdikgeyBpZiAoZih2KSwgcS5zaGlmdCgpLCBxLmxlbmd0aCkgcmVzdW1lKHFbMF1bMF0sIHFbMF1bMV0pOyB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2FzeW5jRGVsZWdhdG9yKG8pIHtcclxuICAgIHZhciBpLCBwO1xyXG4gICAgcmV0dXJuIGkgPSB7fSwgdmVyYihcIm5leHRcIiksIHZlcmIoXCJ0aHJvd1wiLCBmdW5jdGlvbiAoZSkgeyB0aHJvdyBlOyB9KSwgdmVyYihcInJldHVyblwiKSwgaVtTeW1ib2wuaXRlcmF0b3JdID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gdGhpczsgfSwgaTtcclxuICAgIGZ1bmN0aW9uIHZlcmIobiwgZikgeyBpW25dID0gb1tuXSA/IGZ1bmN0aW9uICh2KSB7IHJldHVybiAocCA9ICFwKSA/IHsgdmFsdWU6IF9fYXdhaXQob1tuXSh2KSksIGRvbmU6IG4gPT09IFwicmV0dXJuXCIgfSA6IGYgPyBmKHYpIDogdjsgfSA6IGY7IH1cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fYXN5bmNWYWx1ZXMobykge1xyXG4gICAgaWYgKCFTeW1ib2wuYXN5bmNJdGVyYXRvcikgdGhyb3cgbmV3IFR5cGVFcnJvcihcIlN5bWJvbC5hc3luY0l0ZXJhdG9yIGlzIG5vdCBkZWZpbmVkLlwiKTtcclxuICAgIHZhciBtID0gb1tTeW1ib2wuYXN5bmNJdGVyYXRvcl0sIGk7XHJcbiAgICByZXR1cm4gbSA/IG0uY2FsbChvKSA6IChvID0gdHlwZW9mIF9fdmFsdWVzID09PSBcImZ1bmN0aW9uXCIgPyBfX3ZhbHVlcyhvKSA6IG9bU3ltYm9sLml0ZXJhdG9yXSgpLCBpID0ge30sIHZlcmIoXCJuZXh0XCIpLCB2ZXJiKFwidGhyb3dcIiksIHZlcmIoXCJyZXR1cm5cIiksIGlbU3ltYm9sLmFzeW5jSXRlcmF0b3JdID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gdGhpczsgfSwgaSk7XHJcbiAgICBmdW5jdGlvbiB2ZXJiKG4pIHsgaVtuXSA9IG9bbl0gJiYgZnVuY3Rpb24gKHYpIHsgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHsgdiA9IG9bbl0odiksIHNldHRsZShyZXNvbHZlLCByZWplY3QsIHYuZG9uZSwgdi52YWx1ZSk7IH0pOyB9OyB9XHJcbiAgICBmdW5jdGlvbiBzZXR0bGUocmVzb2x2ZSwgcmVqZWN0LCBkLCB2KSB7IFByb21pc2UucmVzb2x2ZSh2KS50aGVuKGZ1bmN0aW9uKHYpIHsgcmVzb2x2ZSh7IHZhbHVlOiB2LCBkb25lOiBkIH0pOyB9LCByZWplY3QpOyB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX21ha2VUZW1wbGF0ZU9iamVjdChjb29rZWQsIHJhdykge1xyXG4gICAgaWYgKE9iamVjdC5kZWZpbmVQcm9wZXJ0eSkgeyBPYmplY3QuZGVmaW5lUHJvcGVydHkoY29va2VkLCBcInJhd1wiLCB7IHZhbHVlOiByYXcgfSk7IH0gZWxzZSB7IGNvb2tlZC5yYXcgPSByYXc7IH1cclxuICAgIHJldHVybiBjb29rZWQ7XHJcbn07XHJcblxyXG52YXIgX19zZXRNb2R1bGVEZWZhdWx0ID0gT2JqZWN0LmNyZWF0ZSA/IChmdW5jdGlvbihvLCB2KSB7XHJcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkobywgXCJkZWZhdWx0XCIsIHsgZW51bWVyYWJsZTogdHJ1ZSwgdmFsdWU6IHYgfSk7XHJcbn0pIDogZnVuY3Rpb24obywgdikge1xyXG4gICAgb1tcImRlZmF1bHRcIl0gPSB2O1xyXG59O1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9faW1wb3J0U3Rhcihtb2QpIHtcclxuICAgIGlmIChtb2QgJiYgbW9kLl9fZXNNb2R1bGUpIHJldHVybiBtb2Q7XHJcbiAgICB2YXIgcmVzdWx0ID0ge307XHJcbiAgICBpZiAobW9kICE9IG51bGwpIGZvciAodmFyIGsgaW4gbW9kKSBpZiAoayAhPT0gXCJkZWZhdWx0XCIgJiYgT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG1vZCwgaykpIF9fY3JlYXRlQmluZGluZyhyZXN1bHQsIG1vZCwgayk7XHJcbiAgICBfX3NldE1vZHVsZURlZmF1bHQocmVzdWx0LCBtb2QpO1xyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9faW1wb3J0RGVmYXVsdChtb2QpIHtcclxuICAgIHJldHVybiAobW9kICYmIG1vZC5fX2VzTW9kdWxlKSA/IG1vZCA6IHsgZGVmYXVsdDogbW9kIH07XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBfX2NsYXNzUHJpdmF0ZUZpZWxkR2V0KHJlY2VpdmVyLCBwcml2YXRlTWFwKSB7XHJcbiAgICBpZiAoIXByaXZhdGVNYXAuaGFzKHJlY2VpdmVyKSkge1xyXG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJhdHRlbXB0ZWQgdG8gZ2V0IHByaXZhdGUgZmllbGQgb24gbm9uLWluc3RhbmNlXCIpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHByaXZhdGVNYXAuZ2V0KHJlY2VpdmVyKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9fY2xhc3NQcml2YXRlRmllbGRTZXQocmVjZWl2ZXIsIHByaXZhdGVNYXAsIHZhbHVlKSB7XHJcbiAgICBpZiAoIXByaXZhdGVNYXAuaGFzKHJlY2VpdmVyKSkge1xyXG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJhdHRlbXB0ZWQgdG8gc2V0IHByaXZhdGUgZmllbGQgb24gbm9uLWluc3RhbmNlXCIpO1xyXG4gICAgfVxyXG4gICAgcHJpdmF0ZU1hcC5zZXQocmVjZWl2ZXIsIHZhbHVlKTtcclxuICAgIHJldHVybiB2YWx1ZTtcclxufVxyXG4iLCIvLyBAdHMtbm9jaGVja1xuLy8gQmVjYXVzZSB0aGlzIGNvZGUgaXMgb3JpZ2luYWxseSBqYXZhc2NyaXB0IGNvZGUuXG5cbi8vIENvZGVNaXJyb3IsIGNvcHlyaWdodCAoYykgYnkgTWFyaWpuIEhhdmVyYmVrZSBhbmQgb3RoZXJzXG4vLyBEaXN0cmlidXRlZCB1bmRlciBhbiBNSVQgbGljZW5zZTogaHR0cHM6Ly9jb2RlbWlycm9yLm5ldC9MSUNFTlNFXG5cbi8vIGRlY2xhcmUgZ2xvYmFsOiBET01SZWN0XG5cblwidXNlIHN0cmljdFwiO1xuXG52YXIgSElOVF9FTEVNRU5UX0NMQVNTID0gXCJDb2RlTWlycm9yLWhpbnRcIjtcbnZhciBBQ1RJVkVfSElOVF9FTEVNRU5UX0NMQVNTID0gXCJDb2RlTWlycm9yLWhpbnQtYWN0aXZlXCI7XG5cbi8vIFRoaXMgaXMgdGhlIG9sZCBpbnRlcmZhY2UsIGtlcHQgYXJvdW5kIGZvciBub3cgdG8gc3RheVxuLy8gYmFja3dhcmRzLWNvbXBhdGlibGUuXG5Db2RlTWlycm9yLnNob3dIaW50ID0gZnVuY3Rpb24gKGNtLCBnZXRIaW50cywgb3B0aW9ucykge1xuICBpZiAoIWdldEhpbnRzKSByZXR1cm4gY20uc2hvd0hpbnQob3B0aW9ucyk7XG4gIGlmIChvcHRpb25zICYmIG9wdGlvbnMuYXN5bmMpIGdldEhpbnRzLmFzeW5jID0gdHJ1ZTtcbiAgdmFyIG5ld09wdHMgPSB7IGhpbnQ6IGdldEhpbnRzIH07XG4gIGlmIChvcHRpb25zKSBmb3IgKHZhciBwcm9wIGluIG9wdGlvbnMpIG5ld09wdHNbcHJvcF0gPSBvcHRpb25zW3Byb3BdO1xuICByZXR1cm4gY20uc2hvd0hpbnQobmV3T3B0cyk7XG59O1xuXG5Db2RlTWlycm9yLmRlZmluZUV4dGVuc2lvbihcInNob3dIaW50XCIsIGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gIG9wdGlvbnMgPSBwYXJzZU9wdGlvbnModGhpcywgdGhpcy5nZXRDdXJzb3IoXCJzdGFydFwiKSwgb3B0aW9ucyk7XG4gIHZhciBzZWxlY3Rpb25zID0gdGhpcy5saXN0U2VsZWN0aW9ucygpO1xuICBpZiAoc2VsZWN0aW9ucy5sZW5ndGggPiAxKSByZXR1cm47XG4gIC8vIEJ5IGRlZmF1bHQsIGRvbid0IGFsbG93IGNvbXBsZXRpb24gd2hlbiBzb21ldGhpbmcgaXMgc2VsZWN0ZWQuXG4gIC8vIEEgaGludCBmdW5jdGlvbiBjYW4gaGF2ZSBhIGBzdXBwb3J0c1NlbGVjdGlvbmAgcHJvcGVydHkgdG9cbiAgLy8gaW5kaWNhdGUgdGhhdCBpdCBjYW4gaGFuZGxlIHNlbGVjdGlvbnMuXG4gIGlmICh0aGlzLnNvbWV0aGluZ1NlbGVjdGVkKCkpIHtcbiAgICBpZiAoIW9wdGlvbnMuaGludC5zdXBwb3J0c1NlbGVjdGlvbikgcmV0dXJuO1xuICAgIC8vIERvbid0IHRyeSB3aXRoIGNyb3NzLWxpbmUgc2VsZWN0aW9uc1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc2VsZWN0aW9ucy5sZW5ndGg7IGkrKylcbiAgICAgIGlmIChzZWxlY3Rpb25zW2ldLmhlYWQubGluZSAhPSBzZWxlY3Rpb25zW2ldLmFuY2hvci5saW5lKSByZXR1cm47XG4gIH1cblxuICBpZiAodGhpcy5zdGF0ZS5jb21wbGV0aW9uQWN0aXZlKSB0aGlzLnN0YXRlLmNvbXBsZXRpb25BY3RpdmUuY2xvc2UoKTtcbiAgdmFyIGNvbXBsZXRpb24gPSAodGhpcy5zdGF0ZS5jb21wbGV0aW9uQWN0aXZlID0gbmV3IENvbXBsZXRpb24oXG4gICAgdGhpcyxcbiAgICBvcHRpb25zXG4gICkpO1xuICBpZiAoIWNvbXBsZXRpb24ub3B0aW9ucy5oaW50KSByZXR1cm47XG5cbiAgQ29kZU1pcnJvci5zaWduYWwodGhpcywgXCJzdGFydENvbXBsZXRpb25cIiwgdGhpcyk7XG4gIGNvbXBsZXRpb24udXBkYXRlKHRydWUpO1xufSk7XG5cbkNvZGVNaXJyb3IuZGVmaW5lRXh0ZW5zaW9uKFwiY2xvc2VIaW50XCIsIGZ1bmN0aW9uICgpIHtcbiAgaWYgKHRoaXMuc3RhdGUuY29tcGxldGlvbkFjdGl2ZSkgdGhpcy5zdGF0ZS5jb21wbGV0aW9uQWN0aXZlLmNsb3NlKCk7XG59KTtcblxuZnVuY3Rpb24gQ29tcGxldGlvbihjbSwgb3B0aW9ucykge1xuICB0aGlzLmNtID0gY207XG4gIHRoaXMub3B0aW9ucyA9IG9wdGlvbnM7XG4gIHRoaXMud2lkZ2V0ID0gbnVsbDtcbiAgdGhpcy5kZWJvdW5jZSA9IDA7XG4gIHRoaXMudGljayA9IDA7XG4gIHRoaXMuc3RhcnRQb3MgPSB0aGlzLmNtLmdldEN1cnNvcihcInN0YXJ0XCIpO1xuICB0aGlzLnN0YXJ0TGVuID1cbiAgICB0aGlzLmNtLmdldExpbmUodGhpcy5zdGFydFBvcy5saW5lKS5sZW5ndGggLSB0aGlzLmNtLmdldFNlbGVjdGlvbigpLmxlbmd0aDtcblxuICBpZiAodGhpcy5vcHRpb25zLnVwZGF0ZU9uQ3Vyc29yQWN0aXZpdHkpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgY20ub24oXG4gICAgICBcImN1cnNvckFjdGl2aXR5XCIsXG4gICAgICAodGhpcy5hY3Rpdml0eUZ1bmMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHNlbGYuY3Vyc29yQWN0aXZpdHkoKTtcbiAgICAgIH0pXG4gICAgKTtcbiAgfVxufVxuXG52YXIgcmVxdWVzdEFuaW1hdGlvbkZyYW1lID1cbiAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSB8fFxuICBmdW5jdGlvbiAoZm4pIHtcbiAgICByZXR1cm4gc2V0VGltZW91dChmbiwgMTAwMCAvIDYwKTtcbiAgfTtcbnZhciBjYW5jZWxBbmltYXRpb25GcmFtZSA9IHdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZSB8fCBjbGVhclRpbWVvdXQ7XG5cbkNvbXBsZXRpb24ucHJvdG90eXBlID0ge1xuICBjbG9zZTogZnVuY3Rpb24gKCkge1xuICAgIGlmICghdGhpcy5hY3RpdmUoKSkgcmV0dXJuO1xuICAgIHRoaXMuY20uc3RhdGUuY29tcGxldGlvbkFjdGl2ZSA9IG51bGw7XG4gICAgdGhpcy50aWNrID0gbnVsbDtcbiAgICBpZiAodGhpcy5vcHRpb25zLnVwZGF0ZU9uQ3Vyc29yQWN0aXZpdHkpIHtcbiAgICAgIHRoaXMuY20ub2ZmKFwiY3Vyc29yQWN0aXZpdHlcIiwgdGhpcy5hY3Rpdml0eUZ1bmMpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLndpZGdldCAmJiB0aGlzLmRhdGEpIENvZGVNaXJyb3Iuc2lnbmFsKHRoaXMuZGF0YSwgXCJjbG9zZVwiKTtcbiAgICBpZiAodGhpcy53aWRnZXQpIHRoaXMud2lkZ2V0LmNsb3NlKCk7XG4gICAgQ29kZU1pcnJvci5zaWduYWwodGhpcy5jbSwgXCJlbmRDb21wbGV0aW9uXCIsIHRoaXMuY20pO1xuICB9LFxuXG4gIGFjdGl2ZTogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLmNtLnN0YXRlLmNvbXBsZXRpb25BY3RpdmUgPT0gdGhpcztcbiAgfSxcblxuICBwaWNrOiBmdW5jdGlvbiAoZGF0YSwgaSkge1xuICAgIHZhciBjb21wbGV0aW9uID0gZGF0YS5saXN0W2ldLFxuICAgICAgc2VsZiA9IHRoaXM7XG4gICAgdGhpcy5jbS5vcGVyYXRpb24oZnVuY3Rpb24gKCkge1xuICAgICAgaWYgKGNvbXBsZXRpb24uaGludCkgY29tcGxldGlvbi5oaW50KHNlbGYuY20sIGRhdGEsIGNvbXBsZXRpb24pO1xuICAgICAgZWxzZVxuICAgICAgICBzZWxmLmNtLnJlcGxhY2VSYW5nZShcbiAgICAgICAgICBnZXRUZXh0KGNvbXBsZXRpb24pLFxuICAgICAgICAgIGNvbXBsZXRpb24uZnJvbSB8fCBkYXRhLmZyb20sXG4gICAgICAgICAgY29tcGxldGlvbi50byB8fCBkYXRhLnRvLFxuICAgICAgICAgIFwiY29tcGxldGVcIlxuICAgICAgICApO1xuICAgICAgQ29kZU1pcnJvci5zaWduYWwoZGF0YSwgXCJwaWNrXCIsIGNvbXBsZXRpb24pO1xuICAgICAgc2VsZi5jbS5zY3JvbGxJbnRvVmlldygpO1xuICAgIH0pO1xuICAgIGlmICh0aGlzLm9wdGlvbnMuY2xvc2VPblBpY2spIHtcbiAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICB9XG4gIH0sXG5cbiAgY3Vyc29yQWN0aXZpdHk6IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodGhpcy5kZWJvdW5jZSkge1xuICAgICAgY2FuY2VsQW5pbWF0aW9uRnJhbWUodGhpcy5kZWJvdW5jZSk7XG4gICAgICB0aGlzLmRlYm91bmNlID0gMDtcbiAgICB9XG5cbiAgICB2YXIgaWRlbnRTdGFydCA9IHRoaXMuc3RhcnRQb3M7XG4gICAgaWYgKHRoaXMuZGF0YSkge1xuICAgICAgaWRlbnRTdGFydCA9IHRoaXMuZGF0YS5mcm9tO1xuICAgIH1cblxuICAgIHZhciBwb3MgPSB0aGlzLmNtLmdldEN1cnNvcigpLFxuICAgICAgbGluZSA9IHRoaXMuY20uZ2V0TGluZShwb3MubGluZSk7XG4gICAgaWYgKFxuICAgICAgcG9zLmxpbmUgIT0gdGhpcy5zdGFydFBvcy5saW5lIHx8XG4gICAgICBsaW5lLmxlbmd0aCAtIHBvcy5jaCAhPSB0aGlzLnN0YXJ0TGVuIC0gdGhpcy5zdGFydFBvcy5jaCB8fFxuICAgICAgcG9zLmNoIDwgaWRlbnRTdGFydC5jaCB8fFxuICAgICAgdGhpcy5jbS5zb21ldGhpbmdTZWxlY3RlZCgpIHx8XG4gICAgICAhcG9zLmNoIHx8XG4gICAgICB0aGlzLm9wdGlvbnMuY2xvc2VDaGFyYWN0ZXJzLnRlc3QobGluZS5jaGFyQXQocG9zLmNoIC0gMSkpXG4gICAgKSB7XG4gICAgICB0aGlzLmNsb3NlKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgIHRoaXMuZGVib3VuY2UgPSByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoZnVuY3Rpb24gKCkge1xuICAgICAgICBzZWxmLnVwZGF0ZSgpO1xuICAgICAgfSk7XG4gICAgICBpZiAodGhpcy53aWRnZXQpIHRoaXMud2lkZ2V0LmRpc2FibGUoKTtcbiAgICB9XG4gIH0sXG5cbiAgdXBkYXRlOiBmdW5jdGlvbiAoZmlyc3QpIHtcbiAgICBpZiAodGhpcy50aWNrID09IG51bGwpIHJldHVybjtcbiAgICB2YXIgc2VsZiA9IHRoaXMsXG4gICAgICBteVRpY2sgPSArK3RoaXMudGljaztcbiAgICBmZXRjaEhpbnRzKHRoaXMub3B0aW9ucy5oaW50LCB0aGlzLmNtLCB0aGlzLm9wdGlvbnMsIGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICBpZiAoc2VsZi50aWNrID09IG15VGljaykgc2VsZi5maW5pc2hVcGRhdGUoZGF0YSwgZmlyc3QpO1xuICAgIH0pO1xuICB9LFxuXG4gIGZpbmlzaFVwZGF0ZTogZnVuY3Rpb24gKGRhdGEsIGZpcnN0KSB7XG4gICAgaWYgKHRoaXMuZGF0YSkgQ29kZU1pcnJvci5zaWduYWwodGhpcy5kYXRhLCBcInVwZGF0ZVwiKTtcblxuICAgIHZhciBwaWNrZWQgPVxuICAgICAgKHRoaXMud2lkZ2V0ICYmIHRoaXMud2lkZ2V0LnBpY2tlZCkgfHxcbiAgICAgIChmaXJzdCAmJiB0aGlzLm9wdGlvbnMuY29tcGxldGVTaW5nbGUpO1xuICAgIGlmICh0aGlzLndpZGdldCkgdGhpcy53aWRnZXQuY2xvc2UoKTtcblxuICAgIHRoaXMuZGF0YSA9IGRhdGE7XG5cbiAgICBpZiAoZGF0YSAmJiBkYXRhLmxpc3QubGVuZ3RoKSB7XG4gICAgICBpZiAocGlja2VkICYmIGRhdGEubGlzdC5sZW5ndGggPT0gMSkge1xuICAgICAgICB0aGlzLnBpY2soZGF0YSwgMCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLndpZGdldCA9IG5ldyBXaWRnZXQodGhpcywgZGF0YSk7XG4gICAgICAgIENvZGVNaXJyb3Iuc2lnbmFsKGRhdGEsIFwic2hvd25cIik7XG4gICAgICB9XG4gICAgfVxuICB9LFxufTtcblxuZnVuY3Rpb24gcGFyc2VPcHRpb25zKGNtLCBwb3MsIG9wdGlvbnMpIHtcbiAgdmFyIGVkaXRvciA9IGNtLm9wdGlvbnMuaGludE9wdGlvbnM7XG4gIHZhciBvdXQgPSB7fTtcbiAgZm9yICh2YXIgcHJvcCBpbiBkZWZhdWx0T3B0aW9ucykgb3V0W3Byb3BdID0gZGVmYXVsdE9wdGlvbnNbcHJvcF07XG4gIGlmIChlZGl0b3IpXG4gICAgZm9yICh2YXIgcHJvcCBpbiBlZGl0b3IpXG4gICAgICBpZiAoZWRpdG9yW3Byb3BdICE9PSB1bmRlZmluZWQpIG91dFtwcm9wXSA9IGVkaXRvcltwcm9wXTtcbiAgaWYgKG9wdGlvbnMpXG4gICAgZm9yICh2YXIgcHJvcCBpbiBvcHRpb25zKVxuICAgICAgaWYgKG9wdGlvbnNbcHJvcF0gIT09IHVuZGVmaW5lZCkgb3V0W3Byb3BdID0gb3B0aW9uc1twcm9wXTtcbiAgaWYgKG91dC5oaW50LnJlc29sdmUpIG91dC5oaW50ID0gb3V0LmhpbnQucmVzb2x2ZShjbSwgcG9zKTtcbiAgcmV0dXJuIG91dDtcbn1cblxuZnVuY3Rpb24gZ2V0VGV4dChjb21wbGV0aW9uKSB7XG4gIGlmICh0eXBlb2YgY29tcGxldGlvbiA9PSBcInN0cmluZ1wiKSByZXR1cm4gY29tcGxldGlvbjtcbiAgZWxzZSByZXR1cm4gY29tcGxldGlvbi50ZXh0O1xufVxuXG5mdW5jdGlvbiBidWlsZEtleU1hcChjb21wbGV0aW9uLCBoYW5kbGUpIHtcbiAgdmFyIGJhc2VNYXAgPSB7XG4gICAgVXA6IGZ1bmN0aW9uICgpIHtcbiAgICAgIGhhbmRsZS5tb3ZlRm9jdXMoLTEpO1xuICAgIH0sXG4gICAgRG93bjogZnVuY3Rpb24gKCkge1xuICAgICAgaGFuZGxlLm1vdmVGb2N1cygxKTtcbiAgICB9LFxuICAgIFBhZ2VVcDogZnVuY3Rpb24gKCkge1xuICAgICAgaGFuZGxlLm1vdmVGb2N1cygtaGFuZGxlLm1lbnVTaXplKCkgKyAxLCB0cnVlKTtcbiAgICB9LFxuICAgIFBhZ2VEb3duOiBmdW5jdGlvbiAoKSB7XG4gICAgICBoYW5kbGUubW92ZUZvY3VzKGhhbmRsZS5tZW51U2l6ZSgpIC0gMSwgdHJ1ZSk7XG4gICAgfSxcbiAgICBIb21lOiBmdW5jdGlvbiAoKSB7XG4gICAgICBoYW5kbGUuc2V0Rm9jdXMoMCk7XG4gICAgfSxcbiAgICBFbmQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgIGhhbmRsZS5zZXRGb2N1cyhoYW5kbGUubGVuZ3RoIC0gMSk7XG4gICAgfSxcbiAgICBFbnRlcjogaGFuZGxlLnBpY2ssXG4gICAgVGFiOiBoYW5kbGUucGljayxcbiAgICBFc2M6IGhhbmRsZS5jbG9zZSxcbiAgfTtcblxuICB2YXIgbWFjID0gL01hYy8udGVzdChuYXZpZ2F0b3IucGxhdGZvcm0pO1xuXG4gIGlmIChtYWMpIHtcbiAgICBiYXNlTWFwW1wiQ3RybC1QXCJdID0gZnVuY3Rpb24gKCkge1xuICAgICAgaGFuZGxlLm1vdmVGb2N1cygtMSk7XG4gICAgfTtcbiAgICBiYXNlTWFwW1wiQ3RybC1OXCJdID0gZnVuY3Rpb24gKCkge1xuICAgICAgaGFuZGxlLm1vdmVGb2N1cygxKTtcbiAgICB9O1xuICB9XG5cbiAgdmFyIGN1c3RvbSA9IGNvbXBsZXRpb24ub3B0aW9ucy5jdXN0b21LZXlzO1xuICB2YXIgb3VyTWFwID0gY3VzdG9tID8ge30gOiBiYXNlTWFwO1xuICBmdW5jdGlvbiBhZGRCaW5kaW5nKGtleSwgdmFsKSB7XG4gICAgdmFyIGJvdW5kO1xuICAgIGlmICh0eXBlb2YgdmFsICE9IFwic3RyaW5nXCIpXG4gICAgICBib3VuZCA9IGZ1bmN0aW9uIChjbSkge1xuICAgICAgICByZXR1cm4gdmFsKGNtLCBoYW5kbGUpO1xuICAgICAgfTtcbiAgICAvLyBUaGlzIG1lY2hhbmlzbSBpcyBkZXByZWNhdGVkXG4gICAgZWxzZSBpZiAoYmFzZU1hcC5oYXNPd25Qcm9wZXJ0eSh2YWwpKSBib3VuZCA9IGJhc2VNYXBbdmFsXTtcbiAgICBlbHNlIGJvdW5kID0gdmFsO1xuICAgIG91ck1hcFtrZXldID0gYm91bmQ7XG4gIH1cbiAgaWYgKGN1c3RvbSlcbiAgICBmb3IgKHZhciBrZXkgaW4gY3VzdG9tKVxuICAgICAgaWYgKGN1c3RvbS5oYXNPd25Qcm9wZXJ0eShrZXkpKSBhZGRCaW5kaW5nKGtleSwgY3VzdG9tW2tleV0pO1xuICB2YXIgZXh0cmEgPSBjb21wbGV0aW9uLm9wdGlvbnMuZXh0cmFLZXlzO1xuICBpZiAoZXh0cmEpXG4gICAgZm9yICh2YXIga2V5IGluIGV4dHJhKVxuICAgICAgaWYgKGV4dHJhLmhhc093blByb3BlcnR5KGtleSkpIGFkZEJpbmRpbmcoa2V5LCBleHRyYVtrZXldKTtcbiAgcmV0dXJuIG91ck1hcDtcbn1cblxuZnVuY3Rpb24gZ2V0SGludEVsZW1lbnQoaGludHNFbGVtZW50LCBlbCkge1xuICB3aGlsZSAoZWwgJiYgZWwgIT0gaGludHNFbGVtZW50KSB7XG4gICAgaWYgKGVsLm5vZGVOYW1lLnRvVXBwZXJDYXNlKCkgPT09IFwiTElcIiAmJiBlbC5wYXJlbnROb2RlID09IGhpbnRzRWxlbWVudClcbiAgICAgIHJldHVybiBlbDtcbiAgICBlbCA9IGVsLnBhcmVudE5vZGU7XG4gIH1cbn1cblxuZnVuY3Rpb24gV2lkZ2V0KGNvbXBsZXRpb24sIGRhdGEpIHtcbiAgdGhpcy5jb21wbGV0aW9uID0gY29tcGxldGlvbjtcbiAgdGhpcy5kYXRhID0gZGF0YTtcbiAgdGhpcy5waWNrZWQgPSBmYWxzZTtcbiAgdmFyIHdpZGdldCA9IHRoaXMsXG4gICAgY20gPSBjb21wbGV0aW9uLmNtO1xuICB2YXIgb3duZXJEb2N1bWVudCA9IGNtLmdldElucHV0RmllbGQoKS5vd25lckRvY3VtZW50O1xuICB2YXIgcGFyZW50V2luZG93ID0gb3duZXJEb2N1bWVudC5kZWZhdWx0VmlldyB8fCBvd25lckRvY3VtZW50LnBhcmVudFdpbmRvdztcblxuICB2YXIgaGludHMgPSAodGhpcy5oaW50cyA9IG93bmVyRG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInVsXCIpKTtcbiAgdmFyIHRoZW1lID0gY29tcGxldGlvbi5jbS5vcHRpb25zLnRoZW1lO1xuICBoaW50cy5jbGFzc05hbWUgPSBcIkNvZGVNaXJyb3ItaGludHMgXCIgKyB0aGVtZTtcbiAgdGhpcy5zZWxlY3RlZEhpbnQgPSBkYXRhLnNlbGVjdGVkSGludCB8fCAwO1xuXG4gIHZhciBjb21wbGV0aW9ucyA9IGRhdGEubGlzdDtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBjb21wbGV0aW9ucy5sZW5ndGg7ICsraSkge1xuICAgIHZhciBlbHQgPSBoaW50cy5hcHBlbmRDaGlsZChvd25lckRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJsaVwiKSksXG4gICAgICBjdXIgPSBjb21wbGV0aW9uc1tpXTtcbiAgICB2YXIgY2xhc3NOYW1lID1cbiAgICAgIEhJTlRfRUxFTUVOVF9DTEFTUyArXG4gICAgICAoaSAhPSB0aGlzLnNlbGVjdGVkSGludCA/IFwiXCIgOiBcIiBcIiArIEFDVElWRV9ISU5UX0VMRU1FTlRfQ0xBU1MpO1xuICAgIGlmIChjdXIuY2xhc3NOYW1lICE9IG51bGwpIGNsYXNzTmFtZSA9IGN1ci5jbGFzc05hbWUgKyBcIiBcIiArIGNsYXNzTmFtZTtcbiAgICBlbHQuY2xhc3NOYW1lID0gY2xhc3NOYW1lO1xuICAgIGlmIChjdXIucmVuZGVyKSBjdXIucmVuZGVyKGVsdCwgZGF0YSwgY3VyKTtcbiAgICBlbHNlXG4gICAgICBlbHQuYXBwZW5kQ2hpbGQoXG4gICAgICAgIG93bmVyRG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoY3VyLmRpc3BsYXlUZXh0IHx8IGdldFRleHQoY3VyKSlcbiAgICAgICk7XG4gICAgZWx0LmhpbnRJZCA9IGk7XG4gIH1cblxuICB2YXIgY29udGFpbmVyID0gY29tcGxldGlvbi5vcHRpb25zLmNvbnRhaW5lciB8fCBvd25lckRvY3VtZW50LmJvZHk7XG4gIHZhciBwb3MgPSBjbS5jdXJzb3JDb29yZHMoXG4gICAgY29tcGxldGlvbi5vcHRpb25zLmFsaWduV2l0aFdvcmQgPyBkYXRhLmZyb20gOiBudWxsXG4gICk7XG4gIHZhciBsZWZ0ID0gcG9zLmxlZnQsXG4gICAgdG9wID0gcG9zLmJvdHRvbSxcbiAgICBiZWxvdyA9IHRydWU7XG4gIHZhciBvZmZzZXRMZWZ0ID0gMCxcbiAgICBvZmZzZXRUb3AgPSAwO1xuICBpZiAoY29udGFpbmVyICE9PSBvd25lckRvY3VtZW50LmJvZHkpIHtcbiAgICAvLyBXZSBvZmZzZXQgdGhlIGN1cnNvciBwb3NpdGlvbiBiZWNhdXNlIGxlZnQgYW5kIHRvcCBhcmUgcmVsYXRpdmUgdG8gdGhlIG9mZnNldFBhcmVudCdzIHRvcCBsZWZ0IGNvcm5lci5cbiAgICB2YXIgaXNDb250YWluZXJQb3NpdGlvbmVkID1cbiAgICAgIFtcImFic29sdXRlXCIsIFwicmVsYXRpdmVcIiwgXCJmaXhlZFwiXS5pbmRleE9mKFxuICAgICAgICBwYXJlbnRXaW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShjb250YWluZXIpLnBvc2l0aW9uXG4gICAgICApICE9PSAtMTtcbiAgICB2YXIgb2Zmc2V0UGFyZW50ID0gaXNDb250YWluZXJQb3NpdGlvbmVkXG4gICAgICA/IGNvbnRhaW5lclxuICAgICAgOiBjb250YWluZXIub2Zmc2V0UGFyZW50O1xuICAgIHZhciBvZmZzZXRQYXJlbnRQb3NpdGlvbiA9IG9mZnNldFBhcmVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICB2YXIgYm9keVBvc2l0aW9uID0gb3duZXJEb2N1bWVudC5ib2R5LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgIG9mZnNldExlZnQgPVxuICAgICAgb2Zmc2V0UGFyZW50UG9zaXRpb24ubGVmdCAtIGJvZHlQb3NpdGlvbi5sZWZ0IC0gb2Zmc2V0UGFyZW50LnNjcm9sbExlZnQ7XG4gICAgb2Zmc2V0VG9wID1cbiAgICAgIG9mZnNldFBhcmVudFBvc2l0aW9uLnRvcCAtIGJvZHlQb3NpdGlvbi50b3AgLSBvZmZzZXRQYXJlbnQuc2Nyb2xsVG9wO1xuICB9XG4gIGhpbnRzLnN0eWxlLmxlZnQgPSBsZWZ0IC0gb2Zmc2V0TGVmdCArIFwicHhcIjtcbiAgaGludHMuc3R5bGUudG9wID0gdG9wIC0gb2Zmc2V0VG9wICsgXCJweFwiO1xuXG4gIC8vIElmIHdlJ3JlIGF0IHRoZSBlZGdlIG9mIHRoZSBzY3JlZW4sIHRoZW4gd2Ugd2FudCB0aGUgbWVudSB0byBhcHBlYXIgb24gdGhlIGxlZnQgb2YgdGhlIGN1cnNvci5cbiAgdmFyIHdpblcgPVxuICAgIHBhcmVudFdpbmRvdy5pbm5lcldpZHRoIHx8XG4gICAgTWF0aC5tYXgoXG4gICAgICBvd25lckRvY3VtZW50LmJvZHkub2Zmc2V0V2lkdGgsXG4gICAgICBvd25lckRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5vZmZzZXRXaWR0aFxuICAgICk7XG4gIHZhciB3aW5IID1cbiAgICBwYXJlbnRXaW5kb3cuaW5uZXJIZWlnaHQgfHxcbiAgICBNYXRoLm1heChcbiAgICAgIG93bmVyRG9jdW1lbnQuYm9keS5vZmZzZXRIZWlnaHQsXG4gICAgICBvd25lckRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5vZmZzZXRIZWlnaHRcbiAgICApO1xuICBjb250YWluZXIuYXBwZW5kQ2hpbGQoaGludHMpO1xuXG4gIHZhciBib3ggPSBjb21wbGV0aW9uLm9wdGlvbnMubW92ZU9uT3ZlcmxhcFxuICAgID8gaGludHMuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcbiAgICA6IG5ldyBET01SZWN0KCk7XG4gIHZhciBzY3JvbGxzID0gY29tcGxldGlvbi5vcHRpb25zLnBhZGRpbmdGb3JTY3JvbGxiYXJcbiAgICA/IGhpbnRzLnNjcm9sbEhlaWdodCA+IGhpbnRzLmNsaWVudEhlaWdodCArIDFcbiAgICA6IGZhbHNlO1xuXG4gIC8vIENvbXB1dGUgaW4gdGhlIHRpbWVvdXQgdG8gYXZvaWQgcmVmbG93IG9uIGluaXRcbiAgdmFyIHN0YXJ0U2Nyb2xsO1xuICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICBzdGFydFNjcm9sbCA9IGNtLmdldFNjcm9sbEluZm8oKTtcbiAgfSk7XG5cbiAgdmFyIG92ZXJsYXBZID0gYm94LmJvdHRvbSAtIHdpbkg7XG4gIGlmIChvdmVybGFwWSA+IDApIHtcbiAgICB2YXIgaGVpZ2h0ID0gYm94LmJvdHRvbSAtIGJveC50b3AsXG4gICAgICBjdXJUb3AgPSBwb3MudG9wIC0gKHBvcy5ib3R0b20gLSBib3gudG9wKTtcbiAgICBpZiAoY3VyVG9wIC0gaGVpZ2h0ID4gMCkge1xuICAgICAgLy8gRml0cyBhYm92ZSBjdXJzb3JcbiAgICAgIGhpbnRzLnN0eWxlLnRvcCA9ICh0b3AgPSBwb3MudG9wIC0gaGVpZ2h0IC0gb2Zmc2V0VG9wKSArIFwicHhcIjtcbiAgICAgIGJlbG93ID0gZmFsc2U7XG4gICAgfSBlbHNlIGlmIChoZWlnaHQgPiB3aW5IKSB7XG4gICAgICBoaW50cy5zdHlsZS5oZWlnaHQgPSB3aW5IIC0gNSArIFwicHhcIjtcbiAgICAgIGhpbnRzLnN0eWxlLnRvcCA9ICh0b3AgPSBwb3MuYm90dG9tIC0gYm94LnRvcCAtIG9mZnNldFRvcCkgKyBcInB4XCI7XG4gICAgICB2YXIgY3Vyc29yID0gY20uZ2V0Q3Vyc29yKCk7XG4gICAgICBpZiAoZGF0YS5mcm9tLmNoICE9IGN1cnNvci5jaCkge1xuICAgICAgICBwb3MgPSBjbS5jdXJzb3JDb29yZHMoY3Vyc29yKTtcbiAgICAgICAgaGludHMuc3R5bGUubGVmdCA9IChsZWZ0ID0gcG9zLmxlZnQgLSBvZmZzZXRMZWZ0KSArIFwicHhcIjtcbiAgICAgICAgYm94ID0gaGludHMuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHZhciBvdmVybGFwWCA9IGJveC5yaWdodCAtIHdpblc7XG4gIGlmIChvdmVybGFwWCA+IDApIHtcbiAgICBpZiAoYm94LnJpZ2h0IC0gYm94LmxlZnQgPiB3aW5XKSB7XG4gICAgICBoaW50cy5zdHlsZS53aWR0aCA9IHdpblcgLSA1ICsgXCJweFwiO1xuICAgICAgb3ZlcmxhcFggLT0gYm94LnJpZ2h0IC0gYm94LmxlZnQgLSB3aW5XO1xuICAgIH1cbiAgICBoaW50cy5zdHlsZS5sZWZ0ID0gKGxlZnQgPSBwb3MubGVmdCAtIG92ZXJsYXBYIC0gb2Zmc2V0TGVmdCkgKyBcInB4XCI7XG4gIH1cbiAgaWYgKHNjcm9sbHMpXG4gICAgZm9yICh2YXIgbm9kZSA9IGhpbnRzLmZpcnN0Q2hpbGQ7IG5vZGU7IG5vZGUgPSBub2RlLm5leHRTaWJsaW5nKVxuICAgICAgbm9kZS5zdHlsZS5wYWRkaW5nUmlnaHQgPSBjbS5kaXNwbGF5Lm5hdGl2ZUJhcldpZHRoICsgXCJweFwiO1xuXG4gIGNtLmFkZEtleU1hcChcbiAgICAodGhpcy5rZXlNYXAgPSBidWlsZEtleU1hcChjb21wbGV0aW9uLCB7XG4gICAgICBtb3ZlRm9jdXM6IGZ1bmN0aW9uIChuLCBhdm9pZFdyYXApIHtcbiAgICAgICAgd2lkZ2V0LmNoYW5nZUFjdGl2ZSh3aWRnZXQuc2VsZWN0ZWRIaW50ICsgbiwgYXZvaWRXcmFwKTtcbiAgICAgIH0sXG4gICAgICBzZXRGb2N1czogZnVuY3Rpb24gKG4pIHtcbiAgICAgICAgd2lkZ2V0LmNoYW5nZUFjdGl2ZShuKTtcbiAgICAgIH0sXG4gICAgICBtZW51U2l6ZTogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gd2lkZ2V0LnNjcmVlbkFtb3VudCgpO1xuICAgICAgfSxcbiAgICAgIGxlbmd0aDogY29tcGxldGlvbnMubGVuZ3RoLFxuICAgICAgY2xvc2U6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgY29tcGxldGlvbi5jbG9zZSgpO1xuICAgICAgfSxcbiAgICAgIHBpY2s6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgd2lkZ2V0LnBpY2soKTtcbiAgICAgIH0sXG4gICAgICBkYXRhOiBkYXRhLFxuICAgIH0pKVxuICApO1xuXG4gIGlmIChjb21wbGV0aW9uLm9wdGlvbnMuY2xvc2VPblVuZm9jdXMpIHtcbiAgICB2YXIgY2xvc2luZ09uQmx1cjtcbiAgICBjbS5vbihcbiAgICAgIFwiYmx1clwiLFxuICAgICAgKHRoaXMub25CbHVyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBjbG9zaW5nT25CbHVyID0gc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgY29tcGxldGlvbi5jbG9zZSgpO1xuICAgICAgICB9LCAxMDApO1xuICAgICAgfSlcbiAgICApO1xuICAgIGNtLm9uKFxuICAgICAgXCJmb2N1c1wiLFxuICAgICAgKHRoaXMub25Gb2N1cyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KGNsb3NpbmdPbkJsdXIpO1xuICAgICAgfSlcbiAgICApO1xuICB9XG5cbiAgY20ub24oXG4gICAgXCJzY3JvbGxcIixcbiAgICAodGhpcy5vblNjcm9sbCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciBjdXJTY3JvbGwgPSBjbS5nZXRTY3JvbGxJbmZvKCksXG4gICAgICAgIGVkaXRvciA9IGNtLmdldFdyYXBwZXJFbGVtZW50KCkuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICB2YXIgbmV3VG9wID0gdG9wICsgc3RhcnRTY3JvbGwudG9wIC0gY3VyU2Nyb2xsLnRvcDtcbiAgICAgIHZhciBwb2ludCA9XG4gICAgICAgIG5ld1RvcCAtXG4gICAgICAgIChwYXJlbnRXaW5kb3cucGFnZVlPZmZzZXQgfHxcbiAgICAgICAgICAob3duZXJEb2N1bWVudC5kb2N1bWVudEVsZW1lbnQgfHwgb3duZXJEb2N1bWVudC5ib2R5KS5zY3JvbGxUb3ApO1xuICAgICAgaWYgKCFiZWxvdykgcG9pbnQgKz0gaGludHMub2Zmc2V0SGVpZ2h0O1xuICAgICAgaWYgKHBvaW50IDw9IGVkaXRvci50b3AgfHwgcG9pbnQgPj0gZWRpdG9yLmJvdHRvbSlcbiAgICAgICAgcmV0dXJuIGNvbXBsZXRpb24uY2xvc2UoKTtcbiAgICAgIGhpbnRzLnN0eWxlLnRvcCA9IG5ld1RvcCArIFwicHhcIjtcbiAgICAgIGhpbnRzLnN0eWxlLmxlZnQgPSBsZWZ0ICsgc3RhcnRTY3JvbGwubGVmdCAtIGN1clNjcm9sbC5sZWZ0ICsgXCJweFwiO1xuICAgIH0pXG4gICk7XG5cbiAgQ29kZU1pcnJvci5vbihoaW50cywgXCJkYmxjbGlja1wiLCBmdW5jdGlvbiAoZSkge1xuICAgIHZhciB0ID0gZ2V0SGludEVsZW1lbnQoaGludHMsIGUudGFyZ2V0IHx8IGUuc3JjRWxlbWVudCk7XG4gICAgaWYgKHQgJiYgdC5oaW50SWQgIT0gbnVsbCkge1xuICAgICAgd2lkZ2V0LmNoYW5nZUFjdGl2ZSh0LmhpbnRJZCk7XG4gICAgICB3aWRnZXQucGljaygpO1xuICAgIH1cbiAgfSk7XG5cbiAgQ29kZU1pcnJvci5vbihoaW50cywgXCJjbGlja1wiLCBmdW5jdGlvbiAoZSkge1xuICAgIHZhciB0ID0gZ2V0SGludEVsZW1lbnQoaGludHMsIGUudGFyZ2V0IHx8IGUuc3JjRWxlbWVudCk7XG4gICAgaWYgKHQgJiYgdC5oaW50SWQgIT0gbnVsbCkge1xuICAgICAgd2lkZ2V0LmNoYW5nZUFjdGl2ZSh0LmhpbnRJZCk7XG4gICAgICBpZiAoY29tcGxldGlvbi5vcHRpb25zLmNvbXBsZXRlT25TaW5nbGVDbGljaykgd2lkZ2V0LnBpY2soKTtcbiAgICB9XG4gIH0pO1xuXG4gIENvZGVNaXJyb3Iub24oaGludHMsIFwibW91c2Vkb3duXCIsIGZ1bmN0aW9uICgpIHtcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgIGNtLmZvY3VzKCk7XG4gICAgfSwgMjApO1xuICB9KTtcblxuICAvLyBUaGUgZmlyc3QgaGludCBkb2Vzbid0IG5lZWQgdG8gYmUgc2Nyb2xsZWQgdG8gb24gaW5pdFxuICB2YXIgc2VsZWN0ZWRIaW50UmFuZ2UgPSB0aGlzLmdldFNlbGVjdGVkSGludFJhbmdlKCk7XG4gIGlmIChzZWxlY3RlZEhpbnRSYW5nZS5mcm9tICE9PSAwIHx8IHNlbGVjdGVkSGludFJhbmdlLnRvICE9PSAwKSB7XG4gICAgdGhpcy5zY3JvbGxUb0FjdGl2ZSgpO1xuICB9XG5cbiAgQ29kZU1pcnJvci5zaWduYWwoXG4gICAgZGF0YSxcbiAgICBcInNlbGVjdFwiLFxuICAgIGNvbXBsZXRpb25zW3RoaXMuc2VsZWN0ZWRIaW50XSxcbiAgICBoaW50cy5jaGlsZE5vZGVzW3RoaXMuc2VsZWN0ZWRIaW50XVxuICApO1xuICByZXR1cm4gdHJ1ZTtcbn1cblxuV2lkZ2V0LnByb3RvdHlwZSA9IHtcbiAgY2xvc2U6IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodGhpcy5jb21wbGV0aW9uLndpZGdldCAhPSB0aGlzKSByZXR1cm47XG4gICAgdGhpcy5jb21wbGV0aW9uLndpZGdldCA9IG51bGw7XG4gICAgdGhpcy5oaW50cy5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHRoaXMuaGludHMpO1xuICAgIHRoaXMuY29tcGxldGlvbi5jbS5yZW1vdmVLZXlNYXAodGhpcy5rZXlNYXApO1xuXG4gICAgdmFyIGNtID0gdGhpcy5jb21wbGV0aW9uLmNtO1xuICAgIGlmICh0aGlzLmNvbXBsZXRpb24ub3B0aW9ucy5jbG9zZU9uVW5mb2N1cykge1xuICAgICAgY20ub2ZmKFwiYmx1clwiLCB0aGlzLm9uQmx1cik7XG4gICAgICBjbS5vZmYoXCJmb2N1c1wiLCB0aGlzLm9uRm9jdXMpO1xuICAgIH1cbiAgICBjbS5vZmYoXCJzY3JvbGxcIiwgdGhpcy5vblNjcm9sbCk7XG4gIH0sXG5cbiAgZGlzYWJsZTogZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuY29tcGxldGlvbi5jbS5yZW1vdmVLZXlNYXAodGhpcy5rZXlNYXApO1xuICAgIHZhciB3aWRnZXQgPSB0aGlzO1xuICAgIHRoaXMua2V5TWFwID0ge1xuICAgICAgRW50ZXI6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgd2lkZ2V0LnBpY2tlZCA9IHRydWU7XG4gICAgICB9LFxuICAgIH07XG4gICAgdGhpcy5jb21wbGV0aW9uLmNtLmFkZEtleU1hcCh0aGlzLmtleU1hcCk7XG4gIH0sXG5cbiAgcGljazogZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuY29tcGxldGlvbi5waWNrKHRoaXMuZGF0YSwgdGhpcy5zZWxlY3RlZEhpbnQpO1xuICB9LFxuXG4gIGNoYW5nZUFjdGl2ZTogZnVuY3Rpb24gKGksIGF2b2lkV3JhcCkge1xuICAgIGlmIChpID49IHRoaXMuZGF0YS5saXN0Lmxlbmd0aClcbiAgICAgIGkgPSBhdm9pZFdyYXAgPyB0aGlzLmRhdGEubGlzdC5sZW5ndGggLSAxIDogMDtcbiAgICBlbHNlIGlmIChpIDwgMCkgaSA9IGF2b2lkV3JhcCA/IDAgOiB0aGlzLmRhdGEubGlzdC5sZW5ndGggLSAxO1xuICAgIGlmICh0aGlzLnNlbGVjdGVkSGludCA9PSBpKSByZXR1cm47XG4gICAgdmFyIG5vZGUgPSB0aGlzLmhpbnRzLmNoaWxkTm9kZXNbdGhpcy5zZWxlY3RlZEhpbnRdO1xuICAgIGlmIChub2RlKVxuICAgICAgbm9kZS5jbGFzc05hbWUgPSBub2RlLmNsYXNzTmFtZS5yZXBsYWNlKFxuICAgICAgICBcIiBcIiArIEFDVElWRV9ISU5UX0VMRU1FTlRfQ0xBU1MsXG4gICAgICAgIFwiXCJcbiAgICAgICk7XG4gICAgbm9kZSA9IHRoaXMuaGludHMuY2hpbGROb2Rlc1sodGhpcy5zZWxlY3RlZEhpbnQgPSBpKV07XG4gICAgbm9kZS5jbGFzc05hbWUgKz0gXCIgXCIgKyBBQ1RJVkVfSElOVF9FTEVNRU5UX0NMQVNTO1xuICAgIHRoaXMuc2Nyb2xsVG9BY3RpdmUoKTtcbiAgICBDb2RlTWlycm9yLnNpZ25hbChcbiAgICAgIHRoaXMuZGF0YSxcbiAgICAgIFwic2VsZWN0XCIsXG4gICAgICB0aGlzLmRhdGEubGlzdFt0aGlzLnNlbGVjdGVkSGludF0sXG4gICAgICBub2RlXG4gICAgKTtcbiAgfSxcblxuICBzY3JvbGxUb0FjdGl2ZTogZnVuY3Rpb24gKCkge1xuICAgIHZhciBzZWxlY3RlZEhpbnRSYW5nZSA9IHRoaXMuZ2V0U2VsZWN0ZWRIaW50UmFuZ2UoKTtcbiAgICB2YXIgbm9kZTEgPSB0aGlzLmhpbnRzLmNoaWxkTm9kZXNbc2VsZWN0ZWRIaW50UmFuZ2UuZnJvbV07XG4gICAgdmFyIG5vZGUyID0gdGhpcy5oaW50cy5jaGlsZE5vZGVzW3NlbGVjdGVkSGludFJhbmdlLnRvXTtcbiAgICB2YXIgZmlyc3ROb2RlID0gdGhpcy5oaW50cy5maXJzdENoaWxkO1xuICAgIGlmIChub2RlMS5vZmZzZXRUb3AgPCB0aGlzLmhpbnRzLnNjcm9sbFRvcClcbiAgICAgIHRoaXMuaGludHMuc2Nyb2xsVG9wID0gbm9kZTEub2Zmc2V0VG9wIC0gZmlyc3ROb2RlLm9mZnNldFRvcDtcbiAgICBlbHNlIGlmIChcbiAgICAgIG5vZGUyLm9mZnNldFRvcCArIG5vZGUyLm9mZnNldEhlaWdodCA+XG4gICAgICB0aGlzLmhpbnRzLnNjcm9sbFRvcCArIHRoaXMuaGludHMuY2xpZW50SGVpZ2h0XG4gICAgKVxuICAgICAgdGhpcy5oaW50cy5zY3JvbGxUb3AgPVxuICAgICAgICBub2RlMi5vZmZzZXRUb3AgK1xuICAgICAgICBub2RlMi5vZmZzZXRIZWlnaHQgLVxuICAgICAgICB0aGlzLmhpbnRzLmNsaWVudEhlaWdodCArXG4gICAgICAgIGZpcnN0Tm9kZS5vZmZzZXRUb3A7XG4gIH0sXG5cbiAgc2NyZWVuQW1vdW50OiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIE1hdGguZmxvb3IoXG4gICAgICAgIHRoaXMuaGludHMuY2xpZW50SGVpZ2h0IC8gdGhpcy5oaW50cy5maXJzdENoaWxkLm9mZnNldEhlaWdodFxuICAgICAgKSB8fCAxXG4gICAgKTtcbiAgfSxcblxuICBnZXRTZWxlY3RlZEhpbnRSYW5nZTogZnVuY3Rpb24gKCkge1xuICAgIHZhciBtYXJnaW4gPSB0aGlzLmNvbXBsZXRpb24ub3B0aW9ucy5zY3JvbGxNYXJnaW4gfHwgMDtcbiAgICByZXR1cm4ge1xuICAgICAgZnJvbTogTWF0aC5tYXgoMCwgdGhpcy5zZWxlY3RlZEhpbnQgLSBtYXJnaW4pLFxuICAgICAgdG86IE1hdGgubWluKHRoaXMuZGF0YS5saXN0Lmxlbmd0aCAtIDEsIHRoaXMuc2VsZWN0ZWRIaW50ICsgbWFyZ2luKSxcbiAgICB9O1xuICB9LFxufTtcblxuZnVuY3Rpb24gYXBwbGljYWJsZUhlbHBlcnMoY20sIGhlbHBlcnMpIHtcbiAgaWYgKCFjbS5zb21ldGhpbmdTZWxlY3RlZCgpKSByZXR1cm4gaGVscGVycztcbiAgdmFyIHJlc3VsdCA9IFtdO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGhlbHBlcnMubGVuZ3RoOyBpKyspXG4gICAgaWYgKGhlbHBlcnNbaV0uc3VwcG9ydHNTZWxlY3Rpb24pIHJlc3VsdC5wdXNoKGhlbHBlcnNbaV0pO1xuICByZXR1cm4gcmVzdWx0O1xufVxuXG5mdW5jdGlvbiBmZXRjaEhpbnRzKGhpbnQsIGNtLCBvcHRpb25zLCBjYWxsYmFjaykge1xuICBpZiAoaGludC5hc3luYykge1xuICAgIGhpbnQoY20sIGNhbGxiYWNrLCBvcHRpb25zKTtcbiAgfSBlbHNlIHtcbiAgICB2YXIgcmVzdWx0ID0gaGludChjbSwgb3B0aW9ucyk7XG4gICAgaWYgKHJlc3VsdCAmJiByZXN1bHQudGhlbikgcmVzdWx0LnRoZW4oY2FsbGJhY2spO1xuICAgIGVsc2UgY2FsbGJhY2socmVzdWx0KTtcbiAgfVxufVxuXG5mdW5jdGlvbiByZXNvbHZlQXV0b0hpbnRzKGNtLCBwb3MpIHtcbiAgdmFyIGhlbHBlcnMgPSBjbS5nZXRIZWxwZXJzKHBvcywgXCJoaW50XCIpLFxuICAgIHdvcmRzO1xuICBpZiAoaGVscGVycy5sZW5ndGgpIHtcbiAgICB2YXIgcmVzb2x2ZWQgPSBmdW5jdGlvbiAoY20sIGNhbGxiYWNrLCBvcHRpb25zKSB7XG4gICAgICB2YXIgYXBwID0gYXBwbGljYWJsZUhlbHBlcnMoY20sIGhlbHBlcnMpO1xuICAgICAgZnVuY3Rpb24gcnVuKGkpIHtcbiAgICAgICAgaWYgKGkgPT0gYXBwLmxlbmd0aCkgcmV0dXJuIGNhbGxiYWNrKG51bGwpO1xuICAgICAgICBmZXRjaEhpbnRzKGFwcFtpXSwgY20sIG9wdGlvbnMsIGZ1bmN0aW9uIChyZXN1bHQpIHtcbiAgICAgICAgICBpZiAocmVzdWx0ICYmIHJlc3VsdC5saXN0Lmxlbmd0aCA+IDApIGNhbGxiYWNrKHJlc3VsdCk7XG4gICAgICAgICAgZWxzZSBydW4oaSArIDEpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIHJ1bigwKTtcbiAgICB9O1xuICAgIHJlc29sdmVkLmFzeW5jID0gdHJ1ZTtcbiAgICByZXNvbHZlZC5zdXBwb3J0c1NlbGVjdGlvbiA9IHRydWU7XG4gICAgcmV0dXJuIHJlc29sdmVkO1xuICB9IGVsc2UgaWYgKCh3b3JkcyA9IGNtLmdldEhlbHBlcihjbS5nZXRDdXJzb3IoKSwgXCJoaW50V29yZHNcIikpKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChjbSkge1xuICAgICAgcmV0dXJuIENvZGVNaXJyb3IuaGludC5mcm9tTGlzdChjbSwgeyB3b3Jkczogd29yZHMgfSk7XG4gICAgfTtcbiAgfSBlbHNlIGlmIChDb2RlTWlycm9yLmhpbnQuYW55d29yZCkge1xuICAgIHJldHVybiBmdW5jdGlvbiAoY20sIG9wdGlvbnMpIHtcbiAgICAgIHJldHVybiBDb2RlTWlycm9yLmhpbnQuYW55d29yZChjbSwgb3B0aW9ucyk7XG4gICAgfTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKCkge307XG4gIH1cbn1cblxuQ29kZU1pcnJvci5yZWdpc3RlckhlbHBlcihcImhpbnRcIiwgXCJhdXRvXCIsIHtcbiAgcmVzb2x2ZTogcmVzb2x2ZUF1dG9IaW50cyxcbn0pO1xuXG5Db2RlTWlycm9yLnJlZ2lzdGVySGVscGVyKFwiaGludFwiLCBcImZyb21MaXN0XCIsIGZ1bmN0aW9uIChjbSwgb3B0aW9ucykge1xuICB2YXIgY3VyID0gY20uZ2V0Q3Vyc29yKCksXG4gICAgdG9rZW4gPSBjbS5nZXRUb2tlbkF0KGN1cik7XG4gIHZhciB0ZXJtLFxuICAgIGZyb20gPSBDb2RlTWlycm9yLlBvcyhjdXIubGluZSwgdG9rZW4uc3RhcnQpLFxuICAgIHRvID0gY3VyO1xuICBpZiAoXG4gICAgdG9rZW4uc3RhcnQgPCBjdXIuY2ggJiZcbiAgICAvXFx3Ly50ZXN0KHRva2VuLnN0cmluZy5jaGFyQXQoY3VyLmNoIC0gdG9rZW4uc3RhcnQgLSAxKSlcbiAgKSB7XG4gICAgdGVybSA9IHRva2VuLnN0cmluZy5zdWJzdHIoMCwgY3VyLmNoIC0gdG9rZW4uc3RhcnQpO1xuICB9IGVsc2Uge1xuICAgIHRlcm0gPSBcIlwiO1xuICAgIGZyb20gPSBjdXI7XG4gIH1cbiAgdmFyIGZvdW5kID0gW107XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgb3B0aW9ucy53b3Jkcy5sZW5ndGg7IGkrKykge1xuICAgIHZhciB3b3JkID0gb3B0aW9ucy53b3Jkc1tpXTtcbiAgICBpZiAod29yZC5zbGljZSgwLCB0ZXJtLmxlbmd0aCkgPT0gdGVybSkgZm91bmQucHVzaCh3b3JkKTtcbiAgfVxuXG4gIGlmIChmb3VuZC5sZW5ndGgpIHJldHVybiB7IGxpc3Q6IGZvdW5kLCBmcm9tOiBmcm9tLCB0bzogdG8gfTtcbn0pO1xuXG5Db2RlTWlycm9yLmNvbW1hbmRzLmF1dG9jb21wbGV0ZSA9IENvZGVNaXJyb3Iuc2hvd0hpbnQ7XG5cbnZhciBkZWZhdWx0T3B0aW9ucyA9IHtcbiAgaGludDogQ29kZU1pcnJvci5oaW50LmF1dG8sXG4gIGNvbXBsZXRlU2luZ2xlOiB0cnVlLFxuICBhbGlnbldpdGhXb3JkOiB0cnVlLFxuICBjbG9zZUNoYXJhY3RlcnM6IC9bXFxzKClcXFtcXF17fTs6PixdLyxcbiAgY2xvc2VPblBpY2s6IHRydWUsXG4gIGNsb3NlT25VbmZvY3VzOiB0cnVlLFxuICB1cGRhdGVPbkN1cnNvckFjdGl2aXR5OiB0cnVlLFxuICBjb21wbGV0ZU9uU2luZ2xlQ2xpY2s6IHRydWUsXG4gIGNvbnRhaW5lcjogbnVsbCxcbiAgY3VzdG9tS2V5czogbnVsbCxcbiAgZXh0cmFLZXlzOiBudWxsLFxuICBwYWRkaW5nRm9yU2Nyb2xsYmFyOiB0cnVlLFxuICBtb3ZlT25PdmVybGFwOiB0cnVlLFxufTtcblxuQ29kZU1pcnJvci5kZWZpbmVPcHRpb24oXCJoaW50T3B0aW9uc1wiLCBudWxsKTtcbiIsIi8vIEB0cy1ub2NoZWNrXG4vLyBCZWNhdXNlIHRoaXMgY29kZSBpcyBvcmlnaW5hbGx5IGphdmFzY3JpcHQgY29kZS5cblxuLy8gVGlueVNlZ21lbnRlciAwLjEgLS0gU3VwZXIgY29tcGFjdCBKYXBhbmVzZSB0b2tlbml6ZXIgaW4gSmF2YXNjcmlwdFxuLy8gKGMpIDIwMDggVGFrdSBLdWRvIDx0YWt1QGNoYXNlbi5vcmc+XG4vLyBUaW55U2VnbWVudGVyIGlzIGZyZWVseSBkaXN0cmlidXRhYmxlIHVuZGVyIHRoZSB0ZXJtcyBvZiBhIG5ldyBCU0QgbGljZW5jZS5cbi8vIEZvciBkZXRhaWxzLCBzZWUgaHR0cDovL2NoYXNlbi5vcmcvfnRha3Uvc29mdHdhcmUvVGlueVNlZ21lbnRlci9MSUNFTkNFLnR4dFxuXG5mdW5jdGlvbiBUaW55U2VnbWVudGVyKCkge1xuICB2YXIgcGF0dGVybnMgPSB7XG4gICAgXCJb5LiA5LqM5LiJ5Zub5LqU5YWt5LiD5YWr5Lmd5Y2B55m+5Y2D5LiH5YSE5YWGXVwiOiBcIk1cIixcbiAgICBcIlvkuIAt6b6g44CF44CG44O144O2XVwiOiBcIkhcIixcbiAgICBcIlvjgYEt44KTXVwiOiBcIklcIixcbiAgICBcIlvjgqEt44O044O8772xLe++ne++nu+9sF1cIjogXCJLXCIsXG4gICAgXCJbYS16QS1a772BLe+9mu+8oS3vvLpdXCI6IFwiQVwiLFxuICAgIFwiWzAtOe+8kC3vvJldXCI6IFwiTlwiLFxuICB9O1xuICB0aGlzLmNoYXJ0eXBlXyA9IFtdO1xuICBmb3IgKHZhciBpIGluIHBhdHRlcm5zKSB7XG4gICAgdmFyIHJlZ2V4cCA9IG5ldyBSZWdFeHAoKTtcbiAgICByZWdleHAuY29tcGlsZShpKTtcbiAgICB0aGlzLmNoYXJ0eXBlXy5wdXNoKFtyZWdleHAsIHBhdHRlcm5zW2ldXSk7XG4gIH1cblxuICB0aGlzLkJJQVNfXyA9IC0zMzI7XG4gIHRoaXMuQkMxX18gPSB7IEhIOiA2LCBJSTogMjQ2MSwgS0g6IDQwNiwgT0g6IC0xMzc4IH07XG4gIHRoaXMuQkMyX18gPSB7XG4gICAgQUE6IC0zMjY3LFxuICAgIEFJOiAyNzQ0LFxuICAgIEFOOiAtODc4LFxuICAgIEhIOiAtNDA3MCxcbiAgICBITTogLTE3MTEsXG4gICAgSE46IDQwMTIsXG4gICAgSE86IDM3NjEsXG4gICAgSUE6IDEzMjcsXG4gICAgSUg6IC0xMTg0LFxuICAgIElJOiAtMTMzMixcbiAgICBJSzogMTcyMSxcbiAgICBJTzogNTQ5MixcbiAgICBLSTogMzgzMSxcbiAgICBLSzogLTg3NDEsXG4gICAgTUg6IC0zMTMyLFxuICAgIE1LOiAzMzM0LFxuICAgIE9POiAtMjkyMCxcbiAgfTtcbiAgdGhpcy5CQzNfXyA9IHtcbiAgICBISDogOTk2LFxuICAgIEhJOiA2MjYsXG4gICAgSEs6IC03MjEsXG4gICAgSE46IC0xMzA3LFxuICAgIEhPOiAtODM2LFxuICAgIElIOiAtMzAxLFxuICAgIEtLOiAyNzYyLFxuICAgIE1LOiAxMDc5LFxuICAgIE1NOiA0MDM0LFxuICAgIE9BOiAtMTY1MixcbiAgICBPSDogMjY2LFxuICB9O1xuICB0aGlzLkJQMV9fID0geyBCQjogMjk1LCBPQjogMzA0LCBPTzogLTEyNSwgVUI6IDM1MiB9O1xuICB0aGlzLkJQMl9fID0geyBCTzogNjAsIE9POiAtMTc2MiB9O1xuICB0aGlzLkJRMV9fID0ge1xuICAgIEJISDogMTE1MCxcbiAgICBCSE06IDE1MjEsXG4gICAgQklJOiAtMTE1OCxcbiAgICBCSU06IDg4NixcbiAgICBCTUg6IDEyMDgsXG4gICAgQk5IOiA0NDksXG4gICAgQk9IOiAtOTEsXG4gICAgQk9POiAtMjU5NyxcbiAgICBPSEk6IDQ1MSxcbiAgICBPSUg6IC0yOTYsXG4gICAgT0tBOiAxODUxLFxuICAgIE9LSDogLTEwMjAsXG4gICAgT0tLOiA5MDQsXG4gICAgT09POiAyOTY1LFxuICB9O1xuICB0aGlzLkJRMl9fID0ge1xuICAgIEJISDogMTE4LFxuICAgIEJISTogLTExNTksXG4gICAgQkhNOiA0NjYsXG4gICAgQklIOiAtOTE5LFxuICAgIEJLSzogLTE3MjAsXG4gICAgQktPOiA4NjQsXG4gICAgT0hIOiAtMTEzOSxcbiAgICBPSE06IC0xODEsXG4gICAgT0lIOiAxNTMsXG4gICAgVUhJOiAtMTE0NixcbiAgfTtcbiAgdGhpcy5CUTNfXyA9IHtcbiAgICBCSEg6IC03OTIsXG4gICAgQkhJOiAyNjY0LFxuICAgIEJJSTogLTI5OSxcbiAgICBCS0k6IDQxOSxcbiAgICBCTUg6IDkzNyxcbiAgICBCTU06IDgzMzUsXG4gICAgQk5OOiA5OTgsXG4gICAgQk9IOiA3NzUsXG4gICAgT0hIOiAyMTc0LFxuICAgIE9ITTogNDM5LFxuICAgIE9JSTogMjgwLFxuICAgIE9LSDogMTc5OCxcbiAgICBPS0k6IC03OTMsXG4gICAgT0tPOiAtMjI0MixcbiAgICBPTUg6IC0yNDAyLFxuICAgIE9PTzogMTE2OTksXG4gIH07XG4gIHRoaXMuQlE0X18gPSB7XG4gICAgQkhIOiAtMzg5NSxcbiAgICBCSUg6IDM3NjEsXG4gICAgQklJOiAtNDY1NCxcbiAgICBCSUs6IDEzNDgsXG4gICAgQktLOiAtMTgwNixcbiAgICBCTUk6IC0zMzg1LFxuICAgIEJPTzogLTEyMzk2LFxuICAgIE9BSDogOTI2LFxuICAgIE9ISDogMjY2LFxuICAgIE9ISzogLTIwMzYsXG4gICAgT05OOiAtOTczLFxuICB9O1xuICB0aGlzLkJXMV9fID0ge1xuICAgIFwiLOOBqFwiOiA2NjAsXG4gICAgXCIs5ZCMXCI6IDcyNyxcbiAgICBCMeOBgjogMTQwNCxcbiAgICBCMeWQjDogNTQyLFxuICAgIFwi44CB44GoXCI6IDY2MCxcbiAgICBcIuOAgeWQjFwiOiA3MjcsXG4gICAgXCLjgI3jgahcIjogMTY4MixcbiAgICDjgYLjgaM6IDE1MDUsXG4gICAg44GE44GGOiAxNzQzLFxuICAgIOOBhOOBozogLTIwNTUsXG4gICAg44GE44KLOiA2NzIsXG4gICAg44GG44GXOiAtNDgxNyxcbiAgICDjgYbjgpM6IDY2NSxcbiAgICDjgYvjgok6IDM0NzIsXG4gICAg44GM44KJOiA2MDAsXG4gICAg44GT44GGOiAtNzkwLFxuICAgIOOBk+OBqDogMjA4MyxcbiAgICDjgZPjgpM6IC0xMjYyLFxuICAgIOOBleOCiTogLTQxNDMsXG4gICAg44GV44KTOiA0NTczLFxuICAgIOOBl+OBnzogMjY0MSxcbiAgICDjgZfjgaY6IDExMDQsXG4gICAg44GZ44GnOiAtMzM5OSxcbiAgICDjgZ3jgZM6IDE5NzcsXG4gICAg44Gd44KMOiAtODcxLFxuICAgIOOBn+OBoTogMTEyMixcbiAgICDjgZ/jgoE6IDYwMSxcbiAgICDjgaPjgZ86IDM0NjMsXG4gICAg44Gk44GEOiAtODAyLFxuICAgIOOBpuOBhDogODA1LFxuICAgIOOBpuOBjTogMTI0OSxcbiAgICDjgafjgY06IDExMjcsXG4gICAg44Gn44GZOiAzNDQ1LFxuICAgIOOBp+OBrzogODQ0LFxuICAgIOOBqOOBhDogLTQ5MTUsXG4gICAg44Go44G/OiAxOTIyLFxuICAgIOOBqeOBkzogMzg4NyxcbiAgICDjgarjgYQ6IDU3MTMsXG4gICAg44Gq44GjOiAzMDE1LFxuICAgIOOBquOBqTogNzM3OSxcbiAgICDjgarjgpM6IC0xMTEzLFxuICAgIOOBq+OBlzogMjQ2OCxcbiAgICDjgavjga86IDE0OTgsXG4gICAg44Gr44KCOiAxNjcxLFxuICAgIOOBq+WvvjogLTkxMixcbiAgICDjga7kuIA6IC01MDEsXG4gICAg44Gu5LitOiA3NDEsXG4gICAg44G+44GbOiAyNDQ4LFxuICAgIOOBvuOBpzogMTcxMSxcbiAgICDjgb7jgb46IDI2MDAsXG4gICAg44G+44KLOiAtMjE1NSxcbiAgICDjgoTjgoA6IC0xOTQ3LFxuICAgIOOCiOOBozogLTI1NjUsXG4gICAg44KM44GfOiAyMzY5LFxuICAgIOOCjOOBpzogLTkxMyxcbiAgICDjgpLjgZc6IDE4NjAsXG4gICAg44KS6KaLOiA3MzEsXG4gICAg5Lqh44GPOiAtMTg4NixcbiAgICDkuqzpg706IDI1NTgsXG4gICAg5Y+W44KKOiAtMjc4NCxcbiAgICDlpKfjgY06IC0yNjA0LFxuICAgIOWkp+mYqjogMTQ5NyxcbiAgICDlubPmlrk6IC0yMzE0LFxuICAgIOW8leOBjTogLTEzMzYsXG4gICAg5pel5pysOiAtMTk1LFxuICAgIOacrOW9kzogLTI0MjMsXG4gICAg5q+O5pelOiAtMjExMyxcbiAgICDnm67mjIc6IC03MjQsXG4gICAg77yi77yR44GCOiAxNDA0LFxuICAgIO+8ou+8keWQjDogNTQyLFxuICAgIFwi772j44GoXCI6IDE2ODIsXG4gIH07XG4gIHRoaXMuQlcyX18gPSB7XG4gICAgXCIuLlwiOiAtMTE4MjIsXG4gICAgMTE6IC02NjksXG4gICAgXCLigJXigJVcIjogLTU3MzAsXG4gICAgXCLiiJLiiJJcIjogLTEzMTc1LFxuICAgIOOBhOOBhjogLTE2MDksXG4gICAg44GG44GLOiAyNDkwLFxuICAgIOOBi+OBlzogLTEzNTAsXG4gICAg44GL44KCOiAtNjAyLFxuICAgIOOBi+OCiTogLTcxOTQsXG4gICAg44GL44KMOiA0NjEyLFxuICAgIOOBjOOBhDogODUzLFxuICAgIOOBjOOCiTogLTMxOTgsXG4gICAg44GN44GfOiAxOTQxLFxuICAgIOOBj+OBqjogLTE1OTcsXG4gICAg44GT44GoOiAtODM5MixcbiAgICDjgZPjga46IC00MTkzLFxuICAgIOOBleOBmzogNDUzMyxcbiAgICDjgZXjgow6IDEzMTY4LFxuICAgIOOBleOCkzogLTM5NzcsXG4gICAg44GX44GEOiAtMTgxOSxcbiAgICDjgZfjgYs6IC01NDUsXG4gICAg44GX44GfOiA1MDc4LFxuICAgIOOBl+OBpjogOTcyLFxuICAgIOOBl+OBqjogOTM5LFxuICAgIOOBneOBrjogLTM3NDQsXG4gICAg44Gf44GEOiAtMTI1MyxcbiAgICDjgZ/jgZ86IC02NjIsXG4gICAg44Gf44GgOiAtMzg1NyxcbiAgICDjgZ/jgaE6IC03ODYsXG4gICAg44Gf44GoOiAxMjI0LFxuICAgIOOBn+OBrzogLTkzOSxcbiAgICDjgaPjgZ86IDQ1ODksXG4gICAg44Gj44GmOiAxNjQ3LFxuICAgIOOBo+OBqDogLTIwOTQsXG4gICAg44Gm44GEOiA2MTQ0LFxuICAgIOOBpuOBjTogMzY0MCxcbiAgICDjgabjgY86IDI1NTEsXG4gICAg44Gm44GvOiAtMzExMCxcbiAgICDjgabjgoI6IC0zMDY1LFxuICAgIOOBp+OBhDogMjY2NixcbiAgICDjgafjgY06IC0xNTI4LFxuICAgIOOBp+OBlzogLTM4MjgsXG4gICAg44Gn44GZOiAtNDc2MSxcbiAgICDjgafjgoI6IC00MjAzLFxuICAgIOOBqOOBhDogMTg5MCxcbiAgICDjgajjgZM6IC0xNzQ2LFxuICAgIOOBqOOBqDogLTIyNzksXG4gICAg44Go44GuOiA3MjAsXG4gICAg44Go44G/OiA1MTY4LFxuICAgIOOBqOOCgjogLTM5NDEsXG4gICAg44Gq44GEOiAtMjQ4OCxcbiAgICDjgarjgYw6IC0xMzEzLFxuICAgIOOBquOBqTogLTY1MDksXG4gICAg44Gq44GuOiAyNjE0LFxuICAgIOOBquOCkzogMzA5OSxcbiAgICDjgavjgYo6IC0xNjE1LFxuICAgIOOBq+OBlzogMjc0OCxcbiAgICDjgavjgao6IDI0NTQsXG4gICAg44Gr44KIOiAtNzIzNixcbiAgICDjgavlr746IC0xNDk0MyxcbiAgICDjgavlvpM6IC00Njg4LFxuICAgIOOBq+mWojogLTExMzg4LFxuICAgIOOBruOBizogMjA5MyxcbiAgICDjga7jgac6IC03MDU5LFxuICAgIOOBruOBqzogLTYwNDEsXG4gICAg44Gu44GuOiAtNjEyNSxcbiAgICDjga/jgYQ6IDEwNzMsXG4gICAg44Gv44GMOiAtMTAzMyxcbiAgICDjga/jgZo6IC0yNTMyLFxuICAgIOOBsOOCjDogMTgxMyxcbiAgICDjgb7jgZc6IC0xMzE2LFxuICAgIOOBvuOBpzogLTY2MjEsXG4gICAg44G+44KMOiA1NDA5LFxuICAgIOOCgeOBpjogLTMxNTMsXG4gICAg44KC44GEOiAyMjMwLFxuICAgIOOCguOBrjogLTEwNzEzLFxuICAgIOOCieOBizogLTk0NCxcbiAgICDjgonjgZc6IC0xNjExLFxuICAgIOOCieOBqzogLTE4OTcsXG4gICAg44KK44GXOiA2NTEsXG4gICAg44KK44G+OiAxNjIwLFxuICAgIOOCjOOBnzogNDI3MCxcbiAgICDjgozjgaY6IDg0OSxcbiAgICDjgozjgbA6IDQxMTQsXG4gICAg44KN44GGOiA2MDY3LFxuICAgIOOCj+OCjDogNzkwMSxcbiAgICDjgpLpgJo6IC0xMTg3NyxcbiAgICDjgpPjgaA6IDcyOCxcbiAgICDjgpPjgao6IC00MTE1LFxuICAgIOS4gOS6ujogNjAyLFxuICAgIOS4gOaWuTogLTEzNzUsXG4gICAg5LiA5pelOiA5NzAsXG4gICAg5LiA6YOoOiAtMTA1MSxcbiAgICDkuIrjgYw6IC00NDc5LFxuICAgIOS8muekvjogLTExMTYsXG4gICAg5Ye644GmOiAyMTYzLFxuICAgIOWIhuOBrjogLTc3NTgsXG4gICAg5ZCM5YWaOiA5NzAsXG4gICAg5ZCM5pelOiAtOTEzLFxuICAgIOWkp+mYqjogLTI0NzEsXG4gICAg5aeU5ZOhOiAtMTI1MCxcbiAgICDlsJHjgao6IC0xMDUwLFxuICAgIOW5tOW6pjogLTg2NjksXG4gICAg5bm06ZaTOiAtMTYyNixcbiAgICDlupznnIw6IC0yMzYzLFxuICAgIOaJi+aoqTogLTE5ODIsXG4gICAg5paw6IGeOiAtNDA2NixcbiAgICDml6XmlrA6IC03MjIsXG4gICAg5pel5pysOiAtNzA2OCxcbiAgICDml6XnsbM6IDMzNzIsXG4gICAg5puc5pelOiAtNjAxLFxuICAgIOacnemurjogLTIzNTUsXG4gICAg5pys5Lq6OiAtMjY5NyxcbiAgICDmnbHkuqw6IC0xNTQzLFxuICAgIOeEtuOBqDogLTEzODQsXG4gICAg56S+5LyaOiAtMTI3NixcbiAgICDnq4vjgaY6IC05OTAsXG4gICAg56ys44GrOiAtMTYxMixcbiAgICDnsbPlm706IC00MjY4LFxuICAgIFwi77yR77yRXCI6IC02NjksXG4gIH07XG4gIHRoaXMuQlczX18gPSB7XG4gICAg44GC44GfOiAtMjE5NCxcbiAgICDjgYLjgoo6IDcxOSxcbiAgICDjgYLjgos6IDM4NDYsXG4gICAgXCLjgYQuXCI6IC0xMTg1LFxuICAgIFwi44GE44CCXCI6IC0xMTg1LFxuICAgIOOBhOOBhDogNTMwOCxcbiAgICDjgYTjgYg6IDIwNzksXG4gICAg44GE44GPOiAzMDI5LFxuICAgIOOBhOOBnzogMjA1NixcbiAgICDjgYTjgaM6IDE4ODMsXG4gICAg44GE44KLOiA1NjAwLFxuICAgIOOBhOOCjzogMTUyNyxcbiAgICDjgYbjgaE6IDExMTcsXG4gICAg44GG44GoOiA0Nzk4LFxuICAgIOOBiOOBqDogMTQ1NCxcbiAgICBcIuOBiy5cIjogMjg1NyxcbiAgICBcIuOBi+OAglwiOiAyODU3LFxuICAgIOOBi+OBkTogLTc0MyxcbiAgICDjgYvjgaM6IC00MDk4LFxuICAgIOOBi+OBqzogLTY2OSxcbiAgICDjgYvjgok6IDY1MjAsXG4gICAg44GL44KKOiAtMjY3MCxcbiAgICBcIuOBjCxcIjogMTgxNixcbiAgICBcIuOBjOOAgVwiOiAxODE2LFxuICAgIOOBjOOBjTogLTQ4NTUsXG4gICAg44GM44GROiAtMTEyNyxcbiAgICDjgYzjgaM6IC05MTMsXG4gICAg44GM44KJOiAtNDk3NyxcbiAgICDjgYzjgoo6IC0yMDY0LFxuICAgIOOBjeOBnzogMTY0NSxcbiAgICDjgZHjgak6IDEzNzQsXG4gICAg44GT44GoOiA3Mzk3LFxuICAgIOOBk+OBrjogMTU0MixcbiAgICDjgZPjgo06IC0yNzU3LFxuICAgIOOBleOBhDogLTcxNCxcbiAgICDjgZXjgpI6IDk3NixcbiAgICBcIuOBlyxcIjogMTU1NyxcbiAgICBcIuOBl+OAgVwiOiAxNTU3LFxuICAgIOOBl+OBhDogLTM3MTQsXG4gICAg44GX44GfOiAzNTYyLFxuICAgIOOBl+OBpjogMTQ0OSxcbiAgICDjgZfjgao6IDI2MDgsXG4gICAg44GX44G+OiAxMjAwLFxuICAgIFwi44GZLlwiOiAtMTMxMCxcbiAgICBcIuOBmeOAglwiOiAtMTMxMCxcbiAgICDjgZnjgos6IDY1MjEsXG4gICAgXCLjgZosXCI6IDM0MjYsXG4gICAgXCLjgZrjgIFcIjogMzQyNixcbiAgICDjgZrjgas6IDg0MSxcbiAgICDjgZ3jgYY6IDQyOCxcbiAgICBcIuOBny5cIjogODg3NSxcbiAgICBcIuOBn+OAglwiOiA4ODc1LFxuICAgIOOBn+OBhDogLTU5NCxcbiAgICDjgZ/jga46IDgxMixcbiAgICDjgZ/jgoo6IC0xMTgzLFxuICAgIOOBn+OCizogLTg1MyxcbiAgICBcIuOBoC5cIjogNDA5OCxcbiAgICBcIuOBoOOAglwiOiA0MDk4LFxuICAgIOOBoOOBozogMTAwNCxcbiAgICDjgaPjgZ86IC00NzQ4LFxuICAgIOOBo+OBpjogMzAwLFxuICAgIOOBpuOBhDogNjI0MCxcbiAgICDjgabjgYo6IDg1NSxcbiAgICDjgabjgoI6IDMwMixcbiAgICDjgafjgZk6IDE0MzcsXG4gICAg44Gn44GrOiAtMTQ4MixcbiAgICDjgafjga86IDIyOTUsXG4gICAg44Go44GGOiAtMTM4NyxcbiAgICDjgajjgZc6IDIyNjYsXG4gICAg44Go44GuOiA1NDEsXG4gICAg44Go44KCOiAtMzU0MyxcbiAgICDjganjgYY6IDQ2NjQsXG4gICAg44Gq44GEOiAxNzk2LFxuICAgIOOBquOBjzogLTkwMyxcbiAgICDjgarjgak6IDIxMzUsXG4gICAgXCLjgassXCI6IC0xMDIxLFxuICAgIFwi44Gr44CBXCI6IC0xMDIxLFxuICAgIOOBq+OBlzogMTc3MSxcbiAgICDjgavjgao6IDE5MDYsXG4gICAg44Gr44GvOiAyNjQ0LFxuICAgIFwi44GuLFwiOiAtNzI0LFxuICAgIFwi44Gu44CBXCI6IC03MjQsXG4gICAg44Gu5a2QOiAtMTAwMCxcbiAgICBcIuOBryxcIjogMTMzNyxcbiAgICBcIuOBr+OAgVwiOiAxMzM3LFxuICAgIOOBueOBjTogMjE4MSxcbiAgICDjgb7jgZc6IDExMTMsXG4gICAg44G+44GZOiA2OTQzLFxuICAgIOOBvuOBozogLTE1NDksXG4gICAg44G+44GnOiA2MTU0LFxuICAgIOOBvuOCjDogLTc5MyxcbiAgICDjgonjgZc6IDE0NzksXG4gICAg44KJ44KMOiA2ODIwLFxuICAgIOOCi+OCizogMzgxOCxcbiAgICBcIuOCjCxcIjogODU0LFxuICAgIFwi44KM44CBXCI6IDg1NCxcbiAgICDjgozjgZ86IDE4NTAsXG4gICAg44KM44GmOiAxMzc1LFxuICAgIOOCjOOBsDogLTMyNDYsXG4gICAg44KM44KLOiAxMDkxLFxuICAgIOOCj+OCjDogLTYwNSxcbiAgICDjgpPjgaA6IDYwNixcbiAgICDjgpPjgac6IDc5OCxcbiAgICDjgqvmnIg6IDk5MCxcbiAgICDkvJrorbA6IDg2MCxcbiAgICDlhaXjgoo6IDEyMzIsXG4gICAg5aSn5LyaOiAyMjE3LFxuICAgIOWni+OCgTogMTY4MSxcbiAgICDluII6IDk2NSxcbiAgICDmlrDogZ46IC01MDU1LFxuICAgIFwi5pelLFwiOiA5NzQsXG4gICAgXCLml6XjgIFcIjogOTc0LFxuICAgIOekvuS8mjogMjAyNCxcbiAgICDvvbbmnIg6IDk5MCxcbiAgfTtcbiAgdGhpcy5UQzFfXyA9IHtcbiAgICBBQUE6IDEwOTMsXG4gICAgSEhIOiAxMDI5LFxuICAgIEhITTogNTgwLFxuICAgIEhJSTogOTk4LFxuICAgIEhPSDogLTM5MCxcbiAgICBIT006IC0zMzEsXG4gICAgSUhJOiAxMTY5LFxuICAgIElPSDogLTE0MixcbiAgICBJT0k6IC0xMDE1LFxuICAgIElPTTogNDY3LFxuICAgIE1NSDogMTg3LFxuICAgIE9PSTogLTE4MzIsXG4gIH07XG4gIHRoaXMuVEMyX18gPSB7XG4gICAgSEhPOiAyMDg4LFxuICAgIEhJSTogLTEwMjMsXG4gICAgSE1NOiAtMTE1NCxcbiAgICBJSEk6IC0xOTY1LFxuICAgIEtLSDogNzAzLFxuICAgIE9JSTogLTI2NDksXG4gIH07XG4gIHRoaXMuVEMzX18gPSB7XG4gICAgQUFBOiAtMjk0LFxuICAgIEhISDogMzQ2LFxuICAgIEhISTogLTM0MSxcbiAgICBISUk6IC0xMDg4LFxuICAgIEhJSzogNzMxLFxuICAgIEhPSDogLTE0ODYsXG4gICAgSUhIOiAxMjgsXG4gICAgSUhJOiAtMzA0MSxcbiAgICBJSE86IC0xOTM1LFxuICAgIElJSDogLTgyNSxcbiAgICBJSU06IC0xMDM1LFxuICAgIElPSTogLTU0MixcbiAgICBLSEg6IC0xMjE2LFxuICAgIEtLQTogNDkxLFxuICAgIEtLSDogLTEyMTcsXG4gICAgS09LOiAtMTAwOSxcbiAgICBNSEg6IC0yNjk0LFxuICAgIE1ITTogLTQ1NyxcbiAgICBNSE86IDEyMyxcbiAgICBNTUg6IC00NzEsXG4gICAgTk5IOiAtMTY4OSxcbiAgICBOTk86IDY2MixcbiAgICBPSE86IC0zMzkzLFxuICB9O1xuICB0aGlzLlRDNF9fID0ge1xuICAgIEhISDogLTIwMyxcbiAgICBISEk6IDEzNDQsXG4gICAgSEhLOiAzNjUsXG4gICAgSEhNOiAtMTIyLFxuICAgIEhITjogMTgyLFxuICAgIEhITzogNjY5LFxuICAgIEhJSDogODA0LFxuICAgIEhJSTogNjc5LFxuICAgIEhPSDogNDQ2LFxuICAgIElISDogNjk1LFxuICAgIElITzogLTIzMjQsXG4gICAgSUlIOiAzMjEsXG4gICAgSUlJOiAxNDk3LFxuICAgIElJTzogNjU2LFxuICAgIElPTzogNTQsXG4gICAgS0FLOiA0ODQ1LFxuICAgIEtLQTogMzM4NixcbiAgICBLS0s6IDMwNjUsXG4gICAgTUhIOiAtNDA1LFxuICAgIE1ISTogMjAxLFxuICAgIE1NSDogLTI0MSxcbiAgICBNTU06IDY2MSxcbiAgICBNT006IDg0MSxcbiAgfTtcbiAgdGhpcy5UUTFfXyA9IHtcbiAgICBCSEhIOiAtMjI3LFxuICAgIEJISEk6IDMxNixcbiAgICBCSElIOiAtMTMyLFxuICAgIEJJSEg6IDYwLFxuICAgIEJJSUk6IDE1OTUsXG4gICAgQk5ISDogLTc0NCxcbiAgICBCT0hIOiAyMjUsXG4gICAgQk9PTzogLTkwOCxcbiAgICBPQUtLOiA0ODIsXG4gICAgT0hISDogMjgxLFxuICAgIE9ISUg6IDI0OSxcbiAgICBPSUhJOiAyMDAsXG4gICAgT0lJSDogLTY4LFxuICB9O1xuICB0aGlzLlRRMl9fID0geyBCSUhIOiAtMTQwMSwgQklJSTogLTEwMzMsIEJLQUs6IC01NDMsIEJPT086IC01NTkxIH07XG4gIHRoaXMuVFEzX18gPSB7XG4gICAgQkhISDogNDc4LFxuICAgIEJISE06IC0xMDczLFxuICAgIEJISUg6IDIyMixcbiAgICBCSElJOiAtNTA0LFxuICAgIEJJSUg6IC0xMTYsXG4gICAgQklJSTogLTEwNSxcbiAgICBCTUhJOiAtODYzLFxuICAgIEJNSE06IC00NjQsXG4gICAgQk9NSDogNjIwLFxuICAgIE9ISEg6IDM0NixcbiAgICBPSEhJOiAxNzI5LFxuICAgIE9ISUk6IDk5NyxcbiAgICBPSE1IOiA0ODEsXG4gICAgT0lISDogNjIzLFxuICAgIE9JSUg6IDEzNDQsXG4gICAgT0tBSzogMjc5MixcbiAgICBPS0hIOiA1ODcsXG4gICAgT0tLQTogNjc5LFxuICAgIE9PSEg6IDExMCxcbiAgICBPT0lJOiAtNjg1LFxuICB9O1xuICB0aGlzLlRRNF9fID0ge1xuICAgIEJISEg6IC03MjEsXG4gICAgQkhITTogLTM2MDQsXG4gICAgQkhJSTogLTk2NixcbiAgICBCSUlIOiAtNjA3LFxuICAgIEJJSUk6IC0yMTgxLFxuICAgIE9BQUE6IC0yNzYzLFxuICAgIE9BS0s6IDE4MCxcbiAgICBPSEhIOiAtMjk0LFxuICAgIE9ISEk6IDI0NDYsXG4gICAgT0hITzogNDgwLFxuICAgIE9ISUg6IC0xNTczLFxuICAgIE9JSEg6IDE5MzUsXG4gICAgT0lISTogLTQ5MyxcbiAgICBPSUlIOiA2MjYsXG4gICAgT0lJSTogLTQwMDcsXG4gICAgT0tBSzogLTgxNTYsXG4gIH07XG4gIHRoaXMuVFcxX18gPSB7IOOBq+OBpOOBhDogLTQ2ODEsIOadseS6rOmDvTogMjAyNiB9O1xuICB0aGlzLlRXMl9fID0ge1xuICAgIOOBguOCi+eoizogLTIwNDksXG4gICAg44GE44Gj44GfOiAtMTI1NixcbiAgICDjgZPjgo3jgYw6IC0yNDM0LFxuICAgIOOBl+OCh+OBhjogMzg3MyxcbiAgICDjgZ3jga7lvow6IC00NDMwLFxuICAgIOOBoOOBo+OBpjogLTEwNDksXG4gICAg44Gm44GE44GfOiAxODMzLFxuICAgIOOBqOOBl+OBpjogLTQ2NTcsXG4gICAg44Go44KC44GrOiAtNDUxNyxcbiAgICDjgoLjga7jgac6IDE4ODIsXG4gICAg5LiA5rCX44GrOiAtNzkyLFxuICAgIOWIneOCgeOBpjogLTE1MTIsXG4gICAg5ZCM5pmC44GrOiAtODA5NyxcbiAgICDlpKfjgY3jgao6IC0xMjU1LFxuICAgIOWvvuOBl+OBpjogLTI3MjEsXG4gICAg56S+5Lya5YWaOiAtMzIxNixcbiAgfTtcbiAgdGhpcy5UVzNfXyA9IHtcbiAgICDjgYTjgZ/jgaA6IC0xNzM0LFxuICAgIOOBl+OBpuOBhDogMTMxNCxcbiAgICDjgajjgZfjgaY6IC00MzE0LFxuICAgIOOBq+OBpOOBhDogLTU0ODMsXG4gICAg44Gr44Go44GjOiAtNTk4OSxcbiAgICDjgavlvZPjgZ86IC02MjQ3LFxuICAgIFwi44Gu44GnLFwiOiAtNzI3LFxuICAgIFwi44Gu44Gn44CBXCI6IC03MjcsXG4gICAg44Gu44KC44GuOiAtNjAwLFxuICAgIOOCjOOBi+OCiTogLTM3NTIsXG4gICAg5Y2B5LqM5pyIOiAtMjI4NyxcbiAgfTtcbiAgdGhpcy5UVzRfXyA9IHtcbiAgICBcIuOBhOOBhi5cIjogODU3NixcbiAgICBcIuOBhOOBhuOAglwiOiA4NTc2LFxuICAgIOOBi+OCieOBqjogLTIzNDgsXG4gICAg44GX44Gm44GEOiAyOTU4LFxuICAgIFwi44Gf44GMLFwiOiAxNTE2LFxuICAgIFwi44Gf44GM44CBXCI6IDE1MTYsXG4gICAg44Gm44GE44KLOiAxNTM4LFxuICAgIOOBqOOBhOOBhjogMTM0OSxcbiAgICDjgb7jgZfjgZ86IDU1NDMsXG4gICAg44G+44Gb44KTOiAxMDk3LFxuICAgIOOCiOOBhuOBqDogLTQyNTgsXG4gICAg44KI44KL44GoOiA1ODY1LFxuICB9O1xuICB0aGlzLlVDMV9fID0geyBBOiA0ODQsIEs6IDkzLCBNOiA2NDUsIE86IC01MDUgfTtcbiAgdGhpcy5VQzJfXyA9IHsgQTogODE5LCBIOiAxMDU5LCBJOiA0MDksIE06IDM5ODcsIE46IDU3NzUsIE86IDY0NiB9O1xuICB0aGlzLlVDM19fID0geyBBOiAtMTM3MCwgSTogMjMxMSB9O1xuICB0aGlzLlVDNF9fID0ge1xuICAgIEE6IC0yNjQzLFxuICAgIEg6IDE4MDksXG4gICAgSTogLTEwMzIsXG4gICAgSzogLTM0NTAsXG4gICAgTTogMzU2NSxcbiAgICBOOiAzODc2LFxuICAgIE86IDY2NDYsXG4gIH07XG4gIHRoaXMuVUM1X18gPSB7IEg6IDMxMywgSTogLTEyMzgsIEs6IC03OTksIE06IDUzOSwgTzogLTgzMSB9O1xuICB0aGlzLlVDNl9fID0geyBIOiAtNTA2LCBJOiAtMjUzLCBLOiA4NywgTTogMjQ3LCBPOiAtMzg3IH07XG4gIHRoaXMuVVAxX18gPSB7IE86IC0yMTQgfTtcbiAgdGhpcy5VUDJfXyA9IHsgQjogNjksIE86IDkzNSB9O1xuICB0aGlzLlVQM19fID0geyBCOiAxODkgfTtcbiAgdGhpcy5VUTFfXyA9IHtcbiAgICBCSDogMjEsXG4gICAgQkk6IC0xMixcbiAgICBCSzogLTk5LFxuICAgIEJOOiAxNDIsXG4gICAgQk86IC01NixcbiAgICBPSDogLTk1LFxuICAgIE9JOiA0NzcsXG4gICAgT0s6IDQxMCxcbiAgICBPTzogLTI0MjIsXG4gIH07XG4gIHRoaXMuVVEyX18gPSB7IEJIOiAyMTYsIEJJOiAxMTMsIE9LOiAxNzU5IH07XG4gIHRoaXMuVVEzX18gPSB7XG4gICAgQkE6IC00NzksXG4gICAgQkg6IDQyLFxuICAgIEJJOiAxOTEzLFxuICAgIEJLOiAtNzE5OCxcbiAgICBCTTogMzE2MCxcbiAgICBCTjogNjQyNyxcbiAgICBCTzogMTQ3NjEsXG4gICAgT0k6IC04MjcsXG4gICAgT046IC0zMjEyLFxuICB9O1xuICB0aGlzLlVXMV9fID0ge1xuICAgIFwiLFwiOiAxNTYsXG4gICAgXCLjgIFcIjogMTU2LFxuICAgIFwi44CMXCI6IC00NjMsXG4gICAg44GCOiAtOTQxLFxuICAgIOOBhjogLTEyNyxcbiAgICDjgYw6IC01NTMsXG4gICAg44GNOiAxMjEsXG4gICAg44GTOiA1MDUsXG4gICAg44GnOiAtMjAxLFxuICAgIOOBqDogLTU0NyxcbiAgICDjgak6IC0xMjMsXG4gICAg44GrOiAtNzg5LFxuICAgIOOBrjogLTE4NSxcbiAgICDjga86IC04NDcsXG4gICAg44KCOiAtNDY2LFxuICAgIOOChDogLTQ3MCxcbiAgICDjgog6IDE4MixcbiAgICDjgok6IC0yOTIsXG4gICAg44KKOiAyMDgsXG4gICAg44KMOiAxNjksXG4gICAg44KSOiAtNDQ2LFxuICAgIOOCkzogLTEzNyxcbiAgICBcIuODu1wiOiAtMTM1LFxuICAgIOS4uzogLTQwMixcbiAgICDkuqw6IC0yNjgsXG4gICAg5Yy6OiAtOTEyLFxuICAgIOWNiDogODcxLFxuICAgIOWbvTogLTQ2MCxcbiAgICDlpKc6IDU2MSxcbiAgICDlp5Q6IDcyOSxcbiAgICDluII6IC00MTEsXG4gICAg5pelOiAtMTQxLFxuICAgIOeQhjogMzYxLFxuICAgIOeUnzogLTQwOCxcbiAgICDnnIw6IC0zODYsXG4gICAg6YO9OiAtNzE4LFxuICAgIFwi772iXCI6IC00NjMsXG4gICAgXCLvvaVcIjogLTEzNSxcbiAgfTtcbiAgdGhpcy5VVzJfXyA9IHtcbiAgICBcIixcIjogLTgyOSxcbiAgICBcIuOAgVwiOiAtODI5LFxuICAgIOOAhzogODkyLFxuICAgIFwi44CMXCI6IC02NDUsXG4gICAgXCLjgI1cIjogMzE0NSxcbiAgICDjgYI6IC01MzgsXG4gICAg44GEOiA1MDUsXG4gICAg44GGOiAxMzQsXG4gICAg44GKOiAtNTAyLFxuICAgIOOBizogMTQ1NCxcbiAgICDjgYw6IC04NTYsXG4gICAg44GPOiAtNDEyLFxuICAgIOOBkzogMTE0MSxcbiAgICDjgZU6IDg3OCxcbiAgICDjgZY6IDU0MCxcbiAgICDjgZc6IDE1MjksXG4gICAg44GZOiAtNjc1LFxuICAgIOOBmzogMzAwLFxuICAgIOOBnTogLTEwMTEsXG4gICAg44GfOiAxODgsXG4gICAg44GgOiAxODM3LFxuICAgIOOBpDogLTk0OSxcbiAgICDjgaY6IC0yOTEsXG4gICAg44GnOiAtMjY4LFxuICAgIOOBqDogLTk4MSxcbiAgICDjgak6IDEyNzMsXG4gICAg44GqOiAxMDYzLFxuICAgIOOBqzogLTE3NjQsXG4gICAg44GuOiAxMzAsXG4gICAg44GvOiAtNDA5LFxuICAgIOOBsjogLTEyNzMsXG4gICAg44G5OiAxMjYxLFxuICAgIOOBvjogNjAwLFxuICAgIOOCgjogLTEyNjMsXG4gICAg44KEOiAtNDAyLFxuICAgIOOCiDogMTYzOSxcbiAgICDjgoo6IC01NzksXG4gICAg44KLOiAtNjk0LFxuICAgIOOCjDogNTcxLFxuICAgIOOCkjogLTI1MTYsXG4gICAg44KTOiAyMDk1LFxuICAgIOOCojogLTU4NyxcbiAgICDjgqs6IDMwNixcbiAgICDjgq06IDU2OCxcbiAgICDjg4M6IDgzMSxcbiAgICDkuIk6IC03NTgsXG4gICAg5LiNOiAtMjE1MCxcbiAgICDkuJY6IC0zMDIsXG4gICAg5LitOiAtOTY4LFxuICAgIOS4uzogLTg2MSxcbiAgICDkuos6IDQ5MixcbiAgICDkuro6IC0xMjMsXG4gICAg5LyaOiA5NzgsXG4gICAg5L+dOiAzNjIsXG4gICAg5YWlOiA1NDgsXG4gICAg5YidOiAtMzAyNSxcbiAgICDlia86IC0xNTY2LFxuICAgIOWMlzogLTM0MTQsXG4gICAg5Yy6OiAtNDIyLFxuICAgIOWkpzogLTE3NjksXG4gICAg5aSpOiAtODY1LFxuICAgIOWkqjogLTQ4MyxcbiAgICDlrZA6IC0xNTE5LFxuICAgIOWtpjogNzYwLFxuICAgIOWunzogMTAyMyxcbiAgICDlsI86IC0yMDA5LFxuICAgIOW4gjogLTgxMyxcbiAgICDlubQ6IC0xMDYwLFxuICAgIOW8tzogMTA2NyxcbiAgICDmiYs6IC0xNTE5LFxuICAgIOaPujogLTEwMzMsXG4gICAg5pS/OiAxNTIyLFxuICAgIOaWhzogLTEzNTUsXG4gICAg5pawOiAtMTY4MixcbiAgICDml6U6IC0xODE1LFxuICAgIOaYjjogLTE0NjIsXG4gICAg5pyAOiAtNjMwLFxuICAgIOacnTogLTE4NDMsXG4gICAg5pysOiAtMTY1MCxcbiAgICDmnbE6IC05MzEsXG4gICAg5p6cOiAtNjY1LFxuICAgIOasoTogLTIzNzgsXG4gICAg5rCROiAtMTgwLFxuICAgIOawlzogLTE3NDAsXG4gICAg55CGOiA3NTIsXG4gICAg55m6OiA1MjksXG4gICAg55uuOiAtMTU4NCxcbiAgICDnm7g6IC0yNDIsXG4gICAg55yMOiAtMTE2NSxcbiAgICDnq4s6IC03NjMsXG4gICAg56ysOiA4MTAsXG4gICAg57GzOiA1MDksXG4gICAg6IeqOiAtMTM1MyxcbiAgICDooYw6IDgzOCxcbiAgICDopb86IC03NDQsXG4gICAg6KaLOiAtMzg3NCxcbiAgICDoqr86IDEwMTAsXG4gICAg6K2wOiAxMTk4LFxuICAgIOi+vDogMzA0MSxcbiAgICDplos6IDE3NTgsXG4gICAg6ZaTOiAtMTI1NyxcbiAgICBcIu+9olwiOiAtNjQ1LFxuICAgIFwi772jXCI6IDMxNDUsXG4gICAg772vOiA4MzEsXG4gICAg772xOiAtNTg3LFxuICAgIO+9tjogMzA2LFxuICAgIO+9tzogNTY4LFxuICB9O1xuICB0aGlzLlVXM19fID0ge1xuICAgIFwiLFwiOiA0ODg5LFxuICAgIDE6IC04MDAsXG4gICAgXCLiiJJcIjogLTE3MjMsXG4gICAgXCLjgIFcIjogNDg4OSxcbiAgICDjgIU6IC0yMzExLFxuICAgIOOAhzogNTgyNyxcbiAgICBcIuOAjVwiOiAyNjcwLFxuICAgIFwi44CTXCI6IC0zNTczLFxuICAgIOOBgjogLTI2OTYsXG4gICAg44GEOiAxMDA2LFxuICAgIOOBhjogMjM0MixcbiAgICDjgYg6IDE5ODMsXG4gICAg44GKOiAtNDg2NCxcbiAgICDjgYs6IC0xMTYzLFxuICAgIOOBjDogMzI3MSxcbiAgICDjgY86IDEwMDQsXG4gICAg44GROiAzODgsXG4gICAg44GSOiA0MDEsXG4gICAg44GTOiAtMzU1MixcbiAgICDjgZQ6IC0zMTE2LFxuICAgIOOBlTogLTEwNTgsXG4gICAg44GXOiAtMzk1LFxuICAgIOOBmTogNTg0LFxuICAgIOOBmzogMzY4NSxcbiAgICDjgZ06IC01MjI4LFxuICAgIOOBnzogODQyLFxuICAgIOOBoTogLTUyMSxcbiAgICDjgaM6IC0xNDQ0LFxuICAgIOOBpDogLTEwODEsXG4gICAg44GmOiA2MTY3LFxuICAgIOOBpzogMjMxOCxcbiAgICDjgag6IDE2OTEsXG4gICAg44GpOiAtODk5LFxuICAgIOOBqjogLTI3ODgsXG4gICAg44GrOiAyNzQ1LFxuICAgIOOBrjogNDA1NixcbiAgICDjga86IDQ1NTUsXG4gICAg44GyOiAtMjE3MSxcbiAgICDjgbU6IC0xNzk4LFxuICAgIOOBuDogMTE5OSxcbiAgICDjgbs6IC01NTE2LFxuICAgIOOBvjogLTQzODQsXG4gICAg44G/OiAtMTIwLFxuICAgIOOCgTogMTIwNSxcbiAgICDjgoI6IDIzMjMsXG4gICAg44KEOiAtNzg4LFxuICAgIOOCiDogLTIwMixcbiAgICDjgok6IDcyNyxcbiAgICDjgoo6IDY0OSxcbiAgICDjgos6IDU5MDUsXG4gICAg44KMOiAyNzczLFxuICAgIOOCjzogLTEyMDcsXG4gICAg44KSOiA2NjIwLFxuICAgIOOCkzogLTUxOCxcbiAgICDjgqI6IDU1MSxcbiAgICDjgrA6IDEzMTksXG4gICAg44K5OiA4NzQsXG4gICAg44ODOiAtMTM1MCxcbiAgICDjg4g6IDUyMSxcbiAgICDjg6A6IDExMDksXG4gICAg44OrOiAxNTkxLFxuICAgIOODrTogMjIwMSxcbiAgICDjg7M6IDI3OCxcbiAgICBcIuODu1wiOiAtMzc5NCxcbiAgICDkuIA6IC0xNjE5LFxuICAgIOS4izogLTE3NTksXG4gICAg5LiWOiAtMjA4NyxcbiAgICDkuKE6IDM4MTUsXG4gICAg5LitOiA2NTMsXG4gICAg5Li7OiAtNzU4LFxuICAgIOS6iDogLTExOTMsXG4gICAg5LqMOiA5NzQsXG4gICAg5Lq6OiAyNzQyLFxuICAgIOS7ijogNzkyLFxuICAgIOS7ljogMTg4OSxcbiAgICDku6U6IC0xMzY4LFxuICAgIOS9jjogODExLFxuICAgIOS9lTogNDI2NSxcbiAgICDkvZw6IC0zNjEsXG4gICAg5L+dOiAtMjQzOSxcbiAgICDlhYM6IDQ4NTgsXG4gICAg5YWaOiAzNTkzLFxuICAgIOWFqDogMTU3NCxcbiAgICDlhaw6IC0zMDMwLFxuICAgIOWFrTogNzU1LFxuICAgIOWFsTogLTE4ODAsXG4gICAg5YaGOiA1ODA3LFxuICAgIOWGjTogMzA5NSxcbiAgICDliIY6IDQ1NyxcbiAgICDliJ06IDI0NzUsXG4gICAg5YilOiAxMTI5LFxuICAgIOWJjTogMjI4NixcbiAgICDlia86IDQ0MzcsXG4gICAg5YqbOiAzNjUsXG4gICAg5YuVOiAtOTQ5LFxuICAgIOWLmTogLTE4NzIsXG4gICAg5YyWOiAxMzI3LFxuICAgIOWMlzogLTEwMzgsXG4gICAg5Yy6OiA0NjQ2LFxuICAgIOWNgzogLTIzMDksXG4gICAg5Y2IOiAtNzgzLFxuICAgIOWNlDogLTEwMDYsXG4gICAg5Y+jOiA0ODMsXG4gICAg5Y+zOiAxMjMzLFxuICAgIOWQhDogMzU4OCxcbiAgICDlkIg6IC0yNDEsXG4gICAg5ZCMOiAzOTA2LFxuICAgIOWSjDogLTgzNyxcbiAgICDlk6E6IDQ1MTMsXG4gICAg5Zu9OiA2NDIsXG4gICAg5Z6LOiAxMzg5LFxuICAgIOWgtDogMTIxOSxcbiAgICDlpJY6IC0yNDEsXG4gICAg5aa7OiAyMDE2LFxuICAgIOWtpjogLTEzNTYsXG4gICAg5a6JOiAtNDIzLFxuICAgIOWunzogLTEwMDgsXG4gICAg5a62OiAxMDc4LFxuICAgIOWwjzogLTUxMyxcbiAgICDlsJE6IC0zMTAyLFxuICAgIOW3njogMTE1NSxcbiAgICDluII6IDMxOTcsXG4gICAg5bmzOiAtMTgwNCxcbiAgICDlubQ6IDI0MTYsXG4gICAg5bqDOiAtMTAzMCxcbiAgICDlupw6IDE2MDUsXG4gICAg5bqmOiAxNDUyLFxuICAgIOW7ujogLTIzNTIsXG4gICAg5b2TOiAtMzg4NSxcbiAgICDlvpc6IDE5MDUsXG4gICAg5oCdOiAtMTI5MSxcbiAgICDmgKc6IDE4MjIsXG4gICAg5oi4OiAtNDg4LFxuICAgIOaMhzogLTM5NzMsXG4gICAg5pS/OiAtMjAxMyxcbiAgICDmlZk6IC0xNDc5LFxuICAgIOaVsDogMzIyMixcbiAgICDmloc6IC0xNDg5LFxuICAgIOaWsDogMTc2NCxcbiAgICDml6U6IDIwOTksXG4gICAg5penOiA1NzkyLFxuICAgIOaYqDogLTY2MSxcbiAgICDmmYI6IC0xMjQ4LFxuICAgIOabnDogLTk1MSxcbiAgICDmnIA6IC05MzcsXG4gICAg5pyIOiA0MTI1LFxuICAgIOacnzogMzYwLFxuICAgIOadjjogMzA5NCxcbiAgICDmnZE6IDM2NCxcbiAgICDmnbE6IC04MDUsXG4gICAg5qC4OiA1MTU2LFxuICAgIOajrjogMjQzOCxcbiAgICDmpa06IDQ4NCxcbiAgICDmsI86IDI2MTMsXG4gICAg5rCROiAtMTY5NCxcbiAgICDmsbo6IC0xMDczLFxuICAgIOazlTogMTg2OCxcbiAgICDmtbc6IC00OTUsXG4gICAg54ShOiA5NzksXG4gICAg54mpOiA0NjEsXG4gICAg54m5OiAtMzg1MCxcbiAgICDnlJ86IC0yNzMsXG4gICAg55SoOiA5MTQsXG4gICAg55S6OiAxMjE1LFxuICAgIOeahDogNzMxMyxcbiAgICDnm7Q6IC0xODM1LFxuICAgIOecgTogNzkyLFxuICAgIOecjDogNjI5MyxcbiAgICDnn6U6IC0xNTI4LFxuICAgIOengTogNDIzMSxcbiAgICDnqI46IDQwMSxcbiAgICDnq4s6IC05NjAsXG4gICAg56ysOiAxMjAxLFxuICAgIOexszogNzc2NyxcbiAgICDns7s6IDMwNjYsXG4gICAg57SEOiAzNjYzLFxuICAgIOe0mjogMTM4NCxcbiAgICDntbE6IC00MjI5LFxuICAgIOe3jzogMTE2MyxcbiAgICDnt5o6IDEyNTUsXG4gICAg6ICFOiA2NDU3LFxuICAgIOiDvTogNzI1LFxuICAgIOiHqjogLTI4NjksXG4gICAg6IuxOiA3ODUsXG4gICAg6KaLOiAxMDQ0LFxuICAgIOiqvzogLTU2MixcbiAgICDosqE6IC03MzMsXG4gICAg6LK7OiAxNzc3LFxuICAgIOi7ijogMTgzNSxcbiAgICDou406IDEzNzUsXG4gICAg6L68OiAtMTUwNCxcbiAgICDpgJo6IC0xMTM2LFxuICAgIOmBuDogLTY4MSxcbiAgICDpg446IDEwMjYsXG4gICAg6YOhOiA0NDA0LFxuICAgIOmDqDogMTIwMCxcbiAgICDph5E6IDIxNjMsXG4gICAg6ZW3OiA0MjEsXG4gICAg6ZaLOiAtMTQzMixcbiAgICDplpM6IDEzMDIsXG4gICAg6ZaiOiAtMTI4MixcbiAgICDpm6g6IDIwMDksXG4gICAg6Zu7OiAtMTA0NSxcbiAgICDpnZ46IDIwNjYsXG4gICAg6aeFOiAxNjIwLFxuICAgIFwi77yRXCI6IC04MDAsXG4gICAgXCLvvaNcIjogMjY3MCxcbiAgICBcIu+9pVwiOiAtMzc5NCxcbiAgICDvva86IC0xMzUwLFxuICAgIO+9sTogNTUxLFxuICAgIO+9uO++njogMTMxOSxcbiAgICDvvb06IDg3NCxcbiAgICDvvoQ6IDUyMSxcbiAgICDvvpE6IDExMDksXG4gICAg776ZOiAxNTkxLFxuICAgIO++mzogMjIwMSxcbiAgICDvvp06IDI3OCxcbiAgfTtcbiAgdGhpcy5VVzRfXyA9IHtcbiAgICBcIixcIjogMzkzMCxcbiAgICBcIi5cIjogMzUwOCxcbiAgICBcIuKAlVwiOiAtNDg0MSxcbiAgICBcIuOAgVwiOiAzOTMwLFxuICAgIFwi44CCXCI6IDM1MDgsXG4gICAg44CHOiA0OTk5LFxuICAgIFwi44CMXCI6IDE4OTUsXG4gICAgXCLjgI1cIjogMzc5OCxcbiAgICBcIuOAk1wiOiAtNTE1NixcbiAgICDjgYI6IDQ3NTIsXG4gICAg44GEOiAtMzQzNSxcbiAgICDjgYY6IC02NDAsXG4gICAg44GIOiAtMjUxNCxcbiAgICDjgYo6IDI0MDUsXG4gICAg44GLOiA1MzAsXG4gICAg44GMOiA2MDA2LFxuICAgIOOBjTogLTQ0ODIsXG4gICAg44GOOiAtMzgyMSxcbiAgICDjgY86IC0zNzg4LFxuICAgIOOBkTogLTQzNzYsXG4gICAg44GSOiAtNDczNCxcbiAgICDjgZM6IDIyNTUsXG4gICAg44GUOiAxOTc5LFxuICAgIOOBlTogMjg2NCxcbiAgICDjgZc6IC04NDMsXG4gICAg44GYOiAtMjUwNixcbiAgICDjgZk6IC03MzEsXG4gICAg44GaOiAxMjUxLFxuICAgIOOBmzogMTgxLFxuICAgIOOBnTogNDA5MSxcbiAgICDjgZ86IDUwMzQsXG4gICAg44GgOiA1NDA4LFxuICAgIOOBoTogLTM2NTQsXG4gICAg44GjOiAtNTg4MixcbiAgICDjgaQ6IC0xNjU5LFxuICAgIOOBpjogMzk5NCxcbiAgICDjgac6IDc0MTAsXG4gICAg44GoOiA0NTQ3LFxuICAgIOOBqjogNTQzMyxcbiAgICDjgas6IDY0OTksXG4gICAg44GsOiAxODUzLFxuICAgIOOBrTogMTQxMyxcbiAgICDjga46IDczOTYsXG4gICAg44GvOiA4NTc4LFxuICAgIOOBsDogMTk0MCxcbiAgICDjgbI6IDQyNDksXG4gICAg44GzOiAtNDEzNCxcbiAgICDjgbU6IDEzNDUsXG4gICAg44G4OiA2NjY1LFxuICAgIOOBuTogLTc0NCxcbiAgICDjgbs6IDE0NjQsXG4gICAg44G+OiAxMDUxLFxuICAgIOOBvzogLTIwODIsXG4gICAg44KAOiAtODgyLFxuICAgIOOCgTogLTUwNDYsXG4gICAg44KCOiA0MTY5LFxuICAgIOOCgzogLTI2NjYsXG4gICAg44KEOiAyNzk1LFxuICAgIOOChzogLTE1NDQsXG4gICAg44KIOiAzMzUxLFxuICAgIOOCiTogLTI5MjIsXG4gICAg44KKOiAtOTcyNixcbiAgICDjgos6IC0xNDg5NixcbiAgICDjgow6IC0yNjEzLFxuICAgIOOCjTogLTQ1NzAsXG4gICAg44KPOiAtMTc4MyxcbiAgICDjgpI6IDEzMTUwLFxuICAgIOOCkzogLTIzNTIsXG4gICAg44KrOiAyMTQ1LFxuICAgIOOCszogMTc4OSxcbiAgICDjgrs6IDEyODcsXG4gICAg44ODOiAtNzI0LFxuICAgIOODiDogLTQwMyxcbiAgICDjg6E6IC0xNjM1LFxuICAgIOODqTogLTg4MSxcbiAgICDjg6o6IC01NDEsXG4gICAg44OrOiAtODU2LFxuICAgIOODszogLTM2MzcsXG4gICAgXCLjg7tcIjogLTQzNzEsXG4gICAg44O8OiAtMTE4NzAsXG4gICAg5LiAOiAtMjA2OSxcbiAgICDkuK06IDIyMTAsXG4gICAg5LqIOiA3ODIsXG4gICAg5LqLOiAtMTkwLFxuICAgIOS6lTogLTE3NjgsXG4gICAg5Lq6OiAxMDM2LFxuICAgIOS7pTogNTQ0LFxuICAgIOS8mjogOTUwLFxuICAgIOS9kzogLTEyODYsXG4gICAg5L2cOiA1MzAsXG4gICAg5YG0OiA0MjkyLFxuICAgIOWFiDogNjAxLFxuICAgIOWFmjogLTIwMDYsXG4gICAg5YWxOiAtMTIxMixcbiAgICDlhoU6IDU4NCxcbiAgICDlhoY6IDc4OCxcbiAgICDliJ06IDEzNDcsXG4gICAg5YmNOiAxNjIzLFxuICAgIOWJrzogMzg3OSxcbiAgICDlips6IC0zMDIsXG4gICAg5YuVOiAtNzQwLFxuICAgIOWLmTogLTI3MTUsXG4gICAg5YyWOiA3NzYsXG4gICAg5Yy6OiA0NTE3LFxuICAgIOWNlDogMTAxMyxcbiAgICDlj4I6IDE1NTUsXG4gICAg5ZCIOiAtMTgzNCxcbiAgICDlkow6IC02ODEsXG4gICAg5ZOhOiAtOTEwLFxuICAgIOWZqDogLTg1MSxcbiAgICDlm546IDE1MDAsXG4gICAg5Zu9OiAtNjE5LFxuICAgIOWckjogLTEyMDAsXG4gICAg5ZywOiA4NjYsXG4gICAg5aC0OiAtMTQxMCxcbiAgICDloYE6IC0yMDk0LFxuICAgIOWjqzogLTE0MTMsXG4gICAg5aSaOiAxMDY3LFxuICAgIOWkpzogNTcxLFxuICAgIOWtkDogLTQ4MDIsXG4gICAg5a2mOiAtMTM5NyxcbiAgICDlrpo6IC0xMDU3LFxuICAgIOWvujogLTgwOSxcbiAgICDlsI86IDE5MTAsXG4gICAg5bGLOiAtMTMyOCxcbiAgICDlsbE6IC0xNTAwLFxuICAgIOWztjogLTIwNTYsXG4gICAg5bedOiAtMjY2NyxcbiAgICDluII6IDI3NzEsXG4gICAg5bm0OiAzNzQsXG4gICAg5bqBOiAtNDU1NixcbiAgICDlvow6IDQ1NixcbiAgICDmgKc6IDU1MyxcbiAgICDmhJ86IDkxNixcbiAgICDmiYA6IC0xNTY2LFxuICAgIOaUrzogODU2LFxuICAgIOaUuTogNzg3LFxuICAgIOaUvzogMjE4MixcbiAgICDmlZk6IDcwNCxcbiAgICDmloc6IDUyMixcbiAgICDmlrk6IC04NTYsXG4gICAg5pelOiAxNzk4LFxuICAgIOaZgjogMTgyOSxcbiAgICDmnIA6IDg0NSxcbiAgICDmnIg6IC05MDY2LFxuICAgIOacqDogLTQ4NSxcbiAgICDmnaU6IC00NDIsXG4gICAg5qChOiAtMzYwLFxuICAgIOalrTogLTEwNDMsXG4gICAg5rCPOiA1Mzg4LFxuICAgIOawkTogLTI3MTYsXG4gICAg5rCXOiAtOTEwLFxuICAgIOayojogLTkzOSxcbiAgICDmuIg6IC01NDMsXG4gICAg54mpOiAtNzM1LFxuICAgIOeOhzogNjcyLFxuICAgIOeQgzogLTEyNjcsXG4gICAg55SfOiAtMTI4NixcbiAgICDnlKM6IC0xMTAxLFxuICAgIOeUsDogLTI5MDAsXG4gICAg55S6OiAxODI2LFxuICAgIOeahDogMjU4NixcbiAgICDnm646IDkyMixcbiAgICDnnIE6IC0zNDg1LFxuICAgIOecjDogMjk5NyxcbiAgICDnqbo6IC04NjcsXG4gICAg56uLOiAtMjExMixcbiAgICDnrKw6IDc4OCxcbiAgICDnsbM6IDI5MzcsXG4gICAg57O7OiA3ODYsXG4gICAg57SEOiAyMTcxLFxuICAgIOe1jDogMTE0NixcbiAgICDntbE6IC0xMTY5LFxuICAgIOe3jzogOTQwLFxuICAgIOe3mjogLTk5NCxcbiAgICDnvbI6IDc0OSxcbiAgICDogIU6IDIxNDUsXG4gICAg6IO9OiAtNzMwLFxuICAgIOiIrDogLTg1MixcbiAgICDooYw6IC03OTIsXG4gICAg6KaPOiA3OTIsXG4gICAg6K2mOiAtMTE4NCxcbiAgICDorbA6IC0yNDQsXG4gICAg6LC3OiAtMTAwMCxcbiAgICDos546IDczMCxcbiAgICDou4o6IC0xNDgxLFxuICAgIOi7jTogMTE1OCxcbiAgICDovKo6IC0xNDMzLFxuICAgIOi+vDogLTMzNzAsXG4gICAg6L+ROiA5MjksXG4gICAg6YGTOiAtMTI5MSxcbiAgICDpgbg6IDI1OTYsXG4gICAg6YOOOiAtNDg2NixcbiAgICDpg706IDExOTIsXG4gICAg6YeOOiAtMTEwMCxcbiAgICDpioA6IC0yMjEzLFxuICAgIOmVtzogMzU3LFxuICAgIOmWkzogLTIzNDQsXG4gICAg6ZmiOiAtMjI5NyxcbiAgICDpmps6IC0yNjA0LFxuICAgIOmbuzogLTg3OCxcbiAgICDpoJg6IC0xNjU5LFxuICAgIOmhjDogLTc5MixcbiAgICDppKg6IC0xOTg0LFxuICAgIOmmljogMTc0OSxcbiAgICDpq5g6IDIxMjAsXG4gICAgXCLvvaJcIjogMTg5NSxcbiAgICBcIu+9o1wiOiAzNzk4LFxuICAgIFwi772lXCI6IC00MzcxLFxuICAgIO+9rzogLTcyNCxcbiAgICDvvbA6IC0xMTg3MCxcbiAgICDvvbY6IDIxNDUsXG4gICAg7726OiAxNzg5LFxuICAgIO+9vjogMTI4NyxcbiAgICDvvoQ6IC00MDMsXG4gICAg776SOiAtMTYzNSxcbiAgICDvvpc6IC04ODEsXG4gICAg776YOiAtNTQxLFxuICAgIO++mTogLTg1NixcbiAgICDvvp06IC0zNjM3LFxuICB9O1xuICB0aGlzLlVXNV9fID0ge1xuICAgIFwiLFwiOiA0NjUsXG4gICAgXCIuXCI6IC0yOTksXG4gICAgMTogLTUxNCxcbiAgICBFMjogLTMyNzY4LFxuICAgIFwiXVwiOiAtMjc2MixcbiAgICBcIuOAgVwiOiA0NjUsXG4gICAgXCLjgIJcIjogLTI5OSxcbiAgICBcIuOAjFwiOiAzNjMsXG4gICAg44GCOiAxNjU1LFxuICAgIOOBhDogMzMxLFxuICAgIOOBhjogLTUwMyxcbiAgICDjgYg6IDExOTksXG4gICAg44GKOiA1MjcsXG4gICAg44GLOiA2NDcsXG4gICAg44GMOiAtNDIxLFxuICAgIOOBjTogMTYyNCxcbiAgICDjgY46IDE5NzEsXG4gICAg44GPOiAzMTIsXG4gICAg44GSOiAtOTgzLFxuICAgIOOBlTogLTE1MzcsXG4gICAg44GXOiAtMTM3MSxcbiAgICDjgZk6IC04NTIsXG4gICAg44GgOiAtMTE4NixcbiAgICDjgaE6IDEwOTMsXG4gICAg44GjOiA1MixcbiAgICDjgaQ6IDkyMSxcbiAgICDjgaY6IC0xOCxcbiAgICDjgac6IC04NTAsXG4gICAg44GoOiAtMTI3LFxuICAgIOOBqTogMTY4MixcbiAgICDjgao6IC03ODcsXG4gICAg44GrOiAtMTIyNCxcbiAgICDjga46IC02MzUsXG4gICAg44GvOiAtNTc4LFxuICAgIOOBuTogMTAwMSxcbiAgICDjgb86IDUwMixcbiAgICDjgoE6IDg2NSxcbiAgICDjgoM6IDMzNTAsXG4gICAg44KHOiA4NTQsXG4gICAg44KKOiAtMjA4LFxuICAgIOOCizogNDI5LFxuICAgIOOCjDogNTA0LFxuICAgIOOCjzogNDE5LFxuICAgIOOCkjogLTEyNjQsXG4gICAg44KTOiAzMjcsXG4gICAg44KkOiAyNDEsXG4gICAg44OrOiA0NTEsXG4gICAg44OzOiAtMzQzLFxuICAgIOS4rTogLTg3MSxcbiAgICDkuqw6IDcyMixcbiAgICDkvJo6IC0xMTUzLFxuICAgIOWFmjogLTY1NCxcbiAgICDli5k6IDM1MTksXG4gICAg5Yy6OiAtOTAxLFxuICAgIOWRijogODQ4LFxuICAgIOWToTogMjEwNCxcbiAgICDlpKc6IC0xMjk2LFxuICAgIOWtpjogLTU0OCxcbiAgICDlrpo6IDE3ODUsXG4gICAg5bWQOiAtMTMwNCxcbiAgICDluII6IC0yOTkxLFxuICAgIOW4rTogOTIxLFxuICAgIOW5tDogMTc2MyxcbiAgICDmgJ06IDg3MixcbiAgICDmiYA6IC04MTQsXG4gICAg5oyZOiAxNjE4LFxuICAgIOaWsDogLTE2ODIsXG4gICAg5pelOiAyMTgsXG4gICAg5pyIOiAtNDM1MyxcbiAgICDmn7s6IDkzMixcbiAgICDmoLw6IDEzNTYsXG4gICAg5qmfOiAtMTUwOCxcbiAgICDmsI86IC0xMzQ3LFxuICAgIOeUsDogMjQwLFxuICAgIOeUujogLTM5MTIsXG4gICAg55qEOiAtMzE0OSxcbiAgICDnm7g6IDEzMTksXG4gICAg55yBOiAtMTA1MixcbiAgICDnnIw6IC00MDAzLFxuICAgIOeglDogLTk5NyxcbiAgICDnpL46IC0yNzgsXG4gICAg56m6OiAtODEzLFxuICAgIOe1sTogMTk1NSxcbiAgICDogIU6IC0yMjMzLFxuICAgIOihqDogNjYzLFxuICAgIOiqnjogLTEwNzMsXG4gICAg6K2wOiAxMjE5LFxuICAgIOmBuDogLTEwMTgsXG4gICAg6YOOOiAtMzY4LFxuICAgIOmVtzogNzg2LFxuICAgIOmWkzogMTE5MSxcbiAgICDpoYw6IDIzNjgsXG4gICAg6aSoOiAtNjg5LFxuICAgIFwi77yRXCI6IC01MTQsXG4gICAg77yl77ySOiAtMzI3NjgsXG4gICAgXCLvvaJcIjogMzYzLFxuICAgIO+9sjogMjQxLFxuICAgIO++mTogNDUxLFxuICAgIO++nTogLTM0MyxcbiAgfTtcbiAgdGhpcy5VVzZfXyA9IHtcbiAgICBcIixcIjogMjI3LFxuICAgIFwiLlwiOiA4MDgsXG4gICAgMTogLTI3MCxcbiAgICBFMTogMzA2LFxuICAgIFwi44CBXCI6IDIyNyxcbiAgICBcIuOAglwiOiA4MDgsXG4gICAg44GCOiAtMzA3LFxuICAgIOOBhjogMTg5LFxuICAgIOOBizogMjQxLFxuICAgIOOBjDogLTczLFxuICAgIOOBjzogLTEyMSxcbiAgICDjgZM6IC0yMDAsXG4gICAg44GYOiAxNzgyLFxuICAgIOOBmTogMzgzLFxuICAgIOOBnzogLTQyOCxcbiAgICDjgaM6IDU3MyxcbiAgICDjgaY6IC0xMDE0LFxuICAgIOOBpzogMTAxLFxuICAgIOOBqDogLTEwNSxcbiAgICDjgao6IC0yNTMsXG4gICAg44GrOiAtMTQ5LFxuICAgIOOBrjogLTQxNyxcbiAgICDjga86IC0yMzYsXG4gICAg44KCOiAtMjA2LFxuICAgIOOCijogMTg3LFxuICAgIOOCizogLTEzNSxcbiAgICDjgpI6IDE5NSxcbiAgICDjg6s6IC02NzMsXG4gICAg44OzOiAtNDk2LFxuICAgIOS4gDogLTI3NyxcbiAgICDkuK06IDIwMSxcbiAgICDku7Y6IC04MDAsXG4gICAg5LyaOiA2MjQsXG4gICAg5YmNOiAzMDIsXG4gICAg5Yy6OiAxNzkyLFxuICAgIOWToTogLTEyMTIsXG4gICAg5aeUOiA3OTgsXG4gICAg5a2mOiAtOTYwLFxuICAgIOW4gjogODg3LFxuICAgIOW6gzogLTY5NSxcbiAgICDlvow6IDUzNSxcbiAgICDmpa06IC02OTcsXG4gICAg55u4OiA3NTMsXG4gICAg56S+OiAtNTA3LFxuICAgIOemjzogOTc0LFxuICAgIOepujogLTgyMixcbiAgICDogIU6IDE4MTEsXG4gICAg6YCjOiA0NjMsXG4gICAg6YOOOiAxMDgyLFxuICAgIFwi77yRXCI6IC0yNzAsXG4gICAg77yl77yROiAzMDYsXG4gICAg776ZOiAtNjczLFxuICAgIO++nTogLTQ5NixcbiAgfTtcblxuICByZXR1cm4gdGhpcztcbn1cblxuVGlueVNlZ21lbnRlci5wcm90b3R5cGUuY3R5cGVfID0gZnVuY3Rpb24gKHN0cikge1xuICBmb3IgKHZhciBpIGluIHRoaXMuY2hhcnR5cGVfKSB7XG4gICAgaWYgKHN0ci5tYXRjaCh0aGlzLmNoYXJ0eXBlX1tpXVswXSkpIHtcbiAgICAgIHJldHVybiB0aGlzLmNoYXJ0eXBlX1tpXVsxXTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIFwiT1wiO1xufTtcblxuVGlueVNlZ21lbnRlci5wcm90b3R5cGUudHNfID0gZnVuY3Rpb24gKHYpIHtcbiAgaWYgKHYpIHtcbiAgICByZXR1cm4gdjtcbiAgfVxuICByZXR1cm4gMDtcbn07XG5cblRpbnlTZWdtZW50ZXIucHJvdG90eXBlLnNlZ21lbnQgPSBmdW5jdGlvbiAoaW5wdXQpIHtcbiAgaWYgKGlucHV0ID09IG51bGwgfHwgaW5wdXQgPT0gdW5kZWZpbmVkIHx8IGlucHV0ID09IFwiXCIpIHtcbiAgICByZXR1cm4gW107XG4gIH1cbiAgdmFyIHJlc3VsdCA9IFtdO1xuICB2YXIgc2VnID0gW1wiQjNcIiwgXCJCMlwiLCBcIkIxXCJdO1xuICB2YXIgY3R5cGUgPSBbXCJPXCIsIFwiT1wiLCBcIk9cIl07XG4gIHZhciBvID0gaW5wdXQuc3BsaXQoXCJcIik7XG4gIGZvciAoaSA9IDA7IGkgPCBvLmxlbmd0aDsgKytpKSB7XG4gICAgc2VnLnB1c2gob1tpXSk7XG4gICAgY3R5cGUucHVzaCh0aGlzLmN0eXBlXyhvW2ldKSk7XG4gIH1cbiAgc2VnLnB1c2goXCJFMVwiKTtcbiAgc2VnLnB1c2goXCJFMlwiKTtcbiAgc2VnLnB1c2goXCJFM1wiKTtcbiAgY3R5cGUucHVzaChcIk9cIik7XG4gIGN0eXBlLnB1c2goXCJPXCIpO1xuICBjdHlwZS5wdXNoKFwiT1wiKTtcbiAgdmFyIHdvcmQgPSBzZWdbM107XG4gIHZhciBwMSA9IFwiVVwiO1xuICB2YXIgcDIgPSBcIlVcIjtcbiAgdmFyIHAzID0gXCJVXCI7XG4gIGZvciAodmFyIGkgPSA0OyBpIDwgc2VnLmxlbmd0aCAtIDM7ICsraSkge1xuICAgIHZhciBzY29yZSA9IHRoaXMuQklBU19fO1xuICAgIHZhciB3MSA9IHNlZ1tpIC0gM107XG4gICAgdmFyIHcyID0gc2VnW2kgLSAyXTtcbiAgICB2YXIgdzMgPSBzZWdbaSAtIDFdO1xuICAgIHZhciB3NCA9IHNlZ1tpXTtcbiAgICB2YXIgdzUgPSBzZWdbaSArIDFdO1xuICAgIHZhciB3NiA9IHNlZ1tpICsgMl07XG4gICAgdmFyIGMxID0gY3R5cGVbaSAtIDNdO1xuICAgIHZhciBjMiA9IGN0eXBlW2kgLSAyXTtcbiAgICB2YXIgYzMgPSBjdHlwZVtpIC0gMV07XG4gICAgdmFyIGM0ID0gY3R5cGVbaV07XG4gICAgdmFyIGM1ID0gY3R5cGVbaSArIDFdO1xuICAgIHZhciBjNiA9IGN0eXBlW2kgKyAyXTtcbiAgICBzY29yZSArPSB0aGlzLnRzXyh0aGlzLlVQMV9fW3AxXSk7XG4gICAgc2NvcmUgKz0gdGhpcy50c18odGhpcy5VUDJfX1twMl0pO1xuICAgIHNjb3JlICs9IHRoaXMudHNfKHRoaXMuVVAzX19bcDNdKTtcbiAgICBzY29yZSArPSB0aGlzLnRzXyh0aGlzLkJQMV9fW3AxICsgcDJdKTtcbiAgICBzY29yZSArPSB0aGlzLnRzXyh0aGlzLkJQMl9fW3AyICsgcDNdKTtcbiAgICBzY29yZSArPSB0aGlzLnRzXyh0aGlzLlVXMV9fW3cxXSk7XG4gICAgc2NvcmUgKz0gdGhpcy50c18odGhpcy5VVzJfX1t3Ml0pO1xuICAgIHNjb3JlICs9IHRoaXMudHNfKHRoaXMuVVczX19bdzNdKTtcbiAgICBzY29yZSArPSB0aGlzLnRzXyh0aGlzLlVXNF9fW3c0XSk7XG4gICAgc2NvcmUgKz0gdGhpcy50c18odGhpcy5VVzVfX1t3NV0pO1xuICAgIHNjb3JlICs9IHRoaXMudHNfKHRoaXMuVVc2X19bdzZdKTtcbiAgICBzY29yZSArPSB0aGlzLnRzXyh0aGlzLkJXMV9fW3cyICsgdzNdKTtcbiAgICBzY29yZSArPSB0aGlzLnRzXyh0aGlzLkJXMl9fW3czICsgdzRdKTtcbiAgICBzY29yZSArPSB0aGlzLnRzXyh0aGlzLkJXM19fW3c0ICsgdzVdKTtcbiAgICBzY29yZSArPSB0aGlzLnRzXyh0aGlzLlRXMV9fW3cxICsgdzIgKyB3M10pO1xuICAgIHNjb3JlICs9IHRoaXMudHNfKHRoaXMuVFcyX19bdzIgKyB3MyArIHc0XSk7XG4gICAgc2NvcmUgKz0gdGhpcy50c18odGhpcy5UVzNfX1t3MyArIHc0ICsgdzVdKTtcbiAgICBzY29yZSArPSB0aGlzLnRzXyh0aGlzLlRXNF9fW3c0ICsgdzUgKyB3Nl0pO1xuICAgIHNjb3JlICs9IHRoaXMudHNfKHRoaXMuVUMxX19bYzFdKTtcbiAgICBzY29yZSArPSB0aGlzLnRzXyh0aGlzLlVDMl9fW2MyXSk7XG4gICAgc2NvcmUgKz0gdGhpcy50c18odGhpcy5VQzNfX1tjM10pO1xuICAgIHNjb3JlICs9IHRoaXMudHNfKHRoaXMuVUM0X19bYzRdKTtcbiAgICBzY29yZSArPSB0aGlzLnRzXyh0aGlzLlVDNV9fW2M1XSk7XG4gICAgc2NvcmUgKz0gdGhpcy50c18odGhpcy5VQzZfX1tjNl0pO1xuICAgIHNjb3JlICs9IHRoaXMudHNfKHRoaXMuQkMxX19bYzIgKyBjM10pO1xuICAgIHNjb3JlICs9IHRoaXMudHNfKHRoaXMuQkMyX19bYzMgKyBjNF0pO1xuICAgIHNjb3JlICs9IHRoaXMudHNfKHRoaXMuQkMzX19bYzQgKyBjNV0pO1xuICAgIHNjb3JlICs9IHRoaXMudHNfKHRoaXMuVEMxX19bYzEgKyBjMiArIGMzXSk7XG4gICAgc2NvcmUgKz0gdGhpcy50c18odGhpcy5UQzJfX1tjMiArIGMzICsgYzRdKTtcbiAgICBzY29yZSArPSB0aGlzLnRzXyh0aGlzLlRDM19fW2MzICsgYzQgKyBjNV0pO1xuICAgIHNjb3JlICs9IHRoaXMudHNfKHRoaXMuVEM0X19bYzQgKyBjNSArIGM2XSk7XG4gICAgLy8gIHNjb3JlICs9IHRoaXMudHNfKHRoaXMuVEM1X19bYzQgKyBjNSArIGM2XSk7XG4gICAgc2NvcmUgKz0gdGhpcy50c18odGhpcy5VUTFfX1twMSArIGMxXSk7XG4gICAgc2NvcmUgKz0gdGhpcy50c18odGhpcy5VUTJfX1twMiArIGMyXSk7XG4gICAgc2NvcmUgKz0gdGhpcy50c18odGhpcy5VUTNfX1twMyArIGMzXSk7XG4gICAgc2NvcmUgKz0gdGhpcy50c18odGhpcy5CUTFfX1twMiArIGMyICsgYzNdKTtcbiAgICBzY29yZSArPSB0aGlzLnRzXyh0aGlzLkJRMl9fW3AyICsgYzMgKyBjNF0pO1xuICAgIHNjb3JlICs9IHRoaXMudHNfKHRoaXMuQlEzX19bcDMgKyBjMiArIGMzXSk7XG4gICAgc2NvcmUgKz0gdGhpcy50c18odGhpcy5CUTRfX1twMyArIGMzICsgYzRdKTtcbiAgICBzY29yZSArPSB0aGlzLnRzXyh0aGlzLlRRMV9fW3AyICsgYzEgKyBjMiArIGMzXSk7XG4gICAgc2NvcmUgKz0gdGhpcy50c18odGhpcy5UUTJfX1twMiArIGMyICsgYzMgKyBjNF0pO1xuICAgIHNjb3JlICs9IHRoaXMudHNfKHRoaXMuVFEzX19bcDMgKyBjMSArIGMyICsgYzNdKTtcbiAgICBzY29yZSArPSB0aGlzLnRzXyh0aGlzLlRRNF9fW3AzICsgYzIgKyBjMyArIGM0XSk7XG4gICAgdmFyIHAgPSBcIk9cIjtcbiAgICBpZiAoc2NvcmUgPiAwKSB7XG4gICAgICByZXN1bHQucHVzaCh3b3JkKTtcbiAgICAgIHdvcmQgPSBcIlwiO1xuICAgICAgcCA9IFwiQlwiO1xuICAgIH1cbiAgICBwMSA9IHAyO1xuICAgIHAyID0gcDM7XG4gICAgcDMgPSBwO1xuICAgIHdvcmQgKz0gc2VnW2ldO1xuICB9XG4gIHJlc3VsdC5wdXNoKHdvcmQpO1xuXG4gIHJldHVybiByZXN1bHQ7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBUaW55U2VnbWVudGVyO1xuIiwiaW1wb3J0IFRpbnlTZWdtZW50ZXIgZnJvbSBcIi4vdGlueS1zZWdtZW50ZXJcIjtcbmltcG9ydCBDb2RlTWlycm9yIGZyb20gXCJjb2RlbWlycm9yXCI7XG4vLyBAdHMtaWdub3JlXG5jb25zdCBzZWdtZW50ZXIgPSBuZXcgVGlueVNlZ21lbnRlcigpO1xuXG5leHBvcnQgdHlwZSBUb2tlbml6ZVN0cmF0ZWd5ID0gXCJkZWZhdWx0XCIgfCBcImphcGFuZXNlXCIgfCBcImFyYWJpY1wiO1xuXG5jb25zdCBUUklNX0NIQVJfUEFUVEVSTiA9IC9bXFxbXFxdKCk8PlwiJy4sfDsgYF0vZztcbmNvbnN0IEFSQUJJQ19UUklNX0NIQVJfUEFUVEVSTiA9IC9bXFxbXFxdKCk8PlwiJy4sfDsgYNiM2JtdL2c7XG5cbmZ1bmN0aW9uIHBpY2tUb2tlbnMoXG4gIGNtRWRpdG9yOiBDb2RlTWlycm9yLkVkaXRvcixcbiAgdHJpbVBhdHRlcm46IFJlZ0V4cFxuKTogc3RyaW5nW10ge1xuICBjb25zdCBtYXhMaW5lSW5kZXggPSBjbUVkaXRvci5nZXREb2MoKS5saW5lQ291bnQoKTtcbiAgcmV0dXJuIFsuLi5BcnJheShtYXhMaW5lSW5kZXgpLmtleXMoKV1cbiAgICAuZmxhdE1hcCgoeCkgPT5cbiAgICAgIGNtRWRpdG9yXG4gICAgICAgIC5nZXRMaW5lVG9rZW5zKHgpXG4gICAgICAgIC5mbGF0TWFwKCh4KSA9PlxuICAgICAgICAgIHgudHlwZT8uaW5jbHVkZXMoXCJobWQtY29kZWJsb2NrXCIpID8geC5zdHJpbmcuc3BsaXQoXCIgXCIpIDogW3guc3RyaW5nXVxuICAgICAgICApXG4gICAgKVxuICAgIC5tYXAoKHgpID0+IHgucmVwbGFjZSh0cmltUGF0dGVybiwgXCJcIikpXG4gICAgLmZpbHRlcigoeCkgPT4geCAhPT0gXCJcIik7XG59XG5cbmZ1bmN0aW9uIHBpY2tUb2tlbnNBc0phcGFuZXNlKGNtRWRpdG9yOiBDb2RlTWlycm9yLkVkaXRvcik6IHN0cmluZ1tdIHtcbiAgcmV0dXJuIGNtRWRpdG9yXG4gICAgLmdldFZhbHVlKClcbiAgICAuc3BsaXQoYFxcbmApXG4gICAgLmZsYXRNYXA8c3RyaW5nPigoeCkgPT4gc2VnbWVudGVyLnNlZ21lbnQoeCkpXG4gICAgLm1hcCgoeCkgPT4geC5yZXBsYWNlKFRSSU1fQ0hBUl9QQVRURVJOLCBcIlwiKSk7XG59XG5cbmludGVyZmFjZSBUb2tlbml6ZWRSZXN1bHQge1xuICBjdXJyZW50VG9rZW46IHN0cmluZztcbiAgY3VycmVudFRva2VuU3RhcnQ6IG51bWJlcjtcbiAgdG9rZW5zOiBzdHJpbmdbXTtcbn1cblxuaW50ZXJmYWNlIFRva2VuaXplciB7XG4gIC8qKlxuICAgKiBSZXR1cm4gdW5kZWZpbmVkIGlmIGN1cnJlbnQgdG9rZW4gaXMgZW1wdHkuXG4gICAqL1xuICB0b2tlbml6ZSgpOiBUb2tlbml6ZWRSZXN1bHQgfCB1bmRlZmluZWQ7XG59XG5cbmNsYXNzIERlZmF1bHRUb2tlbml6ZXIgaW1wbGVtZW50cyBUb2tlbml6ZXIge1xuICBwcml2YXRlIHJlYWRvbmx5IGNtRWRpdG9yOiBDb2RlTWlycm9yLkVkaXRvcjtcbiAgcHJvdGVjdGVkIHJlYWRvbmx5IHRyaW1QYXR0ZXJuOiBSZWdFeHAgPSBUUklNX0NIQVJfUEFUVEVSTjtcblxuICBjb25zdHJ1Y3RvcihjbUVkaXRvcjogQ29kZU1pcnJvci5FZGl0b3IpIHtcbiAgICB0aGlzLmNtRWRpdG9yID0gY21FZGl0b3I7XG4gIH1cblxuICB0b2tlbml6ZSgpOiBUb2tlbml6ZWRSZXN1bHQgfCB1bmRlZmluZWQge1xuICAgIGNvbnN0IGN1cnNvciA9IHRoaXMuY21FZGl0b3IuZ2V0Q3Vyc29yKCk7XG4gICAgY29uc3QgdG9rZW4gPSB0aGlzLmNtRWRpdG9yLmdldFRva2VuQXQoY3Vyc29yKTtcbiAgICBpZiAoIXRva2VuLnN0cmluZykge1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgY3VycmVudFRva2VuOiB0b2tlbi5zdHJpbmcsXG4gICAgICBjdXJyZW50VG9rZW5TdGFydDogdG9rZW4uc3RhcnQsXG4gICAgICB0b2tlbnM6IHBpY2tUb2tlbnModGhpcy5jbUVkaXRvciwgdGhpcy50cmltUGF0dGVybiksXG4gICAgfTtcbiAgfVxufVxuXG5jbGFzcyBBcmFiaWNUb2tlbml6ZXIgZXh0ZW5kcyBEZWZhdWx0VG9rZW5pemVyIHtcbiAgcHJvdGVjdGVkIHRyaW1QYXR0ZXJuOiBSZWdFeHAgPSBBUkFCSUNfVFJJTV9DSEFSX1BBVFRFUk47XG59XG5cbi8qKlxuICogSmFwYW5lc2UgbmVlZHMgb3JpZ2luYWwgbG9naWMuXG4gKi9cbmNsYXNzIEphcGFuZXNlVG9rZW5pemVyIGltcGxlbWVudHMgVG9rZW5pemVyIHtcbiAgcHJpdmF0ZSByZWFkb25seSBjbUVkaXRvcjogQ29kZU1pcnJvci5FZGl0b3I7XG5cbiAgY29uc3RydWN0b3IoY21FZGl0b3I6IENvZGVNaXJyb3IuRWRpdG9yKSB7XG4gICAgdGhpcy5jbUVkaXRvciA9IGNtRWRpdG9yO1xuICB9XG5cbiAgdG9rZW5pemUoKTogVG9rZW5pemVkUmVzdWx0IHwgdW5kZWZpbmVkIHtcbiAgICBjb25zdCBjdXJzb3IgPSB0aGlzLmNtRWRpdG9yLmdldEN1cnNvcigpO1xuICAgIGNvbnN0IHRva2VuID0gdGhpcy5jbUVkaXRvci5nZXRUb2tlbkF0KGN1cnNvcik7XG4gICAgaWYgKCF0b2tlbi5zdHJpbmcpIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgY29uc3Qgd29yZHMgPSBzZWdtZW50ZXIuc2VnbWVudCh0b2tlbi5zdHJpbmcpO1xuICAgIGNvbnN0IGN1cnJlbnRUb2tlbiA9IHdvcmRzLnBvcCgpO1xuICAgIGNvbnN0IGN1cnJlbnRUb2tlblN0YXJ0ID1cbiAgICAgIHRva2VuLnN0YXJ0ICsgd29yZHMucmVkdWNlKCh0OiBudW1iZXIsIHg6IHN0cmluZykgPT4gdCArIHgubGVuZ3RoLCAwKTtcbiAgICBjb25zdCB0b2tlbnMgPSBwaWNrVG9rZW5zQXNKYXBhbmVzZSh0aGlzLmNtRWRpdG9yKTtcblxuICAgIHJldHVybiB7XG4gICAgICBjdXJyZW50VG9rZW4sXG4gICAgICBjdXJyZW50VG9rZW5TdGFydCxcbiAgICAgIHRva2VucyxcbiAgICB9O1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVUb2tlbml6ZXIoXG4gIGNtRWRpdG9yOiBDb2RlTWlycm9yLkVkaXRvcixcbiAgc3RyYXRlZ3k6IFRva2VuaXplU3RyYXRlZ3lcbik6IFRva2VuaXplciB7XG4gIHN3aXRjaCAoc3RyYXRlZ3kpIHtcbiAgICBjYXNlIFwiZGVmYXVsdFwiOlxuICAgICAgcmV0dXJuIG5ldyBEZWZhdWx0VG9rZW5pemVyKGNtRWRpdG9yKTtcbiAgICBjYXNlIFwiYXJhYmljXCI6XG4gICAgICByZXR1cm4gbmV3IEFyYWJpY1Rva2VuaXplcihjbUVkaXRvcik7XG4gICAgY2FzZSBcImphcGFuZXNlXCI6XG4gICAgICByZXR1cm4gbmV3IEphcGFuZXNlVG9rZW5pemVyKGNtRWRpdG9yKTtcbiAgICBkZWZhdWx0OlxuICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbmV4cGVjdGVkIHN0cmF0ZWd5IG5hbWU6ICR7c3RyYXRlZ3l9YCk7XG4gIH1cbn1cbiIsImltcG9ydCB7IE1hcmtkb3duVmlldywgUGx1Z2luIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgeyBFZGl0b3IgfSBmcm9tIFwiY29kZW1pcnJvclwiO1xuaW1wb3J0IFwiLi9zaG93LWhpbnRcIjtcbmltcG9ydCB7IGNyZWF0ZVRva2VuaXplciwgVG9rZW5pemVTdHJhdGVneSB9IGZyb20gXCIuL3Rva2VuaXplclwiO1xuXG52YXIgQ29kZU1pcnJvcjogYW55ID0gd2luZG93LkNvZGVNaXJyb3I7XG5cbi8qKlxuICogVGhpcyBmdW5jdGlvbiB1c2VzIGNhc2Utc2Vuc2l0aXZlIGxvZ2ljIGlmIGEgc2Vjb25kIGFyZ3VtZW50IGhhcyBhbiB1cHBlciBjYXNlLiBPdGhlcndpc2UsIHVzZXMgY2FzZS1pbnNlbnNpdGl2ZSBsb2dpYy5cbiAqL1xuY29uc3QgY2FzZUluY2x1ZGVzID0gKG9uZTogc3RyaW5nLCBvdGhlcjogc3RyaW5nKTogYm9vbGVhbiA9PiB7XG4gIGNvbnN0IGxvd2VyT3RoZXIgPSBvdGhlci50b0xvd2VyQ2FzZSgpO1xuICByZXR1cm4gbG93ZXJPdGhlciA9PT0gb3RoZXJcbiAgICA/IG9uZS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKGxvd2VyT3RoZXIpXG4gICAgOiBvbmUuaW5jbHVkZXMob3RoZXIpO1xufTtcblxuY29uc3QgbG93ZXJTdGFydHNXaXRoID0gKGE6IHN0cmluZywgYjogc3RyaW5nKTogYm9vbGVhbiA9PlxuICBhLnRvTG93ZXJDYXNlKCkuc3RhcnRzV2l0aChiLnRvTG93ZXJDYXNlKCkpO1xuXG5mdW5jdGlvbiBzZWxlY3RTdWdnZXN0ZWRUb2tlbnModG9rZW5zOiBzdHJpbmdbXSwgd29yZDogc3RyaW5nKSB7XG4gIHJldHVybiBBcnJheS5mcm9tKG5ldyBTZXQodG9rZW5zKSlcbiAgICAuZmlsdGVyKCh4KSA9PiB4ICE9PSB3b3JkKVxuICAgIC5maWx0ZXIoKHgpID0+IGNhc2VJbmNsdWRlcyh4LCB3b3JkKSlcbiAgICAuc29ydCgoYSwgYikgPT4gYS5sZW5ndGggLSBiLmxlbmd0aClcbiAgICAuc29ydChcbiAgICAgIChhLCBiKSA9PlxuICAgICAgICBOdW1iZXIobG93ZXJTdGFydHNXaXRoKGIsIHdvcmQpKSAtIE51bWJlcihsb3dlclN0YXJ0c1dpdGgoYSwgd29yZCkpXG4gICAgKVxuICAgIC5zbGljZSgwLCA1KTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgVmFyaW91c0NvbXBvbmVudHNQbHVnaW4gZXh0ZW5kcyBQbHVnaW4ge1xuICBwcml2YXRlIGV4ZWNBdXRvQ29tcGxldGUoc3RyYXRlZ3k6IFRva2VuaXplU3RyYXRlZ3kpIHtcbiAgICBjb25zdCBjdXJyZW50VmlldyA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVWaWV3T2ZUeXBlKE1hcmtkb3duVmlldyk7XG4gICAgaWYgKCFjdXJyZW50Vmlldykge1xuICAgICAgLy8gRG8gbm90aGluZyBpZiB0aGUgY29tbWFuZCBpcyB0cmlnZ2VyZWQgb3V0c2lkZSBhIE1hcmtkb3duVmlld1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGNtRWRpdG9yOiBFZGl0b3IgPSBjdXJyZW50Vmlldy5zb3VyY2VNb2RlLmNtRWRpdG9yO1xuXG4gICAgQ29kZU1pcnJvci5zaG93SGludChcbiAgICAgIGNtRWRpdG9yLFxuICAgICAgKCkgPT4ge1xuICAgICAgICBjb25zdCB0b2tlbml6ZWQgPSBjcmVhdGVUb2tlbml6ZXIoY21FZGl0b3IsIHN0cmF0ZWd5KS50b2tlbml6ZSgpO1xuICAgICAgICBpZiAoIXRva2VuaXplZCkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHN1Z2dlc3RlZFRva2VucyA9IHNlbGVjdFN1Z2dlc3RlZFRva2VucyhcbiAgICAgICAgICB0b2tlbml6ZWQudG9rZW5zLFxuICAgICAgICAgIHRva2VuaXplZC5jdXJyZW50VG9rZW5cbiAgICAgICAgKTtcbiAgICAgICAgaWYgKHN1Z2dlc3RlZFRva2Vucy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBjdXJzb3IgPSBjbUVkaXRvci5nZXRDdXJzb3IoKTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBsaXN0OiBzdWdnZXN0ZWRUb2tlbnMsXG4gICAgICAgICAgZnJvbTogQ29kZU1pcnJvci5Qb3MoY3Vyc29yLmxpbmUsIHRva2VuaXplZC5jdXJyZW50VG9rZW5TdGFydCksXG4gICAgICAgICAgdG86IENvZGVNaXJyb3IuUG9zKGN1cnNvci5saW5lLCBjdXJzb3IuY2gpLFxuICAgICAgICB9O1xuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgY29tcGxldGVTaW5nbGU6IHRydWUsXG4gICAgICB9XG4gICAgKTtcbiAgfVxuXG4gIGFzeW5jIG9ubG9hZCgpIHtcbiAgICB0aGlzLmFkZENvbW1hbmQoe1xuICAgICAgaWQ6IFwiYXV0by1jb21wbGV0ZVwiLFxuICAgICAgbmFtZTogXCJBdXRvIENvbXBsZXRlXCIsXG4gICAgICBob3RrZXlzOiBbeyBtb2RpZmllcnM6IFtcIkN0cmxcIl0sIGtleTogXCIgXCIgfV0sXG4gICAgICBjaGVja0NhbGxiYWNrOiAoY2hlY2tpbmc6IGJvb2xlYW4pID0+IHtcbiAgICAgICAgaWYgKGNoZWNraW5nKSB7XG4gICAgICAgICAgcmV0dXJuICEhdGhpcy5hcHAud29ya3NwYWNlLmdldEFjdGl2ZVZpZXdPZlR5cGUoTWFya2Rvd25WaWV3KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuZXhlY0F1dG9Db21wbGV0ZShcImRlZmF1bHRcIik7XG4gICAgICB9LFxuICAgIH0pO1xuICAgIHRoaXMuYWRkQ29tbWFuZCh7XG4gICAgICBpZDogXCJhdXRvLWNvbXBsZXRlLWFzLWFyYWJpY1wiLFxuICAgICAgbmFtZTogXCJBdXRvIENvbXBsZXRlIGFzIEFyYWJpY1wiLFxuICAgICAgY2hlY2tDYWxsYmFjazogKGNoZWNraW5nOiBib29sZWFuKSA9PiB7XG4gICAgICAgIGlmIChjaGVja2luZykge1xuICAgICAgICAgIHJldHVybiAhIXRoaXMuYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVWaWV3T2ZUeXBlKE1hcmtkb3duVmlldyk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmV4ZWNBdXRvQ29tcGxldGUoXCJhcmFiaWNcIik7XG4gICAgICB9LFxuICAgIH0pO1xuICAgIHRoaXMuYWRkQ29tbWFuZCh7XG4gICAgICBpZDogXCJhdXRvLWNvbXBsZXRlLWFzLWphcGFuZXNlXCIsXG4gICAgICBuYW1lOiBcIkF1dG8gQ29tcGxldGUgYXMgSmFwYW5lc2VcIixcbiAgICAgIGNoZWNrQ2FsbGJhY2s6IChjaGVja2luZzogYm9vbGVhbikgPT4ge1xuICAgICAgICBpZiAoY2hlY2tpbmcpIHtcbiAgICAgICAgICByZXR1cm4gISF0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlVmlld09mVHlwZShNYXJrZG93blZpZXcpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5leGVjQXV0b0NvbXBsZXRlKFwiamFwYW5lc2VcIik7XG4gICAgICB9LFxuICAgIH0pO1xuICB9XG59XG4iXSwibmFtZXMiOlsiQ29kZU1pcnJvciIsIlBsdWdpbiIsIk1hcmtkb3duVmlldyJdLCJtYXBwaW5ncyI6Ijs7OztBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUF1REE7QUFDTyxTQUFTLFNBQVMsQ0FBQyxPQUFPLEVBQUUsVUFBVSxFQUFFLENBQUMsRUFBRSxTQUFTLEVBQUU7QUFDN0QsSUFBSSxTQUFTLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxPQUFPLEtBQUssWUFBWSxDQUFDLEdBQUcsS0FBSyxHQUFHLElBQUksQ0FBQyxDQUFDLFVBQVUsT0FBTyxFQUFFLEVBQUUsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUU7QUFDaEgsSUFBSSxPQUFPLEtBQUssQ0FBQyxLQUFLLENBQUMsR0FBRyxPQUFPLENBQUMsRUFBRSxVQUFVLE9BQU8sRUFBRSxNQUFNLEVBQUU7QUFDL0QsUUFBUSxTQUFTLFNBQVMsQ0FBQyxLQUFLLEVBQUUsRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLEVBQUUsRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFO0FBQ25HLFFBQVEsU0FBUyxRQUFRLENBQUMsS0FBSyxFQUFFLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFD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QUMsSUFBSTtRQUNULEVBQUUsRUFBRSxJQUFJO1FBQ1IsRUFBRSxFQUFFLElBQUk7UUFDUixFQUFFLEVBQUUsSUFBSTtRQUNSLEVBQUUsRUFBRSxDQUFDLElBQUk7UUFDVCxFQUFFLEVBQUUsQ0FBQyxJQUFJO1FBQ1QsRUFBRSxFQUFFLElBQUk7UUFDUixFQUFFLEVBQUUsQ0FBQyxJQUFJO0tBQ1YsQ0FBQztJQUNGLElBQUksQ0FBQyxLQUFLLEdBQUc7UUFDWCxFQUFFLEVBQUUsR0FBRztRQUNQLEVBQUUsRUFBRSxHQUFHO1FBQ1AsRUFBRSxFQUFFLENBQUMsR0FBRztRQUNSLEVBQUUsRUFBRSxDQUFDLElBQUk7UUFDVCxFQUFFLEVBQUUsQ0FBQyxHQUFHO1FBQ1IsRUFBRSxFQUFFLENBQUMsR0FBRztRQUNSLEVBQUUsRUFBRSxJQUFJO1FBQ1IsRUFBRSxFQUFFLElBQUk7UUFDUixFQUFFLEVBQUUsSUFBSTtRQUNSLEVBQUUsRUFBRSxDQUFDLElBQUk7UUFDVCxFQUFFLEVBQUUsR0FBRztLQUNSLENBQUM7SUFDRixJQUFJLENBQUMsS0FBSyxHQUFHLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLEVBQUUsRUFBRSxDQUFDLEdBQUcsRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLENBQUM7SUFDckQsSUFBSSxDQUFDLEtBQUssR0FBRyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsSUFBSSxFQUFFLENBQUM7SUFDbkMsSUFBSSxDQUFDLEtBQUssR0FBRztRQUNYLEdBQUcsRUFBRSxJQUFJO1FBQ1QsR0FBRyxFQUFFLElBQUk7UUFDVCxHQUFHLEVBQUUsQ0FBQyxJQUFJO1FBQ1YsR0FBRyxFQUFFLEdBQUc7UUFDUixHQUFHLEVBQUUsSUFBSTtRQUNULEdBQUcsRUFBRSxHQUFHO1FBQ1IsR0FBRyxFQUFFLENBQUMsRUFBRTtRQUNSLEdBQUcsRUFBRSxDQUFDLElBQUk7UUFDVixHQUFHLEVBQUUsR0FBRztRQUNSLEdBQUcsRUFBRSxDQUFDLEdBQUc7UUFDVCxHQUFHLEVBQUUsSUFBSTtRQUNULEdBQUcsRUFBRSxDQUFDLElBQUk7UUFDVixHQUFHLEVBQUUsR0FBRztRQUNSLEdBQUcsRUFBRSxJQUFJO0tBQ1YsQ0FBQztJQUNGLElBQUksQ0FBQyxLQUFLLEdBQUc7UUFDWCxHQUFHLEVBQUUsR0FBRztRQUNSLEdBQUcsRUFBRSxDQUFDLElBQUk7UUFDVixHQUFHLEVBQUUsR0FBRztRQUNSLEdBQUcsRUFBRSxDQUFDLEdBQUc7UUFDVCxHQUFHLEVBQUUsQ0FBQyxJQUFJO1FBQ1YsR0FBRyxFQUFFLEdBQUc7UUFDUixHQUFHLEVBQUUsQ0FBQyxJQUFJO1FBQ1YsR0FBRyxFQUFFLENBQUMsR0FBRztRQUNULEdBQUcsRUFBRSxHQUFHO1FBQ1IsR0FBRyxFQUFFLENBQUMsSUFBSTtLQUNYLENBQUM7SUFDRixJQUFJLENBQUMsS0FBSyxHQUFHO1FBQ1gsR0FBRyxFQUFFLENBQUMsR0FBRztRQUNULEdBQUcsRUFBRSxJQUFJO1FBQ1QsR0FBRyxFQUFFLENBQUMsR0FBRztRQUNULEdBQUcsRUFBRSxHQUFHO1FBQ1IsR0FBRyxFQUFFLEdBQUc7UUFDUixHQUFHLEVBQUUsSUFBSTtRQUNULEdBQUcsRUFBRSxHQUFHO1FBQ1IsR0FBRyxFQUFFLEdBQUc7UUFDUixHQUFHLEVBQUUsSUFBSTtRQUNULEdBQUcsRUFBRSxHQUFHO1FBQ1IsR0FBRyxFQUFFLEdBQUc7UUFDUixHQUFHLEVBQUUsSUFBSTtRQUNULEdBQUcsRUFBRSxDQUFDLEdBQUc7UUFDVCxHQUFHLEVBQUUsQ0FBQyxJQUFJO1FBQ1YsR0FBRyxFQUFFLENBQUMsSUFBSTtRQUNWLEdBQUcsRUFBRSxLQUFLO0tBQ1gsQ0FBQztJQUNGLElBQUksQ0FBQyxLQUFLLEdBQUc7UUFDWCxHQUFHLEVBQUUsQ0FBQyxJQUFJO1FBQ1YsR0FBRyxFQUFFLElBQUk7UUFDVCxHQUFHLEVBQUUsQ0FBQyxJQUFJO1FBQ1YsR0FBRyxFQUFFLElBQUk7UUFDVCxHQUFHLEVBQUUsQ0FBQyxJQUFJO1FBQ1YsR0FBRyxFQUFFLENBQUMsSUFBSTtRQUNWLEdBQUcsRUFBRSxDQUFDLEtBQUs7UUFDWCxHQUFHLEVBQUUsR0FBRztRQUNSLEdBQUcsRUFBRSxHQUFHO1FBQ1IsR0FBRyxFQUFFLENBQUMsSUFBSTtRQUNWLEdBQUcsRUFBRSxDQUFDLEdBQUc7S0FDVixDQUFDO0lBQ0YsSUFBSSxDQUFDLEtBQUssR0FBRztRQUNYLElBQUksRUFBRSxHQUFHO1FBQ1QsSUFBSSxFQUFFLEdBQUc7UUFDVCxHQUFHLEVBQUUsSUFBSTtRQUNULEdBQUcsRUFBRSxHQUFHO1FBQ1IsSUFBSSxFQUFFLEdBQUc7UUFDVCxJQUFJLEVBQUUsR0FBRztRQUNULElBQUksRUFBRSxJQUFJO1FBQ1YsRUFBRSxFQUFFLElBQUk7UUFDUixFQUFFLEVBQUUsSUFBSTtRQUNSLEVBQUUsRUFBRSxDQUFDLElBQUk7UUFDVCxFQUFFLEVBQUUsR0FBRztRQUNQLEVBQUUsRUFBRSxDQUFDLElBQUk7UUFDVCxFQUFFLEVBQUUsR0FBRztRQUNQLEVBQUUsRUFBRSxJQUFJO1FBQ1IsRUFBRSxFQUFFLEdBQUc7UUFDUCxFQUFFLEVBQUUsQ0FBQyxHQUFHO1FBQ1IsRUFBRSxFQUFFLElBQUk7UUFDUixFQUFFLEVBQUUsQ0FBQyxJQUFJO1FBQ1QsRUFBRSxFQUFFLENBQUMsSUFBSTtRQUNULEVBQUUsRUFBRSxJQUFJO1FBQ1IsRUFBRSxFQUFFLElBQUk7UUFDUixFQUFFLEVBQUUsSUFBSTtRQUNSLEVBQUUsRUFBRSxDQUFDLElBQUk7UUFDVCxFQUFFLEVBQUUsSUFBSTtRQUNSLEVBQUUsRUFBRSxDQUFDLEdBQUc7UUFDUixFQUFFLEVBQUUsSUFBSTtRQUNSLEVBQUUsRUFBRSxHQUFHO1FBQ1AsRUFBRSxFQUFFLElBQUk7UUFDUixFQUFFLEVBQUUsQ0FBQyxHQUFHO1FBQ1IsRUFBRSxFQUFFLEdBQUc7UUFDUCxFQUFFLEVBQUUsSUFBSTtRQUNSLEVBQUUsRUFBRSxJQUFJO1FBQ1IsRUFBRSxFQUFFLElBQUk7UUFDUixFQUFFLEVBQUUsR0FBRztRQUNQLEVBQUUsRUFBRSxDQUFDLElBQUk7UUFDVCxFQUFFLEVBQUUsSUFBSTtRQUNSLEVBQUUsRUFBRSxJQUFJO1FBQ1IsRUFBRSxFQUFFLElBQUk7UUFDUixFQUFFLEVBQUUsSUFBSTtRQUNSLEVBQUUsRUFBRSxJQUFJO1FBQ1IsRUFBRSxFQUFFLENBQUMsSUFBSTtRQUNULEVBQUUsRUFBRSxJQUFJO1FBQ1IsRUFBRSxFQUFFLElBQUk7UUFDUixFQUFFLEVBQUUsSUFBSTtRQUNSLEVBQUUsRUFBRSxDQUFDLEdBQUc7UUFDUixFQUFFLEVBQUUsQ0FBQyxHQUFHO1FBQ1IsRUFBRSxFQUFFLEdBQUc7UUFDUCxFQUFFLEVBQUUsSUFBSTtRQUNSLEVBQUUsRUFBRSxJQUFJO1FBQ1IsRUFBRSxFQUFFLElBQUk7UUFDUixFQUFFLEVBQUUsQ0FBQyxJQUFJO1FBQ1QsRUFBRSxFQUFFLENBQUMsSUFBSTtRQUNULEVBQUUsRUFBRSxDQUFDLElBQUk7UUFDVCxFQUFFLEVBQUUsSUFBSTtRQUNSLEVBQUUsRUFBRSxDQUFDLEdBQUc7UUFDUixFQUFFLEVBQUUsSUFBSTtRQUNSLEVBQUUsRUFBRSxHQUFHO1FBQ1AsRUFBRSxFQUFFLENBQUMsSUFBSTtRQUNULEVBQUUsRUFBRSxJQUFJO1FBQ1IsRUFBRSxFQUFFLENBQUMsSUFBSTtRQUNULEVBQUUsRUFBRSxDQUFDLElBQUk7UUFDVCxFQUFFLEVBQUUsSUFBSTtRQUNSLEVBQUUsRUFBRSxDQUFDLElBQUk7UUFDVCxFQUFFLEVBQUUsQ0FBQyxJQUFJO1FBQ1QsRUFBRSxFQUFFLENBQUMsR0FBRztRQUNSLEVBQUUsRUFBRSxDQUFDLElBQUk7UUFDVCxFQUFFLEVBQUUsQ0FBQyxJQUFJO1FBQ1QsRUFBRSxFQUFFLENBQUMsR0FBRztRQUNSLEdBQUcsRUFBRSxJQUFJO1FBQ1QsR0FBRyxFQUFFLEdBQUc7UUFDUixJQUFJLEVBQUUsSUFBSTtLQUNYLENBQUM7SUFDRixJQUFJLENBQUMsS0FBSyxHQUFHO1FBQ1gsSUFBSSxFQUFFLENBQUMsS0FBSztRQUNaLEVBQUUsRUFBRSxDQUFDLEdBQUc7UUFDUixJQUFJLEVBQUUsQ0FBQyxJQUFJO1FBQ1gsSUFBSSxFQUFFLENBQUMsS0FBSztRQUNaLEVBQUUsRUFBRSxDQUFDLElBQUk7UUFDVCxFQUFFLEVBQUUsSUFBSTtRQUNSLEVBQUUsRUFBRSxDQUFDLElBQUk7UUFDVCxFQUFFLEVBQUUsQ0FBQyxHQUFHO1FBQ1IsRUFBRSxFQUFFLENBQUMsSUFBSTtRQUNULEVBQUUsRUFBRSxJQUFJO1FBQ1IsRUFBRSxFQUFFLEdBQUc7UUFDUCxFQUFFLEVBQUUsQ0FBQyxJQUFJO1FBQ1QsRUFBRSxFQUFFLElBQUk7UUFDUixFQUFFLEVBQUUsQ0FBQyxJQUFJO1FBQ1QsRUFBRSxFQUFFLENBQUMsSUFBSTtRQUNULEVBQUUsRUFBRSxDQUFDLElBQUk7UUFDVCxFQUFFLEVBQUUsSUFBSTtRQUNSLEVBQUUsRUFBRSxLQUFLO1FBQ1QsRUFBRSxFQUFFLENBQUMsSUFBSTtRQUNULEVBQUUsRUFBRSxDQUFDLElBQUk7UUFDVCxFQUFFLEVBQUUsQ0FBQyxHQUFHO1FBQ1IsRUFBRSxFQUFFLElBQUk7UUFDUixFQUFFLEVBQUUsR0FBRztRQUNQLEVBQUUsRUFBRSxHQUFHO1FBQ1AsRUFBRSxFQUFFLENBQUMsSUFBSTtRQUNULEVBQUUsRUFBRSxDQUFDLElBQUk7UUFDVCxFQUFFLEVBQUUsQ0FBQyxHQUFHO1FBQ1IsRUFBRSxFQUFFLENBQUMsSUFBSTtRQUNULEVBQUUsRUFBRSxDQUFDLEdBQUc7UUFDUixFQUFFLEVBQUUsSUFBSTtRQUNSLEVBQUUsRUFBRSxDQUFDLEdBQUc7UUFDUixFQUFFLEVBQUUsSUFBSTtRQUNSLEVBQUUsRUFBRSxJQUFJO1FBQ1IsRUFBRSxFQUFFLENBQUMsSUFBSTtRQUNULEVBQUUsRUFBRSxJQUFJO1FBQ1IsRUFBRSxFQUFFLElBQUk7UUFDUixFQUFFLEVBQUUsSUFBSTtRQUNSLEVBQUUsRUFBRSxDQUFDLElBQUk7UUFDVCxFQUFFLEVBQUUsQ0FBQyxJQUFJO1FBQ1QsRUFBRSxFQUFFLElBQUk7UUFDUixFQUFFLEVBQUUsQ0FBQyxJQUFJO1FBQ1QsRUFBRSxFQUFFLENBQUMsSUFBSTtRQUNULEVBQUUsRUFBRSxDQUFDLElBQUk7UUFDVCxFQUFFLEVBQUUsQ0FBQyxJQUFJO1FBQ1QsRUFBRSxFQUFFLElBQUk7UUFDUixFQUFFLEVBQUUsQ0FBQyxJQUFJO1FBQ1QsRUFBRSxFQUFFLENBQUMsSUFBSTtRQUNULEVBQUUsRUFBRSxHQUFHO1FBQ1AsRUFBRSxFQUFFLElBQUk7UUFDUixFQUFFLEVBQUUsQ0FBQyxJQUFJO1FBQ1QsRUFBRSxFQUFFLENBQUMsSUFBSTtRQUNULEVBQUUsRUFBRSxDQUFDLElBQUk7UUFDVCxFQUFFLEVBQUUsQ0FBQyxJQUFJO1FBQ1QsRUFBRSxFQUFFLElBQUk7UUFDUixFQUFFLEVBQUUsSUFBSTtRQUNSLEVBQUUsRUFBRSxDQUFDLElBQUk7UUFDVCxFQUFFLEVBQUUsSUFBSTtRQUNSLEVBQUUsRUFBRSxJQUFJO1FBQ1IsRUFBRSxFQUFFLENBQUMsSUFBSTtRQUNULEVBQUUsRUFBRSxDQUFDLEtBQUs7UUFDVixFQUFFLEVBQUUsQ0FBQyxJQUFJO1FBQ1QsRUFBRSxFQUFFLENBQUMsS0FBSztRQUNWLEVBQUUsRUFBRSxJQUFJO1FBQ1IsRUFBRSxFQUFFLENBQUMsSUFBSTtRQUNULEVBQUUsRUFBRSxDQUFDLElBQUk7UUFDVCxFQUFFLEVBQUUsQ0FBQyxJQUFJO1FBQ1QsRUFBRSxFQUFFLElBQUk7UUFDUixFQUFFLEVBQUUsQ0FBQyxJQUFJO1FBQ1QsRUFBRSxFQUFFLENBQUMsSUFBSTtRQUNULEVBQUUsRUFBRSxJQUFJO1FBQ1IsRUFBRSxFQUFFLENBQUMsSUFBSTtRQUNULEVBQUUsRUFBRSxDQUFDLElBQUk7UUFDVCxFQUFFLEVBQUUsSUFBSTtRQUNSLEVBQUUsRUFBRSxDQUFDLElBQUk7UUFDVCxFQUFFLEVBQUUsSUFBSTtRQUNSLEVBQUUsRUFBRSxDQUFDLEtBQUs7UUFDVixFQUFFLEVBQUUsQ0FBQyxHQUFHO1FBQ1IsRUFBRSxFQUFFLENBQUMsSUFBSTtRQUNULEVBQUUsRUFBRSxDQUFDLElBQUk7UUFDVCxFQUFFLEVBQUUsR0FBRztRQUNQLEVBQUUsRUFBRSxJQUFJO1FBQ1IsRUFBRSxFQUFFLElBQUk7UUFDUixFQUFFLEVBQUUsR0FBRztRQUNQLEVBQUUsRUFBRSxJQUFJO1FBQ1IsRUFBRSxFQUFFLElBQUk7UUFDUixFQUFFLEVBQUUsSUFBSTtRQUNSLEVBQUUsRUFBRSxDQUFDLEtBQUs7UUFDVixFQUFFLEVBQUUsR0FBRztRQUNQLEVBQUUsRUFBRSxDQUFDLElBQUk7UUFDVCxFQUFFLEVBQUUsR0FBRztRQUNQLEVBQUUsRUFBRSxDQUFDLElBQUk7UUFDVCxFQUFFLEVBQUUsR0FBRztRQUNQLEVBQUUsRUFBRSxDQUFDLElBQUk7UUFDVCxFQUFFLEVBQUUsQ0FBQyxJQUFJO1FBQ1QsRUFBRSxFQUFFLENBQUMsSUFBSTtRQUNULEVBQUUsRUFBRSxJQUFJO1FBQ1IsRUFBRSxFQUFFLENBQUMsSUFBSTtRQUNULEVBQUUsRUFBRSxHQUFHO1FBQ1AsRUFBRSxFQUFFLENBQUMsR0FBRztRQUNSLEVBQUUsRUFBRSxDQUFDLElBQUk7UUFDVCxFQUFFLEVBQUUsQ0FBQyxJQUFJO1FBQ1QsRUFBRSxFQUFFLENBQUMsSUFBSTtRQUNULEVBQUUsRUFBRSxDQUFDLElBQUk7UUFDVCxFQUFFLEVBQUUsQ0FBQyxJQUFJO1FBQ1QsRUFBRSxFQUFFLENBQUMsSUFBSTtRQUNULEVBQUUsRUFBRSxDQUFDLElBQUk7UUFDVCxFQUFFLEVBQUUsQ0FBQyxJQUFJO1FBQ1QsRUFBRSxFQUFFLENBQUMsR0FBRztRQUNSLEVBQUUsRUFBRSxDQUFDLElBQUk7UUFDVCxFQUFFLEVBQUUsSUFBSTtRQUNSLEVBQUUsRUFBRSxDQUFDLEdBQUc7UUFDUixFQUFFLEVBQUUsQ0FBQyxJQUFJO1FBQ1QsRUFBRSxFQUFFLENBQUMsSUFBSTtRQUNULEVBQUUsRUFBRSxDQUFDLElBQUk7UUFDVCxFQUFFLEVBQUUsQ0FBQyxJQUFJO1FBQ1QsRUFBRSxFQUFFLENBQUMsSUFBSTtRQUNULEVBQUUsRUFBRSxDQUFDLEdBQUc7UUFDUixFQUFFLEVBQUUsQ0FBQyxJQUFJO1FBQ1QsRUFBRSxFQUFFLENBQUMsSUFBSTtRQUNULElBQUksRUFBRSxDQUFDLEdBQUc7S0FDWCxDQUFDO0lBQ0YsSUFBSSxDQUFDLEtBQUssR0FBRztRQUNYLEVBQUUsRUFBRSxDQUFDLElBQUk7UUFDVCxFQUFFLEVBQUUsR0FBRztRQUNQLEVBQUUsRUFBRSxJQUFJO1FBQ1IsSUFBSSxFQUFFLENBQUMsSUFBSTtRQUNYLElBQUksRUFBRSxDQUFDLElBQUk7UUFDWCxFQUFFLEVBQUUsSUFBSTtRQUNSLEVBQUUsRUFBRSxJQUFJO1FBQ1IsRUFBRSxFQUFFLElBQUk7UUFDUixFQUFFLEVBQUUsSUFBSTtRQUNSLEVBQUUsRUFBRSxJQUFJO1FBQ1IsRUFBRSxFQUFFLElBQUk7UUFDUixFQUFFLEVBQUUsSUFBSTtRQUNSLEVBQUUsRUFBRSxJQUFJO1FBQ1IsRUFBRSxFQUFFLElBQUk7UUFDUixFQUFFLEVBQUUsSUFBSTtRQUNSLElBQUksRUFBRSxJQUFJO1FBQ1YsSUFBSSxFQUFFLElBQUk7UUFDVixFQUFFLEVBQUUsQ0FBQyxHQUFHO1FBQ1IsRUFBRSxFQUFFLENBQUMsSUFBSTtRQUNULEVBQUUsRUFBRSxDQUFDLEdBQUc7UUFDUixFQUFFLEVBQUUsSUFBSTtRQUNSLEVBQUUsRUFBRSxDQUFDLElBQUk7UUFDVCxJQUFJLEVBQUUsSUFBSTtRQUNWLElBQUksRUFBRSxJQUFJO1FBQ1YsRUFBRSxFQUFFLENBQUMsSUFBSTtRQUNULEVBQUUsRUFBRSxDQUFDLElBQUk7UUFDVCxFQUFFLEVBQUUsQ0FBQyxHQUFHO1FBQ1IsRUFBRSxFQUFFLENBQUMsSUFBSTtRQUNULEVBQUUsRUFBRSxDQUFDLElBQUk7UUFDVCxFQUFFLEVBQUUsSUFBSTtRQUNSLEVBQUUsRUFBRSxJQUFJO1FBQ1IsRUFBRSxFQUFFLElBQUk7UUFDUixFQUFFLEVBQUUsSUFBSTtRQUNSLEVBQUUsRUFBRSxDQUFDLElBQUk7UUFDVCxFQUFFLEVBQUUsQ0FBQyxHQUFHO1FBQ1IsRUFBRSxFQUFFLEdBQUc7UUFDUCxJQUFJLEVBQUUsSUFBSTtRQUNWLElBQUksRUFBRSxJQUFJO1FBQ1YsRUFBRSxFQUFFLENBQUMsSUFBSTtRQUNULEVBQUUsRUFBRSxJQUFJO1FBQ1IsRUFBRSxFQUFFLElBQUk7UUFDUixFQUFFLEVBQUUsSUFBSTtRQUNSLEVBQUUsRUFBRSxJQUFJO1FBQ1IsSUFBSSxFQUFFLENBQUMsSUFBSTtRQUNYLElBQUksRUFBRSxDQUFDLElBQUk7UUFDWCxFQUFFLEVBQUUsSUFBSTtRQUNSLElBQUksRUFBRSxJQUFJO1FBQ1YsSUFBSSxFQUFFLElBQUk7UUFDVixFQUFFLEVBQUUsR0FBRztRQUNQLEVBQUUsRUFBRSxHQUFHO1FBQ1AsSUFBSSxFQUFFLElBQUk7UUFDVixJQUFJLEVBQUUsSUFBSTtRQUNWLEVBQUUsRUFBRSxDQUFDLEdBQUc7UUFDUixFQUFFLEVBQUUsR0FBRztRQUNQLEVBQUUsRUFBRSxDQUFDLElBQUk7UUFDVCxFQUFFLEVBQUUsQ0FBQyxHQUFHO1FBQ1IsSUFBSSxFQUFFLElBQUk7UUFDVixJQUFJLEVBQUUsSUFBSTtRQUNWLEVBQUUsRUFBRSxJQUFJO1FBQ1IsRUFBRSxFQUFFLENBQUMsSUFBSTtRQUNULEVBQUUsRUFBRSxHQUFHO1FBQ1AsRUFBRSxFQUFFLElBQUk7UUFDUixFQUFFLEVBQUUsR0FBRztRQUNQLEVBQUUsRUFBRSxHQUFHO1FBQ1AsRUFBRSxFQUFFLElBQUk7UUFDUixFQUFFLEVBQUUsQ0FBQyxJQUFJO1FBQ1QsRUFBRSxFQUFFLElBQUk7UUFDUixFQUFFLEVBQUUsQ0FBQyxJQUFJO1FBQ1QsRUFBRSxFQUFFLElBQUk7UUFDUixFQUFFLEVBQUUsR0FBRztRQUNQLEVBQUUsRUFBRSxDQUFDLElBQUk7UUFDVCxFQUFFLEVBQUUsSUFBSTtRQUNSLEVBQUUsRUFBRSxJQUFJO1FBQ1IsRUFBRSxFQUFFLENBQUMsR0FBRztRQUNSLEVBQUUsRUFBRSxJQUFJO1FBQ1IsSUFBSSxFQUFFLENBQUMsSUFBSTtRQUNYLElBQUksRUFBRSxDQUFDLElBQUk7UUFDWCxFQUFFLEVBQUUsSUFBSTtRQUNSLEVBQUUsRUFBRSxJQUFJO1FBQ1IsRUFBRSxFQUFFLElBQUk7UUFDUixJQUFJLEVBQUUsQ0FBQyxHQUFHO1FBQ1YsSUFBSSxFQUFFLENBQUMsR0FBRztRQUNWLEVBQUUsRUFBRSxDQUFDLElBQUk7UUFDVCxJQUFJLEVBQUUsSUFBSTtRQUNWLElBQUksRUFBRSxJQUFJO1FBQ1YsRUFBRSxFQUFFLElBQUk7UUFDUixFQUFFLEVBQUUsSUFBSTtRQUNSLEVBQUUsRUFBRSxJQUFJO1FBQ1IsRUFBRSxFQUFFLENBQUMsSUFBSTtRQUNULEVBQUUsRUFBRSxJQUFJO1FBQ1IsRUFBRSxFQUFFLENBQUMsR0FBRztRQUNSLEVBQUUsRUFBRSxJQUFJO1FBQ1IsRUFBRSxFQUFFLElBQUk7UUFDUixFQUFFLEVBQUUsSUFBSTtRQUNSLElBQUksRUFBRSxHQUFHO1FBQ1QsSUFBSSxFQUFFLEdBQUc7UUFDVCxFQUFFLEVBQUUsSUFBSTtRQUNSLEVBQUUsRUFBRSxJQUFJO1FBQ1IsRUFBRSxFQUFFLENBQUMsSUFBSTtRQUNULEVBQUUsRUFBRSxJQUFJO1FBQ1IsRUFBRSxFQUFFLENBQUMsR0FBRztRQUNSLEVBQUUsRUFBRSxHQUFHO1FBQ1AsRUFBRSxFQUFFLEdBQUc7UUFDUCxFQUFFLEVBQUUsR0FBRztRQUNQLEVBQUUsRUFBRSxHQUFHO1FBQ1AsRUFBRSxFQUFFLElBQUk7UUFDUixFQUFFLEVBQUUsSUFBSTtRQUNSLEVBQUUsRUFBRSxJQUFJO1FBQ1IsQ0FBQyxFQUFFLEdBQUc7UUFDTixFQUFFLEVBQUUsQ0FBQyxJQUFJO1FBQ1QsSUFBSSxFQUFFLEdBQUc7UUFDVCxJQUFJLEVBQUUsR0FBRztRQUNULEVBQUUsRUFBRSxJQUFJO1FBQ1IsRUFBRSxFQUFFLEdBQUc7S0FDUixDQUFDO0lBQ0YsSUFBSSxDQUFDLEtBQUssR0FBRztRQUNYLEdBQUcsRUFBRSxJQUFJO1FBQ1QsR0FBRyxFQUFFLElBQUk7UUFDVCxHQUFHLEVBQUUsR0FBRztRQUNSLEdBQUcsRUFBRSxHQUFHO1FBQ1IsR0FBRyxFQUFFLENBQUMsR0FBRztRQUNULEdBQUcsRUFBRSxDQUFDLEdBQUc7UUFDVCxHQUFHLEVBQUUsSUFBSTtRQUNULEdBQUcsRUFBRSxDQUFDLEdBQUc7UUFDVCxHQUFHLEVBQUUsQ0FBQyxJQUFJO1FBQ1YsR0FBRyxFQUFFLEdBQUc7UUFDUixHQUFHLEVBQUUsR0FBRztRQUNSLEdBQUcsRUFBRSxDQUFDLElBQUk7S0FDWCxDQUFDO0lBQ0YsSUFBSSxDQUFDLEtBQUssR0FBRztRQUNYLEdBQUcsRUFBRSxJQUFJO1FBQ1QsR0FBRyxFQUFFLENBQUMsSUFBSTtRQUNWLEdBQUcsRUFBRSxDQUFDLElBQUk7UUFDVixHQUFHLEVBQUUsQ0FBQyxJQUFJO1FBQ1YsR0FBRyxFQUFFLEdBQUc7UUFDUixHQUFHLEVBQUUsQ0FBQyxJQUFJO0tBQ1gsQ0FBQztJQUNGLElBQUksQ0FBQyxLQUFLLEdBQUc7UUFDWCxHQUFHLEVBQUUsQ0FBQyxHQUFHO1FBQ1QsR0FBRyxFQUFFLEdBQUc7UUFDUixHQUFHLEVBQUUsQ0FBQyxHQUFHO1FBQ1QsR0FBRyxFQUFFLENBQUMsSUFBSTtRQUNWLEdBQUcsRUFBRSxHQUFHO1FBQ1IsR0FBRyxFQUFFLENBQUMsSUFBSTtRQUNWLEdBQUcsRUFBRSxHQUFHO1FBQ1IsR0FBRyxFQUFFLENBQUMsSUFBSTtRQUNWLEdBQUcsRUFBRSxDQUFDLElBQUk7UUFDVixHQUFHLEVBQUUsQ0FBQyxHQUFHO1FBQ1QsR0FBRyxFQUFFLENBQUMsSUFBSTtRQUNWLEdBQUcsRUFBRSxDQUFDLEdBQUc7UUFDVCxHQUFHLEVBQUUsQ0FBQyxJQUFJO1FBQ1YsR0FBRyxFQUFFLEdBQUc7UUFDUixHQUFHLEVBQUUsQ0FBQyxJQUFJO1FBQ1YsR0FBRyxFQUFFLENBQUMsSUFBSTtRQUNWLEdBQUcsRUFBRSxDQUFDLElBQUk7UUFDVixHQUFHLEVBQUUsQ0FBQyxHQUFHO1FBQ1QsR0FBRyxFQUFFLEdBQUc7UUFDUixHQUFHLEVBQUUsQ0FBQyxHQUFHO1FBQ1QsR0FBRyxFQUFFLENBQUMsSUFBSTtRQUNWLEdBQUcsRUFBRSxHQUFHO1FBQ1IsR0FBRyxFQUFFLENBQUMsSUFBSTtLQUNYLENBQUM7SUFDRixJQUFJLENBQUMsS0FBSyxHQUFHO1FBQ1gsR0FBRyxFQUFFLENBQUMsR0FBRztRQUNULEdBQUcsRUFBRSxJQUFJO1FBQ1QsR0FBRyxFQUFFLEdBQUc7UUFDUixHQUFHLEVBQUUsQ0FBQyxHQUFHO1FBQ1QsR0FBRyxFQUFFLEdBQUc7UUFDUixHQUFHLEVBQUUsR0FBRztRQUNSLEdBQUcsRUFBRSxHQUFHO1FBQ1IsR0FBRyxFQUFFLEdBQUc7UUFDUixHQUFHLEVBQUUsR0FBRztRQUNSLEdBQUcsRUFBRSxHQUFHO1FBQ1IsR0FBRyxFQUFFLENBQUMsSUFBSTtRQUNWLEdBQUcsRUFBRSxHQUFHO1FBQ1IsR0FBRyxFQUFFLElBQUk7UUFDVCxHQUFHLEVBQUUsR0FBRztRQUNSLEdBQUcsRUFBRSxFQUFFO1FBQ1AsR0FBRyxFQUFFLElBQUk7UUFDVCxHQUFHLEVBQUUsSUFBSTtRQUNULEdBQUcsRUFBRSxJQUFJO1FBQ1QsR0FBRyxFQUFFLENBQUMsR0FBRztRQUNULEdBQUcsRUFBRSxHQUFHO1FBQ1IsR0FBRyxFQUFFLENBQUMsR0FBRztRQUNULEdBQUcsRUFBRSxHQUFHO1FBQ1IsR0FBRyxFQUFFLEdBQUc7S0FDVCxDQUFDO0lBQ0YsSUFBSSxDQUFDLEtBQUssR0FBRztRQUNYLElBQUksRUFBRSxDQUFDLEdBQUc7UUFDVixJQUFJLEVBQUUsR0FBRztRQUNULElBQUksRUFBRSxDQUFDLEdBQUc7UUFDVixJQUFJLEVBQUUsRUFBRTtRQUNSLElBQUksRUFBRSxJQUFJO1FBQ1YsSUFBSSxFQUFFLENBQUMsR0FBRztRQUNWLElBQUksRUFBRSxHQUFHO1FBQ1QsSUFBSSxFQUFFLENBQUMsR0FBRztRQUNWLElBQUksRUFBRSxHQUFHO1FBQ1QsSUFBSSxFQUFFLEdBQUc7UUFDVCxJQUFJLEVBQUUsR0FBRztRQUNULElBQUksRUFBRSxHQUFHO1FBQ1QsSUFBSSxFQUFFLENBQUMsRUFBRTtLQUNWLENBQUM7SUFDRixJQUFJLENBQUMsS0FBSyxHQUFHLEVBQUUsSUFBSSxFQUFFLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsQ0FBQyxHQUFHLEVBQUUsSUFBSSxFQUFFLENBQUMsSUFBSSxFQUFFLENBQUM7SUFDbkUsSUFBSSxDQUFDLEtBQUssR0FBRztRQUNYLElBQUksRUFBRSxHQUFHO1FBQ1QsSUFBSSxFQUFFLENBQUMsSUFBSTtRQUNYLElBQUksRUFBRSxHQUFHO1FBQ1QsSUFBSSxFQUFFLENBQUMsR0FBRztRQUNWLElBQUksRUFBRSxDQUFDLEdBQUc7UUFDVixJQUFJLEVBQUUsQ0FBQyxHQUFHO1FBQ1YsSUFBSSxFQUFFLENBQUMsR0FBRztRQUNWLElBQUksRUFBRSxDQUFDLEdBQUc7UUFDVixJQUFJLEVBQUUsR0FBRztRQUNULElBQUksRUFBRSxHQUFHO1FBQ1QsSUFBSSxFQUFFLElBQUk7UUFDVixJQUFJLEVBQUUsR0FBRztRQUNULElBQUksRUFBRSxHQUFHO1FBQ1QsSUFBSSxFQUFFLEdBQUc7UUFDVCxJQUFJLEVBQUUsSUFBSTtRQUNWLElBQUksRUFBRSxJQUFJO1FBQ1YsSUFBSSxFQUFFLEdBQUc7UUFDVCxJQUFJLEVBQUUsR0FBRztRQUNULElBQUksRUFBRSxHQUFHO1FBQ1QsSUFBSSxFQUFFLENBQUMsR0FBRztLQUNYLENBQUM7SUFDRixJQUFJLENBQUMsS0FBSyxHQUFHO1FBQ1gsSUFBSSxFQUFFLENBQUMsR0FBRztRQUNWLElBQUksRUFBRSxDQUFDLElBQUk7UUFDWCxJQUFJLEVBQUUsQ0FBQyxHQUFHO1FBQ1YsSUFBSSxFQUFFLENBQUMsR0FBRztRQUNWLElBQUksRUFBRSxDQUFDLElBQUk7UUFDWCxJQUFJLEVBQUUsQ0FBQyxJQUFJO1FBQ1gsSUFBSSxFQUFFLEdBQUc7UUFDVCxJQUFJLEVBQUUsQ0FBQyxHQUFHO1FBQ1YsSUFBSSxFQUFFLElBQUk7UUFDVixJQUFJLEVBQUUsR0FBRztRQUNULElBQUksRUFBRSxDQUFDLElBQUk7UUFDWCxJQUFJLEVBQUUsSUFBSTtRQUNWLElBQUksRUFBRSxDQUFDLEdBQUc7UUFDVixJQUFJLEVBQUUsR0FBRztRQUNULElBQUksRUFBRSxDQUFDLElBQUk7UUFDWCxJQUFJLEVBQUUsQ0FBQyxJQUFJO0tBQ1osQ0FBQztJQUNGLElBQUksQ0FBQyxLQUFLLEdBQUcsRUFBRSxHQUFHLEVBQUUsQ0FBQyxJQUFJLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxDQUFDO0lBQ3ZDLElBQUksQ0FBQyxLQUFLLEdBQUc7UUFDWCxHQUFHLEVBQUUsQ0FBQyxJQUFJO1FBQ1YsR0FBRyxFQUFFLENBQUMsSUFBSTtRQUNWLEdBQUcsRUFBRSxDQUFDLElBQUk7UUFDVixHQUFHLEVBQUUsSUFBSTtRQUNULEdBQUcsRUFBRSxDQUFDLElBQUk7UUFDVixHQUFHLEVBQUUsQ0FBQyxJQUFJO1FBQ1YsR0FBRyxFQUFFLElBQUk7UUFDVCxHQUFHLEVBQUUsQ0FBQyxJQUFJO1FBQ1YsR0FBRyxFQUFFLENBQUMsSUFBSTtRQUNWLEdBQUcsRUFBRSxJQUFJO1FBQ1QsR0FBRyxFQUFFLENBQUMsR0FBRztRQUNULEdBQUcsRUFBRSxDQUFDLElBQUk7UUFDVixHQUFHLEVBQUUsQ0FBQyxJQUFJO1FBQ1YsR0FBRyxFQUFFLENBQUMsSUFBSTtRQUNWLEdBQUcsRUFBRSxDQUFDLElBQUk7UUFDVixHQUFHLEVBQUUsQ0FBQyxJQUFJO0tBQ1gsQ0FBQztJQUNGLElBQUksQ0FBQyxLQUFLLEdBQUc7UUFDWCxHQUFHLEVBQUUsQ0FBQyxJQUFJO1FBQ1YsR0FBRyxFQUFFLElBQUk7UUFDVCxHQUFHLEVBQUUsQ0FBQyxJQUFJO1FBQ1YsR0FBRyxFQUFFLENBQUMsSUFBSTtRQUNWLEdBQUcsRUFBRSxDQUFDLElBQUk7UUFDVixHQUFHLEVBQUUsQ0FBQyxJQUFJO1FBQ1YsS0FBSyxFQUFFLENBQUMsR0FBRztRQUNYLEtBQUssRUFBRSxDQUFDLEdBQUc7UUFDWCxHQUFHLEVBQUUsQ0FBQyxHQUFHO1FBQ1QsR0FBRyxFQUFFLENBQUMsSUFBSTtRQUNWLEdBQUcsRUFBRSxDQUFDLElBQUk7S0FDWCxDQUFDO0lBQ0YsSUFBSSxDQUFDLEtBQUssR0FBRztRQUNYLEtBQUssRUFBRSxJQUFJO1FBQ1gsS0FBSyxFQUFFLElBQUk7UUFDWCxHQUFHLEVBQUUsQ0FBQyxJQUFJO1FBQ1YsR0FBRyxFQUFFLElBQUk7UUFDVCxLQUFLLEVBQUUsSUFBSTtRQUNYLEtBQUssRUFBRSxJQUFJO1FBQ1gsR0FBRyxFQUFFLElBQUk7UUFDVCxHQUFHLEVBQUUsSUFBSTtRQUNULEdBQUcsRUFBRSxJQUFJO1FBQ1QsR0FBRyxFQUFFLElBQUk7UUFDVCxHQUFHLEVBQUUsQ0FBQyxJQUFJO1FBQ1YsR0FBRyxFQUFFLElBQUk7S0FDVixDQUFDO0lBQ0YsSUFBSSxDQUFDLEtBQUssR0FBRyxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxDQUFDO0lBQ2hELElBQUksQ0FBQyxLQUFLLEdBQUcsRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDO0lBQ25FLElBQUksQ0FBQyxLQUFLLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDO0lBQ25DLElBQUksQ0FBQyxLQUFLLEdBQUc7UUFDWCxDQUFDLEVBQUUsQ0FBQyxJQUFJO1FBQ1IsQ0FBQyxFQUFFLElBQUk7UUFDUCxDQUFDLEVBQUUsQ0FBQyxJQUFJO1FBQ1IsQ0FBQyxFQUFFLENBQUMsSUFBSTtRQUNSLENBQUMsRUFBRSxJQUFJO1FBQ1AsQ0FBQyxFQUFFLElBQUk7UUFDUCxDQUFDLEVBQUUsSUFBSTtLQUNSLENBQUM7SUFDRixJQUFJLENBQUMsS0FBSyxHQUFHLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUM7SUFDNUQsSUFBSSxDQUFDLEtBQUssR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxDQUFDO0lBQzFELElBQUksQ0FBQyxLQUFLLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUUsQ0FBQztJQUN6QixJQUFJLENBQUMsS0FBSyxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUM7SUFDL0IsSUFBSSxDQUFDLEtBQUssR0FBRyxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQztJQUN4QixJQUFJLENBQUMsS0FBSyxHQUFHO1FBQ1gsRUFBRSxFQUFFLEVBQUU7UUFDTixFQUFFLEVBQUUsQ0FBQyxFQUFFO1FBQ1AsRUFBRSxFQUFFLENBQUMsRUFBRTtRQUNQLEVBQUUsRUFBRSxHQUFHO1FBQ1AsRUFBRSxFQUFFLENBQUMsRUFBRTtRQUNQLEVBQUUsRUFBRSxDQUFDLEVBQUU7UUFDUCxFQUFFLEVBQUUsR0FBRztRQUNQLEVBQUUsRUFBRSxHQUFHO1FBQ1AsRUFBRSxFQUFFLENBQUMsSUFBSTtLQUNWLENBQUM7SUFDRixJQUFJLENBQUMsS0FBSyxHQUFHLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLEVBQUUsRUFBRSxJQUFJLEVBQUUsQ0FBQztJQUM1QyxJQUFJLENBQUMsS0FBSyxHQUFHO1FBQ1gsRUFBRSxFQUFFLENBQUMsR0FBRztRQUNSLEVBQUUsRUFBRSxFQUFFO1FBQ04sRUFBRSxFQUFFLElBQUk7UUFDUixFQUFFLEVBQUUsQ0FBQyxJQUFJO1FBQ1QsRUFBRSxFQUFFLElBQUk7UUFDUixFQUFFLEVBQUUsSUFBSTtRQUNSLEVBQUUsRUFBRSxLQUFLO1FBQ1QsRUFBRSxFQUFFLENBQUMsR0FBRztRQUNSLEVBQUUsRUFBRSxDQUFDLElBQUk7S0FDVixDQUFDO0lBQ0YsSUFBSSxDQUFDLEtBQUssR0FBRztRQUNYLEdBQUcsRUFBRSxHQUFHO1FBQ1IsR0FBRyxFQUFFLEdBQUc7UUFDUixHQUFHLEVBQUUsQ0FBQyxHQUFHO1FBQ1QsQ0FBQyxFQUFFLENBQUMsR0FBRztRQUNQLENBQUMsRUFBRSxDQUFDLEdBQUc7UUFDUCxDQUFDLEVBQUUsQ0FBQyxHQUFHO1FBQ1AsQ0FBQyxFQUFFLEdBQUc7UUFDTixDQUFDLEVBQUUsR0FBRztRQUNOLENBQUMsRUFBRSxDQUFDLEdBQUc7UUFDUCxDQUFDLEVBQUUsQ0FBQyxHQUFHO1FBQ1AsQ0FBQyxFQUFFLENBQUMsR0FBRztRQUNQLENBQUMsRUFBRSxDQUFDLEdBQUc7UUFDUCxDQUFDLEVBQUUsQ0FBQyxHQUFHO1FBQ1AsQ0FBQyxFQUFFLENBQUMsR0FBRztRQUNQLENBQUMsRUFBRSxDQUFDLEdBQUc7UUFDUCxDQUFDLEVBQUUsQ0FBQyxHQUFHO1FBQ1AsQ0FBQyxFQUFFLEdBQUc7UUFDTixDQUFDLEVBQUUsQ0FBQyxHQUFHO1FBQ1AsQ0FBQyxFQUFFLEdBQUc7UUFDTixDQUFDLEVBQUUsR0FBRztRQUNOLENBQUMsRUFBRSxDQUFDLEdBQUc7UUFDUCxDQUFDLEVBQUUsQ0FBQyxHQUFHO1FBQ1AsR0FBRyxFQUFFLENBQUMsR0FBRztRQUNULENBQUMsRUFBRSxDQUFDLEdBQUc7UUFDUCxDQUFDLEVBQUUsQ0FBQyxHQUFHO1FBQ1AsQ0FBQyxFQUFFLENBQUMsR0FBRztRQUNQLENBQUMsRUFBRSxHQUFHO1FBQ04sQ0FBQyxFQUFFLENBQUMsR0FBRztRQUNQLENBQUMsRUFBRSxHQUFHO1FBQ04sQ0FBQyxFQUFFLEdBQUc7UUFDTixDQUFDLEVBQUUsQ0FBQyxHQUFHO1FBQ1AsQ0FBQyxFQUFFLENBQUMsR0FBRztRQUNQLENBQUMsRUFBRSxHQUFHO1FBQ04sQ0FBQyxFQUFFLENBQUMsR0FBRztRQUNQLENBQUMsRUFBRSxDQUFDLEdBQUc7UUFDUCxDQUFDLEVBQUUsQ0FBQyxHQUFHO1FBQ1AsR0FBRyxFQUFFLENBQUMsR0FBRztRQUNULEdBQUcsRUFBRSxDQUFDLEdBQUc7S0FDVixDQUFDO0lBQ0YsSUFBSSxDQUFDLEtBQUssR0FBRztRQUNYLEdBQUcsRUFBRSxDQUFDLEdBQUc7UUFDVCxHQUFHLEVBQUUsQ0FBQyxHQUFHO1FBQ1QsQ0FBQyxFQUFFLEdBQUc7UUFDTixHQUFHLEVBQUUsQ0FBQyxHQUFHO1FBQ1QsR0FBRyxFQUFFLElBQUk7UUFDVCxDQUFDLEVBQUUsQ0FBQyxHQUFHO1FBQ1AsQ0FBQyxFQUFFLEdBQUc7UUFDTixDQUFDLEVBQUUsR0FBRztRQUNOLENBQUMsRUFBRSxDQUFDLEdBQUc7UUFDUCxDQUFDLEVBQUUsSUFBSTtRQUNQLENBQUMsRUFBRSxDQUFDLEdBQUc7UUFDUCxDQUFDLEVBQUUsQ0FBQyxHQUFHO1FBQ1AsQ0FBQyxFQUFFLElBQUk7UUFDUCxDQUFDLEVBQUUsR0FBRztRQUNOLENBQUMsRUFBRSxHQUFHO1FBQ04sQ0FBQyxFQUFFLElBQUk7UUFDUCxDQUFDLEVBQUUsQ0FBQyxHQUFHO1FBQ1AsQ0FBQyxFQUFFLEdBQUc7UUFDTixDQUFDLEVBQUUsQ0FBQyxJQUFJO1FBQ1IsQ0FBQyxFQUFFLEdBQUc7UUFDTixDQUFDLEVBQUUsSUFBSTtRQUNQLENBQUMsRUFBRSxDQUFDLEdBQUc7UUFDUCxDQUFDLEVBQUUsQ0FBQyxHQUFHO1FBQ1AsQ0FBQyxFQUFFLENBQUMsR0FBRztRQUNQLENBQUMsRUFBRSxDQUFDLEdBQUc7UUFDUCxDQUFDLEVBQUUsSUFBSTtRQUNQLENBQUMsRUFBRSxJQUFJO1FBQ1AsQ0FBQyxFQUFFLENBQUMsSUFBSTtRQUNSLENBQUMsRUFBRSxHQUFHO1FBQ04sQ0FBQyxFQUFFLENBQUMsR0FBRztRQUNQLENBQUMsRUFBRSxDQUFDLElBQUk7UUFDUixDQUFDLEVBQUUsSUFBSTtRQUNQLENBQUMsRUFBRSxHQUFHO1FBQ04sQ0FBQyxFQUFFLENBQUMsSUFBSTtRQUNSLENBQUMsRUFBRSxDQUFDLEdBQUc7UUFDUCxDQUFDLEVBQUUsSUFBSTtRQUNQLENBQUMsRUFBRSxDQUFDLEdBQUc7UUFDUCxDQUFDLEVBQUUsQ0FBQyxHQUFHO1FBQ1AsQ0FBQyxFQUFFLEdBQUc7UUFDTixDQUFDLEVBQUUsQ0FBQyxJQUFJO1FBQ1IsQ0FBQyxFQUFFLElBQUk7UUFDUCxDQUFDLEVBQUUsQ0FBQyxHQUFHO1FBQ1AsQ0FBQyxFQUFFLEdBQUc7UUFDTixDQUFDLEVBQUUsR0FBRztRQUNOLENBQUMsRUFBRSxHQUFHO1FBQ04sQ0FBQyxFQUFFLENBQUMsR0FBRztRQUNQLENBQUMsRUFBRSxDQUFDLElBQUk7UUFDUixDQUFDLEVBQUUsQ0FBQyxHQUFHO1FBQ1AsQ0FBQyxFQUFFLENBQUMsR0FBRztRQUNQLENBQUMsRUFBRSxDQUFDLEdBQUc7UUFDUCxDQUFDLEVBQUUsR0FBRztRQUNOLENBQUMsRUFBRSxDQUFDLEdBQUc7UUFDUCxDQUFDLEVBQUUsR0FBRztRQUNOLENBQUMsRUFBRSxHQUFHO1FBQ04sQ0FBQyxFQUFFLEdBQUc7UUFDTixDQUFDLEVBQUUsQ0FBQyxJQUFJO1FBQ1IsQ0FBQyxFQUFFLENBQUMsSUFBSTtRQUNSLENBQUMsRUFBRSxDQUFDLElBQUk7UUFDUixDQUFDLEVBQUUsQ0FBQyxHQUFHO1FBQ1AsQ0FBQyxFQUFFLENBQUMsSUFBSTtRQUNSLENBQUMsRUFBRSxDQUFDLEdBQUc7UUFDUCxDQUFDLEVBQUUsQ0FBQyxHQUFHO1FBQ1AsQ0FBQyxFQUFFLENBQUMsSUFBSTtRQUNSLENBQUMsRUFBRSxHQUFHO1FBQ04sQ0FBQyxFQUFFLElBQUk7UUFDUCxDQUFDLEVBQUUsQ0FBQyxJQUFJO1FBQ1IsQ0FBQyxFQUFFLENBQUMsR0FBRztRQUNQLENBQUMsRUFBRSxDQUFDLElBQUk7UUFDUixDQUFDLEVBQUUsSUFBSTtRQUNQLENBQUMsRUFBRSxDQUFDLElBQUk7UUFDUixDQUFDLEVBQUUsQ0FBQyxJQUFJO1FBQ1IsQ0FBQyxFQUFFLElBQUk7UUFDUCxDQUFDLEVBQUUsQ0FBQyxJQUFJO1FBQ1IsQ0FBQyxFQUFFLENBQUMsSUFBSTtRQUNSLENBQUMsRUFBRSxDQUFDLElBQUk7UUFDUixDQUFDLEVBQUUsQ0FBQyxJQUFJO1FBQ1IsQ0FBQyxFQUFFLENBQUMsR0FBRztRQUNQLENBQUMsRUFBRSxDQUFDLElBQUk7UUFDUixDQUFDLEVBQUUsQ0FBQyxJQUFJO1FBQ1IsQ0FBQyxFQUFFLENBQUMsR0FBRztRQUNQLENBQUMsRUFBRSxDQUFDLEdBQUc7UUFDUCxDQUFDLEVBQUUsQ0FBQyxJQUFJO1FBQ1IsQ0FBQyxFQUFFLENBQUMsR0FBRztRQUNQLENBQUMsRUFBRSxDQUFDLElBQUk7UUFDUixDQUFDLEVBQUUsR0FBRztRQUNOLENBQUMsRUFBRSxHQUFHO1FBQ04sQ0FBQyxFQUFFLENBQUMsSUFBSTtRQUNSLENBQUMsRUFBRSxDQUFDLEdBQUc7UUFDUCxDQUFDLEVBQUUsQ0FBQyxJQUFJO1FBQ1IsQ0FBQyxFQUFFLENBQUMsR0FBRztRQUNQLENBQUMsRUFBRSxHQUFHO1FBQ04sQ0FBQyxFQUFFLEdBQUc7UUFDTixDQUFDLEVBQUUsQ0FBQyxJQUFJO1FBQ1IsQ0FBQyxFQUFFLEdBQUc7UUFDTixDQUFDLEVBQUUsQ0FBQyxHQUFHO1FBQ1AsQ0FBQyxFQUFFLENBQUMsSUFBSTtRQUNSLENBQUMsRUFBRSxJQUFJO1FBQ1AsQ0FBQyxFQUFFLElBQUk7UUFDUCxDQUFDLEVBQUUsSUFBSTtRQUNQLENBQUMsRUFBRSxJQUFJO1FBQ1AsQ0FBQyxFQUFFLENBQUMsSUFBSTtRQUNSLEdBQUcsRUFBRSxDQUFDLEdBQUc7UUFDVCxHQUFHLEVBQUUsSUFBSTtRQUNULENBQUMsRUFBRSxHQUFHO1FBQ04sQ0FBQyxFQUFFLENBQUMsR0FBRztRQUNQLENBQUMsRUFBRSxHQUFHO1FBQ04sQ0FBQyxFQUFFLEdBQUc7S0FDUCxDQUFDO0lBQ0YsSUFBSSxDQUFDLEtBQUssR0FBRztRQUNYLEdBQUcsRUFBRSxJQUFJO1FBQ1QsQ0FBQyxFQUFFLENBQUMsR0FBRztRQUNQLEdBQUcsRUFBRSxDQUFDLElBQUk7UUFDVixHQUFHLEVBQUUsSUFBSTtRQUNULENBQUMsRUFBRSxDQUFDLElBQUk7UUFDUixDQUFDLEVBQUUsSUFBSTtRQUNQLEdBQUcsRUFBRSxJQUFJO1FBQ1QsR0FBRyxFQUFFLENBQUMsSUFBSTtRQUNWLENBQUMsRUFBRSxDQUFDLElBQUk7UUFDUixDQUFDLEVBQUUsSUFBSTtRQUNQLENBQUMsRUFBRSxJQUFJO1FBQ1AsQ0FBQyxFQUFFLElBQUk7UUFDUCxDQUFDLEVBQUUsQ0FBQyxJQUFJO1FBQ1IsQ0FBQyxFQUFFLENBQUMsSUFBSTtRQUNSLENBQUMsRUFBRSxJQUFJO1FBQ1AsQ0FBQyxFQUFFLElBQUk7UUFDUCxDQUFDLEVBQUUsR0FBRztRQUNOLENBQUMsRUFBRSxHQUFHO1FBQ04sQ0FBQyxFQUFFLENBQUMsSUFBSTtRQUNSLENBQUMsRUFBRSxDQUFDLElBQUk7UUFDUixDQUFDLEVBQUUsQ0FBQyxJQUFJO1FBQ1IsQ0FBQyxFQUFFLENBQUMsR0FBRztRQUNQLENBQUMsRUFBRSxHQUFHO1FBQ04sQ0FBQyxFQUFFLElBQUk7UUFDUCxDQUFDLEVBQUUsQ0FBQyxJQUFJO1FBQ1IsQ0FBQyxFQUFFLEdBQUc7UUFDTixDQUFDLEVBQUUsQ0FBQyxHQUFHO1FBQ1AsQ0FBQyxFQUFFLENBQUMsSUFBSTtRQUNSLENBQUMsRUFBRSxDQUFDLElBQUk7UUFDUixDQUFDLEVBQUUsSUFBSTtRQUNQLENBQUMsRUFBRSxJQUFJO1FBQ1AsQ0FBQyxFQUFFLElBQUk7UUFDUCxDQUFDLEVBQUUsQ0FBQyxHQUFHO1FBQ1AsQ0FBQyxFQUFFLENBQUMsSUFBSTtRQUNSLENBQUMsRUFBRSxJQUFJO1FBQ1AsQ0FBQyxFQUFFLElBQUk7UUFDUCxDQUFDLEVBQUUsSUFBSTtRQUNQLENBQUMsRUFBRSxDQUFDLElBQUk7UUFDUixDQUFDLEVBQUUsQ0FBQyxJQUFJO1FBQ1IsQ0FBQyxFQUFFLElBQUk7UUFDUCxDQUFDLEVBQUUsQ0FBQyxJQUFJO1FBQ1IsQ0FBQyxFQUFFLENBQUMsSUFBSTtRQUNSLENBQUMsRUFBRSxDQUFDLEdBQUc7UUFDUCxDQUFDLEVBQUUsSUFBSTtRQUNQLENBQUMsRUFBRSxJQUFJO1FBQ1AsQ0FBQyxFQUFFLENBQUMsR0FBRztRQUNQLENBQUMsRUFBRSxDQUFDLEdBQUc7UUFDUCxDQUFDLEVBQUUsR0FBRztRQUNOLENBQUMsRUFBRSxHQUFHO1FBQ04sQ0FBQyxFQUFFLElBQUk7UUFDUCxDQUFDLEVBQUUsSUFBSTtRQUNQLENBQUMsRUFBRSxDQUFDLElBQUk7UUFDUixDQUFDLEVBQUUsSUFBSTtRQUNQLENBQUMsRUFBRSxDQUFDLEdBQUc7UUFDUCxDQUFDLEVBQUUsR0FBRztRQUNOLENBQUMsRUFBRSxJQUFJO1FBQ1AsQ0FBQyxFQUFFLEdBQUc7UUFDTixDQUFDLEVBQUUsQ0FBQyxJQUFJO1FBQ1IsQ0FBQyxFQUFFLEdBQUc7UUFDTixDQUFDLEVBQUUsSUFBSTtRQUNQLENBQUMsRUFBRSxJQUFJO1FBQ1AsQ0FBQyxFQUFFLElBQUk7UUFDUCxDQUFDLEVBQUUsR0FBRztRQUNOLEdBQUcsRUFBRSxDQUFDLElBQUk7UUFDVixDQUFDLEVBQUUsQ0FBQyxJQUFJO1FBQ1IsQ0FBQyxFQUFFLENBQUMsSUFBSTtRQUNSLENBQUMsRUFBRSxDQUFDLElBQUk7UUFDUixDQUFDLEVBQUUsSUFBSTtRQUNQLENBQUMsRUFBRSxHQUFHO1FBQ04sQ0FBQyxFQUFFLENBQUMsR0FBRztRQUNQLENBQUMsRUFBRSxDQUFDLElBQUk7UUFDUixDQUFDLEVBQUUsR0FBRztRQUNOLENBQUMsRUFBRSxJQUFJO1FBQ1AsQ0FBQyxFQUFFLEdBQUc7UUFDTixDQUFDLEVBQUUsSUFBSTtRQUNQLENBQUMsRUFBRSxDQUFDLElBQUk7UUFDUixDQUFDLEVBQUUsR0FBRztRQUNOLENBQUMsRUFBRSxJQUFJO1FBQ1AsQ0FBQyxFQUFFLENBQUMsR0FBRztRQUNQLENBQUMsRUFBRSxDQUFDLElBQUk7UUFDUixDQUFDLEVBQUUsSUFBSTtRQUNQLENBQUMsRUFBRSxJQUFJO1FBQ1AsQ0FBQyxFQUFFLElBQUk7UUFDUCxDQUFDLEVBQUUsQ0FBQyxJQUFJO1FBQ1IsQ0FBQyxFQUFFLEdBQUc7UUFDTixDQUFDLEVBQUUsQ0FBQyxJQUFJO1FBQ1IsQ0FBQyxFQUFFLElBQUk7UUFDUCxDQUFDLEVBQUUsSUFBSTtRQUNQLENBQUMsRUFBRSxHQUFHO1FBQ04sQ0FBQyxFQUFFLElBQUk7UUFDUCxDQUFDLEVBQUUsSUFBSTtRQUNQLENBQUMsRUFBRSxJQUFJO1FBQ1AsQ0FBQyxFQUFFLElBQUk7UUFDUCxDQUFDLEVBQUUsR0FBRztRQUNOLENBQUMsRUFBRSxDQUFDLEdBQUc7UUFDUCxDQUFDLEVBQUUsQ0FBQyxJQUFJO1FBQ1IsQ0FBQyxFQUFFLElBQUk7UUFDUCxDQUFDLEVBQUUsQ0FBQyxJQUFJO1FBQ1IsQ0FBQyxFQUFFLElBQUk7UUFDUCxDQUFDLEVBQUUsQ0FBQyxJQUFJO1FBQ1IsQ0FBQyxFQUFFLENBQUMsR0FBRztRQUNQLENBQUMsRUFBRSxDQUFDLElBQUk7UUFDUixDQUFDLEVBQUUsR0FBRztRQUNOLENBQUMsRUFBRSxJQUFJO1FBQ1AsQ0FBQyxFQUFFLElBQUk7UUFDUCxDQUFDLEVBQUUsQ0FBQyxHQUFHO1FBQ1AsQ0FBQyxFQUFFLElBQUk7UUFDUCxDQUFDLEVBQUUsQ0FBQyxHQUFHO1FBQ1AsQ0FBQyxFQUFFLElBQUk7UUFDUCxDQUFDLEVBQUUsR0FBRztRQUNOLENBQUMsRUFBRSxJQUFJO1FBQ1AsQ0FBQyxFQUFFLElBQUk7UUFDUCxDQUFDLEVBQUUsQ0FBQyxHQUFHO1FBQ1AsQ0FBQyxFQUFFLElBQUk7UUFDUCxDQUFDLEVBQUUsQ0FBQyxJQUFJO1FBQ1IsQ0FBQyxFQUFFLENBQUMsR0FBRztRQUNQLENBQUMsRUFBRSxDQUFDLElBQUk7UUFDUixDQUFDLEVBQUUsSUFBSTtRQUNQLENBQUMsRUFBRSxDQUFDLEdBQUc7UUFDUCxDQUFDLEVBQUUsQ0FBQyxJQUFJO1FBQ1IsQ0FBQyxFQUFFLElBQUk7UUFDUCxDQUFDLEVBQUUsSUFBSTtRQUNQLENBQUMsRUFBRSxDQUFDLElBQUk7UUFDUixDQUFDLEVBQUUsSUFBSTtRQUNQLENBQUMsRUFBRSxDQUFDLElBQUk7UUFDUixDQUFDLEVBQUUsSUFBSTtRQUNQLENBQUMsRUFBRSxJQUFJO1FBQ1AsQ0FBQyxFQUFFLENBQUMsSUFBSTtRQUNSLENBQUMsRUFBRSxDQUFDLElBQUk7UUFDUixDQUFDLEVBQUUsSUFBSTtRQUNQLENBQUMsRUFBRSxDQUFDLElBQUk7UUFDUixDQUFDLEVBQUUsSUFBSTtRQUNQLENBQUMsRUFBRSxDQUFDLEdBQUc7UUFDUCxDQUFDLEVBQUUsQ0FBQyxJQUFJO1FBQ1IsQ0FBQyxFQUFFLENBQUMsSUFBSTtRQUNSLENBQUMsRUFBRSxDQUFDLElBQUk7UUFDUixDQUFDLEVBQUUsSUFBSTtRQUNQLENBQUMsRUFBRSxDQUFDLElBQUk7UUFDUixDQUFDLEVBQUUsSUFBSTtRQUNQLENBQUMsRUFBRSxJQUFJO1FBQ1AsQ0FBQyxFQUFFLElBQUk7UUFDUCxDQUFDLEVBQUUsQ0FBQyxHQUFHO1FBQ1AsQ0FBQyxFQUFFLENBQUMsSUFBSTtRQUNSLENBQUMsRUFBRSxDQUFDLEdBQUc7UUFDUCxDQUFDLEVBQUUsQ0FBQyxHQUFHO1FBQ1AsQ0FBQyxFQUFFLElBQUk7UUFDUCxDQUFDLEVBQUUsR0FBRztRQUNOLENBQUMsRUFBRSxJQUFJO1FBQ1AsQ0FBQyxFQUFFLEdBQUc7UUFDTixDQUFDLEVBQUUsQ0FBQyxHQUFHO1FBQ1AsQ0FBQyxFQUFFLElBQUk7UUFDUCxDQUFDLEVBQUUsSUFBSTtRQUNQLENBQUMsRUFBRSxHQUFHO1FBQ04sQ0FBQyxFQUFFLElBQUk7UUFDUCxDQUFDLEVBQUUsQ0FBQyxJQUFJO1FBQ1IsQ0FBQyxFQUFFLENBQUMsSUFBSTtRQUNSLENBQUMsRUFBRSxJQUFJO1FBQ1AsQ0FBQyxFQUFFLENBQUMsR0FBRztRQUNQLENBQUMsRUFBRSxHQUFHO1FBQ04sQ0FBQyxFQUFFLEdBQUc7UUFDTixDQUFDLEVBQUUsQ0FBQyxJQUFJO1FBQ1IsQ0FBQyxFQUFFLENBQUMsR0FBRztRQUNQLENBQUMsRUFBRSxHQUFHO1FBQ04sQ0FBQyxFQUFFLElBQUk7UUFDUCxDQUFDLEVBQUUsSUFBSTtRQUNQLENBQUMsRUFBRSxDQUFDLElBQUk7UUFDUixDQUFDLEVBQUUsR0FBRztRQUNOLENBQUMsRUFBRSxJQUFJO1FBQ1AsQ0FBQyxFQUFFLENBQUMsSUFBSTtRQUNSLENBQUMsRUFBRSxJQUFJO1FBQ1AsQ0FBQyxFQUFFLEdBQUc7UUFDTixDQUFDLEVBQUUsQ0FBQyxHQUFHO1FBQ1AsQ0FBQyxFQUFFLElBQUk7UUFDUCxDQUFDLEVBQUUsSUFBSTtRQUNQLENBQUMsRUFBRSxJQUFJO1FBQ1AsQ0FBQyxFQUFFLElBQUk7UUFDUCxDQUFDLEVBQUUsSUFBSTtRQUNQLENBQUMsRUFBRSxDQUFDLElBQUk7UUFDUixDQUFDLEVBQUUsSUFBSTtRQUNQLENBQUMsRUFBRSxJQUFJO1FBQ1AsQ0FBQyxFQUFFLElBQUk7UUFDUCxDQUFDLEVBQUUsR0FBRztRQUNOLENBQUMsRUFBRSxDQUFDLElBQUk7UUFDUixDQUFDLEVBQUUsR0FBRztRQUNOLENBQUMsRUFBRSxJQUFJO1FBQ1AsQ0FBQyxFQUFFLENBQUMsR0FBRztRQUNQLENBQUMsRUFBRSxDQUFDLEdBQUc7UUFDUCxDQUFDLEVBQUUsSUFBSTtRQUNQLENBQUMsRUFBRSxJQUFJO1FBQ1AsQ0FBQyxFQUFFLElBQUk7UUFDUCxDQUFDLEVBQUUsQ0FBQyxJQUFJO1FBQ1IsQ0FBQyxFQUFFLENBQUMsSUFBSTtRQUNSLENBQUMsRUFBRSxDQUFDLEdBQUc7UUFDUCxDQUFDLEVBQUUsSUFBSTtRQUNQLENBQUMsRUFBRSxJQUFJO1FBQ1AsQ0FBQyxFQUFFLElBQUk7UUFDUCxDQUFDLEVBQUUsSUFBSTtRQUNQLENBQUMsRUFBRSxHQUFHO1FBQ04sQ0FBQyxFQUFFLENBQUMsSUFBSTtRQUNSLENBQUMsRUFBRSxJQUFJO1FBQ1AsQ0FBQyxFQUFFLENBQUMsSUFBSTtRQUNSLENBQUMsRUFBRSxJQUFJO1FBQ1AsQ0FBQyxFQUFFLENBQUMsSUFBSTtRQUNSLENBQUMsRUFBRSxJQUFJO1FBQ1AsQ0FBQyxFQUFFLElBQUk7UUFDUCxHQUFHLEVBQUUsQ0FBQyxHQUFHO1FBQ1QsR0FBRyxFQUFFLElBQUk7UUFDVCxHQUFHLEVBQUUsQ0FBQyxJQUFJO1FBQ1YsQ0FBQyxFQUFFLENBQUMsSUFBSTtRQUNSLENBQUMsRUFBRSxHQUFHO1FBQ04sRUFBRSxFQUFFLElBQUk7UUFDUixDQUFDLEVBQUUsR0FBRztRQUNOLENBQUMsRUFBRSxHQUFHO1FBQ04sQ0FBQyxFQUFFLElBQUk7UUFDUCxDQUFDLEVBQUUsSUFBSTtRQUNQLENBQUMsRUFBRSxJQUFJO1FBQ1AsQ0FBQyxFQUFFLEdBQUc7S0FDUCxDQUFDO0lBQ0YsSUFBSSxDQUFDLEtBQUssR0FBRztRQUNYLEdBQUcsRUFBRSxJQUFJO1FBQ1QsR0FBRyxFQUFFLElBQUk7UUFDVCxHQUFHLEVBQUUsQ0FBQyxJQUFJO1FBQ1YsR0FBRyxFQUFFLElBQUk7UUFDVCxHQUFHLEVBQUUsSUFBSTtRQUNULENBQUMsRUFBRSxJQUFJO1FBQ1AsR0FBRyxFQUFFLElBQUk7UUFDVCxHQUFHLEVBQUUsSUFBSTtRQUNULEdBQUcsRUFBRSxDQUFDLElBQUk7UUFDVixDQUFDLEVBQUUsSUFBSTtRQUNQLENBQUMsRUFBRSxDQUFDLElBQUk7UUFDUixDQUFDLEVBQUUsQ0FBQyxHQUFHO1FBQ1AsQ0FBQyxFQUFFLENBQUMsSUFBSTtRQUNSLENBQUMsRUFBRSxJQUFJO1FBQ1AsQ0FBQyxFQUFFLEdBQUc7UUFDTixDQUFDLEVBQUUsSUFBSTtRQUNQLENBQUMsRUFBRSxDQUFDLElBQUk7UUFDUixDQUFDLEVBQUUsQ0FBQyxJQUFJO1FBQ1IsQ0FBQyxFQUFFLENBQUMsSUFBSTtRQUNSLENBQUMsRUFBRSxDQUFDLElBQUk7UUFDUixDQUFDLEVBQUUsQ0FBQyxJQUFJO1FBQ1IsQ0FBQyxFQUFFLElBQUk7UUFDUCxDQUFDLEVBQUUsSUFBSTtRQUNQLENBQUMsRUFBRSxJQUFJO1FBQ1AsQ0FBQyxFQUFFLENBQUMsR0FBRztRQUNQLENBQUMsRUFBRSxDQUFDLElBQUk7UUFDUixDQUFDLEVBQUUsQ0FBQyxHQUFHO1FBQ1AsQ0FBQyxFQUFFLElBQUk7UUFDUCxDQUFDLEVBQUUsR0FBRztRQUNOLENBQUMsRUFBRSxJQUFJO1FBQ1AsQ0FBQyxFQUFFLElBQUk7UUFDUCxDQUFDLEVBQUUsSUFBSTtRQUNQLENBQUMsRUFBRSxDQUFDLElBQUk7UUFDUixDQUFDLEVBQUUsQ0FBQyxJQUFJO1FBQ1IsQ0FBQyxFQUFFLENBQUMsSUFBSTtRQUNSLENBQUMsRUFBRSxJQUFJO1FBQ1AsQ0FBQyxFQUFFLElBQUk7UUFDUCxDQUFDLEVBQUUsSUFBSTtRQUNQLENBQUMsRUFBRSxJQUFJO1FBQ1AsQ0FBQyxFQUFFLElBQUk7UUFDUCxDQUFDLEVBQUUsSUFBSTtRQUNQLENBQUMsRUFBRSxJQUFJO1FBQ1AsQ0FBQyxFQUFFLElBQUk7UUFDUCxDQUFDLEVBQUUsSUFBSTtRQUNQLENBQUMsRUFBRSxJQUFJO1FBQ1AsQ0FBQyxFQUFFLElBQUk7UUFDUCxDQUFDLEVBQUUsQ0FBQyxJQUFJO1FBQ1IsQ0FBQyxFQUFFLElBQUk7UUFDUCxDQUFDLEVBQUUsSUFBSTtRQUNQLENBQUMsRUFBRSxDQUFDLEdBQUc7UUFDUCxDQUFDLEVBQUUsSUFBSTtRQUNQLENBQUMsRUFBRSxJQUFJO1FBQ1AsQ0FBQyxFQUFFLENBQUMsSUFBSTtRQUNSLENBQUMsRUFBRSxDQUFDLEdBQUc7UUFDUCxDQUFDLEVBQUUsQ0FBQyxJQUFJO1FBQ1IsQ0FBQyxFQUFFLElBQUk7UUFDUCxDQUFDLEVBQUUsQ0FBQyxJQUFJO1FBQ1IsQ0FBQyxFQUFFLElBQUk7UUFDUCxDQUFDLEVBQUUsQ0FBQyxJQUFJO1FBQ1IsQ0FBQyxFQUFFLElBQUk7UUFDUCxDQUFDLEVBQUUsQ0FBQyxJQUFJO1FBQ1IsQ0FBQyxFQUFFLENBQUMsSUFBSTtRQUNSLENBQUMsRUFBRSxDQUFDLEtBQUs7UUFDVCxDQUFDLEVBQUUsQ0FBQyxJQUFJO1FBQ1IsQ0FBQyxFQUFFLENBQUMsSUFBSTtRQUNSLENBQUMsRUFBRSxDQUFDLElBQUk7UUFDUixDQUFDLEVBQUUsS0FBSztRQUNSLENBQUMsRUFBRSxDQUFDLElBQUk7UUFDUixDQUFDLEVBQUUsSUFBSTtRQUNQLENBQUMsRUFBRSxJQUFJO1FBQ1AsQ0FBQyxFQUFFLElBQUk7UUFDUCxDQUFDLEVBQUUsQ0FBQyxHQUFHO1FBQ1AsQ0FBQyxFQUFFLENBQUMsR0FBRztRQUNQLENBQUMsRUFBRSxDQUFDLElBQUk7UUFDUixDQUFDLEVBQUUsQ0FBQyxHQUFHO1FBQ1AsQ0FBQyxFQUFFLENBQUMsR0FBRztRQUNQLENBQUMsRUFBRSxDQUFDLEdBQUc7UUFDUCxDQUFDLEVBQUUsQ0FBQyxJQUFJO1FBQ1IsR0FBRyxFQUFFLENBQUMsSUFBSTtRQUNWLENBQUMsRUFBRSxDQUFDLEtBQUs7UUFDVCxDQUFDLEVBQUUsQ0FBQyxJQUFJO1FBQ1IsQ0FBQyxFQUFFLElBQUk7UUFDUCxDQUFDLEVBQUUsR0FBRztRQUNOLENBQUMsRUFBRSxDQUFDLEdBQUc7UUFDUCxDQUFDLEVBQUUsQ0FBQyxJQUFJO1FBQ1IsQ0FBQyxFQUFFLElBQUk7UUFDUCxDQUFDLEVBQUUsR0FBRztRQUNOLENBQUMsRUFBRSxHQUFHO1FBQ04sQ0FBQyxFQUFFLENBQUMsSUFBSTtRQUNSLENBQUMsRUFBRSxHQUFHO1FBQ04sQ0FBQyxFQUFFLElBQUk7UUFDUCxDQUFDLEVBQUUsR0FBRztRQUNOLENBQUMsRUFBRSxDQUFDLElBQUk7UUFDUixDQUFDLEVBQUUsQ0FBQyxJQUFJO1FBQ1IsQ0FBQyxFQUFFLEdBQUc7UUFDTixDQUFDLEVBQUUsR0FBRztRQUNOLENBQUMsRUFBRSxJQUFJO1FBQ1AsQ0FBQyxFQUFFLElBQUk7UUFDUCxDQUFDLEVBQUUsSUFBSTtRQUNQLENBQUMsRUFBRSxDQUFDLEdBQUc7UUFDUCxDQUFDLEVBQUUsQ0FBQyxHQUFHO1FBQ1AsQ0FBQyxFQUFFLENBQUMsSUFBSTtRQUNSLENBQUMsRUFBRSxHQUFHO1FBQ04sQ0FBQyxFQUFFLElBQUk7UUFDUCxDQUFDLEVBQUUsSUFBSTtRQUNQLENBQUMsRUFBRSxJQUFJO1FBQ1AsQ0FBQyxFQUFFLENBQUMsSUFBSTtRQUNSLENBQUMsRUFBRSxDQUFDLEdBQUc7UUFDUCxDQUFDLEVBQUUsQ0FBQyxHQUFHO1FBQ1AsQ0FBQyxFQUFFLENBQUMsR0FBRztRQUNQLENBQUMsRUFBRSxJQUFJO1FBQ1AsQ0FBQyxFQUFFLENBQUMsR0FBRztRQUNQLENBQUMsRUFBRSxDQUFDLElBQUk7UUFDUixDQUFDLEVBQUUsR0FBRztRQUNOLENBQUMsRUFBRSxDQUFDLElBQUk7UUFDUixDQUFDLEVBQUUsQ0FBQyxJQUFJO1FBQ1IsQ0FBQyxFQUFFLENBQUMsSUFBSTtRQUNSLENBQUMsRUFBRSxJQUFJO1FBQ1AsQ0FBQyxFQUFFLEdBQUc7UUFDTixDQUFDLEVBQUUsQ0FBQyxJQUFJO1FBQ1IsQ0FBQyxFQUFFLENBQUMsSUFBSTtRQUNSLENBQUMsRUFBRSxDQUFDLElBQUk7UUFDUixDQUFDLEVBQUUsQ0FBQyxHQUFHO1FBQ1AsQ0FBQyxFQUFFLElBQUk7UUFDUCxDQUFDLEVBQUUsQ0FBQyxJQUFJO1FBQ1IsQ0FBQyxFQUFFLENBQUMsSUFBSTtRQUNSLENBQUMsRUFBRSxDQUFDLElBQUk7UUFDUixDQUFDLEVBQUUsQ0FBQyxJQUFJO1FBQ1IsQ0FBQyxFQUFFLElBQUk7UUFDUCxDQUFDLEVBQUUsR0FBRztRQUNOLENBQUMsRUFBRSxDQUFDLElBQUk7UUFDUixDQUFDLEVBQUUsR0FBRztRQUNOLENBQUMsRUFBRSxHQUFHO1FBQ04sQ0FBQyxFQUFFLEdBQUc7UUFDTixDQUFDLEVBQUUsQ0FBQyxJQUFJO1FBQ1IsQ0FBQyxFQUFFLEdBQUc7UUFDTixDQUFDLEVBQUUsR0FBRztRQUNOLENBQUMsRUFBRSxJQUFJO1FBQ1AsQ0FBQyxFQUFFLEdBQUc7UUFDTixDQUFDLEVBQUUsR0FBRztRQUNOLENBQUMsRUFBRSxDQUFDLEdBQUc7UUFDUCxDQUFDLEVBQUUsSUFBSTtRQUNQLENBQUMsRUFBRSxJQUFJO1FBQ1AsQ0FBQyxFQUFFLEdBQUc7UUFDTixDQUFDLEVBQUUsQ0FBQyxJQUFJO1FBQ1IsQ0FBQyxFQUFFLENBQUMsR0FBRztRQUNQLENBQUMsRUFBRSxDQUFDLEdBQUc7UUFDUCxDQUFDLEVBQUUsQ0FBQyxHQUFHO1FBQ1AsQ0FBQyxFQUFFLENBQUMsSUFBSTtRQUNSLENBQUMsRUFBRSxJQUFJO1FBQ1AsQ0FBQyxFQUFFLENBQUMsSUFBSTtRQUNSLENBQUMsRUFBRSxDQUFDLEdBQUc7UUFDUCxDQUFDLEVBQUUsQ0FBQyxHQUFHO1FBQ1AsQ0FBQyxFQUFFLENBQUMsR0FBRztRQUNQLENBQUMsRUFBRSxDQUFDLEdBQUc7UUFDUCxDQUFDLEVBQUUsR0FBRztRQUNOLENBQUMsRUFBRSxDQUFDLElBQUk7UUFDUixDQUFDLEVBQUUsQ0FBQyxJQUFJO1FBQ1IsQ0FBQyxFQUFFLENBQUMsSUFBSTtRQUNSLENBQUMsRUFBRSxDQUFDLElBQUk7UUFDUixDQUFDLEVBQUUsSUFBSTtRQUNQLENBQUMsRUFBRSxJQUFJO1FBQ1AsQ0FBQyxFQUFFLEdBQUc7UUFDTixDQUFDLEVBQUUsQ0FBQyxJQUFJO1FBQ1IsQ0FBQyxFQUFFLElBQUk7UUFDUCxDQUFDLEVBQUUsQ0FBQyxHQUFHO1FBQ1AsQ0FBQyxFQUFFLENBQUMsSUFBSTtRQUNSLENBQUMsRUFBRSxHQUFHO1FBQ04sQ0FBQyxFQUFFLElBQUk7UUFDUCxDQUFDLEVBQUUsR0FBRztRQUNOLENBQUMsRUFBRSxJQUFJO1FBQ1AsQ0FBQyxFQUFFLElBQUk7UUFDUCxDQUFDLEVBQUUsQ0FBQyxJQUFJO1FBQ1IsQ0FBQyxFQUFFLEdBQUc7UUFDTixDQUFDLEVBQUUsQ0FBQyxHQUFHO1FBQ1AsQ0FBQyxFQUFFLEdBQUc7UUFDTixDQUFDLEVBQUUsSUFBSTtRQUNQLENBQUMsRUFBRSxDQUFDLEdBQUc7UUFDUCxDQUFDLEVBQUUsQ0FBQyxHQUFHO1FBQ1AsQ0FBQyxFQUFFLENBQUMsR0FBRztRQUNQLENBQUMsRUFBRSxHQUFHO1FBQ04sQ0FBQyxFQUFFLENBQUMsSUFBSTtRQUNSLENBQUMsRUFBRSxDQUFDLEdBQUc7UUFDUCxDQUFDLEVBQUUsQ0FBQyxJQUFJO1FBQ1IsQ0FBQyxFQUFFLEdBQUc7UUFDTixDQUFDLEVBQUUsQ0FBQyxJQUFJO1FBQ1IsQ0FBQyxFQUFFLElBQUk7UUFDUCxDQUFDLEVBQUUsQ0FBQyxJQUFJO1FBQ1IsQ0FBQyxFQUFFLENBQUMsSUFBSTtRQUNSLENBQUMsRUFBRSxHQUFHO1FBQ04sQ0FBQyxFQUFFLENBQUMsSUFBSTtRQUNSLENBQUMsRUFBRSxJQUFJO1FBQ1AsQ0FBQyxFQUFFLENBQUMsSUFBSTtRQUNSLENBQUMsRUFBRSxJQUFJO1FBQ1AsQ0FBQyxFQUFFLENBQUMsSUFBSTtRQUNSLENBQUMsRUFBRSxDQUFDLElBQUk7UUFDUixDQUFDLEVBQUUsR0FBRztRQUNOLENBQUMsRUFBRSxDQUFDLElBQUk7UUFDUixDQUFDLEVBQUUsQ0FBQyxJQUFJO1FBQ1IsQ0FBQyxFQUFFLENBQUMsSUFBSTtRQUNSLENBQUMsRUFBRSxDQUFDLEdBQUc7UUFDUCxDQUFDLEVBQUUsQ0FBQyxJQUFJO1FBQ1IsQ0FBQyxFQUFFLENBQUMsR0FBRztRQUNQLENBQUMsRUFBRSxDQUFDLElBQUk7UUFDUixDQUFDLEVBQUUsSUFBSTtRQUNQLENBQUMsRUFBRSxJQUFJO1FBQ1AsR0FBRyxFQUFFLElBQUk7UUFDVCxHQUFHLEVBQUUsSUFBSTtRQUNULEdBQUcsRUFBRSxDQUFDLElBQUk7UUFDVixDQUFDLEVBQUUsQ0FBQyxHQUFHO1FBQ1AsQ0FBQyxFQUFFLENBQUMsS0FBSztRQUNULENBQUMsRUFBRSxJQUFJO1FBQ1AsQ0FBQyxFQUFFLElBQUk7UUFDUCxDQUFDLEVBQUUsSUFBSTtRQUNQLENBQUMsRUFBRSxDQUFDLEdBQUc7UUFDUCxDQUFDLEVBQUUsQ0FBQyxJQUFJO1FBQ1IsQ0FBQyxFQUFFLENBQUMsR0FBRztRQUNQLENBQUMsRUFBRSxDQUFDLEdBQUc7UUFDUCxDQUFDLEVBQUUsQ0FBQyxHQUFHO1FBQ1AsQ0FBQyxFQUFFLENBQUMsSUFBSTtLQUNULENBQUM7SUFDRixJQUFJLENBQUMsS0FBSyxHQUFHO1FBQ1gsR0FBRyxFQUFFLEdBQUc7UUFDUixHQUFHLEVBQUUsQ0FBQyxHQUFHO1FBQ1QsQ0FBQyxFQUFFLENBQUMsR0FBRztRQUNQLEVBQUUsRUFBRSxDQUFDLEtBQUs7UUFDVixHQUFHLEVBQUUsQ0FBQyxJQUFJO1FBQ1YsR0FBRyxFQUFFLEdBQUc7UUFDUixHQUFHLEVBQUUsQ0FBQyxHQUFHO1FBQ1QsR0FBRyxFQUFFLEdBQUc7UUFDUixDQUFDLEVBQUUsSUFBSTtRQUNQLENBQUMsRUFBRSxHQUFHO1FBQ04sQ0FBQyxFQUFFLENBQUMsR0FBRztRQUNQLENBQUMsRUFBRSxJQUFJO1FBQ1AsQ0FBQyxFQUFFLEdBQUc7UUFDTixDQUFDLEVBQUUsR0FBRztRQUNOLENBQUMsRUFBRSxDQUFDLEdBQUc7UUFDUCxDQUFDLEVBQUUsSUFBSTtRQUNQLENBQUMsRUFBRSxJQUFJO1FBQ1AsQ0FBQyxFQUFFLEdBQUc7UUFDTixDQUFDLEVBQUUsQ0FBQyxHQUFHO1FBQ1AsQ0FBQyxFQUFFLENBQUMsSUFBSTtRQUNSLENBQUMsRUFBRSxDQUFDLElBQUk7UUFDUixDQUFDLEVBQUUsQ0FBQyxHQUFHO1FBQ1AsQ0FBQyxFQUFFLENBQUMsSUFBSTtRQUNSLENBQUMsRUFBRSxJQUFJO1FBQ1AsQ0FBQyxFQUFFLEVBQUU7UUFDTCxDQUFDLEVBQUUsR0FBRztRQUNOLENBQUMsRUFBRSxDQUFDLEVBQUU7UUFDTixDQUFDLEVBQUUsQ0FBQyxHQUFHO1FBQ1AsQ0FBQyxFQUFFLENBQUMsR0FBRztRQUNQLENBQUMsRUFBRSxJQUFJO1FBQ1AsQ0FBQyxFQUFFLENBQUMsR0FBRztRQUNQLENBQUMsRUFBRSxDQUFDLElBQUk7UUFDUixDQUFDLEVBQUUsQ0FBQyxHQUFHO1FBQ1AsQ0FBQyxFQUFFLENBQUMsR0FBRztRQUNQLENBQUMsRUFBRSxJQUFJO1FBQ1AsQ0FBQyxFQUFFLEdBQUc7UUFDTixDQUFDLEVBQUUsR0FBRztRQUNOLENBQUMsRUFBRSxJQUFJO1FBQ1AsQ0FBQyxFQUFFLEdBQUc7UUFDTixDQUFDLEVBQUUsQ0FBQyxHQUFHO1FBQ1AsQ0FBQyxFQUFFLEdBQUc7UUFDTixDQUFDLEVBQUUsR0FBRztRQUNOLENBQUMsRUFBRSxHQUFHO1FBQ04sQ0FBQyxFQUFFLENBQUMsSUFBSTtRQUNSLENBQUMsRUFBRSxHQUFHO1FBQ04sQ0FBQyxFQUFFLEdBQUc7UUFDTixDQUFDLEVBQUUsR0FBRztRQUNOLENBQUMsRUFBRSxDQUFDLEdBQUc7UUFDUCxDQUFDLEVBQUUsQ0FBQyxHQUFHO1FBQ1AsQ0FBQyxFQUFFLEdBQUc7UUFDTixDQUFDLEVBQUUsQ0FBQyxJQUFJO1FBQ1IsQ0FBQyxFQUFFLENBQUMsR0FBRztRQUNQLENBQUMsRUFBRSxJQUFJO1FBQ1AsQ0FBQyxFQUFFLENBQUMsR0FBRztRQUNQLENBQUMsRUFBRSxHQUFHO1FBQ04sQ0FBQyxFQUFFLElBQUk7UUFDUCxDQUFDLEVBQUUsQ0FBQyxJQUFJO1FBQ1IsQ0FBQyxFQUFFLENBQUMsR0FBRztRQUNQLENBQUMsRUFBRSxJQUFJO1FBQ1AsQ0FBQyxFQUFFLENBQUMsSUFBSTtRQUNSLENBQUMsRUFBRSxDQUFDLElBQUk7UUFDUixDQUFDLEVBQUUsR0FBRztRQUNOLENBQUMsRUFBRSxJQUFJO1FBQ1AsQ0FBQyxFQUFFLEdBQUc7UUFDTixDQUFDLEVBQUUsQ0FBQyxHQUFHO1FBQ1AsQ0FBQyxFQUFFLElBQUk7UUFDUCxDQUFDLEVBQUUsQ0FBQyxJQUFJO1FBQ1IsQ0FBQyxFQUFFLEdBQUc7UUFDTixDQUFDLEVBQUUsQ0FBQyxJQUFJO1FBQ1IsQ0FBQyxFQUFFLEdBQUc7UUFDTixDQUFDLEVBQUUsSUFBSTtRQUNQLENBQUMsRUFBRSxDQUFDLElBQUk7UUFDUixDQUFDLEVBQUUsQ0FBQyxJQUFJO1FBQ1IsQ0FBQyxFQUFFLEdBQUc7UUFDTixDQUFDLEVBQUUsQ0FBQyxJQUFJO1FBQ1IsQ0FBQyxFQUFFLENBQUMsSUFBSTtRQUNSLENBQUMsRUFBRSxJQUFJO1FBQ1AsQ0FBQyxFQUFFLENBQUMsSUFBSTtRQUNSLENBQUMsRUFBRSxDQUFDLElBQUk7UUFDUixDQUFDLEVBQUUsQ0FBQyxHQUFHO1FBQ1AsQ0FBQyxFQUFFLENBQUMsR0FBRztRQUNQLENBQUMsRUFBRSxDQUFDLEdBQUc7UUFDUCxDQUFDLEVBQUUsSUFBSTtRQUNQLENBQUMsRUFBRSxDQUFDLElBQUk7UUFDUixDQUFDLEVBQUUsR0FBRztRQUNOLENBQUMsRUFBRSxDQUFDLElBQUk7UUFDUixDQUFDLEVBQUUsSUFBSTtRQUNQLENBQUMsRUFBRSxDQUFDLElBQUk7UUFDUixDQUFDLEVBQUUsQ0FBQyxHQUFHO1FBQ1AsQ0FBQyxFQUFFLEdBQUc7UUFDTixDQUFDLEVBQUUsSUFBSTtRQUNQLENBQUMsRUFBRSxJQUFJO1FBQ1AsQ0FBQyxFQUFFLENBQUMsR0FBRztRQUNQLEdBQUcsRUFBRSxDQUFDLEdBQUc7UUFDVCxFQUFFLEVBQUUsQ0FBQyxLQUFLO1FBQ1YsR0FBRyxFQUFFLEdBQUc7UUFDUixDQUFDLEVBQUUsR0FBRztRQUNOLENBQUMsRUFBRSxHQUFHO1FBQ04sQ0FBQyxFQUFFLENBQUMsR0FBRztLQUNSLENBQUM7SUFDRixJQUFJLENBQUMsS0FBSyxHQUFHO1FBQ1gsR0FBRyxFQUFFLEdBQUc7UUFDUixHQUFHLEVBQUUsR0FBRztRQUNSLENBQUMsRUFBRSxDQUFDLEdBQUc7UUFDUCxFQUFFLEVBQUUsR0FBRztRQUNQLEdBQUcsRUFBRSxHQUFHO1FBQ1IsR0FBRyxFQUFFLEdBQUc7UUFDUixDQUFDLEVBQUUsQ0FBQyxHQUFHO1FBQ1AsQ0FBQyxFQUFFLEdBQUc7UUFDTixDQUFDLEVBQUUsR0FBRztRQUNOLENBQUMsRUFBRSxDQUFDLEVBQUU7UUFDTixDQUFDLEVBQUUsQ0FBQyxHQUFHO1FBQ1AsQ0FBQyxFQUFFLENBQUMsR0FBRztRQUNQLENBQUMsRUFBRSxJQUFJO1FBQ1AsQ0FBQyxFQUFFLEdBQUc7UUFDTixDQUFDLEVBQUUsQ0FBQyxHQUFHO1FBQ1AsQ0FBQyxFQUFFLEdBQUc7UUFDTixDQUFDLEVBQUUsQ0FBQyxJQUFJO1FBQ1IsQ0FBQyxFQUFFLEdBQUc7UUFDTixDQUFDLEVBQUUsQ0FBQyxHQUFHO1FBQ1AsQ0FBQyxFQUFFLENBQUMsR0FBRztRQUNQLENBQUMsRUFBRSxDQUFDLEdBQUc7UUFDUCxDQUFDLEVBQUUsQ0FBQyxHQUFHO1FBQ1AsQ0FBQyxFQUFFLENBQUMsR0FBRztRQUNQLENBQUMsRUFBRSxDQUFDLEdBQUc7UUFDUCxDQUFDLEVBQUUsR0FBRztRQUNOLENBQUMsRUFBRSxDQUFDLEdBQUc7UUFDUCxDQUFDLEVBQUUsR0FBRztRQUNOLENBQUMsRUFBRSxDQUFDLEdBQUc7UUFDUCxDQUFDLEVBQUUsQ0FBQyxHQUFHO1FBQ1AsQ0FBQyxFQUFFLENBQUMsR0FBRztRQUNQLENBQUMsRUFBRSxHQUFHO1FBQ04sQ0FBQyxFQUFFLENBQUMsR0FBRztRQUNQLENBQUMsRUFBRSxHQUFHO1FBQ04sQ0FBQyxFQUFFLEdBQUc7UUFDTixDQUFDLEVBQUUsSUFBSTtRQUNQLENBQUMsRUFBRSxDQUFDLElBQUk7UUFDUixDQUFDLEVBQUUsR0FBRztRQUNOLENBQUMsRUFBRSxDQUFDLEdBQUc7UUFDUCxDQUFDLEVBQUUsR0FBRztRQUNOLENBQUMsRUFBRSxDQUFDLEdBQUc7UUFDUCxDQUFDLEVBQUUsR0FBRztRQUNOLENBQUMsRUFBRSxDQUFDLEdBQUc7UUFDUCxDQUFDLEVBQUUsR0FBRztRQUNOLENBQUMsRUFBRSxDQUFDLEdBQUc7UUFDUCxDQUFDLEVBQUUsR0FBRztRQUNOLENBQUMsRUFBRSxDQUFDLEdBQUc7UUFDUCxDQUFDLEVBQUUsSUFBSTtRQUNQLENBQUMsRUFBRSxHQUFHO1FBQ04sQ0FBQyxFQUFFLElBQUk7UUFDUCxHQUFHLEVBQUUsQ0FBQyxHQUFHO1FBQ1QsRUFBRSxFQUFFLEdBQUc7UUFDUCxDQUFDLEVBQUUsQ0FBQyxHQUFHO1FBQ1AsQ0FBQyxFQUFFLENBQUMsR0FBRztLQUNSLENBQUM7SUFFRixPQUFPLElBQUksQ0FBQztBQUNkLENBQUM7QUFFRCxhQUFhLENBQUMsU0FBUyxDQUFDLE1BQU0sR0FBRyxVQUFVLEdBQUc7SUFDNUMsS0FBSyxJQUFJLENBQUMsSUFBSSxJQUFJLENBQUMsU0FBUyxFQUFFO1FBQzVCLElBQUksR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUU7WUFDbkMsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1NBQzdCO0tBQ0Y7SUFDRCxPQUFPLEdBQUcsQ0FBQztBQUNiLENBQUMsQ0FBQztBQUVGLGFBQWEsQ0FBQyxTQUFTLENBQUMsR0FBRyxHQUFHLFVBQVUsQ0FBQztJQUN2QyxJQUFJLENBQUMsRUFBRTtRQUNMLE9BQU8sQ0FBQyxDQUFDO0tBQ1Y7SUFDRCxPQUFPLENBQUMsQ0FBQztBQUNYLENBQUMsQ0FBQztBQUVGLGFBQWEsQ0FBQyxTQUFTLENBQUMsT0FBTyxHQUFHLFVBQVUsS0FBSztJQUMvQyxJQUFJLEtBQUssSUFBSSxJQUFJLElBQUksS0FBSyxJQUFJLFNBQVMsSUFBSSxLQUFLLElBQUksRUFBRSxFQUFFO1FBQ3RELE9BQU8sRUFBRSxDQUFDO0tBQ1g7SUFDRCxJQUFJLE1BQU0sR0FBRyxFQUFFLENBQUM7SUFDaEIsSUFBSSxHQUFHLEdBQUcsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQzdCLElBQUksS0FBSyxHQUFHLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQztJQUM1QixJQUFJLENBQUMsR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQ3hCLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsRUFBRTtRQUM3QixHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2YsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FDL0I7SUFDRCxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ2YsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNmLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDZixLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ2hCLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDaEIsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUNoQixJQUFJLElBQUksR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDbEIsSUFBSSxFQUFFLEdBQUcsR0FBRyxDQUFDO0lBQ2IsSUFBSSxFQUFFLEdBQUcsR0FBRyxDQUFDO0lBQ2IsSUFBSSxFQUFFLEdBQUcsR0FBRyxDQUFDO0lBQ2IsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFO1FBQ3ZDLElBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUM7UUFDeEIsSUFBSSxFQUFFLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUNwQixJQUFJLEVBQUUsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBQ3BCLElBQUksRUFBRSxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDcEIsSUFBSSxFQUFFLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2hCLElBQUksRUFBRSxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDcEIsSUFBSSxFQUFFLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUNwQixJQUFJLEVBQUUsR0FBRyxLQUFLLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBQ3RCLElBQUksRUFBRSxHQUFHLEtBQUssQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDdEIsSUFBSSxFQUFFLEdBQUcsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUN0QixJQUFJLEVBQUUsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDbEIsSUFBSSxFQUFFLEdBQUcsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUN0QixJQUFJLEVBQUUsR0FBRyxLQUFLLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBQ3RCLEtBQUssSUFBSSxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUNsQyxLQUFLLElBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDbEMsS0FBSyxJQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ2xDLEtBQUssSUFBSSxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDdkMsS0FBSyxJQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUN2QyxLQUFLLElBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDbEMsS0FBSyxJQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ2xDLEtBQUssSUFBSSxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUNsQyxLQUFLLElBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDbEMsS0FBSyxJQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ2xDLEtBQUssSUFBSSxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUNsQyxLQUFLLElBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ3ZDLEtBQUssSUFBSSxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDdkMsS0FBSyxJQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUN2QyxLQUFLLElBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUM1QyxLQUFLLElBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUM1QyxLQUFLLElBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUM1QyxLQUFLLElBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUM1QyxLQUFLLElBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDbEMsS0FBSyxJQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ2xDLEtBQUssSUFBSSxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUNsQyxLQUFLLElBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDbEMsS0FBSyxJQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ2xDLEtBQUssSUFBSSxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUNsQyxLQUFLLElBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ3ZDLEtBQUssSUFBSSxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDdkMsS0FBSyxJQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUN2QyxLQUFLLElBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUM1QyxLQUFLLElBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUM1QyxLQUFLLElBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUM1QyxLQUFLLElBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQzs7UUFFNUMsS0FBSyxJQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUN2QyxLQUFLLElBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ3ZDLEtBQUssSUFBSSxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDdkMsS0FBSyxJQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDNUMsS0FBSyxJQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDNUMsS0FBSyxJQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDNUMsS0FBSyxJQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDNUMsS0FBSyxJQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ2pELEtBQUssSUFBSSxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUNqRCxLQUFLLElBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVB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
