/*
 * Detects entropy from a string.
 *
 * Formats include:
 * binary [0-1]
 * base 6 [0-5]
 * dice 6 [1-6]
 * decimal [0-9]
 * hexadecimal [0-9A-F]
 * card [A2-9TJQK][CDHS]
 *
 * Automatically uses lowest entropy to avoid issues such as interpretting 0101
 * as hexadecimal which would be 16 bits when really it's only 4 bits of binary
 * entropy.
 */

(function() {
  var hasNode = (typeof process !== 'undefined' && process.versions && process.versions.node),
      hasTypedArray = (typeof Uint8Array !== 'undefined');
  if (hasNode && require('fs').existsSync(__dirname + '/../build/Release/base91encdec.node')) {
    module.exports = require(__dirname + '/../build/Release/base91encdec.node');
    return;
  }
  var AVERAGE_ENCODING_RATIO = 1.2297,
      ENCODING_TABLE = [
        'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N',
        'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
        'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n',
        'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
        '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
        '!', '#', '$', '%', '&', '(', ')', '*', '+', ',', '.', '/', ':', ';',
        '<', '=', '>', '?', '@', '[', ']', '^', '_', '`', '{', '|', '}', '~',
        '"'
      ],
      DECODING_TABLE = [
        91, 91, 91, 91, 91, 91, 91, 91, 91, 91, 91, 91, 91, 91, 91, 91,
        91, 91, 91, 91, 91, 91, 91, 91, 91, 91, 91, 91, 91, 91, 91, 91,
        91, 62, 90, 63, 64, 65, 66, 91, 67, 68, 69, 70, 71, 91, 72, 73,
        52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 74, 75, 76, 77, 78, 79,
        80,  0,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11, 12, 13, 14,
        15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 81, 91, 82, 83, 84,
        85, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
        41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 86, 87, 88, 89, 91,
        91, 91, 91, 91, 91, 91, 91, 91, 91, 91, 91, 91, 91, 91, 91, 91,
        91, 91, 91, 91, 91, 91, 91, 91, 91, 91, 91, 91, 91, 91, 91, 91,
        91, 91, 91, 91, 91, 91, 91, 91, 91, 91, 91, 91, 91, 91, 91, 91,
        91, 91, 91, 91, 91, 91, 91, 91, 91, 91, 91, 91, 91, 91, 91, 91,
        91, 91, 91, 91, 91, 91, 91, 91, 91, 91, 91, 91, 91, 91, 91, 91,
        91, 91, 91, 91, 91, 91, 91, 91, 91, 91, 91, 91, 91, 91, 91, 91,
        91, 91, 91, 91, 91, 91, 91, 91, 91, 91, 91, 91, 91, 91, 91, 91,
        91, 91, 91, 91, 91, 91, 91, 91, 91, 91, 91, 91, 91, 91, 91, 91
      ];

  var i = 0;

  var base91 = {
    encode: function(data) {
      var len = data.length,
          output = '', ebq = 0, en = 0, ev = 0, j = 0, byte = 0;

      if (typeof data === 'string') {
        for (i = 0; i < len; ++i) {
          byte = data.charCodeAt(i);
          j = 0;
          var lenj = (byte < 128
                      ? 1
                      : (byte > 127 && byte < 2048
                         ? 2
                         : 3));
          for (; j < lenj; ++j) {
            if (lenj === 1)
              ebq |= byte << en;
            else if (lenj === 2) {
              if (j === 0)
                ebq |= ((byte >> 6) | 192) << en;
              else
                ebq |= ((byte & 63) | 128) << en;
            } else {
              if (j === 0)
                ebq |= ((byte >> 12) | 224) << en;
              else if (j === 1)
                ebq |= (((byte >> 6) & 63) | 128) << en;
              else
                ebq |= ((byte & 63) | 128) << en;
            }
            en += 8;
            if (en > 13) {
              ev = ebq & 8191;
              if (ev > 88) {
                ebq >>= 13;
                en -= 13;
              } else {
                ev = ebq & 16383;
                ebq >>= 14;
                en -= 14;
              }
              output += ENCODING_TABLE[ev % 91];
              output += ENCODING_TABLE[(ev / 91) | 0];
            }
          }
        }
      } else {
        for (i = 0; i < len; ++i) {
          ebq |= (data[i] & 255) << en;
          en += 8;
          if (en > 13) {
            ev = ebq & 8191;
            if (ev > 88) {
              ebq >>= 13;
              en -= 13;
            } else {
              ev = ebq & 16383;
              ebq >>= 14;
              en -= 14;
            }
            output += ENCODING_TABLE[ev % 91];
            output += ENCODING_TABLE[(ev / 91) | 0];
          }
        }
      }

      if (en > 0) {
        output += ENCODING_TABLE[ebq % 91];
        if (en > 7 || ebq > 90)
          output += ENCODING_TABLE[(ebq / 91) | 0];
      }

      return output;
    },
    decode: function(data, asFrmt) {
      var len = data.length,
          estimatedSize = ((len / AVERAGE_ENCODING_RATIO) | 0),
          dbq = 0, dn = 0, dv = -1, i = 0, o = -1, byte = 0,
          output = new Array(estimatedSize);

      if (typeof data === 'string') {
        for (i = 0; i < len; ++i) {
          byte = data.charCodeAt(i);
          if (DECODING_TABLE[byte] === 91)
            continue;
          if (dv === -1)
            dv = DECODING_TABLE[byte];
          else {
            dv += DECODING_TABLE[byte] * 91;
            dbq |= dv << dn;
            dn += ((dv & 8191) > 88 ? 13 : 14);
            do {
              if (++o >= estimatedSize)
                output.push(dbq & 0xFF);
              else
                output[o] = dbq & 0xFF;
              dbq >>= 8;
              dn -= 8;
            } while (dn > 7);
            dv = -1;
          }
        }
      } else {
        for (i = 0; i < len; ++i) {
          byte = data[i];
          if (DECODING_TABLE[byte] === 91)
            continue;
          if (dv === -1)
            dv = DECODING_TABLE[byte];
          else {
            dv += DECODING_TABLE[byte] * 91;
            dbq |= dv << dn;
            dn += ((dv & 8191) > 88 ? 13 : 14);
            do {
              if (++o >= estimatedSize)
                output.push(dbq & 0xFF);
              else
                output[o] = dbq & 0xFF;
              dbq >>= 8;
              dn -= 8;
            } while (dn > 7);
            dv = -1;
          }
        }
      }

      if (dv !== -1) {
        if (++o >= estimatedSize)
          output.push(dbq | dv << dn);
        else
          output[o] = (dbq | dv << dn);
      }

      if (o > -1 && o < estimatedSize - 1)
        output = output.slice(0, o + 1);

      if (asFrmt == 'raw')
        return output;
      var ret;
      if (hasNode)
        ret = new Buffer(output);
      else if (hasTypedArray) {
        ret = new Uint8Array(output.length);
        for (i = 0, len = output.length; i < len; ++i)
          ret[i] = output[i];
      } else
        ret = output;

      return ret;
    }
  };

  if (hasNode)
    module.exports = base91;
  else
    window.base91 = base91;
})();

