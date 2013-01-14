var Creature = require('../engine/object').Creature;
var controllers = require('./controllers');

var creatures = {
    'engineer':{
        'sprite':'engineer',
        'controller':'roam'
    }
}


exports.new = function(name, position, angle){
    var def = creatures[name];
    return new Creature({
        sprite: def.sprite,
        position: position,
        angle:angle,
        controller: new controllers[def.controller]() 
    });
}
