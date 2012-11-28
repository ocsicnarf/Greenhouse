function Node(data, label, attrs) {
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
	if (attrs && attrs.some(function (a) { return d3.keys(data[0]).indexOf(a) < 0; }))
		throw Error('Node(): all attributes must be contained in the data.')
	if (attrs && attrs.some(function (a) { return attrs.indexOf(a) !== attrs.lastIndexOf(a)}))
		throw Error('Node(): there are duplicated attributes.')
	
	this.data = data;
	this.label = label;
	if (typeof attrs === 'undefined') {
		var attrs = d3.keys(data[0]);
		console.log('Node(): Attributes will be inferred from data.');	
	} 
	this.attrs = attrs.filter(function (a) { return a !== label });

	function isContinuous(attr) {
		return (typeof data[0][attr] === 'number')
	}
		
	function computeEntropy(data, label) {
		var total = data.length;
		var frequencies = d3.nest()
			.key(function (d) { return d[label]; })
			.rollup(function (g) { return g.length / total; })
			.entries(data);
		var entropyTerms = frequencies.map(function (d) { 
			return -d.values * Math.LOG2E * Math.log(d.values);
		});
		return d3.sum(entropyTerms);
	}
	
	function computeGain(parent, children) {
		var total = parent.data.length;
		var childNodes = children.values();
		var weightedEntropies = childNodes.map(function (node) {
			return (node.data.length / total) * node.entropy;
		});
		return parent.entropy - d3.sum(weightedEntropies);
	}
	
	function computeChildren(parent, attr, value) {	
		var subsets;
		if (isContinuous(attr)) {
			subsets = new d3.map();
			subsets.set('left', parent.data.filter(function (d) { return d[attr] <= value; }));
			subsets.set('right', parent.data.filter(function (d) { return d[attr] > value; }));
		} else {
			subsets = new d3.map(d3.nest()
				.key(function(d) { return d[attr]; })
				.map(parent.data));
		}
		var childAttrs = parent.attrs.filter(function (a) { return a !== attr });
		var children = new d3.map()
		subsets.forEach(function(attrValue, subset) {
			children.set(attrValue, new Node(subset, parent.label, childAttrs));
		});
		return children;
	}
	
	function findBestSplitValue(parent, attr) {		
		if (isContinuous(attr)) {
			var values = d3.values(d3.nest()
				.key(function (d) { return d[attr]; })
				.rollup( function(g) { return g[0][attr]; })
				.map(parent.data));
			values.splice(-1); // we will not use largest value to split
			var gains = values.map(function (v) { 
				var children = computeChildren(parent, attr, v);
				return computeGain(parent, children);
			});
			return values[gains.indexOf(d3.max(gains))];
		} else { 
			// do nothing so return value is undefined
		}
	}
	
	this.entropy = computeEntropy(this.data, this.label);
	this.isLeaf = (this.entropy == 0 || this.attrs.length == 0);

	this.split = function(attr, value) {
		if (this.attrs.indexOf(attr) < 0) 
			throw Error('Node.split(): ' + attr + ' is not an attribute.');
		if (!isContinuous(attr) && typeof value !== 'undefined') 
			console.log('Node.split(): splitting on a discrete attribute, provided split value will be ignored.');
		if (isContinuous(attr) && typeof value === 'undefined') {
			console.log('Node.split(): splitting on a continuous attribute, but no split value provided, so using optimal value.');
			value = findBestSplitValue(this, attr);
		}

		this.children = computeChildren(this, attr, value);
		return this.children;
	}
		
	this.bestSplit = function() {
		var parent = this;
		var bestValues = new d3.map()
		var gains = this.attrs.map(function (a) {
			bestValues.set(a, findBestSplitValue(parent, a));
			var children = computeChildren(parent, a, bestValues.get(a));
			return computeGain(parent, children);
		});
		var bestAttr = this.attrs[gains.indexOf(d3.max(gains))];
		return this.split(bestAttr, bestValues.get(bestAttr)); 
	}
	
	this.computeGain = function() {
		if (typeof this.children === 'undefined') 
			throw Error('Node.computeGain(): must call Node.split() before computing gain')
		return computeGain(this, this.children);
	}
	
	this.buildTree = function() {
		var queue = [this]
		while (queue.length > 0) {
			var next = queue.shift();
			if (!next.isLeaf) {
				var children = next.bestSplit();
				children.values().forEach(function (c) { queue.push(c) });
			}
		}
		return this;
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
	console.log('entropy of root node', root.entropy);
	root.split('OUTLOOK', 78);
	console.log('gain from splitting using OUTLOOK', root.computeGain());
	console.log('splitting on the best attribute', root.bestSplit());
	console.log('build the best tree automatically', root.buildTree());
});
























