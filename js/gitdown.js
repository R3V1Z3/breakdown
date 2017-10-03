(function($) {

    $.gitdown = function(element, options, callback) {

        /*
            Options are configurable by 3 means, in the following order:
            1. plugin instantiation
            2. options in README <!-- {options: foo=bar...} -->
            3. URL parameters

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
            parameters_disallowed: '',

            // GitDown stores a bunch of examples by default
            // set this to false to not merge them into your app
            merge_themes: true,
            merge_gists: false,
        };

        // get URL parameters
        let params = (new URL(location)).searchParams;
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
                                    "Saint Billy": "76c39d26b1b44e07bd7a783311caded8",
                                    "Old Glory": "43bff1c9c6ae8a829f67bd707ee8f142",
                                    "Woodwork": "c604615983fc6cdd5ebdbdd053800298",
                                    "Corkboard": "ada930f9dae1d0a8d95f41cb7a56d658",
                                    "Graph Paper": "77b1f66ad5093c2db29c666ad15f334d",
                                    "Eerie": "7ac556b27c2cd34b00aa59e0d3621dea",
                                    "Writing on the Wall": "241b47680c730c7162cb5f82d6d788fa",
                                    "Ghastly": "d1a6d5621b883bf6af886855d853d502",
                                    "Deep Blue": "51aa23d96f9bd81fe55c47b2d51855a5"
        };
        // for access to transform values, we'll make sanitized css available
        var clean_css = '';
        var info_content = '';

        var sections = [];
        var link_symbol = '&#11150';

        // simplify plugin name with this and declare settings
        var plugin = this;
        plugin.settings = {};

        var $element = $(element);
        var eid = '#' + $element.attr('id');
        var eid_container;
        var eid_inner;

        // CONSTRUCTOR --------------------------------------------------------
        plugin.init = function() {

            // merge defaults and user-provided options into plugin settings
            plugin.settings = $.extend({}, defaults, options);

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

        // jQuery EXTENSIONS ---------------------------------------------------

        // extend jQuery with getComments
        // credits: https://stackoverflow.com/questions/22562113/read-html-comments-with-js-or-jquery#22562475
        $.fn.getComments = function () {
            return this.contents().map(function () {
                if (this.nodeType === 8) return this.nodeValue;
            }).get();
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
                        // ignore filenames
                        if ( key.indexOf('filename') === -1 ){
                            // replace non-alphanumerics with underscore
                            val = val.replace(/[^a-z0-9_\s-]/g, '_');
                        }
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

        // helper function to ensure section ids are css compatible
        plugin.clean_name = function(str) {
            str = str.toLowerCase();
            // remove non-alphanumerics
            str = str.replace(/[^a-z0-9_\s-]/g, '-');
            // clean up multiple dashes or whitespaces
            str = str.replace(/[\s-]+/g, ' ');
            // remove leading and trailing spaces
            str = str.trim();
            // convert whitespaces and underscore to dash
            str = str.replace(/[\s_]/g, '-');
            return str;
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

        // let user easily get names of sections
        plugin.get_css = function() {
            return clean_css;
        };

        // let user override toc section list, for cases like Entwine
        plugin.set_sections = function(s) {
            sections = s;
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
            if (sections.length > 0 ) {
                // iterate section classes and get id name to compose TOC
                for ( var i = 0; i < sections.length; i++ ) {
                    var name = plugin.clean_name( sections[i] );
                    html += '<a href="#' + name + '" ';

                    var classes = '';
                    // add '.current' class if this section is currently selected
                    if ( plugin.clean_name( sections[i] ) === plugin.get_current_section_id() ) {
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

        // PRIVATE METHODS -----------------------------------------------------
        var main = function() {
            var load_readme = true;
            if(load_readme) {
                // Start by loading README.md file to get options and potentially content
                $.ajax({
                    url : "README.md",
                    dataType: "text",
                    success : function (data) {
                        data = extract_info_content(data);
                        var p = plugin.settings;
                        extract_parameters( p );
                        var gist = p.gist;
                        if ( !gist || gist === 'default' ) {
                            plugin.settings.gist === 'default';
                            if ( !p.css || p.css === 'default' ) {
                                // no gist or CSS provided, so lets just render README
                                su_render(data);
                            } else {
                                // no gist provided, but CSS provided, so load CSS along with README
                                load_gist( 'css', p.css, p.css_filename, data );
                            }
                        } else {
                            // a gist id was provided, test for CSS in callback
                            load_gist( 'gist', p.gist, p.gist_filename );
                        }
                    }
                });
            } else {

            }
        };

        var load_gist = function (type, gist_id, filename, data){
            $.ajax({
                url: 'https://api.github.com/gists/' + gist_id,
                type: 'GET',
                dataType: 'jsonp'
            }).success(function(gistdata) {
                var objects = [];
                if ( filename === '' || filename == null ) {
                    for (var file in gistdata.data.files) {
                        if (gistdata.data.files.hasOwnProperty(file)) {
                            // save filename in settings
                            plugin.settings[ type + '_filename' ] = gistdata.data.files[file].filename;
                            // get file contents
                            var o = gistdata.data.files[file].content;
                            if (o) {
                                objects.push(o);
                            }
                        }
                    }
                } else {
                    objects.push(gistdata.data.files[filename].content);
                }
                if ( type === 'css' ) {
                    render_css(objects[0]);
                    su_render(data);
                } else {
                    // check if css id was provided
                    if ( plugin.settings.css != 'default' && plugin.settings.css != '' ) {
                        // css id provided so lets load it
                        load_gist( 'css', plugin.settings.css, plugin.settings.css_filename, objects[0] );
                    } else {
                        // no css provided so let's start rendering
                        su_render(objects[0]);
                    }
                }
            }).error(function(e) {
                console.log('Error on ajax return.');
            });
        };

        // Update settings with URL parameters
        // p = plugin.settings
        var extract_parameters = function( p ) {
            for (var key in p) {
                // check key against URL parameters
                plugin.update_parameter(key);
            }
        };

        // Start content rendering process
        var su_render = function(data) {

            // best practice, files should end with newline, we'll ensure it.
            data += '\n';

            // preprocess data if user specified
            if( plugin.settings.preprocess ) {
                data = preprocess(data);
            }

            // create data backup for use with render_raw()
            var raw_data = data;

            // setup info panel default content if it doesn't exist
            data = extract_info_content(data);

            // render content and info panel
            plugin.render( data, eid_inner, true );
            plugin.render( info_content, eid + ' .info', false );

            // arrange content in sections based on headings
            sectionize();

            if ( plugin.settings.fontsize != '' ) {
                $( eid_inner ).css('font-size', plugin.settings.fontsize + '%');
            }
            get_highlight_style();

            // handle special tags we want to allow
            tag_replace( 'kbd', eid );
            tag_replace( 'i', eid );
            tag_replace( '<!--', eid );

            // render info panel and toc based on current section
            render_info( plugin.settings.title );

            // set current section and go there
            go_to_hash();

            // render raw text if user specified
            plugin.render_raw( raw_data, eid_inner, plugin.settings.markdownit );

            register_events();
            handle_options();

            // hide selectors at start
            $( eid + ' .info .selector' ).hide();

            // with everything loaded, execute user-provided callback
            if (typeof plugin.settings.callback == 'function') {
                plugin.settings.callback.call();
            }
        };

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
                    var name = plugin.clean_name( $(this).text() );
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
                var name = plugin.clean_name( $(this).text() );
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

        var get_highlight_style = function() {
            // get highlight.js style if provided
            var highlight = params.get('highlight');
            if (!highlight) highlight = 'default';
            // add style reference to head to load it
            $('head').append('<link rel="stylesheet" href="//cdnjs.cloudflare.com/ajax/libs/highlight.js/9.5.0/styles/' + highlight.replace(/[^a-zA-Z0-9-_]+/ig, '') + '.min.css">');
        }

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
                    scrollTop: $(hash).offset().top
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
                            classes = plugin.clean_name(classes);
                            classes = classes.replace(/icon-(.*?)/, "fa-$1");
                        }
                        return classes;
                    });
                    $( container + ' i' ).addClass('fa');
                }
            }
        };

        var render_css = function(css) {
            // attempt to sanitize CSS so hacker don't splode our website
            var parser = new HtmlWhitelistedSanitizer(true);
            var sanitizedHtml = parser.sanitizeString(css);
            $('head').append('<style>' + sanitizedHtml + '</style>');
            // we'll save the css for apps that need it, for example, for transforms
            clean_css = sanitizedHtml;
        };

        // returns true if n begins with str
        var begins = function( t, str ) {
            // only return true if str found at start of t
            if ( t.indexOf(str) === 0 ) {
                return true;
            }
            return false;
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

        var extract_examples = function( $examples ) {
            var examples = {};
            $examples.find('li').each(function(){
                var $li = $(this);
                var name = $li.text();
                var id = $li.find('a').attr('href');
                id = id.substr( id.lastIndexOf('/') + 1 );
                examples[name] = id;
            });
            return examples;
        };

        var selector_html = function( n, $t, placeholder ) {

            var file = '';
            var examples = [];
            if ( n === 'gist' ){
                file = 'README.md';
                examples = example_gist;
            } else if ( n === 'css' ) {
                file = 'css/style.css';
                examples = example_css;
            }
            // this may need adjusting 'blob/master/css/style.css';
            
            c = `<div class="${n}-details">`;
            c += `<a class="${n}-source" href="https://github.com${path}`;
            c += `master/${file}" target="_blank">${link_symbol}</a>`;
            c += `<a name="${$t.text()}" class="${n}-url selector-toggle">${file} ▾</a>`;
            c += `<div class="${n}-selector selector" class="selector">`;
            c += `<input class="${n}-input" type="text" placeholder="${placeholder}" />`;
            c += `<a href="https://github.com${path}blob/master/${file}" target="_blank">${link_symbol}</a>`;
            c += `<a class="id" id="default">Default (${file})</a><br/>`;
            // Example list
            c += example_content(examples);
            c += '</div></div>';
            return c;
        }

        var variable_html = function( v, $t ) {
            // c is the html
            var c = '';
            var title = plugin.settings.title;
            if ( v != '' ) {
                if ( begins( v, '$gd_info' ) ) {
                    $t.text( title ).addClass( plugin.clean_name(title) + ' app-title' );
                } else if ( begins( v, '$gd_help_ribbon' ) ) {
                    c = '<a class="help-ribbon" href="//github.com' + path;
                    c += '#' + title.toLowerCase() + '">?</a>';
                    $t.html(c);
                } else if ( begins( v, '$gd_element_count' ) ) {
                    c = '<div class="element-count">.section total:</div>';
                    $t.append(c);
                } else if ( begins( v, '$gd_gist' ) ) {

                    // first extract contents of list for examples
                    var examples = {};
                    var $gists = $t.next();
                    if ( $gists.is('ul') ) {
                        examples = extract_examples( $gists );
                        $gists.remove();
                    }

                    // check settings and merge examples if needed
                    if ( plugin.settings.merge_gists ) {
                        example_gist = $.extend( example_gist_default, examples );
                    } else {
                        example_gist = examples;
                    }

                    c = selector_html( 'gist', $t, 'Gist ID' );
                    // c = '<div class="gist-details">';
                    // c += '<a class="gist-source" href="https://github.com' + path;
                    // c += 'master/README.md" target="_blank">' + link_symbol + '</a>';
                    // c += '<a name="' + $t.text() + '" class="gist-url selector-toggle">README.md ▾</a>';
                    // c += '<div class="gist-selector selector" class="selector">';
                    // c += '<input class="gist-input" type="text" placeholder="Gist ID" />';
                    // c += '<a href="https://github.com' + path + 'blob/master/README.md" target="_blank">' + link_symbol + '</a>';
                    // c += '<a class="id" id="default">Default (README.md)</a><br/>';
                    // // Example Gist list
                    // c += example_content(example_gist);
                    // c += '</div></div>';
                    $t.next('br').remove();
                    $t.html(c);
                } else if ( begins( v, '$gd_css' ) ) {

                    // first extract contents of list for examples
                    var examples = {};
                    var $gists = $t.next();
                    if ( $gists.is('ul') ) {
                        examples = extract_examples( $gists );
                        $gists.remove();
                    }

                    // check settings and merge examples if needed
                    if ( plugin.settings.merge_themes === 'false' ) {
                        example_css = examples;
                    } else {
                        example_css = $.extend( example_css_default, examples );
                    }

                    c = selector_html('css', $t, 'Gist ID for CSS theme');

                    // c = '<div class="css-details">';
                    // c += '<a class="css-source" href="https://github.com' + path;
                    // c += 'blob/master/css/style.css" target="_blank">' + link_symbol + '</a>';
                    // c += '<a name="' + $t.text() + '" class="css-url selector-toggle">Default (style.css) ▾</a>';
                    // c += '<div class="css-selector selector" class="selector">';
                    // c += '<input class="css-input" type="text" placeholder="Gist ID for CSS theme" />';
                    // c += '<a href="https://github.com' + path + 'blob/master/css/style.css" target="_blank">' + link_symbol + '</a>';
                    // c += '<a class="id" id="default">Default (style.css)</a><br/>';
                    // // Example CSS list
                    // c += example_content(example_css);
                    // c += '</div></div>';
                    $t.next('br').remove();
                    $t.html(c);
                } else if ( begins( v, '$gd_toc' ) ) {
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
                } else if ( begins( v, '$gd_hide' ) ) {
                    c = '<a class="hide"><kbd>?</kbd> - show/hide this panel.</a>';
                    $t.html( c );
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
                                variable_html( v, $(this) );
                            }
                        }
                    }
                });
            }
        };

        var render_info = function(app_title) {

            // render all variables in comments
            render_variables( eid + ' .info *', app_title );

            // update TOC
            plugin.update_toc();

            // element count
            var c = $( eid + ' .element-count' ).text();
            c = c.split(' total')[0];
            render_count(c);

            // update gist and css urls
            var url = '';
            var p = plugin.settings;
            if ( p.gist != 'default' ) {
                url = 'https://gist.github.com/' + p.gist;
                $( eid + ' .info .gist-url' ).text( p.gist_filename + ' ▾');
            } else {
                url = 'https://github.com' + path + 'blob/master/README.md';
            }
            $( eid + ' .info .gist-source' ).attr('href', url);

            if ( p.css != 'default' ) {
                url = 'https://gist.github.com/' + p.css;
                $( eid + ' .info .css-url' ).text( p.css_filename + ' ▾');
            } else {
                url = 'https://github.com' + path + 'blob/master/css/style.css';
            }
            $( eid + ' .info .css-source' ).attr('href', url);
        };

        var render_count = function(element) {
            var count = $( eid_inner + ' ' + element ).length;
            $( eid + ' .element-count' ).html('<code>' + element + '</code>' + ' total: ' + count);
        };

        var register_events = function() {

            // handle history
            $(window).on('popstate', function (e) {
                go_to_hash();
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

            // to help with mobile, show .panel when container is clicked outside sections
            $( eid_inner ).on('click', function (e) {
                if ( $(e.target).closest(".section").length === 0 ) {
                    $( eid + ' .panel' ).removeClass('minimized');
                }
            });

            // Key events
            $(document).keyup(function(e) {
                if( e.which == 191 ) {
                    // ? for help
                    $( eid + ' .panel' ).toggleClass('minimized');
                } else if (e.keyCode === 27) {
                    // Escape
                    $( eid + ' .selector' ).hide();
                }
            });

            $( eid + ' .gist-input' ).keyup(function(e) {
                if( e.which == 13 ) {
                    params.set( 'gist', $(this).val() );
                    window.location.href = plugin.uri();
                }
            });

            $( eid + ' .css-input' ).keyup(function(e) {
                if( e.which == 13 ) {
                    params.set( 'css', $(this).val() );
                    window.location.href = plugin.uri();
                }
            });

            // hide selector if it or link not clicked
            $(document).click(function(event) {
                var $t = $(event.target);
                if ( $( eid + ' .gist-selector' ).is(':visible') ) {
                    if ( $t.hasClass('gist-url') || $t.hasClass('gist-selector') || $t.hasClass('gist-input') ) {
                    } else {
                        $( eid + ' .gist-selector' ).hide();
                    }
                }
                if ( $( eid + ' .css-selector' ).is(':visible') ) {
                    if ( $t.hasClass('css-url') || $t.hasClass('css-selector') || $t.hasClass('css-input') ) {
                    } else {
                        $( eid + ' .css-selector' ).hide();
                    }
                }
            });

            // Gist and CSS selectors
            $( eid + ' .selector-toggle' ).click(function() {
                var prefix = '.gist';
                if ( $(this).hasClass('css-url') ) {
                    prefix = '.css';
                }
                $( eid + ' ' + prefix + '-selector' ).toggle();
                // move focus to text input
                $( eid + ' ' + prefix + '-input' ).focus();

                // set position
                var p = $(this).position();
                $( eid + ' ' + prefix + '-selector' ).css({
                    top: p.top + $(this).height() - 17,
                    left: p.left
                });

                // create click events for links
                $( eid + ' ' + prefix + '-selector a.id' ).click(function(event) {
                    if ( prefix === '.gist' ){
                        params.set( 'gist', $(this).attr('id') );
                    } else {
                        params.set( 'css', $(this).attr('id') );
                    }
                    window.location.href = plugin.uri();
                });
            });
        };

        // helper function to avoid replication of example content
        var example_content = function(examples) {
            var content = '';
            //if ( examples.length < 1 ) return content;
            for (var key in examples) {
                content += '<a href="https://gist.github.com/' + examples[key] + '" target="_blank">' + link_symbol + '</a>';
                content += '<a class="id" id="' + examples[key] + '">' + key + '</a><br/>';
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

})(jQuery);
