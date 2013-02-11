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
