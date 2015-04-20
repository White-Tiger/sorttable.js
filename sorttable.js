(function(){'use strict';
/*
  SortTable
  version 2e2 (enhanced)
  7th April 2007 (20th February 2015)
  Stuart Langridge, http://www.kryogenix.org/code/browser/sorttable/

  Instructions:
  Download this file
  Add <script src="sorttable.js"></script> to your HTML
  Add class="sortable" to any table you'd like to make sortable
  Click on the headers to sort

  Thanks to many, many people for contributions and suggestions.
  Licenced as X11: http://www.kryogenix.org/code/browser/licence.html
  This basically means: do what you want with it.
*/
var sorttable = {
	DATE_RE: /^(\d\d?)[\/\.-](\d\d?)[\/\.-]((\d\d)?\d\d)$/,
	CLASS_SORT: ['sorttable_sorted','sorttable_sorted_reverse'],
	CLASS_ARROW: ['sorttable_sortfwdind','sorttable_sortrevind'],
	ARROWS: /MSIE [5-8]\.\d/.test(navigator.userAgent) ? ['&nbsp<font face="webdings">6</font>','&nbsp<font face="webdings">5</font>'] : ['&nbsp;&#x25BE;','&nbsp;&#x25B4;'],
	_isi: false,
	_timer: null,
	init: function() {
		// quit if this function has already been called
		if (sorttable._isi) return;
		sorttable._isi = true;
		// kill the init timer for Safari
		if (sorttable._timer) clearInterval(sorttable._timer);

		if (!document.createElement || !document.getElementsByTagName) return;

		forEach(document.getElementsByTagName('table'), function(table) {
			if (table.className.search(/\bsortable\b/) != -1) {
				sorttable.makeSortable(table);
			}
		});
	},

	makeSortable: function(table) {
		if (!table.getElementsByTagName('thead').length) {
			// table doesn't have a tHead. Since it should have, create one and
			// put the first table row in it.
			var the = document.createElement('thead');
			the.appendChild(table.rows[0]);
			table.insertBefore(the, table.firstChild);
		}
		// Safari doesn't support table.tHead, sigh
		if (!table.tHead) table.tHead = table.getElementsByTagName('thead')[0];

		if (table.tHead.rows.length != 1) return; // can't cope with two header rows

		// work through each column and calculate its type
		var headrow = table.tHead.rows[0].cells;
		for (var i=0; i<headrow.length; ++i) {
			// manually override the type with a sorttable_type attribute
			if (!headrow[i].className.match(/\bsorttable_nosort\b/)) { // skip this col
				headrow[i].sorttable_rows = -1;
				headrow[i].sorttable_col = i;
				dean_addEvent(headrow[i], "click", sorttable.innerSortFunction);
			}
		}
	},

	guessType: function(table, column) {
		// guess the type of a column based on its first non-blank row
		var sortfn = sorttable.sort_alpha;
		for (var i=0; i<table.tBodies[0].rows.length; ++i) {
			var text = sorttable.getInnerText(table.tBodies[0].rows[i].cells[column]);
			if (text) {
				if (text.match(/^-?[£$¤]?[\d,.]+%?$/)) {
					return sorttable.sort_numeric;
				}
				// check for a date: dd/mm/yyyy or dd/mm/yy
				// can have / or . or - as separator
				// can be mm/dd as well
				var possdate = text.match(sorttable.DATE_RE);
				if (possdate) {
					// looks like a date
					var first = parseInt(possdate[1]);
					var second = parseInt(possdate[2]);
					if (first > 12) {
						// definitely dd/mm
						return sorttable.sort_ddmm;
					} else if (second > 12) {
						return sorttable.sort_mmdd;
					} else {
						// looks like a date, but we can't tell which, so assume
						// that it's dd/mm (English imperialism!) and keep looking
						sortfn = sorttable.sort_ddmm;
					}
				}
			}
		}
		return sortfn;
	},

	getInnerText: function(node) {
		// gets the text we want to use for sorting for a cell.
		// strips leading and trailing whitespace.
		// this is *not* a generic getInnerText function; it's special to sorttable.
		// for example, you can override the cell text with a customkey attribute.
		// it also gets .value for <input> fields.

		var attrib=node.getAttribute('data-st-key');
		if (attrib)
			return attrib;

		var hasInputs = (typeof node.getElementsByTagName == 'function') &&
			node.getElementsByTagName('input').length;
		if (!hasInputs){
			if (typeof node.textContent != 'undefined')
				return node.textContent.replace(/^\s+|\s+$/g, '');
			if (typeof node.innerText != 'undefined')
				return node.innerText.replace(/^\s+|\s+$/g, '');
			if (typeof node.text != 'undefined')
				return node.text.replace(/^\s+|\s+$/g, '');
		}
		switch (node.nodeType) {
		case 3: // TEXT_NODE
			if (node.nodeName.toLowerCase() == 'input')
				return node.value.replace(/^\s+|\s+$/g, '');
			/* falls through */
		case 4: // CDATA_SECTION_NODE
			return node.nodeValue.replace(/^\s+|\s+$/g, '');
		case 1: // ELEMENT_NODE
		case 11: // DOCUMENT_FRAGMENT_NODE
			var innerText = '';
			for (var i = 0; i < node.childNodes.length; ++i) {
				innerText += sorttable.getInnerText(node.childNodes[i]);
			}
			return innerText.replace(/^\s+|\s+$/g, '');
		}
		return '';
	},

	reverseSort: function(tbody) {
		// reverse the rows in a tbody
		for (var i=tbody.rows.length; i; ) {
			tbody.appendChild(tbody.rows[--i]);
		}
	},

	updateArrow: function(th,inverse,create) {
		var arrow = th.parentNode.stArrow;
		if (create){
			if (arrow){
				var preth = arrow.parentNode;
				preth.removeChild(arrow);
				// remove sorttable_sorted classes
				preth.className = preth.className
					.replace(new RegExp('\\s*\\b'+sorttable.CLASS_SORT[0]+'\\b\\s*'),'')
					.replace(new RegExp('\\s*\\b'+sorttable.CLASS_SORT[1]+'\\b\\s*'),'');
			}
			arrow = document.createElement('span');
			th.className += ' '+sorttable.CLASS_SORT[inverse];
			th.parentNode.stArrow = th.appendChild(arrow);
		} else // toggle class
			th.className = th.className.replace(new RegExp('\\b'+sorttable.CLASS_SORT[(1+inverse)%2]+'\\b'), sorttable.CLASS_SORT[inverse]);
		arrow.className = sorttable.CLASS_ARROW[inverse];
		arrow.innerHTML = sorttable.ARROWS[inverse];
	},

	/** @this {Element} */
	innerSortFunction: function(e) {
		var sorted = (this.className.indexOf(sorttable.CLASS_SORT[0]) != -1);
		var inverse = (sorted && this.className.indexOf(sorttable.CLASS_SORT[1])==-1) ? 1 : 0;
		var table = this.parentNode.parentNode.parentNode;
		var rows = table.tBodies[0].rows;
		var col = this.sorttable_col;
		var i;

		sorttable.updateArrow(this,inverse,!sorted);
		if (rows.length !== this.sorttable_rows){
			this.sorttable_rows = rows.length;
			var mtch = this.className.match(/\bsorttable_([a-z0-9]+)\b/);
			if (mtch && sorttable['sort_'+mtch[1]]) {
				this.sorttable_sortfunction = sorttable['sort_'+mtch[1]];
			} else {
				this.sorttable_sortfunction = sorttable.guessType(table,col);
			}
		} else if (sorted) {
			sorttable.reverseSort(table.tBodies[0]);
			return;
		}

		// build an array to sort. This is a Schwartzian transform thing,
		// i.e., we "decorate" each row with the actual sort key,
		// sort based on the sort keys, and then put the rows back in order
		// which is a lot faster because you only do getInnerText once per row
		var row_array = [];
		for (i=0; i<rows.length; ++i) {
			row_array[i] = [sorttable.getInnerText(rows[i].cells[col]), rows[i]];
		}
		/* If you want a stable sort, uncomment the following line */
		//sorttable.shaker_sort(row_array, this.sorttable_sortfunction);
		/* and comment out this one */
		row_array.sort(this.sorttable_sortfunction);
		if (inverse) row_array.reverse();

		var tb = table.tBodies[0];
		for (i=0; i<row_array.length; ++i) {
			tb.appendChild(row_array[i][1]);
		}
	},

	shaker_sort: function(list, comp_func) {
		// A stable sort function to allow multi-level sorting of data
		// see: http://en.wikipedia.org/wiki/Cocktail_sort
		// thanks to Joseph Nahmias
		var i,tmp;
		var start = 0;
		var end = list.length - 1;
		var swap = true;

		do{
			swap = false;
			for(i=start; i<end; ++i) {
				if(comp_func(list[i], list[i+1]) > 0) {
					tmp = list[i];
					list[i] = list[i+1];
					list[i+1] = tmp;
					swap = true;
				}
			} // for
			--end;

			if (!swap) break;

			for(i=end; i>start; --i) {
				if(comp_func(list[i], list[i-1]) < 0) {
					tmp = list[i];
					list[i] = list[i-1];
					list[i-1] = tmp;
					swap = true;
				}
			} // for
			++start;

		}while(swap);
	},

	/* sort functions
	   each sort function takes two parameters, a and b
	   you are comparing a[0] and b[0] */
	sort_numeric: function(a,b) {
		var aa = parseFloat(a[0].replace(/[^0-9.-]/g, ''));
		if (isNaN(aa)) aa = 0;
		var bb = parseFloat(b[0].replace(/[^0-9.-]/g, ''));
		if (isNaN(bb)) bb = 0;
		return aa - bb;
	},
	sort_alpha: function(a,b) {
		if (a[0] == b[0]) return 0;
		if (a[0] < b[0]) return -1;
		return 1;
	},
	sort_ddmm: function(a,b) {
		var mtch = a[0].match(sorttable.DATE_RE);
		var y = mtch[3]; m = mtch[2]; d = mtch[1];
		if (m.length == 1) m = '0' + m;
		if (d.length == 1) d = '0' + d;
		var dt1 = y + m + d;
		mtch = b[0].match(sorttable.DATE_RE);
		y = mtch[3]; m = mtch[2]; d = mtch[1];
		if (m.length == 1) m = '0' + m;
		if (d.length == 1) d = '0' + d;
		var dt2 = y + m + d;
		if (dt1 == dt2) return 0;
		if (dt1 < dt2) return -1;
		return 1;
	},
	sort_mmdd: function(a,b) {
		var mtch = a[0].match(sorttable.DATE_RE);
		var y = mtch[3]; d = mtch[2]; m = mtch[1];
		if (m.length == 1) m = '0' + m;
		if (d.length == 1) d = '0' + d;
		var dt1 = y + m + d;
		mtch = b[0].match(sorttable.DATE_RE);
		y = mtch[3]; d = mtch[2]; m = mtch[1];
		if (m.length == 1) m = '0' + m;
		if (d.length == 1) d = '0' + d;
		var dt2 = y + m + d;
		if (dt1 == dt2) return 0;
		if (dt1 < dt2) return -1;
		return 1;
	}
};

/* sorttable initialization */
if (document.addEventListener) { // modern browser
	document.addEventListener("DOMContentLoaded", sorttable.init, false);
} else if (/MSIE [5-8]\.\d/.test(navigator.userAgent)){ // for Internet Explorer
	document.write("<script id=__ie_onload defer src=javascript:void(0)><\/script>");
	var script = document.getElementById("__ie_onload");
	/** @this {Element} */
	script.onreadystatechange = function() {
		if (this.readyState == "complete") {
			sorttable.init(); // call the onload handler
		}
	};
} else if (/WebKit/i.test(navigator.userAgent)) { // for Safari
	sorttable._timer = setInterval(function() {
		if (/loaded|complete/.test(document.readyState))
			sorttable.init(); // call the onload handler
		},10);
}
window.onload = sorttable.init; // this alone would be enough, but triggers only after everything is fully loaded (eg. images)

/* Google Closure Compiler exports ( https://developers.google.com/closure/compiler/docs/api-tutorial3#export ) */
window['sorttable'] = sorttable;
sorttable['sort_numeric'] = sorttable.sort_numeric;
sorttable['sort_alpha'] = sorttable.sort_alpha;
sorttable['sort_ddmm'] = sorttable.sort_ddmm;
sorttable['sort_mmdd'] = sorttable.sort_mmdd;
sorttable['ARROWS'] = sorttable.ARROWS;
sorttable['makeSortable'] = sorttable.makeSortable;
sorttable['innerSortFunction'] = sorttable.innerSortFunction;

/* ******************************************************************
   Supporting functions: bundled here to avoid depending on a library
   ****************************************************************** */

// written by Dean Edwards, 2005
// with input from Tino Zijdel, Matthias Miller, Diego Perini

// http://dean.edwards.name/weblog/2005/10/add-event/

function dean_addEvent(element, type, handler) {
	if (element.addEventListener) {
		element.addEventListener(type, handler, false);
	} else {
		// assign each event handler a unique ID
		if (!handler.$$guid) handler.$$guid = dean_addEvent.guid++;
		// create a hash table of event types for the element
		if (!element.events) element.events = {};
		// create a hash table of event handlers for each element/event pair
		var handlers = element.events[type];
		if (!handlers) {
			handlers = element.events[type] = {};
			// store the existing event handler (if there is one)
			if (element["on" + type]) {
				handlers[0] = element["on" + type];
			}
		}
		// store the event handler in the hash table
		handlers[handler.$$guid] = handler;
		// assign a global event handler to do all the work
		element["on" + type] = handleEvent;
	}
}
// a counter used to create unique IDs
dean_addEvent.guid = 1;

function removeEvent(element, type, handler) {
	if (element.removeEventListener) {
		element.removeEventListener(type, handler, false);
	} else {
		// delete the event handler from the hash table
		if (element.events && element.events[type]) {
			delete element.events[type][handler.$$guid];
		}
	}
}

/** @this {Element} */
function handleEvent(event) {
	var returnValue = true;
	// grab the event object (IE uses a global event object)
	event = event || fixEvent(((this.ownerDocument || this.document || this).parentWindow || window).event);
	// get a reference to the hash table of event handlers
	var handlers = this.events[event.type];
	// execute each event handler
	for (var i in handlers) {
		this.$$handleEvent = handlers[i];
		if (this.$$handleEvent(event) === false) {
			returnValue = false;
		}
	}
	return returnValue;
}

function fixEvent(event) {
	// add W3C standard event methods
	event.preventDefault = fixEvent.preventDefault;
	event.stopPropagation = fixEvent.stopPropagation;
	return event;
}
/** @this {Element} */
fixEvent.preventDefault = function() {
	this.returnValue = false;
};
/** @this {Element} */
fixEvent.stopPropagation = function() {
	this.cancelBubble = true;
};

// Dean's forEach: http://dean.edwards.name/base/forEach.js
/*
	forEach, version 1.0
	Copyright 2006, Dean Edwards
	License: http://www.opensource.org/licenses/mit-license.php
*/

// array-like enumeration
if (!Array.forEach) { // mozilla already supports this
	Array.forEach = function(array, block, context) {
		for (var i = 0; i < array.length; ++i) {
			block.call(context, array[i], i, array);
		}
	};
}

// generic enumeration
Function.prototype.forEach = function(object, block, context) {
	for (var key in object) {
		if (typeof this.prototype[key] == "undefined") {
			block.call(context, object[key], key, object);
		}
	}
};

// character enumeration
String.forEach = function(string, block, context) {
	Array.forEach(string.split(""), function(chr, index) {
		block.call(context, chr, index, string);
	});
};

// globally resolve forEach enumeration
var forEach = function(object, block, context) {
	if (object) {
		var resolve = Object; // default
		if (object instanceof Function) {
			// functions have a "length" property
			resolve = Function;
		} else if (object.forEach instanceof Function) {
			// the object implements a custom forEach method so use that
			object.forEach(block, context);
			return;
		} else if (typeof object == "string") {
			// the object is a string
			resolve = String;
		} else if (typeof object.length == "number") {
			// the object is array-like
			resolve = Array;
		}
		resolve.forEach(object, block, context);
	}
};

})(); // sorttable scope