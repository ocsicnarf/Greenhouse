// utilities
function remove(array, remove) {
	var newArray = array.slice(0);
	var index = array.indexOf(remove);
	if(index >= 0) 
		newArray.splice(index, 1);
	return newArray
}
function entropy(subset, label) {
	var counts = {};
	for (var i = 0 ; i < subset.length; i++) {
		var value = subset[i][label]
		counts[value] = ++counts[value] || 1.0;
	}
	var ent = 0.0;
	for (var value in counts) {
		var freq = counts[value] / subset.length;
		ent -= freq * Math.LOG2E * Math.log(freq);
	}
	return ent;
}
function splitEntropy(subsets, label) {
	var count = 0;
	var weightedSum = 0.0;
	for (var key in subsets) {
		var subset = subsets[key]
		count += subset.length;
		weightedSum += subset.length * entropy(subset, label);
	}
	return weightedSum / count;
}

// utilities on the dataset of js objects
function split(subset, attr, value) {
	var subsets = {}
	for(var i = 0; i < subset.length; i++) {
		var d = subset[i];
		if (typeof value === 'undefined' || value === null) 
			var key = d[attr];
		else
			var key = d[attr] <= value ? 'less than split value' : 'greater than split value';
		subsets[key] = subsets[key] || []
		subsets[key].push(d);
	}
	return subsets;
}
function values(subset, attr) {
	var obj = {}
	for (var i = 0; i < subset.length; i++){
		var value = subset[i][attr]
		obj[value] = value
	}
	
	// workaround: Object.keys converts numeric keys to strings
	var values = [];
	for (var prop in obj) 
		values.push(obj[prop])
	return values;
}

// a node of the decision tree
function Node(data, attrs, label) {
	this.subset = subset;
	this.attrs = attrs
	this.label = label;
	this.entropy = entropy(subset, label);	
}	
Node.prototype.split = function(attr, value) {
	var children = {};
	var subsets = split(this.subset, attr, value)
	var childAttrs = remove(this.attrs, attr)
	var childlabel = this.label
	for(var key in subsets) {
		children[key] = new Node(subsets[key], childAttrs, childlabel);
	}
	this.splitUsing = attr;
	this.splitOn = value;
	this.children = children
	this.gain = this.entropy - splitEntropy(subsets, this.label);
	return this
}
Node.prototype.findBestSplit = function() {
	var discreteAttrs = [];
	var continuousAttrs = [];
	for (var a = 0; a < this.attrs.length; a++) {
		var attr = this.attrs[a]
		var sampleValue = this.subset[0][attr]
		if(typeof sampleValue !== 'number') {
			discreteAttrs.push(attr);
		} else {
			continuousAttrs.push(attr);
		}
	}
	var best = { attr: null, value: null, ent: Number.POSITIVE_INFINITY };
	for (var  i = 0; i < discreteAttrs.length; i++) {
		var attr = discreteAttrs[i];
		var ent = splitEntropy(split(this.subset, attr), this.label);
		if (ent < best.ent) {
			best.ent = ent;
			best.attr = attr;
		}
	}
	for (var j = 0; j < continuousAttrs.length; j++) {
		var attr = continuousAttrs[j];
		var attrValues = values(this.subset, attr);
		for (var k = 0; k < attrValues.length; k++) {
			var ent = splitEntropy(split(this.subset, attr, attrValues[k]), this.label);
			if (ent < best.ent) {	
				best.ent = ent;
				best.attr = attr;
				best.value = attrValues[k];
			}
		}
	}
	return best;
}
Node.prototype.isLeaf = function() {
	return this.subset.length == 0 || this.entropy == 0 || this.attrs.length == 0
}
Node.prototype.buildTree = function() {
	var queue = [];
	queue.push(this);
	while(queue.length > 0) {
		var next = queue.shift()
		if(!next.isLeaf()) {
			var best = next.findBestSplit();
			var children = next.split(best.attr, best.value).children
			for(var key in children) {
				queue.push(children[key]);
			}
		}
	}
	return this;
}

d3.json('tennis.json', function(data) {
	// process data
	data.forEach(function(d) {
		d.HUMIDITY = +d.HUMIDITY;
		d.TEMPERATURE = +d.TEMPERATURE;
		d.WINDY = (d.WINDY == 'true');
	});
	var attributes = ['WINDY', 'HUMIDITY', 'TEMPERATURE', 'OUTLOOK']
	var label = 'PLAY'
	
	// some tests
	console.log('number of examples:', data.length);
	console.log('example:', data[0]);
	console.log('entropy of data, using', label, 'as label:', entropy(data, label));
	console.log('data split on OUTLOOK:', split(data, 'OUTLOOK'));
	console.log('entropy given OUTLOOK:', splitEntropy(split(data, 'OUTLOOK'), 'PLAY'));

	// build an entire tree
	var root = new Node(data, attributes, label);	
	root.buildTree();
	console.log('building tree:\n', root);
	
	// visualize
	var margin = {top: 100, right: 100, bottom: 100, left: 100},
		width = 960 - margin.left - margin.right,
		height = 500 - margin.top - margin.bottom;
		
	var tree = d3.layout.tree()
		.children(function(d) { 
			var array = []
			for(key in d.children)
				array.push(d.children[key]);
			return array; 
		})
		.size([width, height]);
	
	var svg = d3.select("body").append("svg")
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom)
	  .append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
		
	var nodes = tree.nodes(root);
	
	var link = svg.selectAll(".link")
		.data(tree.links(nodes))
	  .enter().append("path")
		.attr("class", "link")
		.attr("d", beeline);
	
	var node = svg.selectAll(".node")
		.data(nodes)
	  .enter().append("g")
		.attr("class", "node")
		.attr("transform", function(d) {
			return "translate(" + d.x + "," + d.y + ")";
		});
	
	node.append("text")
		.attr("class", "attribute")
		.text(function(d) { 
			return (d.splitUsing || 'LEAF') + ' entropy: ' + (Math.round(d.entropy * 100) / 100.0)
		});
	
});

// visualization functions (see mbostock's pedigree tree example http://bl.ocks.org/2966094)
function beeline(d, i) {
	return "M" + d.source.x + "," + d.source.y // SVG's moveto command
		+ "L" + d.target.x + "," + (d.target.y - 20) // SVG's lineto command
}








































