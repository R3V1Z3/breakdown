# GitDown
GitDown is an experimental framework for quickly building very specific types of web apps on GitHub Pages; apps that use Markdown and have a heavy emphasis on extending and experimenting using GitHub Gist for code hosting.

## What does it do?
The framework provides:
- a base project that can easily be forked on GitHub.
- Markdown rendering function using MarkdownIt
- configuration through URL parameter

## What uses it?
Several projects now use the framework:
- [CHEATScheat](https://ugotsta.github.io/cheats/) - cheatsheet viewer
- [DownSlide](https://ugotsta.github.io/downslide/) - automatic presentations from Markdown documents
- [Entwine](https://ugotsta.github.io/entwine/) - interactive fiction ala Markdown
- [EntwinED](https://ugotsta.github.io/entwined/) - modular text processor and editor for Entwine
- [Emphases](https://ugotsta.github.io/emphases/) - annotation and highlighting app, mainly for Bible references

## GitHub not required
While this framework is built to work on GitHub Pages, it isn't required. This is a client-side JavaScript project that can run on any HTML/JavaScript capable server.

`ⓘ This code block will not be rendered in the app. The code below marks the start of the nav panel.`

# 🅖ⓘ🅣🅓🅞🅦🅝 `🅖-nav`

`ⓘ The code below designates a list of content sources the user will be able to select from in the app.`

content `🅖-datalist`
- [Vim Cheats](https://gist.github.com/c002acb756d5cf09b1ad98494a81baa3)
- [Screen Cheatsheet](https://gist.github.com/af918e1618682638aa82)
- [Regular Expression Cheatsheet](https://gist.github.com/3893f6ac9447f7ee27fe)
- [R Spacial Analysis](https://gist.github.com/fc661f26ef51eae6377b)
- [Markdown resources](https://gist.github.com/eba62d45c82d0767a5a0)
- [An exhibit of Markdown](https://gist.github.com/deb74713e6aff8fdfce2)
- [Best Practices for Python](https://gist.github.com/7001839)
- [README.md Template](https://gist.github.com/109311bb0361f32d87a2)

## Appearance `🅖-collapsible` `🅢 {width: 240px;}`

css `🅖-datalist`
- [Dark Glow](https://gist.github.com/c6d0a4d16b627d72563b43b60a164c31)

`🅖-theme-variables`

## Effects `🅖-collapsible`

vignette-blend `🅖-select`
- multiply
- add

vignette `🅖-slider`

tiltshift `🅖-select`
- None
- *Elegant
- Extreme

svg-filter `🅖-select`
- *None

-----

brightness `🅖-slider="1,0,3,0.05"`
contrast `🅖-slider="100%,0,300,1,%"`
grayscale `🅖-slider="0%,0,100,1,%"`
hue-rotate `🅖-slider="0deg,0,360,1,deg"`
invert `🅖-slider="0%,0,100,1,%"`
saturate `🅖-slider="100%,0,300,1,%"`
sepia `🅖-slider="0%,0,100,1,%"`
blur `🅖-slider="0px,0,20,1,px"`

## Perspective `🅖-collapsible`

scale `🅖-slider="0,1,5,0.1"`
perspective `🅖-slider="1500px,0,2000,1,px"`
originX `🅖-slider="50%,0,100,1,%"`
originY `🅖-slider="50%,0,100,1,%"`
rotateX `🅖-slider="0deg,0,360,1,deg"`
rotateY `🅖-slider="0deg,0,360,1,deg"`
scaleZ `🅖-slider="0,1,5,0.1"`
rotateZ `🅖-slider="0deg,0,360,1,deg"`
translateZ `🅖-slider="0px,-500,500,1,px"`

## Dimensions `🅖-collapsible`

width `🅖-slider="960px,4,4000,1,px"`
height `🅖-slider="400px,4,2000,1,px"`
padding `🅖-slider="10px,0,500,1,px"`
onner-space `🅖-slider="100px,0,300,1,px"`
outer-space `🅖-slider="0px,0,300,1,px"`
offsetX `🅖-slider="0px,-4000,4000,1,px"`
offsetY `🅖-slider="0px,-4000,4000,1,px"`

## Contents `🅖-collapsible`

`🅖-toc`

## Help `🅖-group`

`🅖-help="https://github.com/ugotsta/gitdown-madly/#gitdown-madly"`
`🅖-hide`