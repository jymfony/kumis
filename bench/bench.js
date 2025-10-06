import * as fs from 'fs';

const  src = fs.readFileSync(__dirname + '/case.html', 'utf-8');
const env = new Kumis.Environment();
const tmpl = new Kumis.Template(src, env, null, true);

const ctx = {
    header: 'Item',
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

(async () => {
    await tmpl.render(ctx);

    const start = Date.now();
    for (let i = 0; i < 100; i++) {
        await tmpl.render(ctx);
    }

    console.log(Date.now() - start);
})();
