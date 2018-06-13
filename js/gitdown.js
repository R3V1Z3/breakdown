// currently, when themes use same names as default themes like --bg
// the non-default theme's default values aren't updated in fields

// gitdown-saint-billy theme uses --bg with tan default color
// that color is not updated in the field when 

/**
 * GitDown core
 * @param {string} el HTML element
 * @param {object} options options object
 * @returns {object} a new GitDown object
 */
class GitDown {
    
    constructor( el, options ) {
        const gd = this;
        gd.init( el, options );
        gd.main();
    }

    init( el, options ) {
        this.status = new Status();
        this.parameters_protected = 'markdownit,callback,merge_themes,merge_gists,origin,parameters_disallowed';
        this.settings = new Settings(options, this.parameters_protected);
        // this.sectionz = new Sectionz();
        // this.parameterz = new Parameterz();
        // this.fieldz = new Fieldz();

        this.initial_content = '';
        this.info_content = this.default_info_content();
        this.sections = [];
        this.chr_link = '⮎';
        this.css_vars = {};
        this.params = (new URL(location)).searchParams;
        this.path = '/' + window.location.hostname.split('.')[0] + window.location.pathname;
        this.example_gists = this.examples('gist');
        this.example_themes = this.examples('css');
        if ( typeof el === 'string' ) el = document.querySelector(el);
        // ensure element has an id, then store it in eid
        this.eid = '#' + el.getAttribute('id');
        if ( this.eid === '#' ) {
            let new_id = document.querySelector('#wrapper');
            // ensure another id doesn't already exist in page
            if( new_id === null ) {
                this.eid = new_id;
                el.setAttribute( 'id', eid.substr(1) );
            }
        }
        // add container div and inner content
        let content = '<div class="' + this.settings.get_value('inner') + '">';
        content += '</div>';
        content += '<div class="info panel visible"></div>';
        el.innerHTML += content;
        // helper variables to simplify access to container elements
        this.eid_inner = ' .' + this.settings.get_value('inner');
    };

    // setup basic examples
    // returns defaults if merged is not provided
    // otherwise returns examples with merged added
    examples( type, user_examples ) {
        let ex = {};
        if ( type === 'gist' ) {
            ex = {
                "Alexa Cheats": "2a06603706fd7c2eb5c93f34ed316354",
                "Vim Cheats": "c002acb756d5cf09b1ad98494a81baa3" };
        } else if ( type === 'css' ) {
            ex = {
                "Technology": "adc373c2d5a5d2b07821686e93a9630b",
                "Console": "a634da7b7130fd40d682360154cc4e2e",
                "Tech Archaic": "e27b284231488b349f35786f6340096a",
                "Saint Billy": "76c39d26b1b44e07bd7a783311caded8",
                "Ye Olde Tavern": "e9dc237da3d9bda63302fe4b659c20b5",
                "Old Glory": "43bff1c9c6ae8a829f67bd707ee8f142",
                "Woodwork": "ece15baa3b80cd95bc0b7a0a2b5a24bd",
                "Graph Paper": "77b1f66ad5093c2db29c666ad15f334d",
                "Eerie": "7ac556b27c2cd34b00aa59e0d3621dea",
                "Writing on the Wall": "241b47680c730c7162cb5f82d6d788fa",
                "Ghastly": "d1a6d5621b883bf6af886855d853d502",
                "Gradient Deep": "51aa23d96f9bd81fe55c47b2d51855a5",
                "Shapes": "dbb6369d5cef9801d11e0c342b47b2e0"
            };
        }

        if ( user_examples === null ) return ex;

        let do_merge = false;
        if ( type === 'gist' ) do_merge = this.settings.get_value('merge_gists');
        if ( type === 'css' ) do_merge = this.settings.get_value('merge_themes');

        if ( do_merge ) return this.merge_arrays( ex, user_examples );
        return user_examples;
    }

    // returns default info panel content
    // for cases where no info panel content is provided
    default_info_content() {
        var n = '\n\n';
        var info = '# Info <!-- {$gd_info} -->' + n;
        info += '<!-- {$gd_help_ribbon} -->' + n;
        info += 'GIST <!-- {$gd_gist} -->' + n;
        info += 'CSS <!-- {$gd_css} -->' + n;
        info += '## Table of Contents <!-- {$gd_toc} -->' + n;
        info += '<!-- {$gd_hide} -->' + n;
        return info;
    };

    // PUBLIC METHODS ------------------------------------------------------

    // detect specified url parameter, clean and add it to settings
    update_parameter( key, default_value ) {
        let val = default_value;
        if ( val === undefined ) val = this.settings.get_value(key);
        if ( val === undefined ) return '';
        // check if specified key exists as url param
        if ( this.params.has(key) ) {
            // ensure the parameter is allowed
            if ( this.is_param_allowed(key) ) {
                val = this.params.get(key);
                // sanitize strings
                if ( typeof val === 'string' ) {
                    const parser = new HtmlWhitelistedSanitizer(true);
                    val = parser.sanitizeString(val);
                }
                this.settings.set_value(key, val);
            }
        }
        return val;
    };

    is_param_allowed(p) {
        let allowed = this.settings.get_value('parameters_disallowed');
        allowed = allowed.split(',');
        let prot = this.parameters_protected.split(',');
        if ( prot.indexOf(p) === -1 && allowed.indexOf(p) === -1 ) {
            return true;
        }
        return false;
    }

    // return true to let user know everything is fully loaded
    is_loaded() {
        return status.has('done');
    }

    /**
     * Helper function for combining url parts
     * @returns {string} url with base, query vars and hash
     */
    uri() {
        //let q = this.params.toString();
        let q = this.settings.to_string('all');
        if ( q.length > 0 ) q = '?' + q;
        let base = window.location.href.split('?')[0];
        base = base.split('#')[0];
        return base + q + location.hash;
    };

    /**
     * Ridiculously lengthy function for fullscreen switching
     */
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
                e.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
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

