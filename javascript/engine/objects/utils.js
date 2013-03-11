var utils = require('../utils');

exports.Damage = function(options){
    utils.process_options(this, options, {
        'amount':utils.required,
        'type':utils.required,
        'owner':null,
        'weapon':null
    });
    
    this.initial_amount = this.amount;
};
