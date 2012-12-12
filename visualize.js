function histogram() {
	var margin = {top: 2, right:10, bottom: 2, left: 10},
		outerWidth = 90,
		outerHeight = 80,
		width = outerWidth - margin.left - margin.right,
		height = outerHeight - margin.top - margin.bottom,
		color = 'blue',
		up = true,
		numBins;
		
	function findBin(bins) {
		return function(d) {
			var result = bins.filter(function(b) { return b.x <= d && d <= (b.x + b.dx); })
			if (result.length == 1)
				return result[0];
			// should never get here
			console.log(result)
			bins.filter(function(b) { console.log(b.x, b.x + b.dx, d)})
		}
	}
	
	function chart(selection) {
		selection.each(function(data) {
			// perturb data by tiny amount to break ties
			data = data.map(function(d, i) { return d +  i * 1e-10; })
			
			// select or create the SVG element
			var svg  = d3.select(this).select('svg')
			if (svg.empty()) 
				svg = d3.select(this).append('svg')
			
			// select or create the inner group
			var innerG = svg.select('g')
			if (innerG.empty())
				innerG = svg.append('g')
			
			// update outer and inner dimensions
			svg .attr('width', outerWidth)
				.attr('height', outerHeight)
			innerG
				.attr('transform', 'translate(' + margin.left + ','  + margin.top + ')');
			
			// set up the histogram layout
			var hist = d3.layout.histogram()
				.frequency(false);
			if (typeof numBins !== 'undefined')
				hist.bins(numBins);
			var bins = hist(data);
			var bin = findBin(bins)
			
			// set up scales
			var x = d3.scale.linear()
				.domain(d3.extent(data))
				.range([0, width]);
				
			var y = d3.scale.linear()
				//.domain([0, d3.max(bins, function(d) { return d.y; })])
				.domain([0, 1])
				.range([0, height]);
		
			// bind data
			var bars = innerG.selectAll('.bar').data(bins)
			var blocks = innerG.selectAll('.block').data(data)

			// enter selection	
			blocks.enter().append('rect')
				.attr('class', 'block')
				.attr('x', function(d) { return x(bin(d).x); })
				.attr('width', width / bins.length - 0.5)
				.attr('height', function(d) { 
					var b = bin(d);
					return y(b.y) / b.length - 0.5;
				})
				.attr('y', function(d) { 
					var b = bin(d);
					var pos = b.indexOf(d) + 1;
					var yy = y(bin(d).y * pos / b.length)
					return up ? height - yy : yy;
				})			
				.attr('fill', color)
				.style('opacity', 0.5)

			// update selection
			blocks.transition()
				.duration(1000)
				.attr('height', function(d) { 
					var b = bin(d);
					return y(b.y) / b.length - 0.5;
				})
				.attr('y', function(d) { 
					var b = bin(d);
					var pos = b.indexOf(d) + 1;
					var yy = y(bin(d).y * pos / b.length)
					return up ? height - yy : yy;
				})
							
			blocks.transition()
				.delay(1000)
				.duration(1000)
				.attr('x', function(d) { return x(bin(d).x); })

			// exit selection
			blocks.exit().transition()
				.duration(1000)
				.style('opacity', 0)
				.remove()


		console.log(bins)
		
		});
	}
	
	chart.color = function(_) {
		if(!arguments.length) return color;
		color = _;
		return chart;
	}
	
	chart.up = function(_) {
		if(!arguments.length) return up;
		up = _;
		return chart;
	}
	
	chart.numBins = function(_) {
		if(!arguments.length) return numBins;
		numBins = _;
		return chart;
	}
	
	return chart;
}


// expects an array of two data arrays
function pairedHistograms() {
	var margin = {top: 2, right:10, bottom: 2, left: 10},
		outerWidth = 1000,
		outerHeight = 500;
		
	function chart(selection) {
		selection.each(function(data) {
			// select or create the SVG element
			var svg  = d3.select(this).select('svg')
			console.log(svg)
			if (svg.empty()) 
				svg = d3.select(this).append('svg')
			
			// select or create the inner group
			var innerG = svg.select('g')
			console.log(innerG)
			if (innerG.empty())
				innerG = svg.append('g')
			
			// update outer and inner dimensions
			svg .attr('width', outerWidth)
				.attr('height', outerHeight)
			innerG
				.attr('transform', 'translate(' + margin.left + ','  + margin.top + ')');
			
			// bind data and draw individual histograms
			var innerCharts = innerG.selectAll('.histogram')
				.data(data)
				
			innerCharts.enter().append('svg')
				.attr('y', function(d, i) { return i * 80; })
				.attr('class', 'histogram')
				.each(function (s, i) { 
					a = d3.select(this)
					d3.select(this).call(histogram().up(i ^ 1)); 
				});
				
			innerCharts
				.each(function (s, i) { 
					a = d3.select(this)
					d3.select(this).call(histogram().up(i ^ 1)); 
				});
		
		});
	}
	
	return chart;
}




d3.json('tennis.json', function(data) {
    data.forEach(function(d) {
        d.TEMPERATURE = +d.TEMPERATURE;
        d.HUMIDITY = +d.HUMIDITY;
        d.WINDY = (d.WINDY === "true");
    });
   	
    h = data.map(function(d) { return d.HUMIDITY; }); // global for console inspection
    t = data.map(function(d) { return d.TEMPERATURE; }); // global for console inspection

	d3.select('body')
		.datum([h, t])
		.call(pairedHistograms())
		
/*	d3.select('body')
		.datum(gd)
		.call(histogram())*/
});










