(function($) {
    
        $.gitdown = function(element, options) {
    
            /*
                Options are configurable by 3 means, in the following order:
                1. plugin instantiation
                2. options in README <!-- {options: foo=bar...} -->
                3. URL parameters (these correspond with field values linked with url params)
    
                That represents order of precedence. Options provided through
                plugin instantiation code take precedence over those specified by
                URL parameter.
    
                Thus, if you fork the repo on GitHub, you can easily alter the
                options at instantiation in index.html so that URL parameters are
                disallowed. Or more easily, you can alter the options by just
                editing the README.
    
                The goal is to allow flexibility for any level of user from
                developers to designers or those just looking to have fun.
            */
    
            let defaults = {
    
                // defaults for url parameters
    
                initial: 'README.md',       // initial content, either a local filename or 'HTML'

                file: 'README.md',          // local file parsed for initial options (Todo: replace with initial)

                header: 'h1',               // element to use for header
                heading: 'h2',              // element to use for sections
                container: 'container',     // class added for container
                inner: 'inner',             // inner container for styling
                fontsize: '',
                content: 'default',
                content_filename: '',
                gist: 'default',
                gist_filename: '',
                css: 'default',
                css_filename: '',
                highlight: 'default',
                preprocess: false,
    
                // set false to render raw text content
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

            // we'll protect these settings from altering by URL params
            const parameters_protected = 'markdownit,callback,merge_themes,merge_gists,origin';
    
            // get URL parameters
            let params = (new URL(location)).searchParams;
            const path = '/' + window.location.hostname.split('.')[0] + window.location.pathname;
    
            let example_gist = {};
            let example_css = {};
            // we'll use jquery $.extend later to merge these
            let example_gist_default = { "Alexa Cheats": "2a06603706fd7c2eb5c93f34ed316354",
                                        "Vim Cheats": "c002acb756d5cf09b1ad98494a81baa3"
            };
    
            let example_css_default = { "Technology": "adc373c2d5a5d2b07821686e93a9630b",
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
            let initial_content = '', info_content = '';
    
            let sections = [];
            let link_symbol = '&#11150';
    
            // simplify plugin name with this and declare settings
            let plugin = this;
            plugin.settings = {}, plugin.css_vars = {};
            
            // ensure element has an id, then store it in eid
            let eid = '#' + element.getAttribute('id');
            if ( eid === '#' ) {
                var new_id = document.querySelector('#wrapper');
                // ensure another id doesn't already exist in page
                if( new_id === null ) {
                    eid = new_id;
                    element.setAttribute( 'id', eid.substr(1) );
                }
            }
            let eid_container;
            let eid_inner;
            
            // status holds flags for loading process
            // status.flags = [
            //  'initial',         initial readme content loaded
            //  'css',             css loaded (either user-provided or base theme)
            //  'content',         user-specified content loaded (applicable only if user provides url)
            //  'done',            all content and css fully loaded
            //  'callback'         call to user-provided callback made, added AFTER callback completed
            //  'content-changed'  app loaded and user selected different content
            //  'theme-changed'    app loaded and user selected different theme
            // ];
            // status.add('initial');
            // status.remove('initial');
            // status.log();
            const status = {
                add(flag) {
                    flag.split(',').forEach(function(e) {
                        if ( status.flags.indexOf(e) === -1 ) status.flags.push(e);
                    });
                },
                remove(flag) {
                    flag.split(',').forEach(function(e) {
                        let i = status.flags.indexOf(e);
                        if ( i !== -1 ) status.flags.splice(i,1);
                    });
                },
                has(flag) {
                    if ( flag === 'changed' ) {
                        // return true if any flags have text '-changed'
                        status.flags.forEach((e) => {
                            if ( e.indexOf('-changed') ) return true;
                        });
                    } else if ( status.flags.indexOf(flag) !== -1 ) {
                        return true;
                    } else return false;
                },
                log() {
                    console.log(status.flags);
                },
                flags: []
            };
    
            // CONSTRUCTOR --------------------------------------------------------
            plugin.init = function() {
    
                // merge defaults and user-provided options into plugin settings
                plugin.settings = $.extend({}, defaults, options);
                
                // add container div and inner content
                var content = '<div class="' + plugin.settings.container + '">';
                content += '<div class="' + plugin.settings.inner + '">';
                content += '</div>';
                content += '<div class="info panel"></div>';
                element.innerHTML += content;
    
                // helper variables to simplify access to container elements
                eid_container = eid + ' .' + plugin.settings.container;
                eid_inner = eid_container + ' .' + plugin.settings.inner;
    
                // setup default info content
                info_content = plugin.default_info_content();
    
                // call main() based on options
                main();
    
            };
    
            // PUBLIC METHODS ------------------------------------------------------
    
            // detect specified url parameter, clean and add it to settings
            plugin.update_parameter = function( key, default_value ) {
                let val = default_value;
                if ( val === undefined ) val = plugin.settings[key];
                // check if specified key exists as url param
                if ( params.has(key) ) {
                    // ensure the parameter is allowed
                    if ( plugin.is_param_allowed(key) ) {
                        val = params.get(key);
                        // sanitize strings
                        if ( typeof val === 'string' ) {
                            const parser = new HtmlWhitelistedSanitizer(true);
                            val = parser.sanitizeString(val);
                        }
                        plugin.settings[key] = val;
                    }
                }
                return val;
            };

            plugin.is_param_allowed = function(p) {
                let allowed = plugin.settings.parameters_disallowed.split(',');
                let protected = parameters_protected.split(',');
                if ( protected.indexOf(p) === -1 && allowed.indexOf(p) === -1 ) {
                    return true;
                }
                return false;
            }

            // return true to let user know everything is fully loaded
            plugin.is_loaded = function() {
                return status.has('done');
            }
    
            // helper function for combining url parts
            plugin.uri = function() {
                let q = params.toString();
                if ( q.length > 0 ) q = '?' + q;
                let base = window.location.href.split('?')[0];
                base = base.split('#')[0];
                return base + q + location.hash;
            };
    
            plugin.toggleFullscreen = function(e) {
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
            plugin.clean = function( str, o ) {
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
    
            // returns true if n begins with str
            plugin.begins = function( t, str ) {
                // only return true if str found at start of t
                if ( t.indexOf(str) === 0 ) {
                    return true;
                }
                return false;
            };
    
            // find first character in str that is not char and return its location
            plugin.find_first_char_not = function(char, str) {
                for (var i = 0; i < str.length; i++){
                    if (str[i] != char){
                        return i;
                    }
                }
                // found only same char so return -1
                return -1;
            };
    
            // load user specified highlight style
            plugin.render_highlight = function() {
                var h = plugin.settings['highlight'];
                var highlight = document.querySelector('#gd-highlight');
                if ( h === undefined || h === null ) h = 'default';
                if ( h.toLowerCase() === 'none' ) {
                    if ( highlight !== null ) highlight.parentNode.removeChild(highlight);
                } else {
                    // setup link details
                    var href = '//cdnjs.cloudflare.com/ajax/libs/highlight.js/9.5.0/styles/';
                    href += h.replace(/[^a-zA-Z0-9-_]+/ig, '');
                    href += '.min.css';
                    // check for existence of highlight link
                    if ( highlight === null ) {
                        // add style reference to head
                        plugin.append_style( 'link', 'gd-highlight', href );
                    } else {
                        // modify existing href
                        highlight.setAttribute( 'href', href );
                    }
                }
            }

            // add style to head either inline or external stylesheet
            // type: link or style
            // id: optional id so we can alter href later
            // content: either href or actual style content
            plugin.append_style = function( type, id, content ){
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
    
            plugin.get_setting = function(s) {
                if ( s === 'theme' ) {
                    return window.localStorage.getItem('gd_theme');
                } else if ( s === 'content' ) {
                    return window.localStorage.getItem('gd_content');
                } else if ( s === 'settings' ) {
                    var s = window.localStorage.getItem('gd_settings');
                    return JSON.parse(s);
                }
            }
    
            plugin.update_selector_url = function( type, filename ) {
                
                // update url field with filanem
                var url_field = document.querySelector( `${eid} .info .${type}-url` );
                if ( url_field !== null ) url_field.textContent = filename + ' ▾';
    
                var id = plugin.settings[`${type}`];
                var filename = plugin.settings[`${type}_filename`];
    
                var href = '';
                if ( id === 'default' ) {
                    href = gist_url( plugin.settings.content, false );
                } else {
                    href = '//gist.github.com/' + id;
                }

                var source = document.querySelector( `${eid} .info .field.selector.${type} a.selector-source` );
                if ( source !== null ) source.setAttribute( 'href', href );
            }
    
            // helper function to get current section
            plugin.get_current_section_id = function() {
                var current = document.querySelector( eid_inner + ' .section.current' );
                if ( current !== null ) {
                    return current.getAttribute('id');
                }
                return '';
            };
    
            // let user easily get names of sections
            plugin.get_sections = function() {
                return sections;
            };
    
            // let user override toc section list, for cases like Entwine
            plugin.set_sections = function(s) {
                sections = s;
            };
    
            // shortcut to get url params
            plugin.get_param = function(key) {
                if ( params.has(key) ) {
                    // return cleaned value
                    var value = params.get(key);
                    var parser = new HtmlWhitelistedSanitizer(true);
                    return parser.sanitizeString(value);
                }
                // return empty string if key doesn't exist
                return '';            
            };
    
            // returns value of css_var at key k
            plugin.get_css_var = function(k) {
                value = '';
                for ( key in plugin.css_vars ) {
                    if ( key === k ) {
                        return plugin.css_vars[k][0];
                    }
                }
                return value;
            }

            // basically, tries to find a unique name for an element by adding
            // -number at the end and checking for any element with that name
            //
            // prefix: section, room or some other identifier
            // selector: base selector so we can find a unique id, class or otherwise
            // max: maximum number of times to try
            //
            // returns new element name with suffixed number
            plugin.unique = function(prefix, selector, max) {
                let x = 1;
                if ( max === null || max < 1 ) max = 200;
                do {
                    const n = `${plugin.clean(prefix)}'-'${x}`;
                    // check if id already exists
                    const name = document.querySelector( selector + n );
                    if ( name === null ) return n;
                    x++;
                }
                while (x < max);
            }
    
            plugin.preprocess_css = function(css) {
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
                        let v = plugin.update_parameter(key);
                        if ( v !== undefined && v !== '' && v.toLowerCase() !== 'default' ) {
                            // ensure css variable name isn't already used in settings
                            if ( plugin.settings['key'] === undefined ) {
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
                        plugin.css_vars[key] = val;
                    } else {
                        pre_css += lines[i];
                    }
                }
                // iterate over vars and replace occurences in css
                for ( key in plugin.css_vars ) {
                    let value = plugin.css_vars[key][0];
                    pre_css = pre_css.split( '$' + key ).join(value);
                }
                return pre_css;
            }
    
            // update fields based on url parameters
            plugin.update_fields_with_params = function(type) {
                if ( type === '' || type === undefined ) type = '';
                var $fields = $( `${eid} .info .field${type}` );
                $fields.each(function(){
                    var field_class = '';
                    var $f = $(this);
                    if ( $f.hasClass('slider') ) {
                        var $slider = $f.find('input');
                        var name = $slider.attr('name');
                        // get parameter value if user specified
                        var p = plugin.update_parameter( name, $slider.val() );
                        if ( p != '' ) {
                            $slider.val(p);
                            $slider.attr( 'value', p );
                            $slider.parent().attr( 'data-value', p );
                        }
                        plugin.settings[name] = $slider.val();
                    } else if ( $f.hasClass('select') ) {
                        var $select = $f.find('select');
                        var name = $select.attr('name');
                        var p = plugin.update_parameter( name, $select.val() );
                        if ( p != '' ) {
                            $select.val(p);
                            $select.change();
                        }
                        plugin.settings[name] = $select.val();
                    } else if ( $f.hasClass('choices') ) {
                        var $choices = $f.find('a');
                        var name = $choices.parent().attr('data-name');
                        var v = $f.find('a.selected').attr('data-value');
                        var p = plugin.update_parameter( name, v );
                        if ( p != '' ) {
                            var $c = $f.find(`a[data-value="${p}"]`);
                            if ( $c.length > 0 ) {
                                // remove previously selected class
                                $f.find('a.selected').removeClass('selected');
                                $c.addClass('selected');
                            }
                        }
                        plugin.settings[name] = v;
                    } else if ( $f.hasClass('selector') ) {
                        var type = get_selector_class($f);
                        var $display_name = $f.find(`.${type}-url`);
                        var filename = plugin.settings[`${type}_filename`];
                        plugin.update_selector_url( type, filename );
                    }
                });
            }
    
            // update parameter values in storage and url
            plugin.set_param = function( key, value ) {
                params.set( key, value );
                history.replaceState( {}, plugin.settings.title, plugin.uri() );
            };

            plugin.remove_class_by_prefix = function(e, prefix) {
                var classes = e.classList;
                for( var c of classes ) {
                    if ( c.startsWith(prefix) ) e.classList.remove(c);
                }
            }

            plugin.scroll_to = function(element){
                var top = element.offsetTop;
                var container = element.parentElement;
                container.scrollTop = top-container.offsetTop;
            }

            // plain js implementation of jquery index()
            plugin.find_index = function(node) {
                var i = 1;
                while ( node = node.previousSibling ) {
                    if ( node.nodeType === 1 ) { ++i }
                }
                return i;
            }
    
            plugin.render = function( content, container, store_markdown ) {
    
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
            plugin.render_raw = function( content, c, markdownit ) {
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

            plugin.default_info_content = function() {
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
    
            plugin.update_toc = function(s) {
                var toc = document.querySelector( eid + ' .info .toc' );
                var html = '';
                if (s.length > 1 ) {
                    // iterate section classes and get id name to compose TOC
                    for ( var i = 0; i < s.length; i++ ) {
                        var id = s[i];
                        html += '<a href="#' + id + '" ';
    
                        var classes = '';
                        // add '.current' class if this section is currently selected
                        if ( id === plugin.get_current_section_id() ) {
                            classes += "current";
                        }
                        // add '.hidden' class if parent section is hidden
                        var e = document.querySelector( eid + ' #' + id );
                        if ( e !== null && e.offsetParent === null ) {
                            classes += " hidden";
                        }
                        if ( classes != '' ) {
                            html += 'class="' + classes + '"';
                        }
                        html += '>';
                        var handle = document.querySelector( `${eid_inner} .section#${id} a.handle` );
                        if ( handle !== null ) html += handle.innerHTML;
                        html += '</a>';
                    }
                    if ( toc !== null ) toc.innerHTML = html;
                } else {
                    // remove the toc and heading if there are no sections
                    var toc_heading = document.querySelector( eid + ' .info .toc-heading' );
                    if ( toc_heading !== null ) {
                        toc_heading.parentNode.removeChild(toc_heading);
                    }
                    if ( toc !== null ) {
                        toc.parentNode.removeChild(toc);
                    }
                }
            };
    
            // promise based get
            plugin.get = function(url) {
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
            plugin.get_gist_filename = function( result, filename ) {
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
            plugin.prepare_urls = function( id, type ) {
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
                    for ( key in example_css_default ) {
                        if ( example_css_default[key] === id ) {
                            urls.push( [type, id, file_path + 'gitdown-' + plugin.clean(key) + ext] );
                        }
                    }
                }
                urls.push( [type, id, file_path + id + ext] );
                urls.push( [type, id, '//ugotsta.github.io/gitdown/' + file_path + id + ext] );
                urls.push( [type, id, `//api.github.com/gists/${id}`] );
                return urls;
            }

            plugin.status = function() {
                return status.flags;
            }

            plugin.status_has = function(flag) {
                return status.has('flag');
            }

            // adjust response if content is pulled from GitHub Gist
            plugin.gistify_response = function(type, url, response) {
                const filename = plugin.settings[type + '_filename'];
                if ( url.indexOf('api.github.com') != -1 ) {
                    const parsed = JSON.parse(response);
                    const file = plugin.get_gist_filename( parsed, filename );
                    plugin.settings[type + '_filename'] = file.filename;
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
            var main = function() {
    
                // update settings with URL parameters
                for (var key in plugin.settings) {
                    plugin.update_parameter(key);
                }

                let initial = plugin.settings.initial;
                if ( initial.toLowerCase === 'html' ) {
                    let html = document.querySelector(eid);
                    if ( html !== null ) initial_content = html.innerHTML;
                    render_content('html');
                    status.add('initial');
                } else {
                    load_initial(initial);
                }    
            };

            var load_initial = function(url) {
                plugin.get(url).then( function (response) {
                    render_content(response);
                    status.add('initial');
                    loop();
                }, function (error) {
                    if ( error.toString().indexOf('404') ) {
                        console.log(error);
                    }
                });
            }

            var loop = function() {
                const css = plugin.update_parameter('css'),
                gist = plugin.update_parameter('gist');

                let urls = [];
                if ( css === 'default' ) {
                    render_theme_css('');
                } else if ( !status.has('css') ) {
                    urls = plugin.prepare_urls( css, 'css' );
                }

                if ( gist === 'default' ) {
                    // load initial content
                    if ( !status.has('content') && status.has('callback') ) {
                        status.remove('initial');
                        load_initial(plugin.settings.initial);
                    }
                    status.add('content');
                    plugin.settings.gist_filename = plugin.settings.content;
                } else if ( !status.has('content') ) {
                    const content_urls = plugin.prepare_urls( gist, 'gist' );
                    content_urls.forEach(function(e) { urls.unshift(e); });
                }
                
                if ( urls.length < 1 ) {
                    load_done();
                } else {
                    // get_files() is a recursive function that tries all urls in array
                    get_files(urls);
                }
            }

            // used stricly to clear existing content when loading new content
            var clear_content = function() {
                sections = [];
                var e = document.querySelector( eid + ' .info' );
                if ( e !== null ) e.innerHTML = '';
                e = document.querySelector( eid_inner );
                if ( e !== null ) e.innerHTML = '';
            }

            // takes a series of urls and tries them until one loads succesfully
            var get_files = function( urls ) {
                if ( urls.length < 1 ) return;
                if ( status.has('done') ) return;
                const a = urls.shift();
                let type = a[0], id = a[1], url = a[2];
                /* PROMISE CHAIN */
                plugin.get(url).then( function (response ) {
                    plugin.settings[type] = id;
                    plugin.settings[type + '_filename'] = url;
                    let data = plugin.gistify_response(type, url, response);
                    if ( type === 'css' ) {
                        render_theme_css(data);
                        if ( status.has('content') ) load_done();
                    } else {
                        // clear content from .info and .inner
                        clear_content();
                        render_content(data);
                        status.add('content');
                        // remove 'gist' content from urls since we have the content
                        urls = urls.filter(i => i[0] !== 'gist');
                        if ( status.has('content,css') ) {
                            load_done();
                        }
                    }
                    get_files( urls );
                }).catch( function(error) {
                    console.log(error);
                    get_files( urls );
                })
            };

            var render_content = function(data) {
                if ( plugin.settings.initial.toLowerCase === 'html' ){
                    //
                } else {
                    // best practice, files should end with newline, we'll ensure it.
                    data += '\n';
                }

                // preprocess data if user specified
                if( plugin.settings.preprocess ) {
                    data = preprocess(data);
                }
    
                // create data backup for use with render_raw()
                var raw_data = data;
    
                // setup info panel default content if it doesn't exist
                data = extract_info_content(data);

                // if we're just getting info content from initial, return at this point
                let initial = status.has('initial');
                let gist = plugin.settings.gist;
                if ( !initial && gist !== 'default' ) return;
    
                // render content and info panel
                plugin.render( data, eid_inner, true );
                plugin.render( info_content, eid + ' .info', false );
    
                // arrange content in sections based on headings
                sectionize();
    
                // handle special tags we want to allow
                tag_replace( 'kbd', eid );
                tag_replace( 'i', eid );
                tag_replace( '<!--', eid );
    
                // render info panel and toc based on current section
                render_info( plugin.settings.title );

                // render raw text if user specified
                plugin.render_raw( raw_data, eid_inner, plugin.settings.markdownit );
                
                update_ui();
            }

            var load_done = function() {
                if ( status.has('theme-changed') ) {
                    // update theme vars and render fields
                    update_theme_vars();
                } else {
                    // complete initialization once everything is loaded
                    status.add('done');
                    update_ui();
                    // update theme vars and render fields
                    update_theme_vars();
                    // finally register events
                    register_events();
                    // pass control back to user provided callback if it exists
                    if ( typeof plugin.settings.callback == 'function' ) {
                        plugin.settings.callback.call();
                        status.add('callback');
                    }
                }
            }

            var update_ui = function() {

                /// clear any existing theme-var fields
                let v = document.querySelector(eid + ' .info .theme-vars');
                if ( v !== null ) v.innerHTML = '';

                // update fields based on params
                plugin.update_fields_with_params();
                update_ui_from_settings();
                plugin.render_highlight();

                // set current section and go there
                go_to_hash();

                // where are we updating parameters based on fields like sliders?
                var fontsize = parseInt( plugin.settings.fontsize );
                if ( fontsize != '' ) $( eid_inner ).css('font-size', fontsize + '%');
                // hide selector dialogs at start
                $( eid + ' .info .field.selector .dialog' ).hide();
                // toggle collapsible sections at start, prior to callback
                if ( !status.has('changed') ) {
                    $( eid + ' .info .field.collapsible' ).addClass('collapsed');
                }
                
                let wrapper = document.querySelector(eid);
                // add .gd-default class if using default theme
                if ( plugin.settings.css === 'default' ) {
                    wrapper.classList.add('gd-default');
                } else wrapper.classList.remove('gd-default');

                // add .gd-lyrics class when using lyrics mode: heading=lyrics
                if ( plugin.settings.heading === 'lyrics' ) {
                    wrapper.classList.add('gd-lyrics');
                }
            }

            var update_ui_from_settings = function() {
                // rewrite with forEach() to hide settings based on element name
                const elements = ['info','help_ribbon','element_count','gist_details','css_details'];
                elements.forEach(function(i){
                    if( plugin.settings[`hide_${i}`] ) {
                        var e = document.querySelector( `${eid} .${plugin.clean(i)}` );
                        if ( e !== null) e.parentNode.removeChild(e);
                    }
                });
                if( plugin.settings['disable_hide'] ) {
                    var e = document.querySelector( `${eid} .hide` );
                    if ( e !== null) e.parentNode.removeChild(e);
                }
                if( plugin.settings['hide_toc'] ) {
                    var e = document.querySelector( `${eid} .info .toc` );
                    if ( e !== null) e.parentNode.removeChild(e);
                }
            };

            var update_theme_vars = function() {
                // todo: use same code base as variable_html()
                let html = '';
                let theme_vars = document.querySelector(eid + ' .info .theme-vars');
                if ( theme_vars !== null ) {
                    for ( key in plugin.css_vars ) {
                        // get variable declaration if it exists
                        let d = plugin.css_vars[key][1];
                        if ( d !== '' ) {
                            // check if selector exists in current content
                            let selector = plugin.css_vars[key][2];
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
                    // todo
                    theme_vars.innerHTML = html;
                    plugin.update_fields_with_params();
                }
            }
    
            // extra info panel contents if they exist
            // does nothing if no info content is found
            // this allows users to create a custom info panel for their files
            // useful for apps like Entwine so users can create a panel that fits their game
            var extract_info_content = function(content) {
                var n = '\n';
                var info = '';
                var info_found = false;
                var c = content;
                // check content for $gd_info
                if ( c.indexOf('<!-- {$gd_info} -->') != -1 ) {
                    c = '';
                    // get all content starting with occurrence of $gd_info
                    var lines = content.split('\n');
                    $.each( lines, function( i, val ){
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
                    info_content = info;
                }
                return c;
            };
    
            var sectionize = function() {
    
                // header section
                var header = plugin.settings.header;
                var heading = plugin.settings.heading;
                if ( heading === 'lyrics' ) heading = 'p';
    
                if ( $( eid_inner + ' ' + header ).length ) {
                    $( eid_inner + ' ' + header ).each(function() {
                        var name = plugin.clean( $(this).text() );
                        $(this).addClass('handle-heading');
                        $(this).wrapInner('<a class="handle app-title ' + name + '" name="' + name + '"/>');
                        $(this).nextUntil(heading).andSelf().wrapAll('<div class="section header" id="' + name + '"/>');
                        $(this).nextUntil(heading).wrapAll('<div class="content"/>');
                    });
                } else {
                    // add a header if none already exists
                    if ( $( eid_inner + '.section.header').length > 0 ) {
                        $( eid_inner ).append('<div class="section header"></div>');
                    }
                }
    
                // create sections
                $( eid_inner + ' ' + heading ).each(function() {
                    var name = plugin.clean( $(this).text() );
                    // ensure section name/id is unique
                    if ( name !== '' ) {
                        var $exists = $( eid_inner + ' .section#' + name );
                        if ( $exists.length > 0 ) {
                            // name already exists so give it a new suffix
                            name = plugin.unique( name, '#' );
                        }
                    } else {
                        // name is empty so assign it blank with suffix
                        name = plugin.unique( 'blank', '#' );
                    }
                    $(this).addClass('handle-heading');
                    $(this).wrapInner('<a class="handle" name="' + name + '"/>');
                    $(this).nextUntil(heading).andSelf().wrapAll('<div class="section heading" id="' + name + '"/>');
                    $(this).nextUntil(heading).wrapAll('<div class="content"/>');
                });

                // for lyrics mode, add heading content to .content div
                if ( plugin.settings.heading === 'lyrics' ) {
                    $(eid_inner + ' .section.heading').each(function() {
                        var heading = $(this).find('a.handle').html();
                        var $c = $(this).find('.handle-heading');
                        heading = `<div class="content">${heading}</div>`;
                        $c.after(heading);
                    });
                }
    
                // add section names to sections array for use with toc
                $( eid_inner + ' .section a.handle' ).each(function(){
                    var t = $(this).text();
                    if ( t.indexOf( 'gd_info' ) === -1 ) {
                        var id = $(this).closest('.section').attr('id');
                        sections.push( id );
                    }
                });
    
                // if section's parent is not eid_inner, then move it there
                $( eid_inner + ' .section' ).each(function() {
                    var $parent = $(this).parent();
                    if ( !$parent.is( $(eid_inner) ) ) {
                        $(this).appendTo( eid_inner );
                    }
                });
            };
    
            // to help with incorrectly formatted Markdown (which is very common)
            var preprocess = function(data) {
                var processed = '';
                var lines = data.split('\n');
                // todo: ensure this works as jquery each did previously
                // $.each(lines, function( i, val ){
                $.each(lines, function( i, val ){
                    // start by checking if # is the first character in the line
                    if ( val.charAt(0) === '#' ) {
                        var x = plugin.find_first_char_not('#', val);
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
    
            var go_to_hash = function() {

                // first remove .current classes from wrapper
                var wrapper = document.querySelector(eid);
                if ( wrapper != null ) plugin.remove_class_by_prefix(wrapper, 'current-');

                // remove prior .old classes from old section
                var old = document.querySelector(eid_inner + ' .section.old');
                if (old !== null) {
                    old.classList.remove('old', 'hi', 'lo');
                }
                
                // remove .current class from current section
                var current = document.querySelector(eid_inner + ' .section.current');
                if (current !== null) {
                    current.classList.add('old');
                    current.classList.remove('hi', 'lo', 'current');
                }

                // now remove 'current' class from previously selected section and toc
                var current_toc = document.querySelector( eid + ' .toc a.current' );
                if (current_toc !== null) current_toc.classList.remove('current');
                
                // check if this is the first time handling url hash
                var hash = location.hash;
                var header = document.querySelector( eid_inner + ' .section.header' );
                if ( header === null ) {
                    header = '';
                } else {
                    header = header.getAttribute('id');
                }
                var header_hash = '#' + header;
                var section = document.querySelector( eid_inner + ' .section' + hash );
                if( hash && section !== null && hash != header_hash ) {
                    section.classList.remove('old');
                    section.classList.add('current');
                    section.scrollIntoView();
                } else {
                    // make header the current section
                    var header = document.querySelector( eid + ' .section.header' );
                    if ( header !== null ){
                        header.classList.remove('old');
                        header.classList.add('current');
                    }
                }
                // add .hi or .lo to .old class so user can style based on index
                old = document.querySelector(eid_inner + ' .section.old');
                current = document.querySelector(eid_inner + ' .section.current');
                if ( old !== null && current !== null ) {
                    if ( plugin.find_index(old) > plugin.find_index(current) ) {
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
                    var c = document.querySelector( `${eid} .toc a[href="#${id}"]` );
                    if ( c !== null ) {
                        c.classList.add('current');
                        plugin.scroll_to(c);
                    }
                }
            };
    
            // custom method to allow for certain tags like <i> and <kbd>
            var tag_replace = function( tag, container ) {
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
                                classes = plugin.clean(classes);
                                classes = classes.replace(/icon-(.*?)/, "fa-$1");
                            }
                            return classes;
                        });
                        $( container + ' i' ).addClass('fa');
                    }
                }
            };
    
            var render_theme_css = function(css) {
                // first remove existing theme
                let el = document.querySelector('#gd-theme-css');
                if ( el !== null ) el.parentNode.removeChild(el);
    
                if ( css === '' ) {
                    plugin.settings.css_filename = 'style.css';
                    plugin.settings.css = 'default';
                } else {
                    // preprocess_css is our sissy lttle sass wannabe :)
                    let preprocessed = plugin.preprocess_css(css);
    
                    // when using a local css file, get the theme name
                    let id = plugin.settings.css;
                    for ( key in example_css_default ) {
                        if ( example_css_default[key] === id ) {
                            plugin.settings.css_filename = key;
                        }
                    }
    
                    // create style tag with css content
                    plugin.append_style( 'style', 'gd-theme-css', preprocessed );
                }
                // store cleaned css in browser
                window.localStorage.setItem( 'gd_theme', css );
                status.add('css');
            };
    
            var extract_variable = function( v ) {
                // ensure there's an open paren
                if ( v.indexOf('{') != -1 ) {
                    var v1 = v.split('{')[1];
                    // ensure there's a closing paren
                    if ( v1.indexOf('}') != -1 ) {
                        var v2 = v1.split('}')[0];
                        // ensure the variable begins with $
                        if ( v2.indexOf('$') != -1 ) {
                            return v2;
                        }
                    }
                }
                return '';
            };

            function extract_list_items( $next, is_gist ) {
                var items = {};
                if ( !$next.is('ul') ) return items;
                // iterate over list and popular items
                $next.find('li').each(function(){
                    var $li = $(this);
                    var name = $li.text();
                    var id = $li.find('a').attr('href');
                    if (is_gist) {
                        id = id.substr( id.lastIndexOf('/') + 1 );
                    }
                    items[name] = id;
                });
                $next.remove();
                return items;
            }
    
            var proper_filename = function(f) {
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
            function gist_url( file, front_end ){
                if (front_end) {
                    return `//github.com${path}master/${file}"`;
                } else {
                    return `//github.com${path}blob/master/${file}`;
                }
            }
    
            var selector_html = function( n, $t, placeholder, items ) {
    
                var file = '';
                var is_gist = false;
                if ( n === 'gist' ){
                    file = plugin.settings.content;
                } else if ( n === 'css' ) {
                    file = 'css/style.css';
                }
    
                var proper = proper_filename(file);
                placeholder = placeholder.replace( /\b\w/g, l => l.toUpperCase() );
                
                var c = `<div class="field selector ${n} ${n}-details">`;
    
                // current item
                if ( n === 'gist' || n === 'css' ) {
                    is_gist = true;
                    var url = gist_url( file, true );
                    c += `<a class="selector-source" href="${url}" target="_blank">${link_symbol}</a>`;
                    c += `<a name="${$t.text()}" class="${n}-url selector-url">${proper} ▾</a>`;
                } else {
                    // other selectors
                    c += `<a class="selector-source" href="${$t.text()}" target="_blank">${link_symbol}</a>`;
                    c += `<a name="${$t.text()}" class="${n}-url selector-url">${$t.text()} ▾</a>`;
                }
    
                c += `<div class="${n}-selector dialog">`;
                c += `<input class="${n}-input selector-input" type="text" placeholder="${placeholder}" />`;
    
                c += '<div class="selector-wrapper">';
    
                // first list item
                if ( n === 'gist' || n === 'css' ) {
                    var url = gist_url( file, false );
                    //c += list_html( { 'Default': url }, true);
                    c += `<a href="${url}" target="_blank">${link_symbol}</a>`;
                    c += `<a class="id" data-id="default">Default (${file})</a><br/>`;
                }
    
                // Example list
                c += list_html( items, is_gist );
                c += '</div></div></div>';
                return c;
            }
    
            // todo: this absolutely needs re-writing
            // it doesn't return html as name implies
            // remove append() and html() calls
            // and return the html along with instructions for handling it
            var variable_html = function( v, t ) {
                var $t = $(t);
                // c is the html content
                var c = '';
                var title = plugin.settings.title;
                if ( v != '' ) {
                    if ( plugin.begins( v, '$gd_info' ) ) {
                        $t.text( title ).addClass( plugin.clean(title) + ' app-title' );
                    } else if ( plugin.begins( v, '$gd_help_ribbon' ) ) {
                        c = '<a class="help-ribbon" href="//github.com' + path;
                        c += '#' + title.toLowerCase() + '">?</a>';
                        $t.html(c);
                    } else if ( plugin.begins( v, '$gd_element_count' ) ) {
                        c = '<div class="element-count">.section total:</div>';
                        $t.append(c);
                    } else if ( v === '$gd_gist' ) {
    
                        // first extract contents of list for examples
                        var items = extract_list_items( $t.next(), true );
    
                        // check settings and merge examples if needed
                        if ( plugin.settings.merge_gists ) {
                            example_gist = $.extend( example_gist_default, items );
                        } else {
                            example_gist = items;
                        }
                        c = selector_html( 'gist', $t, 'Gist ID', example_gist );
                        $t.next('br').remove();
                        if (!plugin.is_param_allowed('gist')) c = '';
                        $t.html(c);
                    } else if ( v === '$gd_css' ) {
    
                        // first extract contents of list for examples
                        var items = extract_list_items( $t.next(), true );
    
                        // check settings and merge examples if needed
                        if ( plugin.settings.merge_themes === 'false' ) {
                            example_css = items;
                        } else {
                            example_css = $.extend( example_css_default, items );
                        }
                        c = selector_html( 'css', $t, 'Gist ID for CSS theme', example_css );
                        $t.next('br').remove();
                        if (!plugin.is_param_allowed('css')) c = '';
                        $t.html(c);
                    } else if ( plugin.begins( v, '$gd_toc' ) ) {
                        // handle assignment, letting user provide header text
                        if ( v.indexOf('=') != -1 ) {
                            var toc = v.split('=')[1];
                            toc = toc.replace(/["'“”]/g, '');
                            c += '<h3 class="toc-heading">' + toc + '</h3>';
                        }
                        c += '<div class="toc"></div>';
                        if ( $t.is('p') ) {
                            $t.before(c);
                        } else $t.after(c);
                    } else if ( plugin.begins( v, '$gd_hide' ) ) {
                        c = '<a class="hide"><kbd>Esc</kbd> - show/hide this panel.</a>';
                        $t.html(c);
                    } else if ( plugin.begins( v, '$gd_theme_variables' ) ) {
                        c = '<div class="theme-vars"></div>';
                        $t.html(c);
                    } else if ( plugin.begins( v, '$gd_selector_' ) ) {
                        var v_name = v.split('$gd_selector_')[1];
                        // first extract contents of list for examples
                        var items = extract_list_items( $t.next(), false );
                        c = selector_html( v_name, $t, v_name, items );
                        $t.next('br').remove();
                        $t.html(c);
                    } else if ( plugin.begins( v, '$gd_choice_' ) ) {
                        var v_name = v.split('$gd_choice_')[1];
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
                        c = field_html( 'choices', v_name, items);
                        $t.html(c);
                    } else if ( plugin.begins( v, '$gd_select_' ) ) {
                        var v_name = v.split('$gd_select_')[1];
                        var next = t.nextElementSibling;
                        var items = {};
                        if ( next !== null && next.tagName === 'UL' ) {
                            items = next.getElementsByTagName('li');
                        }
                        c = field_html( 'select', v_name, items );
                        next.parentNode.removeChild(next);
                        $t.next('br').remove();
                        $t.html(c);
                    } else if ( plugin.begins( v, '$gd_slider_' ) ) {
                        var v_name = v.split('$gd_slider_')[1];
                        // return if there's no assignment after variable
                        if ( v_name.indexOf('=') === -1 ) return;
                        // remove assignment text from name and ensure it's clean (no malicious HTML)
                        v_name = plugin.clean( v_name.split('=')[0] );
                        // get the assigned string
                        var v_items = v.split('=')[1];
                        // remove parens
                        v_items = v_items.substring(1).substring( 0, v_items.length - 1 );
                        v_items = v_items.substring( 0, v_items.length - 1 );
                        // get user assigned string
                        var items = v_items.split(',');
                        // generate slider html
                        c = field_html( 'slider', v_name, items);
                        // removing the next br removes the next slider comment attached to that br
                        $t.next('br').remove();
                        $t.append(c);
                    } else if ( plugin.begins( v, '$gd_collapsible_' ) ) {
                        var v_name = v.split('$gd_collapsible_')[1];
                        var pos = 'start';
                        if ( v_name.startsWith('end_') ) {
                            pos = 'end';
                            v_name = v_name.split('end_')[1];
                        }
                        v_name = plugin.clean(v_name);
                        c = field_html( 'collapsible ' + pos, v_name);
                        $t.next('br').remove();
                        $t.html(c);
                    }
                }
            };

            var field_html = function(type, name, items) {
                var c = `<div class="field ${type} ${name}" data-name="${name}">`;
                if ( type === 'select') {
                    c += `<select name="${name}">`;
                    plugin.settings['name'] = '';
                    for ( var i = 0; i < items.length; i++ ) {
                        var li = items[i].innerHTML;
                        var s = '';
                        if ( li.charAt(0) === '*' ) {
                            li = li.substr(1);
                            plugin.settings['name'] = li;
                            s = 'selected';
                        }
                        c += `<option value="${plugin.clean(li)}" ${s}>${li}</option>`;
                    }
                    c += '</select>';
                } else if ( type === 'slider' ) {
                    c += `<input name="${name}" type="range" `;
                    // get slider attributes
                    c += ` value="${items[0]}"`;
                    plugin.settings['name'] = items[0];
                    c += ` min="${items[1]}"`;
                    c += ` max="${items[2]}"`;
                    c += ` step="${items[3]}"`;
                    // handle suffix
                    if ( items.length > 4 ) {
                        c += ` data-suffix="${items[4]}" `;
                    }
                    c += '>';
                } else if ( type === 'choices' ) {
                    plugin.settings['name'] = '';
                    for ( var i = 0; i < items.length; i++ ) {
                        var v = items[i];
                        var s = '';
                        if ( v.charAt(0) === '*' ) {
                            v = v.substr(1);
                            plugin.settings['name'] = v;
                            s = 'selected';
                        }
                        c += `<a class="choice ${s}" data-value="${v}">${v}</a> `;
                    }
                }
                c += '</div>';
                return c;
            }
    
            var render_variables = function( container, app_title ) {
                var $sections = $( container );
                if ( $sections.length > 0 ) {
                    // find attributes and position section
                    $sections.each(function() {
                        var comments = $(this).getComments();
                        if ( comments.length > 0 ) {
                            for ( var i = 0; i < comments.length; i++ ) {
                                var v = extract_variable( comments[i] );
                                if ( v != '' ) {
                                    v = plugin.clean( v, 'value' );
                                    variable_html( v, this );
                                }
                            }
                        }
                    });
                }
            };
    
            // simple helper to reduce repitition for getting selector class
            var get_selector_class = function ($c) {
                var classes = $c.closest('.field.selector').attr('class').split(' ');
                return classes[2];
            }
    
            var render_info = function(app_title) {

                // first create .unhide div used to unhide the panel on mobile
                var fullscreen = document.querySelector( eid + ' .fullscreen' );
                if ( fullscreen === null ) {
                    $( eid + ' .container' ).append('<div class="unhide"></div>');
                    $( eid + ' .container' ).append('<div class="fullscreen"></div>');
                }
    
                // render all variables in comments
                render_variables( eid + ' .info *', app_title );
    
                // arrange content within collapsible fields
                $( eid + ' .info .field.collapsible').unwrap();
                var $c = $( eid + ' .info .field.collapsible.start');
                $( eid + ' .info .field.collapsible.start' ).each(function(){
                    var $c = $(this);
                    var data_name = $c.attr('data-name');
                    // get all content between the start and end divs
                    var start = eid + ` .info .field.collapsible.${data_name}.start`;
                    var end =`.field.collapsible.${data_name}.end`;
                    var $content = $(start).nextUntil(end);
                    $(end).remove();
                    $content.appendTo($c);
                    var html = `<div class="header" name="${data_name}">${data_name}</div>`;
                    $content.wrapAll(html);
                    $content.wrapAll('<div class="contents">');
                });
    
                // update TOC
                plugin.update_toc( plugin.get_sections() );
    
                // element count
                var c = $( eid + ' .element-count' ).text();
                c = c.split(' total')[0];
                render_count(c);
            };
    
            var render_count = function(element) {
                var count = $( eid_inner + ' ' + element ).length;
                $( eid + ' .element-count' ).html(`<code>${element}</code> total: ${count}`);
            };
    
            var register_events = function() {

                // handle history
                window.addEventListener('popstate', function(e) {
                    go_to_hash();
                });

                // send Ready message to whatever window opened this app
                if ( !status.has('done') && window.opener != null ) {
                    window.opener.postMessage( 'Ready.', plugin.settings.origin );
                }
                
                // listen for return messages from parent window
                window.addEventListener( 'message', function(event) {
                    var o = plugin.settings.origin;
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
                            var content = data.content + '\n' + plugin.default_info_content();
                            content = extract_info_content(content);
                            window.localStorage.setItem( 'gd_content', content );
                            render_content(content);
                        }
                    }
                }, false);
    
                // fullscreen request
                $( eid + ' .fullscreen').unbind().click(function(){
                    var e = document.getElementById( 'eid.substring(1)' );
                    plugin.toggleFullscreen(e);
                });
    
                // commmand count
                $( eid + ' .element-count' ).unbind().click(function() {
                    var count_array = ['.section','kbd','li','code'];
                    // get current count option
                    var c = $( eid + ' .element-count' ).text();
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
                    render_count(c);
                });
    
                // event handler to toggle info panel
                $( eid + ' .hide' ).unbind().click(function() {
                    $( eid + ' .panel' ).toggleClass('minimized');
                });
    
                // hide/unhide panel
                $( eid + ' .unhide' ).unbind().on('click', function (e) {
                    if ( $(e.target).closest(".section").length === 0 ) {
                        $( eid + ' .panel' ).removeClass('minimized');
                    }
                });
    
                /*
                    Fields
                */
    
                // SLIDER FIELDS
                $ (eid + ' .info .field.slider input' ).unbind().on('input change', function(e) {
                    var name = $(this).attr('name');
                    var suffix = $(this).attr('data-suffix');
                    if ( suffix === undefined ) suffix = '';
                    var value = $(this).val() + suffix;
                    $(this).attr( 'value', value );
                    $(this).parent().attr( 'data-value', value );
                    plugin.settings[name] = value ;
                    plugin.set_param( name, value );
                    // font-size
                    if ( name === 'fontsize' ) {
                        $(eid_inner).css( 'font-size', plugin.settings['fontsize'] );
                    }
                    // check if this is for a theme var
                    if ( name in plugin.css_vars ) {
                        // todo
                        var css = window.localStorage.getItem( 'gd_theme', css );
                        render_theme_css(css);
                    }
                });
    
                // CHOICE FIELDS
                $( eid + ' .info .field.choices .choice' ).unbind().click(function() {
                    var name = $(this).parent().attr('data-name');
                    $(this).parent().find('.selected').removeClass('selected');
                    var value = $(this).attr('data-value');
                    $(this).addClass('selected');
                    plugin.settings[name] = value;
                    plugin.set_param( name, value );
                });
    
                // SELECT FIELDS
                $( eid + ' .info .field.select select' ).unbind().change(function() {
                    var name = $(this).parent().attr('data-name');
                    name = plugin.clean(name);
                    var value = $(this).val();
                    plugin.settings[name] = value;
                    plugin.set_param( name, value );
                    // load user provided highlight style
                    if ( name === 'highlight' ) {
                        plugin.render_highlight();
                    }
                    // update css_vars with key
                    if ( plugin.get_css_var(name) !== '' ) {
                        var val = plugin.update_parameter(name);
                        var css = window.localStorage.getItem( 'gd_theme', css );
                        render_theme_css(css);
                    }
                });
    
                // COLLAPSIBLE FIELDS
                $( eid + ' .info .field.collapsible .header' ).unbind().click(function(e) {
                    if (e.target !== this) return;
                    this.parentNode.classList.toggle('collapsed');
                });
    
                // SELECTOR KEYPRESS
                $( eid + ' .info .selector-input' ).unbind().keyup(function(e) {
                    if( e.which == 13 ) {
                        // get parent class
                        var c = get_selector_class( $(this).parent() );
                        var id = $(this).val();
                        selector_changed(c, id);
                    }
                });
    
                function selector_changed(type, id) {
                    // hide any visible selector field first
                    $( eid + ' .field.selector .dialog' ).hide();
                    plugin.set_param( type, id );
                    plugin.update_parameter(type, id);
                    if ( type === 'css' ) {
                        status.remove('css,done,content-changed');
                        status.add('theme-changed');
                        loop();
                    } else if ( type === 'gist' ) {
                        status.remove('content,done,theme-changed');
                        status.add('content-changed');
                        loop();
                    }
                }
    
                // Gist and CSS selectors
                $( eid + ' .info .selector-url' ).unbind().click(function() {
                    var c = get_selector_class( $(this) );
                    var prefix = '.' + c;
                    $( `${eid} ${prefix}-selector` ).toggle();
                    // move focus to text input
                    $( `${eid} ${prefix}-input` ).focus().select();
    
                    // set position
                    var p = $(this).parent().position();
                    $( `${eid} ${prefix}-selector` ).css({
                        top: p.top + $(this).height() - 17,
                        left: p.left
                    });
    
                    // create click events for links
                    $( `${eid} ${prefix}-selector a.id` ).unbind().click(function(event) {
                        var id = $(this).attr('data-id');
                        selector_changed(c, id);
                    });
                });
    
                /* Document based events such as keypresses and general clicks */

                // hide selector if anything is clicked outside of it
                $(document).unbind().click(function(event) {
                    var $t = $(event.target);
                    // check if any .selector dialog is visiable
                    var $visible_selector = $( eid + ' .field.selector .dialog:visible' );
                    if ( $visible_selector.length > 0 ) {
                        // get the dialog's class by parent div's class
                        var c = get_selector_class( $visible_selector );
                        if ( $t.hasClass(`${c}-url`) || $t.hasClass(`${c}-selector`) || $t.hasClass(`${c}-input`) ) {
                            if ( $visible_selector.length > 1 ) {
                                // hide any other open selector dialogs
                                $visible_selector.each(function(){
                                    var b = get_selector_class( $(this) );
                                    if ( b != c ) $(this).hide();
                                });
                            }
                        } else {
                            $( eid + ` .${c}-selector` ).hide();
                        }
                    }
                }).keyup(function(e) {
                    if( e.which == 27 ) {
                        // ESC key to hide/unhide info panel
                        $( eid + ' .panel' ).toggleClass('minimized');
                        $( eid + ' .selector .dialog' ).hide();
                    }
                });
            };
    
            // helper function to avoid replication of example content
            var list_html = function( items, is_gist_id ) {
                var content = '';
                if ( items.length < 1 ) return content;
                for (var key in items) {
                    var url = '';
                    if (is_gist_id) {
                        url = `//gist.github.com/${items[key]}`;
                    } else {
                        url = items[key];
                    }
                    content += `<a href="${url}" target="_blank">${link_symbol}</a>`;
                    content += `<a class="id" data-id="${items[key]}">${key}</a><br/>`;
                }
                return content;
            };
    
            // call constructor
            plugin.init();
    
        };
    
        // add plugin to the jQuery.fn object
        $.fn.gitdown = function(options) {
    
            // ensure plugin not already attached to element before adding
            return this.each(function() {
                if ( undefined == $(this).data('gitdown') ) {
                    var plugin = new $.gitdown( this, options );
                    $(this).data( 'gitdown', plugin );
                }
            });
        };
    
        // Extra jQuery EXTENSIONS ----------------------------------------------
    
        // extend jQuery with getComments
        // credits: https://stackoverflow.com/questions/22562113/read-html-comments-with-js-or-jquery#22562475
        $.fn.getComments = function () {
            return this.contents().map(function () {
                if (this.nodeType === 8) return this.nodeValue;
            }).get();
        };
    
    })(jQuery);