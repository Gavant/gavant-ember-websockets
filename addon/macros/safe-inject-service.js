import { computed } from '@ember/object';
import { getOwner } from '@ember/application';

export default function safeInjectService(service) {
    return computed(service, function() {
        return getOwner(this).lookup(`service:${service}`);
    });
}
