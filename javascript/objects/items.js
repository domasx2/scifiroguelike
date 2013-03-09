var engine = require('../engine');

engine.game.objectmanager.c('pistol_clip',{
   'sprite_name':'pistol_clip',
   'ammo':7,
   'capacity':7,
   'ammo_type':'pistol ammo',
   '_requires':'clip' 
});

engine.game.objectmanager.c('pistol_clip_lov',{
    '_requires':'pistol_clip',
    'sprite_name':'pistol_clip_lov',
    'ammo_type':'LoV'
});

engine.game.objectmanager.c('pistol_clip_incendiary', {
   '_requires':'pistol_clip',
   'sprite_name':'pistol_clip_incendiary',
   'ammo_type':'incendiary' 
});

engine.game.objectmanager.c('pistol', {
    'sprite_name':'pistol',
    '_slot': 'weapon',
    'clip_type': 'pistol_clip',
    '_requires': 'item equippable usesammo'
});

