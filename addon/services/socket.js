import Service from '@ember/service';
import { get, set, setProperties, computed } from '@ember/object';
import { tryInvoke } from '@ember/utils';
import { inject as service } from '@ember/service';
import { later, cancel } from '@ember/runloop';
import { A } from '@ember/array';
import { Promise } from 'rsvp';
import safeInjectService from '../macros/safe-inject-service';
import Configuration from './../configuration';


export default Service.extend({
    session: safeInjectService('session'),
    fastboot: safeInjectService('fastboot'),
    eventBus: service(),

    //configs
    baseURL: Configuration.baseURL,
    requiresAuth: Configuration.requiresAuth,
    debug: Configuration.debug,
    reconnectDelaySteps: A(Configuration.reconnectDelaySteps),

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

    host: computed('hostUrl', 'requiresAuth', 'session.data.authenticated.access_token', function() {
        let host = get(this, 'hostUrl');
        const token = get(this, 'session.data.authenticated.access_token');
        const requiresAuth = get(this, 'requiresAuth');
        if(requiresAuth && token) {
            host += `?access_token=${token}`;
        }

        return host;
    }),

    connect() {
        if(!get(this, 'fastboot.isFastBoot')) {
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

                //allow console log debug output to be disabled
                if(!get(this, 'debug')) {
                    client.debug = null;
                }

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
        const reconnectOnDate = new Date();
        reconnectOnDate.setTime(new Date().getTime() + delay);
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