    // helper function to ensure section ids are css compatible
    clean( str, o ) {
        if ( o === undefined ) o = 'css';
        if ( o === 'css' ) {
            str = str.toLowerCase();
            // remove non-alphanumerics
            str = str.replace(/[^#a-z0-9_\s-]/g, '-');
            // clean up multiple dashes or whitespaces
            str = str.replace(/[\s-]+/g, ' ');
            // remove leading and trailing spaces
            str = str.trim();
            // convert whitespaces and underscore to dash
            str = str.replace(/[\s_]/g, '-');
        } else if ( o === 'var' ) {
            // remove non-alphanumerics
            str = str.replace(/[^a-z0-9_\s-]/g, '-');
            // clean up multiple dashes or whitespaces
            str = str.replace(/[\s-]+/g, ' ');
            // remove leading and trailing spaces
            str = str.trim();
            // convert whitespaces and dashes to underscores
            str = str.replace(/[\s-]/g, '_');
        } else if ( o === 'value' ) {
            // send through sanitizer
            var parser = new HtmlWhitelistedSanitizer(true);
            str = parser.sanitizeString(str);
        } else if ( o === 'proper' ) {
            // return proper name, used only after values previously cleaned
            // replace dashes and underscores with space
            f = f.replace(/-/g, ' ');
            f = f.replace(/_/g, ' ');
            // capitalize words
            f = f.replace( /\b\w/g, l => l.toUpperCase() );
        } else if ( o === 'proper_file' ) {
            // capitalize words
            f = f.replace( /\b\w/g, l => l.toUpperCase() );
        }
        return str;
    };

    /**
     * Helper to determine if string begins with another string
     * @param {string} t string to test
     * @param {string} str string to find in t
     * @returns {bool} whether t begins with str
     */
    begins( t, str ) {
        return ( t.indexOf(str) === 0 );
    };

    // find first character in str that is not char and return its location
    find_first_char_not(char, str) {
        for (var i = 0; i < str.length; i++){
            if (str[i] != char){
                return i;
            }
        }
        // found only same char so return -1
        return -1;
    };

    /**
     * load user specified highlight style
     */
    render_highlight() {
        var h = this.settings.get_value('highlight');
        var hlight = document.querySelector('#gd-highlight');
        if ( h === undefined || h === null ) h = 'default';
        if ( h.toLowerCase() === 'none' ) {
            if ( hlight !== null ) hlight.parentNode.removeChild(hlight);
        } else {
            // setup link details
            var href = '//cdnjs.cloudflare.com/ajax/libs/highlight.js/9.5.0/styles/';
            href += h.replace(/[^a-zA-Z0-9-_]+/ig, '');
            href += '.min.css';
            // check for existence of highlight link
            if ( hlight === null ) {
                // add style reference to head
                this.append_style( 'link', 'gd-highlight', href );
            } else {
                // modify existing href
                hlight.setAttribute( 'href', href );
            }
        }
    }

    /**
     * Add style to head either inline or external stylesheet
     * @param {string} type link or style
     * @param {string} id so we can alter href later
     * @param {string} content either href or actual style content
     */
    append_style( type, id, content ){
        if ( type === 'link' ){
            let s  = document.createElement(type);
            s.type = 'text/css';
            if ( id !== null ) s.id = id;
            s.rel  = 'stylesheet';
            s.href = content;
            document.head.appendChild(s);
        } else if ( type === 'style' ) {
            // attempt to sanitize content before adding
            const parser = new HtmlWhitelistedSanitizer(true);
            const css = parser.sanitizeString(content);
            const div = document.createElement("div");
            div.innerHTML = `<style id="${id}">${css}</style>`;
            document.head.appendChild(div);
        }
    }

    get_setting(s) {
        if ( s === 'theme' ) {
            return window.localStorage.getItem('gd_theme');
        } else if ( s === 'content' ) {
            return window.localStorage.getItem('gd_content');
        } else if ( s === 'settings' ) {
            var s = window.localStorage.getItem('gd_settings');
            return JSON.parse(s);
        }
    }

    update_selector_url( type, fname ) {
        
        // update url field with filename
        let url_field = document.querySelector( `${gd.eid} .info .${type}-url` );
        if ( url_field !== null ) url_field.textContent = fname + ' ▾';

        let id = gd.settings.get_value(type);
        let filename = gd.settings.get_value( type + '_filename' );

        let href = '';
        if ( id === 'default' ) {
            href = gd.gist_url( gd.settings.get_value('content'), false );
        } else {
            href = 'https://gist.github.com/' + id;
        }

        let src_string = `${gd.eid} .info .field.selector.${type} a.selector-source`;
        let source = document.querySelector( src_string );
        if ( source !== null ) source.setAttribute( 'href', href );
    }

    // helper function to get current section
    get_current_section_id() {
        var current = document.querySelector( gd.eid_inner + ' .section.current' );
        if ( current !== null ) {
            return current.getAttribute('id');
        }
        return '';
    };

    // let user easily get names of sections
    get_sections() {
        return gd.sections;
    };

    // let user override toc section list, for cases like Entwine
    set_sections(s) {
        gd.sections = s;
    };

    // shortcut to get url params
    get_param(key) {
        if ( gd.params.has(key) ) {
            // return cleaned value
            var value = gd.params.get(key);
            var parser = new HtmlWhitelistedSanitizer(true);
            return parser.sanitizeString(value);
        }
        // return empty string if key doesn't exist
        return '';
    };

    // returns value of css_var at key k
    get_css_var(k) {
        const css_vars = gd.settings.get_settings('cssvar');
        for ( const key in css_vars ) {
            if ( key === k ) {
                return css_vars[k];
            }
        }
        return '';
    }

    // tries to find a unique name for an element by adding
    // -number at the end and checking for any element with that name
    //
    // prefix: section, room or some other identifier
    // selector: base selector so we can find a unique id, class or otherwise
    // max: maximum number of times to try
    //
    // returns new element name with suffixed number
    unique( prefix, selector = '#', max = 200 ) {
        let x = 1;
        do {
            const n = `${ this.clean(prefix)}-${x}`;
            // check if id already exists
            const name = document.querySelector( selector + n );
            if ( name === null ) return n;
            x++;
        }
        while (x < max);
    }

    extract_css_vars() {
        // start by clearing existing css vars
        const styleSheets = document.styleSheets;
        const styleSheetsLength = styleSheets.length;
        for (var i = 0; i < styleSheetsLength; i++) {
            // get cssRules from internal stylesheets only
            try {
                let defaultsh = false;
                // use default to determine whether this stylesheet is the default one (style.css)
                if ( styleSheets[i].href !== null &&
                    styleSheets[i].href.includes('style.css') )
                    defaultsh = true;
                const classes = styleSheets[i].rules || styleSheets[i].cssRules;
                const classesLength = classes.length;
                for (var c = 0; c < classesLength; c++) {
                    const cssClass = classes[c];
                    const selector = cssClass.selectorText;
                    // skip if there's no selector, denoting external stylesheet
                    if (selector === undefined) continue;
                    const regex = cssClass.cssText.match(/[^var(]\-\-(.*?)[:](.*?);/gi);
                    if ( regex !== null ) {
                        const elements = document.querySelectorAll(selector);
                        // skip if there are no elements with selector
                        if ( elements.length < 1 ) continue;
                        const input = regex.input;
                        regex.forEach((str) => {
                            const r = str.match(/\-\-(.*?):(.*?);/);
                            const key = r[1].trim();
                            const value = r[2].trim();
                            this.settings.set_value( key, value, 'cssvar' );
                        });
                    }
                }
            } catch (e) {
                // leaving open for error message reporting
            }
        }
    }

    // iterates over all fields of specific type and updates their values based on url params
    update_from_params(type) {
        // problem: theme vars aren't rendered yet so they're not updated here

        // get field set
        if ( type === '' || type === undefined ) type = '';
        const s = `${gd.eid} .info .field${type}`;
        const fields = document.querySelectorAll(s);
        // iterate over fields
        fields.forEach(el => {
            if ( el.classList.contains('slider') ) {
                const slider = el.querySelector('input');
                const name = slider.getAttribute('name');
                // get parameter value if user specified
                const p = gd.update_parameter( name, slider.value );
                if ( p !== '' ) {
                    slider.value = p;
                    slider.setAttribute( 'value', p );
                    slider.parentElement.setAttribute( 'data-value', p );
                }
                gd.settings.set_value( name, slider.value );
                gd.update_field(slider, p);
            } else if ( el.classList.contains('select') ) {
                const select = el.querySelector('select');
                const name = select.getAttribute('name');
                const p = gd.update_parameter( name, select.value );
                if ( p !== '' ) {
                    gd.update_field(select, p);
                }
                gd.settings.set_value( name, select.value );
            } else if ( el.classList.contains('choices') ) {
                const name = el.getAttribute('data-name');
                const v = el.querySelector('a.selected').getAttribute('data-value');
                const p = gd.update_parameter( name, v );
                if ( p != '' ) {
                    const c = el.querySelector(`a[data-value="${p}"]`);
                    if ( c !== null ) {
                        // remove previously selected class
                        el.querySelector('a.selected').classList.remove('selected');
                        c.classList.add('selected');
                    }
                }
                gd.settings.set_value( name, v );
            } else if ( el.classList.contains('selector') ) {
                const type = gd.get_selector_class(el);
                const fname = gd.settings.get_value( type + '_filename' );
                if ( fname === false ) {
                    const name = el.getAttribute('data-name');
                    // get the first child as default value
                    const a = el.querySelector('.selector-wrapper a.id');
                    const value = a.getAttribute('data-id');
                    const p = gd.update_parameter( name, value );
                    gd.settings.set_value( name, value, 'var' );
                } else {
                    gd.update_selector_url( type, fname );
                }
            }
        });
    }

    // update parameter values in storage and url
    set_param( key, value ) {
        gd.params.set( key, value );
        if ( gd.status.has('var-updated') ) {
            history.replaceState( {}, gd.settings.get_value('title'), gd.uri() );
        }
    };

    remove_class_by_prefix( e, prefix ) {
        var classes = e.classList;
        for( var c of classes ) {
            if ( c.startsWith(prefix) ) e.classList.remove(c);
        }
    }

    scroll_to(el){
        let top = el.offsetTop;
        let container = el.parentElement;
        container.scrollTop = top-container.offsetTop;
    }

    // plain js implementation of jquery index()
    find_index(node) {
        var i = 1;
        while ( node = node.previousSibling ) {
            if ( node.nodeType === 1 ) { ++i }
        }
        return i;
    }

    render( content, container, store_markdown ) {

        // markdownit options
        var md = window.markdownit({
            html: false, // Enable HTML - Keep as false for security
            xhtmlOut: true, // Use '/' to close single tags (<br />).
            breaks: true, // Convert '\n' in paragraphs into <br>
            langPrefix: 'language-', // CSS language prefix for fenced blocks.
            linkify: true,
            typographer: true,
            quotes: '“”‘’',
            highlight: function(str, lang) {
                if (lang && hljs.getLanguage(lang)) {
                    try {
                        return '<pre class="hljs"><code>' +
                            hljs.highlight(lang, str, true).value +
                            '</code></pre>';
                    }
                    catch (__) {}
                }
                return '<pre class="hljs"><code>' + md.utils.escapeHtml(str) + '</code></pre>';
            }
        });
        
        var c = document.querySelector(container);
        if ( c !== null ) c.innerHTML = md.render(content);
    };

    // render raw content, no Markdown formatting
    render_raw( content, c, markdownit ) {
        if ( markdownit === 'false' ) {
            $(c).children().remove();
            // add section div
            $(c).append('<div class="section header"></div>');
            $(c + ' .section.header').append('<div class="content"><pre class="code"></pre></div>');

            // syntax highlight code
            var $pre = $(c + ' .section.header .content pre');
            $pre.text( content );
            $pre.each(function( i, block ) {
                hljs.highlightBlock(block);
            });

            var $clone = $pre.clone();
            $clone.removeClass('code').addClass('code-overlay');
            $pre.parent().append($clone);
            $clone.hide();
        }
    };

    update_toc(s) {
        var toc = document.querySelector( gd.eid + ' .info .toc' );
        var html = '';
        if (s.length > 1 ) {
            // iterate section classes and get id name to compose TOC
            for ( var i = 0; i < s.length; i++ ) {
                var id = s[i];
                html += '<a href="#' + id + '" ';

                var classes = '';
                // add '.current' class if this section is currently selected
                if ( id === gd.get_current_section_id() ) {
                    classes += "current";
                }
                // add '.hidden' class if parent section is hidden
                var e = document.querySelector( gd.eid + ' #' + id );
                if ( e !== null && e.offsetParent === null ) {
                    classes += " hidden";
                }
                if ( classes != '' ) {
                    html += 'class="' + classes + '"';
                }
                html += '>';
                var handle = document.querySelector( `${gd.eid_inner} .section#${id} a.handle` );
                if ( handle !== null ) html += handle.innerHTML;
                html += '</a>';
            }
            if ( toc !== null ) toc.innerHTML = html;
        } else {
            // remove the toc and heading if there are no sections
            var toc_heading = document.querySelector( gd.eid + ' .info .toc-heading' );
            if ( toc_heading !== null ) {
                toc_heading.parentNode.removeChild(toc_heading);
            }
            if ( toc !== null ) {
                toc.parentNode.removeChild(toc);
            }
        }
    };

    // promise based get
    get(url) {
        return new Promise( function (resolve, reject) {
            const http = new XMLHttpRequest();
            http.open('GET', url);
            http.onload = function () {
                if ( http.status === 200 ) {
                    resolve(http.response);
                } else {
                    reject( Error(http.status) );
                }
            };
            http.onerror = function () {
                reject( Error("Error with request.") );
            };
            http.send();
        });
    }

    // helper function to parse gist response for specified file
    // @result = parsed JSON response
    get_gist_filename( result, filename ) {
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

    // directs the loading process, preparing a list of urls to be used in promise chain
    prepare_urls( id, type ) {
        var urls = [];
        // first set url to pull local file named with id
        // if that fails, we'll pull from original gist
        var file_path = '';
        var ext = '';
        // add markdown extension if file has no extension
        if ( id.indexOf('.') === -1 ) ext = '.md';
        // add css extension and css/ file path if this is a css file
        if ( type === 'css' ) {
            file_path = 'css/';
            ext = '.css';
            // push named file for ids that exist in example_themes
            for ( const key in gd.example_themes ) {
                if ( gd.example_themes[key] === id ) {
                    let f = 'gitdown-' + gd.clean(key) + ext;
                    urls.push( [type, id, file_path + f] );
                    urls.push( [type, id, '//ugotsta.github.io/gitdown/' + file_path + f] );
                }
            }
        }
        urls.push( [type, id, file_path + id + ext] );
        urls.push( [type, id, '//ugotsta.github.io/gitdown/' + file_path + id + ext] );
        urls.push( [type, id, `//api.github.com/gists/${id}`] );
        return urls;
    }

    // adjust response if content is pulled from GitHub Gist
    gistify_response( type, url, response ) {
        const filename = this.settings.get_value(type + '_filename');
        if ( url.indexOf('api.github.com') != -1 ) {
            const parsed = JSON.parse(response);
            const file = this.get_gist_filename( parsed, filename );
            this.settings.set_value( type + '_filename', file.filename );
            return file.content;
        }
        return response;
    }

    // PRIVATE METHODS -----------------------------------------------------
    
    // CONTROL FLOW:
    //
    // 1. main() - entry point
    //   1b. render_content() - render initial content
    // 2. load_initial() - get initial content
    // 3. loop - directs flow after initial load
    //   3a. get_files() - promise chain where all loading occurs after initial load
    //   3b. render_content() - content pulled from get_files() sent back to renderer
    // 4. load_done() - update ui elements and call any user provided callback
    main() {
        // update settings with URL parameters
        for (var key in this.settings.get_settings()) {
             this.update_parameter(key);
        }

        let initial =  this.settings.get_value('initial');
        if ( initial.toLowerCase === 'html' ) {
            let html = document.querySelector(gd.eid);
            if ( html !== null ) this.initial_content = html.innerHTML;
            this.render_content('html');
            this.status.add('initial');
        } else {
            this.load_initial(initial);
        }
    };
    
    load_initial(url) {
        this.get(url).then( (response) => {
            gd.render_content(response);
            gd.status.add('initial');
            gd.loop();
        }, function (error) {
            if ( error.toString().indexOf('404') ) {
                console.log(error);
            }
        });
    }

    loop() {
        const css = gd.update_parameter('css'),
        gist = gd.update_parameter('gist');

        let urls = [];
        if ( css === 'default' ) {
            gd.render_theme_css('');
        } else if ( !gd.status.has('css') ) {
            urls = gd.prepare_urls( css, 'css' );
        }

        if ( gist === 'default' ) {
            // load initial content
            if ( !gd.status.has('content') && gd.status.has('callback') ) {
                gd.status.remove('initial');
                gd.load_initial( gd.settings.get_value('initial') );
            }
            gd.status.add('content');
            gd.settings.set_value( 'gist_filename', gd.settings.get_value('content') );
        } else if ( !gd.status.has('content') ) {
            // add content urls to urls array
            const content_urls = gd.prepare_urls( gist, 'gist' );
            content_urls.forEach((e) => { urls.push(e); });
        }
        
        if ( urls.length < 1 ) {
            gd.load_done();
        } else {
            // get_files() is a recursive function that tries all urls in array
            gd.get_files(urls);
        }
    }

    // used stricly to clear existing content when loading new content
    clear_content() {
        this.sections = [];
        var e = document.querySelector( gd.eid + ' .info' );
        if ( e !== null ) e.innerHTML = '';
        e = document.querySelector( gd.eid_inner );
        if ( e !== null ) e.innerHTML = '';
    }

    // takes a series of urls and tries them until one loads succesfully
    get_files( urls ) {
        if ( urls.length < 1 ) return;
        if ( gd.status.has('done') ) return;
        const a = urls.shift();
        let type = a[0], id = a[1], url = a[2];
        /* PROMISE CHAIN */
        gd.get(url).then( (response ) => {
            gd.settings.set_value(type, id);
            gd.settings.set_value(type + '_filename', url);
            let data =  gd.gistify_response(type, url, response);
            if ( type === 'css' ) {
                gd.render_theme_css(data);
                if ( gd.status.has('content') ) gd.load_done();
            } else {
                gd.render_content(data);
                gd.status.add('content');
                // remove 'gist' content from urls since we have the content
                urls = urls.filter(i => i[0] !== 'gist');
                // complete load process if both content and css loaded successfully
                if ( gd.status.has('content,css') ) {
                    gd.load_done();
                }
            }
            gd.get_files( urls );
        }).catch( function(error) {
            console.log(error);
            gd.get_files( urls );
        })
    };

    render_content(data) {
        if ( gd.settings.get_value('initial').toLowerCase === 'html' ){
            //
        } else {
            // best practice, files should end with newline, we'll ensure it.
            data += '\n';
        }

        // preprocess data if user specified
        if( gd.settings.get_value('preprocess') ) {
            data = preprocess(data);
        }

        // setup info panel default content
        let extract = gd.extract_info_content(data);
        data = extract[0];
        if ( extract[1] !== '' ) gd.info_content = extract[1];

        // if we're just getting info content from initial, return at this point
        if ( !gd.status.has('initial') && gd.settings.get_value('gist') !== 'default' ) {
            return;
        }

        // clear content from .info and .inner
        gd.clear_content();

        // render content and info panel
        gd.render( data, gd.eid_inner, true );
        gd.render( gd.info_content, gd.eid + ' .info', false );

        // arrange content in sections based on headings
        gd.sectionize();

        // handle special tags we want to allow
        gd.tag_replace( 'kbd', gd.eid );
        gd.tag_replace( 'i', gd.eid );
        gd.tag_replace( '<!--', gd.eid );

        gd.render_variables();

        // render info panel and toc based on current section
        gd.render_info( gd.settings.get_value('title') );

        // render raw text if user specified
        gd.render_raw( data, gd.eid_inner, gd.settings.get_value('markdownit') );
        
        gd.update_ui();
    }

    render_variables() {
        // render all variables in comments
        this.render_variable_spans( gd.eid + ' .info *' );
        this.update_variables( gd.eid + ' .info *', this.variable_defaults() );
        this.render_variable_spans( gd.eid_inner + ' .section *' );
    }

    load_done() {
        // get variables from css
        gd.extract_css_vars();

        if ( gd.status.has('theme-changed') ) {
            // update the input field for the theme selector
            gd.update_selector_url( 'css', gd.settings.get_value('css_filename') );
            // update theme vars and render fields
            gd.update_wrapper_classes();
            // render cssvars with defaults from extract_css_vars
            gd.render_theme_vars();
            // update fields from newly rendered theme vars
            gd.update_from_css_vars();
            // register events for any newly created theme variable fields
            gd.register_field_events( gd.eid + ' .info .theme-vars' );
        } else {
            // complete initialization once everything is loaded
            gd.status.add('done');
            gd.update_ui();
            gd.update_wrapper_classes();
            // update theme vars and render fields
            gd.render_theme_vars();
            gd.update_from_params();
            // finally register events
            gd.register_events();
        }
        gd.execute_callback();
    }

    execute_callback() {
        // pass control back to user provided callback if it exists
        const callback = gd.settings.get_value('callback');
        if ( typeof callback == 'function' ) {
            callback.call();
            gd.status.add('callback');
        }
    }

    // add or remove various section and mode related classes to wrapper
    update_wrapper_classes() {
        let wrapper = document.querySelector(gd.eid);
        // add .gd-default class to wrapper if using default theme
        if ( gd.settings.get_value('css') === 'default' ) {
            wrapper.classList.add('gd-default');
        } else wrapper.classList.remove('gd-default');

        // add .gd-lyrics class to wrapper when using lyrics mode: heading=lyrics
        if ( gd.settings.get_value('heading') === 'lyrics' ) {
            wrapper.classList.add('gd-lyrics');
        }
    }

    update_ui() {

        /// clear any existing theme-var fields
        let v = document.querySelector( gd.eid + ' .info .theme-vars' );
        if ( v !== null ) v.innerHTML = '';
        
        gd.update_ui_from_settings();
        gd.render_highlight();

        // set current section and go there
        gd.go_to_section();

        // collapse collapsible sections at start, prior to callback
        if ( !gd.status.has('changed') ) {
            let elements = gd.eid + ' .info .field.collapsible';
            [].map.call(document.querySelectorAll(elements), (el) => {
                el.classList.add('collapsed');
            });
        }

        // hide info/nav panel if cap setting true
        if ( gd.settings.get_value('nav') === 'hide' ) {
            $( gd.eid ).addClass('panels-hidden');
        }
    }

    update_ui_from_settings() {
        const elements = ['info','help_ribbon','gist_details','css_details'];
        elements.forEach(function(i){
            if( gd.settings.get_value('hide_' + i) ) {
                var e = document.querySelector( `${gd.eid} .${ gd.clean(i)}` );
                if ( e !== null) e.parentNode.removeChild(e);
            }
        });
        if( gd.settings.get_value('disable_hide') ) {
            var e = document.querySelector( `${gd.eid} .hide` );
            if ( e !== null) e.parentNode.removeChild(e);
        }
        if( gd.settings.get_value('hide_toc') ) {
            var e = document.querySelector( `${gd.eid} .info .toc` );
            if ( e !== null) e.parentNode.removeChild(e);
        }
    };

    // called at start and when theme changes
    // renders html representing theme variables
    render_theme_vars() {
        let html = '';
        let theme_vars = document.querySelector(`${gd.eid} .info .theme-vars`);
        // begin by clearing html content
        theme_vars.innerHTML = html;
        // first ensure theme var section exists and that there's at least one css_var
        const css_vars = gd.settings.get_settings('cssvar');
        if ( theme_vars !== null && css_vars.length !== {} ) {
            for ( const key in css_vars ) {
                const value = css_vars[key];
                // check for existence of field provided through gd_var in user provided content
                let field = document.querySelector(`${gd.eid} .info .field.${key}`);
                // continue to next theme_var if field exists
                if ( field !== null ) continue;
                // check if cssvar's selector and see if it's applicable to current app
                const selector = '';
                if ( selector === '' ) {
                    html += gd.theme_var_html( key, value );
                    html +'1';
                } else {
                    // add field only if selector exists
                    let s = document.querySelector(selector);
                    if ( s !== null ) html += gd.theme_var_html( key, value );
                }
            }
            theme_vars.innerHTML = html;
        }
    }
    
    // returns html used to represent theme variables in info panel
    // for example, if a theme variable involves color selection
    // this returns html for a list box with color values like "red" and "blue"
    theme_var_html(v, value) {
        let c = '';
        const suffix = value.replace(/[0-9]/g, '');

        // COLOR fields
        // handle field as Select if its name contains keyword 'color'
        // or if its value is in list of color names
        if ( v.indexOf('color') !== -1 || gd.color_names(true).includes(value) ) {
            let items = gd.color_names();
            const upper = value.charAt(0).toUpperCase() + value.substr(1);
            items.unshift(upper);
            // ensure asterisk is added to default item
            items.forEach((val,i)=>{
                if ( val.toLowerCase() === value.toLowerCase() ) {
                    items[i] = '*' + items[i];
                }
            });
            c = gd.field_html( 'select', v, items);
            return c;
        }

        // TRANSFORMS
        if ( v.indexOf('translate') !== -1 ) {
            const items = [parseInt(value), -2000, 2000, 1, suffix];
            c = gd.field_html( 'slider', v, items);
            return [ c ];
        }
        if ( v.indexOf('scale') !== -1 ) {
            const items = [parseFloat(value), 0.15, 30, 0.1, ''];
            c = gd.field_html( 'slider', v, items);
            return [ c ];
        }
        if ( v.indexOf('perspective') !== -1 ) {
            const items = [parseFloat(value), 100, 2000, 1, suffix];
            c = gd.field_html( 'slider', v, items);
            return [ c ];
        }

        // PX and EM based values
        if ( suffix.toLowerCase() === 'px' ) {
            const items = [parseInt(value), 100, 2000, 1, suffix];
            c = gd.field_html( 'slider', v, items);
            return [ c ];
        }
        if ( suffix.toLowerCase() === 'em' ) {
            const items = [parseInt(value), 0, 400, 1, suffix];
            c = gd.field_html( 'slider', v, items);
            return [ c ];
        }
        // PERCENTAGE-based values like fontsize
        if ( suffix === '%' ) {
            const items = [parseInt(value), 10, 300, 1, suffix];
            c = gd.field_html( 'slider', v, items);
            return [ c ];
        }
        // DEGREE-based values (rotation-based params like rotateX)
        if ( suffix.toLowerCase() === 'deg' ) {
            const items = [parseInt(value), 0, 360, 1, suffix];
            c = gd.field_html( 'slider', v, items);
            return [ c ];
        }

        // BRIGHTNESS
        if ( v.indexOf('brightness') !== -1 ) {
            const items = [parseFloat(value), 1, 3, 0.05, ''];
            c = gd.field_html( 'slider', v, items);
            return [ c ];
        }

        if ( gd.begins( v, 'select_' ) ) {
            let name = v.split('select_');
            // get assignment after var name
            let assignment = name[1].split('=');
            let items = [];
            if ( assignment.length < 2 ) {
                name = assignment[0];
                if ( name.indexOf('color') !== -1 || gd.color_names(true).includes(value) ) {
                    items = gd.color_names();
                    const upper = value.charAt(0).toUpperCase() + value.substr(1);
                    items.unshift(upper);
                }
            } else {
                let v_items = assignment[1];
                name = assignment[0];
                // remove parens
                v_items = v_items.substring(1);
                v_items = v_items.substring( 0, v_items.length - 1 );
                // split items
                items = v_items.split(',');
            }
            // ensure asterisk is added to default item
            items.forEach((val,i)=>{
                if ( val.toLowerCase() === value.toLowerCase() ) {
                    items[i] = '*' + items[i];
                }
            });
            c = gd.field_html( 'select', name, items);
            return c;
        } else if( gd.begins( v, 'slider_' ) ) {
            var name = v.split('slider_');
            let assignment = name[1].split('=');
            let items = [];
            if ( assignment.length < 2 ) {
                // no assignment provided so check if there's a cssvar with this name
                const n = gd.settings.get_value(name);
                if ( n === false ) return '';
                return gd.theme_var_html( name, n );
            } else {
                let v_items = assignment[1];
                name = assignment[0];
                // remove parens
                v_items = v_items.substring(1);
                v_items = v_items.substring( 0, v_items.length - 1 );
                // split items
                items = v_items.split(',');
            }
            c = gd.field_html( 'slider', name, items);
            return [ c ];
        } else {
            //
        }
        return 'NULL |';
    }

    color_names(lowercase) {
        let l = ["AliceBlue","AntiqueWhite","Aqua","Aquamarine","Azure","Beige","Bisque","Black","BlanchedAlmond","Blue","BlueViolet","Brown","BurlyWood","CadetBlue","Chartreuse","Chocolate","Coral","CornflowerBlue","Cornsilk","Crimson","Cyan","DarkBlue","DarkCyan","DarkGoldenRod","DarkGray","DarkGrey","DarkGreen","DarkKhaki","DarkMagenta","DarkOliveGreen","Darkorange","DarkOrchid","DarkRed","DarkSalmon","DarkSeaGreen","DarkSlateBlue","DarkSlateGray","DarkSlateGrey","DarkTurquoise","DarkViolet","DeepPink","DeepSkyBlue","DimGray","DimGrey","DodgerBlue","FireBrick","FloralWhite","ForestGreen","Fuchsia","Gainsboro","GhostWhite","Gold","GoldenRod","Gray","Grey","Green","GreenYellow","HoneyDew","HotPink","IndianRed","Indigo","Ivory","Khaki","Lavender","LavenderBlush","LawnGreen","LemonChiffon","LightBlue","LightCoral","LightCyan","LightGoldenRodYellow","LightGray","LightGrey","LightGreen","LightPink","LightSalmon","LightSeaGreen","LightSkyBlue","LightSlateGray","LightSlateGrey","LightSteelBlue","LightYellow","Lime","LimeGreen","Linen","Magenta","Maroon","MediumAquaMarine","MediumBlue","MediumOrchid","MediumPurple","MediumSeaGreen","MediumSlateBlue","MediumSpringGreen","MediumTurquoise","MediumVioletRed","MidnightBlue","MintCream","MistyRose","Moccasin","NavajoWhite","Navy","OldLace","Olive","OliveDrab","Orange","OrangeRed","Orchid","PaleGoldenRod","PaleGreen","PaleTurquoise","PaleVioletRed","PapayaWhip","PeachPuff","Peru","Pink","Plum","PowderBlue","Purple","Red","RosyBrown","RoyalBlue","SaddleBrown","Salmon","SandyBrown","SeaGreen","SeaShell","Sienna","Silver","SkyBlue","SlateBlue","SlateGray","SlateGrey","Snow","SpringGreen","SteelBlue","Tan","Teal","Thistle","Tomato","Turquoise","Violet","Wheat","White","WhiteSmoke","Yellow","YellowGreen"];
        if ( lowercase ) {
            l = l.map( function(x){ return x.toLowerCase() } );
        }
        return l;
    }

    // extra info panel contents if they exist
    // does nothing if no info content is found
    // this allows users to create a custom info panel for their files
    // useful for apps like Entwine so users can create a panel that fits their story
    //
    // returns array with content and info panel content separated
    extract_info_content(content) {
        const n = '\n';
        let info_found = false, c = content, c_info = '';
        // check content for $gd_info
        if ( c.indexOf('<!-- {$gd_info} -->') != -1 ) {
            c = '';
            // get all content starting with occurrence of $gd_info
            var lines = content.split('\n');
            lines.forEach((val) => {
                if ( val.indexOf('<!-- {$gd_info} -->') != -1 ) {
                    info_found = true;
                }
                if ( info_found ) {
                    c_info += val + n;
                } else {
                    // add line to content for return later
                    c += val + n;
                }
            });
        }
        return [c, c_info];
    };

    sectionize() {

        // header section
        var header = gd.settings.get_value('header');
        var heading = gd.settings.get_value('heading');
        if ( heading === 'lyrics' ) heading = 'p';

        // Header
        const headers = document.querySelector(`${gd.eid_inner} ${header}`);
        if ( headers !== null ) {
            var name = gd.clean( headers.textContent );
            headers.classList.add('handle-heading');
            $(headers).wrapInner('<a class="handle app-title ' + name + '" name="' + name + '"/>');
            $(headers).nextUntil(heading).andSelf().wrapAll('<section class="section header" id="' + name + '"/>');
            $(headers).nextUntil(heading).wrapAll('<div class="content"/>');
        }

        // Headings

        // ensure a header exists by adding header class if headers array is null
        let h_class = "heading";
        if ( headers === null ) h_class = "header";
        const headings = document.querySelectorAll(`${gd.eid_inner} ${heading}`);
        if ( headings !== null ) {
            headings.forEach( (val, i) => {
                const $h2 = $(val);
                var name =  gd.clean( $h2.text() );
                // ensure section name/id is unique
                if ( name !== '' ) {
                    var $exists = $( gd.eid_inner + ' .section#' + name );
                    if ( $exists.length > 0 ) {
                        // name already exists so give it a new suffix
                        name = gd.unique( name, '#' );
                    }
                } else {
                    // name is empty so assign it blank with suffix
                    name = gd.unique( 'blank', '#' );
                }
                // todo: write native/non-jquery function to handle wrapping content
                $h2.addClass('handle-heading');
                $h2.wrapInner('<a class="handle" name="' + name + '"/>');
                // make first heading a header if header doesn't exist
                if ( i > 0 ) h_class = "heading";
                $h2.nextUntil(heading).andSelf().wrapAll(`<section class="section ${h_class}" id="${name}"/>`);
                $h2.nextUntil(heading).wrapAll('<div class="content"/>');
            });
        }

        // for lyrics mode, add heading content to .content div
        if ( this.settings.get_value('heading') === 'lyrics' ) {
            $( gd.eid_inner + ' .section.heading' ).each(function() {
                var heading = $(this).find('a.handle').html();
                var $c = $(this).find('.handle-heading');
                heading = `<div class="content">${heading}</div>`;
                $c.after(heading);
            });
        }

        // add section names to sections array for use with toc
        $( gd.eid_inner + ' .section a.handle' ).each(function(){
            var t = $(this).text();
            if ( t.indexOf( 'gd_info' ) === -1 ) {
                var id = $(this).closest('.section').attr('id');
                gd.sections.push( id );
            }
        });

        // if section's parent is not eid_inner, then move it there
        $( gd.eid_inner + ' .section' ).each(function() {
            var $parent = $(this).parent();
            if ( !$parent.is( $(gd.eid_inner) ) ) {
                $(this).appendTo( gd.eid_inner );
            }
        });
    };

    // to help with incorrectly formatted Markdown (which is very common)
    preprocess(data) {
        let processed = '';
        const lines = data.split('\n');
        lines.forEach((val) => {
            // start by checking if # is the first character in the line
            if ( val.charAt(0) === '#' ) {
                const x =  this.find_first_char_not('#', val);
                if ( x > 0 ) {
                    const c = val.charAt(x);
                    // check if character is a space
                    if (c != ' ') {
                        val = [val.slice(0, x), ' ', val.slice(x)].join('');
                    }
                }
            } else if ( val.charAt(0) === '-' ) {
                // add space after - where needed
                if ( val.charAt(1) != '-' && val.charAt(1) != ' ' ) {
                    val = [val.slice(0, 1), ' ', val.slice(1)].join('');
                }
            }
            processed += val + '\n';
        });
        return processed;
    };

    // navigate to section based on url hash or specific section argument
    go_to_section(section) {
        if ( section === null ) section = this.get_current_section_id();

        // first remove .current classes from wrapper
        var wrapper = document.querySelector(gd.eid);
        if ( wrapper != null ) this.remove_class_by_prefix(wrapper, 'current-');

        // remove prior .old classes from old section
        var old = document.querySelector(gd.eid_inner + ' .section.old');
        if (old !== null) {
            old.classList.remove('old', 'hi', 'lo');
        }
        
        // remove .current class from current section
        var current = document.querySelector(gd.eid_inner + ' .section.current');
        if (current !== null) {
            current.classList.add('old');
            current.classList.remove('hi', 'lo', 'current');
        }

        // now remove 'current' class from previously selected section and toc
        var current_toc = document.querySelector( gd.eid + ' .toc a.current' );
        if (current_toc !== null) current_toc.classList.remove('current');
        
        // check if this is the first time handling url hash
        var hash = location.hash;
        var header = document.querySelector( gd.eid_inner + ' .section.header' );
        if ( header === null ) {
            header = '';
        } else {
            header = header.getAttribute('id');
        }
        var header_hash = '#' + header;
        var section = document.querySelector( gd.eid_inner + ' .section' + hash );
        if( hash && section !== null && hash != header_hash ) {
            section.classList.remove('old');
            section.classList.add('current');
            section.scrollIntoView();
        } else {
            // make header the current section
            var header = document.querySelector( gd.eid + ' .section.header' );
            if ( header !== null ){
                header.classList.remove('old');
                header.classList.add('current');
            }
        }
        // add .hi or .lo to .old class so user can style based on index
        old = document.querySelector( gd.eid_inner + ' .section.old' );
        current = document.querySelector( gd.eid_inner + ' .section.current' );
        if ( old !== null && current !== null ) {
            if (  this.find_index(old) >  this.find_index(current) ) {
                current.classList.add('lo');
                old.classList.add('hi');
            } else {
                current.classList.add('hi');
                old.classList.add('lo');
            }
        }

        // add new current id to wrapper
        if ( current !== null ) {
            var id = current.getAttribute('id');
            wrapper.classList.add( 'current-' + id );
            var c = document.querySelector( `${gd.eid} .toc a[href="#${id}"]` );
            if ( c !== null ) {
                c.classList.add('current');
                 this.scroll_to(c);
            }
        }
    };

    // custom method to allow for certain tags like <i> and <kbd>
    tag_replace( tag, container ) {
        let str = document.querySelector(container).innerHTML;
        // for html comments
        if( tag === '<!--' ) {
            // add content of comments as data-attributes attribute
            // $().data( "comments", 52 );
            var r = new RegExp('&lt;!--' + '(.*?)' + '--&gt;', 'gi');
            str = str.replace( r , function(match, $1, offset, string){
                var parser = new HtmlWhitelistedSanitizer(true);
                $1 = parser.sanitizeString($1);
                return '<!--' + $1 + '-->';
            });
            $( container ).html(str);
            // replace back comments wrapped in code blocks
            $( container + ' code' ).contents().each(function(i, val) {
                if ( this.nodeType === 8 ) {
                    var p = this.parentNode;
                    var r = document.createTextNode('<!-- ' + this.nodeValue + ' -->');
                    p.replaceChild( r, this );
                }
            });
        } else {
            var open = new RegExp('&lt;' + tag + '(.*?)&gt;', 'gi');
            var close = new RegExp('&lt;\/' + tag + '&gt;', 'gi');
            str = str.replace( open , function(match, $1, offset, string){
                var parser = new HtmlWhitelistedSanitizer(true);
                $1 = parser.sanitizeString($1);
                return '<' + tag + $1 + '>';
            });
            str = str.replace(close, '</' + tag + '>');
            $( container ).html( str );
            // special handler for fontawesome icons
            if ( tag === 'i' ){
                $( container + ' i' ).attr('class', function(_, classes) {
                    if( classes.indexOf('fa-') < 0 ){
                        classes = gd.clean(classes);
                        classes = classes.replace(/icon-(.*?)/, "fa-$1");
                    }
                    return classes;
                });
                $( container + ' i' ).addClass('fa');
            }
        }
    };

    render_theme_css(css) {
        // first remove existing theme
        let el = document.querySelector('#gd-theme-css');
        if ( el !== null ) el.parentNode.removeChild(el);

        if ( css === '' ) {
            gd.settings.set_value( 'css_filename', 'style.css' );
            gd.settings.set_value( 'css', 'default' );
        } else {
            // when using a local css file, get the theme name
            let id = gd.settings.get_value('css');
            for ( const key in gd.example_themes ) {
                if ( gd.example_themes[key] === id ) {
                    gd.settings.set_value('css_filename', key);
                }
            }

            // create style tag with css content
            gd.append_style( 'style', 'gd-theme-css', css );
        }
        // store cleaned css in browser
        window.localStorage.setItem( 'gd_theme', css );
        gd.status.add('css');
    };

    extract_list_items( next, is_gist ) {
        const items = {};
        if ( next === null || next.nodeName !== "UL" ) return null;
        next.querySelectorAll('li').forEach( (el) => {
            const name = el.textContent;
            let id = '';
            let a = el.querySelector('a');
            if ( a === null ) {
                id = name;
            } else id = a.getAttribute('href');
            if (is_gist) {
                id = id.substr( id.lastIndexOf('/') + 1 );
            }
            items[name] = id;
        });
        return items;
    }

    proper_filename(f) {
        // remove occurences of gitdown- in filename
        if ( f.indexOf('gitdown-') != -1 ) f = f.split('gitdown-')[1];
        //f = f.split('gitdown-')[1];
        // remove extension
        f = f.split('.')[0];
        // replace dashes and underscores with space
        f = f.replace(/-/g, ' ');
        f = f.replace(/_/g, ' ');
        // capitalize words
        f = f.replace( /\b\w/g, l => l.toUpperCase() );
        return f;
    }

    // we can later use this function to allow use apart from GitHub
    gist_url( file, front_end ){
        if (front_end) {
            return `//github.com${gd.path}master/${file}"`;
        } else {
            return `//github.com${gd.path}blob/master/${file}`;
        }
    }

    selector_html( n, txt, placeholder, items ) {

        let file = '';
        let is_gist = false;
        if ( n === 'gist' ){
            file = gd.settings.get_value('content');
        } else if ( n === 'css' ) {
            file = 'css/style.css';
        }

        let proper = gd.proper_filename(file);
        placeholder = placeholder.replace( /\b\w/g, l => l.toUpperCase() );

        let fname = txt;
        let url = '';
        // current item
        if ( n === 'gist' || n === 'css' ) {
            is_gist = true;
            url = gd.gist_url( file, true );
            fname = proper;
        }
        
        var c = `<div class="field selector ${n}" data-name="${n}">`;
        c += `<a class="selector-source" href="${url}" target="_blank">${gd.chr_link}</a>`;
        c += `<a name="${txt}" class="${n}-url selector-url">${fname} ▾</a>`;

        c += `<div class="${n}-selector dialog">`;
        c += `<input class="${n}-input selector-input" type="text" placeholder="${placeholder}" />`;

        c += '<div class="selector-wrapper">';

        // first list item
        if ( n === 'gist' || n === 'css' ) {
            url = gd.gist_url( file, false );
            //c += list_html( { 'Default': url }, true);
            c += `<a href="${url}" target="_blank">${gd.chr_link}</a>`;
            c += `<a class="id" data-id="default">Default (${file})</a><br/>`;
        }

        // Example list
        c += gd.list_html( items, is_gist );
        c += '</div></div></div>';
        return c;
    }

    merge_arrays(a1, a2) {
        for ( const key in a2 ) { a1[key] = a2[key]; }
        return a1;
    }

    field_html( type, name, items ) {
        let hid = '';
        // variables with hid- prefix will be hidden from view with .hid class
        if ( name.includes('hid-') ) hid = 'hid';
        let c = `<div class="field ${type} ${name} ${hid}" data-name="${name}"`;
        if ( type === 'select') {
            c += `>`;
            c += `<select name="${name}">`;
            gd.settings.set_value( name, '' );
            for ( var i = 0; i < items.length; i++ ) {
                var li = items[i].innerHTML;
                if ( li === undefined ) li = items[i];
                var s = '';
                if ( li.charAt(0) === '*' ) {
                    li = li.substr(1);
                     this.settings.set_value(name, li);
                    s = 'selected';
                }
                c += `<option value="${gd.clean(li)}" ${s}>${li}</option>`;
            }
            c += '</select>';
        } else if ( type === 'slider' ) {
            c += ` data-value="${items[0]}"`;
            if ( items.length > 4 ) {
                c += ` data-suffix="${items[4]}" `;
            }
            c += `>`;
            c += `<input name="${name}" type="range" `;
            // get slider attributes
            c += ` value="${items[0]}"`;
            gd.settings.set_value( name, items[0] );
            c += ` min="${items[1]}"`;
            c += ` max="${items[2]}"`;
            c += ` step="${items[3]}"`;
            // handle suffix
            if ( items.length > 4 ) {
                c += ` data-suffix="${items[4]}" `;
            }
            c += '>';
        } else if ( type === 'choices' ) {
            c += `>`;
            gd.settings.set_value( name, '' );
            for ( var i = 0; i < items.length; i++ ) {
                var v = items[i];
                var s = '';
                if ( v.charAt(0) === '*' ) {
                    v = v.substr(1);
                    gd.settings.set_value( name, v );
                    s = 'selected';
                }
                c += `<a class="choice ${s}" data-value="${v}">${v}</a> `;
            }
        }
        c += '</div>';
        return c;
    }

    update_variables(container, vars) {
        const v = document.querySelectorAll(container + ' .gd-var');
        v.forEach( (el) => {
            const name = el.getAttribute('name');
            const value = el.getAttribute('data-value');
            const next = el.parentNode.nextElementSibling;
            let list = gd.extract_list_items( next, false );
            list = gd.merge_examples( name, list );
            // remove any lists that follow the variable
            gd.replace_variable_span( el, list, vars );
            if ( list !== null && Object.keys(list).length > 0 ) {
                next.parentElement.removeChild(next);
            }
        });
    }

    merge_examples( name, list ) {
        if ( name === 'gd_gist' ) {
            gd.example_gists = gd.examples('gist', list);
            return gd.example_gists;
        } else if ( name === 'gd_css' ) {
            gd.example_themes = gd.examples('css', list);
            return gd.example_themes;
        }
        return list;
    }

    replace_variable_span(el, items, vars) {
        let html = '';
        const name = el.getAttribute('name');
        let v_name = name.split('gd_')[1];
        const value = el.getAttribute('data-value');
        let content = el.innerHTML;
        if ( vars.hasOwnProperty(name) ) el.parentNode.innerHTML = vars[name];
        // special handler for gist and theme selectors
        if ( v_name === 'gist' ) {
            el.parentNode.innerHTML = gd.selector_html( 'gist', 'Gist', 'Gist ID', gd.example_gists );
        } else if ( v_name === 'css' ) {
            el.parentNode.innerHTML = gd.selector_html( 'css', 'Theme', 'Gist ID for CSS theme', gd.example_themes );
        }
        // special handler for fields
        let type = gd.get_field_type_from_name(v_name);
        if ( type === '' ) return;

        v_name = v_name.split( type + '_' )[1];

        if ( type === 'selector' ) {
            let item1 = Object.values(items)[0];
            if ( item1.includes('/') ) {
                let i = item1.split('/');
                item1 = i[i.length - 1];
            }
            html = gd.selector_html( v_name, item1, v_name, items );
        } else if ( type === 'collapsible' ) {
            let pos = 'start';
            if ( v_name.startsWith('end_') ) {
                pos = 'end';
                v_name = v_name.split('end_')[1];
            }
            html = gd.field_html( 'collapsible ' + pos, v_name);
        } else {
            let list = [];
            // special consideration for select fields which allow UL or values in quotes
            if ( type === 'select' && value === null ) {
                Object.keys(items).forEach( (val) => {
                    list.push(val);
                });
            } else {
                if ( value === null ) return;
                list = value.split(',');
            }
            if ( type === 'choice' ) type = 'choices';
            html = gd.field_html( type, v_name, list );
        }
        el.parentNode.innerHTML = html;
    }

    get_field_type_from_name(name) {
        const type = name.split('_');
        if ( type.length > 1 ) {
            const types = ['slider', 'choice', 'select', 'collapsible', 'selector'];
            if ( types.indexOf(type[0]) !== -1 ) {
                return type[0];
            }
        }
        return '';
    }

    variable_defaults() {
        return {
            'gd_info': gd.settings.get_value('title'),
            'gd_help_ribbon': `<a class="help-ribbon" href="//github.com${gd.path}#${gd.settings.get_value('title')}">?</a>`,
            'gd_theme_variables': '<div class="theme-vars"></div>',
            'gd_toc': '<div class="toc"></div>',
            'gd_hide': '<a class="hide"><kbd>F1</kbd> - show/hide this panel.</a>',
        }
    }

    render_variable_spans(container) {
        const variables = gd.get_variables_from_comments(container);
        variables.forEach((v) => {
            const variable = v[0], el = v[1];
            const result = gd.variable_span_html( variable, el );
            if ( result.length < 1 ) return;
            el.innerHTML = result;
        });
    }

    get_variables_from_comments(container) {
        let result = [];
        const c = document.querySelectorAll(container);
        c.forEach((el) => {
            el.childNodes.forEach((node) => {
                if ( node.nodeType === Node.COMMENT_NODE ) {
                    let v = gd.extract_variable(node.nodeValue);
                    v = gd.clean( v, 'value' );
                    result.push( [v, el] );
                }
            });
        });
        return result;
    };

    get_variable_name(v) {
        if ( !gd.begins( v, 'gd_' ) ) return '';
        const start = 0;
        const index = v.substring(start).search(/[^A-Za-z_-]/);
        if ( index < 0 ) return v;
        return v.substring(0, index);
    }

    variable_span_html( v, t ) {
        const v_name = gd.get_variable_name(v);
        // ensure the variable isn't blank and that it is allowed
        if ( v_name === '' || !gd.is_param_allowed(v_name) ) return [];
        const value = gd.get_variable_assignment(v);
        let data_value = '';
        if ( value !== '' ) data_value = `data-value="${value}"`;
        let html = `<span class="gd-var" name="${v_name}" ${data_value}></span>`;
        return html;
    };

    // simple function to get variable assignment values (ie. x="hello")
    get_variable_assignment(v) {
        let result = '';
        const assignment = v.split('=');
        if ( assignment.length > 1 ) result = assignment[1].substring(1);
        return result.substring( 0, result.length - 1 );
    }

    // simple functin to get variable content between open and close symbols
    //
    // content: content to parse for variable
    // open: characters preceding the variable
    // close: characters closing the variable
    extract_variable( content, open = '{$', close = '}' ) {
        let v = content.split(open);
        if ( v.length < 2 ) return '';
        v = v[1].split(close);
        if ( v.length < 2) return '';
        return v[0];
    };

    // simple helper to reduce repitition for getting selector class
    get_selector_class(c) {
        return c.closest('.field.selector').getAttribute('data-name');
    }

    render_info(app_title) {

        // first create .unhide div used to unhide the panel on mobile
        var fullscreen = document.querySelector( gd.eid + ' .fullscreen' );
        if ( fullscreen === null ) {
            $( gd.eid ).append('<div class="unhide"></div>');
            $( gd.eid ).append('<div class="fullscreen"></div>');
        }

        // arrange content within collapsible fields
        $( gd.eid + ' .info .field.collapsible').unwrap();
        var $c = $( gd.eid + ' .info .field.collapsible.start');
        $( gd.eid + ' .info .field.collapsible.start' ).each(function(){
            var $c = $(this);
            var data_name = $c.attr('data-name');
            // get all content between the start and end divs
            var start = gd.eid + ` .info .field.collapsible.${data_name}.start`;
            var end =`.field.collapsible.${data_name}.end`;
            var $content = $(start).nextUntil(end);
            $(end).remove();
            $content.appendTo($c);
            var html = `<div class="header" name="${data_name}">${data_name}</div>`;
            $content.wrapAll(html);
            $content.wrapAll('<div class="contents">');
        });

        // update TOC
        this.update_toc( this.get_sections() );
    };

    selector_changed(type, id) {
        // hide any visible selector field first
        $( gd.eid + ' .field.selector .dialog.visible' ).removeClass('visible');
        gd.settings.set_value(type, id);
        gd.status.add('var-updated');
        gd.set_param( type, id );
        gd.update_parameter(type, id);
        if ( type === 'css' ) {
            gd.status.remove('css,done,changed');
            gd.status.add('theme-changed');
            gd.settings.delete('cssvar');
            gd.loop();
        } else if ( type === 'gist' ) {
            gd.status.remove('content,done,changed');
            gd.status.add('content-changed');
            gd.loop();
        } else {
            gd.status.remove('changed');
            gd.status.add(type + '-changed');
            gd.execute_callback();
        }
    }

    update_from_css_vars(name, suffix) {
        let css_vars = gd.settings.get_settings('cssvar');
        const doc = document.documentElement.style;
        if ( name === undefined ) {
            css_vars = gd.settings.get('cssvar');
            css_vars.forEach(e=>{
                doc.setProperty( `--${e.name}`, e.value + e.suffix );
                history.replaceState( {}, gd.settings.get_value('title'), gd.uri() );                
            });
        } else if ( name in css_vars ) {
            // update field with specified name if it exists in css_vars
            const value = gd.update_parameter( name, css_vars[name] );
            doc.setProperty( `--${name}`, value + suffix );
        }
    }

    // helper to remove or toggle visible class for specified elements
    hide( elements, remove ) {
        if ( remove === null ) remove = false;
        [].map.call(document.querySelectorAll(elements), (el) => {
            if ( remove ) {
                el.classList.remove('visible');
            } else el.classList.toggle('visible');
        });
    }

    // helper function to avoid replication of example content
    list_html( items, is_gist_id ) {
        let content = '';
        let data_id = '';
        if ( items.length < 1 ) return content;
        for ( const key in items) {
            let url = '';
            if (is_gist_id) {
                url = items[key];
                data_id = gd.get_gist_id( items[key] );
            } else {
                url = items[key];
                data_id = items[key];
            }
            content += `<a href="${url}" target="_blank">${gd.chr_link}</a>`;
            content += `<a class="id" data-id="${data_id}">${key}</a><br/>`;
        }
        return content;
    };

    get_gist_id(gist_url) {
        let s = gist_url.split('/');
        if ( s.length < 1 ) return gist_url;
        return s[s.length - 1];
    }

    // s: wrapper selector within which to register newly created fields
    register_field_events(s) {

        // SLIDER FIELDS
        $( s + ' .field.slider input' ).unbind().on('input change', function(e) {
            // get field details
            const name = $(this).attr('name');
            let suffix = $(this).attr('data-suffix');
            if ( suffix === undefined ) suffix = '';
            const value = $(this).val();
            $(this).attr( 'value', value );
            $(this).parent().attr( 'data-value', value );
            gd.settings.set_value( name, value );
            gd.set_param( name, value );
            gd.status.add('var-updated');
            gd.update_from_css_vars(name, suffix, true);
        });

        // CHOICE FIELDS
        $( s + ' .field.choices .choice' ).unbind().click(function() {
            const name = $(this).parent().attr('data-name');
            $(this).parent().find('.selected').removeClass('selected');
            const value = $(this).attr('data-value');
            $(this).addClass('selected');
            gd.settings.set_value( name, value );
            gd.set_param( name, value );
        });

        // SELECT FIELDS
        $( s + ' .field.select select' ).unbind().change(function() {
            gd.update_field(this);
        });

        // COLLAPSIBLE FIELDS
        $( s + ' .field.collapsible .header' ).unbind().click(function(e) {
            if (e.target !== this) return;
            this.parentNode.classList.toggle('collapsed');
        });
    }

    update_field(field, value) {
        let name = field.parentElement.getAttribute('data-name');
        // name =  gd.clean(name);
        if ( value === undefined ) {
            // this indicates user initiated action so we'll update status
            gd.status.add('var-updated');
            value = field.value;
        }
        field.value = value;
        gd.settings.set_value( name, value );
        gd.set_param( name, value );
        // load user provided highlight style
        if ( name === 'highlight' ) {
            gd.render_highlight();
        }
        let suffix = field.getAttribute('data-suffix');
        if ( suffix === null ) suffix = '';
        gd.update_from_css_vars(name, suffix);
    }

    register_events() {

        gd.register_field_events(gd.eid + ' .info');

        // handle history
        window.addEventListener('popstate', function(e) {
            gd.go_to_section();
        });

        // send Ready message to whatever window opened this app
        if ( !this.status.has('done') && window.opener != null ) {
            window.opener.postMessage( 'Ready.',  this.settings.get_value('origin ') );
        }
        
        // listen for return messages from parent window
        window.addEventListener( 'message', function(event) {
            var o =  this.settings.get_value('origin');
            if ( o === '*' || event.origin === o ) {
                if ( event.data === 'Ready.') {
                    //
                } else {
                    // we've received content so render it
                    var data = JSON.parse(event.data);
                    console.log('Received data from GitHub.');
                    sections = [];
                    // clear content from .info and .inner
                    var e = document.querySelector( eid + ' .info' );
                    if ( e !== null ) e.innerHTML = '';
                    e = document.querySelector( eid_inner );
                    if ( e !== null ) e.innerHTML = '';
                    var content = data.content + '\n' + this.info_content;
                    //content = this.extract_info_content(content);
                    window.localStorage.setItem( 'gd_content', content );
                    this.render_content(content);
                }
            }
        }, false);

        // fullscreen request
        $( this.eid + ' .fullscreen').unbind().click(function(){
            var e = document.documentElement;
            gd.toggleFullscreen(e);
        });

        // event handler to toggle info panel
        $( gd.eid + ' .info .hide' ).unbind().click(function() {
            $( gd.eid ).toggleClass('panels-hidden');
        });

        // hide/unhide panel
        $( gd.eid + ' .unhide' ).unbind().on('click', function (e) {
            $( gd.eid ).removeClass('panels-hidden');
        });

        // Selector keypresses (when a user enters a gist ID and presses ENTER)
        $( gd.eid + ' .info .selector-input' ).unbind().keyup(function(e) {
            if( e.which == 13 ) {
                // get parent class
                var c = gd.get_selector_class( this.parentElement );
                var id = $(this).val();
                gd.selector_changed(c, id);
            }
        });

        // Gist and CSS selectors
        $( gd.eid + ' .info .selector-url' ).unbind().click(function() {
            // first remove any open dialogs
            $(gd.eid + ' .info .field.selector .dialog.visible').removeClass('visible');
            var c = gd.get_selector_class( this );
            var prefix = '.' + c;
            // show selector dialog
            $( `${gd.eid} ${prefix}-selector` ).addClass('visible');
            // move focus to text input
            $( `${gd.eid} ${prefix}-input` ).focus().select();

            // set position
            var p = $(this).parent().position();
            $( `${gd.eid} ${prefix}-selector` ).css({
                top: p.top + $(this).height() - 17,
                left: p.left
            });

            // create click events for links
            $( `${gd.eid} ${prefix}-selector a.id` ).unbind().click(function(event) {
                var id = $(this).attr('data-id');
                gd.selector_changed(c, id);
            });
        });

        const body = document.querySelector('body');
        // check for focus and apply keystrokes to appropriate wrapper div
        // to allow for more than one .gd wrapper per page
        body.onkeydown = function (e) {
            if ( !e.metaKey && e.which > 111 && e.which < 114 ) {
                e.preventDefault();
            }
            if( e.which === 112 ) {
                // F1 key to hide/unhide info panel
                const wrapper = document.querySelector(gd.eid);
                wrapper.classList.toggle('panels-hidden');
                // gd.hide(gd.eid + ' .panel');
                gd.hide(gd.eid + ' .selector .dialog', true);
            } else if( e.which === 113 ) {
                // F2 key to dock/undock
                const wrapper = document.querySelector(gd.eid);
                wrapper.classList.toggle('panels-docked');
            }
        };

        /* Document based events such as keypresses and general clicks */
        const eid = document.querySelector(gd.eid);
        eid.addEventListener('click', (e) => {
            // return if no .selector .dialog is visible
            let dialog = document.querySelector(gd.eid + ' .info .field.selector .dialog.visible');
            if ( dialog === null ) return;
            let closest = dialog.closest('.field.selector');
            let target = e.target;
            // hide dialog if click occurred outside of it
            if ( !closest.contains(target) ) {
                dialog.classList.remove('visible');
            }
        })
    };

}

/**
 * Simple way to track loading process 
 * @param {string} flags initial flags to set
 * 
 * this.flags = [
 *   'initial',         initial readme content loaded
 *   'css',             css loaded (either user-provided or base theme)
 *   'content',         user-specified content loaded (applicable only if user provides url)
 *   'done',            all content and css fully loaded
 *   'callback'         call to user-provided callback made, added AFTER callback completed
 *   'content-changed'  app loaded and user selected different content
 *   'theme-changed'    app loaded and user selected different theme
 *   'var-updated'      app loaded and user has made an update to a css variable field
 * ];
 */
class Status {
    
    constructor( f = [] ) {
        this.flags = f;
    }

    log() {
        console.log(this.flags);
        return this;
    }

    add(flag) {
        flag.split(',').forEach((e) => {
            if ( this.flags.indexOf(e) === -1 ) this.flags.push(e);
        });
        return this;
    }

    remove(flag) {
        let f = this;
        flag.split(',').forEach((e) => {
            if ( e === 'changed' ) {
                // iterate over this.flags and remove occurences of -changed
                this.flags.forEach((val, i) => {
                    if ( val.indexOf('-changed') !== -1 ) {
                        this.flags.splice(i, 1);
                    }
                });
            } else {
                let i = this.flags.indexOf(e);
                if ( i !== -1 ) this.flags.splice(i,1);
            }
        });
        return this;
    }

    has(flag) {
        if ( flag === 'changed' ) {
            // return true if any flags have text '-changed'
            this.flags.forEach((e) => {
                if ( e.indexOf('-changed') !== -1 ) return true;
            });
        // iterate over user provided flag and return true if they're all in status.flags
        } else {
            let result = false;
            flag.split(',').forEach((e) => {
                let i = this.flags.indexOf(e);
                if ( i !== -1 ) {
                    result = true;
                } else return result = false;
            });
            return result;
        }
    }

}

/**
 * Centralized handler for app settings and default values
 * @param {object} options user provided initial settings
 */
class Settings {
    
    constructor( options = [], parameters_protected ) {
        this.initial_options = options;
        this.settings = this.initial_settings();
        this.parameters_protected = parameters_protected;
    }

    reset() {
        this.settings = this.initial_settings();
    }

    // helper function to determine if a setting should be included in query string
    should_include(setting) {
        const name = setting.name;
        const value = String(setting.value);
        const default_value = String(setting.default);
        const suffix = setting.suffix;

        // exclude names with hid- prefix
        if ( name.includes('hid-') ) return false;

        // exclude any settings with _filename for now
        if ( name.includes('_filename') ) return false;
        
        // exclude setting if its value = default_value
        if ( value + suffix == default_value ) return false;
        
        // exclude protected params
        let p = this.parameters_protected.split(',');
        if ( p.includes(name) ) return false;

        // exclude params
        p = this.get_value('parameters_disallowed').split(',');
        if ( p.includes(name) ) return false;

        return true;
    }

    // returns a string of settings in url parameter format
    to_string(type) {
        let count = 0;
        let result = '';
        for ( const i in this.settings ) {
            if ( this.should_include( this.settings[i] ) ) {
                const s = this.settings[i];
                if ( count > 0 ) result += '&';
                result += `${s.name}=${s.value}`;
                count += 1;
            }
        }
        return result;
    }

    // delete settings of specified type
    delete(type) {
        let result = [];
        for ( const i in this.settings ) {
            const s = this.settings[i];
            if ( type !== undefined && type !== s.type ) {
                result.push(s);
            }
        }
        this.settings = result;
    }

    // return a key/value array of settings without defaults
    get_settings(type) {
        let result = [];
        for ( const i in this.settings ) {
            const s = this.settings[i];
            if ( type === undefined ) {
                result[s.name] = s.value;
            } else if ( type === s.type ) {
                result[s.name] = s.value;
            }
        }
        return result;
    }
    
    get(type) {
        return this.settings.filter(i => i.type === type);
    }

    // return a setting's value by specified setting name
    get_value(name) {
        const key = this.settings.find(i => i.name === name);
        if ( key === undefined ) return false;
        return key.value;
    }

    // returns the default value for a specific setting by name
    get_default(name) {
        const key = this.settings.find(i => i.name === name);
        return key.default;
    }

    // set a value by specified setting name
    set_default(name, value) {
        const key = this.settings.find(i => i.name === name);
        if ( key === undefined ) return false;
        return key.default = value;
    }

    get_suffix(s){
        if ( s.match(/^\d/) ) return s.replace(/[0-9]/g, '');
        return '';
    }

    // set a value by specified setting name
    set_value(name, value, type) {
        if ( type === undefined ) type = 'app';
        const key = this.settings.find(i => i.name === name);
        let suffix = '';
        if ( type.includes('var') ) suffix = this.get_suffix(value);
        
        // push new setting to array if it doesn't already exist
        if ( key === undefined ) {
            const setting = {
                name: name,
                value: value,
                default: value,
                type: type,
                suffix: suffix
            }
            this.settings.push(setting);
            return;
        }
        // if setting is a cssvar, update the default value
        if ( type === 'cssvar' ) {
            key.default = value;
            key.value = value;
            // for special cases where user adds var to content
            // where var already exists as a cssvar, let that field
            // reference the cssvar

            // this lets users place fields for cssvars where they want

            // how do we now remove the css field for this?
            // by the time we're at theme_var_html, cssvars have been extracted
            // so we can use the data from the cssvar
            key.type = 'cssvar';
        }
        return key.value = value;
    }

    initial_settings() {
        let result = [];
        const defaults = {
            initial: 'README.md',    // initial content, either a local filename or 'HTML'
            header: 'h1',            // element to use for header
            heading: 'h2',           // element to use for sections
            inner: 'inner',          // inner container for styling
            content: 'default',
            content_filename: '',
            gist: 'default',
            gist_filename: '',
            css: 'default',
            css_filename: '',
            highlight: 'default',
            preprocess: false,
            nav: 'show',

            // set false to not render markdown
            markdownit: true,

            // defaults unavailable as url parameters
            title: 'GitDown',
            hide_info: false,
            hide_help_ribbon: false,
            hide_gist_details: false,
            hide_css_details: false,
            hide_toc: false,
            disable_hide: false,
            parameters_disallowed: 'initial,title,disable_hide,hide_any',

            // GitDown stores a bunch of examples by default
            // set these to false to not merge them into your app
            merge_themes: true,
            merge_gists: true,

            origin: '//ugotsta.github.io',
        };

        // merge user pvovided options, these options will become new defaults
        for ( const key in this.initial_options ) {
            defaults[key] = this.initial_options[key];
        }

        // now we'll create an object, assign defaults and return it
        for ( const key in defaults ) {
            const setting = {
                name: key,
                value: defaults[key],
                default: defaults[key],
                type: 'core',
                suffix: ''
            }
            result.push(setting);
        }
        return result;
    }

}