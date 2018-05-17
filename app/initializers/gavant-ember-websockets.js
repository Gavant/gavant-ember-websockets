import { getWithDefault } from '@ember/object';
import ENV from '../config/environment';
import Configuration from 'gavant-ember-websockets/configuration';

export default {
    name: 'gavant-ember-websockets',

    initialize() {
        const config = getWithDefault(ENV, 'websockets', {});
        Configuration.load(config);
    }
};
