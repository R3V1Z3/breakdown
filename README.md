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
- URI handler

## What uses it?
Several projects now use the framework:
- [CHEATScheat](https://ugotsta.github.io/cheats/) - cheatsheet viewer
- [DownSlide](https://ugotsta.github.io/downslide/) - automatic presentations from Markdown documents
- [Entwine](https://ugotsta.github.io/entwine/) - interactive fiction ala Markdown
- [EntwinED](https://ugotsta.github.io/entwined/) - modular text processor and editor for Entwine
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

<!-- {$gd_slider_volume} -->

Example Gists <!-- {$gd_gist} -->
- [Alexa Cheats](https://gist.github.com/2a06603706fd7c2eb5c93f34ed316354)
- [Vim Cheats](https://gist.github.com/c002acb756d5cf09b1ad98494a81baa3)
- [Screen Cheatsheet](https://gist.github.com/af918e1618682638aa82)
- [Regular Expression Cheatsheet](https://gist.github.com/3893f6ac9447f7ee27fe)
- [R Spacial Analysis](https://gist.github.com/fc661f26ef51eae6377b)
- [Markdown resources](https://gist.github.com/eba62d45c82d0767a5a0)
- [An exhibit of Markdown](https://gist.github.com/deb74713e6aff8fdfce2)

Themes <!-- {$gd_css} -->
- [Technology](https://gist.github.com/adc373c2d5a5d2b07821686e93a9630b)
- [Console](https://gist.github.com/e9217f4e7ed7c8fa18f13d12def1ad6c)
- [Tech Archaic](https://gist.github.com/2d004ce3de0abc7a27be84f48ea17591)
- [Saint Billy](https://gist.github.com/76c39d26b1b44e07bd7a783311caded8)
- [Ye Olde Tavern](https://gist.github.com/c05dec491e954e53e050c6e9d60d7a25)
- [Old Glory](https://gist.github.com/43bff1c9c6ae8a829f67bd707ee8f142)
- [Woodwork](https://gist.github.com/c604615983fc6cdd5ebdbdd053800298)
- [Corkboard](https://gist.github.com/ada930f9dae1d0a8d95f41cb7a56d658)
- [Graph Paper](https://gist.github.com/77b1f66ad5093c2db29c666ad15f334d)
- [Eerie](https://gist.github.com/7ac556b27c2cd34b00aa59e0d3621dea)
- [Ghastly](https://gist.github.com/d1a6d5621b883bf6af886855d853d502)
- [Writing on the Wall](https://gist.github.com/241b47680c730c7162cb5f82d6d788fa)
- [Deep Blue](https://gist.github.com/51aa23d96f9bd81fe55c47b2d51855a5)
- [Shapes](https://gist.github.com/dbb6369d5cef9801d11e0c342b47b2e0)

Highlight Styles <!-- {$gd_select_highlight} -->
- None
- Default
- Androidstudio
- Dracula
- Github
- Monokai
- Solarized Dark
- Solarized Light
- Tomorrow Night
- Tomorrow
- Xcode
- Xt 256

<!-- {$gd_collapsible_filter_effects} -->

- <!-- {$gd_slider_blur="0,0,20,1,px"} -->
- <!-- {$gd_slider_brightness="1,0,3,0.1"} -->
- <!-- {$gd_slider_contrast="100,0,300,1,%"} -->
- <!-- {$gd_slider_grayscale="0,0,100,1,%"} -->
- <!-- {$gd_slider_hue-rotate="0,0,360,1,deg"} -->
- <!-- {$gd_slider_invert="0,0,100,1,%"} -->
- <!-- {$gd_slider_saturate="100,0,300,1,%"} -->
- <!-- {$gd_slider_sepia="0,0,100,1,%"} -->

<!-- {$gd_collapsible_end_filter_effects} -->

<!-- {$gd_toc="Table of Contents"} -->
<!-- {$gd_hide} -->
