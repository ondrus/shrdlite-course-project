var Parser;
(function (Parser) {
    function parse(input) {
        var nearleyParser = new nearley.Parser(grammar.ParserRules, grammar.ParserStart);
        var parsestr = input.toLowerCase().replace(/\W/g, "");
        try {
            var results = nearleyParser.feed(parsestr).results;
        }
        catch (err) {
            if ('offset' in err) {
                throw new Error('Parsing failed after ' + err.offset + ' characters');
            }
            else {
                throw err;
            }
        }
        if (!results.length) {
            throw new Error('Parsing failed, incomplete input');
        }
        return results.map(function (res) {
            return { input: input, parse: clone(res) };
        });
    }
    Parser.parse = parse;
    function stringify(result) {
        return JSON.stringify(result.parse);
    }
    Parser.stringify = stringify;
    function clone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }
})(Parser || (Parser = {}));
if (typeof require !== 'undefined') {
    var nearley = require('./lib/nearley.js');
    var grammar = require('./grammar.js');
}
