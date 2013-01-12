var Game =  function(){
  
};

Game.prototype.init = function(settings,  resources){
    /*
     * Global variables & methods
     */
    this.sprite_defs = resources.sprites;
    this.settings = settings;
    this.cache = new (require('./cache').Cache)(resources); //workaround circular ref
}

exports.game = new Game();

