import { get, getWithDefault, set } from '@ember/object';
import { typeOf, isEmpty } from '@ember/utils';
import { assert } from '@ember/debug';

//addon configuration loading/default values
//taken from https://github.com/simplabs/ember-simple-auth/blob/1.6.0/addon/configuration.js

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
    baseURL: DEFAULTS.baseURL,
    clientUUIDHeader: DEFAULTS.authenticationRoute,
    globalChannel: DEFAULTS.routeAfterAuthentication,
    modelDateField: DEFAULTS.routeIfAlreadyAuthenticated,
    debug: DEFAULTS.debug,
    requiresAuth: DEFAULTS.requiresAuth,
    reconnectDelaySteps: DEFAULTS.reconnectDelaySteps,

    load(config) {
        for(let property in this) {
            if(this.hasOwnProperty(property) && typeOf(this[property]) !== 'function') {
                set(this, property, getWithDefault(config, property, DEFAULTS[property]));
            }
        }

        //validate required configs are present
        assert(
            'A ENV.websockets.baseURL config must be provided for gavant-ember-websockets',
            !isEmpty(get(this, 'baseURL'))
        );
    }
};
