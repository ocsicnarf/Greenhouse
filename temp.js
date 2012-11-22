/*  
Creates a node of a decision tree.
	data: array of objects; label: string; attrs: array of attributes
*/  
function Node(data, label, attrs) {
	if (typeof data === 'undefined') 
		throw Error('Node(): data is required.');
	if (typeof label === 'undefined') 
		throw Error('Node(): label is required.');
	if (d3.keys(data[0]).indexOf(label) < 0)
		throw Error('Node(): label must be contained in the data.')
	if (attrs && attrs.indexOf(label) >= 0) 
		throw Error('Node(): label is also listed as an attribute.');
	if (attrs && attrs.some(function(a) { return d3.keys(data[0]).indexOf(a) < 0; }))
		throw Error('Node(): all attributes must be contained in the data.')
		
	this.data = data;
	this.label = label;
	if (typeof attrs === 'undefined') {
		console.log('Attributes will be inferred from data');	
		this.attrs = d3.keys(data[0]);
	} else {
		this.attrs = attrs;
	}
		
	this.entropy = function() {
		var total = this.data.length;
		var frequencies = d3.nest()
			.key(function(d) { return d[label]; })
			.rollup(function(g) { return g.length / total; })
			.entries(this.data);
		var entropyTerms = frequencies.map(function(d) { 
			return -d.values * Math.LOG2E * Math.log(d.values);
		})
		return d3.sum(entropyTerms);
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
	//Node(data);
	//Node(data, 'NONSENSE');
	//Node(data, 'PLAY', ['NONSENSE']);
	//Node(data, 'PLAY', ['PLAY', 'HUMIDITY']);
	root = new Node(data, 'PLAY');
	console.log(root.entropy())
});
























