import EmberObject from '@ember/object';
import ApplicationControllerMixinMixin from '@gavant/ember-websockets/mixins/application-controller-mixin';
import { module, test } from 'qunit';

module('Unit | Mixin | application-controller-mixin', function() {
  // Replace this with your real tests.
  test('it works', function (assert) {
    let ApplicationControllerMixinObject = EmberObject.extend(ApplicationControllerMixinMixin);
    let subject = ApplicationControllerMixinObject.create();
    assert.ok(subject);
  });
});
