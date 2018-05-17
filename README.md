gavant-ember-websockets
==============================================================================

Basic websockets support for ember applications, using sock.js and the STOMP messaging protocol via the stomp.js client.

Installation
------------------------------------------------------------------------------

```
ember install gavant-ember-websockets
```

[TODO - environment config options]

```js
let ENV = {
    //other environment configs...
    websockets: {
        //the endpoint url used to make the socket connection,
        //typically this is an endpoint on the app's main API host
        host: '',
        //display verbose sock.js logs in the dev tools console
        debug: true,
        //user must have an authenticated session to connect
        requiresAuth: true,
        //the intervals at which successive reconnect attempts
        //are made when the socket is disconnected
        reconnectDelaySteps: [1000, 2000, 5000, 10000, 30000, 60000],
        //the global socket channel path for app-wide socket events
        //if there is no global channel, set this to false
        globalChannel: '/topic/global',
        //the name of the request header sent in all AJAX requests
        //that uniquely identify the originating browser/client
        clientUUIDHeader: 'x-client-uuid',
        //the name of the property in ember-data models that hold
        //the date the record was last modified. used by ModelSocketEventMixin
        //to determine if received model data should be pushed into the store
        //set to false to disable this behavior
        modelDateField: 'dateModified'
    }
}
```

Usage
------------------------------------------------------------------------------

### `Socket` Service

[TODO - connect(), subscribe()/unsubscribe()]

### `ClientIdentity` Service

[TODO - adding to ember-data adapter, ajax service, authenticator headers]

[TODO - is there a better, more global way we can add a header to ALL ajax requests, regardless of source?]

### `ApplicationRouteMixin`

[TODO - socket connection, global events subscription]

### `ApplicationControllerMixin`

[TODO - websockets query param]

### `GlobalSocketEventMixin`

[TODO - brief mention, should be included in ApplicationRouteMixin]

### `ModelSocketEventMixin`

[TODO - using to handle standard ember-data model events]

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