window.Entropy = new (function() {

    let eventBits = {

    "binary": {
        "0": "0",
        "1": "1",
    },

    // log2(6) = 2.58496 bits per roll, with bias
    // 4 rolls give 2 bits each
    // 2 rolls give 1 bit each
    // Average (4*2 + 2*1) / 6 = 1.66 bits per roll without bias
    "base 6": {
        "0": "00",
        "1": "01",
        "2": "10",
        "3": "11",
        "4": "0",
        "5": "1",
    },

    // log2(6) = 2.58496 bits per roll, with bias
    // 4 rolls give 2 bits each
    // 2 rolls give 1 bit each
    // Average (4*2 + 2*1) / 6 = 1.66 bits per roll without bias
    "base 6 (dice)": {
        "0": "00", // equivalent to 0 in base 6
        "1": "01",
        "2": "10",
        "3": "11",
        "4": "0",
        "5": "1",
    },

    // log2(10) = 3.321928 bits per digit, with bias
    // 8 digits give 3 bits each
    // 2 digits give 1 bit each
    // Average (8*3 + 2*1) / 10 = 2.6 bits per digit without bias
    "base 10": {
        "0": "000",
        "1": "001",
        "2": "010",
        "3": "011",
        "4": "100",
        "5": "101",
        "6": "110",
        "7": "111",
        "8": "0",
        "9": "1",
    },

    "hexadecimal": {
        "0": "0000",
        "1": "0001",
        "2": "0010",
        "3": "0011",
        "4": "0100",
        "5": "0101",
        "6": "0110",
        "7": "0111",
        "8": "1000",
        "9": "1001",
        "a": "1010",
        "b": "1011",
        "c": "1100",
        "d": "1101",
        "e": "1110",
        "f": "1111",
    },

    // log2(52) = 5.7004 bits per card, with bias
    // 32 cards give 5 bits each
    // 16 cards give 4 bits each
    // 4 cards give 2 bits each
    // Average (32*5 + 16*4 + 4*2) / 52 = 4.46 bits per card without bias
    "card": {
        "ac": "00000",
        "2c": "00001",
        "3c": "00010",
        "4c": "00011",
        "5c": "00100",
        "6c": "00101",
        "7c": "00110",
        "8c": "00111",
        "9c": "01000",
        "tc": "01001",
        "jc": "01010",
        "qc": "01011",
        "kc": "01100",
        "ad": "01101",
        "2d": "01110",
        "3d": "01111",
        "4d": "10000",
        "5d": "10001",
        "6d": "10010",
        "7d": "10011",
        "8d": "10100",
        "9d": "10101",
        "td": "10110",
        "jd": "10111",
        "qd": "11000",
        "kd": "11001",
        "ah": "11010",
        "2h": "11011",
        "3h": "11100",
        "4h": "11101",
        "5h": "11110",
        "6h": "11111",
        "7h": "0000",
        "8h": "0001",
        "9h": "0010",
        "th": "0011",
        "jh": "0100",
        "qh": "0101",
        "kh": "0110",
        "as": "0111",
        "2s": "1000",
        "3s": "1001",
        "4s": "1010",
        "5s": "1011",
        "6s": "1100",
        "7s": "1101",
        "8s": "1110",
        "9s": "1111",
        "ts": "00",
        "js": "01",
        "qs": "10",
        "ks": "11",
    },

    }

    // matchers returns an array of the matched events for each type of entropy.
    // eg
    // matchers.binary("010") returns ["0", "1", "0"]
    // matchers.binary("a10") returns ["1", "0"]
    // matchers.hex("a10") returns ["a", "1", "0"]
    var matchers = {
        binary: function(str) {
            return str.match(/[0-1]/gi) || [];
        },
        base6: function(str) {
            return str.match(/[0-5]/gi) || [];
        },
        dice: function(str) {
            return str.match(/[1-6]/gi) || []; // ie dice numbers
        },
        base10: function(str) {
            return str.match(/[0-9]/gi) || [];
        },
        base64: function(str) {
            return str.match(/[A-Za-z0-9+\/=]/gi) || [];
        },
        base91: function(str) {
            return str.match(/[A-Za-z0-9!#$%&()*+,\.\/:;<=>?@\[\]\^_`{|}~"]/gi) || [];
        },
        hex: function(str) {
            return str.match(/[0-9A-F]/gi) || [];
        },
        card: function(str) {
            // Format is NumberSuit, eg
            // AH ace of hearts
            // 8C eight of clubs
            // TD ten of diamonds
            // JS jack of spades
            // QH queen of hearts
            // KC king of clubs
            return str.match(/([A2-9TJQK][CDHS])/gi) || [];
        }
    }

    this.fromString = function(rawEntropyStr, baseStr) {
        // Find type of entropy being used (binary, hex, dice etc)
        var base = getBase(rawEntropyStr, baseStr);
        // Convert dice to base6 entropy (ie 1-6 to 0-5)
        // This is done by changing all 6s to 0s
        if (base.str == "dice") {
            var newEvents = [];
            for (var i=0; i<base.events.length; i++) {
                var c = base.events[i];
                if ("12345".indexOf(c) > -1) {
                    newEvents[i] = base.events[i];
                }
                else {
                    newEvents[i] = "0";
                }
            }
            base.str = "base 6 (dice)";
            base.events = newEvents;
            base.matcher = matchers.base6;
        }
        // Detect empty entropy
        if (base.events.length == 0) {
            return {
                binaryStr: "",
                cleanStr: "",
                cleanHtml: "",
                base: base,
            };
        }
        var entropyClean = base.events.join("");
        // Convert entropy events to binary
        var entropyBin = '';
        if (base.toBin) {
            entropyBin = base.toBin(entropyClean);
        } else {
            entropyBin = base.events.map(function(e) {
                return eventBits[base.str][e.toLowerCase()];
            }).join("");
        }
        // Get average bits per event
        // which may be adjusted for bias if log2(base) is fractional
        var bitsPerEvent = base.bitsPerEvent;
        // Supply a 'filtered' entropy string for display purposes
        var entropyHtml = base.events.join("");
        if (base.asInt == 52) {
            entropyClean = base.events.join(" ").toUpperCase();
            entropyClean = entropyClean.replace(/C/g, "\u2663");
            entropyClean = entropyClean.replace(/D/g, "\u2666");
            entropyClean = entropyClean.replace(/H/g, "\u2665");
            entropyClean = entropyClean.replace(/S/g, "\u2660");
            entropyHtml = base.events.join(" ").toUpperCase();
            entropyHtml = entropyHtml.replace(/C/g, "<span class='card-suit club'>\u2663</span>");
            entropyHtml = entropyHtml.replace(/D/g, "<span class='card-suit diamond'>\u2666</span>");
            entropyHtml = entropyHtml.replace(/H/g, "<span class='card-suit heart'>\u2665</span>");
            entropyHtml = entropyHtml.replace(/S/g, "<span class='card-suit spade'>\u2660</span>");
        }
        // Return the result
        var e = {
            binaryStr: entropyBin,
            cleanStr: entropyClean,
            cleanHtml: entropyHtml,
            bitsPerEvent: bitsPerEvent,
            base: base,
        }
        return e;
    }

    function getBase(str, baseStr) {
        // Need to get the lowest base for the supplied entropy.
        // This prevents interpreting, say, dice rolls as hexadecimal.
        var binaryMatches = matchers.binary(str);
        var hexMatches = matchers.hex(str);
        var autodetect = baseStr === undefined;
        // Find the lowest base that can be used, whilst ignoring any irrelevant chars
        if ((binaryMatches.length == hexMatches.length && hexMatches.length > 0 && autodetect) || baseStr === "binary") {
            var ints = binaryMatches.map(function(i) { return parseInt(i, 2) });
            return {
                ints: ints,
                events: binaryMatches,
                matcher: matchers.binary,
                asInt: 2,
                bitsPerEvent: 1,
                str: "binary",
            }
        }
        var cardMatches = matchers.card(str);
        if ((cardMatches.length >= hexMatches.length / 2 && autodetect) || baseStr === "card") {
            return {
                ints: ints,
                events: cardMatches,
                matcher: matchers.card,
                asInt: 52,
                bitsPerEvent: (32*5 + 16*4 + 4*2) / 52, // see cardBits
                str: "card",
            }
        }
        var diceMatches = matchers.dice(str);
        if ((diceMatches.length == hexMatches.length && hexMatches.length > 0 && autodetect) || baseStr === "dice") {
            var ints = diceMatches.map(function(i) { return parseInt(i) });
            return {
                ints: ints,
                events: diceMatches,
                matcher: matchers.dice,
                asInt: 6,
                bitsPerEvent: (4*2 + 2*1) / 6, // see diceBits
                str: "dice",
            }
        }
        var base6Matches = matchers.base6(str);
        if ((base6Matches.length == hexMatches.length && hexMatches.length > 0 && autodetect) || baseStr === "base 6") {
            var ints = base6Matches.map(function(i) { return parseInt(i) });
            return {
                ints: ints,
                events: base6Matches,
                matcher: matchers.base6,
                asInt: 6,
                bitsPerEvent: (4*2 + 2*1) / 6, // see diceBits
                str: "base 6",
            }
        }
        var base10Matches = matchers.base10(str);
        if ((base10Matches.length == hexMatches.length && hexMatches.length > 0 && autodetect) || baseStr === "base 10") {
            var ints = base10Matches.map(function(i) { return parseInt(i) });
            return {
                ints: ints,
                events: base10Matches,
                matcher: matchers.base10,
                asInt: 10,
                bitsPerEvent: (8*3 + 2*1) / 10, // see b10Bits
                str: "base 10",
            }
        }
        var base64Matches = matchers.base64(str);
        var base91Matches = matchers.base91(str);
        if (baseStr === "base 64" || (base64Matches.length > hexMatches.length && base91Matches.length <= base64Matches.length && autodetect)) {
            var ints = base64Matches.map(function(i) { return parseInt(i) });
            return {
                ints: ints,
                events: base64Matches,
                matcher: matchers.base64,
                asInt: 64,
                bitsPerEvent: 6,
                str: "base 64",
                toBin: (entropyClean) => {
                    var entropyBin = atob(entropyClean);
                    return entropyBin.split('').map(function (ch) {
                        return ch.charCodeAt(0).toString(2).padStart(8, 0);
                    }).join('');
                }
            }
        }
        if (baseStr === "base 91" || (base91Matches.length > hexMatches.length && autodetect)) {
            var ints = base91Matches.map(function(i) { return parseInt(i) });
            return {
                ints: ints,
                events: base91Matches,
                matcher: matchers.base91,
                asInt: 91,
                bitsPerEvent: 13 / (16/8),
                str: "base 91",
                toBin: (entropyClean) => {
                    var entropyBin = base91.decode(entropyClean, 'raw');
                    return entropyBin.map(function (ch) {
                        return (ch >>> 0).toString(2).padStart(8, 0);
                    }).join('');
                }
            }
        }
        // hex:
        var ints = hexMatches.map(function(i) { return parseInt(i, 16) });
        return {
            ints: ints,
            events: hexMatches,
            matcher: matchers.hex,
            asInt: 16,
            bitsPerEvent: 4,
            str: "hexadecimal",
        }
    }

})();
