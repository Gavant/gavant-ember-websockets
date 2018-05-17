import Mixin from '@ember/object/mixin';
import { get, set } from '@ember/object';
import { inject as service } from '@ember/service';
import { resolve } from 'rsvp';
import GlobalSocketEventMixin from './socket-events/global';

export default Mixin.create(GlobalSocketEventMixin, {
    socket: service(),

    async beforeModel(transition) {
        this._super(...arguments);
        //if the websocket connection requires an authenticated session,
        //dont connect unless the user is logged in
        const requiresAuth = get(this, 'socket.requiresAuth');
        //allow the app's websocket connection to be conditionally turned off when the app is loaded
        //this is useful in non-browser rendering environments when a socket connection is not desired
        const enableWebsockets = get(transition, 'queryParams.websockets') !== 'false';

        //store the websockets query param value so we can check it later
        // in sessionAuthenticated() if the user is not yet logged in
        set(this, 'enableWebsockets', enableWebsockets);

        if(enableWebsockets && (!requiresAuth || get(this, 'session.isAuthenticated'))) {
            try {
                await get(this, 'socket').connect();
                //immediately establish a subscription to the global channel
                this.listenForGlobalEvents();
            } catch(error) {
                //swallow socket connection errors so that the app can still load
                return resolve();
            }
        }
    },

    //establishes a websocket connection upon login, if websockets require an authenticated session
    async sessionAuthenticated() {
        this._super(...arguments);

        const requiresAuth = get(this, 'socket.requiresAuth');
        const enableWebsockets = get(this, 'enableWebsockets');

        if(enableWebsockets && requiresAuth) {
            try {
                await get(this, 'socket').connect();
                //immediately establish a subscription to the global channel
                this.listenForGlobalEvents();
            } catch(error) {
                //swallow socket connection errors so that the app can still load
                return resolve();
            }
        }
    }
});
