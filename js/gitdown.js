/*
      GGGG  IIIII TTTTTTT DDDDD    OOOOO  WW      WW NN   NN
     GG  GG  III    TTT   DD  DD  OO   OO WW      WW NNN  NN
    GG       III    TTT   DD   DD OO   OO WW   W  WW NN N NN
    GG   GG  III    TTT   DD   DD OO   OO  WW WWW WW NN  NNN
     GGGGGG IIIII   TTT   DDDDDD   OOOO0    WW   WW  NN   NN
*/

/**
    GitDown core
    @param {string} el HTML element
    @param {object} options options object
    @returns {object} a new GitDown object
*/
class GitDown {

    constructor(el, options) {
        this.init(el, options);
        this.entry();
    }

    init(el, options) {
        this.status = new Status();
        this.parametersProtected = 'raw,callback,mergeThemes,origin,parameters_disallowed';
        this.settings = new Settings(options, this.parametersProtected);

        // Virtual classes to store contents and provide methods for accessing them
        this.sections = new Sections();
        this.panels = new Panels();
        this.events = new Events();

        // URL classes
        this.params = Url.getSearchParams();
        this.path = Url.getPath();

        // configure examples
        this.exampleThemes = this.examples();

        this.initialContent = '';

        // configure dom
        const inner = this.settings.getValue('inner');
        this.dom = new Dom();
        this.eid = this.dom.configureWrapper(el, inner);

        // helper variables to simplify access to container elements
        this.eidInner = ' .' + this.settings.getValue('inner');
        this.wrapper = document.querySelector(this.eid);
        this.inner = document.querySelector(this.eidInner);
    };

    // setup basic examples
    // returns defaults if merged is not provided
    // otherwise returns examples with merged added
    examples(userExamples) {
        let ex = [
            "[Technology](adc373c2d5a5d2b07821686e93a9630b)",
            "[Console](a634da7b7130fd40d682360154cc4e2e)",
            "[Tech Archaic](e27b284231488b349f35786f6340096a)",
            "[Saint Billy](76c39d26b1b44e07bd7a783311caded8)",
            "[Ye Olde Tavern](e9dc237da3d9bda63302fe4b659c20b5)",
            "[Old Glory](43bff1c9c6ae8a829f67bd707ee8f142)",
            "[Woodwork](ece15baa3b80cd95bc0b7a0a2b5a24bd)",
            "[Graph Paper](77b1f66ad5093c2db29c666ad15f334d)",
            "[Writing on the Wall](241b47680c730c7162cb5f82d6d788fa)",
            "[Ghastly](d1a6d5621b883bf6af886855d853d502)",
            "[Gradient Deep](51aa23d96f9bd81fe55c47b2d51855a5)",
            "[Shapes](dbb6369d5cef9801d11e0c342b47b2e0)"
        ];

        if (userExamples === undefined) return ex;

        let doMerge = false;
        if (type === 'css') doMerge = this.settings.getValue('mergeThemes');

        if (doMerge) return Helpers.mergeExamples(ex, userExamples);
        return userExamples;
    }

    // just a quick way to log a message to console
    // also will help us search for logged messages
    log(msg) {
        const c = console;
        c.log(msg);
    }

    // has-dom
    // iterate over settings and update them with user provided url param values
    getUrlParameters() {
        // foreach over all params
        let params = (new URL(location)).searchParams;
        for (var pair of params.entries()) {
            let key = pair[0];
            let value = pair[1];
            if (this.settings.isNotAllowed(key)) continue;
            if (typeof value === 'string') {
                value = Helpers.clean(value);
            }
            this.settings.setValue(key, value);
            this.settings.setParamValue(key, value);
        }
    }

    isParamAllowed(p) {
        let allowed = this.settings.getValue('parameters_disallowed');
        allowed = allowed.split(',');
        let prot = this.parametersProtected.split(',');
        if (prot.indexOf(p) === -1 && allowed.indexOf(p) === -1) {
            return true;
        }
        return false;
    }

    /**
     * Helper function for combining url parts
     * @returns {string} url with base, query vars and hash
     */
    uri() {
        //let q = this.params.toString();
        let q = this.settings.toString();
        if (q.length > 0) q = '?' + q;
        let base = window.location.href.split('?')[0];
        base = base.split('#')[0];
        return base + q + Url.getHash();
    };

    // has-dom
    // Ridiculously lengthy function for fullscreen switching
    toggleFullscreen(e) {
        e = e || document.documentElement;
        if (!document.fullscreenElement && !document.mozFullScreenElement &&
            !document.webkitFullscreenElement && !document.msFullscreenElement) {
            if (e.requestFullscreen) {
                e.requestFullscreen();
            } else if (e.msRequestFullscreen) {
                e.msRequestFullscreen();
            } else if (e.mozRequestFullScreen) {
                e.mozRequestFullScreen();
            } else if (e.webkitRequestFullscreen) {
                e.webkitRequestFullscreen(Element.ALLOWKEYBOARDINPUT);
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            }
        }
    }

    /**
     * load user specified highlight style
     */
    renderHighlight() {
        var h = this.settings.getValue('highlight');
        var hlight = document.querySelector('#gd-highlight');
        if (h === undefined || h === null) h = 'default';
        if (h.toLowerCase() === 'none') {
            if (hlight !== null) hlight.parentNode.removeChild(hlight);
        } else {
            // setup link details
            var href = '//cdnjs.cloudflare.com/ajax/libs/highlight.js/9.12.0/styles/';
            href += h + '.min.css';
            // check for existence of highlight link
            if (hlight === null) {
                // add style reference to head
                this.appendStyle('link', 'gd-highlight', href);
            } else {
                // modify existing href
                hlight.setAttribute('href', href);
            }
        }
        // iterate over code blocks to highlight them
        let code = document.querySelectorAll('pre code');
        code.forEach(c => hljs.highlightBlock(c));
    }

    /**
     * Add style to head either inline or external stylesheet
     * @param {string} type link or style
     * @param {string} id so we can alter href later
     * @param {string} content either href or actual style content
     */
    appendStyle(type, id, content) {
        if (type === 'link') {
            let s = document.createElement(type);
            s.type = 'text/css';
            if (id !== null) s.id = id;
            s.rel = 'stylesheet';
            s.href = content;
            document.head.appendChild(s);
        } else if (type === 'style') {
            // attempt to sanitize content before adding
            const css = Helpers.clean(content);
            const div = document.createElement("div");
            div.innerHTML = `<style id="${id}">${css}</style>`;
            document.head.appendChild(div);
        }
    }

    getSetting(s) {
        if (s === 'theme') {
            return window.localStorage.getItem('gdTheme');
        } else if (s === 'content') {
            return window.localStorage.getItem('gdContent');
        } else if (s === 'settings') {
            var s = window.localStorage.getItem('gdSettings');
            return JSON.parse(s);
        }
    }

    // tries to find a unique name for an element by adding
    // -number at the end and checking for any element with that name
    //
    // prefix: section, room or some other identifier
    // selector: base selector so we can find a unique id, class or otherwise
    // max: maximum number of times to try
    //
    // returns new element name with suffixed number

    // has-dom
    // adjust so user passes in array and function finds unique prefix based on items
    unique(prefix, selector = '#', max = 200) {
        let x = 1;
        do {
            const n = `${Helpers.cssId(prefix)}-${x}`;
            // check if id already exists
            const name = document.querySelector(selector + n);
            if (name === null) return n;
            x++;
        }
        while (x < max);
    }

    // has-dom
    extractCssVars() {
        // start by clearing existing css vars
        const styleSheets = document.styleSheets;
        const styleSheetsLength = styleSheets.length;
        for (var i = 0; i < styleSheetsLength; i++) {
            // get cssRules from internal stylesheets only
            try {
                this.getVarsFromSheet(styleSheets[i]);
            } catch (e) {
                // leaving open for error message reporting
            }
        }
    }

