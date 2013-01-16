exports.images = ['./public/img/tiles/default.png',
                  './public/img/characters/protagonist.png',
                  './public/img/characters/engineer.png'];
                  
      
      
exports.tilesheets = {
    'default': './public/img/tiles/default.png'
}            
 
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
