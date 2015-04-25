(function(){
if (!window['sorttable']){
	var script = document.createElement('SCRIPT');
	script.async = true;
	script.src = '//raw.githubusercontent.com/White-Tiger/sorttable.js/master/sorttable.js';
	script.onload = function(){
		sorttable['init']();
		var tables = document.getElementsByTagName('table');
		for(var i=tables.length; i--; )
			sorttable['makeSortable'](tables[i]);
	}
	document.getElementsByTagName('head')[0].appendChild(script);
}})();