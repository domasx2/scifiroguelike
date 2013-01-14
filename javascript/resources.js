exports.images = ['./public/img/tiles/default.png',
                  './public/img/characters/protagonist.png'];
                  
                  
 
exports.sprites = {
    //PROTAGONIST
    'protagonist':{
        'type':'static',
        'angle_step': 90,
        'spritesheet_url':'./public/img/characters/protagonist.png',
    },
    'protagonist_move':{
        'type':'animated',
        'angle_step':90,
        'spritesheet_url':'./public/img/characters/protagonist.png',
        'frame_sequence':[0, 1, 0, 2],
        'duration': 500,
        'loop': true
    }
    
}
