var height = 250, width = 500;
var pad = .2;

//to represent svg canvas on document load
var r = null;
//to represent bars on document load
var plots = [];
//index of active histogram
var plotSelect = null;
//color wheel
var colorWheel = null;
//bin slider
var binSlider = null;
//create new plot object from a data set and name
function createPlot(data, name){
	data = data.sort(function (a,b) {return a-b});
	var plot = new Object();
	plot.data = data;
	plot.name = name;
	plot.svg = null;
	plot.color = null;
	plot.bins = null;
	plot.ticks = null;
	
	return plot;
	
	plots.push(plot);
	
	var option = document.createElement('option');
	option.text = plot.name;
	plotSelect.add(option, null);
	plotSelect.selectedIndex = plotSelect.options.length - 1;
	
	binSlider.value = binSlider.defaultValue;
	colorWheel.value = colorWheel.defaultValue;
	
	binsChanged();
	
	var min = data[0];
	var max = data[data.length - 1];
	var range = max - min;
	
	var tickCoords = getTickCoords( min, max );
	
	var yBase = y(-.1,true);
	
	for (var i = 0; i < tickCoords.length; i++){
		plot.svg.push( r.text( x( (tickCoords[i] - min)/range, true ), yBase, tickCoords[i].toFixed(1).toString() ) );
	}
	
	
};

function activePlot() {
	return plots[plotSelect.selectedIndex];
}

// scaling functions.  input ranges from 0 to 1.  origin is bottom left.
function x ( d, p ) {
    if (p) {
	return width * ( ( 1 - pad ) * d + pad / 2 );
    }
    else {
	return width * ( 1 - pad ) * d;
    }
};

function y ( d, p ) {
    if (p) {
	return height * ( ( 1 - pad / 2 ) - ( 1 - pad ) * d );
    }
    else {
	return ( 1 - pad ) * height * d;
    }
};

// get an array of n gaussian distributed (approx) random numbers from 0 to 1
function gaussian (n) {
    
    var ran = Math.random;

    var data = [];

    for (var i = 0; i < n; i++){
	data[i] = (ran() + ran() + ran()) * 10 / 3 - 499;
    }
    return data;
};

//produce tick mark locations from endpoints and desired density
function getTickCoords(min, max) {
	var range = max - min;
	var tickWidth = pow(10, Math.ceil( Math.log(range) / Math.log(10) ) - 1);
	
	var tick = Math.ceil(min/tickWidth) * tickWidth;
	var ticks = [];
	while (tick < max){
		ticks.push(tick);
		tick += tickWidth;
	}
	return ticks;
}

function drawAxes () {
    r.path ( 'M' + x(0,true).toString() + ',' + y(1,true).toString() + 
	     'L' + x(0,true).toString() + ',' + y(0,true).toString() + 
	     'L' + x(1,true).toString() + ',' + y(0,true).toString() );
};

// returns a function that will find the bin number for you
function binner ( bins, start, end ) {
    return function ( x ) {
	return Math.floor( ( x - start ) * bins / ( end - start ) )
    };
};

// creates a binned array from data and number of bins
function binData( data, bins ) {
    
    var start = data[0];
    var end = data[data.length -1];

    var bin = binner( bins, start, end );
    
    var hist = [];
    
    for (var i = 0; i < 100; i++){
	hist[i] = 0;
    }

    for (var i = 0; i < data.length; i++){
	hist[bin(data[i])]++;
    }

    return hist;

};

// queries the slider and draws a histogram
function binsChanged () {

	var plot = activePlot();

    r.clear();
	
    plot.bars.clear();

	activePlot().bins = binSlider.value;
	
    var bins = binSlider.valueAsNumber;

    hist = binData(plot.data,bins);

    var max = Math.max.apply(null, hist);

    var binWidth = x( 1 / bins );
	
	var color = activePlot().color;

    function rect ( bin, height ) {

		var pad = .2
		var xLoc = x( bin / bins, true ) + pad / 2 * binWidth;
		var yLoc = y(height, true);
		
		return r.rect( xLoc, yLoc, binWidth * ( 1 - pad ), y(height) ).attr('color',color);
    };
    
    for (var i = 0; i < bins; i++) {
		plot.svg.push(rect( i, hist[i] / max ));
    }
	
};

//queries color slider and sets outline color of bars
function colorChanged () {
    bars.attr('stroke',colorWheel.value);
};

function plotChanged() {
	var plot = activePlot();
	colorWheel.value = plot.color;
	binSlider.value = plot.bins;
};

data.push( createPlot(gaussian( 1000 ).sort(function (a,b) {return a - b})) );

window.onload = function () {
    
    r = Raphael("hist", width, height);

    bars = r.set();
	
	colorWheel = document.getElementById('color wheel');
	
	binSlider = document.getElementById('bin slider');
	
	plotSelect = document.getElementById('plot select');
	
	drawAxes();

    binsChanged();
	
	activeHistChanged();

    binSlider.onchange =  binsChanged;

    colorWheel.onchange = colorChanged;
	
	plotSelect.onchange = plotChanged;

}
