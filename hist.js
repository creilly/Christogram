var height = 400, width = 800;
var pad = .2;
var barPad = .2;
var tickPad = .05;
var halfTickWidth = .005;

//to represent svg canvas on document load
var r = null;
//to represent bars on document load
var plots = [];
//index of active histogram

//controls
var plotSelect = null;
var colorWheel = null;
var binSlider = null;
var tickDecrease = null;
var tickIncrease = null;
var hAxisRadio = null;
var dropZone = null;
var plotRemove = null;

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
    
    //axes
    var axes = [];
    //horizontal
    axes[0] = null;
    //vertical
    axes[1] = null;
    plot.axes = axes;
    
    return plot;
};

function createAxis (min, max) {
    var axis = new Object();
    axis.min = min;
    axis.max = max;
    var range = max - min;
    var pow = Math.ceil(Math.log(range)/Math.log(10));
    var half = false;
    while ( ( ( range / Math.pow(10,pow) ) * ( half ? 2 : 1 ) ) < 4 ) {
	pow -= (half ? 1 : 0);
	half = !half;
    }
    axis.pow = pow;
    axis.half = half;
    axis.den = 0;
    
    axis.ticks = r.set();
    return axis;
};

//called when creating new plot
function createPlot(plot){

    plots.push(plot);
    
    plotSelect.selectedIndex = newOption(plot.name);
    
    plotChanged();
    
    binsChanged();
    
    drawTicks(horizontal = true);
    
};

