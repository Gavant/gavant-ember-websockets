/* eslint-env node */
'use strict';

const Funnel = require('broccoli-funnel');
const mergeTrees = require('broccoli-merge-trees');
const map = require('broccoli-stew').map;

module.exports = {
    name: 'gavant-ember-websockets',

    treeForVendor() {
        let defaultTree = this._super.treeForVendor.apply(this, arguments);

        let vendorTree = new Funnel(defaultTree, {
            destDir: 'websockets',
            files: ['sock.js', 'stomp.js']
        });

        vendorTree = map(vendorTree, (content) => `if (typeof FastBoot === 'undefined') { ${content} }`);

        return new mergeTrees([defaultTree, vendorTree]);
    },

    included(app) {
        this._super.included.apply(this, arguments);
        // these files will be loaded in FastBoot but will not be eval'd
        app.import('vendor/websockets/sock.js');
        app.import('vendor/websockets/stomp.js');
    }
};
