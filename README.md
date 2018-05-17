gavant-ember-websockets
==============================================================================

Basic websockets support for ember applications, using sock.js and the STOMP messaging protocol via the stomp.js client.

Installation
------------------------------------------------------------------------------

```
ember install gavant-ember-websockets
```

Add the settings below (shown with default values) to your app's config/environment.js to configure the addon. At the very least, you will need to set the `websockets.host` value to point to an API endpoint URL.

```js
let ENV = {

    //other environment configs...

    websockets: {
        //REQUIRED - the endpoint url used to make the socket connection,
        //typically this is an endpoint on the app's main API host
        baseURL: '',
        //the name of the request header sent in all AJAX requests
        //that uniquely identify the originating browser/client
        clientUUIDHeader: 'x-client-uuid',
        //the global socket channel path for app-wide socket events
        //if there is no global channel, set this to false
        globalChannel: '/topic/global',
        //the name of the property in ember-data models that hold
        //the date the record was last modified. used by ModelSocketEventMixin
        //to determine if received model data should be pushed into the store
        //set to false to disable this behavior
        modelDateField: 'dateModified',
        //display verbose sock.js logs in the dev tools console
        debug: true,
        //user must have an authenticated session to connect
        requiresAuth: true,
        //the intervals at which successive reconnect attempts
        //are made when the socket is disconnected
        reconnectDelaySteps: [1000, 2000, 5000, 10000, 30000, 60000]
    }
}
```

Usage
------------------------------------------------------------------------------

### `Socket` Service

The primary service provided by the addon, it is used to make a websocket connection, and subscribe to socket channels.

```js
//Basic usage example
import Route from '@ember/routing/route';
import { inject } from '@ember/service';
import { get } from '@ember/object';
import { bind } from '@ember/runloop';

export default Route.extend({
    socket: service(),

    setupController() {
        this._super(...arguments);
        //setup a socket channel subscription when entering a route
        const listener = bind(this, 'onSocketEvent');
        get(this, 'socket').subscribe('/topic/some-socket-channel', listener);
    },

    resetController(controller, isExiting) {
        this._super(...arguments);

        if(isExiting) {
            //unsubscribe from the socket channel when leaving the route
            get(this, 'socket').unsubscribe('/topic/some-socket-channel');
        }
    },

    onSocketEvent(message) {
        try {
            //parse the socket event message body
            const body = JSON.parse(message.body);
            console.log(body);
        } catch(err) {

        }
    }
});
```

### `ClientIdentity` Service

Implements a mechanism for uniquely identifying every app instance/browser client, which can be sent in AJAX request headers to the API. The API can then return this UUID value in socket events, which the addon's `ModelSocketEventMixin` uses to ignore events that originated from the user that caused them.

The most common places in the app that need to be modified to add the UUID header are:

- **ember-data adapter**  
  In your application/adapter, define a `headers` ([docs](https://emberjs.com/api/ember-data/3.1/classes/DS.RESTAdapter/properties/headers?anchor=headers)) property that includes the client UUID header:  
  ```js
  export default RESTAdapter.extend({
      clientIdentity: service(),
      headers: readOnly('clientIdentity.uuidHeader'),
  });
  ```
- **ember-ajax service**  
  If your application uses an `ajax` service extended from the ember-ajax addon to do custom non ember-data AJAX requests (most apps do), you will need to modify the service to include the client UUID header:  
  ```js
  export default AjaxService.extend({
      clientIdentity: service(),

      //NOTE: example includes some other common headers,
      //e.g. Content-Type and authorization token from ember-simple-auth
      headers: computed('authorizationHeaders', function () {
          const headers = assign(
              {'Content-Type': 'application/vnd.api+json'},
              get(this, 'clientIdentity.uuidHeader'),
              get(this, 'authorizationHeaders')
          );

          return headers;
      })
  });
  ```
- **ember-simple-auth authenticator**  
  In a custom ember-simple-auth authenticator (e.g. for OAuth 2 authentication), you will need to override the `makeRequest()` method to be able to add custom headers:
  ```js
  export default Authenticator.extend({
      clientIdentity: service(),

      makeRequest(url, data, headers = {}) {
          assign(
              headers,
              get(this, 'clientIdentity.uuidHeader'),
              {'Content-Type': 'application/x-www-form-urlencoded'}
          );

          //rest of method implementation...
      }
  });
  ```

### `ApplicationRouteMixin`

This mixin should be applied to the `application/route`. It sets up the standard boilerplate logic for making a socket connection on app boot/login, and subscribing the the global events channel.

```js
import SocketsApplicationRouteMixin from 'gavant-ember-websockets/mixins/application-route-mixin';
```

### `ApplicationControllerMixin`

This mixin should be applied to the `application/controller`. It simply adds a `websockets` query param, which can be used to disable socket connections when visiting the app with `?websockets=false` in the URL.

```js
import SocketsApplicationControllerMixin from 'gavant-ember-websockets/mixins/application-controller-mixin';
```

### `GlobalSocketEventsMixin`

Subscribes to the global events channel. This is used by the `ApplicationRouteMixin` and generally should not need to be used directly.

```js
import GlobalSocketEventsMixin from 'gavant-ember-websockets/mixins/socket-events/global';
```

### `ModelSocketEventsMixin`

Implements common logic used for handling socket events which send changes to ember-data models. It expects socket events to follow a standard REST-like pattern to identify record create/update/delete events. Generally, you will use this in a Route in the following manner:

```js
import ModelSocketEventsMixin from 'gavant-ember-websockets/mixins/socket-events/model';

export default Route.extend(ModelSocketEventsMixin, {
    myChannelName: '/topic/my-channel-name',

    listenForEvents() {
        const channel = get(this, 'myChannelName');
        const listener = bind(this, 'onSocketEvent');
        get(this, 'socket').subscribe(channel, listener);
    },

    stopListeningForEvents() {
        get(this, 'socket').unsubscribe(get(this, 'myChannelName'));
    },

    onSocketEvent(message) {
        this.handleModelEvent(message, 'modelName');
    },

    afterModel() {
        this._super(...arguments);
        this.listenForEvents();
    },

    resetController(controller, isExiting) {
        this._super(...arguments);
        if(isExiting) {
            this.stopListeningForEvents();
        }
    }
});
```

Contributing
------------------------------------------------------------------------------

### Installation

* `git clone <repository-url>`
* `cd gavant-ember-websockets`
* `npm install`

### Linting

* `npm run lint:js`
* `npm run lint:js -- --fix`

### Running tests

* `ember test` – Runs the test suite on the current Ember version
* `ember test --server` – Runs the test suite in "watch mode"
* `ember try:each` – Runs the test suite against multiple Ember versions

### Running the dummy application

* `ember serve`
* Visit the dummy application at [http://localhost:4200](http://localhost:4200).

For more information on using ember-cli, visit [https://ember-cli.com/](https://ember-cli.com/).

License
------------------------------------------------------------------------------

This project is licensed under the [MIT License](LICENSE.md).
