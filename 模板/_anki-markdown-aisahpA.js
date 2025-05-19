import markdownIt from 'https://gcore.jsdelivr.net/npm/markdown-it@14.1.0/+esm';
import hljs from 'https://gcore.jsdelivr.net/gh/highlightjs/cdn-release@11.11.1/build/es/highlight.min.js';
import mermaid from 'https://gcore.jsdelivr.net/npm/mermaid@11.6.0/dist/mermaid.esm.min.mjs';
import * as markmap from 'https://gcore.jsdelivr.net/npm/markmap-lib@0.18.11/+esm'
import {Markmap} from 'https://gcore.jsdelivr.net/npm/markmap-view@0.18.10/+esm'

const config = {
    /** log level： debug、info、error */
    logLevel: 'error',

    /** Markdown-it options */
    markdownOptions: {
        html: true, // Enable HTML tags in source
        xhtmlOut: false, // Don't use '/' in single tags (<br />)
        breaks: true, // Convert '\n' in paragraphs into <br>
        linkify: true, // Autoconvert URL-like text to links
        typographer: false, // Enable smartypants and other typographic replacements
        highlight: function (str, lang) {
            if (lang && hljs.getLanguage(lang)) {
                try {
                    return hljs.highlight(str, {language: lang}).value
                } catch (__) {
                }
            } else if (lang === "mermaid") {
                // Handle mermaid blocks specifically for the plugin
                return `<pre class="mermaid">${str}</pre>`;
            }
            return '';
        },
    },

    /** Mermaid options */
    mermaidOptions: {
        startOnLoad: false,
    },
};


let DivLog;
let CensorUtil;
let AnkiMarkDownIt;

//------ Initialize Utilities ------

let initAll = function () {
    try {
        initDivLog();

        initCensorUtil();

        AnkiMarkDownIt = markdownIt(config.markdownOptions);
        DivLog.info("Markdown-it initialized.");

        initMermaid();

    } catch (e) {
        showCard();
        DivLog.error("Initialize error: ", e);
    }
}

/**
 * Initializes the DivLog utility for logging messages to both console and a DOM element.
 * If DivLog is not already defined, it creates a new instance with methods for different log levels (debug, info, warn, error).
 * Each log message includes a timestamp and is styled according to its level.
 * Logs are appended to a dedicated container in the DOM, which is created if it doesn't exist.
 */
