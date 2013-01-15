var gamejs = require('gamejs');
var engine = require('./engine');

exports.roam = engine.controllers.new(function(world, events){
    world.event_move(this.creature, Math.floor((Math.random()*4))*90);
    return true;
});

exports.new = function(name){
    return new exports[name]();
}
