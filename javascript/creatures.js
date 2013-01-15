var engine = require('./engine');
var controllers = require('./controllers');

var creatures = {
    'engineer':{
        'sprite':'engineer',
        'controller':'roam'
    }
}


exports.new = function(name, position, angle){
    var def = creatures[name];
    return new engine.Creature({
        sprite: def.sprite,
        position: position,
        angle:angle,
        controller: controllers.new(def.controller)
    });
}
