/**
 * @version 1.0.0
 * @author aisahpA
 * @email chenxiangu2010@163.com
 * @github https://github.com/aisahpA/anki-md-template/blob/master/template/_anki-markdown.js
 * @license MIT
 *
 * @fileoverview Anki Markdown + KaTeX + Mermaid + markmap.
 * 1. div.markdown-body
 * 2. Markdown code block in mermaid format(\`\`\`mermaid)
 * 3. div.markmap
 */
(function () {
  "use strict";

  // Desktop and iOS load only once, Android will reload every time
  if (window._ankiMarkdownInitialized) {
    ankiMarkDownMain();
    return;
  }
  window._ankiMarkdownInitialized = true;


//------ Config ------

  const config = {
    /** log level： debug、info、error */
    logLevel: 'error',

    plugins: {
      markdownitMark: true,
      markdownitSub: false,
      markdownitSup: false,
      markdownitKatex: true,
    },

    /** List of js to load */
    resourceUrl: {
      // markdown-it
      markdownit: "https://gcore.jsdelivr.net/npm/markdown-it@14.1.0/dist/markdown-it.min.js",
      highlight: "https://gcore.jsdelivr.net/gh/highlightjs/cdn-release@11.11.1/build/highlight.min.js",
      // markdown-it-plugins
      markdownitMark: "https://gcore.jsdelivr.net/npm/markdown-it-mark@4.0.0/dist/markdown-it-mark.min.js",
      markdownitSub: "https://gcore.jsdelivr.net/npm/markdown-it-sub@2.0.0/dist/markdown-it-sub.min.js",
      markdownitSup: "https://gcore.jsdelivr.net/npm/markdown-it-sup@2.0.0/dist/markdown-it-sup.min.js",
      // katex
      markdownTexMath: "https://gcore.jsdelivr.net/npm/markdown-it-texmath@1.0.0/texmath.min.js",
      markdownTexMathCss: "https://gcore.jsdelivr.net/npm/markdown-it-texmath@1.0.0/css/texmath.min.css",
      katex: "https://gcore.jsdelivr.net/npm/katex@0.16.18/dist/katex.min.js",
      katexCss: "https://gcore.jsdelivr.net/npm/katex@0.16.18/dist/katex.min.css",
      // mermaid
      mermaid: "https://gcore.jsdelivr.net/npm/mermaid@11.6.0/dist/mermaid.min.js",
      // markmap
      d3: "https://gcore.jsdelivr.net/npm/d3@7/dist/d3.min.js",
      markmapLib: "https://gcore.jsdelivr.net/npm/markmap-lib@0.18.11/dist/browser/index.iife.min.js",
      markmapView: "https://gcore.jsdelivr.net/npm/markmap-view@0.18.10/dist/browser/index.min.js",
    },

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

    /** katex $ math */
    texMathOptions: {
      // https://www.npmjs.com/package/markdown-it-texmath
      // dollars: $...$ or $$...$$
      delimiters: ['dollars'],
      // https://katex.org/docs/options
      katexOptions: {
        output: 'html',
        throwOnError: false,
        strict: (errorCode, errorMsg, token) => {
          DivLog.warn('Warn: ' + errorCode + ' ' + errorMsg + ' ' + token);
          return "ignore";
        },
      }
    },

    /** Mermaid options */
    mermaidOptions: {
      theme: 'default', // 'default' | 'base' | 'dark' | 'forest' | 'neutral' | 'null'
      startOnLoad: false,
    },

    /** markmap options */
    markmapOptions: {
      autoFit: true,
      maxWidth: 400,
      zoom: false,
      pan: false
    }
  };


//------ Initialize Utilities ------

  let DivLog;
  let CensorUtil;
  let AnkiMarkDownIt;

  async function initMarkdownit() {
    if (typeof AnkiMarkDownIt !== 'undefined') return;

    // basic
    await loadResources(config.resourceUrl.markdownit, config.resourceUrl.highlight);
    AnkiMarkDownIt = markdownit(config.markdownOptions);

    // plugins
    if (config.plugins.markdownitMark) {
      await loadResource(config.resourceUrl.markdownitMark);
      AnkiMarkDownIt.use(window.markdownitMark);
    }
    if (config.plugins.markdownitSub) {
      await loadResource(config.resourceUrl.markdownitSub);
      AnkiMarkDownIt.use(window.markdownitSub);
    }
    if (config.plugins.markdownitSup) {
      await loadResource(config.resourceUrl.markdownitSup);
      AnkiMarkDownIt.use(window.markdownitSup);
    }

    // katex
    if (config.plugins.markdownitKatex) {
      await loadResources(
        config.resourceUrl.markdownTexMath,
        config.resourceUrl.markdownTexMathCss,
        config.resourceUrl.katex,
        config.resourceUrl.katexCss
      );
      config.texMathOptions.engine = window.katex;
      AnkiMarkDownIt.use(window.texmath, config.texMathOptions);
    }

    initCensorUtil();

    DivLog.info("Markdown-it initialized.");
  }

  async function initMermaid() {
    if (typeof mermaid !== 'undefined') return;

    await loadResource(config.resourceUrl.mermaid)

    let isNight = document.body.classList.contains("nightMode");
    if (isNight) {
      config.mermaidOptions.theme = "dark";
    }

    mermaid.initialize(config.mermaidOptions);
    DivLog.info("Mermaid initialized.");
  }

  async function initMarkMap() {
    if (typeof markmap !== 'undefined') return;

    await loadResource(config.resourceUrl.d3);
    await loadResources(config.resourceUrl.markmapLib, config.resourceUrl.markmapView);
    if (!config.plugins.markdownitKatex) {
      await loadResources(config.resourceUrl.katex, config.resourceUrl.katexCss);
    }

    DivLog.info("MarkMap initialized.");
  }

  /**
   * Initializes the DivLog utility for logging messages to both console and a DOM element.
   * If DivLog is not already defined, it creates a new instance with methods for different log levels (debug, info, warn, error).
   * Each log message includes a timestamp and is styled according to its level.
   * Logs are appended to a dedicated container in the DOM, which is created if it doesn't exist.
   */
  function initDivLog() {
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
          console.error(...messages);
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
  function initCensorUtil() {
    if (typeof CensorUtil === 'undefined') {
      CensorUtil = {
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

  /**
   * Loads a JavaScript or css resource.
   */
  function loadResource(url) {
    return new Promise((resolve, reject) => {
      let element;
      if (url.endsWith(".js")) {
        element = document.createElement("script");
        element.src = url;
      } else if (url.endsWith(".css")) {
        element = document.createElement("link");
        element.rel = "stylesheet";
        element.href = url;
      } else {
        reject(new Error(`Unsupported resource type for ${url}`));
      }
      element.onload = () => {
        DivLog.info(`Successfully loaded ${url}`);
        resolve();
      };
      element.onerror = (error) => {
        DivLog.error(`Failed to load ${url}`, error);
        // Remove the element from DOM
        if (element.parentNode) {
          element.parentNode.removeChild(element);
        }
        reject(error);
      }
      document.head.appendChild(element);
    });
  }

  function loadResources(...urls) {
    return Promise.all(urls.map(url => loadResource(url)));
  }


//------ Controls page display ------

  /**
   * Displays the card content after a brief delay.
   * This method is primarily intended for Android devices, as they load content directly on new pages,
   * whereas desktop and iOS platforms handle content rendering asynchronously.
   */
  function showCard() {
    document.querySelectorAll('.original').forEach((el) => {
      el.classList.remove('original');
    })
  }


//------ Convert content ------

  /**
   * Renders the main content of the card, including markdown content, Mermaid diagrams, and markdown mindmap.
   */
  function renderMain() {
    initDivLog();
    renderMarkDownAll()
      .then(renderMermaidAll)
      .then(renderMarkMapAll)
      .then(() => {
        DivLog.info("finish rendering.");
      })
      .catch((error) => {
        DivLog.error('Render error: ', error);
      })
      .finally(() => {
        showCard();
      });
  }

  async function renderMarkDownAll() {
    let elements = document.querySelectorAll('.markdown-body');
    if (elements.length === 0) return;

    await initMarkdownit();

    await Promise.all([...elements].map(renderMarkDownSingle))
  }

  function renderMarkDownSingle(markdownDiv) {
    let text = markdownDiv.innerHTML;
    DivLog.debug("======================================");
    DivLog.debug("Original content：", text);

    let math_tag_matches;
    [text, math_tag_matches] = CensorUtil.censor(text, CensorUtil.MathJs_Reg, CensorUtil.MathJs_Replace);
    if (math_tag_matches.length > 0) {
      DivLog.debug("After hide \\ (...\\) 和 \\ [...\\]：" + math_tag_matches.length + " places", text);
    }

    // Trim whitespace and decode specific HTML entities in one pass
    text = escapeHtmlForMarkdown(text);
    DivLog.debug("After reverse some HTML tags：", text);

    text = AnkiMarkDownIt.render(text);
    DivLog.debug("After markdown-it render:", text);

    if (math_tag_matches.length > 0) {
      text = CensorUtil.decensor(text, CensorUtil.MathJs_Replace, math_tag_matches);
      DivLog.debug("After restoring hidden content:", text);
    }

    markdownDiv.innerHTML = text;
  }

  async function renderMermaidAll() {
    const elements = document.querySelectorAll("pre.mermaid");
    if (elements.length === 0) return;

    try {
      await initMermaid();
      await mermaid.run({nodes: elements});
      DivLog.debug("Mermaid rendering completed.")
    } catch (e) {
      DivLog.error("Mermaid rendering failed", e);
    }
  }

  async function renderMarkMapAll() {
    let elements = document.querySelectorAll(".markmap");
    if (elements.length === 0) return;

    await initMarkMap();

    await Promise.all([...elements].map(renderMarkMapSingle));
  }

  /**
   * Renders a markmap element.
   * Does not support math formula rendering on iOS
   */
  async function renderMarkMapSingle(markMapDiv) {
    try {
      const content = escapeHtmlForMarkdown(markMapDiv.innerHTML);
      DivLog.debug('Original markmap content:', content);

      // Transform the markmap content to a tree structure
      const transformer = new markmap.Transformer();
      transformer.urlBuilder.setProvider('jsdelivr', (path) => `https://gcore.jsdelivr.net/npm/${path}`);
      const {root, features} = transformer.transform(content);

      delete features.hljs; // The project has already loaded hljs

      const {styles, scripts} = transformer.getUsedAssets(features);
      if (styles) markmap.loadCSS(styles);
      if (scripts) {
        markmap.loadJS(scripts, {getMarkmap: () => markmap,});
      }

      markMapDiv.innerHTML = '<svg></svg>';
      await markmap.Markmap.create(markMapDiv.firstChild, config.markmapOptions, root);

    } catch (e) {
      DivLog.error("MarkMap rendering failed", e);
    }
  }

  function escapeHtmlForMarkdown(html) {
    const entities = {amp: '&', lt: '<', gt: '>', nbsp: ' ', quot: '"', '#39': "'"};

    // Trim whitespace and decode specific HTML entities in one pass
    return html.trim()
      .replace(/&(amp|lt|gt|nbsp|quot|#39);/g, (_, type) => entities[type] || '')
      .replace(/<br\s*\/?>/gi, '\n');  // Replace <br> and <br/> tags with newline characters
  }


//------ Main ------

  window.ankiMarkDownMain = function () {
    if (globalThis.onUpdateHook) {
      // Use Anki's built-in onUpdateHook to ensure execution order
      onUpdateHook.unshift(renderMain);
    } else {
      renderMain();
    }
  }

//  Run main
  ankiMarkDownMain();

})();
