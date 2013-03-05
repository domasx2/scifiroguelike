var engine = require('../engine');

engine.game.objectmanager.c('pistol_clip',{
   'sprite_name':'pistol_clip',
   '_requires':'item' 
});

engine.game.objectmanager.c('pistol', {
    'sprite_name':'pistol',
    '_slot': 'weapon',
    'clip_type': 'pistol_clip',
    'max_capacity':7,
    'ammo': 0,
    '_requires': 'item equippable usesammo'
});

