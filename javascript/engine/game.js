var gamejs = require('gamejs');
var ComponentEntityManager = require('./lib/cem').ComponentEntityManager;

var Game =  function(){
    this.objectmanager = new ComponentEntityManager();
    this.keys_pressed = {};
};

Game.prototype.init = function(settings,  resources){
    /*
     * Global variables & methods
     */
    this.sprite_defs = resources.sprites;
    this.settings = settings;
    this.cache = new (require('./cache').Cache)(resources); //workaround circular ref
    this.scene = null;
    this.tw = settings.TILE_WIDTH;
    this.ts = [this.tw,this.tw];
    
}

Game.prototype.handle_events = function(events){
    events.forEach(function(event){
        if(event.type == gamejs.event.KEY_DOWN){
            this.keys_pressed[event.key] = true;
        } 
        else if(event.type == gamejs.event.KEY_UP){
            delete this.keys_pressed[event.key];   
        }
    }, this);  
};

exports.game = window.game = new Game();

