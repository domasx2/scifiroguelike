var utils = require('../utils');
var gamejs = require('gamejs');
var pieces = require('./pieces');
var game = require('../game').game;
var random = require('../random');
var Map = require('../maps').Map;

var Generator = exports.Generator = function(options){
    utils.process_options(this, options, {
        seed: null
    });
    
    this.rnd = new random.Generator(this.seed);
    
    Generator.superConstructor.apply(this, [options]);
};

gamejs.utils.objects.extend(Generator, pieces.Piece);

Generator.prototype.get_map = function(){
    return new Map({
        size: this.size,
        walls: this.walls
    })  
};

