# GitDown
jQuery + GitHub Pages + MarkdownIt = ~~jGitHubMarkdownIt~~ GitDown

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
- URI handler
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

## Example Gists
These examples, when they exist in this README file, will be pulled and shown in a Gist drop-down in the Info panel. <!-- This should <script src"http://google'.com"></script>be converted to html comment -->
- [Alexa Cheats](?gist=2a06603706fd7c2eb5c93f34ed316354) - Fun commands for Amazon Alexa.
- [Screen Cheatsheet](?gist=af918e1618682638aa82) - Helpful commands for Screen.
- [Regular Expression Cheatsheet](?gist=3893f6ac9447f7ee27fe) - Easy reference for regular expressions.
- [R Spacial Analysis](?gist=fc661f26ef51eae6377b) - Spatial analysis notes in R language.
- [Markdown resources](?gist=eba62d45c82d0767a5a0) - A great showcase for Markdownit's rendering capabilities.
- [An exhibit of Markdown](?gist=deb74713e6aff8fdfce2) - Another great showcase for Markdown rendering.
- [Vim Cheats](?gist=c002acb756d5cf09b1ad98494a81baa3) - Simple, intuitive cheatsheet for Vim

## Example CSS Themes
As with the exmaple Gists, any CSS themes listed here will be pull and shown in a CSS theme drop-down in the Info panel.
- [Vintage](?css=686ce03846004fd858579392ca0db2c1) - Old fashioned styling.
- [Technology](?css=adc373c2d5a5d2b07821686e93a9630b) - Blue-ish, high-tech 3D style.
- [Saint Billy](?css=76c39d26b1b44e07bd7a783311caded8) - Most in-need-a-forgivinest theme ever.
- [Old Glory](?css=43bff1c9c6ae8a829f67bd707ee8f142) - Vintage Mercan with themed Info panel.
- [Woodwork](?css=c604615983fc6cdd5ebdbdd053800298) - Elegantly dark wood theme.
- [Corkboard](?css=ada930f9dae1d0a8d95f41cb7a56d658) - Lively corkboard theme with CSS pins.
- [Eerie](?css=7ac556b27c2cd34b00aa59e0d3621dea) - Eerie theme from [Eerie CSS](https://ugotsta.github.io/eerie-css/) project.
- [Ghastly](?css=d1a6d5621b883bf6af886855d853d502) - Eerie in the truest, traditional sense.
- [Writing on the Wall](?css=241b47680c730c7162cb5f82d6d788fa) - Writing on the cavern walls.

## `$gd_info`
`$gd_help_ribbon`
`$gd_element_count`
`$gd_gist`
`$gd_css`
`$gd_toc = "Table of Contents"`
`$gd_hide`
