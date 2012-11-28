/*  
Creates a node of a decision tree.
	data: array of objects; label: string; attrs: array of attributes
*/  
function Node(data, label, attrs) {
	// check arguments
	if (typeof data === 'undefined') 
		throw Error('Node(): data is required.');
	if (typeof label === 'undefined') 
		throw Error('Node(): label is required.');
	if (data.length < 1) 
		throw Error('Node(): data cannot be empty');
	if (d3.keys(data[0]).indexOf(label) < 0)
		throw Error('Node(): label must be contained in the data.')
	if (attrs && attrs.indexOf(label) >= 0) 
		throw Error('Node(): label is also listed as an attribute.');
	if (attrs && attrs.some(function(a) { return d3.keys(data[0]).indexOf(a) < 0; }))
		throw Error('Node(): all attributes must be contained in the data.')
	if (attrs && attrs.some(function(a) { return attrs.indexOf(a) !== attrs.lastIndexOf(a)}))
		throw Error('Node(): there are duplicated attributes.')
	
	this.data = data;
	this.label = label;
	if (typeof attrs === 'undefined') {
		var attrs = d3.keys(data[0]);
		console.log('Node(): Attributes inferred from data.');	
	} 
	this.attrs = attrs.filter(function(a) { return a !== label });
		
	function computeEntropy(data, label) {
		var total = data.length;
		var frequencies = d3.nest()
			.key(function(d) { return d[label]; })
			.rollup(function(g) { return g.length / total; })
			.entries(data);
		var entropyTerms = frequencies.map(function(d) { 
			return -d.values * Math.LOG2E * Math.log(d.values);
		});
		return d3.sum(entropyTerms);
	}
	
	function computeGain(parent, subsets) {
		var total = parent.data.length;
		var weightedEntropies = subsets.map(function(node) {
			return (node.data.length / total) * node.entropy;
		});
		return parent.entropy - d3.sum(weightedEntropies);
	}
	
	function computeSubsets (data, attr, value, continuous) {
		if(continuous && typeof value === 'undefined') {
			console.log('Node.split(): splitting on a continuous attribute, but no split value provided, so using optimal value.');
			value = findBestSplitValue(data, attr);
		}
		if(!continuous && typeof value !== 'undefined') 
			console.log('Node.split(): splitting on a discrete attribute, provided split value will be ignored');
		
		var subsets;
		if(continuous) {
			subsets = new d3.map();
			subsets.set('left', data.filter(function(d) { return d[attr] <= value; }));
			subsets.set('right', data.filter(function(d) { return d[attr] > value; }));
		} else {
			subsets = new d3.map(d3.nest()
				.key(function(d) { return d[attr]; })
				.map(data));
		}
		return subsets;
	}
	
	function findBestSplitValue(data, attr) {
		
	}
	
	this.entropy = computeEntropy(this.data, this.label);
	
	this.split = function(attr, value) {
		if (this.attrs.indexOf(attr) < 0) 
			throw Error('Node.split(): ' + attr + ' is not an attribute.');
		
		var continuous = (typeof attr === 'number');
		var subsets = computeSubsets(this.data, attr, value, continuous);
		this.children = new d3.map();
		var parent = this;
		var childAttrs = this.attrs.filter(function(a) { return a !== attr });
		subsets.forEach(function(attrValue, subset) {
			parent.children.set(attrValue, new Node(subset, parent.label, childAttrs));
		});
	}
		
	this.findBestSplit = function(split) {
		
		
	}
	
	this.computeGain = function() {
		if(typeof this.children === 'undefined') 
			throw Error('Node.computeGain(): must call Node.split() before computing gain')
		return computeGain(this, this.children.values());
	}
	
}

// unit tests
d3.json('tennis.json', function(data) {
	data.forEach(function(d) {
		d.TEMPERATURE = +d.TEMPERATURE;
		d.HUMIDITY = +d.HUMIDITY;
		d.WINDY = (d.WINDY === "true");
	});
	
	//Node();
	//Node([], 'PLAY');
	//Node(data);
	//Node(data, 'NONSENSE');
	//Node(data, 'PLAY', ['NONSENSE']);
	//Node(data, 'PLAY', ['PLAY', 'HUMIDITY']);
	//Node(data, 'PLAY', ['HUMIDITY', 'WINDY', 'HUMIDITY']);
	root = new Node(data, 'PLAY');
	console.log(root.entropy)
	root.split('OUTLOOK', 78);
	console.log(root.computeGain())
});
























