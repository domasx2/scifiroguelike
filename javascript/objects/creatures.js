var engine = require('../engine');

engine.game.objectmanager.c('engineer', {
    'sprite_name':'engineer',
    'team':'personell',
    '_requires':'creature'
});

engine.game.objectmanager.c('protagonist', {
    'sprite_name':'protagonist',
    'team':'player',
    'vision_range':8,
    'auto_vision': true,
    '_controller':engine.controllers.PlayerController,
    '_requires':'creature'
});

engine.game.objectmanager.c('crawler', {
   'sprite_name':'crawler',
   'health':20,
   'max_health':20,
   'team':'xeno',
   '_name':'Cralwer',
   '_default_item_weapon_type':'claw',
   '_description':'A bat-like creature with glowing red eyes',
   '_controller':engine.controllers.HostileMeleeController,
   '_requires':'creature'
});
