import Mixin from '@ember/object/mixin';
import { get, getWithDefault } from '@ember/object';
import { inject as service } from '@ember/service';
import { bind } from '@ember/runloop';
import { reject } from 'rsvp';
import ENV from './../configuration';


export default Mixin.create({
    socket: service(),
    globalChannelName: getWithDefault(ENV, 'websockets.globalChannel', '/topic/global'),

    listenForGlobalEvents() {
        const channel = get(this, 'globalChannelName');
        const listener = bind(this, 'onGlobalEvent');
        if(channel) {
            get(this, 'socket').subscribe(channel, listener);
        }
    },

    stopListeningForGlobalEvents() {
        get(this, 'socket').unsubscribe(get(this, 'globalChannelName'));
    },

    onGlobalEvent(message) {
        try {
            const event = JSON.parse(message.body);
            return event;
        } catch(error) {
            return reject(error);
        }
    }
});
