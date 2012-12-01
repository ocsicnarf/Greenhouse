(function() {
	function dtree_node() {
		var _data,
			_label,
			_attrs,
			_split,
			_children;
			
		function entropy(data, label) {
			if (!data.length) return 0;
			var frequencies = d3.nest()
				.key(function (d) { return d[label]; })
				.rollup(function (g) {return g.length / data.length; })
				.entries(data);
			var entropyTerms = frequencies.map(function (d) {
				return -d.values * Math.LOG2E * Math.log(d.values);
			});
			return d3.sum(entropyTerms);
		}
		
		function setChildren(children) {
			_children = children;
		}
		
		return {
			data: function(data) {
				if (!arguments.length) return _data;
				_data = data;
				_attrs = _data.length ? d3.map(data[0]).keys() : [];
				return this;
			},

	  		attrs: function(attrs) {
				if (!arguments.length) return _attrs;
				_attrs = attrs;
				return this;
			},
	
			label: function(label) {
				if (!arguments.length) return _label;
				_label = label;
				return this;
			},
		
			entropy: function() {
				return entropy(_data, _label);
			},
		
			split: function() {
				if (typeof _split === 'undefined') 
					_split = dtree_split(this, setChildren);
				return _split;
			},
		
			children: function() {
				return _children;
			},
			
			gain: function() {
				if (typeof _children === 'undefined') return 0;
				var childNodes = this.children().values();
				var weightedEntropies = childNodes.map(function (child) {
					return child.data().length * child.entropy();
				});
				return this.entropy() - (d3.sum(weightedEntropies) / this.data().length);
			}
		};
	};

	function dtree_split(node, callback) {
		var _node = node,
			_attr,
			_value;

		function continuous(node, attr) {
			return (typeof node.data()[0][attr] === 'number');
		}		

		function performSplit(node, attr, value) {
			var subsets;
			if (continuous(node, attr)) {
				subsets = new d3.map();
				subsets.set('left', node.data().filter(function (d) { return d[attr] <= value; }));
				subsets.set('right', node.data().filter(function (d) { return d[attr] > value; }));
			} else {
				subsets = new d3.map(d3.nest()
					.key(function (d) { return d[attr]; })
					.map(node.data()))
			} 
			var childAttrs = node.attrs().filter(function (a) { return a !== attr });
			var children = new d3.map();
			subsets.forEach(function (value, subset) {
				var child = dtree_node()
					.data(subset)
					.label(node.label())
					.attrs(childAttrs);
				children.set(value, child);
			});
			return children;
		}
			
		return {
			attr: function(attr) {
				if(!arguments.length) return _attr;
				_attr = attr;
				return this;
			},
		
			value: function(value) {
				if (!arguments.length) return _value;
				_value = value;
				return this;
			}, 
			
			perform: function() {
				var children = performSplit(_node, _attr, _value);
				callback(children);
				return children;
			}
		};
	};
	
	dtree = {};
	dtree.node = function() {		
		return dtree_node();
	}	
})();




// unit tests
d3.json('tennis.json', function(data) {
	data.forEach(function(d) {
		d.TEMPERATURE = +d.TEMPERATURE;
		d.HUMIDITY = +d.HUMIDITY;
		d.WINDY = (d.WINDY === "true");
	});
	
	d = data;
});
























