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
        // get URL parameters
        this.status = new Status();
        this.parameters_protected = 'markdownit,callback,merge_themes,merge_gists,origin';
        this.set_examples();
        this.initial_content = '', this.info_content = '';
        this.sections = [];
        this.chr_link = '⮎';
        this.css_vars = {};
        this.params = (new URL(location)).searchParams;
        this.path = '/' + window.location.hostname.split('.')[0] + window.location.pathname;
        this.settings = this.default_options(options);
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
        let content = '<div class="' + this.settings.inner + '">';
        content += '</div>';
        content += '<div class="info panel"></div>';
        el.innerHTML += content;
        // helper variables to simplify access to container elements
        this.eid_inner = ' .' + this.settings.inner;
        // setup default info content
        this.info_content = this.default_info_content();
    };

    set_examples() {
        this.example_gist = {};
        this.example_css = {};
        // we'll use jquery $.extend later to merge these
        this.example_gist_default = { "Alexa Cheats": "2a06603706fd7c2eb5c93f34ed316354",
                                    "Vim Cheats": "c002acb756d5cf09b1ad98494a81baa3"
        };

        this.example_css_default = { "Technology": "adc373c2d5a5d2b07821686e93a9630b",
                                    "Console": "e9217f4e7ed7c8fa18f13d12def1ad6c",
                                    "Tech Archaic": "2d004ce3de0abc7a27be84f48ea17591",
                                    "Saint Billy": "76c39d26b1b44e07bd7a783311caded8",
                                    "Ye Olde Tavern": "c05dec491e954e53e050c6e9d60d7a25",
                                    "Old Glory": "43bff1c9c6ae8a829f67bd707ee8f142",
                                    "Woodwork": "c604615983fc6cdd5ebdbdd053800298",
                                    "Graph Paper": "77b1f66ad5093c2db29c666ad15f334d",
                                    "Eerie": "7ac556b27c2cd34b00aa59e0d3621dea",
                                    "Writing on the Wall": "241b47680c730c7162cb5f82d6d788fa",
                                    "Ghastly": "d1a6d5621b883bf6af886855d853d502",
                                    "Gradient Deep": "51aa23d96f9bd81fe55c47b2d51855a5",
                                    "Shapes": "dbb6369d5cef9801d11e0c342b47b2e0"
        };
    }

    default_options(options) {
        const defaults = {
            initial: 'README.md',       // initial content, either a local filename or 'HTML'
            header: 'h1',               // element to use for header
            heading: 'h2',              // element to use for sections
            inner: 'inner',   // inner container for styling
            fontsize: '',
            content: 'default',
            content_filename: '',
            gist: 'default',
            gist_filename: '',
            css: 'default',
            css_filename: '',
            highlight: 'default',
            preprocess: false,

            // set false to not render markdown
            markdownit: true,

            // defaults unavailable as url parameters
            title: 'GitDown',
            hide_info: false,
            hide_help_ribbon: false,
            hide_element_count: false,
            hide_gist_details: false,
            hide_css_details: false,
            hide_toc: false,
            disable_hide: false,
            parameters_disallowed: 'title,hide_any',

            // GitDown stores a bunch of examples by default
            // set these to false to not merge them into your app
            merge_themes: true,
            merge_gists: false,

            origin: '//ugotsta.github.io',
        };
        // merge options with defaults, preferring user-specified options
        for ( const key in options ) {
            defaults[key] = options[key];
        }
        return defaults;
    }

    // PUBLIC METHODS ------------------------------------------------------

    // detect specified url parameter, clean and add it to settings
    update_parameter( key, default_value ) {
        let val = default_value;
        if ( val === undefined ) val = this.settings[key];
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
                this.settings[key] = val;
            }
        }
        return val;
    };

    is_param_allowed(p) {
        let allowed = this.settings.parameters_disallowed.split(',');
        let pro = this.parameters_protected.split(',');
        if ( pro.indexOf(p) === -1 && allowed.indexOf(p) === -1 ) {
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
        let q = this.params.toString();
        if ( q.length > 0 ) q = '?' + q;
        let base = window.location.href.split('?')[0];
        base = base.split('#')[0];
        return base + q + location.hash;
    };

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
            str = str.replace(/[^a-z0-9_\s-]/g, '-');
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
        if ( t.indexOf(str) === 0 ) {
            return true;
        }
        return false;
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

    // load user specified highlight style
    render_highlight() {
        var h = this.settings['highlight'];
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

    // add style to head either inline or external stylesheet
    // type: link or style
    // id: optional id so we can alter href later
    // content: either href or actual style content
    append_style( type, id, content ){
        let s  = document.createElement(type);
        s.type = 'text/css';
        if ( type === 'link' ){
            s.rel  = 'stylesheet';
            s.href = content;
        } else if ( type === 'style' ) {
            if (s.styleSheet) {
                s.styleSheet.cssText = content;
                } else {
                // attempt to sanitize content so hacker don't splodes our website
                const parser = new HtmlWhitelistedSanitizer(true);
                const css = parser.sanitizeString(content);
                s.appendChild(document.createTextNode(css));
                }
        }
        if ( id !== null ) s.id = id;
        document.head.appendChild(s);
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
        
        // update url field with filanem
        let url_field = document.querySelector( `${gd.eid} .info .${type}-url` );
        if ( url_field !== null ) url_field.textContent = fname + ' ▾';

        let id = gd.settings[`${type}`];
        let filename = gd.settings[`${type}_filename`];

        let href = '';
        if ( id === 'default' ) {
            href = gd.gist_url( gd.settings.content, false );
        } else {
            href = '//gist.github.com/' + id;
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
        for ( const key in gd.css_vars ) {
            if ( key === k ) {
                return gd.css_vars[k][0];
            }
        }
        return '';
    }

    // basically, tries to find a unique name for an element by adding
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

    preprocess_css(css) {
        // setup vars to store css variables
        let vars = {};
        // iterate over css to get variables
        let lines = css.split('\n');
        let pre_css = '';
        for ( var i = 0; i < lines.length; i++ ) {
            let re = lines[i].match(/\$(.*?):(.*?);/);
            if (re) {
                let key = re[1];
                let value = re[2];
                // check for existence of url parameter
                let v = this.update_parameter(key);
                if ( v !== undefined && v !== '' && v.toLowerCase() !== 'default' ) {
                    // ensure css variable name isn't already used in settings
                    if ( this.settings['key'] === undefined ) {
                        value = v;
                    }
                }
                let val = [];
                val.push(value);
                // get variable declaration from comment if it exists
                let d = lines[i].split('{$gd_');
                if ( d.length > 1 ) {
                    val.push(d[1].split('}')[0]);
                    let selector = d[0];
                    // add any user specific selector to array
                    selector = selector.split('/*');
                    if ( selector.length > 1 ) {
                        val.push( selector[1].trim() );
                    } else val.push('');
                } else {
                    val.push('');
                    val.push('');
                }
                // css_vars[key] = {value, optional variable decalaration, optional selector}
                 this.css_vars[key] = val;
            } else {
                pre_css += lines[i];
            }
        }
        // iterate over vars and replace occurences in css
        for ( const key in this.css_vars ) {
            let value = this.css_vars[key][0];
            pre_css = pre_css.split( '$' + key ).join(value);
        }
        return pre_css;
    }

    // update fields based on url parameters
    update_fields_with_params(type) {
        if ( type === '' || type === undefined ) type = '';
        var $fields = $( `${gd.eid} .info .field${type}` );
        $fields.each(function(){
            var field_class = '';
            var $f = $(this);
            if ( $f.hasClass('slider') ) {
                var $slider = $f.find('input');
                var name = $slider.attr('name');
                // get parameter value if user specified
                var p = gd.update_parameter( name, $slider.val() );
                if ( p != '' ) {
                    $slider.val(p);
                    $slider.attr( 'value', p );
                    $slider.parent().attr( 'data-value', p );
                }
                gd.settings[name] = $slider.val();
            } else if ( $f.hasClass('select') ) {
                var $select = $f.find('select');
                var name = $select.attr('name');
                var p = gd.update_parameter( name, $select.val() );
                if ( p != '' ) {
                    $select.val(p);
                    $select.change();
                }
                gd.settings[name] = $select.val();
            } else if ( $f.hasClass('choices') ) {
                let $choices = $f.find('a');
                let name = $choices.parent().attr('data-name');
                let v = $f.find('a.selected').attr('data-value');
                let p = gd.update_parameter( name, v );
                if ( p != '' ) {
                    let $c = $f.find(`a[data-value="${p}"]`);
                    if ( $c.length > 0 ) {
                        // remove previously selected class
                        $f.find('a.selected').removeClass('selected');
                        $c.addClass('selected');
                    }
                }
                gd.settings[name] = v;
            } else if ( $f.hasClass('selector') ) {
                let type = gd.get_selector_class($f);
                let $display_name = $f.find(`.${type}-url`);
                let fname = gd.settings[`${type}_filename`];
                gd.update_selector_url( type, fname );
            }
        });
    }

    // update parameter values in storage and url
    set_param( key, value ) {
        gd.params.set( key, value );
        history.replaceState( {}, gd.settings.title, gd.uri() );
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

    default_info_content() {
        var n = '\n';
        var info = '# Info <!-- {$gd_info} -->' + n;
        info += '<!-- {$gd_help_ribbon} -->' + n;
        info += '<!-- {$gd_element_count} -->' + n;
        info += 'GIST <!-- {$gd_gist} -->' + n;
        info += 'CSS <!-- {$gd_css} -->' + n;
        info += '## Table of Contents <!-- {$gd_toc} -->' + n;
        info += '<!-- {$gd_hide} -->' + n;
        return info;
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
            var http = new XMLHttpRequest();
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
            // push named file for ids that exist in example_css_default
            for ( const key in gd.example_css_default ) {
                if ( gd.example_css_default[key] === id ) {
                    urls.push( [type, id, file_path + 'gitdown-' + gd.clean(key) + ext] );
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
        const filename = this.settings[type + '_filename'];
        if ( url.indexOf('api.github.com') != -1 ) {
            const parsed = JSON.parse(response);
            const file = this.get_gist_filename( parsed, filename );
            this.settings[type + '_filename'] = file.filename;
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
        for (var key in  this.settings) {
             this.update_parameter(key);
        }

        let initial =  this.settings.initial;
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

    // todo: after content-changed, events aren't registered or are re-registered to cancel them
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
                gd.load_initial(gd.settings.initial);
            }
            gd.status.add('content');
            gd.settings.gist_filename =  gd.settings.content;
        } else if ( !gd.status.has('content') ) {
            const content_urls = gd.prepare_urls( gist, 'gist' );
            content_urls.forEach((e) => { urls.unshift(e); });
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
            gd.settings[type] = id;
            gd.settings[type + '_filename'] = url;
            let data =  gd.gistify_response(type, url, response);
            if ( type === 'css' ) {
                gd.render_theme_css(data);
                if ( gd.status.has('content') ) gd.load_done();
            } else {
                // clear content from .info and .inner
                gd.clear_content();
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
        if ( gd.settings.initial.toLowerCase === 'html' ){
            //
        } else {
            // best practice, files should end with newline, we'll ensure it.
            data += '\n';
        }

        // preprocess data if user specified
        if( gd.settings.preprocess ) {
            data = preprocess(data);
        }

        // create data backup for use with render_raw()
        var raw_data = data;

        // setup info panel default content if it doesn't exist
        data = gd.extract_info_content(data);

        // if we're just getting info content from initial, return at this point
        let initial = gd.status.has('initial');
        let gist = gd.settings.gist;
        if ( !initial && gist !== 'default' ) return;

        // render content and info panel
        gd.render( data, gd.eid_inner, true );
        gd.render( gd.info_content, gd.eid + ' .info', false );

        // arrange content in sections based on headings
        gd.sectionize();

        // handle special tags we want to allow
        gd.tag_replace( 'kbd', gd.eid );
        gd.tag_replace( 'i', gd.eid );
        gd.tag_replace( '<!--', gd.eid );

        // render info panel and toc based on current section
        gd.render_info( gd.settings.title );

        // render raw text if user specified
        gd.render_raw( raw_data, gd.eid_inner, gd.settings.markdownit );
        
        gd.update_ui();
    }

    load_done() {
        if ( gd.status.has('theme-changed') ) {
            // update theme vars and render fields
            gd.update_theme_vars();
        } else {
            // complete initialization once everything is loaded
            gd.status.add('done');
            gd.update_ui();
            // update theme vars and render fields
            gd.update_theme_vars();
            // finally register events
            gd.register_events();
            // pass control back to user provided callback if it exists
            if ( typeof gd.settings.callback == 'function' ) {
                gd.settings.callback.call();
                gd.status.add('callback');
            }
        }
    }

    update_ui() {

        /// clear any existing theme-var fields
        let v = document.querySelector( gd.eid + ' .info .theme-vars' );
        if ( v !== null ) v.innerHTML = '';

        // update fields based on params
        gd.update_fields_with_params();
        // where are we updating parameters based on fields like sliders?
        var fontsize = parseInt( gd.settings.fontsize );
        if ( fontsize != '' ) $( gd.eid_inner ).css('font-size', fontsize + '%');
        
        gd.update_ui_from_settings();
        gd.render_highlight();

        // set current section and go there
        gd.go_to_section();

        // hide selector dialogs at start
        $( gd.eid + ' .info .field.selector .dialog' ).hide();
        // toggle collapsible sections at start, prior to callback
        if ( !gd.status.has('changed') ) {
            $( gd.eid + ' .info .field.collapsible' ).addClass('collapsed');
        }
        
        let wrapper = document.querySelector(gd.eid);
        // add .gd-default class if using default theme
        if ( gd.settings.css === 'default' ) {
            wrapper.classList.add('gd-default');
        } else wrapper.classList.remove('gd-default');

        // add .gd-lyrics class when using lyrics mode: heading=lyrics
        if ( gd.settings.heading === 'lyrics' ) {
            wrapper.classList.add('gd-lyrics');
        }
    }

    update_ui_from_settings() {
        // rewrite with forEach() to hide settings based on element name
        const elements = ['info','help_ribbon','element_count','gist_details','css_details'];
        elements.forEach(function(i){
            if( gd.settings[`hide_${i}`] ) {
                var e = document.querySelector( `${gd.eid} .${ gd.clean(i)}` );
                if ( e !== null) e.parentNode.removeChild(e);
            }
        });
        if( gd.settings['disable_hide'] ) {
            var e = document.querySelector( `${gd.eid} .hide` );
            if ( e !== null) e.parentNode.removeChild(e);
        }
        if( gd.settings['hide_toc'] ) {
            var e = document.querySelector( `${gd.eid} .info .toc` );
            if ( e !== null) e.parentNode.removeChild(e);
        }
    };

    update_theme_vars() {
        // todo: use same code base as variable_html()
        let html = '';
        let theme_vars = document.querySelector(gd.eid + ' .info .theme-vars');
        if ( theme_vars !== null ) {
            for ( const key in gd.css_vars ) {
                // get variable declaration if it exists
                let d = gd.css_vars[key][1];
                if ( d !== '' ) {
                    // check if selector exists in current content
                    let selector = gd.css_vars[key][2];
                    if ( selector === '' ) selector = '*';
                    selector = document.querySelector(selector);
                    if ( selector !== null ) {
                        let type = d.split('=')[0];
                        if ( type === 'slider' ) {
                            // get the assigned string
                            let v_items = d.split('=')[1];
                            // remove parens
                            v_items = v_items.substring(1).substring( 0, v_items.length - 1 );
                            v_items = v_items.substring( 0, v_items.length - 1 );
                            // get user assigned string
                            let items = v_items.split(',');
                            // generate slider html
                            html += field_html( 'slider', key, items);
                        }
                    }
                }
            }
            theme_vars.innerHTML = html;
            gd.update_fields_with_params();
        }
    }

    // extra info panel contents if they exist
    // does nothing if no info content is found
    // this allows users to create a custom info panel for their files
    // useful for apps like Entwine so users can create a panel that fits their game
    extract_info_content(content) {
        var n = '\n';
        var info = '';
        var info_found = false;
        var c = content;
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
                    info += val + n;
                } else {
                    // add line to content for return later
                    c += val + n;
                }
            });
            gd.info_content = info;
        }
        return c;
    };

    sectionize() {

        // header section
        var header = gd.settings.header;
        var heading = gd.settings.heading;
        if ( heading === 'lyrics' ) heading = 'p';

        if ( $( gd.eid_inner + ' ' + header ).length ) {
            $( gd.eid_inner + ' ' + header ).each(function() {
                var name = gd.clean( $(this).text() );
                $(this).addClass('handle-heading');
                $(this).wrapInner('<a class="handle app-title ' + name + '" name="' + name + '"/>');
                $(this).nextUntil(heading).andSelf().wrapAll('<div class="section header" id="' + name + '"/>');
                $(this).nextUntil(heading).wrapAll('<div class="content"/>');
            });
        } else {
            // add a header if none already exists
            if ( $( gd.eid_inner + '.section.header').length > 0 ) {
                $( gd.eid_inner ).append('<div class="section header"></div>');
            }
        }

        // create sections
        $( gd.eid_inner + ' ' + heading ).each(function() {
            var name =  gd.clean( $(this).text() );
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
            $(this).addClass('handle-heading');
            $(this).wrapInner('<a class="handle" name="' + name + '"/>');
            $(this).nextUntil(heading).andSelf().wrapAll('<div class="section heading" id="' + name + '"/>');
            $(this).nextUntil(heading).wrapAll('<div class="content"/>');
        });

        // for lyrics mode, add heading content to .content div
        if ( this.settings.heading === 'lyrics' ) {
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
        var processed = '';
        var lines = data.split('\n');
        lines.forEach((val) => {
            // start by checking if # is the first character in the line
            if ( val.charAt(0) === '#' ) {
                var x =  this.find_first_char_not('#', val);
                if ( x > 0 ) {
                    var c = val.charAt(x);
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
            gd.settings.css_filename = 'style.css';
            gd.settings.css = 'default';
        } else {
            // preprocess_css is our sissy lttle sass wannabe :)
            let preprocessed = gd.preprocess_css(css);

            // when using a local css file, get the theme name
            let id = gd.settings.css;
            for ( const key in gd.example_css_default ) {
                if ( gd.example_css_default[key] === id ) {
                    gd.settings.css_filename = key;
                }
            }

            // create style tag with css content
            gd.append_style( 'style', 'gd-theme-css', preprocessed );
        }
        // store cleaned css in browser
        window.localStorage.setItem( 'gd_theme', css );
        gd.status.add('css');
    };

    extract_list_items( $next, is_gist ) {
        const items = {};
        if ( !$next.is('ul') ) return items;
        // iterate over list and popular items
        $next.find('li').each(function(){
            const $li = $(this);
            const name = $li.text();
            let id = $li.find('a').attr('href');
            if (is_gist) {
                id = id.substr( id.lastIndexOf('/') + 1 );
            }
            items[name] = id;
        });
        $next.remove();
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

    selector_html( n, $t, placeholder, items ) {

        var file = '';
        var is_gist = false;
        if ( n === 'gist' ){
            file = gd.settings.content;
        } else if ( n === 'css' ) {
            file = 'css/style.css';
        }

        var proper = gd.proper_filename(file);
        placeholder = placeholder.replace( /\b\w/g, l => l.toUpperCase() );
        
        var c = `<div class="field selector ${n} ${n}-details">`;
        let txt = $t.text();

        // current item
        if ( n === 'gist' || n === 'css' ) {
            is_gist = true;
            var url = gd.gist_url( file, true );
            c += `<a class="selector-source" href="${url}" target="_blank">${gd.chr_link}</a>`;
            c += `<a name="${txt}" class="${n}-url selector-url">${proper} ▾</a>`;
        } else {
            // other selectors
            c += `<a class="selector-source" href="${txt}" target="_blank">${gd.chr_link}</a>`;
            c += `<a name="${txt}" class="${n}-url selector-url">${txt} ▾</a>`;
        }

        c += `<div class="${n}-selector dialog">`;
        c += `<input class="${n}-input selector-input" type="text" placeholder="${placeholder}" />`;

        c += '<div class="selector-wrapper">';

        // first list item
        if ( n === 'gist' || n === 'css' ) {
            var url = gd.gist_url( file, false );
            //c += list_html( { 'Default': url }, true);
            c += `<a href="${url}" target="_blank">${gd.chr_link}</a>`;
            c += `<a class="id" data-id="default">Default (${file})</a><br/>`;
        }

        // Example list
        c += gd.list_html( items, is_gist );
        c += '</div></div></div>';
        return c;
    }

    // and return the html along with instructions for handling it
    variable_html( v, t ) {
        var $t = $(t);
        // c is the html content
        var c = '';
        var title = gd.settings.title;
        if ( v != '' ) {
            if ( gd.begins( v, 'gd_info' ) ) {
                //$t.text( title ).addClass(  this.clean(title) + ' app-title' );
                return [ title, 'text' ];
            } else if (  gd.begins( v, 'gd_help_ribbon' ) ) {
                c = '<a class="help-ribbon" href="//github.com' + gd.path;
                c += '#' + title.toLowerCase() + '">?</a>';
                return [ c, 'html' ];
            } else if ( gd.begins( v, 'gd_element_count' ) ) {
                c = '<div class="element-count">.section total:</div>';
                return [ c, 'append' ];
            } else if ( v === 'gd_gist' ) {
                // first extract contents of list for examples
                var items = gd.extract_list_items( $t.next(), true );
                // check settings and merge examples if needed
                if ( gd.settings.merge_gists ) {
                    gd.example_gist = $.extend( gd.example_gist_default, items );
                } else {
                    gd.example_gist = items;
                }
                c = gd.selector_html( 'gist', $t, 'Gist ID', gd.example_gist );
                if ( !gd.is_param_allowed('gist') ) c = '';
                return [ c, 'html' ];
            } else if ( v === 'gd_css' ) {
                // first extract contents of list for examples
                var items = gd.extract_list_items( $t.next(), true );
                // check settings and merge examples if needed
                if ( gd.settings.merge_themes === 'false' ) {
                    gd.example_css = items;
                } else {
                    gd.example_css = $.extend( gd.example_css_default, items );
                }
                c = gd.selector_html( 'css', $t, 'Gist ID for CSS theme', gd.example_css );
                $t.next('br').remove();
                if (!gd.is_param_allowed('css')) c = '';
                return [ c, 'html' ];
            } else if ( gd.begins( v, 'gd_toc' ) ) {
                // handle assignment, letting user provide header text
                if ( v.indexOf('=') != -1 ) {
                    var toc = v.split('=')[1];
                    toc = toc.replace(/["'“”]/g, '');
                    c += '<h3 class="toc-heading">' + toc + '</h3>';
                }
                c += '<div class="toc"></div>';
                if ( $t.is('p') ) {
                    return [ c, 'before' ];
                } else return [ c, 'after' ];
            } else if ( gd.begins( v, 'gd_hide' ) ) {
                c = '<a class="hide"><kbd>Esc</kbd> - show/hide this panel.</a>';
                return [ c, 'html' ];
            } else if ( gd.begins( v, 'gd_theme_variables' ) ) {
                c = '<div class="theme-vars"></div>';
                return [ c, 'html' ];
            } else if ( gd.begins( v, 'gd_selector_' ) ) {
                var v_name = v.split('gd_selector_')[1];
                // first extract contents of list for examples
                var items = gd.extract_list_items( $t.next(), false );
                c = gd.selector_html( v_name, $t, v_name, items );
                return [ c, 'html' ];
            } else if ( gd.begins( v, 'gd_choice_' ) ) {
                var v_name = v.split('gd_choice_')[1];
                // return if there's no assignment after variable
                if ( v_name.indexOf('=') === -1 ) return;
                // remove assignment text from name
                v_name = v_name.split('=')[0];
                // get the assigned string
                var v_items = v.split('=')[1];
                // remove parens
                v_items = v_items.substring(1);
                v_items = v_items.substring( 0, v_items.length - 1 );
                // get user assigned string
                var items = v_items.split(',');
                c = gd.field_html( 'choices', v_name, items);
                return [ c, 'html' ];
            } else if (  this.begins( v, 'gd_select_' ) ) {
                var v_name = v.split('gd_select_')[1];
                var next = t.nextElementSibling;
                var items = {};
                if ( next !== null && next.tagName === 'UL' ) {
                    items = next.getElementsByTagName('li');
                }
                c = gd.field_html( 'select', v_name, items );
                next.parentNode.removeChild(next);
                return [ c, 'html' ];
            } else if (  gd.begins( v, 'gd_slider_' ) ) {
                var v_name = v.split('gd_slider_')[1];
                // return if there's no assignment after variable
                if ( v_name.indexOf('=') === -1 ) return;
                // remove assignment text from name and ensure it's clean (no malicious HTML)
                v_name = gd.clean( v_name.split('=')[0] );
                // get the assigned string
                var v_items = v.split('=')[1];
                // remove parens
                v_items = v_items.substring(1).substring( 0, v_items.length - 1 );
                v_items = v_items.substring( 0, v_items.length - 1 );
                // get user assigned string
                var items = v_items.split(',');
                // generate slider html
                c = gd.field_html( 'slider', v_name, items);
                return [ c, 'append' ];
            } else if (  gd.begins( v, 'gd_collapsible_' ) ) {
                var v_name = v.split('gd_collapsible_')[1];
                var pos = 'start';
                if ( v_name.startsWith('end_') ) {
                    pos = 'end';
                    v_name = v_name.split('end_')[1];
                }
                v_name = gd.clean(v_name);
                c = gd.field_html( 'collapsible ' + pos, v_name);
                return [ c, 'html' ];
            }
        }
    };

    field_html( type, name, items ) {
        var c = `<div class="field ${type} ${name}" data-name="${name}">`;
        if ( type === 'select') {
            c += `<select name="${name}">`;
            gd.settings['name'] = '';
            for ( var i = 0; i < items.length; i++ ) {
                var li = items[i].innerHTML;
                var s = '';
                if ( li.charAt(0) === '*' ) {
                    li = li.substr(1);
                     this.settings['name'] = li;
                    s = 'selected';
                }
                c += `<option value="${gd.clean(li)}" ${s}>${li}</option>`;
            }
            c += '</select>';
        } else if ( type === 'slider' ) {
            c += `<input name="${name}" type="range" `;
            // get slider attributes
            c += ` value="${items[0]}"`;
             this.settings['name'] = items[0];
            c += ` min="${items[1]}"`;
            c += ` max="${items[2]}"`;
            c += ` step="${items[3]}"`;
            // handle suffix
            if ( items.length > 4 ) {
                c += ` data-suffix="${items[4]}" `;
            }
            c += '>';
        } else if ( type === 'choices' ) {
             this.settings['name'] = '';
            for ( var i = 0; i < items.length; i++ ) {
                var v = items[i];
                var s = '';
                if ( v.charAt(0) === '*' ) {
                    v = v.substr(1);
                    gd.settings['name'] = v;
                    s = 'selected';
                }
                c += `<a class="choice ${s}" data-value="${v}">${v}</a> `;
            }
        }
        c += '</div>';
        return c;
    }

    render_variables(container) {
        const variables = gd.get_variables(container);
        variables.forEach((v) => {
            const variable = v[0], el = v[1];
            const result = gd.variable_html( variable, el );
            if ( result.length < 1 ) return;
            const content = result[0], r = result[1];
            if ( r === 'html' ) {
                el.innerHTML = content;
            } else if ( r === 'text' ) {
                el.textContent = content;
            } else if ( r === 'append' ) {
                el.innerHTML += content;
            } else if ( r === 'before' ) {
                el.innerHTML = content + el.innerHTML;
            } else if ( r === 'after' ) {
                el.innerHTML += content;
            }
        });
    }

    get_variables(container) {
        let result = [];
        const c = document.querySelectorAll(container);
        c.forEach((el) => {
            el.childNodes.forEach((node) => {
                if ( node.nodeType === 8 ) {
                    let v = gd.extract_variable(node.nodeValue);
                    v = gd.clean( v, 'value' );
                    result.push( [v, el] );
                }
            });
        });
        return result;
    };

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
    get_selector_class($c) {
        var classes = $c.closest('.field.selector').attr('class').split(' ');
        return classes[2];
    }

    render_info(app_title) {

        // first create .unhide div used to unhide the panel on mobile
        var fullscreen = document.querySelector( gd.eid + ' .fullscreen' );
        if ( fullscreen === null ) {
            $( gd.eid + ' .container' ).append('<div class="unhide"></div>');
            $( gd.eid + ' .container' ).append('<div class="fullscreen"></div>');
        }

        // render all variables in comments
         this.render_variables( gd.eid + ' .info *' );

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

        // element count
        var c = $( gd.eid + ' .element-count' ).text();
        c = c.split(' total')[0];
        gd.render_count(c);
    };

    render_count(el) {
        var count = $( gd.eid_inner + ' ' + el ).length;
        $( gd.eid + ' .element-count' ).html(`<code>${el}</code> total: ${count}`);
    };

    selector_changed(type, id) {
        // hide any visible selector field first
        $( gd.eid + ' .field.selector .dialog' ).hide();
        gd.set_param( type, id );
        gd.update_parameter(type, id);
        if ( type === 'css' ) {
            gd.status.remove('css,done,content-changed');
            gd.status.add('theme-changed');
            gd.loop();
        } else if ( type === 'gist' ) {
            gd.status.remove('content,done,theme-changed');
            gd.status.add('content-changed');
            gd.loop();
        }
    }

    register_events() {

        // handle history
        window.addEventListener('popstate', function(e) {
            gd.go_to_section();
        });

        // send Ready message to whatever window opened this app
        if ( !this.status.has('done') && window.opener != null ) {
            window.opener.postMessage( 'Ready.',  this.settings.origin );
        }
        
        // listen for return messages from parent window
        window.addEventListener( 'message', function(event) {
            var o =  this.settings.origin;
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
                    var content = data.content + '\n' +  this.default_info_content();
                    content = this.extract_info_content(content);
                    window.localStorage.setItem( 'gd_content', content );
                    this.render_content(content);
                }
            }
        }, false);

        // fullscreen request
        $( this.eid + ' .fullscreen').unbind().click(function(){
            var e = document.getElementById( gd.eid.substring(1) );
            gd.toggleFullscreen(e);
        });

        // commmand count
        $( gd.eid + ' .element-count' ).unbind().click(function() {
            var count_array = ['.section','kbd','li','code'];
            // get current count option
            var c = $( gd.eid + ' .element-count' ).text();
            c = c.split(' total')[0];

            // find current item in count_array
            var x = count_array.indexOf(c);
            // increment current item
            if ( x === count_array.length - 1 ) {
                x = 0;
            } else {
                x += 1;
            }
            c = count_array[x];
            gd.render_count(c);
        });

        // event handler to toggle info panel
        $( gd.eid + ' .hide' ).unbind().click(function() {
            $( gd.eid + ' .panel' ).toggleClass('minimized');
        });

        // hide/unhide panel
        $( gd.eid + ' .unhide' ).unbind().on('click', function (e) {
            if ( $(e.target).closest(".section").length === 0 ) {
                $( gd.eid + ' .panel' ).removeClass('minimized');
            }
        });

        /*
            Fields
        */

        // SLIDER FIELDS
        $(gd.eid + ' .info .field.slider input' ).unbind().on('input change', function(e) {
            const name = $(this).attr('name');
            let suffix = $(this).attr('data-suffix');
            if ( suffix === undefined ) suffix = '';
            const value = $(this).val() + suffix;
            $(this).attr( 'value', value );
            $(this).parent().attr( 'data-value', value );
            gd.settings[name] = value ;
            gd.set_param( name, value );
            // font-size
            if ( name === 'fontsize' ) {
                $(gd.eid_inner).css( 'font-size', gd.settings['fontsize'] );
            }
            // check if this is for a theme var
            if ( name in gd.css_vars ) {
                var css = window.localStorage.getItem( 'gd_theme', css );
                gd.render_theme_css(css);
            }
        });

        // CHOICE FIELDS
        $( gd.eid + ' .info .field.choices .choice' ).unbind().click(function() {
            var name = $(this).parent().attr('data-name');
            $(this).parent().find('.selected').removeClass('selected');
            const value = $(this).attr('data-value');
            $(this).addClass('selected');
            gd.settings[name] = value;
            gd.set_param( name, value );
        });

        // SELECT FIELDS
        $( gd.eid + ' .info .field.select select' ).unbind().change(function() {
            let name = $(this).parent().attr('data-name');
            name =  gd.clean(name);
            const value = $(this).val();
            gd.settings[name] = value;
            gd.set_param( name, value );
            // load user provided highlight style
            if ( name === 'highlight' ) {
                gd.render_highlight();
            }
            // update css_vars with key
            if ( gd.get_css_var(name) !== '' ) {
                gd.update_parameter(name);
                const css = window.localStorage.getItem( 'gd_theme', css );
                gd.render_theme_css(css);
            }
        });

        // COLLAPSIBLE FIELDS
        $( gd.eid + ' .info .field.collapsible .header' ).unbind().click(function(e) {
            if (e.target !== this) return;
            this.parentNode.classList.toggle('collapsed');
        });

        // SELECTOR KEYPRESS
        $( gd.eid + ' .info .selector-input' ).unbind().keyup(function(e) {
            if( e.which == 13 ) {
                // get parent class
                var c = get_selector_class( $(this).parent() );
                var id = $(this).val();
                gd.selector_changed(c, id);
            }
        });

        // Gist and CSS selectors
        $( gd.eid + ' .info .selector-url' ).unbind().click(function() {
            var c = gd.get_selector_class( $(this) );
            var prefix = '.' + c;
            $( `${gd.eid} ${prefix}-selector` ).toggle();
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

        /* Document based events such as keypresses and general clicks */

        // hide selector if anything is clicked outside of it
        $(document).unbind().click(function(event) {
            var $t = $(event.target);
            // check if any .selector dialog is visiable
            var $visible_selector = $( gd.eid + ' .field.selector .dialog:visible' );
            if ( $visible_selector.length > 0 ) {
                // get the dialog's class by parent div's class
                var c = gd.get_selector_class( $visible_selector );
                if ( $t.hasClass(`${c}-url`) || $t.hasClass(`${c}-selector`) || $t.hasClass(`${c}-input`) ) {
                    if ( $visible_selector.length > 1 ) {
                        // hide any other open selector dialogs
                        $visible_selector.each(function(){
                            var b = gd.get_selector_class( $(this) );
                            if ( b != c ) $(this).hide();
                        });
                    }
                } else {
                    $( gd.eid + ` .${c}-selector` ).hide();
                }
            }
        }).keyup(function(e) {
            if( e.which == 27 ) {
                // ESC key to hide/unhide info panel
                $( gd.eid + ' .panel' ).toggleClass('minimized');
                $( gd.eid + ' .selector .dialog' ).hide();
            }
        });
    };

    // helper function to avoid replication of example content
    list_html( items, is_gist_id ) {
        var content = '';
        if ( items.length < 1 ) return content;
        for ( const key in items) {
            var url = '';
            if (is_gist_id) {
                url = `//gist.github.com/${items[key]}`;
            } else {
                url = items[key];
            }
            content += `<a href="${url}" target="_blank">${gd.chr_link}</a>`;
            content += `<a class="id" data-id="${items[key]}">${key}</a><br/>`;
        }
        return content;
    };

}

/**
 * Simle way to track loading process 
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
        flag.split(',').forEach((e) => {
            let i = this.flags.indexOf(e);
            if ( i !== -1 ) this.flags.splice(i,1);
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
