# Project Tasks

In-progress
- allow $gd_info to be hidden with html comments

TOD
- with variables now in default theme, find a way to disable variables in default theme that user selected theme doesn't use (search user provided theme for occurrences of variable?)
- only change url parameters if fields have been changed by user (don't change url parameters at load time unless defaults have been changed).
- for list fields, add theme variable as first item in list

- ensure theme changes don't break layout in EntwinED and Emphases.
- in sectionize() add logic to keep track of heading type (h1, h2, h3) then add padding to toc representing level in hierarchy
- add function to handle dependencies internally so user doesn't need to add `<script>` and `<style>` references on their own.
- for ease with compiling into local apps, first try and access dependencies in a local folder. Or maybe just add a flag that uses the local folder rather than CDN, etc.
- when parsing gist or README, get preferred theme to allow user to specify a theme. This can be overriden if needed by the host project (ie. someone forks the project and doesn't want to allow users access to custom themes).