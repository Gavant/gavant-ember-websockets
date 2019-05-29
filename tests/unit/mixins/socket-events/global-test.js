import EmberObject from '@ember/object';
import SocketEventsGlobalMixin from '@gavant/ember-websockets/mixins/socket-events/global';
import { module, test } from 'qunit';

module('Unit | Mixin | socket-events/global', function() {
  // Replace this with your real tests.
  test('it works', function (assert) {
    let SocketEventsGlobalObject = EmberObject.extend(SocketEventsGlobalMixin);
    let subject = SocketEventsGlobalObject.create();
    assert.ok(subject);
  });
});
