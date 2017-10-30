(function($) {
    
        $.gitdown = function(element, options, callback) {
    
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
    
            var defaults = {
    
                // defaults for url parameters
    
                file: 'README.md',          // local file parsed for initial options
                header: 'h1',               // element to use for header
                heading: 'h2',              // element to use for sections
                container: 'container',     // class added for container
                inner: 'inner',             // inner container for styling
                fontsize: '',
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
            };
    
            // get URL parameters
            var params = (new URL(location)).searchParams;
            var path = '/' + window.location.hostname.split('.')[0];
            path += window.location.pathname;
    
            var example_gist = {};
            var example_css = {};
            // we'll use jquery $.extend later to merge these
            var example_gist_default = { "Alexa Cheats": "2a06603706fd7c2eb5c93f34ed316354",
                                        "Vim Cheats": "c002acb756d5cf09b1ad98494a81baa3"
            };
    
            var example_css_default = { "Technology": "adc373c2d5a5d2b07821686e93a9630b",
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
            // for access to transform values, we'll make sanitized css available
            var info_content = '';
    
            var sections = [];
            var link_symbol = '&#11150';
    
            // simplify plugin name with this and declare settings
            var plugin = this;
            plugin.settings = {};
            plugin.css_vars = {};
    
            var $element = $(element);
            var eid = '#' + $element.attr('id');
            var eid_container;
            var eid_inner;
    
            // CONSTRUCTOR --------------------------------------------------------
            plugin.init = function() {
    
                // merge defaults and user-provided options into plugin settings
                plugin.settings = $.extend({}, defaults, options);
                plugin.settings.loaded = false;
                
                // add container div and inner content
                var content = '<div class="' + plugin.settings.container + '">';
                content += '<div class="' + plugin.settings.inner + '">';
                content += '</div>';
                content += '<div class="info panel"></div>';
                $element.append(content);
    
                // ensure $element has an id
                if ( eid === '#' ) {
                    var new_id = '#wrapper';
                    // ensure another id doesn't already exist in page
                    if( $( new_id ).length ){
                    } else {
                        eid = new_id;
                        $element.attr( 'id', eid.substr(1) );
                    }
                }
    
                // helper variables to simplify access to container elements
                eid_container = eid + ' .' + plugin.settings.container;
                eid_inner = eid_container + ' .' + plugin.settings.inner;
    
                // setup default info content
                info_content = default_info_content();
    
                // call main() based on options
                main();
    
            };
    
            // PUBLIC METHODS ------------------------------------------------------
    
            // detect specified url parameter, clean and add it to settings
            plugin.update_parameter = function( key, default_value ) {
                var val = default_value;
                // check if specified key exists as url param
                if ( params.has(key) ) {
                    // ensure the parameter is allowed
                    if ( plugin.settings.parameters_disallowed.indexOf(key) === -1 ) {
                        val = params.get(key);
                        
                        // sanitize strings
                        if ( typeof val === 'string' ) {
                            var parser = new HtmlWhitelistedSanitizer(true);
                            val = parser.sanitizeString(val);
                        }
                        plugin.settings[key] = val;
                    }
                }
                return val;
            };
    
            // helper function for combining url parts
            plugin.uri = function() {
                var q = params.toString();
                if ( q.length > 0 ) q = '?' + q;
                var base = window.location.href.split('?')[0];
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
    
            plugin.render_highlight = function() {
                var h = plugin.settings['highlight'];
                var $highlight = $('#gd-highlight');
                if ( h === undefined || h === null ) h = 'default';
                if ( h.toLowerCase() === 'none' ) {
                    $highlight.remove();
                } else {
                    // setup link details
                    var l = '//cdnjs.cloudflare.com/ajax/libs/highlight.js/9.5.0/styles/';
                    l += h.replace(/[^a-zA-Z0-9-_]+/ig, '');
                    l += '.min.css';
                    // check for existence of highlight link
                    if ( $highlight.length < 1 ) {
                        // create highlight id
                        var link = `<link rel="stylesheet" id="gd-highlight" href="${l}">`;
                        // add style reference to head to load it
                        $('head').append(link);
                    } else {
                        // modify existing href
                        $highlight.attr( 'href', l );
                    }
                }
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
    
            // helper function to provide defaults
            plugin.get_examples = function(c) {
                var examples;
                if ( c === 'css' ) {
                    examples = example_css;
                } else examples = example_gist;
    
                var content = '{';
                for ( var key in examples ) {
                    content += '"' + key + '": ';
                    content += '"' + examples[key] + '", ';
                }
                content += '}';
                return content;
            };
    
            plugin.update_selector_url = function( type, filename ) {
                $( eid + ` .info .${type}-url` ).text( filename + ' ▾' );
                var $source = $( eid + ` .info .field.selector.${type} a.selector-source` );
    
                var id = plugin.settings[`${type}`];
                var filename = plugin.settings[`${type}_filename`];
    
                var href = '';
                if ( id === 'default' ) {
                    href = gist_url( plugin.settings.file, false );
                } else {
                    href = '//gist.github.com/' + id;
                }
    
                $source.attr( 'href', href );
            }
    
            plugin.get_current_section_id = function() {
                // make the first .section current if no current section is set yet
                var $current = $( eid + ' .section.current' );
                if ( $current.length < 1) {
                    $current = $( eid + ' .section:first-child');
                    $current.addClass('current');
                }
                return $current.attr('id');
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
    
            // returns true
            plugin.get_css_var = function(k) {
                value = '';
                for ( key in plugin.css_vars ) {
                    if ( key === k ) {
                        return plugin.css_vars[k];
                    }
                }
                return value;
            }
    
            plugin.preprocess_css = function(css) {
                // setup vars to store css variables
                var vars = {};
                // iterate over css to get variables
                var lines = css.split('\n');
                var pre_css = '';
                for ( var i = 0; i < lines.length; i++ ) {
                    var re = lines[i].match(/\$(.*?):(.*?);/);
                    if (re) {
                        var key = re[1];
                        var value = re[2];
                        // check for existence of url parameter
                        var v = plugin.update_parameter(key);
                        if ( v !== undefined && v !== '' && v.toLowerCase() !== 'default' ) {
                            value = v;
                        }
                        plugin.css_vars[key] = value;
                    } else {
                        pre_css += lines[i];
                    }
                }
                // iterate over vars and replace occurences in css
                for ( key in plugin.css_vars ) {
                    pre_css = pre_css.split( '$' + key ).join(plugin.css_vars[key]);
                }
                return pre_css;
            }
    
            // update fields based on url parameters
            plugin.update_fields = function(type) {
                if ( type === '' || type === undefined ) {
                    type = '';
                }
                var $fields = $( `${eid} .info .field${type}` );
                $fields.each(function(){
                    var field_class = '';
                    var $f = $(this);
                    if ( $f.hasClass('slider') ) {
                        var $slider = $f.find('input');
                        var name = $slider.attr('name');
                        var p = plugin.update_parameter( name, $slider.val() );
                        if ( p != '' ) {
                            $slider.val(p);
                            $slider.attr( 'value', p );
                        }
                    } else if ( $f.hasClass('select') ) {
                        var $select = $f.find('select');
                        var name = $select.attr('name');
                        var p = plugin.update_parameter( name, $select.val() );
                        if ( p != '' ) {
                            $select.val(p);
                            $select.change();
                        }
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
                    } else if ( $f.hasClass('selector') ) {
                        var type = get_selector_class($f);
                        var $display_name = $f.find(`.${type}-url`);
                        var filename = plugin.settings[`${type}_filename`];
                        plugin.update_selector_url( type, filename );
                    }
                });
            }
    
            // set params while also updating url
            plugin.set_param = function( key, value ) {
                params.set( key, value );
                history.replaceState( {}, plugin.settings.title, plugin.uri() );
            };
    
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
                
                $(container).html( md.render(content) );
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
    
            plugin.update_toc = function() {
                var html = '';
                if (sections.length > 1 ) {
                    // iterate section classes and get id name to compose TOC
                    for ( var i = 0; i < sections.length; i++ ) {
                        var name = plugin.clean( sections[i] );
                        html += '<a href="#' + name + '" ';
    
                        var classes = '';
                        // add '.current' class if this section is currently selected
                        if ( plugin.clean( sections[i] ) === plugin.get_current_section_id() ) {
                            classes += "current";
                        }
                        // add '.hidden' class if parent section is hidden
                        if ( $('#' + name).is(':hidden') ) {
                            classes += " hidden";
                        }
                        if ( classes != '' ) {
                            html += 'class="' + classes + '"';
                        }
                        html += '>';
                        html += sections[i];
                        html += '</a>';
                    }
                    $( eid + ' .info .toc' ).html( html );
                } else {
                    // remove the toc if there are no sections
                    $(eid + ' .info .toc-heading').remove();
                    $(eid + ' .info .toc').remove();
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
    
            // return a list of urls to try in get_file()
            plugin.prepare_get = function( id, type ) {
                var urls = [];
                if ( id === 'default' && type === 'css' ) {
                    render_theme_css('');
                    return;
                } else if ( id === 'default' && type === 'gist' ) {
                    urls.push(plugin.settings.file);
                } else {
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
                    }
                    urls.push( file_path + id + ext );
                    urls.push( '//ugotsta.github.io/gitdown/' + file_path + id + ext );
                    urls.push( `//api.github.com/gists/${id}` );
                }
                plugin.get_file( id, type, urls );
            }
    
            // we can later use get_file to load files apart from GitHub Gist
            plugin.get_file = function( id, type, urls ) {
                if ( urls.length < 1 ) return;
                var url = urls.shift();
                var filename = plugin.settings[type + '_filename'];
    
                // begin promise chain
                plugin.get(url).then( function (response ) {
                    plugin.settings[type] = id;
                    plugin.settings[type + '_filename'] = url;
                    var data = response;
                    // slight adjustments for files pulled from GitHub Gist
                    if ( url.indexOf('api.github.com') != -1 ) {
                        var parsed = JSON.parse(response);
                        var file = plugin.get_gist_filename( parsed, filename );
                        plugin.settings[type + '_filename'] = file.filename;
                        data = file.content;
                    }
                    if ( type === 'css' ) {
                        render_theme_css(data);
                    } else {
                        sections = [];
                        $( eid + '.info *' ).remove();
                        $( eid + '.inner *' ).remove();
                        data = extract_info_content(data);
                        // extra routine for initial load (occurs only at first run)
                        if ( !plugin.settings.loaded ) {
                            // we'll load any user-specified css first
                            plugin.prepare_get( plugin.settings.css, 'css' );
                            // now load any user-specific content
                            var gist = plugin.update_parameter('gist');
                            if ( gist !== undefined && gist !== 'default' ) {
                                plugin.prepare_get( gist, 'gist' );
                                su_render(data);
                                // return since su_render() is executed above
                                return;
                            }
                        }
                        su_render(data);
                    }
                }, function (error) {
                    if ( error.toString().indexOf('404') ) {
                        if ( urls.length > 0 ) {
                            plugin.get_file( id, type, urls );
                        }
                    }
                    console.error( "Request failed.", error );
                });
            };
    
            // PRIVATE METHODS -----------------------------------------------------
            var main = function() {
    
                // update settings with URL parameters
                for (var key in plugin.settings) {
                    plugin.update_parameter(key);
                }

                plugin.prepare_get(plugin.settings.file, 'gist');
    
            };
    
            // Start content rendering process
            var su_render = function(data) {
    
                var p = plugin.settings;
    
                // best practice, files should end with newline, we'll ensure it.
                data += '\n';
    
                // preprocess data if user specified
                if( p.preprocess ) {
                    data = preprocess(data);
                }
    
                // create data backup for use with render_raw()
                var raw_data = data;
    
                // setup info panel default content if it doesn't exist
                data = extract_info_content(data);
    
                // render content and info panel
                plugin.render( data, eid_inner, true );
                plugin.render( info_content, eid + ' .info', false );
    
                // add gd-default class if using default theme
                if ( p.css === 'default' ) $('html').addClass('gd-default');
    
                // arrange content in sections based on headings
                sectionize();
    
                if ( p.fontsize != '' ) {
                    $( eid_inner ).css('font-size', p.fontsize + '%');
                }
                
                plugin.render_highlight();
    
                // handle special tags we want to allow
                tag_replace( 'kbd', eid );
                tag_replace( 'i', eid );
                tag_replace( '<!--', eid );
    
                // render info panel and toc based on current section
                render_info( p.title );
    
                // set current section and go there
                go_to_hash();
                
                // update fields based on params
                plugin.update_fields();
    
                // render raw text if user specified
                plugin.render_raw( raw_data, eid_inner, p.markdownit );
    
                register_events();
                handle_options();
    
                // write settings to browser for easy re-use by apps
                store_settings();
    
                // hide selector dialogs at start
                $( eid + ' .info .field.selector .dialog' ).hide();
    
                // toggle collapsible sections at start
                $( eid + ' .field.collapsible .header' ).click();
    
                // send control back to user provided callback if it exists
                if ( typeof p.callback == 'function' ) {
                    p.callback.call();
                    // provide a way for user to know that callback has been called already
                    p.loaded = true;
                }
            };
    
            // store settings in browser
            var store_settings = function() {
                var s = JSON.stringify(plugin.settings);
                window.localStorage.setItem( 'gd_settings', s );
                // retrieve settings in apps with plugin.get_setting('settings')
            }
    
            var handle_options = function() {
                if( options['hide_info'] ) {
                    $( eid + ' .info' ).remove();
                }
                if( options['hide_help_ribbon'] ) {
                    $( eid + ' .help-ribbon' ).remove();
                }
                if( options['hide_element_count'] ) {
                    $( eid + ' .element-count' ).remove();
                }
                if( options['hide_gist_details'] ) {
                    $( eid + ' .gist-details' ).remove();
                }
                if( options['hide_css_details'] ) {
                    $( eid + ' .css-details' ).remove();
                }
                if( options['disable_hide'] ) {
                    $( eid + ' .hide' ).remove();
                }
                if( options['hide_toc'] ) {
                    $( eid + ' .toc' ).remove();
                    $( eid + ' .info h3' ).remove();
                }
            };
    
            var default_info_content = function() {
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
                    $(this).addClass('handle-heading');
                    $(this).wrapInner('<a class="handle" name="' + name + '"/>');
                    $(this).nextUntil(heading).andSelf().wrapAll('<div class="section heading" id="' + name + '"/>');
                    $(this).nextUntil(heading).wrapAll('<div class="content"/>');
                });
    
                // add section names to sections array for use with toc
                $( eid_inner + ' .section a.handle' ).each(function(){
                    var t = $(this).text();
                    if ( t.indexOf( 'gd_info' ) === -1 ) {
                        sections.push( t );
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
                var $old = $( eid + ' .section.old' );
                var $current = $( eid + ' .section.current' );
                // remove hi and lo classes
                $old.removeClass('hi lo');
                $current.removeClass('hi lo');
                // remove prior 'old' class
                $old.removeClass('old');
                // add 'old' class to current section
                $current.addClass('old');
                // now remove 'current' class from previously selected section and toc
                $current.removeClass('current');
                $( eid + ' .toc a.current').removeClass('current');
                var hash = location.hash;
                var header_hash = '#' + $('.section.header').attr('id');
                // check if this is the first time handling url hash
                if( hash && $(hash).length > 0 && hash != header_hash ) {
                    $( eid + ' .section' + hash ).removeClass('old').addClass('current');
                    // update toc with current hash
                    $( '.toc a[href="#' + plugin.get_current_section_id() + '"]' ).addClass('current');
                    // scroll to specified hash position
                    $( eid ).animate({
                        scrollTop: $(hash).offset().top,
                        scrollLeft: $(hash).offset().left
                    });
                } else {
                    // hash has changed since start so we'll just remove/add relevant classes
                    $( eid + ' .section.current' ).addClass('old').removeClass('current');
                    $( eid + ' .section.header' ).removeClass('old').addClass('current');
    
                }
                // update toc link with current
                $( '.toc a[href="#' + plugin.get_current_section_id() + '"]' ).addClass('current');
                // add .next or .prev to .old class so user can style based on index
                $old = $( eid + ' .section.old' );
                $current = $( eid + ' .section.current' );
                if ( $old.index() > $current.index() ) {
                    $current.addClass('lo');
                    $old.addClass('hi');
                } else {
                    $current.addClass('hi');
                    $old.addClass('lo');
                }
    
                // scroll to top of current link in toc
                var t = $(eid + ' .toc');
                var c = $(eid + ' .toc a.current');
                if ( c.length > 0 ) {
                    t.animate({scrollTop: t.scrollTop() + (c.offset().top - t.offset().top)});
                }
            };
    
            // custom method to allow for certain tags like <i> and <kbd>
            var tag_replace = function( tag, container ) {
                var str = $( container ).html();
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
                $('#gd-theme-css').remove();
                $('html').addClass('gd-default');
    
                if ( css === '' ) {
                    plugin.settings.css_filename = 'style.css';
                    plugin.settings.css = 'default';
                } else {
                    $('html').removeClass('gd-default');
                    // attempt to sanitize CSS so hacker don't splode our website
                    var parser = new HtmlWhitelistedSanitizer(true);
                    css = parser.sanitizeString(css);
    
                    // preprocess css is our sissy lttle sass wannabe :)
                    var preprocessed = plugin.preprocess_css(css);
    
                    // when using a local css file, get the theme name
                    var id = plugin.settings.css;
                    for ( key in example_css_default ) {
                        if ( example_css_default[key] === id ) {
                            plugin.settings.css_filename = key;
                        }
                    }
    
                    // create style tag with css content
                    $('head').append(`<style id="gd-theme-css">${preprocessed}</style>`);
                }
                // update theme selector field
                plugin.update_selector_url( 'css', plugin.settings.css_filename );
                // store cleaned css in browser
                window.localStorage.setItem( 'gd_theme', css );
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
    
            var extract_li = function( $ul, is_gist ) {
                var li = {};
                $ul.find('li').each(function(){
                    var $li = $(this);
                    var name = $li.text();
                    var id = $li.find('a').attr('href');
                    if (is_gist) {
                        id = id.substr( id.lastIndexOf('/') + 1 );
                    }
                    li[name] = id;
                });
                return li;
            };
    
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
                    file = plugin.settings.file;
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
    
            var variable_html = function( v, $t ) {
                // c is the html
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
                    } else if ( plugin.begins( v, '$gd_gist' ) ) {
    
                        // first extract contents of list for examples
                        var examples = {};
                        var $gists = $t.next();
                        if ( $gists.is('ul') ) {
                            examples = extract_li( $gists, true );
                            $gists.remove();
                        }
    
                        // check settings and merge examples if needed
                        if ( plugin.settings.merge_gists ) {
                            example_gist = $.extend( example_gist_default, examples );
                        } else {
                            example_gist = examples;
                        }
                        c = selector_html( 'gist', $t, 'Gist ID', example_gist );
                        $t.next('br').remove();
                        $t.html(c);
                    } else if ( plugin.begins( v, '$gd_css' ) ) {
    
                        // first extract contents of list for examples
                        var examples = {};
                        var $gists = $t.next();
                        if ( $gists.is('ul') ) {
                            examples = extract_li( $gists, true );
                            $gists.remove();
                        }
    
                        // check settings and merge examples if needed
                        if ( plugin.settings.merge_themes === 'false' ) {
                            example_css = examples;
                        } else {
                            example_css = $.extend( example_css_default, examples );
                        }
                        c = selector_html( 'css', $t, 'Gist ID for CSS theme', example_css );
                        $t.next('br').remove();
                        $t.html(c);
                    } else if ( plugin.begins( v, '$gd_toc' ) ) {
                        // handle assignment
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
                    } else if ( plugin.begins( v, '$gd_selector_' ) ) {
                        var v_name = v.split('$gd_selector_')[1];
                        // first extract contents of list for examples
                        var items = {};
                        var $next = $t.next();
                        if ( $next.is('ul') ) {
                            items = extract_li( $next, false );
                            $next.remove();
                            c = selector_html( v_name, $t, v_name, items );
                        }
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
                        c = `<div data-name="${v_name}"`;
                        c += ` class="field choices ${v_name}">`;
                        plugin.settings['v_name'] = '';
                        for ( var i = 0; i < items.length; i++ ) {
                            var v = items[i];
                            var s = '';
                            if ( v.charAt(0) === '*' ) {
                                v = v.substr(1);
                                plugin.settings['v_name'] = v;
                                s = 'selected';
                            }
                            c += `<a class="choice ${s}" data-value="${v}">${v}</a> `;
                        }
                        c += '</div>';
                        $t.html(c);
                    } else if ( plugin.begins( v, '$gd_select_' ) ) {
                        var v_name = v.split('$gd_select_')[1];
                        var $list = $t.next();
                        c = `<div class="field select ${v_name}" data-name="${v_name}">`;
                        c += `<select name="${v_name}">`;
                        plugin.settings['v_name'] = '';
                        if ( $list.length > 0 && $list.is('ul') ) {
                            $list.find('li').each(function( i, val ){
                                var li = $(this).text();
                                var s = '';
                                if ( li.charAt(0) === '*' ) {
                                    li = li.substr(1);
                                    plugin.settings['v_name'] = li;
                                    s = 'selected';
                                }
                                c += `<option value="${plugin.clean(li)}" ${s}>${li}</option>`;
                            });
                            $list.remove();
                        }
                        c += '</select></div>';
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
                        v_items = v_items.substring(1);
                        v_items = v_items.substring( 0, v_items.length - 1 );
                        // get user assigned string
                        var items = v_items.split(',');
                        c = `<div class="field slider ${v_name}">`;
                        c += `<input name="${v_name}" type="range" `;
                        // get slider attributes
                        c += ` value="${items[0]}"`;
                        plugin.settings['v_name'] = items[0];
                        c += ` min="${items[1]}"`;
                        c += ` max="${items[2]}"`;
                        c += ` step="${items[3]}"`;
                        // handle suffix
                        if ( items.length > 4 ) {
                            c += ` data-suffix="${items[4]}" `;
                        }
                        c += '>';
                        c += '</div>';
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
                        var classes = `field collapsible ${v_name} ${pos}`;
                        c = `<div class="${classes}" data-name="${v_name}"></div>`;
                        $t.next('br').remove();
                        $t.html(c);
                    }
                }
            };
    
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
                                    variable_html( v, $(this) );
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
                if ( $( eid + ' .fullscreen' ).length < 1 ) {
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
                plugin.update_toc();
    
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

                // send Ready message to whatever window opened this app
                // todo
                var opener = window.opener;
                if ( opener != null ) {
                    console.log(window.parent);
                    console.log(window.opener);
                    opener.postMessage( 'Ready.', '*' );
                }
                
                // listen for return messages from parent window
                window.addEventListener( 'message', function(event) {
                    console.log(event.origin);
                    if ( event.origin === 'https://ugotsta.github.io/' ) {
                        console.log('Received data from GitHub.');
                        console.log(event.data);
                        //su_render(event.data);
                        window.localStorage.setItem( 'gd_content', event.data );
                    }
                }, false);
    
                // handle history
                $(window).on('popstate', function (e) {
                    go_to_hash();
                });
    
                // fullscreen request
                $( eid + ' .fullscreen').click(function(){
                    var e = document.getElementById( 'eid.substring(1)' );
                    plugin.toggleFullscreen(e);
                });
    
                // commmand count
                $( eid + ' .element-count' ).click(function() {
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
                $( eid + ' .hide' ).click(function() {
                    $( eid + ' .panel' ).toggleClass('minimized');
                });
    
                // hide/unhide panel
                $( eid + ' .unhide' ).on('click', function (e) {
                    if ( $(e.target).closest(".section").length === 0 ) {
                        $( eid + ' .panel' ).removeClass('minimized');
                    }
                });
    
                // Key events
                $(document).keyup(function(e) {
                    if( e.which == 27 ) {
                        // ESC key to hide/unhide info panel
                        $( eid + ' .panel' ).toggleClass('minimized');
                        $( eid + ' .selector .dialog' ).hide();
                    }
                });
    
                /*
                    Fields
                */
    
                // SLIDER FIELDS
                $ (eid + ' .info .field.slider input' ).on('input change', function(e) {
                    var name = $(this).attr('name');
                    var value = $(this).val();
                    var suffix = $(this).attr('data-suffix');
                    if ( suffix === undefined ) suffix = '';
                    $(this).attr( 'value', value + suffix );
                    plugin.settings[name] = value + suffix;
                    plugin.set_param( name, value );
                    // font-size
                    if ( name === 'fontsize' ) {
                        $(eid_inner).css( 'font-size', plugin.settings['fontsize'] );
                    }
                });
    
                // CHOICE FIELDS
                $( eid + ' .info .field.choices .choice' ).click(function() {
                    var name = $(this).parent().attr('data-name');
                    $(this).parent().find('.selected').removeClass('selected');
                    var value = $(this).attr('data-value');
                    $(this).addClass('selected');
                    plugin.settings[name] = value;
                    plugin.set_param( name, value );
                });
    
                // SELECT FIELDS
                $( eid + ' .info .field.select select' ).change(function() {
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
                $( eid + ' .field.collapsible .header' ).click(function(e) {
                    if (e.target !== this) return;
                    $(this).parent().toggleClass('collapsed');
                });
    
                // SELECTOR KEYPRESS
                $( eid + ' .info .selector-input' ).keyup(function(e) {
                    if( e.which == 13 ) {
                        // get parent class
                        var c = get_selector_class( $(this).parent() );
                        var id = $(this).val();
                        update_selector(c, id);
                    }
                });
    
                function update_selector(type, id) {
                    plugin.set_param( type, id );
                    if ( type === 'gist' || type === 'css' ){
                        plugin.prepare_get( id, type );
                    }
                }
    
                // Gist and CSS selectors
                $( eid + ' .info .selector-url' ).click(function() {
                    var c = get_selector_class( $(this) );
                    var prefix = '.' + c;
                    $( `${eid} ${prefix}-selector` ).toggle();
                    // move focus to text input
                    $( `${eid} ${prefix}-input` ).focus();
    
                    // set position
                    var p = $(this).parent().position();
                    $( `${eid} ${prefix}-selector` ).css({
                        top: p.top + $(this).height() - 17,
                        left: p.left
                    });
    
                    // create click events for links
                    $( `${eid} ${prefix}-selector a.id` ).click(function(event) {
                        var id = $(this).attr('data-id');
                        update_selector(c, id);
                    });
                });
    
                // hide selector if anything is clicked outside of it
                $(document).click(function(event) {
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
                });
            };
    
            // helper function to avoid replication of example content
            var list_html = function( items, is_gist_id ) {
                var content = '';
                if ( items.length < 1 ) return content;
                for (var key in items) {
                    var url = '';
                    if (is_gist_id) {
                        url = `https://gist.github.com/${items[key]}`;
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