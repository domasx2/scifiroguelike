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
   'team':'xeno',
   '_controller':engine.controllers.roam,
   '_requires':'creature'
});
