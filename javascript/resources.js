exports.images = ['./public/img/tiles/default.png',
                  './public/img/characters/protagonist.png',
                  './public/img/characters/engineer.png'];
                  
      
      
exports.tilesheets = {
    'default': {'url':'./public/img/tiles/default.png',
                'floor': [1, 1],
                'wallmap': {
                    'xxx x11 x10':[0, 0],
                    'xxx 111 x0x':[1, 0],
                    'xxx 11x 01x':[2, 0],
                    'x0x 011 x1x':[3, 0],
                    'x0x 110 x1x':[4, 0],
                    
                    'x1x x10 x1x':[0, 1],
                    'x1x 01x x1x':[2, 1],
                    'x1x 011 x0x':[3, 1],
                    'x1x 110 x0x':[4, 1],
                    
                    'x10 x11 xxx':[0, 2],
                    'x0x 111 xxx':[1, 2],
                    '01x 11x xxx':[2, 2],
                    'x0x 110 x0x':[4, 2],
                    
                    'x0x 010 x1x':[1, 3],
                    'x0x 010 x0x':[2, 3],
                    'x1x 010 x0x':[3, 3],
                    'x0x 011 x0x':[4, 3]
                }
           }
};           
 
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
        'duration': 400,
        'loop': true
    },
    
    //ENGINEER
    'engineer':{
        'type':'static',
        'angle_step': 90,
        'spritesheet_url':'./public/img/characters/engineer.png',
    },
    'engineer_move':{
        'type':'animated',
        'angle_step':90,
        'spritesheet_url':'./public/img/characters/engineer.png',
        'frame_sequence':[0, 1, 0, 2],
        'duration': 500,
        'loop': true
    },
    
    
}
