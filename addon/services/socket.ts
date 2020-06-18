import Service from '@ember/service';
import Evented from '@ember/object/evented';
import { computed } from '@ember/object';
import { later, cancel } from '@ember/runloop';
import { A } from '@ember/array';
import safeInjectService from '../macros/safe-inject-service';
import Configuration from './../configuration';
import FastbootService from 'ember-cli-fastboot/services/fastboot';
import SessionService from 'ember-simple-auth/services/session';

export default class Socket extends Service.extend(Evented) {
    @safeInjectService('fastboot') fastboot!: FastbootService;
    @safeInjectService('fastboot') session!: SessionService;

    subscriptions = {};
    baseURL = Configuration.baseURL;
    requiresAuth = Configuration.requiresAuth;
    debug = Configuration.debug;
    reconnectDelaySteps = A(Configuration.reconnectDelaySteps);

    reconnectDelayStep = 0;
    showDisconnectAtStep = 4;
    reconnectOnDate = null;
    isConnecting = false;
    lostConnection = false;

    @computed('reconnectDelayStep', 'showDisconnectAtStep')
    get showDisconnect() {
        return this.reconnectDelayStep >= this.showDisconnectAtStep;
    }

    @computed('baseURL', 'requiresAuth', 'session.data.authenticated.access_token')
    get host() {
        let host = this.baseURL;
        const token = this.session.data?.authenticated.access_token;
        const requiresAuth = this.requiresAuth;
        if (requiresAuth && token) {
            host += `?access_token=${token}`;
        }

        return host;
    }

    connect() {
        if (!this.fastboot.isFastBoot) {
            return new Promise((resolve, reject) => {
                //dont attempt to connect if already connected
                //or in the process of connecting
                if (this.client.connected) {
                    return resolve(this.client);
                }

                if (this.isConnecting) {
                    return reject();
                }

                const client = Stomp.over(() => {
                    return new SockJS(get(this, 'host'));
                });

                //handling implementation of auto-reconnect in the app (to support event notifications)
                client.reconnect_delay = 0;

                //allow console log debug output to be disabled
                if (!this.debug) {
                    client.debug = null;
                }

                cancel(this.reconnectTimer);
                this.reconnectOnDate = null;
                this.isConnecting = null;
                this.client = client;

                client.connect(
                    {},
                    () => {
                        this.trigger('connected');
                        this.lostConnection = false;
                        this.isConnecting = false;
                        this.reconnectDelayStep = 0;

                        return resolve(client);
                    },
                    (error) => {
                        const reconnectStep = this.reconnectDelayStep;
                        const numSteps = this.reconnectDelaySteps.length;
                        //keep increasing the reconnect delay, until the max delay is reached
                        const reconnectDelayStep = reconnectStep === numSteps - 1 ? reconnectStep : reconnectStep + 1;
                        this.trigger('disconnected', error);
                        this.scheduleReconnect();
                        this.lostConnection = true;
                        this.isConnecting = false;
                        this.reconnectDelayStep = reconnectDelayStep;

                        return reject(error);
                    }
                );
            });
        }
    }

    async reconnect() {
        const result = await this.connect();
        //attempt to restore existing subscriptions
        const subscriptions = this.subscriptions;
        const channels = Object.keys(subscriptions);
        channels.forEach((channel) => this.subscribe(channel, subscriptions[`${channel}.callback`]));
        return result;
    }

    scheduleReconnect() {
        cancel(this.reconnectTimer);
        const delay = this.reconnectDelaySteps.objectAt(this.reconnectDelayStep) ?? 0;
        const reconnectTimer = later(this, this.reconnect, delay);
        const reconnectOnDate = new Date();
        reconnectOnDate.setTime(new Date().getTime() + delay);
        this.reconnectOnDate = reconnectOnDate;
        this.reconnectTimer = reconnectTimer;
    }

    subscribe(channel, callback) {
        if (this.client.connected) {
            let subscription = this.client.subscribe(channel, callback);
            this[`subscriptions.${channel}`] = { subscription, callback };
            return subscription;
        }
    }

    unsubscribe(channel) {
        if (this.client.connected) {
            const subscriptions = this.subscriptions;
            const sub = subscriptions.channel;
            if (sub) {
                this.client.unsubscribe(sub.subscription.id);
                sub.unsubscribe();
                delete subscriptions[channel];
            }
        }
    }
}
