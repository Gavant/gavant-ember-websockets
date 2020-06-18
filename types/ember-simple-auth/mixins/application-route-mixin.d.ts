declare module 'ember-simple-auth/mixins/application-route-mixin' {
    import EmberObject from '@ember/object';

    export default class ApplicationRouteMixin extends EmberObject {
        sessionAuthenticated(): void;
    }
}
