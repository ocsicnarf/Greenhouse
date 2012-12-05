(function() {   
    // expects a dtree_node
    function entropy(node) {
        if (!node.data().length) return 0;
        var frequencies = d3.nest()
            .key(function (d) { return d[node.label()]; })
            .rollup(function (g) {return g.length / node.data().length; })
            .entries(node.data());
        var entropyTerms = frequencies.map(function (d) {
            return -d.values * Math.LOG2E * Math.log(d.values);
        });
        return d3.sum(entropyTerms);
    }
    
    // children is a map of dtree_nodes
    function weightedEntropy(children) {
        var childNodes = children.values();
        var weights = childNodes.map(function (child) {
            return child.data().length;
        });
        var weightedEntropies = childNodes.map(function (child) {
            return child.data().length * entropy(child);
        }); 
        return d3.sum(weightedEntropies) / d3.sum(weights);
    }    

    function dtree_node() {
        var _data,
            _label,
            _attrs,
            _split,
            _children;
        
        function setChildren(children) {
            _children = children;
        }

        return {
            data: function(data) {
                if (!arguments.length) return _data.slice();
                _data = data;
                _attrs = _data.length ? d3.map(data[0]).keys() : [];
                _label = _attrs[0]; 
                return this;
            },

            attrs: function(attrs) {
                if (!arguments.length) return _attrs.slice();
                _attrs = attrs;
                return this;
            },
    
            label: function(label) {
                if (!arguments.length) return _label;
                _label = label;
                _attrs = _attrs.filter(function (a) { return a !== label; });
                return this;
            },
        
            entropy: function() {
                return entropy(this);
            },
        
            split: function() {
                if (typeof _split === 'undefined') 
                    _split = dtree_split(this, setChildren);
                return _split;
            },
        
            children: function(branch) {
                if(!arguments.length) 
                    return _children;
                else
                    return _children.get(branch);
            },
            
            gain: function() {
                if (typeof _children === 'undefined') return 0;
                return entropy(this) - weightedEntropy(_children);
            },

            leaf: function() {
                return this.data().length == 0 || this.attrs().length == 0 || this.entropy() == 0;
            }
        };
    };

    function dtree_split(node, callback) {
        var _node = node,
            _attr,
            _value;

        function continuous(attr) {
            return (typeof _node.data()[0][attr] === 'number');
        }       

        function performSplit(attr, value) {    
            var subsets;
            if (continuous(attr)) {
                subsets = new d3.map();
                subsets.set('left', _node.data().filter(function (d) { return d[attr] <= value; }));
                subsets.set('right', _node.data().filter(function (d) { return d[attr] > value; }));
            } else {
                subsets = new d3.map(d3.nest()
                    .key(function (d) { return d[attr]; })
                    .map(_node.data()))
            } 
            var childAttrs = _node.attrs().filter(function (a) { return a !== attr });
            var children = new d3.map();
            subsets.forEach(function (value, subset) {
                if (subset.length > 0) {
                    var child = dtree_node()
                        .data(subset)
                        .label(_node.label())
                        .attrs(childAttrs);
                    children.set(value, child);
                }
            });
            return children;
        }

        function findBestAttr() {
            var attrs = node.attrs();
            var entropies = attrs.map(function (a) {
                var children = performSplit(a, findBestValue(a));
                return weightedEntropy(children);
            });
            var argmindex = entropies.indexOf(d3.min(entropies));
            return attrs[argmindex];
        }
        
        function findBestValue(attr) {
            if (!continuous(attr)) return;
            var values = node.data().map(function (d) { return d[attr] });
            values.sort().splice(-1)  // do not split on the greatest value
            var entropies = values.map(function (v) {
                var children = performSplit(attr, v)
                return weightedEntropy(children);
            });
            var argmindex = entropies.lastIndexOf(d3.min(entropies));
            return values[argmindex];
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

            best: function() {
                _attr = findBestAttr();
                if (continuous(_attr))
                    _value = findBestValue(_attr);
                return this;
            },
                        
            perform: function() {
                if (!_node.data() || _node.data().length == 0) 
                    return; 

                if (typeof _attr !== 'undefined' && _node.attrs().indexOf(_attr) < 0)  
                    return;
                
                if (typeof _attr === 'undefined') {
                    this.best();
                } else if (typeof _value === 'undefined') {
                    _value = findBestValue(_attr);
                }
                
                var children = performSplit(_attr, _value);
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
    root = dtree.node()
        .data(d)
        .label('PLAY');

    queue = [root];
    i = 0;
    while(queue.length > 0 && i < 100) {
        i += 1;
        next = queue.shift();
        if(!next.leaf()) {
            children = next.split().best().perform();
            children.values().forEach(function (c) {
                queue.push(c);
            });
        }
    }

});
























