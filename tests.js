#!/usr/bin/env node

require('@jymfony/autoloader');

const Debug = Jymfony.Component.Debug.Debug;
Debug.enable();

const Namespace = Jymfony.Component.Autoloader.Namespace;
global.Tests = new Namespace(__jymfony.autoload, 'Tests', []);
global.Tests.Fixtures = new Namespace(__jymfony.autoload, 'Tests.Fixtures', [ __dirname + '/tests/fixtures' ]);

require('mocha/bin/_mocha');
