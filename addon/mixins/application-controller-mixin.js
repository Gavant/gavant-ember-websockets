import Mixin from '@ember/object/mixin';

export default Mixin.create({
    //booting the app or logging in with ?websockets=false will disable the socket connection
    //this is useful in non-browser rendering environments when a socket connection is not desired
    queryParams: [{websockets: { type: 'boolean'}}],
    websockets: true
});
