sorttable.js
============
enhanced fork of http://kryogenix.org/code/browser/sorttable/

sorttable allows HTML tables to be sorted by Javascript when clicked on a column header. It supports multiple data formats and even custom sort data

#### documentation
For some usage examples and functionality tests, see [my example page](https://cdn.rawgit.com/White-Tiger/sorttable.js/master/docs/example.html).
*(refer to [original site](http://kryogenix.org/code/browser/sorttable/) for original documentation and examples)*


#### changes compared to original sorttable v2
* now conforms to HTML5 specs (no more errors just because you use sorttable! Now validates to w3c)  
*This is an incompatible change if "sorttable_customkey" was used*
* fixed support of dynamic tables. Can now adapt to changes on a table
* improved IE compatibility
* most major initialization is delayed until user wants to sort a table. sorttable.js has now less impact on page load
* fixed detection of dates in format dd.mm.yyyy as numeric
* enhanced numeric sort with newly added decimal comma support (though it slowed down the detection progress)
* supports multiple "tbody" tags and allows to place additional headers in-between
* sorttable's up/down arrow used to have the ID #sorttable_sortfwdind and #sorttable_sortrevind.
It no longer uses an element ID but a class instead, .sorttable_sortfwdind and .sorttable_sortrevind respectively.
* sorttable's up/down arrow were upside down, so it used to be big-to-small if we sorted ascending which is wrong
* removed Sorttable v1 compatibility with use of "sortbottom" class
* fixed Javascript errors and warnings

### License
* MIT Licence, like the original
~~~~
