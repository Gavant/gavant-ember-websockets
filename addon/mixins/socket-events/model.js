import Mixin from '@ember/object/mixin';
import Ember from 'ember';
import moment from 'moment';

const {
    get,
    inject: { service },
    RSVP: { reject }
} = Ember;

export default Mixin.create({
    eventBus: service(),
    clientIdentity: service(),

    handleModelEvent(message, modelName) {
        try {
            const body = JSON.parse(message.body);
            const originUserId = `${get(body, 'originatingClientId')}`;

            //if the socket event orginated from a request this browser client sent, completely ignore it
            if(originUserId === get(this, 'clientIdentity.uuid')) {
                return reject();
            }

            const method = get(body, 'method');
            const modelJson = get(body, modelName);
            let existingModel = get(this, 'store').peekRecord(modelName, get(modelJson, 'id'));

            switch(method) {
                case 'POST':
                case 'PUT':
                    //only update the locally cached model if the received model is newer
                    if(!existingModel || moment(get(modelJson, 'dateModified')).isAfter(get(existingModel, 'dateModified'))) {
                        get(this, 'store').pushPayload(modelName, {[modelName]: modelJson});
                        //get the newly created ED model so it can be passed in the published event
                        if(!existingModel) {
                            existingModel = get(this, 'store').peekRecord(modelName, get(modelJson, 'id'));
                        }
                    }
                    break;
                case 'DELETE':
                    if(existingModel) {
                        get(this, 'store').unloadRecord(existingModel);
                    }
                    break;
            }

            get(this, 'eventBus').publish('websocketModelUpdate', method, modelName, modelJson, existingModel);
        } catch(error) {
            return reject(error);
        }
    }
});
