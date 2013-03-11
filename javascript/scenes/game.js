var gamejs = require('gamejs');
var engine = require('../engine');
var levels = require('../levels');

var GameScene = exports.GameScene = function(options){
    engine.utils.process_options(this, options, {
        protagonist: null 
    });
    GameScene.superConstructor.apply(this, [options]);
};

GameScene.create_level = function(name){
    var lvlopts = levels[name];
    var gen = new engine.game.generators[lvlopts.generator.type](lvlopts.generator.options);
    var world  = new engine.World({
        'map': gen.get_map()
    });
    var populator = new engine.game.populators[lvlopts.populator.type](lvlopts.populator.options);
    var protagonist = world.spawn('protagonist', {
        position:gen.start_pos
    });
    populator.populate(gen, world);
    return [world, protagonist];
};

GameScene.initial = function (display){
    var lvl = GameScene.create_level('penitentiary');
    
    return new GameScene({
        display: display,
        world: lvl[0],
        protagonist: lvl[1]
    });
    
};

GameScene.load = function(data){
    return engine.scene.WorldScene.load(data, GameScene); 
};
    
gamejs.utils.objects.extend(GameScene, engine.scene.WorldScene);

