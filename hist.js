var height = 100, width = 200;

// scaling functions.  input ranges from 0 to 1.  origin is bottom left.
function x ( d, pad ) {
    if (pad) {
	return width * ( .9 * d + .05 );
    }
    else {
	return width * .9 * d;
    }
};

function y ( d, pad ) {
    if (pad) {
	return height * ( .95 - .9 * d );
    }
    else {
	return .9 * height * d;
    }
};

// get an array of n gaussian distributed (approx) random numbers from 0 to 1
function gaussian (n) {
    
    var ran = Math.random;

    var data = [];

    for (var i = 0; i < n; i++){
	data[i] = (ran() + ran() + ran()) / 3;
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
    
    var start = Math.min.apply(null, data);
    var end = Math.max.apply(null, data);

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
function drawHist () {

    r.clear();
    bars.clear();

    var bins = document.getElementById('bins').valueAsNumber;

    var hist = binData(data,bins);

    var max = Math.max.apply(null, hist);

    var barWidth = x( 1 / bins ) * .8;

    function rect ( bin, height ) {

	var xLoc = x( i / bins, true );
	var yLoc = y(height, true);
	
	return r.rect( xLoc, yLoc, barWidth, y(height) );
    };
    
    for (var i = 0; i < bins; i++) {
	bars.push(rect( i, hist[i] / max ));
    }
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
//test data
var data = gaussian( 10000 );

window.onload = function () {
    
    r = Raphael("hist", width, height);

    bars = r.set();

    drawHist();

    setColor();

    document.getElementById('bins').onchange =  drawHist;

    document.getElementById('color').onchange = setColor;

}
