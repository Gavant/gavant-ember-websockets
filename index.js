/* eslint-env node */
'use strict';

const Funnel = require('broccoli-funnel');
const mergeTrees = require('broccoli-merge-trees');
const map = require('broccoli-stew').map;

module.exports = {
  name: 'gavant-ember-websockets',

  treeForVendor(defaultTree) {
        let trees = [];

        if(defaultTree) {
            trees.push(defaultTree);
        }

        let vendorTree = new Funnel(`vendor`, {
            files: ['sock.js', 'stomp.js'],
            destDir: 'sock'
        });

        vendorTree = map(vendorTree, (content) => `if (typeof FastBoot === 'undefined') { ${content} }`);
        trees.push(vendorTree);

        return new mergeTrees(trees);
    },

    included(app) {
        this._super.included.apply(this, arguments);
        // these files will be loaded in FastBoot but will not be eval'd
        app.import('vendor/sock/sock.js');
        app.import('vendor/sock/stomp.js');
    }
};
