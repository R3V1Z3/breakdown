# Project Tasks

gist files can contain new nav panel contents.
lets flag when they do

#include

links to any exising file in /templates/ folder will be included in a div
with any class/id added through html comment <!-- .footer -->
also add a unique id

- iterate over all links
- check path, return if not to /templates/ folder
- create urls array to send to gd.get_files()
- on success, get markdown contents and render to unique id

[I'm a relative reference to a repository file](../blob/master/LICENSE)

TODO
- ensure theme changes don't break layout in EntwinED and Emphases.
- in sectionize() add logic to keep track of heading type (h1, h2, h3) then add padding to toc representing level in hierarchy
- add function to handle dependencies internally so user doesn't need to add `<script>` and `<style>` references on their own.
- for ease with compiling into local apps, first try and access dependencies in a local folder. Or maybe just add a flag that uses the local folder rather than CDN, etc.
- when parsing gist or README, get preferred theme to allow user to specify a theme. This can be overriden if needed by the host project (ie. someone forks the project and doesn't want to allow users access to custom themes).
- allow $gd_info to be hidden with html comments

REWRITE
Follow object oriented practices since the app focuses on sections which are probably best represented as objects.

- Section object will hold section contents and attributes.
    Panels will now be Sections with special classes like 'panel' and 'nav'
- Field object provides:
    methods to get field name, type, range and value
    html for use in Panels
    events
    field states based on user interaction
- Settings object will hold options and methods for reading/writing those options

OBJECT ARRAYS
- Section_List
- Field_List
