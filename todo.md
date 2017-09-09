# Project Tasks

In-progress
- ~~add a general style for app-title~~
- ~~change css_name() to clean_name()~~
- ~~use template system for Info panel~~
- ~~change #hide styling to display:block and float:right~~
- ~~remove height from #info~~
- ~~remove $gd_info from toc~~
- ~~rewrote pull_options()~~
- figure out a way to include example themes from core GitDown project so that child projects can use the same themes without having to copy-paste them.

TODO
- change load_gist() to use callbacks and make load_gist public
- add function to handle dependencies internally so user doesn't need to add <script> and <style> references on their own.
- for ease with compiling into local apps, first try and access dependencies in a local folder. Or maybe just add a flag that uses the local folder rather than CDN, etc.
- when parsing gist or README, get preferred theme to allow user to specify a theme. This can be overriden if needed by the host project (ie. someone forks the project and doesn't want to allow users access to custom themes).
- ensure tag_replace() sanitizes
- allow html comments for adding data elements to sections such as section positions.
