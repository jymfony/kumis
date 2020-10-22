#!/usr/bin/env node

require('@jymfony/autoloader');

const Runner = Jymfony.Component.Testing.Framework.Runner;
const Debug = Jymfony.Component.Debug.Debug;
Debug.enable();

const [ , , ...argv ] = [ ...process.argv ];
if (0 === argv.length) {
    argv.push('tests/**/*Test.js');
}

process.argv = argv;

new Runner().run();
