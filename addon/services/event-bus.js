import Service from '@ember/service';
import Evented from '@ember/object/evented';

export default Service.extend(Evented, {
    publish() {
        return this.trigger.apply(this, arguments);
    },

    subscribe() {
        return this.on.apply(this, arguments);
    },

    subscribeOnce() {
        return this.one.apply(this, arguments);
    },

    unsubscribe() {
        return this.off.apply(this, arguments);
    }
});
