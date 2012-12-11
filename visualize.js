function flipChart() {
	var margin = {top: 10, right:10, bottom: 10, left: 10},
		width = 200,
		height = 60,
		feature = 'TEMPERATURE',
		label = 'PLAY',
		fontSize = 4;
	
	function distinct(array, property) {
		var grouped = d3.nest()
			.key(function(d) { return d[property]; })
			.map(array)
		return d3.map(grouped).keys();
	} 
	
	
	function get(feature) {
		return function (d) { return d[feature]; };
	}
		
	function chart(selection) {		
		selection.each(function(data) {
			var groups = distinct(data, label).map(function (v) {
				return data.filter(function (d) { 
					return d[label] === v;	
				});
			});
			
			var featureValues = groups.map(function (g) {
				return g.map(function (e) { return e[feature]; });
			});
			
			selection.selectAll('.placeholder')
				.data(featureValues)
			  .enter().append('div')
				.call(scattergram())
			
		});
	}
	
	
	return chart;
}


// possible to-do's
// combine nearby values (values within certain tolerance are combined)
function scattergram() {
	var margin = {top: 2, right: 12, bottom: 2, left: 12},
		width = 240 - margin.left - margin.right,
		height = 30 - margin.top - margin.bottom,
		color = 'gray',
		maxRadius = 9;
	
	// size based on frequency of data value
	function radius(data) {
 		return function(d) {
			var count = data.filter(function (e) { return e === d; }).length;
			var prob = data.length ? count / data.length : 0;
			return maxRadius * Math.sqrt(prob);
		}
	}
	
	function chart(selection) {
		selection.each(function(data) {
			console.log(data)
			
			// get or create our svg element
			var svg = d3.select(this).selectAll('svg');		
			if (svg.empty()) 
				svg = d3.select(this).append('svg');
			svg .attr('width', width + margin.left + margin.right)
				.attr('height', height + margin.top + margin.bottom);
			
			// make the margins
			var g = svg.select('g');
			if (g.empty()) 
				g = svg.append('g')
			g.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

			var xScale = d3.scale.linear()
				.domain(d3.extent(data))
				.range([0, width]);
			
			// add points
			var circles = g.selectAll('.circle')
				.data(data)
			 		
			circles.enter().append('circle')
				.attr('class', 'circle')
				.attr('cx', xScale)
				.attr('cy', 0.5 + height / 2)
				.attr('r', 0)
				.attr('fill', color)
				.attr('stroke', 'black')
				.attr('stroke-width', 0.3)
				.style('opacity', 0.7);
			
			circles.transition()
				.duration(1000)
				.attr('cx', xScale)
				.attr('fill', color)
				.attr('r', radius(data))
			
			circles.exit().transition()
				.duration(1000)
				.attr('r', radius(data))
				.remove();
				
		});
	}
	
	chart.color = function(_) {
		if(!arguments.length) return color;
		color = _;
		return chart;
	}
	
	chart.maxRadius = function(_) {
		if(!arguments.length) return maxRadius;
		maxRadius = _;
		return chart;
	}
	
	chart.width = function(_) {
		if(!arguments.length) return width;
		width = _;
		return chart;
	}
	
	chart.height = function(_) {
		if(!arguments.length) return height;
		height = _;
		return chart;
	}
	
	return chart;
}

d3.json('tennis.json', function(data) {
    data.forEach(function(d) {
        d.TEMPERATURE = +d.TEMPERATURE;
        d.HUMIDITY = +d.HUMIDITY;
        d.WINDY = (d.WINDY === "true");
    });
    
    gd = data; // global for console inspection

	/*
	sg = scattergram();
	data1 = [1,2,1,3,4,5,5,5,5,1,2,7,10];
	data2 = [2,2,1,8,9,10,12,9,11];
	svg = d3.select('#chart').selectAll('.placeholder')
		.data([data1, data2])
	  .enter().append('div')
		.attr('class', 'placeholder')
		.call(sg)
		
	data1 = [1,2,3,3,3,3,3,4,5,5,8,8,1,2,8,1]
	d3.selectAll('.placeholder')
		.data([data1, data2])
		.call(sg)
		*/
		
		
	d3.select('body')
		.datum(data)
		.call(flipChart());
});










