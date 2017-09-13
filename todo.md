# Project Tasks

In-progress
- Remove Example Gists and add code for pulling examples from $gd_info using list items
- allow $gd_info to be hidden with html comments
- make it possible to create a theme like this: https://upload.wikimedia.org/wikipedia/commons/7/75/Aleppo_Codex_Joshua_1_1.jpg

TODO
- change load_gist() to use callbacks and make load_gist public
- add function to handle dependencies internally so user doesn't need to add <script> and <style> references on their own.
- for ease with compiling into local apps, first try and access dependencies in a local folder. Or maybe just add a flag that uses the local folder rather than CDN, etc.
- when parsing gist or README, get preferred theme to allow user to specify a theme. This can be overriden if needed by the host project (ie. someone forks the project and doesn't want to allow users access to custom themes).
- ensure tag_replace() sanitizes
- allow html comments for adding data elements to sections such as section positions.

DONE
- ~~include exampe themes in core for easy access by child projects~~
- ~~update variable logic and add simple routine for operators ( $gd_toc="Contents" ), also hide toc when there are no sections as it won't be helpful~~
- ~~add a general style for app-title~~
- ~~change css_name() to clean_name()~~
- ~~use template system for Info panel~~
- ~~change #hide styling to display:block and float:right~~
- ~~remove height from #info~~
- ~~remove $gd_info from toc~~
- ~~rewrote pull_options()~~