import EmberObject from '@ember/object';
import SocketEventsModelMixin from '@gavant/ember-websockets/mixins/socket-events/model';
import { module, test } from 'qunit';

module('Unit | Mixin | socket-events/model', function() {
  // Replace this with your real tests.
  test('it works', function (assert) {
    let SocketEventsModelObject = EmberObject.extend(SocketEventsModelMixin);
    let subject = SocketEventsModelObject.create();
    assert.ok(subject);
  });
});
