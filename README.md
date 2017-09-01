# GoGitDown
Framework for building apps on GitHub Pages, typically using Markdown, and with a heavy emphasis on extending capabilities through GitHub Gist.

## What it does
The framework provides:
- Markdown rendering function using MarkdownIt
- Configurable info panel with routine to update it
- Section renderer
- URL parameters
- Preprocess and postprocess functions for special cases includint tag_replace()
- Simple function to render CSS
- Function to convert names to CSS-compatible ones
- URI handler
- Various helper functions

## GitHub not needed
While this framework is built to work on GitHub Pages, it isn't required. GoGitDown is a client-side JavaScript project that can run on any HTML/JavaScript capable server.

### Core dependencies
- jQuery - https://jquery.com/
- Markdownit.js - https://markdown-it.github.io/
