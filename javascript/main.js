var gamejs = require('gamejs');
var engine = require('./engine');
var game = engine.game;
var GameScene  = require('./scenes/game').GameScene;
var MapGenDemoScene = require('./scenes/mapgen_demo').MapGenDemoScene;
var resources = require('./resources');
var settings = require('./settings');
var items = require('./items');

gamejs.preload(resources.images);

gamejs.ready(function() {
    game.init(settings, resources);
    gamejs.display.setCaption('SciFi roguelike project');
    
    var display = game.display = gamejs.display.setMode(settings.DISPLAY_SIZE, gamejs.display.DISABLE_SMOOTHING);

    if(window.mapgendemo) game.set_scene(new MapGenDemoScene({'display':display}));
    else game.set_scene(GameScene.initial(display));

    var tick = function(deltams) {
        var events = gamejs.event.get();
        handle_events(events);
        if(game.scene){
            game.scene.update(deltams, events);
            display.fill('#000');
            game.scene.draw();
        }
    };
    gamejs.time.fpsCallback(tick, this, settings.FPS);
});


function save(){
    if(typeof(Storage)!=="undefined") {
        var data = game.scene.serialize();
        data.version = game.settings.VERSION;
        localStorage.quicksave = JSON.stringify(data);
        console.log(localStorage.quicksave);
        console.log('saved');
    }
    else console.log('No storage support??');
}

function load(){
    if((typeof(Storage)!=="undefined")&&localStorage.quicksave){
        var sceneopts = JSON.parse(localStorage.quicksave);
        sceneopts.display = game.display;
        game.set_scene(GameScene.load(sceneopts));
    }else {
        console.log('No storage support??');
    }
    
}

function handle_events(events){
    game.handle_events(events);
    events.forEach(function(event){
        if(event.type == gamejs.event.KEY_DOWN){
            if(event.key == gamejs.event.K_9){
                save();
            }  
            if(event.key == gamejs.event.K_0){
                load();
            }  
        }
    });
};
