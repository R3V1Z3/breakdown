/* global $, jQuery, location, HtmlWhitelistedSanitizer, URLSearchParams, URL */
var TOC = [];

// get URL parameters
let params = (new URL(location)).searchParams;
var path = '/' + window.location.hostname.split('.')[0];
path += window.location.pathname;

var debug = '';

// set default options
var options = {
    hide_info: false,
    hide_github_fork: false,
    hide_command_count: false,
    hide_gist_details: false,
    hide_css_details: false,
    hide_toc: false,
    disable_hide: false,
    parameters_disallowed: ''
};

// set defaults for param which holds list of URL parameters
var param = {
    header: 'h1',
    heading: 'h2',
    fontsize: 100,
    gist: 'default',
    gist_filename: '',
    css: 'default',
    cssfilename: '',
    preprocess: false
};

// key is name, value is gist id
var example_gist = {};
var example_css = {};

jQuery(document).ready(function() {
    
    main();
    
    // Starting point
    function main() {
        // Start by loading README.md file to get options and potentially content
        $.ajax({
            url : "README.md",
            dataType: "text",
            success : function (data) {
                // README.md successfully pulled, grab examples from it
                pull_options(data);
                extract_parameters( param );
                var gist = param['gist'];
                if ( !gist || gist === 'default' ) {
                    param['gist'] === 'default';
                    load_css(data);
                } else {
                    load_gist(param['gist']);
                }
            }
        });
    }
    
    // pull example content from README.md and render it to selectors
    function pull_options(data){
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
            //$('#css-selector').html(processed);
        });
        return processed;
    }

    // Update param[] with URL parameters
    function extract_parameters( param ) {
        for (var key in param) {
            if ( params.has(key) ) {
                // ensure the parameter is allowed
                if ( options['parameters_disallowed'].indexOf(key) === -1 ) {
                    param[key] = params.get(key);
                }
            }
        }
    }
    
    // Load any user specified Gist file
    function load_gist(gist){
        $.ajax({
            url: 'https://api.github.com/gists/' + gist,
            type: 'GET',
            dataType: 'jsonp'
        }).success(function(gistdata) {
            var objects = [];
            var gist_filename = param['gist_filename'];
            if ( gist_filename === '' ) {
                for (var file in gistdata.data.files) {
                    if (gistdata.data.files.hasOwnProperty(file)) {
                        // get gist filename
                        param['gist_filename'] = gistdata.data.files[file].filename;
                        // get file contents
                        var o = gistdata.data.files[file].content;
                        if (o) {
                            objects.push(o);
                        }
                    }
                }
            } else {
                objects.push(gistdata.data.files[gist_filename].content);
            }
            // to ensure external css is loaded too, we'll pass gist data through to css function
            if ( param['css'] != 'default' || param['css'] != '' ) {
                load_css(objects[0]);
            } else {
                // if css is default, we'll go right to rendering
                su_render(objects[0]);
            }
        }).error(function(e) {
            console.log('Error on ajax return.');
        });
    }
    
    function load_css(data) {
        // allow for custom CSS via Gist
        $.ajax({
            url: 'https://api.github.com/gists/' + param['css'],
            type: 'GET',
            dataType: 'jsonp'
        }).success(function(gistdata) {
            var objects = [];
            var cssfilename = param['cssfilename'];
            if ( cssfilename === '' ) {
                for (var file in gistdata.data.files) {
                    if (gistdata.data.files.hasOwnProperty(file)) {
                        // get filename
                        param['cssfilename'] = gistdata.data.files[file].filename;
                        // get file contents
                        var o = gistdata.data.files[file].content;
                        if (o) {
                            objects.push(o);
                        }
                    }
                }
            } else {
                objects.push(gistdata.data.files[cssfilename].content);
            }
            render_css(objects[0]);
            su_render(data);
        }).error(function(e) {
            console.log('Error on ajax return.');
        });
    }
    
    // Start content rendering process
    function su_render(data) {
        if( param['preprocess'] ) {
            data = preprocess(data);
        }
        render(data);
        render_sections();
        $('#wrapper').css('font-size', param['fontsize'] + '%');
        tag_replace('kbd');
        tag_replace('i');
        tag_replace('<!--');
        go_to_hash();
        render_info('GoGitDown');
        
        register_events();
        handle_options();
        
        // hide selectors at start
        $('#info .selector').hide();
    }
    
    function handle_options() {
        if( options['hide_info'] ) {
            $('#info').remove();
        }
        if( options['hide_github_fork'] ) {
            $('.github-fork-ribbon').remove();
        }
        if( options['hide_command_count'] ) {
            $('#command-count').remove();
        }
        if( options['hide_gist_details'] ) {
            $('#gist-details').remove();
        }
        if( options['hide_css_details'] ) {
            $('#css-details').remove();
        }
        if( options['disable_hide'] ) {
            $('#hide').remove();
        }
        if( options['hide_toc'] ) {
            $('#toc').remove();
            $('#info h3').remove();
        }
    }
    
    function render(content) {
        
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
        $('#wrapper').html( md.render(content) );
    }
    
    function render_sections() {
        
        // header section
        var header = param['header'];
        var heading = param['heading'];
        if ( $('#wrapper ' + header).length ) {
            $('#wrapper ' + header).each(function() {
                var name = css_name( $(this).text() );
                $(this).wrapInner('<a class="handle" name="' + name + '"/>');
                $(this).nextUntil(heading).andSelf().wrapAll('<div class="section header" id="' + name + '"/>');
                $(this).nextUntil(heading).wrapAll('<div class="content"/>');
            });
        } else {
            //no header, so we'll add an empty one
            $('#wrapper').prepend('<div class="header"></div>');
        }
        
        // create sections
        $('#wrapper ' + heading).each(function() {
            var name = css_name( $(this).text() );
            $(this).wrapInner('<a class="handle" name="' + name + '" href="#' + name + '"/>');
            $(this).nextUntil(heading).andSelf().wrapAll('<div class="section" id="' + name + '"/>');
            $(this).nextUntil(heading).wrapAll('<div class="content"/>');
        });
        
        // add relevant classes to section headings
        $('.section ' + heading).addClass('heading');
        
        // add choice class to section li links
        $('.content a[href*="#"]').addClass('choice');
    }
    
    // to help with incorrectly formatted Markdown (which is very common)
    function preprocess(data) {
        var processed = '';
        var lines = data.split('\n');
        $.each(lines, function( i, val ){
            // start by checking if # is the first character in the line
            if ( val.charAt(0) === '#' ) {
                var x = find_first_char_not('#', val);
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
    }
    
    function section_change() {
        go_to_hash();
        update_toc( section_names() );
    }
    
    function get_current_section_id() {
        return $('.section.current').attr('id');
    }
    
    function go_to_hash() {
        var hash = location.hash;
        var header_hash = '#' + $('.section.header').attr('id');
        if( hash && $(hash).length > 0 && hash != header_hash ) {
            // add class so we can know which is selected as current
            // useful in some web apps
            $('.section' + hash).removeClass('old').addClass('current');
            // scroll to specified hash position
            $('body').animate({
                scrollTop: $(hash).offset().top
            });
        } else {
            // hash has changed since start so we'll just remove/add relevant classes
            $('.section.current').addClass('old').removeClass('current');
            $('.section.header').removeClass('old').addClass('current');
        }
    }
    
    // custom method to allow for certain tags like <i> and <kbd>
    // extra security measures need to be taken here since we're allowing html
    function tag_replace(tag) {
        var str = $('#wrapper').html();
        if( tag === '<!--' ) {
            var r = new RegExp('&lt;!--' + '(.*?)' + '--&gt;', 'gi');
            str = str.replace( r , '<!--$1-->' );
            $('#wrapper').html(str);
            // replace back comments wrapped in code blocks
            $('code').contents().each(function(i, val) {
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
            $('#wrapper').html(str);
            // update fontawesome icons
            if ( tag === 'i' ){
                $('i').attr('class', function(_, classes) {
                    if( classes.indexOf('fa-') < 0 ){
                        classes = css_name(classes);
                        classes = classes.replace(/icon-(.*?)/, "fa-$1");
                    }
                    return classes;
                });
                $('i').addClass('fa');
            }
        }
    }
    
    function render_css(css) {
        // attempt to sanitize CSS so hacker don't splode our website
        var parser = new HtmlWhitelistedSanitizer(true);
        var sanitizedHtml = parser.sanitizeString(css);
        $('head').append('<style>' + sanitizedHtml + '</style>');
    }
    
    function render_info(app_title) {
        
        var content = '';
        content += '<a id="help-ribbon" href="//github.com' + path
        content += '#' + app_title + '">?</a>';
        
        content += '<h1 class="' + css_name(app_title) +  '">' + app_title + '</h1>';
        content += '<div id="command-count">.section total:</div>';
        content += '</br>';
        content += '<div id="gist-details">View this file:</br>';
        content += '<a id="gist-source" href="https://github.com' + path;
        content += 'master/README.md" target="_blank">↪</a>';
        content += '<span id="gist-url" class="selector-toggle">README.md ▾</span>';
        content += '<div id="gist-selector" class="selector">';
        content += '<input id="gist-input" type="text" placeholder="Gist ID" />';
        
        content += '<a href="https://github.com' + path + 'blob/master/README.md" target="_blank">↪</a>';
        content += '<span id="default">Default (README.md)</span><br/>';
        
        // Example Gist list
        content += example_content(example_gist);
        
        content += '</div></div>';
        content += '<div id="css-details">CSS Theme:<br/>';
        content += '<a id="css-source" href="https://github.com' + path;
        content += 'blob/master/css/style.css" target="_blank">↪</a>';
        content += '<span id="css-url" class="selector-toggle">Default (style.css) ▾</span>';
        content += '<div id="css-selector" class="selector">';
        content += '<input id="css-input" type="text" placeholder="Gist ID for CSS theme" />';
        
        content += '<a href="https://github.com' + path + 'blob/master/css/style.css" target="_blank">↪</a>';
        content += '<span id="default">Default (style.css)</span><br/>';
        
        // Example CSS list
        content += example_content(example_css);
        
        content += '</div></div>';
        content += '<h3>Table of Contents</h3>';
        content += '<div id="toc"></div>';
        content += '<div id="hide"><kbd>?</kbd> - show/hide this panel.</div>';
        $('#info').html(content);
        
        // update TOC
        update_toc( section_names() );
        
        // command count
        var c = $('#command-count').text();
        c = c.split(' total')[0];
        render_count(c);
        
        // update gist and css urls
        var url = '';
        if (param['gist'] != 'default') {
            url = 'https://gist.github.com/' + param['gist'];
            $('#gist-url').text(param['gist_filename'] + ' ▾');
        } else {
            url = 'https://github.com' + path + 'blob/master/README.md';
        }
        $('#gist-source').attr('href', url);
        
        if (param['css'] != 'default') {
            url = 'https://gist.github.com/' + param['css'];
            $('#css-url').text(param['cssfilename'] + ' ▾');
        } else {
            url = 'https://github.com' + path + 'blob/master/css/style.css';
        }
        $('#css-source').attr('href', url);
    }
    
    // returns comma-delimmeted array of section names
    function section_names() {
        var a = [];
        $( '#wrapper .section a.handle' ).each(function(){
            a.push( $(this).text() );
        });
        return a;
    }
    
    function update_toc(sections) {
        var html = '';
        // iterate section classes and get id name to compose TOC
        for ( var i = 0; i < sections.length; i++ ) {
            var name = sections[i];
            html += '<a href="#' + css_name(name) + '" ';
            
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
        $('#toc').html( html );
        
        // add '.current' class to toc element for currently selected 
        
    }
    
    function render_count(element) {
        var count = $( '#wrapper ' + element ).length;
        $('#command-count').html('<code>' + element + '</code>' + ' total: ' + count);
    }
    
    function register_events() {
        
        // handle history
        $(window).on('popstate', function (e) {
            section_change();
        });
        
        // commmand count
        $('#command-count').click(function() {
            var count_array = ['.section','kbd','li','code'];
            // get current count option
            var c = $('#command-count').text();
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
        $('#hide').click(function() {
            $('#info').toggle();
        });
        
        // to help with mobile, show #info when wrapper is clicked outside sections
        $('#wrapper').on('click', function (e) {
            if ( $(e.target).closest(".section").length === 0 ) {
                $('#info').show();
            }
        });
        
        // close input panel when wrapper is clicked
        $('#input-wrapper').on('click', function (e) {
            if ( $(e.target).closest("#input-panel").length === 0 ) {
                $(this).hide();
            }
        });
        
        // Key events
        $(document).keyup(function(e) {
            if( e.which == 191 ) {
                // ? for help
                $('#info').toggle();
            } else if (e.keyCode === 27) {
                // Escape
                $('.selector').hide();
            }
        });
        
        $('#gist-input').keyup(function(e) {
            if( e.which == 13 ) {
                params.set( 'gist', $(this).val() );
                window.location.href = uri();
            }
        });
        
        $('#css-input').keyup(function(e) {
            if( e.which == 13 ) {
                params.set( 'css', $(this).val() );
                window.location.href = uri();
            }
        });
        
        // hide selector if it or link not clicked
        $(document).click(function(event) {
            var id = event.target.id;
            if ( $('#gist-selector').is(':visible') ) {
                if ( id === 'gist-url' || id === 'gist-selector' || id === 'gist-input' ) {
                } else {
                    $('#gist-selector').hide();
                }
            }
            if ( $('#css-selector').is(':visible') ) {
                if ( id === 'css-url' || id === 'css-selector' || id === 'css-input' ) {
                } else {
                    $('#css-selector').hide();
                }
            }
        });
        
        // Gist and CSS selectors
        $('.selector-toggle').click(function() {
            var prefix = '#gist';
            var id = $(this).attr('id');
            if ( id === 'css-url' ) {
                prefix = '#css';
            }
            $(prefix + '-selector').toggle();
            // move focus to text input
            $(prefix + '-input').focus();

            // set position
            var p = $(this).position();
            $(prefix + '-selector').css({
                top: p.top + $(this).height() + 10,
                left: p.left - 50
            });
            
            // create click events for links
            $(prefix + '-selector span').click(function(event) {
                if ( prefix === '#gist' ){
                    params.set( 'gist', $(this).attr("id") );
                } else {
                    params.set( 'css', $(this).attr("id") );
                }
                window.location.href = uri();
            });
        });
        
        // add click event to toggle items in toc
        $( "#toc .toggle" ).click(function() {
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
    }
    
    // helper function for combining url parts
    function uri() {
        var q = params.toString();
        if ( q.length > 0 ) q = '?' + q;
        var base = window.location.href.split('?')[0];
        base = base.split('#')[0];
        return base + q + location.hash;
    }
    
    // helper function to ensure section ids are css compatible
    function css_name(str) {
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
    }
    
    // find first character in str that is not char and return its location
    function find_first_char_not(char, str) {
        for (var i = 0; i < str.length; i++){
            if (str[i] != char){
                return i;
            }
        }
        // found only same char so return -1
        return -1;
    }
    
    // helper function to avoid replication of example content
    function example_content(examples) {
        var content = '';
        for (var key in examples) {
            content += '<a href="https://gist.github.com/' + examples[key] + '" target="_blank">↪</a>';
            content += '<span id="' + examples[key] + '">' + key + '</span><br/>';
        }
        return content;
    }

});
