import Mixin from '@ember/object/mixin';
import { get, getWithDefault } from '@ember/object';
import { inject as service } from '@ember/service';
import { reject } from 'rsvp';
import ENV from './../configuration';

export default Mixin.create({
    socket: service(),
    clientIdentity: service(),
    eventBus: service(),
    modelDateField: getWithDefault(ENV, 'websockets.modelDateField', 'dateModified'),

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
            const dateField = get(this, 'modelDateField');
            let existingModel = get(this, 'store').peekRecord(modelName, get(modelJson, 'id'));

            switch(method) {
                case 'POST':
                case 'PUT': {
                    //only update the locally cached model if the received model is newer
                    let modelIsNewer = true;
                    if(dateField) {
                        const existingModelDate = get(existingModel, dateField);
                        const newModelDate = new Date(get(modelJson, dateField));
                        modelIsNewer = newModelDate >= existingModelDate;
                    }

                    if(!existingModel || modelIsNewer) {
                        get(this, 'store').pushPayload(modelName, {[modelName]: modelJson});
                        //get the newly created ED model so it can be passed in the published event
                        if(!existingModel) {
                            existingModel = get(this, 'store').peekRecord(modelName, get(modelJson, 'id'));
                        }
                    }
                    break;
                }
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
