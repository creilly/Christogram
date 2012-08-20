var height = 250, width = 500;

var pad = .2;
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

function drawAxes () {
    r.path ( 'M' + x(0,true).toString() + ',' + y(1,true).toString() + 
	     'L' + x(0,true).toString() + ',' + y(0,true).toString() + 
	     'L' + x(1,true).toString() + ',' + y(0,true).toString() );

    var range = data[data.length - 1] - data[0];

    var pow = Math.ceil( Math.log(range) / Math.log(10) ) - 1;

    var tickWidth = Math.pow( 10, pow);

    var n = Math.ceil( data[0] / tickWidth );
    console.log( n );

    var tick = x( ( n * tickWidth - data[0] ) / range, true );

    var h = y( 0, true ) + 15;

    while ( tick < x(1, true) ) {
	
	r.text(tick, h, ( n * tickWidth ).toFixed(1).toString());
	n++;
	tick += x(tickWidth/range);
    }
}

// queries the slider and draws a histogram
function drawHist () {

    r.clear();
    bars.clear();

    var bins = document.getElementById('bins').valueAsNumber;

    hist = binData(data,bins);

    var max = Math.max.apply(null, hist);

    var binWidth = x( 1 / bins );

    function rect ( bin, height ) {

	var pad = .2
	var xLoc = x( bin / bins, true ) + pad / 2 * binWidth;
	var yLoc = y(height, true);
	
	return r.rect( xLoc, yLoc, binWidth * ( 1 - pad ), y(height) );
    };
    
    for (var i = 0; i < bins; i++) {
	bars.push(rect( i, hist[i] / max ));
    }
    drawAxes();
    setColor();
};    

//queries color slider and sets outline color of bars
function setColor () {
    bars.attr('stroke',document.getElementById('color').value);
};

//to represent svg canvas on document load
var r = null;
//to represent bars on document load
var bars = null;
//histogram (on document load)
var hist = null;
//test data
var data = gaussian( 1000 ).sort(function (a,b) {return a - b});

window.onload = function () {
    
    r = Raphael("hist", width, height);

    bars = r.set();

    drawHist();

    setColor();

    document.getElementById('bins').onchange =  drawHist;

    document.getElementById('color').onchange = setColor;

}
