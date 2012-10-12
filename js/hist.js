var height = 400, width = 800;
var pad = .2;
var barPad = .2;
var tickPad = .05;
var halfTickWidth = .005;

//to represent canvas on document load
var canvas = null;

//drawing context
var c = null;

//to represent bars on document load
var plots = null;

//called when creating new plot
var plotCounter = 1;

function createPlot(data){

    var plotName = 'plot' + plotCounter.toString();
    
    var plot = $('<div></div>')
	.addClass('accordion-group')
	.addClass('alert')
	.addClass('fade')
	.addClass('in')
	.prop('id',plotCounter)
	.data('data',data);

    var close = $('<a><i class="icon-remove" /></a>')
	.addClass('close')
	.attr('data-dismiss','alert');

    plot.append(close);

    var heading = $('<div></div>')
	.addClass('accordion-heading')
	.addClass('container-fluid');

    var headingrow = $('<div></div>')
	.addClass('row-fluid');
    
    var active = $('<input />')
	.addClass('span3')
	.prop('type','checkbox')
	.prop('checked','true')

    headingrow.append(active);
    
    var toggle = $('<a></a>')
	.addClass('accordion-toggle')
	.addClass('span9')
	.attr('href','#' + plotName)
	.attr('data-parent','#' + plots.attr('id'))
	.attr('data-toggle','collapse')			
	.html(plotName);

    headingrow.append( toggle );

    heading.append(headingrow);

    plot.append(heading);

    var body = $('<div></div>')
	.addClass('accordion-body')
	.addClass('collapse')
	.attr('id',plotName);

    var properties = $('<form></form>')
	.addClass('accordion-inner');

    properties.append( $('<label>' + 'Plot Name' + '</label>') );
			           
    var title = $('<input />')
	.prop('type','text')
	.prop('id','title')
	.prop('value',plotName);
    
    properties.append(title);

    properties.append( $('<label>' + 'bin number' + '</label>' ) );

    var binnumber = $('<input />')
	.prop('type','number')
	.prop('step',1)
	.prop('value',50);
    
    properties.append(binnumber);

    properties.append( $('<label>' + 'color' + '</label>') );

    var color = $('<input />')
	.prop('id','color-edit')
	.prop('type','color');

    properties.append( color );

    body.append( properties );
    
    plot.append( body );

    //handle logic

    plot.bind('close', function () { console.log( plotName + ' was closed' ) } );

    active.change( function () {console.log(plotName + (this.checked ? ' is active' : ' is inactive' ))} );

    active.trigger('change');

    title.keyup( function (e) {
	    if (e.keyCode == 13) {
		$('.accordion-toggle',plot).html(this.value);
	    }
	}
	); 

    color.change( function () {
	    $('.accordion-toggle',plot).css('color',this.value);
	}
	);

    var initColor = '#';

    var rgb = hslToRgb( ( ( 23 + 3 * plotCounter ) / 13 ) % 1 , .5, .5 );

    for (var i in rgb) {
	initColor += Math.round(rgb[i]).toString(16);
    }

    color.prop('value',initColor);

    color.trigger('change');

    plots.append(plot);

    toggle.trigger('click.collapse.data-api');

    plotCounter++;
};

function hslToRgb(h, s, l){
    var r, g, b;

    if(s == 0){
        r = g = b = l; // achromatic
    }else{
        function hue2rgb(p, q, t){
            if(t < 0) t += 1;
            if(t > 1) t -= 1;
            if(t < 1/6) return p + (q - p) * 6 * t;
            if(t < 1/2) return q;
            if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        }

        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }

    return [r * 255, g * 255, b * 255];
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

function drawBBox() {
    var thickness = 5;
    c.lineWidth = 2 * thickness;
    c.rect(thickness,thickness, width - 2 * thickness, height - 2 * thickness);
    c.stroke();
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
    
    for (var i = 0; i <= bins; i++){
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

    var bins = binSlider.valueAsNumber;

    var hist = binData( plot.data, bins );

    plot.rawHist = hist;

    console.log('bins changed: ' + bins.toString() );
};

function changeHistogramValues(plot, hist) {
    var bins = hist.length;

    clearSet(plot.bars);

    plot.bins = bins;

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
}

//queries color slider and sets outline color of bars
function colorChanged () {
    var plot = activePlot();
    var color = colorWheel.value;
    plot.color = colorWheel.value;
    plot.bars.attr('fill',color);
    plot.axes[0].ticks.attr('fill',color);
    plot.axes[1].ticks.attr('fill',color);
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

$( 
  function () {
      
      canvas = document.getElementById('hist');

      canvas.width = width;

      canvas.height = height;

      c = canvas.getContext('2d');
      
      drawBBox();

      plots = $('#plots').first();

      $('input[type=range]').prop('min', 20);
      $('input[type=range]').prop('max', 40);
      

      $('#add-plot').click( function () {createPlot(gaussian(100,1,100))} );
  }
   );

