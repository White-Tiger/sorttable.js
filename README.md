sorttable.js
============
enhanced fork of http://kryogenix.org/code/browser/sorttable/

sorttable allows HTML tables to be sorted by Javascript when clicked on a column header. It supports multiple data formats and even custom sort data

#### documentation
refer to [original site](http://kryogenix.org/code/browser/sorttable/) for full documentation and examples. <br>
**Note: the custom sort attribute "sorttable_customkey" got replaced by "data-st-key" to be HTML5 conform.** <br>
For simple examples, see [my example](https://cdn.rawgit.com/White-Tiger/sorttable.js/master/docs/example.html) page.


#### changes compared to original sorttable
* made it conform to HTML5 specs (no more errors just because you use sorttable! Now validates to w3c) <br>
*This is an incompatible change if "sorttable_customkey" was used*
* sorttable's up/down arrow used to have the ID #sorttable_sortfwdind and #sorttable_sortrevind.
It no longer uses an element ID but a class instead, .sorttable_sortfwdind and .sorttable_sortrevind respectively.
* removed Sorttable v1 compatibility with use of "sortbottom" class
* fixed Javascript errors and warnings

### License
* MIT Licence, like the original
~~~~
