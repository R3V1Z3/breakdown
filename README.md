# GitDown
jQuery + MarkdownIt + GitHub Pages = ~~jMarkdownItPages~~ GitDown

GitDown is an experimental framework for quickly building apps on GitHub Pages that use Markdown, and with a heavy emphasis on extending and experimenting using GitHub Gist for code hosting.

## What does it do?
The framework provides:
- a base for ready-made projects that can easily be forked on GitHub.
- Markdown rendering function using MarkdownIt
- Configurable info panel with routine to update it
- Section renderer
- URL parameters
- Preprocess and postprocess functions for special cases including tag_replace()
- Simple function to render CSS
- Function to convert names to CSS-compatible ones
- URI handler <!-- test comment -->
- Various helper functions

## What uses it?
Several projects now use the framework:
- [CHEATScheat](https://ugotsta.github.io/cheats/) - cheatsheet viewer
- [DownSlide](https://ugotsta.github.io/downslide/) - automatic presentations from Markdown documents
- [Entwine](https://ugotsta.github.io/entwine/) - interactive fiction ala Markdown
- [Emphases](https://ugotsta.github.io/emphases/) - annotation and highlighting app, mainly for Bible references

## GitHub not needed
While this framework is built to work on GitHub Pages, it isn't required. This is a client-side JavaScript project that can run on any HTML/JavaScript capable server.

### Core dependencies
- [jQuery](https://jquery.com/) - used for ajax calls and simplify_life()
- [Markdown-it](https://markdown-it.github.io/) - does all the heavy lifting of Markdown rendering
- [Highlight.js](https://highlightjs.org/) - used by Markdown-it for code highlighting

# Examples <!-- {$gd_info} -->
<!-- {$gd_help_ribbon} -->
<!-- {$gd_element_count} -->

Example Gists <!-- {$gd_gist} -->
- [Alexa Cheats](https://gist.github.com/2a06603706fd7c2eb5c93f34ed316354)
- [Screen Cheatsheet](https://gist.github.com/af918e1618682638aa82)
- [Regular Expression Cheatsheet](https://gist.github.com/3893f6ac9447f7ee27fe)
- [R Spacial Analysis](https://gist.github.com/fc661f26ef51eae6377b)
- [Markdown resources](https://gist.github.com/eba62d45c82d0767a5a0)
- [An exhibit of Markdown](https://gist.github.com/deb74713e6aff8fdfce2)
- [Vim Cheats](https://gist.github.com/c002acb756d5cf09b1ad98494a81baa3)

Themes <!-- {$gd_css} -->

<!-- {$gd_toc="Table of Contents"} -->
<!-- {$gd_hide} -->
