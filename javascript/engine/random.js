var gamejs = require('gamejs');

var Generator = exports.Generator = function(seed){
    if(seed) this.alea = new gamejs.utils.prng.Alea(seed);
    else this.alea = new gamejs.utils.prng.Alea();
};

Generator.prototype.int = function(min, max){
    return min + parseInt(this.alea.random() * (max-min+1));  
};

Generator.prototype.vec = function(min, max){
    //min and max are vectors [int, int];
    //returns [min[0]<=x<=max[0], min[1]<=y<=max[1]]
    return [this.int(min[0], max[0]), this.int(min[1], max[1])];
};

Generator.prototype.choose = function(items){
    //return random item from items list
    return items[this.int(0, items.length-1)];
};