let initDivLog = function () {
    if (typeof DivLog === 'undefined') {
        DivLog = {
            currentLevel: 4,
            levelMap: {debug: 5, info: 4, warn: 3, error: 2, off: 1},
            setLevel(levelStr) {
                this.currentLevel = this.levelMap[levelStr];
            },
            debug(...messages) {
                this._log(this.levelMap.debug, "", ...messages);
            },
            info(...messages) {
                this._log(this.levelMap.info, "", ...messages);
            },
            warn(...messages) {
                this._log(this.levelMap.warn, "orange", ...messages);
            },
            error(...messages) {
                this._log(this.levelMap.error, "red", ...messages);
            },
            _log(minLevel, fontColor, ...messages) {
                if (minLevel > this.currentLevel || messages.length === 0) {
                    return;
                }
                const messageDiv = document.createElement("div");
                messageDiv.style.color = fontColor;
                messages[0] = new Date().toLocaleTimeString() + "  " + messages[0];
                messages.forEach(message => {
                    // 替换数学公式中的界定符号，原样显示，不然会被 anki 替换为公式形状
                    if (typeof message === 'string') {
                        message = message.replace(/\\\(/g, '\\_(').replace(/\\\[/g, '\\_[');
                    }
                    if (message instanceof Error) {
                        message = message.stack;
                    }
                    messageDiv.appendChild(document.createTextNode(message));
                    messageDiv.appendChild(document.createElement("br"));
                });
                messageDiv.appendChild(document.createElement("hr"));
                this._getMsgContainer().appendChild(messageDiv)
            },
            _getMsgContainer() {
                let msgContainer = document.getElementById("msgContainer");
                if (!msgContainer) {
                    msgContainer = document.createElement("div");
                    msgContainer.id = "msgContainer";
                    msgContainer.style.textAlign = "left";
                    msgContainer.style.whiteSpace = "pre-wrap";
                    // 将日志信息放在最后
                    let qa = document.getElementById("qa");
                    if (qa) {
                        qa.appendChild(msgContainer);
                    }
                }
                return msgContainer
            },
            clearLogDiv() {
                const msgContainer = document.getElementById("msgContainer");
                if (msgContainer) {
                    msgContainer.remove();
                }
            }
        };
        DivLog.setLevel(globalThis.logLevel || config.logLevel || "info");
        DivLog.info("DivLog initialized.")
    }
}

/**
 * Initializes the CensorUtil utility if it hasn't been defined yet.
 *
 * CensorUtil provides functions to temporarily hide LaTeX math expressions (e.g., $$...$$, $...$)
 * during Markdown processing, ensuring they are not altered by intermediate transformations.
 * This is useful when rendering Markdown content that contains math formulas which should be preserved as-is.
 */
let initCensorUtil = function () {
    if (typeof CensorUtil === 'undefined') {
        CensorUtil = {
            /**
             * Regular expression to match LaTeX math expressions:
             * - $$...$$
             * - $(...)$
             */
            MathJs_Reg: /(\\\[[\s\S]*?\\])|(\\\([\s\S]*?\\\))/g,
            MathJs_Replace: "ANKI_MATHJS_REPLACE",
            censor: function (note_text, regexp, mask) {
                let matches = [];
                let replacedText = note_text.replace(regexp, (match) => {
                    matches.push(match);
                    return mask;
                });
                return [replacedText, matches];
            },
            decensor: function (note_text, mask, replacements) {
                if (replacements.length === 0) {
                    return note_text;
                }
                // Create an iterator to replace each mask in order
                let replacementIterator = replacements[Symbol.iterator]();
                // Replace all occurrences of mask in the text
                return note_text.replace(new RegExp(mask, 'g'), () => {
                    return replacementIterator.next().value;
                });
            }
        };
        DivLog.info("CensorUtil initialized.");
    }
}

let initMermaid = function () {
    let isNight = document.body.classList.contains("nightMode");
    config.mermaidOptions.theme = isNight ? "dark" : "default";

    mermaid.initialize(config.mermaidOptions);
    DivLog.info("Mermaid initialized.");
}

//------ Controls page display ------

/**
 * Displays the card content after a brief delay.
 * This method is primarily intended for Android devices, as they load content directly on new pages,
 * whereas desktop and iOS platforms handle content rendering asynchronously.
 */
let showCard = function () {
    setTimeout(() => {
        document.body.classList.add("body-show");
    }, 0)
}


//------ Convert content ------

/**
 * Renders Markdown content and Mermaid diagrams.
 *
 * This function attempts to find all elements with the class name 'markdown-body' and render their innerHTML content using Markdown formatting.
 * After Markdown rendering is complete, it will attempt to render any Mermaid diagrams present in the content.
 */
let renderMarkDownMain = function () {
    try {
        // Render markdown mindmap
        renderMarkMap();

        // Process all '.markdown-body' elements and render their content using Markdown
        document.querySelectorAll('.markdown-body').forEach((div) => {
            div.innerHTML = renderMarkDown(div.innerHTML);
        });

        // Render Mermaid diagrams if any are present
        renderMermaid();

        DivLog.info("finish rendering.")
    } catch (e) {
        DivLog.error('Render markdown error: ', e);
    } finally {
        showCard();
    }
}

/**
 * Convert content to markdown web format
 * @param {string} text - The input text to be rendered
 * @returns {string} - Rendered HTML string
 */
let renderMarkDown = function (text) {
    DivLog.debug("======================================");
    DivLog.debug("Original content：", text);

    let math_tag_matches;
    [text, math_tag_matches] = CensorUtil.censor(text, CensorUtil.MathJs_Reg, CensorUtil.MathJs_Replace);
    if (math_tag_matches.length > 0) {
        DivLog.debug("After hide \\ (...\\) 和 \\ [...\\]：" + math_tag_matches.length + " places", text);
    }

    // Predefined entity map for HTML entity decoding
    const entities = {amp: '&', lt: '<', gt: '>', nbsp: ' ', quot: '"', '#39': "'"};

    // Trim whitespace and decode specific HTML entities in one pass
    text = text.trim().replace(/&(amp|lt|gt|nbsp|quot|#39);/g, (_, type) => entities[type] || '')
        .replace(/<br\s*\/?>/gi, '\n');  // Replace <br> and <br/> tags with newline characters
    DivLog.debug("After reverse some HTML tags：", text);

    text = AnkiMarkDownIt.render(text);
    DivLog.debug("After markdown-it render:", text);

    text = CensorUtil.decensor(text, CensorUtil.MathJs_Replace, math_tag_matches);
    DivLog.debug("After restoring hidden content:", text);

    return text;
}

let renderMermaid = function () {
    const mermaidElements = document.querySelectorAll("pre.mermaid");
    if (mermaidElements.length > 0) {
        try {
            mermaid.run({nodes: mermaidElements});
        } catch (e) {
            DivLog.error("Mermaid rendering failed", e);
        }
    }
}

let renderMarkMap = function () {
    try {
        document.querySelectorAll(".markmap").forEach((markMapDiv) => {
            const transformer = new markmap.Transformer();
            const content = markMapDiv.textContent;
            const {root} = transformer.transform(content);

            // 创建一个 SVG 容器并渲染思维导图
            let svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            markMapDiv.innerHTML = '';
            markMapDiv.appendChild(svg);
            Markmap.create(svg, null, root);
        });
    } catch (e) {
        DivLog.error("MarkMap rendering failed", e);
    }
}

//------ Main ------

// Initialize all
initAll();

window.ankiMarkDownMain = function () {
    if (globalThis.onUpdateHook) {
        // Use Anki's built-in onUpdateHook to ensure execution order
        DivLog.debug("globalThis.onUpdateHook exists");
        onUpdateHook.push(renderMarkDownMain);
    } else {
        renderMarkDownMain();
    }
}

// Not required for desktop and iOS, but needed for Android to execute here
ankiMarkDownMain();