    // has-dom
    getVarsFromSheet(sheet) {
        // setup extension variable to add to 'cssvar' type
        let ext = '';
        // get owner node id, which will be 'gd-theme-css' for user provided css
        if (sheet.ownerNode.id === 'gd-theme-css') ext = '-user';
        const classes = sheet.rules || sheet.cssRules;
        const classesLength = classes.length;
        // iterate over class rules
        for (var c = 0; c < classesLength; c++) {
            const cssClass = classes[c];
            const selector = cssClass.selectorText;
            // skip if there's no selector, denoting external stylesheet
            if (selector === undefined) continue;
            // find all occurrences of variable definitions --var: value;
            const regex = cssClass.cssText.match(/[^var(]\-\-(.*?)[:](.*?);/gi);
            if (regex !== null) {
                const elements = document.querySelectorAll(selector);
                // skip if no elements with this selector exists in rendered document
                if (elements.length < 1) continue;
                regex.forEach(str => this.iterateVars(str, ext));
            }
        }
    }

    iterateVars(str, ext) {
        const r = str.match(/\-\-(.*?):(.*?);/);
        const key = r[1].trim();
        let value = r[2].trim();
        // revert to default value if key is of type 'cssvar-user'
        let s = this.settings.getType(key);
        if (s === 'cssvar-user') value = this.settings.getDefault(key);
        // don't set value if user has entered a url parameter for setting, unless they've selected a different theme
        // if ( !this.status.has('theme-changed') && this.settings.isInQuerystring(key) ) {
        //     this.settings.setType(key, 'cssvar' + ext);
        //     return;
        // }
        this.settings.setValue(key, value, 'cssvar' + ext);
        // last stylesheet loaded should set the default value
        // this will also set the suffix if it hasn't already been set
        this.settings.setDefault(key, value);
    }

    // has-dom
    // iterates over all fields of specific type and updates their values, accounting for url params
    updateFromParams(type) {
        // get field set
        if (type === undefined) type = '';
        const f = `${this.eid} .nav .field${type}`;
        const fields = document.querySelectorAll(f);
        // iterate over fields
        fields.forEach(el => {
            const field = el.firstElementChild;
            // skip collapsible and similar fields\
            if (field.tagName === 'DIV') return;
            let name = field.getAttribute('name');
            let value = field.value;
            // use setting value for datalist
            if (el.classList.contains('datalist')) value = this.settings.getValue(name);
            // set defaults based on field values, if they're not already set
            this.settings.setValue(name, value);
            // always set default for select fields based on initial value
            if (el.classList.contains('select')) this.settings.setDefault(name, value);
            // otherwise set default to field value if default is undefined
            if (this.settings.getDefault(name) === undefined) {
                this.settings.setDefault(name, value);
            }

            // update values based on any user provided params
            // do this only if callback hasn't yet been made
            let v = this.settings.getParamValue(name);
            if (v !== undefined && !this.status.has('callback')) {
                value = v;
                field.setAttribute('value', value);
            }
            this.updateField(field, value);
        }, this);
    }

    // update parameter values in storage and url
    updateQueryString() {
        // we should not bother with url params since this.settings stores params
        history.replaceState({}, this.settings.getValue('title'), this.uri());
    };

    removeClassByPrefix(e, prefix) {
        var classes = e.classList;
        for (var c of classes) {
            if (c.startsWith(prefix)) e.classList.remove(c);
        }
    }

    // has-dom
    scrollTo(el) {
        let top = el.offsetTop;
        let container = el.parentElement;
        container.scrollTop = top - container.offsetTop;
    }

    // plain js implementation of jquery index()
    findIndex(node) {
        var i = 1;
        while (node = node.previousSibling) {
            if (node.nodeType === 1) { ++i }
        }
        return i;
    }

    renderToc() {
        var toc = document.querySelector(this.eid + ' .nav .toc');
        let sections = this.sections.sections;
        if (sections.length < 1) {
            // remove the toc and heading if there are no sections
            var tocHeading = document.querySelector(this.eid + ' .nav .toc-heading');
            if (tocHeading !== null) {
                tocHeading.parentNode.removeChild(tocHeading);
            }
            if (toc !== null) {
                toc.parentNode.removeChild(toc);
            }
            return;
        }

        var html = '';
        if (this.sections.isRaw()) return;
        sections.forEach(s => {
            let c = '';
            let span = `<span class=level>#</span>`;
            let level = span.repeat(Helpers.getHlevel(s));
            let id = Helpers.cssId(s[0]);
            let name = this.sections.getSectionName(id);
            html += `<a href="#${id}" classes="${c}">`;
            html += level;
            html += name;
            html += '</a>';
        })
        if (toc !== null) toc.innerHTML = html;
    };

    // promise based get
    get(url) {
        return new Promise((resolve, reject) => {
            const http = new XMLHttpRequest();
            http.open('GET', url);
            http.onload = function () {
                if (http.status === 200) {
                    resolve(http.response);
                } else {
                    reject(Error(http.status));
                }
            };
            http.onerror = function () {
                reject(Error("Error with request."));
            };
            http.send();
        });
    }

    // helper function to parse gist response for specified file
    // @result = parsed JSON response
    getGistFilename(result, filename) {
        var files = result.files;
        var f = '';
        if (filename === '') {
            // check for existence of key with filename
            var f = files[filename];
            if (f === undefined) {
                // filename doesn't exist so use first element
                f = Object.keys(files)[0];
            }
        } else {
            f = Object.keys(files)[0];
        }
        return files[f];
    };

    // directs the loading process, preparing a list of urls for promise chain
    prepareUrls(id, type) {
        var urls = [];
        // first set url to pull local file named with id
        // if that fails, we'll pull from original gist
        var filePath = '';
        var ext = '';
        // add markdown extension if file has no extension
        if (id.indexOf('.') === -1) ext = '.md';
        // add css extension and css/ file path if this is a css file
        if (type === 'css') {
            filePath = 'css/';
            ext = '.css';
            // push named file for ids that exist in exampleThemes
            for (const key in this.exampleThemes) {
                const exampleId = this.extractId(this.exampleThemes[key]);
                if (exampleId.trim() === id.trim()) {
                    const f = 'gitdown-' + Helpers.cssId(key) + ext;
                    urls.push([type, id, filePath + f]);
                    urls.push([type, id, '//ugotsta.github.io/gitdown/' + filePath + f]);
                }
            }
        }
        urls.push([type, id, filePath + id + ext]);
        urls.push([type, id, '//ugotsta.github.io/gitdown/' + filePath + id + ext]);
        urls.push([type, id, `//api.github.com/gists/${id}`]);
        return urls;
    }

    // extracts a gist/snippet id from provided string
    extractId(str) {
        // gist.github.com
        if (str.includes('gist.github.com')) {
            const s = str.split('/');
            // return all content after last '/'
            if (s.length > 1) return s[s.length - 1];
        }
        // gist.githubusercontent.com - raw gist url
        if (str.includes('gist.githubusercontent.com')) {
            let raw = str.split('raw');
            if (raw.length < 2) return '';
            const s = str.split('/');
            // return all content after last '/'
            if (s.length > 1) return s[0];
        }
        return str;
    }

    // adjust response if content is pulled from GitHub Gist
    gistifyResponse(type, url, response) {
        const filename = this.settings.getValue(type + 'Filename');
        if (url.indexOf('api.github.com') != -1) {
            const parsed = JSON.parse(response);
            const file = this.getGistFilename(parsed, filename);
            this.settings.setValue(type + 'Filename', file.filename);
            return file.content;
        }
        return response;
    }

    // PRIVATE METHODS -----------------------------------------------------

    // CONTROL FLOW:
    //
    // 1. entry() - entry point
    //   1b. renderContent() - render initial content
    // 2. loadInitial() - get initial content
    // 3. loop - directs flow after initial load
    //   3a. getFiles() - promise chain where all loading occurs after initial load
    //   3b. renderContent() - content pulled from getFiles() sent back to renderer
    // 4. loadDone() - update ui elements and call any user provided callback
    entry() {
        // update settings with URL parameters
        this.getUrlParameters();

        let initial = this.settings.getValue('initial');
        if (initial.toLowerCase === 'html') {
            let html = document.querySelector(this.eid);
            if (html !== null) this.initialContent = html.innerHTML;
            this.renderContent('html');
            this.status.add('initial');
        } else {
            this.loadInitial(initial);
        }
    };

    // load initial content which will be used to get most of the defaults
    loadInitial(url) {
        this.get(url).then(r => {
            this.renderContent(r);
            this.status.add('initial');
            this.loop();
        }, function (error) {
            if (error.toString().indexOf('404')) {
                this.log(error);
            }
        });
    }

    loop() {
        const css = this.settings.getValue('css'),
            content = this.settings.getValue('content');

        let urls = [];
        if (css.toLowerCase() === 'default') {
            this.renderThemeCss('');
        } else if (!this.status.has('css')) {
            urls = this.prepareUrls(css, 'css');
        }

        let c = content.toLowerCase();
        let initial = this.settings.getValue('initial');

        if (c === 'default' || content === initial) {
            // revert to initial content
            if (!this.status.has('content') && this.status.has('callback')) {
                this.status.remove('initial');
                this.loadInitial(this.settings.getValue('initial'));
            }
            this.status.add('content');
            this.settings.setValue('content_filename', this.settings.getValue('content'));
        } else if (!this.status.has('content')) {
            // add content urls to urls array
            const contentUrls = this.prepareUrls(content, 'content');
            contentUrls.forEach((e) => { urls.push(e); });
        }

        if (urls.length < 1) {
            this.loadDone();
        } else {
            // getFiles() is a recursive function that tries all urls in array
            this.getFiles(urls);
        }
    }

    // used stricly to clear existing content when loading new content
    clearContent() {
        var e = document.querySelector(this.eid + ' .nav');
        if (e !== null) e.innerHTML = '';
        e = document.querySelector(this.eidInner);
        if (e !== null) e.innerHTML = '';
    }

    // takes a series of urls and tries them until one loads succesfully
    getFiles(urls) {
        if (urls.length < 1) return;
        if (this.status.has('done')) return;
        const self = this;
        const a = urls.shift();
        let type = a[0], id = a[1], url = a[2];
        /* PROMISE CHAIN */
        this.get(url).then(r => {
            this.log(`URL successfully loaded: ${url}`);
            this.settings.setValue(type, id);
            this.settings.setValue(type + 'Filename', url);
            let data = this.gistifyResponse(type, url, r);
            if (type === 'css') {
                this.renderThemeCss(data);
                if (this.status.has('content')) this.loadDone();
            } else {
                this.renderContent(data);
                this.status.add('content');
                // remove 'content' from urls since we have the content
                urls = urls.filter(i => i[0] !== 'content');
                // complete load process if both content and css loaded successfully
                if (this.status.has('content,css')) {
                    this.loadDone();
                }
            }
            this.getFiles(urls);
        }).catch(function (error) {
            self.log(error);
            self.getFiles(urls);
        })
    };

    // breaks provided content into sections and assigns to this.sections
    // also checks for panels and returns that content
    extractSections(raw) {
        let content = Helpers.clean(raw);
        const lines = content.split('\n');
        // heading and content
        let h = '', c = '';
        let s = [];
        let sectionsDone = false;
        let panelFound = false;

        // inBlock designates whether we're within a code or quote block
        let inBlock = false;

        lines.forEach((line, i) => {
            if (line.startsWith('```')) inBlock = !inBlock;
            let nextLine = '';
            if (i < lines.length - 1) nextLine = lines[i + 1];
            // check for heading rules (zero or more ##, max ######, trailing space)
            if (Helpers.isHeading(line, nextLine, inBlock)) {
                // handle cases where content exists prior to any headings as Intro
                if (h === '' && c !== '') h = '🅸 Intro';
                if (h.includes('`🅖-panel') || h.includes('`🅖-nav')) {
                    panelFound = true;
                    // push currently extracted content to sections
                    // only if it has't been done yet
                    // we'll then continue extraction of panel content
                    if (!sectionsDone) {
                        this.sections.setSections(s);
                        s = [];
                    }
                    sectionsDone = true;
                }
                // push header/content to array if it's not empty
                if (h !== '' && c !== '') s.push([h, c]);
                // now add current line as header for next section
                h = line;
                // and reset content to begin extraction of this section's content
                c = '';
            } else {
                c += line + '\n';
                // add themes if mergeThemes set true
                if (line.includes('css `🅖-datalist`')) {
                    if (this.settings.getValue('mergeThemes') === false) return;
                    this.exampleThemes.forEach(example => {
                        c += '- ' + example + '\n';
                    });
                }
            }
            // end of content handler
            if (i === lines.length - 1) s.push([h, c]);
        }, this);
        if (!panelFound) this.sections.setSections(s);
        return s;
    }

    renderContent(data) {
        if (this.settings.getValue('initial').toLowerCase === 'html') {
            //
        }
        // best practice, files should end with newline, we'll ensure it.
        else data += '\n';

        // preprocess data if user specified
        if (this.settings.getValue('preprocess')) {
            data = preprocess(data);
        }

        // clear content from .nav and .inner
        this.sections.clear();
        this.clearContent();

        // setup nav panel default content
        let s = this.extractSections(data);
        // content returned from above will be panel contents
        let panels = this.panels.extract(s);

        // remove all panels
        this.removePanels();

        // render nav panel
        let c = document.querySelector(this.eid);
        let html = this.panels.getPanelHtml('🅖-nav');
        if (c !== null) c.innerHTML += html;

        // render section content
        c = document.querySelector(this.eidInner);
        let raw = this.settings.getValue('raw');
        raw = this.sections.setRaw(raw);
        // set current section based on url hash (or based on raw value)
        this.sections.setCurrent(Url.getHash());
        html = this.sections.getSectionHtml(raw);
        if (c !== null) c.innerHTML += html;

        this.renderVariableSpans(`${this.eidInner} .section *`);
        this.renderNav();
        this.updateUi();
    }

    removePanels() {
        const panels = this.wrapper.querySelectorAll('.panel');
        if (panels.length > 0) {
            panels.forEach((p) => {
                p.parentElement.removeChild(p);
            });
        }
    }

    loadDone() {
        // ONLY RUN WHEN THEME CHANGES
        if (this.status.has('theme-changed')) {
            this.extractCssVars();
            // update theme vars and render fields
            this.updateWrapperClasses();
            // render cssvars with extracted defaults
            this.renderThemeVars();
            // update fields from newly rendered theme vars
            this.updateFromCssVars();
            this.updateFromParams();
        }
        // ONLY RUN WHEN CONTENT CHANGES
        else if (this.status.has('content-changed')) {
            // complete initialization once everything is loaded
            this.status.add('done');
            // update theme vars and render fields
            this.renderThemeVars();
        }
        // ONLY RUN AT STARTUP
        else {
            this.extractCssVars();
            // complete initialization once everything is loaded
            this.status.add('done');
            this.updateUi();
            this.updateWrapperClasses();
            // update theme vars and render fields
            this.renderThemeVars();
            this.updateFromParams();
            // finally register events

        }
        this.registerEvents();
        this.executeCallback();
    }

    executeCallback() {
        // pass control back to user provided callback if it exists
        const callback = this.settings.getValue('callback');
        if (typeof callback == 'function') {
            callback.call();
            this.status.add('callback');
        }
    }

    // add or remove various section and mode related classes to wrapper
    updateWrapperClasses() {
        let wrapper = document.querySelector(this.eid);
        // add .gd-default class to wrapper if using default theme
        if (this.settings.getValue('css') === 'default') {
            wrapper.classList.add('gd-default');
        } else wrapper.classList.remove('gd-default');

        // add .gd-lyrics class to wrapper when using lyrics mode: heading=lyrics
        if (this.settings.getValue('heading') === 'lyrics') {
            wrapper.classList.add('gd-lyrics');
        }
    }

    updateUi() {

        /// clear any existing theme-var fields
        let v = document.querySelector(this.eid + ' .nav .theme-vars');
        if (v !== null) v.innerHTML = '';

        this.updateUiFromSettings();
        this.renderHighlight();

        // set current section and go there
        this.goToSection();

        // hide nav/nav panel if cap setting true
        if (this.settings.getValue('nav') === 'hide') {
            this.wrapper.classList.add('panels-hidden');
        }
    }

    updateUiFromSettings() {
        const elements = ['nav', 'help_ribbon'];
        elements.forEach(function (i) {
            if (this.settings.getValue('hide_' + i)) {
                const name = Helpers.cssId(i);
                const e = document.querySelector(`${this.eid} .${name}`);
                if (e !== null) e.parentNode.removeChild(e);
            }
        }, this);
        if (this.settings.getValue('disable_hide')) {
            const e = document.querySelector(`${this.eid} .hide`);
            if (e !== null) e.parentNode.removeChild(e);
        }
        if (this.settings.getValue('hideToc')) {
            const e = document.querySelector(`${this.eid} .nav .toc`);
            if (e !== null) e.parentNode.removeChild(e);
        }
    };

    // has-dom
    // called at start and when theme changes
    // renders html representing theme variables
    renderThemeVars() {
        let html = '';
        let $vars = this.wrapper.querySelector(`.nav .theme-vars`);
        if ($vars === null) return;
        // first ensure theme var section exists and that there's at least one cssVar
        const cssVars = this.settings.getSettings('cssvar');
        if (Object.keys(cssVars).length > 0) {
            for (const key in cssVars) {
                const value = cssVars[key];
                // check for existence of field provided through gdVar in user provided content
                let field = document.querySelector(`${this.eid} .nav .field.${key}`);
                // continue to next themeVar if field exists
                if (field !== null) continue;
                // check if cssvar's selector is applicable to current app
                const selector = '';
                if (selector === '') {
                    html += this.cssVarMarkup(key, value);
                } else {
                    // add field only if selector exists
                    let s = document.querySelector(selector);
                    if (s !== null) html += this.cssVarMarkup(key, value);
                }
            }
            let markup = new Markup();
            html = markup.getPanelContentMarkup(html);
            $vars.innerHTML = html;
        }
    }

    cssVarMarkup(key, value) {
        let markup = new Markup();
        let suffix = this.settings.getSuffix(key);

        // COLOR fields
        // handle field as Select if its name contains keyword 'color'
        // or if its value is in list of color names
        if (key.includes('color') || this.colorNames(true).includes(value)) {
            let m = key + ' `🅖-select`\n';
            m += '- initial\n';
            m += '- inherit\n';
            m += '- unset\n';
            m += '- currentColor\n';
            this.colorNames().forEach((item, i) => {
                if (value.toLowerCase() === item.toLowerCase()) {
                    m += `- *${item}\n`;
                } else m += `- ${item}\n`;
            });
            return m + '\n';
        }
        // HIGHLIGHT field
        else if (key === 'highlight') {
            let m = 'highlight `🅖-select`\n';
            this.highlightStyles().forEach((item, i) => {
                if (i === 0) m += `- *${item}\n`;
                else m += `- ${item}\n`;
            });
            return m + '\n';
        }
        // FONT field
        else if (key.endsWith('font')) {
            let m = key + ' `🅖-select`\n';
            let list = '- initial\n';
            list += '- inherit\n';
            list += '- unset\n';

            let categories = ['serif', 'sans-serif', 'monospace'];
            let valueArray = value.split(',');
            if (valueArray.length > 1) {
                valueArray.shift();
                categories = valueArray;
            }
            let gfonts = new GFonts();
            const gf = gfonts.getList();
            let items = [];
            categories.forEach(c => {
                // filter fonts with category c
                const filtered = Object.keys(gf).filter(f => {
                    if (gf[f].category === c.trim()) return f;
                });
                items = items.concat(filtered);
            });
            items.forEach(i => {
                list += `- ${i}\n`;
            });
            // remove quotes and use content preceding any commas as value
            let realValue = value.split(',')[0].replace(/['"]+/g, '');
            realValue = realValue.charAt(0).toUpperCase() + realValue.substr(1);
            list += `- *${realValue}\n`;
            m += list;
            return m + '\n';
        }
        // BLEND mode
        else if (key.includes('-blend')) {
            let m = key + ' `🅖-select`\n';
            m += '- normal\n';
            m += '- multiply\n';
            m += '- screen\n';
            m += '- overlay\n';
            m += '- darken\n';
            m += '- lighten\n';
            m += '- color-dodge\n';
            m += '- color-burn\n';
            m += '- hard-light\n';
            m += '- soft-light\n';
            m += '- difference\n';
            m += '- exclusion\n';
            m += '- hue\n';
            m += '- saturation\n';
            m += '- color\n';
            m += '- luminosity\n';
            m += '- initial\n';
            m += '- inherit\n';
            m += '- unset\n';
            return m;
        }

        // FILTER EFFECTS
        else if (key.includes('blur')) {
            let m = `${key} \`🅖-slider="${parseInt(value)},0,20,0.5,px"\`\n`;
            return m + '\n';
        }
        else if (key.includes('brightness')) {
            let m = `${key} \`🅖-slider="${parseInt(value)},1,3,0.05"\`\n`;
            return m + '\n';
        }

        // TRANSFORMS
        else if (key.includes('translate')) {
            let m = `${key} \`🅖-slider="${parseInt(value)},-2000,2000,1,px"\`\n`;
            return m + '\n';
        }
        else if (key.includes('scale')) {
            let m = `${key} \`🅖-slider="${parseFloat(value)},0.15,30,0.1"\`\n`;
            return m + '\n';
        }
        else if (key.includes('perspective')) {
            let m = `${key} \`🅖-slider="${parseInt(value)},100,2000,1,px"\`\n`;
            return m + '\n';
        }
        // PERCENTAGE-based values like fontsize
        else if (suffix === '%') {
            let m = `${key} \`🅖-slider="${parseInt(value)},0,300,1,%"\`\n`;
            return m + '\n';
        }

        // PX and EM based values
        else if (suffix.toLowerCase() === 'px') {
            let m = `${key} \`🅖-slider="${parseInt(value)},0,2000,1,px"\`\n`;
            return m + '\n';
        }
        else if (suffix.toLowerCase() === 'em') {
            let m = `${key} \`🅖-slider="${parseInt(value)},0,400,1,em"\`\n`;
            return m + '\n';
        }
        // DEGREE-based values (rotation-based params like rotateX)
        else if (suffix.toLowerCase() === 'deg') {
            let m = `${key} \`🅖-slider="${parseInt(value)},0,360,1,deg"\`\n`;
            return m + '\n';
        }

    }

    // returns an array of color names to be used in select fields
    colorNames(lowercase) {
        let l = ["AliceBlue", "AntiqueWhite", "Aqua", "Aquamarine", "Azure", "Beige", "Bisque", "Black", "BlanchedAlmond", "Blue", "BlueViolet", "Brown", "BurlyWood", "CadetBlue", "Chartreuse", "Chocolate", "Coral", "CornflowerBlue", "Cornsilk", "Crimson", "Cyan", "DarkBlue", "DarkCyan", "DarkGoldenRod", "DarkGray", "DarkGrey", "DarkGreen", "DarkKhaki", "DarkMagenta", "DarkOliveGreen", "Darkorange", "DarkOrchid", "DarkRed", "DarkSalmon", "DarkSeaGreen", "DarkSlateBlue", "DarkSlateGray", "DarkSlateGrey", "DarkTurquoise", "DarkViolet", "DeepPink", "DeepSkyBlue", "DimGray", "DimGrey", "DodgerBlue", "FireBrick", "FloralWhite", "ForestGreen", "Fuchsia", "Gainsboro", "GhostWhite", "Gold", "GoldenRod", "Gray", "Grey", "Green", "GreenYellow", "HoneyDew", "HotPink", "IndianRed", "Indigo", "Ivory", "Khaki", "Lavender", "LavenderBlush", "LawnGreen", "LemonChiffon", "LightBlue", "LightCoral", "LightCyan", "LightGoldenRodYellow", "LightGray", "LightGrey", "LightGreen", "LightPink", "LightSalmon", "LightSeaGreen", "LightSkyBlue", "LightSlateGray", "LightSlateGrey", "LightSteelBlue", "LightYellow", "Lime", "LimeGreen", "Linen", "Magenta", "Maroon", "MediumAquaMarine", "MediumBlue", "MediumOrchid", "MediumPurple", "MediumSeaGreen", "MediumSlateBlue", "MediumSpringGreen", "MediumTurquoise", "MediumVioletRed", "MidnightBlue", "MintCream", "MistyRose", "Moccasin", "NavajoWhite", "Navy", "OldLace", "Olive", "OliveDrab", "Orange", "OrangeRed", "Orchid", "PaleGoldenRod", "PaleGreen", "PaleTurquoise", "PaleVioletRed", "PapayaWhip", "PeachPuff", "Peru", "Pink", "Plum", "PowderBlue", "Purple", "Red", "RosyBrown", "RoyalBlue", "SaddleBrown", "Salmon", "SandyBrown", "SeaGreen", "SeaShell", "Sienna", "Silver", "SkyBlue", "SlateBlue", "SlateGray", "SlateGrey", "Snow", "SpringGreen", "SteelBlue", "Tan", "Teal", "Thistle", "Tomato", "Turquoise", "Violet", "Wheat", "White", "WhiteSmoke", "Yellow", "YellowGreen"];
        if (lowercase) {
            l = l.map(function (x) { return x.toLowerCase() });
        }
        return l;
    }

    // returns an array of color names to be used in select fields
    highlightStyles() {
        return ["none", "default", "agate", "androidstudio", "arduino-light", "arta", "ascetic", "atelier-cave-dark", "atelier-cave-light", "atelier-dune-dark", "atelier-dune-light", "atelier-estuary-dark", "atelier-estuary-light", "atelier-forest-dark", "atelier-forest-light", "atelier-heath-dark", "atelier-heath-light", "atelier-lakeside-dark", "atelier-lakeside-light", "atelier-plateau-dark", "atelier-plateau-light", "atelier-savanna-dark", "atelier-savanna-light", "atelier-seaside-dark", "atelier-seaside-light", "atelier-sulphurpool-dark", "atelier-sulphurpool-light", "atom-one-dark", "atom-one-light", "brown-paper", "codepen-embed", "color-brewer", "darcula", "dark", "darkula", "default", "docco", "dracula", "far", "foundation", "github-gist", "github", "googlecode", "grayscale", "gruvbox-dark", "gruvbox-light", "hopscotch", "hybrid", "idea", "ir-black", "kimbie.dark", "kimbie.light", "magula", "mono-blue", "monokai-sublime", "monokai", "obsidian", "ocean", "paraiso-dark", "paraiso-light", "pojoaque", "purebasic", "qtcreatorDark", "qtcreatorLight", "railscasts", "rainbow", "routeros", "school-book", "solarized-dark", "solarized-light", "sunburst", "tomorrow-night-blue", "tomorrow-night-bright", "tomorrow-night-eighties", "tomorrow-night", "tomorrow", "vs", "vs2015", "xcode", "xt256", "zenburn"];
    }

    // to help with incorrectly formatted Markdown (which is common)
    preprocess(data) {
        let processed = '';
        const lines = data.split('\n');
        lines.forEach((val) => {
            // start by checking if # is the first character in the line
            if (val.charAt(0) === '#') {
                const x = Helpers.find_first_char_not('#', val);
                if (x > 0) {
                    const c = val.charAt(x);
                    // check if character is a space
                    if (c != ' ') {
                        val = [val.slice(0, x), ' ', val.slice(x)].join('');
                    }
                }
            } else if (val.charAt(0) === '-') {
                // add space after - where needed
                if (val.charAt(1) != '-' && val.charAt(1) != ' ') {
                    val = [val.slice(0, 1), ' ', val.slice(1)].join('');
                }
            }
            processed += val + '\n';
        });
        return processed;
    };

    // has-dom
    // dom function to update html classes whenever active section changes
    goToSection() {

        // update wrapper with current-section class
        if (this.wrapper != null) {
            this.removeClassByPrefix(this.wrapper, 'current-');
            this.wrapper.classList.add('current-' + this.sections.getCurrent());
        }

        // remove all occurrences of current, past, hi and lo classes
        this.wrapper.querySelectorAll('section').forEach(s => {
            s.classList.remove('current', 'past', 'hi', 'lo');
        });

        // return if section is raw code (rather than markdown content)
        if (this.sections.isRaw()) return;

        // update past section classes
        this.addSectionClasses(false);
        // update current section classes
        this.addSectionClasses(true);

        // todo
        // update toc

    };

    // has-dom
    // returns classes for either .current section or .past section
    // depending on @isCurrent boolean value
    addSectionClasses(isCurrent) {
        let id = '';
        if (isCurrent) id = this.sections.getCurrent();
        else id = this.sections.getPast();
        if (id === undefined) return;
        if (id === '🅖0') return;
        const classes = this.sections.getClasses(id);
        let $s = this.wrapper.querySelector('section#' + id);
        if (classes.length > 0) $s.classList.add(...classes);
    }

    renderThemeCss(css) {
        // first remove existing theme
        let el = document.querySelector('#gd-theme-css');
        if (el !== null) el.parentNode.removeChild(el);

        if (css === '') {
            this.settings.setValue('css_filename', 'style.css');
            this.settings.setValue('css', 'default');
        } else {
            // when using a local css file, get the theme name
            let id = this.settings.getValue('css');
            for (const key in this.exampleThemes) {
                if (this.exampleThemes[key] === id) {
                    this.settings.setValue('css_filename', key);
                }
            }

            // create style tag with css content
            this.appendStyle('style', 'gd-theme-css', css);
        }
        // store cleaned css in browser
        window.localStorage.setItem('gdTheme', css);
        this.status.add('css');
    };

    // we can later use this function to allow use apart from GitHub
    gistUrl(file, frontEnd) {
        if (frontEnd) {
            return `//github.com${this.path}master/${file}"`;
        } else {
            return `//github.com${this.path}blob/master/${file}`;
        }
    }

    getFieldTypeFromName(name) {
        const type = name.split('_');
        if (type.length > 1) {
            const types = ['slider', 'select', 'collapsible', 'datalist'];
            if (types.indexOf(type[0]) !== -1) {
                return type[0];
            }
        }
        return '';
    }

    renderVariableSpans(container) {
        const variables = this.getVariablesFromComments(container);
        variables.forEach((v) => {
            const variable = v[0], el = v[1];
            const result = this.variableSpanHtml(variable, el);
            if (result.length < 1) return;
            el.innerHTML = result;
        });
    }

    getVariablesFromComments(container) {
        let result = [];
        const c = document.querySelectorAll(container);
        c.forEach((el) => {
            el.childNodes.forEach((node) => {
                if (node.nodeType === Node.COMMENTNODE) {
                    let v = this.extractVariable(node.nodeValue);
                    result.push([Helpers.clean(v), el]);
                }
            });
        });
        return result;
    };

    getVariableName(v) {
        if (!v.startsWith('gd_')) return '';
        const start = 0;
        const index = v.substring(start).search(/[^A-Za-z_-]/);
        if (index < 0) return v;
        return v.substring(0, index);
    }

    variableSpanHtml(v, t) {
        const vName = this.getVariableName(v);
        // ensure the variable isn't blank and that it is allowed
        if (vName === '' || !this.isParamAllowed(vName)) return [];
        const value = Helpers.getVariableAssignment(v);
        let dataValue = '';
        if (value !== '') dataValue = `data-value="${value}"`;
        let html = `<span class="gd-var" name="${vName}" ${dataValue}></span>`;
        return html;
    };

    // simple functin to get variable content between open and close symbols
    //
    // content: content to parse for variable
    // open: characters preceding the variable
    // close: characters closing the variable
    extractVariable(content, open = '{$', close = '}') {
        let v = content.split(open);
        if (v.length < 2) return '';
        v = v[1].split(close);
        if (v.length < 2) return '';
        return v[0];
    };

    // simple helper to reduce repitition for getting datalist class
    getDatalistClass(c) {
        return c.closest('.field.datalist').getAttribute('data-name');
    }

    renderNav() {

        // first create .unhide div used to unhide the panel on mobile
        var fullscreen = document.querySelector(this.eid + ' .fullscreen');
        if (fullscreen === null) {
            let divs = `<div class="unhide"></div><div class="fullscreen"></div>`;
            document.querySelector(this.eid).innerHTML += divs;
        }

        // update TOC
        this.renderToc();
    };

    datalistChanged(type, id) {
        this.settings.setValue(type, id);
        this.updateQueryString();
        this.status.add('var-updated');
        if (type === 'css') {
            this.status.remove('css,done,changed');
            this.status.add('theme-changed');
            this.settings.delete('cssvar');
            this.loop();
        } else if (type === 'content') {
            this.status.remove('content,done,changed');
            this.status.add('content-changed');
            this.loop();
        } else {
            this.status.remove('changed');
            this.status.add(type + '-changed');
            this.executeCallback();
        }
    }

    updateFromCssVars() {
        let cssVars = this.settings.get('cssvar');
        const doc = document.documentElement.style;
        let gfonts = new GFonts();
        cssVars.forEach(e => {
            let value = e.value;
            // when loading a new user provided theme, we'll want to set value as default
            if (e.type === 'cssvar-user') value = e.default;
            // special consideration for font names
            if (e.name.endsWith('font')) {
                value = gfonts.getName(value);
            }
            doc.setProperty(`--${e.name}`, value + e.suffix);
        });
    }

    updateCssVar(name, suffix) {
        let cssVars = this.settings.getSettings('cssvar');
        const doc = document.documentElement.style;
        if (name in cssVars) {
            // update field with specified name if it exists in cssVars
            let value = this.settings.getValue(name, cssVars[name]);
            // special consideration for font names
            let gfonts = new GFonts();
            if (name.endsWith('font')) value = gfonts.getName(value);
            doc.setProperty(`--${name}`, value + suffix);
        }
    }

    // helper to remove or toggle visible class for specified elements
    hide(elements, remove) {
        if (remove === null) remove = false;
        [].map.call(document.querySelectorAll(elements), (el) => {
            if (remove) {
                el.classList.remove('visible');
            } else el.classList.toggle('visible');
        });
    }

    // s: wrapper selector within which to register newly created fields
    registerFieldEvents(s) {

        // SLIDER FIELDS
        this.events.add('.field.slider input', 'input', e => {
            const name = e.target.getAttribute('name');
            let suffix = e.target.getAttribute('data-suffix');
            if (suffix === undefined) suffix = '';
            const value = e.target.value;
            e.target.setAttribute('value', value);
            e.target.parentElement.setAttribute('data-value', value);
            this.settings.setValue(name, value);
            this.updateQueryString();
            this.status.add('var-updated');
            this.updateCssVar(name, suffix);
        });

        this.events.add('.field.slider input', 'mouseup', e => {
            const name = e.target.getAttribute('name');
            if (e.which == 2) {
                // reset to default value on middle click
                const defaultValue = this.settings.getDefault(name);
                this.updateField(this, parseFloat(defaultValue));
            }
        });

        // TEXTINPUT FIELDS
        this.events.add('.field.textinput input', 'input', e => {
            this.updateField(e.target);
        });

        // SELECT FIELDS
        this.events.add('.field.select select', 'change', e => {
            this.updateField(e.target);
        });

        // COLLAPSIBLE FIELDS
        this.events.add('.field.collapsible .header', 'click', e => {
            e.target.parentNode.classList.toggle('collapsed');
        });

        // DATALIST FIELDS
        this.events.add('.field.datalist input', 'input', e => {
            // get field details
            let value = e.target.value;
            if (value === '') value = 'Default';
            this.datalistChanged(e.target.name, value);
        });

        this.events.add('.field.datalist input', 'mouseenter', e => {
            // get selected option
            const name = e.target.getAttribute('name');
            const value = this.settings.getValue(name);
            e.target.setAttribute('data-value', value);
            e.target.value = '';
        });

        this.events.add('.field.datalist input', 'mouseleave', e => {
            e.target.value = e.target.getAttribute('data-value');
        });

        this.events.add('.field.datalist input', 'mouseup', e => {
            const v = e.target.getAttribute('data-value');
            let url = '';
            // open new tab based on selected item
            if (e.ctrlKey) {
                let o = `#${e.target.name} option[value="${v}"]`;
                let option = this.wrapper.querySelector(' ' + o);
                if (option === null) return;
                url = option.getAttribute('data-href');
                window.open(url, 'Blank').focus();
            }
        });

    }

    updateField(field, value) {
        let name = field.parentElement.getAttribute('data-name');
        if (value === undefined) {
            // this indicates user initiated action so we'll update status
            this.status.add('var-updated');
            value = field.value;
        }
        field.value = value;
        this.settings.setValue(name, value);
        // load user provided highlight style
        if (name === 'highlight') this.renderHighlight();
        // handle suffix values
        let suffix = field.getAttribute('data-suffix');
        if (suffix === null) suffix = '';
        this.updateCssVar(name, suffix);
        // special consideration for font names
        if (name.endsWith('font')) {
            let gfonts = new GFonts();
            value = gfonts.update(value);
        }
        // update slider:after content
        field.parentElement.setAttribute('data-value', value);
        // update query string when changes are made after app is loaded
        if (this.status.has('callback')) this.updateQueryString();
    }

    registerEvents() {

        // register field events
        this.registerFieldEvents(this.eid + ' .nav');

        // handle history
        window.addEventListener('popstate', e => {
            // update current section with browser hash
            this.sections.setCurrent(Url.getHash());
            this.goToSection();
        });

        // FULLSCREEN
        this.events.add('.fullscreen', 'click', e => {
            var fs = document.documentElement;
            this.toggleFullscreen(fs);
        });

        // HIDE
        this.events.add('.nav .hide', 'click', e => {
            this.wrapper.classList.toggle('panels-hidden');
        });

        // UNHIDE
        this.events.add('.unhide', 'click', e => {
            this.wrapper.classList.remove('panels-hidden');
        });

        // check for focus and apply keystrokes to appropriate wrapper div
        // to allow for more than one .gd wrapper per page
        const body = document.querySelector('body');
        body.onkeydown = e => {
            if (!e.metaKey && e.which > 111 && e.which < 114) {
                e.preventDefault();
            }
            if (e.which === 112) {
                // F1 key to hide/unhide nav panel
                this.wrapper.classList.toggle('panels-hidden');
            } else if (e.which === 113) {
                // F2 key to dock/undock
                this.wrapper.classList.toggle('panels-docked');
            }
        };

        /* Cross-window messaging */

        // send Ready message to whatever window opened this app
        if (!this.status.has('done') && window.opener != null) {
            window.opener.postMessage('Ready.', this.settings.getValue('origin '));
        }

        // listen for return messages from parent window
        window.addEventListener('message', function (event) {
            var o = this.settings.getValue('origin');
            if (o === '*' || event.origin === o) {
                if (event.data === 'Ready.') {
                    //
                } else {
                    // we've received content so render it
                    var data = JSON.parse(event.data);
                    this.log('Received data from GitHub.');
                    sections = [];
                    // clear content from .nav and .inner
                    var e = document.querySelector(eid + ' .nav');
                    if (e !== null) e.innerHTML = '';
                    e = document.querySelector(eidInner);
                    if (e !== null) e.innerHTML = '';
                    var content = data.content + '\n';// + this.navContent;
                    window.localStorage.setItem('gdContent', content);
                    this.renderContent(content);
                }
            }
        }, false);

    };

}

/*
    SSSSS  TTTTTTT   AAA   TTTTTTT UU   UU  SSSSS
    SS        TTT    AAAAA    TTT   UU   UU SS
    SSSSS    TTT   AA   AA   TTT   UU   UU  SSSSS
        SS   TTT   AAAAAAA   TTT   UU   UU      SS
    SSSSS    TTT   AA   AA   TTT    UUUUU   SSSSS
*/

/**
    Simple way to track loading process
    @param {string} flags initial flags to set

    this.flags = [
        'initial',         initial readme content loaded
        'css',             css loaded (either user-provided or base theme)
        'content',         user-specified content loaded (applicable only if user provides url)
        'done',            all content and css fully loaded
        'callback'         call to user-provided callback made, added AFTER callback completed
        'content-changed'  app loaded and user selected different content
        'theme-changed'    app loaded and user selected different theme
        'var-updated'      app loaded and user has made an update to a css variable field
    ];
*/
class Status {

    constructor(f = []) {
        this.flags = f;
    }

    log() {
        this.log(this.flags);
        return this;
    }

    add(flag) {
        flag.split(',').forEach((e) => {
            if (this.flags.indexOf(e) === -1) this.flags.push(e);
        });
        return this;
    }

    remove(flag) {
        flag.split(',').forEach((e) => {
            if (e === 'changed') {
                // iterate over this.flags and remove occurences of -changed
                this.flags.forEach((val, i) => {
                    if (val.indexOf('-changed') !== -1) {
                        this.flags.splice(i, 1);
                    }
                });
            } else {
                let i = this.flags.indexOf(e);
                if (i !== -1) this.flags.splice(i, 1);
            }
        });
        return this;
    }

    has(flag) {
        if (flag === 'changed') {
            // return true if any flags have text '-changed'
            const f = this.flags.find(function (e) {
                return e.includes('-changed');
            });
            if (!f) return false;
            return true;
            // iterate over user provided flag and return true if they're all in status.flags
        } else {
            let result = false;
            flag.split(',').forEach(e => {
                let i = this.flags.indexOf(e);
                if (i !== -1) {
                    result = true;
                } else return result = false;
            });
            return result;
        }
    }

}

/*
    SSSSS  EEEEEEE TTTTTTT TTTTTTT IIIII NN   NN   GGGG   SSSSS
    SS      EE        TTT     TTT    III  NNN  NN  GG  GG SS
    SSSSS  EEEEE     TTT     TTT    III  NN N NN GG       SSSSS
        SS EE        TTT     TTT    III  NN  NNN GG   GG      SS
    SSSSS  EEEEEEE   TTT     TTT   IIIII NN   NN  GGGGGG  SSSSS
*/

/**
    Centralized handler for app settings and default values
    @param {object} options user provided initial settings
*/
class Settings {

    constructor(options, parametersProtected) {
        this.initialOptions = options;
        this.settings = this.initialSettings();
        this.parametersProtected = parametersProtected;
    }

    reset() {
        this.settings = this.initialSettings();
    }

    getParamValue(name) {
        name = name.toLowerCase();
        const setting = this.settings.find(i => i.name === name);
        if (setting === undefined) return undefined;
        // maybe first check url param to see if it's different from stored value
        // then update the stored value
        return setting.paramValue;
    }

    setParamValue(name, value) {
        name = name.toLowerCase();
        const setting = this.settings.find(i => i.name === name);
        // if setting doesn't exist, we'll want to add it along with paramValue
        if (setting === undefined) return false;
        let suffix = Helpers.extractSuffix(value);
        if (suffix !== '' && typeof value === 'string') {
            value = Number(value.split(suffix)[0]);
        }
        setting.suffix = suffix;
        return setting.paramValue = value;
    }

    // returns true when a setting should be included in newly constructed url query params
    isInQuerystring(name) {
        const setting = this.settings.find(i => i.name === name);
        if (setting === undefined) return false;
        return this.shouldInclude(setting);
    }

    // helper function to determine if a setting should be included in query string
    shouldInclude(setting) {
        const name = setting.name;
        const value = String(setting.value);
        const defaultValue = String(setting.default);
        const suffix = setting.suffix;

        if (value === '') return;

        // exclude names with hid- prefix
        if (name.includes('hid-')) return false;

        // exclude any settings with Filename for now
        if (name.includes('filename')) return false;

        // exclude setting if its value = defaultValue
        if (value + suffix == defaultValue) return false;
        if (this.equals(value, defaultValue)) return false;

        // exclude protected params
        if (this.isNotAllowed(name)) return;

        return true;
    }

    equals(v1, v2) {
        if (v1 === v2) return true;
        if (typeof v1 === 'string') {
            if (typeof v2 === 'string') {
                if (v1.toLowerCase() === v2.toLowerCase()) {
                    return true;
                }
            }
        }
        return false;
    }

    isNotAllowed(name) {
        // exclude protected params
        let p = this.parametersProtected.split(',');
        if (p.includes(name)) return true;
        // exclude params
        p = this.getValue('parameters_disallowed').split(',');
        if (p.includes(name)) return true;

        return false;
    }

    // returns a string of settings in url parameter format
    toString() {
        let count = 0;
        let result = '';
        for (const i in this.settings) {
            if (this.shouldInclude(this.settings[i])) {
                const s = this.settings[i];
                if (count > 0) result += '&';
                result += `${s.name}=${s.value}`;
                count += 1;
            }
        }
        return result;
    }

    // delete settings of specified type
    delete(type) {
        let result = [];
        for (const i in this.settings) {
            const s = this.settings[i];
            if (type !== undefined && !s.type.startsWith(type)) {
                result.push(s);
            }
        }
        this.settings = result;
    }

    // return a key/value array of settings of specified type without defaults
    getSettings(type) {
        let result = [];
        for (const i in this.settings) {
            const s = this.settings[i];
            if (type === undefined) {
                result[s.name] = s.value;
            } else if (s.type.startsWith(type)) {
                result[s.name] = s.value;
            }
        }
        return result;
    }

    get(type) {
        return this.settings.filter(i => i.type.startsWith(type));
    }

    // return a setting's value by specified setting name
    getValue(name) {
        name = name.toLowerCase();
        const key = this.settings.find(i => i.name === name);
        if (key === undefined) return undefined;
        return key.value;
    }

    // returns the default value for a specific setting by name
    getDefault(name) {
        name = name.toLowerCase();
        const key = this.settings.find(i => i.name === name);
        if (key === undefined) return undefined;
        return key.default;
    }

    // set a value by specified setting name
    setDefault(name, value) {
        name = name.toLowerCase();
        const key = this.settings.find(i => i.name === name);
        if (key === undefined) return false;
        let suffix = Helpers.extractSuffix(value);
        if (suffix !== '' && typeof value === 'string') {
            value = Number(value.split(suffix)[0]);
        }
        key.suffix = suffix;
        return key.default = value;
    }

    getSuffix(name) {
        name = name.toLowerCase();
        const key = this.settings.find(i => i.name === name);
        if (key === undefined) return undefined;
        return key.suffix;
    }

    getType(name) {
        name = name.toLowerCase();
        const key = this.settings.find(i => i.name === name);
        if (key === undefined) return false;
        return key.type;
    }

    addSetting(name, value, type) {
        name = name.toLowerCase();
        let suffix = Helpers.extractSuffix(value);
        if (suffix !== '' && typeof value === 'string')
            value = Number(value.split(suffix)[0]);
        const setting = {
            name: name,
            value: value,
            default: undefined,
            paramValue: undefined,
            type: type,
            suffix: suffix
        }
        this.settings.push(setting);
        return setting;
    }

    setType(name, type) {
        const key = this.settings.find(i => i.name === name);
        if (key === undefined) return undefined;
        return key.type = type;
    }

    // set a value by specified setting name
    setValue(name, value, type) {
        name = name.toLowerCase();
        if (type === undefined) type = 'var';
        // find setting
        const key = this.settings.find(i => i.name === name);
        // push new setting to array if it doesn't already exist
        if (key === undefined) return this.addSetting(name, value, type);
        // revert type when user provides gd-var with same name as a cssvar
        if (type.startsWith('cssvar')) key.type = type;
        // return value already stored in settings if param is disallowed or protected
        if (this.isNotAllowed(name)) return key.value;
        // set suffix and value, then return the entire setting as key
        // key.suffix = suffix;
        key.value = value;
        // otherwise if key already exists, just update the value
        return key;
    }

    initialSettings() {
        let result = [];
        const defaults = {
            initial: 'README.md',    // initial content, either a local filename or 'HTML'
            header: 'h1',            // element to use for header
            heading: 'h2',           // element to use for sections
            inner: 'inner',          // inner container for styling
            content: 'default',
            content_filename: '',
            gist: 'default',
            css: 'default',
            css_filename: '',
            highlight: 'default',
            preprocess: false,
            nav: 'show',

            // set false to not render markdown
            raw: false,

            // defaults unavailable as url parameters
            title: 'GitDown',
            hide_nav: false,
            hide_help: false,
            hideToc: false,
            disable_hide: false,
            parameters_disallowed: 'initial,title,disable_hide,hide_any,adsense',

            // GitDown stores a bunch of examples by default
            // set these to false to not merge them into sub-app
            mergeThemes: true,

            origin: '//ugotsta.github.io',
        };

        // merge user pvovided options, these options will become new defaults
        for (const key in this.initialOptions) {
            defaults[key] = this.initialOptions[key];
        }

        // now we'll create an object, assign defaults and return it
        for (const key in defaults) {
            const setting = {
                name: key,                  // variable name
                value: defaults[key],       // current value
                default: defaults[key],     // default value provided by cssvars
                type: 'core',               // type = ['core', 'var', cssvar', 'cssvar-user']
                suffix: '',                 // for numeric vars: px, em, &
                paramValue: undefined      // has a value only if user provides it through url query param
            }
            result.push(setting);
        }
        return result;
    }

}

/*
    PPPPPP    AAA   NN   NN EEEEEEE LL       SSSSS
    PP   PP  AAAAA  NNN  NN EE      LL      SS
    PPPPPP  AA   AA NN N NN EEEEE   LL       SSSSS
    PP      AAAAAAA NN  NNN EE      LL           SS
    PP      AA   AA NN   NN EEEEEEE LLLLLLL  SSSSS
*/

/**
    Handler for nav panel contents

    imports Markup, Helpers
*/
class Panels {

    // this.panels is an array of section arrays
    // [
    //   [ [heading, content], [h, c], [h, c] ],
    //   [ [h, c] ],
    //   [ [h, c], [h, c] ]
    // ]
    constructor() {
        this.panels = [];
    }

    /**
     * Accepts array of [heading,content] and breaks it into panel sections
     * @param {string} content content to break into panels
     */
    extract(content) {
        let count = 0;
        let p = [];
        content.forEach(s => {
            let h = s[0];
            let c = s[1];
            if (h.includes('`🅖-panel') || h.includes('`🅖-nav')) {
                // push stored panel content to this.panels if it's not empty
                if (p.length > 0) this.panels.push(p);
                // reset panel array
                p = [];
            }
            p.push([h, c]);
        });
        if (p.length > 0) this.panels.push(p);
        return this.panels;
    }

    getRaw(panel) {
        let result = '';
        if (panel === undefined) {
            // iterate over panels
            this.panels.forEach(p => {
                // iterate over panel sections
                p.forEach(s => {
                    result += s[0] + '\n';
                    result += s[1] + '\n';
                });
            });
        } else {
            let p = this.panels.find(p => {
                let first = p[0];
                let h = first[0];
                return h.includes('`' + panel);
            });
            p.forEach(s => {
                result += s[0] + '\n';
                result += s[1] + '\n';
            });
        }
        return result;
    }

    // returns html for entire panel
    getPanelHtml(panel) {
        let markup = new Markup();
        let result = '<div class="nav panel visible">';
        let p = this.panels.find(p => {
            let first = p[0];
            let h = first[0];
            return h.includes('`' + panel);
        });
        p.forEach(s => {
            result += markup.getPanelMarkup(s);
        });
        result += '</div>';
        return result;
    }

    navDefault() {
        let nav = [];
        let c = '';
        h += '# ' + this.settings.setting['title'] + ' `🅖-nav`';
        c += 'Experimental web app framework\n\n';
        c += 'Content `🅖-content`\n';
        c += '- [Alexa Cheats](https://gist.github.com/2a06603706fd7c2eb5c93f34ed316354)\n';
        c += '- [Vim Cheats](https://gist.github.com/c002acb756d5cf09b1ad98494a81baa3)\n';
        nav.push(h, c);

        h += '## Theme `🅖-collapsible-group`';
        c += 'Themes `🅖-css`\n';
        c += '- [Dark Glow](https://gist.github.com/c6d0a4d16b627d72563b43b60a164c31)\n\n';
        c += '`🅖-theme-variables`\n';
        nav.push(h, c);

        h += '## Contents `🅖-collapsible-group`';
        c += 'TOC `🅖-toc`\n';
        nav.push(h, c);

        h += '## Help `🅖-group`';
        c += '`🅖-help`';
        c += '`🅖-hide`';
        nav.push(h, c);

        return nav;
    }

}

/*
    HH   HH EEEEEEE LL      PPPPPP  EEEEEEE RRRRRR   SSSSS
    HH   HH EE      LL      PP   PP EE      RR   RR SS
    HHHHHHH EEEEE   LL      PPPPPP  EEEEE   RRRRRR   SSSSS
    HH   HH EE      LL      PP      EE      RR  RR       SS
    HH   HH EEEEEEE LLLLLLL PP      EEEEEEE RR   RR  SSSSS
*/

/**
    Utility class for static helper functions used across other classes
*/
class Helpers {

    constructor() {
    }

    // simple function to get variable assignment values (ie. x="hello")
    static getVariableAssignment(v) {
        let result = '';
        const assignment = v.split('=');
        if (assignment.length > 1) result = assignment[1].substring(1);
        return result.substring(0, result.length - 1);
    }

    // helper function to determine if a line is a heading
    static isHeading(line, nextLine, inBlock) {
        const x = Helpers.find_first_char_not('#', line);
        if (inBlock) return false;
        if (nextLine.startsWith('---')) {
            if (!line.startsWith('```') && line.length > 1) {
                return true;
            }
        }
        if (nextLine.startsWith('===')) {
            if (!line.startsWith('```') && line.length > 1) {
                return true;
            }
        }
        if (x < 1) return false;
        if (x > 7) return false;
        if (line.charAt(x) !== ' ') return false;
        return true;
    }

    // returns version of l only with contents between open and close strings
    static between(open, l, close) {
        return l.substring(l.indexOf(open) + 1, l.indexOf(close));
    }

    // used to merge example arrays or arrays of markdown links based on link titles
    static mergeExamples(a1, a2) {
        let result = a2;
        a1.forEach(a1i => {
            let found = a2.find(a2i => {
                let name1 = Helpers.between('[', a1i, ']');
                let name2 = Helpers.between('[', a2i, ']');
                return name1.toLowerCase() === name2.toLowerCase();
            });
            if (found) return;
            result.push(a1i);
        });
        return result;
    }

    // sanitize provided @str
    // this function will be the sole way to clean content throughout core
    // so by using a single method, we'll be able to change the means of sanitizing later
    static clean(str) {
        const parser = new HtmlWhitelistedSanitizer(true);
        return parser.sanitizeString(str);
    }

    // generates CSS id from string, for use with heading
    static cssId(str) {
        str = Helpers.replaceCodes(str);
        // remove non-alphanumerics
        str = str.replace(/[^a-zA-Z0-9_\s-]/g, '-');
        // clean up multiple dashes or spaces
        str = str.replace(/[\s-]+/g, ' ');
        // remove leading and trailing spaces
        str = str.trim();
        // convert spaces and underscores to dash
        str = str.replace(/[\s_]/g, '-');
        return str.toLowerCase();
    }

    // strip a string of code blocks like `🅸-Intro`
    static replaceCodes(str) {
        str = str.replace('🅸', 'i-');
        // replace enclosed code blocks `code`
        return str.replace(/`(.*?)`/g, '');
    }

    static extractSuffix(s) {
        if (s === null) return '';
        // if it's not a string, it has no suffix so just return
        if (typeof s !== 'string') return '';
        // we'll set a feasible limit here,
        // numbers larger than 8 digits should be very rare
        if (s.length > 8) return '';
        if (s.match(/[+-]?\d+(?:\.\d+)?/)) {
            return s.replace(/[+-]?\d+(?:\.\d+)?/g, '');
        }
        return '';
    }

    // returns real name of string, assuming it's a section heading
    static realName(str) {
        // remove leading and trailing spaces
        str = str.trim();
        let i = Helpers.find_first_char_not('#', str);
        str = Helpers.replaceCodes(str);
        str = str.substr(i).trim();
        return str;
    }

    // find first character in str that is not char and return its location
    static find_first_char_not(char, str) {
        for (var i = 0; i < str.length; i++) {
            if (str[i] != char) return i;
        }
        return -1;
    };

    // accepts section array @s which includes heading and content [h,c]
    // returns heading level (h1, h2, h3) based on leading HR or ### counter
    static getHlevel(s) {
        let c = s[1];
        if (c === undefined) return 0;
        if (c.startsWith('---')) return 2;
        else if (c.startsWith('===')) return 1;
        else return Helpers.find_first_char_not('#', s[0]);
    }

}

/*
    MM    MM   AAA   RRRRRR  KK  KK UU   UU PPPPPP
    MMM  MMM  AAAAA  RR   RR KK KK  UU   UU PP   PP
    MM MM MM AA   AA RRRRRR  KKKK   UU   UU PPPPPP
    MM    MM AAAAAAA RR  RR  KK KK  UU   UU PP
    MM    MM AA   AA RR   RR KK  KK  UUUUU  PP
*/

/**
    Utility class used throughout app to get markup content.
    The class provides an easy path to utilizing other libraries,
    such as React or Vue, as well as regular HTML.
*/
class Markup {

    constructor() {
    }

    // returns full line in c that includes tag
    extractLine(c, tag) {
        let lines = c.split('\n');
        return lines.find(l => {
            return l.includes(tag);
        });
    }

    // extract slider values from content `🅖-slider="100%,0,300,1,%"`
    extractSlider(c) {
        let i = c.match(/".*?"/);
        if (i === null) return null;
        // remove first and last chars
        i = i[0].substr(1);
        i = i.substr(0, i.length - 1);
        i = i.split(',');
        let suffix = Helpers.extractSuffix(i[0]);
        if (i.length < 5) i.push(suffix);
        return i;
    }

    // takes an array of list items as strings and returns <option> list
    listMarkup(list, type) {
        let items = '';
        list.forEach(l => {
            if (type === '`🅖-datalist') {
                let n = Helpers.between('[', l, ']');
                let id = Helpers.cssId(n);
                let href = Helpers.between('(', l, ')');
                if (href.includes('gist.github.com/')) {
                    id = href.split('gist.github.com/')[1];
                }
                // if href is a bare gist id, adjust id
                if (!href.includes('.com')) {
                    id = href;
                }
                items += `<option value="${id}" data-href="${href}">${n}</option>\n`;
            } else if (type === '`🅖-select') {
                let selected = '';
                if (l.startsWith('*')) {
                    selected = ' selected';
                    l = l.substr(1);
                }
                items += `<option value="${l}" ${selected}>${l}</option>\n`;
            }
        });
        return items;
    }

    // right now we're converting results into <options> list
    // we should just return an array and act on that array through a optionize method
    extractList(c, type) {
        const lines = c.split('\n');
        let typeFound = false;
        let itemsFound = false;
        let itemsDone = false;
        let name = '';
        let before = '';
        let items = [];
        let after = '';
        // iterate over lines to get cBefore and cAfter
        lines.forEach(l => {
            if (l.includes(type)) {
                typeFound = true;
                // set line as cName if cName hasn't yet been found
                if (!itemsDone) name = l;
            }
            if (!typeFound) before += l + '\n';
            else if (l.trim().startsWith('- ') && !itemsDone) {
                itemsFound = true;
                items.push(l.trim().split('- ')[1]);
            }
            else if (itemsDone) {
                after += l + '\n';
            }
            if (itemsFound && !l.trim().startsWith('- ')) {
                itemsDone = true;
            }
        });
        let id = Helpers.cssId(name);
        return [name, before, items, after];
    }

    // strip section contents of special codes like `ⓘ information`
    removeCodes(s, code) {
        let regex = new RegExp('`' + code + ' (.*?)`', 'gi');
        let h = s[0].replace(regex, '');
        let c = s[1].replace(regex, '');
        return [h, c];
    }

    // returns regex match array of code tags like `🅢 .wide {width: 240px;}`
    matchCodes(s, code) {
        var regex = new RegExp('`' + code + ' (.*?)`', 'gi');
        let matches = s[0].match(regex);
        if (matches !== null) {
            matches = matches.concat(s[1].match(regex));
        }
        else {
            matches = s[1].match(regex);
        }
        return matches;
    }

    // returns array of css classes
    // parse codes such as `🅢 #id .class-1 .class-3`
    getSectionClasses(s) {
        let classes = [];
        let matches = this.matchCodes(s, '🅢');
        if (matches === null) return;
        matches.forEach(i => {
            let submatches = i.split(' .');
            submatches.forEach(r => {
                if (r.includes('#')) return;
                if (r.includes('🅢')) return;
                r = r.split('{')[0];
                r = r.split('`')[0];
                classes.push(r);
            });
        });
        return classes;
    }

    // returns string of inline css styles
    // parse codes such as `🅢 {left:220px;}`
    getSectionStyles(s) {
        let styles = '';
        let matches = this.matchCodes(s, '🅢');
        if (matches === null) return;
        matches.forEach(i => {
            let c = i.split('{');
            if (c === null) return;
            c = c[1].split('}');
            if (c === null) return;
            styles += c[0];
        });
        return styles;
    }

    getSectionMarkup(s, processMd) {
        // todo
        // use 1-dimensional array for this.sections.sections
        // then whenever we need to access header content:
        // s.split('\n\')[0]

        // extract css classes from contents
        let classes = this.getSectionClasses(s);
        let styles = this.getSectionStyles(s);

        // now remove special code tags
        let replaced = this.removeCodes(s, 'ⓘ');
        replaced = this.removeCodes(replaced, '🅢');
        replaced = this.removeCodes(replaced, 'ⓢ');
        let h = replaced[0];
        let c = replaced[1];
        let hlevel = Helpers.getHlevel(s);
        if (processMd) {
            if (c !== undefined || c !== '') c = this.processMd(c);
        }
        // remove ## symbols from heading and process it for markdown
        if (h.includes('#')) h = h.split('# ')[1];
        if (processMd) {
            if (h !== undefined && h !== '') h = this.processMd(h);
        }
        return this.sectionHtml(h, c, hlevel, classes, styles);
    }

    sectionHtml(h, c, hlevel, classes, styles) {
        let s = '';
        if (styles !== undefined) s = ' style="' + styles + '"';
        if (classes === undefined) classes = '';
        else classes = classes.join(' ');
        let id = h;
        if (h.length > 0) id = Helpers.cssId(h);
        else id = '🅖0';

        let html = `<section class="section ${classes}" id="${id}"${s}>\n`;

        if (hlevel !== undefined) {
            html += `<h${hlevel} class="handle-heading">\n`;
            html += `<a class="handle ${id}" name="${id}">${h}</a>\n`;
            html += `</h${hlevel}>\n`;
        }

        html += '<div class="content">\n';
        html += `${c}\n`;
        html += '</div></section>\n';
        return html;
    }

    getPanelMarkup(s) {
        let h = s[0];
        let c = s[1];
        let result = '';
        let id = Helpers.cssId(h);

        // COLLAPSIBLE FIELDS
        if (h.includes('`🅖-collapsible')) {

            let div = `<div class="field collapsible ${id} collapsed" data-name="${id}">\n`;
            div += `<div class="header" name="${id}">${id}\n`;
            div += `<div class="contents">\n`;
            div += `${this.getPanelContentMarkup(c)}\n`;
            div += `</div>\n`
            div += `</div>\n`
            div += `</div>\n`;
            h = div;
        }

        if (h.includes('`🅖-group`')) {
            h = this.getPanelContentMarkup(c);
        }

        if (h.includes('`🅖-nav`')) {
            h = h.replace('`🅖-nav`', '');
            h = this.processMd(h);
            h += this.getPanelContentMarkup(c);
        }

        // remove code blocks starting with ⓘ symbol
        h = h.replace(/`ⓘ(.*?)`/g, '');

        result += h + '\n';

        //return result;
        return result;
    }

    getPanelContentMarkup(c) {
        let result = '';
        c = c.replace(/`ⓘ(.*?)`/g, ''); // remove code blocks beginning with ⓘ

        if (c === '') return c;

        c = c.replace('`🅖-hide`', '<a class="hide"><kbd>F1</kbd> - show/hide this panel.</a>');
        c = c.replace('`🅖-toc`', '<div class="toc"></div>');
        c = c.replace('`🅖-theme-variables`', '<div class="theme-vars"></div>');

        if (c.includes('`🅖-help')) {
            const line = this.extractLine(c, '`🅖-help');
            let url = "https://github.com/ugotsta/gitdown/#GitDown";
            let a = Helpers.getVariableAssignment(c.split('`🅖-help')[1]);
            // remove any leftover quotes just in case
            if (a.length > 1) url = a.split('"')[0];
            const div = `<a class="help-ribbon" href="${url}">?</a>`;
            c = c.replace(line, div);
        }

        // SELECT FIELDS
        if (c.includes('`🅖-slider')) {
            let line = this.extractLine(c, '`🅖-slider');
            let items = this.extractSlider(line);
            if (items === null) items = [0, 0, 100, 1, ''];
            let value = items[0];
            let min = items[1];
            let max = items[2];
            let step = items[3];
            let suffix = items[4];
            if (suffix !== '') value = value.split(suffix)[0];
            let id = Helpers.cssId(line);
            let div = `<div class="field slider ${id}" data-name="${id}" data-value="${value}" data-suffix="${suffix}">\n`;
            div += `<input name="${id}" type="range" value="${value}" min="${min}" max="${max}" step="${step}" data-suffix="${suffix}">\n`;
            div += `</div>\n`;
            c = c.replace(line, div);
        }
        // for any further occurrences, recurse
        if (c.includes('`🅖-slider')) return this.getPanelContentMarkup(c);

        // DATALIST FIELDS
        if (c.includes('`🅖-datalist')) {
            let items = this.extractList(c, '`🅖-datalist');
            let cName = items[0];
            let cBefore = items[1];
            let cItems = this.listMarkup(items[2], '`🅖-datalist');
            let cAfter = items[3];
            let id = Helpers.cssId(cName);
            let div = `<div class="field datalist ${id}" data-name="${id}" data-value="default">\n`;
            div += `<input type="text" name="${id}" list="${id}" value="Default" placeholder="${id}" data-value="default" />\n`;
            div += `<datalist id="${id}">\n`;
            div += `<option value="Default" data-href="README.md">README.md</option>\n`;
            div += `${cItems}`;
            div += `</datalist></div>\n`;
            c = cBefore + div + cAfter;
        }
        // for any further occurrences, recurse
        if (c.includes('`🅖-datalist')) return this.getPanelContentMarkup(c);

        // SELECT FIELDS
        if (c.includes('`🅖-select')) {
            let items = this.extractList(c, '`🅖-select');
            let cName = items[0];
            let cBefore = items[1];
            let cItems = this.listMarkup(items[2], '`🅖-select');
            let cAfter = items[3];
            let id = Helpers.cssId(cName);
            let div = `<div class="field select ${id}" data-name="${id}" data-value="default">\n`;
            div += `<select name="${id}">\n`;
            div += `${cItems}`;
            div += `</select></div>\n`;
            c = cBefore + div + cAfter;
        }
        // for any further occurrences, recurse
        if (c.includes('`🅖-select')) return this.getPanelContentMarkup(c);

        // INPUT FIELDS
        if (c.includes('`🅖-input')) {
            let line = this.extractLine(c, '`🅖-input');
            let value = this.extractValue(line);
            let id = Helpers.cssId(line);
            let div = `<div class="field textinput input ${id}" data-name="${id}" data-value="${value}">\n`;
            div += `<input name="${id}" type="text" value="${value}">\n`;
            div += `</div>\n`;
            c = c.replace(line, div);
        }
        // for any further occurrences, recurse
        if (c.includes('`🅖-input')) return this.getPanelContentMarkup(c);

        if (c === '') return c;
        return this.processMd(c);
    }

    extractValue(c) {
        let i = c.match(/".*?"/);
        if (i === null) return '';
        // remove first and last chars
        i = i[0].substr(1);
        i = i.substr(0, i.length - 1);
        return i;
    }

    // for use with raw rendering option,
    // wraps raw content in section and pre code tags
    wrapRaw(c) {
        let h = '';
        c = '<pre><code>' + c + '</pre></code>';
        return this.sectionHtml(h, c);
    }

    // returns markdown rendering of content c
    processMd(c) {
        let md = new Markdown();
        return md.render(c);
    }

}

/*
    MM    MM   AAA   RRRRRR  KK  KK DDDDD    OOOOO  WW      WW NN   NN
    MMM  MMM  AAAAA  RR   RR KK KK  DD  DD  OO   OO WW      WW NNN  NN
    MM MM MM AA   AA RRRRRR  KKKK   DD   DD OO   OO WW   W  WW NN N NN
    MM    MM AAAAAAA RR  RR  KK KK  DD   DD OO   OO  WW WWW WW NN  NNN
    MM    MM AA   AA RR   RR KK  KK DDDDDD   OOOO0    WW   WW  NN   NN
*/

/**
    Provides all methods for rendering Markdown content
*/
class Markdown {

    constructor() {
        this.references = [];
    }

    extractReferences(c) {
        this.references = [];
        let block = false;
        c.split('\n').forEach((l, i) => {

            // ignore if we're within a code block
            if (l.startsWith('```')) block = !block;
            if (block) return;

            // also ignore references in headings
            const h = Helpers.find_first_char_not('#', l);
            if (h > 0 && l.charAt(h) === ' ') return;

            // not in block, so check for match
            let r = l.match(/\[(.*?)\]\: (.*)/g);
            if (r !== null) {
                this.references.push([i, r[0]]);
            }
        });
        return this.references;
    }

    // returns a specific reference from input references array
    getReference(match) {
        let s = match.split('][');
        let title = s[0].substr(1);
        let id = s[1].substr(0, s[1].length - 1);
        let found = this.references.find(i => {
            let c = i[1];
            let name = c.substr(1).split(']: ')[0];
            return id === name;
        });
        if (found === null || found === undefined) {
            return `<a href="/">${title}</a>`;
        }
        let parts = found[1].split(' ');
        let href = parts[1];
        let alt = '';
        if (parts.length > 2) alt = ' alt=' + parts[2];
        let result = `<a href="${href} ${alt}">${title}</a>`;
        return result;
    }

    // handler for inline markdown such as emphases and links
    inlineHandler(l) {

        // IMAGES
        // ![title](href "alt")
        l = l.replace(/!\[(.*?)\]\((.*) "(.*)"\)/g, `<img src="$2" title="$1" alt="$3">`);
        // ![title](href)
        l = l.replace(/!\[(.*?)\]\((.*)\)/g, `<img src="$2" title="$1">`);

        // LINKS
        // Non-reference links [title](href)
        l = l.replace(/\[(.*?)\]\((.*)\)/g, `<a href="$2">$1</a>`);
        // Reference links [title][id]
        l = l.replace(/\[(.*?)\]\[(.[^\[\]]*)\]/g, (match) => {
            return this.getReference(match);
        });
        // <href>
        l = l.replace(/\<(http.*)\>/g, `<a href="$2">$1</a>`);
        // Reference links [title][]

        // bold
        l = l.replace(/\*\*(?! )(.*?)(?! )\*\*/g, `<strong>$1</strong>`);
        l = l.replace(/__(?! )(.*?)(?! )__/g, `<strong>$1</strong>`);

        // emphases
        l = l.replace(/(!")_(?! )(.*?)(?! )_(!")/g, `<em>$1</em>`);
        l = l.replace(/\*(?! )(.*?)(?! )\*/g, `<em>$1</em>`);

        // strikethrough
        l = l.replace(/~~(?! )(.*?)(?! )~~/g, `<s>$1</s>`);

        return l;
    }

    tableHandler(table) {
        let t = '';
        let lines = table.split('\n');
        let definition = lines[1];
        let columns = definition.split('|');
        columns.shift();
        columns.pop();
        let align = [];
        columns.forEach(c => {
            let a = '';
            c = c.trim();
            if (c.startsWith(':') && c.endsWith(':')) a = 'center';
            else if (c.endsWith(':')) a = 'right';
            else if (c.startsWith(':')) a = 'left';
            align.push(a);
        });
        columns = columns.length;
        t += '<table>\n';
        t += '<tbody>\n';
        lines.forEach((l, i) => {
            if (i === 1 || i === lines.length - 1) return;
            let td = '<td>\n';
            if (i === 0) {
                t += t += '<thead>\n';
                td = '<th>\n';
            }
            t += '<tr>\n';
            for (let c = 0; c <= columns; c++) {
                if (align[c - 1] !== '') {
                    t += td.replace('>', ` align="${align[c - 1]}">`);
                } else t += td;
                t += l.split('|')[c] + '\n';
                t += td.replace('<', '</');
            }
            t += '</tr>\n';
            if (i === 0) t += '</thead>\n';
        });
        t += '</tbody>\n';
        t += '</table>\n';
        return t;
    }

    // returns character found at start of line if character is a list symbol
    listChr(l) {
        l = l.trim();
        let listChr = '';
        // handle unordered list <UL>
        if (l.startsWith('- ')) listChr = '-';
        else if (l.startsWith('* ')) listChr = '*';
        if (listChr !== '') return listChr;

        // handle orderered list <OL>
        listChr = l.match(/^(\d+). /);
        if (listChr === null) return '';
        return l.split(' ')[0];
    }

    render(c) {

        // send content through first pass to get any reference links
        this.extractReferences(c);

        let result = '';
        // markup within code blocks should be treated differently
        // block designates what type of block we're in: code, inline-code
        let block = '';

        let blockquote = false;

        // similarly, list holds the list type: ol, ul
        let list = '';
        let listLevel = -1;
        let listSpaces = 2;

        let table = '';

        const lines = c.split('\n');
        lines.forEach((l, i) => {

            let paragraph = true;

            // Close UL if first character is not a list character and listLevel is 0 or greater
            let chr = this.listChr(l);
            if (chr === '' && listLevel > -1) {
                let tag = `</${list}>`;
                result += tag + tag.repeat(listLevel);
                list = '';
                listLevel = -1;
            }

            // Close BLOCKQUOTE
            if (blockquote && !l.trim().startsWith('> ')) {
                result += '<p>\n</blockquote>\n';
                blockquote = false;
            }

            // HEADINGS
            const x = Helpers.find_first_char_not('#', l);
            if (block === '' && x > 0 && l.charAt(x) === ' ') {
                // assign appropriate heading level and truncated heading text
                l = `<h${x}>${l.substr(x)}</h${x}>`;
                paragraph = false;
            }
            if (block === '' && i < lines.length - 1) {
                if (lines[i + 1].startsWith('---')) {
                    l = `<h2>${l}</h2>`;
                    paragraph = false;
                } else if (lines[i + 1].startsWith('===')) {
                    l = `<h1>${l}</h1>`;
                    paragraph = false;
                }
            }

            // <HR>

            if (block === '') {
                if (l.startsWith('---') || l.startsWith('***')
                    || l.startsWith('___') || l.startsWith('===')
                    || l.startsWith('- - -') || l.startsWith('* * *')) {
                    paragraph = false;
                    l = '<hr />';
                }
            }

            // CODE
            if (l.startsWith('```')) {
                paragraph = false;
                // get any extra text after ```
                let classes = l.split('```')[1];
                if (classes.trim().length < 1) classes = '';
                else classes = ` class="${classes}" `;
                if (block === '') {
                    block = 'code';
                    l = `<pre ${classes}><code>`;
                }
                else if (block === 'code') {
                    block = '';
                    l = '</pre></code>';
                }
            }
            if (block === 'code') paragraph = false;

            // PRE tag
            if (l.trim().startsWith('<pre')) {
                paragraph = false;
                if (block === '') block = 'pre';
            }
            if (l.trim().startsWith('</pre')) block = '';
            if (block === 'pre') paragraph = false;

            // special consideration for html comments
            if (block !== '' && l.startsWith('<!--')) {
                l = l.replace('<!--', '&lt;!--');
            }

            // inline-code
            l = l.replace(/\`/g, f => {
                if (block === '') {
                    block = 'inline-code';
                    return '<code>';
                }
                else if (block === 'inline-code') {
                    block = '';
                    return '</code>';
                }
                else return '`';
            });

            // BLOCKQUOTE
            if (l.trim().startsWith('> ') && block === '') {
                if (!blockquote) {
                    l = '<blockquote>\n<p>' + l.substr(2);
                    blockquote = true;
                } else l = l.substr(2);
            }
            if (blockquote) paragraph = false;

            // TABLES

            // Close TABLE
            if (!l.startsWith('|') && table !== '') {
                // table has content but this line doesn't have table code
                // so lets close the table up and add entire contents as new line
                l += '\n' + this.tableHandler(table) + '\n';
                table = '';
                paragraph = false;
                block = '';
            }
            else if (l.startsWith('|')) {
                if (block === '') block = 'table';
                table += l + '\n';
                l = '';
            }
            if (table !== '') paragraph = false;

            // ======================== INLINE ELEMENTS =========================
            // Inline elements such as emphases and links
            if (block === '') l = this.inlineHandler(l);

            // LISTS <UL> and <OL>
            chr = this.listChr(l);
            if (chr !== '' && block === '') {
                let type = 'ul';
                if (!isNaN(chr)) type = 'ol';
                let spaces = l.split(chr + ' ')[0].length;
                let oldLevel = listLevel;
                let newLevel = Math.floor(spaces / listSpaces);

                if (list === '') {
                    listLevel = 0;
                    list = type;
                    l = `<${type}>\n<li>${l.trim().substr(2)}</li>`;
                }
                else if (newLevel > listLevel) {
                    listLevel += 1;
                    list = type;
                    l = `<${type}>\n<li>${l.trim().substr(2)}</li>`;
                }
                else if (newLevel === listLevel) {
                    l = `<li>${l.trim().substr(2)}</li>`;
                }
                else if (newLevel < listLevel) {
                    listLevel = newLevel;
                    let tag = `</${list}>\n`;
                    tag = tag.repeat(oldLevel - listLevel);
                    l = tag + `<li>${l.trim().substr(2)}</li>`;
                }
            }
            if (list !== '') paragraph = false;

            if (block === '') {
                // don't add paragraph if line begins with html open symbol
                if (l.startsWith('<')) paragraph = false;
                // allow some tags at start of line to designate paragraph
                if (l.startsWith('<s>')) paragraph = true;
                if (l.startsWith('<em>')) paragraph = true;
                if (l.startsWith('<strong>')) paragraph = true;
            }

            if (paragraph && l.length > 0) l = '<p>' + l + '</p>';
            if (l.includes('<pre')) result += l;
            else if (l.length < 1) result += l;
            else result += l + '\n';
        });
        return result;
    }

}

/*
    SSSSS  EEEEEEE  CCCCC  TTTTTTT IIIII  OOOOO  NN   NN  SSSSS
    SS      EE      CC    C   TTT    III  OO   OO NNN  NN SS
    SSSSS  EEEEE   CC        TTT    III  OO   OO NN N NN  SSSSS
        SS EE      CC    C   TTT    III  OO   OO NN  NNN      SS
    SSSSS  EEEEEEE  CCCCC    TTT   IIIII  OOOO0  NN   NN  SSSSS
*/

/**
    Separates content into sections and provides methods to access contents

    imports Markup, Helpers
*/
class Sections {

    constructor() {
        this.clear();
    }

    // reset section content to default (empty)
    clear() {
        // when filled, section content will include raw markdown
        // ['# The Red Door', 'Nothing here but a large, Red_ door.']
        this.sections = [];
        // this.current holds the id of the current section
        this.current = undefined;
        // this.past holds the id of the last section the user clicked/visited
        this.past = undefined;
        this.raw = false;
    }

    setRaw(raw) {
        if (raw) this.raw = true;
        else if (this.getCurrent().length < 1) this.raw = true;
        return this.raw;
    }

    isRaw() {
        return this.raw;
    }

    // set this.current section by id
    setCurrent(id) {
        if (this.raw) return this.current = '🅖0';
        if (id.length < 1) id = this.getFirst();
        let i = this.getSectionById(id);
        if (i !== undefined) {
            // update this.past only if this.current had a previous value
            if (this.current !== undefined) this.past = this.current;
            return this.current = Helpers.cssId(id);
        }
    }

    // returns array of css classes for specified section
    getClasses(id) {
        let s = this.getSectionById(id);
        if (s === undefined) return undefined;
        const i = this.getId(s);
        let classes = [];
        let current = this.getSectionIndex(this.current);
        let past = this.getSectionIndex(this.past);
        if (this.current === i) {
            classes.push('current');
            if (current > past) classes.push('hi');
            else if (current < past) classes.push('lo');
        }
        else if (this.past === i) {
            classes.push('past');
            if (past > current) classes.push('hi');
            else if (past < current) classes.push('lo');
        }
        return classes;
    }

    // set current section by id
    setPast(id) {
        let i = this.getSectionById(id);
        if (i !== undefined) return this.past = id;
    }

    getCurrent() {
        if (this.raw) return this.current = '🅖0';
        if (this.current === undefined) {
            return this.current = this.getFirst();
        }
        else return this.current;
    }

    getPast() {
        return this.past;
    }

    // returns the id of the first section in this.sections array
    getFirst() {
        return this.getId(this.sections[0]);
    }

    // returns the id of the last section in this.sections array
    getLast() {
        return this.getId(this.sections[this.sections.length - 1]);
    }

    // returns the id of the next section after current
    getNext() {
        let next = this.sections.length - 1;
        const current = this.getSectionIndex(this.current);
        if (current + 1 < next) next = current + 1;
        return this.getId(this.sections[next]);
    }

    // returns the id of the previous section before current
    getPrev() {
        let prev = 0;
        const current = this.getSectionIndex(this.current);
        if (current - 1 > prev) prev = current - 1;
        return this.getId(this.sections[prev]);
    }

    // returns id from heading for specified section @s
    getId(s) {
        return Helpers.cssId(s[0]);
    }

    // returns the index of specified section in this.sections array by @id
    getSectionIndex(id) {
        for (let i = 0; i < this.sections.length - 1; i++) {
            if (this.getId(this.sections[i]) === id) return i;
        }
    }

    // returns the section at index @n
    getSectionByIndex(n) {
        if (this.sections.length >= n) return this.sections[n];
    }

    getSectionById(id) {
        if (id.startsWith('#')) id = id.substr(1);
        // strip ## from start of id string
        return this.sections.find(s => {
            return this.getId(s) === id;
        });
    }

    //
    getSectionHtml(raw, id) {
        if (raw) this.raw = true;
        let result = '';
        let markup = new Markup();
        // check if id is provided
        if (id === undefined) {
            this.sections.forEach(s => {
                // get all section content without processing the markdown
                if (raw) result += `${s[0]}\n${s[1]}\n`;
                else result += markup.getSectionMarkup(s, false);
            });
            if (!raw) result += '<br />';
        }
        // get html for specified section @id
        else {
            let s = this.getSectionById(id);
            if (raw) result += `${s[0]}\n${s[1]}\n`;
            else result += markup.getSectionMarkup(s, false);
        }
        // now process the markdown content
        if (raw) {
            this.setCurrent('🅖0');
            return markup.wrapRaw(result);
        }
        return markup.processMd(result) + '<br />';
    }

    // returns an array of all section ids
    getIds() {
        let result = [];
        this.sections.forEach(s => {
            result.push(Helpers.cssId(s[0]));
        });
        return result;
    }

    setSections(sections) {
        this.sections = sections;
    }

    getSections() {
        return this.sections;
    }

    getSectionName(id) {
        if (id.startsWith('#')) id = id.substr(1);
        let section = this.sections.find(s => {
            return id === this.getId(s);
        });
        return Helpers.realName(section[0]);
    }

}

/*
    UU   UU RRRRRR  LL
    UU   UU RR   RR LL
    UU   UU RRRRRR  LL
    UU   UU RR  RR  LL
     UUUUU  RR   RR LLLLLL
*/

/**
    Keep all browser methods contained in a class
    for portability purposes
*/
class Url {

    constructor() {
    }

    static getPath() {
        return window.location.hostname.split('.')[0] + window.location.pathname;
    }

    static getSearchParams() {
        return (new URL(location)).searchParams;
    }

    static getHash() {
        return window.location.hash;
    }
}

Events

/**
    Event handler to simplify AddEventListener calls
*/
class Events {

    constructor() {
        //this.events = [];
    }

    // this.events.add('.nav .collapsible.Dimensions .field.slider input', 'input', centerView);
    // this.events.add('.nav .field.slider input', 'input', vignette);
    add(el, method, callback) {

        let elements = document.querySelectorAll(el);
        if (elements.length < 1) return;
        elements.forEach(e => {
            e.removeEventListener(method, callback);
            e.addEventListener(method, callback);
        });

        //this.events.push( [el, method, callback] );

    }

    remove() {
    }
}

/*
    DDDDD    OOOOO  MM    MM
    DD  DD  OO   OO MMM  MMM
    DD   DD OO   OO MM MM MM
    DD   DD OO   OO MM    MM
    DDDDDD   OOOO0  MM    MM
*/

/**
    HTML class for handling everything DOM related
*/

class Dom {

    constructor() {
    }

    configureWrapper(el, inner) {
        if (typeof el === 'string') el = document.querySelector(el);
        // ensure element has an id, then store it in eid
        let eid = '#' + el.getAttribute('id');
        if (eid === '#') {
            let newId = document.querySelector('#wrapper');
            // ensure another id doesn't already exist in page
            if (newId === null) {
                eid = newId;
                el.setAttribute('id', eid.substr(1));
            }
        }
        // add container div and inner content
        let content = '<div class="' + inner + '">';
        content += '</div>';
        el.innerHTML += content;
        return eid;
    }

}

/*
    GGGG    FFFFFFF  OOOOO  NN   NN TTTTTTT  SSSSS
    GG  GG  FF      OO   OO NNN  NN   TTT   SS
    GG      FFFF    OO   OO NN N NN   TTT    SSSSS
    GG   GG FF      OO   OO NN  NNN   TTT        SS
    GGGGGG  FF       OOOO0  NN   NN   TTT    SSSSS
*/

/**
    Helper class for Google Fonts
*/
class GFonts {

    constructor() {
    }

    // takes a font name including - chars and returns offical name from gfonts()
    // returns false if name doesn't exist in gfonts()
    getName(font) {
        let name = '';
        // we'll lazily convert name to css id compatible name first
        const n = Helpers.cssId(font);
        // now check if name deviates from basic rules and return deviation if so
        let deviation = this.deviations(n);
        if ( deviation !== undefined ) return deviation;

        // now split by - and assemble string using title case
        n.split('-').forEach( (w, i) => {
            let word = '';
            if ( w.length < 3 ) word = w.toUpperCase();
            else word = w[0].toUpperCase() + w.slice(1);
            name += word + ' ';
        });
        // remove trailing space and return
        return name.trim();
    }

    deviations(name) {
        const devations = [
            'McLaren',
            'UnifrakturMaguntia',
            'UnifrakturCook',
            'Mountains of Christmas',
            'MedievalSharp',
            'VT232',
        ];
        return devations.find( (w) => {
            let word = Helpers.cssId(w);
            return word === name;
        });
    }

    update(font) {
        // first find font in gfonts list
        const found = this.getName(font);
        if (!found) return false;
        // replace space chars with + as needed by API
        let name = found.split(' ').join('+');
        let fonts = name;
        var link = document.createElement('link');
        // link.setAttribute('id', 'gd-gfont');
        link.setAttribute('rel', 'stylesheet');
        link.setAttribute('type', 'text/css');
        link.setAttribute('href', `https://fonts.googleapis.com/css?family=${fonts}`);
        document.head.appendChild(link);

        return found;
    }

    // returns an object of Google font names to be used by select field
    getList() {
        const added = {
            "Fira Code iScript": {
                "category": "monospace",
            },
            "Fira Code": {
                "category": "monospace",
            }
        };
        const gfonts =
        {
            "ABeeZee": {
                "category": "sans-serif",
            },
            "Abel": {
                "category": "sans-serif",
            },
            "Varela Round": {
                "category": "sans-serif",
            },
            "Viga": {
                "category": "sans-serif",
            },
            "Roboto": {
                "category": "sans-serif",
            },
            "Open Sans": {
                "category": "sans-serif",
            },
            "Lato": {
                "category": "sans-serif",
            },
            "Montserrat": {
                "category": "sans-serif",
            },
            "PT Sans": {
                "category": "serif",
            },
            "Noto Serif": {
                "category": "serif",
            },
            "Adamina": {
                "category": "serif",
            },
            "Slabo": {
                "category": "serif",
            },
            "Merriweather": {
                "category": "serif",
            },
            "Roboto Slab": {
                "category": "serif",
            },
            "Playfair Display": {
                "category": "serif",
            },
            "Lora": {
                "category": "serif",
            },
            "Anonymous Pro": {
                "category": "monospace",
            },
            "Cousine": {
                "category": "monospace",
            },
            "Cutive Mono": {
                "category": "monospace",
            },
            "Fira Mono": {
                "category": "monospace",
            },
            "IBM Plex Mono": {
                "category": "monospace",
            },
            "Inconsolata": {
                "category": "monospace",
            },
            "Nanum Gothic Coding": {
                "category": "monospace",
            },
            "Nova Mono": {
                "category": "monospace",
            },
            "Overpass Mono": {
                "category": "monospace",
            },
            "Oxygen Mono": {
                "category": "monospace",
            },
            "PT Mono": {
                "category": "monospace",
            },
            "Roboto Mono": {
                "category": "monospace",
            },
            "Share Tech Mono": {
                "category": "monospace",
            },
            "Source Code Pro": {
                "category": "monospace",
            },
            "Space Mono": {
                "category": "monospace",
            },
            "Ubuntu Mono": {
                "category": "monospace",
            },
            "VT323": {
                "category": "monospace",
            },
            "Lobster": {
                "category": "display",
            },
            "Abril Fatface": {
                "category": "display",
            },
            "Patua One": {
                "category": "display",
            },
            "Comfortaa": {
                "category": "display",
            },
            "Righteous": {
                "category": "display",
            },
            "Concert One": {
                "category": "display",
            },
            "UnifrakturMaguntia": {
                "category": "display",
            },
            "Pacifico": {
                "category": "handwriting",
            },
            "Indie Flower": {
                "category": "handwriting",
            },
            "Shadows Into Light": {
                "category": "handwriting",
            },
            "Dancing Script": {
                "category": "handwriting",
            },
            "Gloria Hallelujah": {
                "category": "handwriting",
            },
            "Amatic SC": {
                "category": "handwriting",
            },
            "Permanent Marker": {
                "category": "handwriting",
            },
            "Great Vibes": {
                "category": "handwriting",
            }
        };
        const full = Object.assign(added, gfonts);
        return full;
    }

    getSearchParams() {
        return (new URL(location)).searchParams;
    }
}

/*
    SSSSS    AAA   NN   NN IIIII TTTTTTT IIIII ZZZZZ EEEEEEE RRRRRR
    SS       AAAAA  NNN  NN  III    TTT    III     ZZ EE      RR   RR
    SSSSS  AA   AA NN N NN  III    TTT    III    ZZ  EEEEE   RRRRRR
        SS AAAAAAA NN  NNN  III    TTT    III   ZZ   EE      RR  RR
    SSSSS  AA   AA NN   NN IIIII   TTT   IIIII ZZZZZ EEEEEEE RR   RR
*/

/**
    Sanitizer which filters a set of whitelisted tags, attributes and css.
    For now, the whitelist is small but can be easily extended.

    @param bool whether to escape or strip undesirable content.
    @param map of allowed tag-attribute-attribute-parsers.
    @param array of allowed css elements.
    @param array of allowed url scheme

    Credits: Alok Menghrajani
    https://quaxio.com/htmlWhiteListedSanitizer/
*/

function HtmlWhitelistedSanitizer(escape, tags, css, urls) {
    this.escape = escape;
    this.allowedTags = tags;
    this.allowedCss = css;

    if (urls == null) {
        urls = ['http://', 'https://'];
    }

    if (this.allowedTags == null) {
        // Configure small set of default tags
        var unconstrainted = function (x) { return x; };
        var globalAttributes = {
            'dir': unconstrainted,
            'lang': unconstrainted,
            'title': unconstrainted
        };
        var urlSanitizer = HtmlWhitelistedSanitizer.makeUrlSanitizer(urls);
        this.allowedTags = {
            'a': HtmlWhitelistedSanitizer.mergeMap(globalAttributes, {
                'download': unconstrainted,
                'href': urlSanitizer,
                'hreflang': unconstrainted,
                'ping': urlSanitizer,
                'rel': unconstrainted,
                'target': unconstrainted,
                'type': unconstrainted
            }),
            'img': HtmlWhitelistedSanitizer.mergeMap(globalAttributes, {
                'alt': unconstrainted,
                'height': unconstrainted,
                'src': urlSanitizer,
                'width': unconstrainted
            }),
            'p': globalAttributes,
            'div': globalAttributes,
            'span': globalAttributes,
            'br': globalAttributes,
            'b': globalAttributes,
            'i': globalAttributes,
            'u': globalAttributes,
            'pre': globalAttributes,
            'sub': globalAttributes,
            'sup': globalAttributes,
            'kbd': globalAttributes,
        };
    }
    if (this.allowedCss == null) {
        // Small set of default css properties
        this.allowedCss = ['border', 'margin', 'padding'];
    }
}

HtmlWhitelistedSanitizer.makeUrlSanitizer = function (allowedUrls) {
    return function (str) {
        if (!str) { return ''; }
        for (var i in allowedUrls) {
            console.log(allowedUrls[i]);
            if (str.startsWith(allowedUrls[i])) {
                return str;
            }
        }
        return '';
    };
}

HtmlWhitelistedSanitizer.mergeMap = function (/*...*/) {
    var r = {};
    for (var arg in arguments) {
        for (var i in arguments[arg]) {
            r[i] = arguments[arg][i];
        }
    }
    return r;
}

HtmlWhitelistedSanitizer.prototype.sanitizeString = function (input) {
    // Use the browser to parse the input. This won't evaluate any potentially
    // dangerous scripts since the element isn't attached to the window's document.
    // To be extra cautious, we could dynamically create an iframe, pass the
    // input to the iframe and get back the sanitized string.
    var doc = document.implementation.createHTMLDocument('title');
    var div = doc.createElement('div');
    div.innerHTML = input;

    // Return the sanitized version of the node.
    return this.sanitizeNode(div).innerHTML;
}

HtmlWhitelistedSanitizer.prototype.sanitizeNode = function (node) {
    // Note: <form> can have it's nodeName overriden by a child node. It's
    // not a big deal here, so we can punt on this.
    var nodeName = node.nodeName.toLowerCase();
    if (nodeName == '#text') {
        // text nodes are always safe
        return node;
    }
    if (nodeName == '#comment') {
        // always strip comments
        return node;
    }
    if (!this.allowedTags.hasOwnProperty(nodeName)) {
        // this node isn't allowed
        console.log("forbidden node: " + nodeName);
        if (this.escape) {
            return document.createTextNode(node.outerHTML);
        }
        return document.createTextNode('');
    }

    // create a new node
    var copy = document.createElement(nodeName);

    // copy the whitelist of attributes using the per-attribute sanitizer
    for (var nAttr = 0; nAttr < node.attributes.length; nAttr++) {
        var attr = node.attributes.item(nAttr).name;
        if (this.allowedTags[nodeName].hasOwnProperty(attr)) {
            var sanitizer = this.allowedTags[nodeName][attr];
            copy.setAttribute(attr, sanitizer(node.getAttribute(attr)));
        }
    }
    // copy the whitelist of css properties
    for (var css in this.allowedCss) {
        copy.style[this.allowedCss[css]] = node.style[this.allowedCss[css]];
    }

    // recursively sanitize child nodes
    while (node.childNodes.length > 0) {
        var child = node.removeChild(node.childNodes[0]);
        copy.appendChild(this.sanitizeNode(child));
    }
    return copy;
}
