import Service from '@ember/service';
import { get, getWithDefault, set, setProperties, computed } from '@ember/object';
import { tryInvoke } from '@ember/utils';
import { inject as service } from '@ember/service';
import { later, cancel } from '@ember/runloop';
import { Promise } from 'rsvp';
import safeInjectService from '../macros/safe-inject-service';
import ENV from './../configuration';
// import moment from 'moment';


export default Service.extend({
    session: safeInjectService('session'),
    fastboot: safeInjectService('fastboot'),
    eventBus: service(),

    //configs
    requiresAuth: getWithDefault(ENV, 'websockets.requiresAuth', true),
    reconnectDelaySteps: getWithDefault(ENV, 'websockets.reconnectDelaySteps', [1000, 2000, 5000, 10000, 30000, 60000]),

    reconnectDelayStep: 0,
    showDisconnectAtStep: 4,
    reconnectOnDate: null,
    isConnecting: false,
    lostConnection: false,

    showDisconnect: computed('reconnectDelayStep', 'showDisconnectAtStep', function() {
        return get(this, 'reconnectDelayStep') >= get(this, 'showDisconnectAtStep')
    }),

    init() {
        this._super(...arguments);
        set(this, 'subscriptions', {});
    },

    host: computed('session.data.authenticated.access_token', function() {
        const token = get(this, 'session.data.authenticated.access_token');
        //TODO make a config var
        return `${ENV.RESTAPI}/ws?access_token=${token}`;
    }),

    connect() {
        const requiresAuth = get(this, 'socket.requiresAuth');
        if(!get(this, 'fastboot.isFastBoot') && (!requiresAuth || get(this, 'session.isAuthenticated'))) {
            return new Promise((resolve, reject) => {
                //dont attempt to connect if already connected
                //or in the process of connecting
                if(get(this, 'client.connected')) {
                    return resolve(get(this, 'client'));
                }

                if(get(this, 'isConnecting')) {
                    return reject();
                }

                const client = Stomp.over(() => {
                    return new SockJS(get(this, 'host'));
                });
                //handling implementation of auto-reconnect in the app (to support event notifications)
                client.reconnect_delay = 0;
                cancel(get(this, 'reconnectTimer'));
                setProperties(this, {
                    reconnectOnDate: null,
                    isConnecting: true,
                    client
                });

                client.connect({},
                    () => {
                        get(this, 'eventBus').publish('socketConnected');
                        set(this, 'lostConnection', false);
                        setProperties(this, {
                            lostConnection: false,
                            isConnecting: false,
                            reconnectDelayStep: 0
                        });

                        return resolve(client);
                    },
                    (error) => {
                        const reconnectStep = get(this, 'reconnectDelayStep');
                        const numSteps = get(this, 'reconnectDelaySteps.length');
                        //keep increasing the reconnect delay, until the max delay is reached
                        const reconnectDelayStep = (reconnectStep === numSteps - 1) ? reconnectStep : (reconnectStep + 1);
                        get(this, 'eventBus').publish('socketDisconnected', error);
                        this.scheduleReconnect();
                        setProperties(this, {
                            lostConnection: true,
                            isConnecting: false,
                            reconnectDelayStep
                        });

                        return reject(error);
                    }
                );
            });
        }
    },

    async reconnect() {
        let result = await this.connect();
        //attempt to restore existing subscriptions
        let subscriptions = get(this, 'subscriptions');
        for(let channel in subscriptions) {
            if(subscriptions.hasOwnProperty(channel)) {
                this.subscribe(channel, subscriptions[channel].callback);
            }
        }

        return result;
    },

    scheduleReconnect() {
        cancel(get(this, 'reconnectTimer'));
        const delay = get(this, 'reconnectDelaySteps').objectAt(get(this, 'reconnectDelayStep'));
        const reconnectTimer = later(this, 'reconnect', delay);
        //TODO use a native Date().getTime()
        const reconnectOnDate = moment().add(delay, 'ms');
        setProperties(this, {
            reconnectOnDate,
            reconnectTimer
        });
    },

    subscribe(channel, callback) {
        if(get(this, 'client.connected')) {
            let subscription = get(this, 'client').subscribe(channel, callback);
            set(this, `subscriptions.${channel}`, {subscription, callback});
            return subscription;
        }
    },

    unsubscribe(channel) {
        if(get(this, 'client.connected')) {
            const subscriptions = get(this, 'subscriptions');
            const sub = get(subscriptions, channel);
            if(sub) {
                get(this, 'client').unsubscribe(get(sub, 'subscription.id'));
                tryInvoke(sub, 'unsubscribe');
                delete subscriptions[channel];
            }
        }
    }
});
