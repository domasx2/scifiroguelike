var gamejs = require('gamejs');

var Generator = exports.Generator = function(seed){
    if(seed) this.alea = new gamejs.utils.prng.Alea(seed);
    else this.alea = new gamejs.utils.prng.Alea();
};

Generator.prototype.random = function(){
    return this.alea.random();
};

Generator.prototype.int = function(min, max){
    return min + parseInt(this.alea.random() * (max-min+1));  
};

Generator.prototype.vec = function(min, max){
    //min and max are vectors [int, int];
    //returns [min[0]<=x<=max[0], min[1]<=y<=max[1]]
    return [this.int(min[0], max[0]), this.int(min[1], max[1])];
};

Generator.prototype.choose = function(items, remove){
    //return random item from items list
    var i =this.int(0, items.length-1);
    var item = items[i];
    if(remove) items.remove(i);
    return item;
};

Generator.prototype.maybe = function(probability){
    return this.alea.random() <= probability;
};


Generator.prototype.choose_probmap = function(probmap){
    /*
     * probmap is map item:propability:
     * 
     * {
     *     'item':1,
     *     'item2':3
     * }
     * 
     * chooses a single item.
     */
    var key;
    var tot=0;
    for(key in probmap) tot += probmap[key];   
    var rnd = this.alea.random()*tot;
    for(key in probmap){
        rnd -= probmap[key];
        if(rnd<=0) return key;
    }
}

exports.generator = new Generator();
