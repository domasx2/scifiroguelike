exports.disable_between_turns = function(dom, owner){
    //dom - jquery element
    //owner - object
    //dom will be disabled when it's not owners turn to act
    owner.on('end_turn', function(){
        dom.block({message:null});
    });
    
    owner.on('start_turn', function(){
        dom.unblock();
    });
}

exports.bound_actions_to_menu_items = function(actions, actor){
    var items = [];
    actions.forEach(function(action){
        items.push({
            'label':action.name(actor),
            'action':action
        });
    });
    return items;
};
