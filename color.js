var DEFAULT_COLOR_MODE = "RGB";

/**
 * Represents a color that can be expressed as an RGB value.
 * RGB values are in the range 0 ~ 255 (rounded for display).
 * HSL values are in the range 0 ~ 1.
 * A color can be constructed using any of the following:
 *  - No arguments; will be interpreted as black
 *  - A single integer representing a grayscale RGB value
 *  - Three integers or floats representing RGB or HSL values (depending on DEFAULT_COLOR_MODE)
 *  - A hex #NNNNNN color string
 *  - A canvas2d/CSS rgb(n,n,n) or hsl(n,n%,n%) color string
 *  - an object in the form {r: n, g: n, b: n} or {h: n, s: n, l: n}
 */
var Color = function(args) {
    if (arguments.length === 3) {
        switch (DEFAULT_COLOR_MODE) {
            case "RGB":
                this._setRGB(arguments[0], arguments[1], arguments[2]);
                break;
            case "HSL":
                this._setHSL(arguments[0], arguments[1], arguments[2]);
                break;
            default:
                throw new Error("Unsupported DEFAULT_COLOR_MODE, use 'HSL' or 'RGB'.");
        }
    }
    else if (!args) {
        this._setRGB(0,0,0);
    }
    else if (typeof args === "number") {
        this._setRGB(args, args, args);
    }
    else if (typeof args === "string") {
        args = args.toLowerCase();
        if (args.indexOf("#") === 0) {
            var r,g,b,a=1;
            if (args.length === 7) {
                r = parseInt(args.substring(1,3),16);
                g = parseInt(args.substring(3,5),16);
                b = parseInt(args.substring(5,7),16);
            }
            else {
                throw new Error("Invalid string! Use #NNNNNN");
            }
            this._setRGB(r,g,b,a);
        }
        else {
            var components = args.substring(4, args.length-1).split(",");
            if (args.indexOf("rgb") === 0) {
                components = components.map(function(str){return parseInt(str) || 0;});
                this._setRGB(components[0], components[1], components[2]);
            }
            else if (args.indexOf("hsl") === 0) {
                components[1] = components[1].substring(0,components[1].length-1);
                components[2] = components[2].substring(0,components[2].length-1);
                components = components.map(function(str){return parseInt(str) || 0;});
                this._setHSL(components[0]/360, components[1]/100, components[2]/100);
            }
            else {
                throw new Error("Invalid string! Use rgb(n,n,n) or hsl(n,n,n)");
            }
        }
    }
    else if (typeof args === "object") {
        var r = args.r || 0,
            g = args.g || 0,
            b = args.b || 0;
        var h = args.h || 0,
            s = args.s || 0,
            l = args.l || 0;
        var a = args.a || 1;
        if (r) this._setRGB(r,g,b,a);
        else this._setHSL(h,s,l,a);
    }
    else {
        throw new Error("Invalid color constructor!");
    }
};

Color.prototype.setAlpha = function(a) {
    return new Color({r: this.r, g: this.g, b: this.b, a: a});
};

Color.prototype.setRGB = function(r,g,b) {
    return new Color({r: r, g: g, b: b});
};

Color.prototype.setHSL = function(h,s,l) {
    return new Color({h: h, s: s, l: l});
};

/**
 * Returns a new Color that is the result of adding given RGB values.
 */
Color.prototype.addRGB = function(r,g,b) {
    return new Color({
        r: this.r + r,
        g: this.g + g,
        b: this.b + b
    });
};

/**
 * Returns a new Color that is the result of adding given HSL values.
 */
Color.prototype.addHSL = function(h,s,l) {
    return new Color({
        h: this.h + h,
        s: this.s + s,
        l: this.l + l
    });
};

Color.prototype._setRGB = function(r,g,b,a) {
    var hsl = Color.rgbToHsl(r,g,b);
    this.r = Color.clipRGB(r);
    this.g = Color.clipRGB(g);
    this.b = Color.clipRGB(b);
    this.h = Color.clipHSL(hsl[0]%1);
    this.s = Color.clipHSL(hsl[1]);
    this.l = Color.clipHSL(hsl[2]);
    this.a = Color.clipRGB(a);
    return this;
};

Color.prototype._setHSL = function(h,s,l,a) {
    var rgb = Color.hslToRgb(h,s,l);
    this.r = Color.clipRGB(rgb[0]);
    this.g = Color.clipRGB(rgb[1]);
    this.b = Color.clipRGB(rgb[2]);
    this.h = Color.clipHSL(h%1);
    this.s = Color.clipHSL(s);
    this.l = Color.clipHSL(l);
    this.a = Color.clipRGB(a);
    return this;
};

/**
 * Returns a new Color that complementary to this one.
 */
Color.prototype.complementary = function() {
    return new Color({
        h: this.h + 0.5,
        s: this.s,
        l: this.l
    });
};

/**
 * Returns an array of two Colors that are analogous to this one.
 * By default, these colors are shifted by 1/12 of the color wheel.
 * @param distance the distance to shift from the original color
 */
Color.prototype.analogous = function(distance) {
    distance = distance || 1/12;
    var col = this;
    return [new Color(), new Color()].map(function(color){
        distance = -distance;
        return color.setHSL(
            col.h + distance,
            col.s,
            col.l
        );
    });
};

