var utils = require('../utils');

exports.Damage = function(options){
    utils.process_options(this, options, {
        'amount':utils.required,
        'type':utils.required,
        'owner':null,
        'weapon':null,
        'spawn_particle':true //spawn hit particle for this dmg?
    });
    
    this.initial_amount = this.amount;
};
