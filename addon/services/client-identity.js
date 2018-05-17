import Service from '@ember/service';
import { get, getWithDefault, computed } from '@ember/object';
import ENV from './../configuration';

export default Service.extend({
    uuidHeaderName: getWithDefault(ENV, 'websockets.clientUUIDHeader', 'x-client-uuid'),

    uuid: computed(function() {
        return this.generateUUID();
    }),

    uuidHeader: computed('uuid', 'uuidHeaderName', function() {
        const uuid = get(this, 'uuid');
        const headerName = get(this, 'uuidHeaderName');
        return {[headerName]: uuid};
    }),

    generateUUID() {
        //start with user agent, if available
        let str = window ? get(window, 'navigator.userAgent') : '';
        //millisecond timestamp of the current time
        str += new Date().getTime();
        //random number salt
        str += Math.random();

        return this.hashCode(str);
    },

    //lovingly stolen from https://github.com/ampproject/amphtml/blob/master/src/string.js#L121
    //generates a (non-cryptographically secure) 32-bit hash code similar to Java's String.hashCode()
    hashCode(str) {
        const length = str.length;
        let hash = 5381;
        for (let i = 0; i < length; i++) {
            hash = hash * 33 ^ str.charCodeAt(i);
        }
        // Convert from 32-bit signed to unsigned.
        return String(hash >>> 0);
    }
});
