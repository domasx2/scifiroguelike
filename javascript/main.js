var gamejs = require('gamejs');
var engine = require('./engine');
var game = engine.game;
var GameScene  = require('./scenes/game').GameScene;
var MapGenDemoScene = require('./scenes/mapgen_demo').MapGenDemoScene;
var resources = require('./resources');
var settings = require('./settings');

gamejs.preload(resources.images);

gamejs.ready(function() {
    game.init(settings, resources);
    gamejs.display.setCaption('SciFi roguelike project');
    
    var display = gamejs.display.setMode([600, 400]);
    display._context.mozImageSmoothingEnabled = false;
    display._context.webkitImageSmoothingEnabled = false;
    
    if(window.mapgendemo) game.scene = new MapGenDemoScene({});
    else game.scene = new GameScene({});

    var tick = function(deltams) {
        if(game.scene){
            game.scene.update(deltams, gamejs.event.get());
            display.clear();
            game.scene.draw(display);
        }
    };

    gamejs.time.fpsCallback(tick, this, settings.FPS);

});
