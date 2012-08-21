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
function newPlot(data, name){

	data = data.sort(function (a,b) {return a-b});
	var plot = new Object();
	
	//base data
	plot.data = data;
	plot.name = name;
	
	//control settings
	plot.color = Raphael.getColor();
	plot.bins = binSlider.defaultValue;
	
	//histogram
	plot.hist = null;
	
	//svg content
	plot.bars = r.set();
	plot.xTicks = r.set();
	plot.yTicks = r.set();
	
	return plot;
}

//called when creating new plot
function createPlot(plot){

	plots.push(plot);
	
	plotSelect.selectedIndex = newOption(plot.name);
	
	plotChanged();
	
	binsChanged();
	
	drawXTicks();
	
};

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

function clearSet( set ) {
	while( set.length ){
		set.pop().remove();
	}
};

function drawXTicks() {
	var plot = activePlot();
	
	clearSet( plot.xTicks );
	
	var data = plot.data;
	var min = data[0];
	var max = data[data.length - 1];
	var range = max - min;
	
	var tickCoords = getTickCoords( min, max );
	
	var yLoc = y( (plotSelect.selectedIndex) ? 1.1 : -.1,true); //HACK
	
	for (var i = 0; i < tickCoords.length; i++){
		var xLoc = x( (tickCoords[i] - min ) / range, true );
		
		var tickMark = r.text( xLoc, yLoc, tickCoords[i].toFixed(1).toString() );
		
		plot.xTicks.push( tickMark );
	}
	
	plot.xTicks.attr('fill', plot.color);
	
};

function drawYTicks() {
	
	var plot = activePlot();
	
	clearSet( plot.yTicks );
	
	var hist = plot.hist;
	var min = 0;
	var max = Math.max.apply(Math, hist);
	console.log(max);
	var range = max - min;
	
	var tickCoords = getTickCoords( min, max );
	
	console.log(tickCoords);
	
	var xLoc = x((plotSelect.selectedIndex) ? -.1 : 1.1,true); //HACK
	
	for (var i = 0; i < tickCoords.length; i++){
		var yLoc = y( (tickCoords[i] - min ) / range, true );
		
		var tickMark = r.text( xLoc, yLoc, tickCoords[i].toString() );
		
		plot.yTicks.push( tickMark );
	}
	
	plot.yTicks.attr('fill', plot.color);
	
};

//produce tick mark locations from endpoints and desired density
function getTickCoords(min, max) {
	var range = max - min;
	var tickWidth = Math.pow(10, Math.ceil( Math.log(range) / Math.log(10) ) - 1);
	
	var tick = Math.ceil(min/tickWidth) * tickWidth;
	var ticks = [];
	while (tick < max){
		ticks.push(tick);
		tick += tickWidth;
	}
	return ticks;
};

function activePlot() {
	return plots[plotSelect.selectedIndex];
};

// get an array of n gaussian distributed (approx) random numbers from 0 to 1
function gaussian (n, mean, spread) {
    
    var ran = Math.random;

    var data = [];

    for (var i = 0; i < n; i++){
		data[i] = ( (ran() + ran() + ran()) / 3 - .5 ) * spread + mean;
    }
	
    return data;
};

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

//add select option, returns option's index
function newOption (name) {
	var option = document.createElement('option');
	option.text = name;
	plotSelect.add(option, null);
	return plotSelect.options.length - 1;
}

// queries the slider and draws a histogram
function binsChanged () {

	var plot = activePlot();
	
	clearSet(plot.bars);

	plot.bins = binSlider.value;
	
    var bins = binSlider.valueAsNumber;

    hist = binData( plot.data, bins );
	
	plot.hist = hist;

    var max = Math.max.apply(null, hist);

    var binWidth = x( 1 / bins, false );
    
	var barPad = .2;
	
	var barWidth = binWidth * ( 1 - barPad );
	var barOffset = (binWidth - barWidth) / 2;
	
    for (var i = 0; i < bins; i++) {
	
		var height = hist[i] / max;
		var yLoc = y(height, true);
		var barHeight = y(height, false);
		
		var xLoc = x( i / bins, true ) + barOffset;
		
		var rect = r.rect( xLoc, yLoc, barWidth, barHeight )	
		plot.bars.push(rect);
    }
	
	plot.bars.attr('stroke',colorWheel.value);
	
	drawYTicks();
	
};

//queries color slider and sets outline color of bars
function colorChanged () {
	var plot = activePlot();
	var color = colorWheel.value;
	plot.color = colorWheel.value;
    plot.bars.attr('stroke',color);
	plot.xTicks.attr('fill',color);
	plot.yTicks.attr('fill',color);
};

function plotChanged() {
	var plot = activePlot();
	colorWheel.value = plot.color;
	binSlider.value = plot.bins;
};

window.onload = function () {
    
    r = Raphael("hist", width, height);
	
	colorWheel = document.getElementById('color wheel');
	
	binSlider = document.getElementById('bin slider');
	
	plotSelect = document.getElementById('plot select');
	
	drawAxes();

    binSlider.onchange =  binsChanged;

    colorWheel.onchange = colorChanged;
	
	plotSelect.onchange = plotChanged;
	
	createPlot( newPlot( gaussian(10000,-100,5 ) , 'test' ) );
	
	createPlot( newPlot( gaussian(1000,0,3), 'zero' ) );

}
