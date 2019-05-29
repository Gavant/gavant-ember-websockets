import EmberObject from '@ember/object';
import ApplicationRouteMixinMixin from '@gavant/ember-websockets/mixins/application-route-mixin';
import { module, test } from 'qunit';

module('Unit | Mixin | application-route-mixin', function() {
  // Replace this with your real tests.
  test('it works', function (assert) {
    let ApplicationRouteMixinObject = EmberObject.extend(ApplicationRouteMixinMixin);
    let subject = ApplicationRouteMixinObject.create();
    assert.ok(subject);
  });
});
