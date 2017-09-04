/* global $, jQuery, location, HtmlWhitelistedSanitizer, URLSearchParams, URL */
(function($) {

    // here we go!
    $.gitdown = function(element, opt) {

        // default options
        var defaults = {
            
            header: 'h1',   // element to use for header
            heading: 'h2',  // element to use for sections
            container: 'container',  // class added for container
            fontsize: 100,
            gist: 'default',
            gist_filename: '',
            css: 'default',
            css_filename: '',
            preprocess: false,
            
            // if your plugin is event-driven, you may provide callback capabilities
            // for its events. execute these functions before or after events of your 
            // plugin, so that users may customize those particular events without 
            // changing the plugin's code
            onFoo: function() {}
        };
        
        var options = {
            hide_info: false,
            hide_help_ribbon: false,
            hide_command_count: false,
            hide_gist_details: false,
            hide_css_details: false,
            hide_toc: false,
            disable_hide: false,
            parameters_disallowed: ''
        };
        
        var TOC = [];
        
        // get URL parameters
        let params = (new URL(location)).searchParams;
        var path = '/' + window.location.hostname.split('.')[0];
        path += window.location.pathname;
        
        var example_gist = {};
        var example_css = {};

        // simplify plugin name with this
        var plugin = this;

        // this will hold the merged default, and user-provided options
        // plugin's properties will be available through this object like:
        // plugin.settings.propertyName from inside the plugin or
        // element.data('pluginName').settings.propertyName from outside the plugin, 
        // where "element" is the element the plugin is attached to;
        plugin.settings = {};

        
        var $element = $(element);
        var eid = '#' + $element.attr('id');
        var eid_container;

        // CONSTRUCTOR --------------------------------------------------------
        plugin.init = function() {

            // sanitize defaults
            
            
            // merge defaults and user-provided options into plugin settings
            plugin.settings = $.extend({}, defaults, opt);

            var content = '<div class="' + defaults['container'] + '"></div>';
            content += '<div class="info"></div>';
            $element.html(content);
            
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
            eid_container = eid + ' ' + defaults['container'];
            
            // call main() based on options
            main();

        };

        // PUBLIC METHODS ------------------------------------------------------
        
        // plugin.methodName(arg1, arg2, ... argn) from inside the plugin or
        // element.data('pluginName').publicMethod(arg1, arg2, ... argn) from outside 
        // the plugin, where "element" is the element the plugin is attached to;
        
        // returns true if input variable is null, undefined or ''
        plugin.is_nothing = function(i) {
            if ( i === undefined || i == undefined) {
                return true;
            } else {
                if ( i === '' ) {
                    return true;
                }
            }
            return false;
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
        plugin.css_name = function(str) {
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

        // PRIVATE METHODS -----------------------------------------------------
        var main = function() {
            var load_readme = true;
            // we'll later allow Markdown content input
            if(load_readme) {
                // Start by loading README.md file to get options and potentially content
                $.ajax({
                    url : "README.md",
                    dataType: "text",
                    success : function (data) {
                        pull_options(data);
                        extract_parameters( defaults );
                        var gist = defaults['gist'];
                        if ( !gist || gist === 'default' ) {
                            defaults['gist'] === 'default';
                            if ( !defaults['css'] || defaults['css'] === 'default' ) {
                                // no gist or CSS provided, so lets just render README
                                su_render(data);
                            } else {
                                // no gist provided, but CSS provided, so load CSS along with README
                                load_gist( 'css', defaults['css'], defaults['css_filename'], data );
                            }
                        } else {
                            // a gist id was provided, test for CSS in callback
                            load_gist( 'gist', defaults['gist'], defaults['gist_filename'] );
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
                            // save filename in defaults
                            defaults[ type + '_filename' ] = gistdata.data.files[file].filename;
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
                    if ( defaults['css'] != 'default' && defaults['css'] != '' ) {
                        // css id provided so lets load it
                        load_gist( 'css', defaults['css'], defaults['css_filename'], objects[0] );
                    } else {
                        // no css provided so let's start rendering
                        su_render(objects[0]);
                    }
                }
            }).error(function(e) {
                console.log('Error on ajax return.');
            });
        };
        
        // pull example content from README.md and render it to selectors
        var pull_options = function(data) {
            var processed = '';
            var lines = data.split('\n');
            var gist_found = false;
            var css_found = false;
            var examples_end = 0;
            $.each( lines, function( i, val ) {
                // check for options without any block code ` on same line
                if ( val.indexOf('<!-- [options:') != -1 && val.indexOf('`') === -1 ) {
                    // options found, lets get them
                    var o = val.split('<!-- [options:')[1];
                    o = o.split(',');
                    for ( var x = 0; x < o.length; x++) {
                        var option = o[x].split('] -->')[0].trim();
                        var key = option.split('=')[0].trim();
                        var value = option.split('=')[1].trim();
                        options[key] = value;
                    }
                }
                if ( examples_end != -1 ) {
                    if ( val.indexOf('## Example Gists') != -1 ){
                        gist_found = true;
                        css_found = false;
                    }
                    if ( val.indexOf('## Example CSS Themes') != -1 ){
                        // css section found so let update the gist selector with processed info
                        css_found = true;
                        gist_found = false;
                        examples_end = 1;
                    }
                    if ( val.indexOf('- [') != -1 ) {
                        if ( gist_found ){
                            // item found and it's from gist example group
                            var x = val.split(' [')[1];
                            var name = x.split('](')[0];
                            x = x.split('gist=')[1];
                            // get the gist id
                            var id = x.split( ') -' )[0];
                            example_gist[name] = id;
                        } else if ( css_found ) {
                            examples_end++;
                            // item is from css example group
                            var x = val.split('- [')[1];
                            var name = x.split('](')[0];
                            x = x.split('css=')[1];
                            // get the css gist id
                            var id = x.split( ') -' )[0];
                            example_css[name] = id;
                        }
                    } else {
                        // no more option found for current section, end of section
                        if (css_found && examples_end > 1) {
                            // set examples_end to -1 to stop further parsing
                            examples_end = -1;
                        }
                    }
                }
            });
            return processed;
        };
    
        // Update defaults[] with URL parameters
        var extract_parameters = function( p ) {
            for (var key in p) {
                if ( params.has(key) ) {
                    // ensure the parameter is allowed
                    if ( options['parameters_disallowed'].indexOf(key) === -1 ) {
                        defaults[key] = params.get(key);
                    }
                }
            }
        };
        
        // Start content rendering process
        var su_render = function(data) {
            if( defaults['preprocess'] ) {
                data = preprocess(data);
            }
            render(data);
            render_sections();
            $( eid + ' .container' ).css('font-size', defaults['fontsize'] + '%');
            tag_replace('kbd');
            tag_replace('i');
            tag_replace('<!--');
            go_to_hash();
            render_info('GitDown');
            
            register_events();
            handle_options();
            
            // hide selectors at start
            $( eid + ' .info .selector' ).hide();
        };
        
        var handle_options = function() {
            if( options['hide_info'] ) {
                $( eid + ' .info' ).remove();
            }
            if( options['hide_help_ribbon'] ) {
                $( eid + ' .help-ribbon' ).remove();
            }
            if( options['hide_command_count'] ) {
                $( eid + ' .command-count' ).remove();
            }
            if( options['hide_gist_details'] ) {
                $( eid + ' #gist-details' ).remove();
            }
            if( options['hide_css_details'] ) {
                $( eid + ' #css-details' ).remove();
            }
            if( options['disable_hide'] ) {
                $( eid + ' .hide' ).remove();
            }
            if( options['hide_toc'] ) {
                $( eid + ' #toc' ).remove();
                $( eid + ' .info h3' ).remove();
            }
        };
        
        var render = function(content) {
            var md = window.markdownit({
                html: false, // Enable HTML tags in source
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
            $( eid + ' .container' ).html( md.render(content) );
        };
        
        var render_sections = function() {
            
            // header section
            var header = defaults['header'];
            var heading = defaults['heading'];
            if ( $( eid + ' .container ' + header ).length ) {
                $( eid + ' .container ' + header ).each(function() {
                    var name = plugin.css_name( $(this).text() );
                    $(this).wrapInner('<a class="handle" name="' + name + '"/>');
                    $(this).nextUntil(heading).andSelf().wrapAll('<div class="section header" id="' + name + '"/>');
                    $(this).nextUntil(heading).wrapAll('<div class="content"/>');
                });
            } else {
                //no header, so we'll add an empty one
                $( eid + ' .container' ).prepend('<div class="header"></div>');
            }
            
            // create sections
            $( eid + ' .container ' + heading ).each(function() {
                var name = plugin.css_name( $(this).text() );
                $(this).wrapInner('<a class="handle" name="' + name + '"/>');
                $(this).nextUntil(heading).andSelf().wrapAll('<div class="section heading" id="' + name + '"/>');
                $(this).nextUntil(heading).wrapAll('<div class="content"/>');
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
        
        var section_change = function() {
            go_to_hash();
            update_toc( section_names() );
        };
        
        var get_current_section_id = function() {
            return $( eid + ' .section.current' ).attr('id');
        };
        
        var go_to_hash = function() {
            $( eid + ' .section.current' ).removeClass('current');
            var hash = location.hash;
            var header_hash = '#' + $('.section.header').attr('id');
            if( hash && $(hash).length > 0 && hash != header_hash ) {
                $( eid + ' .section' + hash ).removeClass('old').addClass('current');
                // scroll to specified hash position
                $('body').animate({
                    scrollTop: $(hash).offset().top
                });
            } else {
                // hash has changed since start so we'll just remove/add relevant classes
                $( eid + ' .section.current' ).addClass('old').removeClass('current');
                $( eid + ' .section.header' ).removeClass('old').addClass('current');
            }
        };
        
        // custom method to allow for certain tags like <i> and <kbd>
        // extra security measures need to be taken here since we're allowing html
        var tag_replace = function(tag) {
            var str = $( eid + ' .container' ).html();
            if( tag === '<!--' ) {
                var r = new RegExp('&lt;!--' + '(.*?)' + '--&gt;', 'gi');
                str = str.replace( r , '<!--$1-->' );
                $( eid + ' .container' ).html(str);
                // replace back comments wrapped in code blocks
                $( eid + ' code' ).contents().each(function(i, val) {
                    if ( this.nodeType === 8 ) {
                        var p = this.parentNode;
                        var r = document.createTextNode('<!-- ' + this.nodeValue + ' -->');
                        p.replaceChild( r, this );
                    }
                });
                
            } else {
                var open = new RegExp('&lt;' + tag + '(.*?)&gt;', 'gi');
                var close = new RegExp('&lt;\/' + tag + '&gt;', 'gi');
                str = str.replace(open, '<' + tag + '$1>').replace(close, '</' + tag + '>');
                $( eid + ' .container' ).html(str);
                // update fontawesome icons
                if ( tag === 'i' ){
                    $( eid + ' i' ).attr('class', function(_, classes) {
                        if( classes.indexOf('fa-') < 0 ){
                            classes = plugin.css_name(classes);
                            classes = classes.replace(/icon-(.*?)/, "fa-$1");
                        }
                        return classes;
                    });
                    $( eid + ' i' ).addClass('fa');
                }
            }
        };
        
        var render_css = function(css) {
            // attempt to sanitize CSS so hacker don't splode our website
            var parser = new HtmlWhitelistedSanitizer(true);
            var sanitizedHtml = parser.sanitizeString(css);
            $('head').append('<style>' + sanitizedHtml + '</style>');
        };
        
        var render_info = function(app_title) {
            
            var content = '';
            content += '<a class="help-ribbon" href="//github.com' + path;
            content += '#' + app_title.toLowerCase() + '">?</a>';
            
            content += '<h1 class="' + plugin.css_name(app_title) +  '">' + app_title + '</h1>';
            content += '<div class="command-count">.section total:</div>';
            content += '</br>';
            content += '<div id="gist-details">View this file:</br>';
            content += '<a id="gist-source" href="https://github.com' + path;
            content += 'master/README.md" target="_blank">↪</a>';
            content += '<a id="gist-url" class="selector-toggle">README.md ▾</a>';
            content += '<div id="gist-selector" class="selector">';
            content += '<input id="gist-input" type="text" placeholder="Gist ID" />';
            
            content += '<a href="https://github.com' + path + 'blob/master/README.md" target="_blank">↪</a>';
            content += '<a class="id" id="default">Default (README.md)</a><br/>';
            
            // Example Gist list
            content += example_content(example_gist);
            
            content += '</div></div>';
            content += '<div id="css-details">CSS Theme:<br/>';
            content += '<a id="css-source" href="https://github.com' + path;
            content += 'blob/master/css/style.css" target="_blank">↪</a>';
            content += '<a id="css-url" class="selector-toggle">Default (style.css) ▾</a>';
            content += '<div id="css-selector" class="selector">';
            content += '<input id="css-input" type="text" placeholder="Gist ID for CSS theme" />';
            
            content += '<a href="https://github.com' + path + 'blob/master/css/style.css" target="_blank">↪</a>';
            content += '<a class="id" id="default">Default (style.css)</a><br/>';
            
            // Example CSS list
            content += example_content(example_css);
            
            content += '</div></div>';
            content += '<h3>Table of Contents</h3>';
            content += '<div id="toc"></div>';
            content += '<div id="hide"><kbd>?</kbd> - show/hide this panel.</div>';
            $( eid + ' .info' ).html(content);
            
            // update TOC
            update_toc( section_names() );
            
            // command count
            var c = $( eid + ' .command-count' ).text();
            c = c.split(' total')[0];
            render_count(c);
            
            // update gist and css urls
            var url = '';
            if (defaults['gist'] != 'default') {
                url = 'https://gist.github.com/' + defaults['gist'];
                $( eid + ' #gist-url' ).text(defaults['gist_filename'] + ' ▾');
            } else {
                url = 'https://github.com' + path + 'blob/master/README.md';
            }
            $( eid + ' #gist-source' ).attr('href', url);
            
            if (defaults['css'] != 'default') {
                url = 'https://gist.github.com/' + defaults['css'];
                $( eid + ' #css-url' ).text(defaults['css_filename'] + ' ▾');
            } else {
                url = 'https://github.com' + path + 'blob/master/css/style.css';
            }
            $( eid + ' #css-source' ).attr('href', url);
        };
        
        // returns comma-delimmeted array of section names
        var section_names = function() {
            var a = [];
            $( eid + ' .container .section a.handle' ).each(function(){
                a.push( $(this).text() );
            });
            return a;
        };
        
        var update_toc = function(sections) {
            var html = '';
            // iterate section classes and get id name to compose TOC
            for ( var i = 0; i < sections.length; i++ ) {
                var name = plugin.css_name( sections[i] );
                html += '<a href="#' + name + '" ';
                
                var classes = '';
                // add '.current' class if this section is currently selected
                if ( sections[i] === get_current_section_id() ) {
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
            $( eid + ' #toc' ).html( html );
        };
        
        var render_count = function(element) {
            var count = $( eid + ' .container ' + element ).length;
            $( eid + ' .command-count' ).html('<code>' + element + '</code>' + ' total: ' + count);
        };
        
        var register_events = function() {
            
            // handle history
            $(window).on('popstate', function (e) {
                section_change();
            });
            
            // commmand count
            $( eid + ' .command-count' ).click(function() {
                var count_array = ['.section','kbd','li','code'];
                // get current count option
                var c = $( eid + ' .command-count' ).text();
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
            $( eid + ' #hide' ).click(function() {
                $( eid + ' .info' ).toggleClass('minimized');
            });
            
            // to help with mobile, show .info when container is clicked outside sections
            $( eid + ' .container' ).on('click', function (e) {
                if ( $(e.target).closest(".section").length === 0 ) {
                    $( eid + ' .info' ).removeClass('minimized');
                }
            });
            
            // close input panel when container is clicked
            $( eid + ' #input-wrapper' ).on('click', function (e) {
                if ( $(e.target).closest( eid + ' #input-panel' ).length === 0 ) {
                    $(this).hide();
                }
            });
            
            // Key events
            $(document).keyup(function(e) {
                if( e.which == 191 ) {
                    // ? for help
                    $( eid + ' .info' ).toggleClass('minimized');
                } else if (e.keyCode === 27) {
                    // Escape
                    $( eid + ' .selector' ).hide();
                }
            });
            
            $( eid + ' #gist-input' ).keyup(function(e) {
                if( e.which == 13 ) {
                    params.set( 'gist', $(this).val() );
                    window.location.href = plugin.uri();
                }
            });
            
            $( eid + ' #css-input' ).keyup(function(e) {
                if( e.which == 13 ) {
                    params.set( 'css', $(this).val() );
                    window.location.href = plugin.uri();
                }
            });
            
            // hide selector if it or link not clicked
            $(document).click(function(event) {
                var id = event.target.id;
                if ( $( eid + ' #gist-selector' ).is(':visible') ) {
                    if ( id === 'gist-url' || id === 'gist-selector' || id === 'gist-input' ) {
                    } else {
                        $( eid + ' #gist-selector' ).hide();
                    }
                }
                if ( $( eid + ' #css-selector' ).is(':visible') ) {
                    if ( id === 'css-url' || id === 'css-selector' || id === 'css-input' ) {
                    } else {
                        $( eid + ' #css-selector' ).hide();
                    }
                }
            });
            
            // Gist and CSS selectors
            $( eid + ' .selector-toggle' ).click(function() {
                var prefix = '#gist';
                var id = $(this).attr('id');
                if ( id === 'css-url' ) {
                    prefix = '#css';
                }
                $( eid + ' ' + prefix + '-selector' ).toggle();
                // move focus to text input
                $( eid + ' ' + prefix + '-input' ).focus();
    
                // set position
                var p = $(this).position();
                $( eid + ' ' + prefix + '-selector' ).css({
                    top: p.top + $(this).height() + 10,
                    left: p.left - 50
                });
                
                // create click events for links
                $( eid + ' ' + prefix + '-selector a.id' ).click(function(event) {
                    if ( prefix === '#gist' ){
                        params.set( 'gist', $(this).attr("id") );
                    } else {
                        params.set( 'css', $(this).attr("id") );
                    }
                    window.location.href = plugin.uri();
                });
            });
            
            // add click event to toggle items in toc
            $( eid + ' #toc .toggle' ).click(function() {
                var name = $(this).parent().attr('href');
                // toggle hidden status
                if( $(this).parent().hasClass('hidden') ) {
                    $(name).show();
                    $(this).parent().removeClass('hidden');
                } else {
                    $(name).hide();
                }
                update_toc();
            });
        };
        
        // helper function to avoid replication of example content
        var example_content = function(examples) {
            var content = '';
            for (var key in examples) {
                content += '<a href="https://gist.github.com/' + examples[key] + '" target="_blank">↪</a>';
                content += '<a class="id" id="' + examples[key] + '">' + key + '</a><br/>';
            }
            return content;
        };

        // call the "constructor" method
        plugin.init();

    };

    // add the plugin to the jQuery.fn object
    $.fn.gitdown = function(options) {

        // iterate through the DOM elements we are attaching the plugin to
        return this.each(function() {

            // if plugin has not already been attached to the element
            if (undefined == $(this).data('gitdown')) {

                // create a new instance of the plugin
                // pass the DOM element and the user-provided options as arguments
                var plugin = new $.gitdown(this, options);

                // in the jQuery version of the element
                // store a reference to the plugin object
                // you can later access the plugin and its methods and properties like
                // element.data('pluginName').publicMethod(arg1, arg2, ... argn) or
                // element.data('pluginName').settings.propertyName
                $(this).data('gitdown', plugin);

            }

        });

    };

})(jQuery);