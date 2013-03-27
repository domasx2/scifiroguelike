var gamejs = require('gamejs');

var CachedFont = exports.CachedFont = function(font, color) {
    this.space_width = 3;
    this.tab_width = 12;
    this.chars = {}; //character:surface;
    this.font = null;
    if ((typeof font) == 'string') {
        color = color ? color : '#000';
        this.color = color;
        this.font = new gamejs.font.Font(font);

    } else {
        this.chars = font;
        this.font = new gamejs.font.Font(DEFAULT_FONT_DESCR);
        this.color = '#000';
    }
    //space width - 1/3 of m's width
    this.space_width = parseInt(Math.ceil(this.getCharSurface('m').getSize()[0] / 3));
    this.tab_width = 3 * this.space_width;
};


/**
 *returns gamejs.Surface for a character. Caches this surface if it is not cached
 *
 *@function
 *@param {String} c single character
 *
 *@returns {gamejs.Surface} surface object with the character painted on. Not a copy, don't paint on it!
 */
CachedFont.prototype.getCharSurface = function(c) {
    if (!this.chars[c]) {
        var s = this.font.render(c, this.color);
        this.chars[c] = s;
    }
    return this.chars[c];
};

/**
 *get size text would occupy if it was rendered
 *@function
 *
 *@param {String} text
 *
 *@returns {Array} size, eg. [width, height]
 */
CachedFont.prototype.getTextSize = function(text) {
    var w = 0,
        h = 0,
        c, l, sz;
    if (text) {
        for (var i = 0; i < text.length; i++) {
            c = text[i];
            if (c == ' ') w += this.space_width;
            else if (c == '\t') w += this.tab_width;
            else {
                l = this.getCharSurface(c);
                if (l) {
                    sz = l.getSize();
                    w += sz[0];
                    h = Math.max(sz[1], h);
                }
            }
        }
        if (!h) h = this.getCharSurface('m').getSize()[1];
        return [w, h];
    } else return [0, 0];
};

/**
 *render text on a surface
 *@function
 *
 *@param {gamejs.Surface} surface surface to render text on
 *@param {String} text text to render
 *@param {Array} position position to render the text at
 *@param {Number} space_width OPTIONAL, override space width
 */
CachedFont.prototype.render = function(surface, text, position, space_width) {
    ofst = position[0];
    space_width = space_width ? space_width : this.space_width;
    var i, c, s;
    for (i = 0; i < text.length; i++) {
        c = text[i];
        if (c == ' ') ofst += space_width;
        else if (c == '\t') ofst += this.tab_width;
        else {
            s = this.getCharSurface(c);
            r1 = [ofst, position[1]];
            surface.blit(s, r1);
            ofst += s.getSize()[0];
        }
    }
};