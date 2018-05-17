import { get, setProperties } from '@ember/object';
import { isEmpty } from '@ember/utils';
import { assign } from '@ember/polyfills';
import { assert } from '@ember/debug';

//addon configuration loading/default values
//inspired by https://github.com/simplabs/ember-simple-auth/blob/1.6.0/addon/configuration.js

const DEFAULTS = {
    baseURL: '',
    clientUUIDHeader: 'x-client-uuid',
    globalChannel: '/topic/global',
    modelDateField: 'dateModified',
    debug: true,
    requiresAuth: true,
    reconnectDelaySteps: [1000, 2000, 5000, 10000, 30000, 60000]
};

export default {
    load(config) {
        const configProps = assign({}, DEFAULTS, config);
        setProperties(this, configProps);
        this.validate();
    },

    validate() {
        assert(
            'An ENV.websockets.baseURL config must be provided for gavant-ember-websockets',
            !isEmpty(get(this, 'baseURL'))
        );
    }
};
