'use strict';

require('@jymfony/autoloader');

var fs = require('fs');
// var bench = require('bench');
// var nunjucks = require('nunjucks');

var src = fs.readFileSync('case.html', 'utf-8');

// var oldEnv = new nunjucks.Environment(null);
// var oldTmpl = new nunjucks.Template(src, oldEnv, null, null, true);
var env = new Kumis.Environment();
var tmpl = new Kumis.Template(src, env, null, true);

var ctx = {
    items: [
        {
            current: true,
            name: 'James'
        },
        {
            name: 'Foo',
            url: 'http://example.com'
        },
        {
            name: 'Foo',
            url: 'http://example.com'
        },
        {
            name: 'Foo',
            url: 'http://example.com'
        },
        {
            name: 'Foo',
            url: 'http://example.com'
        },
        {
            name: 'Foo',
            url: 'http://example.com'
        },
        {
            name: 'Foo',
            url: 'http://example.com'
        },
        {
            name: 'Foo',
            url: 'http://example.com'
        },
        {
            name: 'Foo',
            url: 'http://example.com'
        },
        {
            name: 'Foo',
            url: 'http://example.com'
        },
        {
            name: 'Foo',
            url: 'http://example.com'
        },
        {
            name: 'Foo',
            url: 'http://example.com'
        }
    ]
};

exports.time = 1000;
exports.compareCount = 8;

// exports.compare = {
//     'nunjucks': (done) => {
//         oldTmpl.render(ctx, done);
//     },
//
//     'kumis': async (done) => {
//         await tmpl.render(ctx);
//         done();
//     }
// };

var start = Date.now();

(async () => {
    for (var i = 0; i < 100; i++) {
        // oldTmpl.render(ctx);
        await tmpl.render(ctx);
    }

    console.log(Date.now() - start);
})();

// bench.runMain();
