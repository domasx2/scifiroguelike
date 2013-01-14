var gamejs = require('gamejs');
var game = require('./engine/game').game;
var GameScene  = require('./scenes').GameScene;
var resources = require('./resources');
var settings = require('./settings');

gamejs.preload(resources.images);

gamejs.ready(function() {
    game.init(settings, resources);
    gamejs.display.setCaption('SciFi roguelike project');
    
    var display = gamejs.display.setMode([600, 400]);
    display._context.mozImageSmoothingEnabled = false;
    display._context.webkitImageSmoothingEnabled = false;
    
    var scene = new GameScene({});

    var tick = function(deltams) {
        scene.update(deltams, gamejs.event.get());
        display.clear();
        scene.draw(display);
    };

    gamejs.time.fpsCallback(tick, this, 60);

});
