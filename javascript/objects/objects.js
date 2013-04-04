var engine = require('../engine');
var gamejs = require('gamejs');

engine.game.objectmanager.c('crate', {
	'_requires':'object',
	'sprite_name':'crate',
	'threadable':false
});

//will extend later
engine.game.objectmanager.c('rdoor', {
   '_requires':'door' 
});

engine.game.objectmanager.c('rchest', {
    '_requires':'chest'
});