/**
 * Returns an array of Colors that are a triad, including this one.
 */
Color.prototype.triad = function() {
    return this.nSet(3);
};

/**
 * Returns an array of Colors that are a tetrad, including this one.
 */
Color.prototype.tetrad = function() {
    return this.nSet(4);
};

/**
 * Returns an array of Color that are evenly spaced around the color wheel, including this one.
 * @param n the number of Colors
 */
Color.prototype.nSet = function(n) {
    var colors = [];
    for (var i=0; i<n; i++) {
        colors[i] = new Color({
            h: this.h + i * (1/n),
            s: this.s,
            l: this.l
        });
    }
    return colors;
};

/**
 * Returns the result of mixing this Color with a given Color in a given ratio.
 * This performs mixing using the HSL color model.
 * @param color the Color to mix in
 * @param f the ratio of this Color to the mix-in Color
 */
Color.prototype.mix = function(color, f) {
    var h1 = this.h, h2 = color.h, h;
    var d = h2 - h1;
    if (h1 > h2) {
        var temp = h1;
        h1 = h2;
        h2 = temp;
        d = -d;
        f = 1 - f;
    }
    if (d > 0.5) {
        h1 = h1 + 1;
        h = ( h1 + f * (h2 - h1) ) % 1;
    }
    if (d <= 0.5) {
        h = h1 + f * d;
    }
    return new Color({
        h: h,
        s: this.s * f + color.s * (1-f),
        l: this.l * f + color.l * (1-f)
    });
};

Color.prototype.mixRGB = function(color, f) {
    return new Color({
        r: this.r*(1-f) + color.r*f,
        g: this.g*(1-f) + color.g*f,
        b: this.b*(1-f) + color.b*f
    });
};

/**
 * Returns a String representation of this Color in rgb(n,n,n) format.
 */
Color.prototype.toRGBString = function () {
    return "rgba(" + Math.round(this.r) + "," +
                     Math.round(this.g) + "," +
                     Math.round(this.b) + "," +
                     this.a + ")";
};

/**
 * Returns a String representation of this Color in hsl(n,n%,n%) format.
 */
Color.prototype.toHSLString = function () {
    return "hsl(" + Math.round(this.h*360) + "," +
                    Math.round(this.s*100) + "%," +
                    Math.round(this.l*100) + "%," +
                    this.a + ")";
};

/**
 * Returns a String representation of this Color in rgb(n,n,n) format.
 */
Color.prototype.toString = function() {
    return this.toRGBString();
};

/**
 * Logs this color to the console as a color swatch.
 */
Color.prototype.log = function() {
	console.log("%c  ", "background: rgb("+(~~(this.r))+","+(~~(this.g))+","+(~~(this.b))+"); font-size: 30px;");
};

/**
 * Converts an HSL color value to RGB. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
 * Assumes h, s, and l are contained in the set [0, 1] and
 * returns r, g, and b in the set [0, 255].
 *
 * @param   Number  h       The hue
 * @param   Number  s       The saturation
 * @param   Number  l       The lightness
 * @return  Array           The RGB representation
 */
Color.hslToRgb = function(h, s, l){
    var r, g, b;
    if(s === 0){
        r = g = b = l; // achromatic
    }else{
        var hue2rgb = function hue2rgb(p, q, t){
            if(t < 0) t += 1;
            if(t > 1) t -= 1;
            if(t < 1/6) return p + (q - p) * 6 * t;
            if(t < 1/2) return q;
            if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };
        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
};

/**
 * Converts an RGB color value to HSL. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
 * Assumes r, g, and b are contained in the set [0, 255] and
 * returns h, s, and l in the set [0, 1].
 *
 * @param   Number  r       The red color value
 * @param   Number  g       The green color value
 * @param   Number  b       The blue color value
 * @return  Array           The HSL representation
 */
Color.rgbToHsl = function(r, g, b){
    r /= 255; g /= 255; b /= 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, l = (max + min) / 2;
    if(max === min){
        h = s = 0; // achromatic
    }else{
        var d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch(max){
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return [h, s, l];
};

Color.gradientMix = function(colors, f, mixRGB) {
    f = Math.abs(f%1);
    var c0 = Math.floor(f*colors.length),
        c1 = Math.ceil(f*colors.length)%colors.length;
    f = colors.length*f-c0;
    if (mixRGB) return colors[c0].mixRGB(colors[c1], f);
    return colors[c0].mix(colors[c1], f);
};

/**
 * Clips a value to the range [0, 255]
 */
Color.clipRGB = function(v) {return v<0?0:v>255?255:v;};

/**
 * Clips a value to the range [0, 1]
 */
Color.clipHSL = function(v) {return v<0?0:v>1?1:v;};

/**
 * Useful color constants
 */
Color.BLACK = new Color(0);
Color.WHITE = new Color(255);
Color.GRAY = new Color(127.5);
Color.PRIMARIES = [
    new Color({h: 60/360, s: 1, l: 0.5}),
    new Color({h: 180/360, s: 1, l: 0.5}),
    new Color({h: 300/360, s: 1, l: 0.5})
];