function removePlot() {
    plot = activePlot();
    clearSet(plot.bars);
    clearSet(plot.axes[0]);
    clearSet(plot.axes[1]);
    
    plotSelect.remove(plotSelect.selectedIndex);
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

function drawTicks(horizontal) {

    // b stands for boolean
    var b = horizontal

    var plot = activePlot();

    var axis = plot.axes[ b ? 0 : 1 ]
    
    if (axis == null) {
	if (b) {
	    plot.axes[0] = axis = createAxis(plot.data[0], plot.data[plot.data.length-1])
	}
	else {
	    plot.axes[1] = axis = createAxis(Math.min.apply(Math, plot.hist), Math.max.apply(Math, plot.hist));
	}
    }
    else {
	clearSet( axis.ticks );
    }
    
    var min = axis.min;
    var max = axis.max;
    var range = max - min;
    
    var decPlaces = axis.den - axis.pow;
    var tickWidth = Math.pow(10, -1 * decPlaces);
    
    var nTicks = range/tickWidth
    var drawHalfTick = axis.half || ( nTicks > 5 );
    
    if (nTicks > 10) {
	tickWidth *= 2;
    }
    
    var tick = Math.ceil(min/tickWidth) * tickWidth;
    
    var base = (b ? y : x)( (plotSelect.selectedIndex) ? - tickPad : (1 + tickPad), true); //HACK
    
    var toggle = false;
    
    if (axis.half) {
	tickWidth *= .5;
	if ( (tick - tickWidth) > min ){
	    toggle = true;
	}
    }
    
    while (tick < max){
	if (!b && !plotSelect.selectedIndex) {
	    var pos = y( 1 - (tick - min) / range, true );
	}
	else{
	    var pos = (b ? x : y)( (tick - min) / range, true );
	}
	
	if (toggle && drawHalfTick) {
	    // draw half tick
	    var tickMark = r.circle( b ? pos : base, b ? base : pos, x(halfTickWidth,false) ).attr('stroke-width',0);
	}
	else {
	    var text = ( Math.round(tick * Math.pow(10, decPlaces)) / Math.pow(10,decPlaces)).toFixed( (decPlaces > 0) ? decPlaces : 0 ).toString();
	    var tickMark = r.text( b ? pos : base, b ? base : pos, text );
	}
	axis.ticks.push( tickMark );
	tick += tickWidth;
	toggle = !toggle;
    }
    
    axis.ticks.attr( 'fill', plot.color);	
    
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
    
    var barWidth = binWidth * ( 1 - barPad );
    var barOffset = (binWidth - barWidth) / 2;
    
    for (var i = 0; i < bins; i++) {
	
	var height = hist[i] / max;
	var yLoc = y((plotSelect.selectedIndex) ? height : 1,true);
	var barHeight = y(height, false);
	
	var xLoc = x( i / bins, true ) + barOffset;
	
	var rect = r.rect( xLoc, yLoc, barWidth, barHeight )	
	plot.bars.push(rect);
    }
    
    plot.bars.attr('fill',colorWheel.value);
    plot.bars.attr('fill-opacity', .5);
    plot.bars.attr('stroke-width',0);
    
    if ( plot.axes[1] != null ){
	clearSet(plot.axes[1].ticks);
	plot.axes[1] = null;
    }
    drawTicks(horizontal = false);
    
};

//queries color slider and sets outline color of bars
function colorChanged () {
    var plot = activePlot();
    var color = colorWheel.value;
    plot.color = colorWheel.value;
    plot.bars.attr('fill',color);
    plot.axes[0].ticks.attr('fill',color);
    plot.axes[1].ticks.attr('fill',color);
};

function plotChanged() {
    var plot = activePlot();
    colorWheel.value = plot.color;
    binSlider.value = plot.bins;
};

function densityChanged(horizontal, increase) {
    axis = activePlot().axes[horizontal ? 0 : 1];
    if (increase) {
	if (axis.half) {
	    axis.pow -= 1;
	}
    }
    else {
	if (!axis.half) {
	    axis.pow += 1;
	}
    }
    axis.half = !axis.half;
    drawTicks(horizontal = horizontal);
};

function parseString(s) {
    if ( s.search(/^[\d.]+|[\s,]+$/) == 0 ) {
	var data = s.match(/[\d.]+/g);
	for (var i = 0; i < data.length; i++) {
	    data[i] = parseFloat(data[i]);
	}
	return data;
    }
    else {
	return -1;
    }
};

function handleFileSelect(event) {
    
    console.log('drop detected');

    event.stopPropagation();
    event.preventDefault();
    
    //just get first file
    var file = event.dataTransfer.files[0]; // FileList object

    var fileName = file.name;

    var reader = new FileReader();

    function onRead (event) {
	
	var dataString = event.target.result;

	var data = parseString(dataString);

	console.log(data);

	if (data == -1) {
	    //improper data format
	    console.log('improper data format');
	    return; 
	}

	createPlot(newPlot(data, fileName));
    };

    // Closure to capture the file information.
    reader.onload = onRead;

    // Read in the image file as a data URL.
    reader.readAsText(file);

    return false;
};

function handleDragOver(event) {
    console.log('drag detected');
    event.stopPropagation();
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
    return false;
};

window.onload = function () {
    
    r = Raphael("hist", width, height);
    
    colorWheel = document.getElementById('color wheel');
    
    binSlider = document.getElementById('bin slider');
    
    plotSelect = document.getElementById('plot select');
    
    tickDecrease = document.getElementById('less ticks');
    
    tickIncrease = document.getElementById('more ticks');
    
    hAxisRadio = document.getElementById('horizontal axis radio');
    
    dropZone = document.getElementById('dropzone');
    
    plotRemove = document.getElementById('remove plot');
    
    //drawAxes();

    binSlider.onchange =  binsChanged;

    colorWheel.onchange = colorChanged;
    
    plotSelect.onchange = plotChanged;
    
    tickDecrease.onclick = function () {densityChanged(horizontal = hAxisRadio.checked, increase = false);}
    
    tickIncrease.onclick = function () {densityChanged(horizontal = hAxisRadio.checked, increase = true);}

    plotRemove.onclick = removePlot;

    dropZone.ondragover = handleDragOver;

    dropZone.ondrop = handleFileSelect;

    dropZone.style.width = width;

    createPlot( newPlot( gaussian(10000,-100,5 ) , 'test' ) );    

}
