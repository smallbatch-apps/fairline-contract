export default class DebugEvents {

    constructor(contract){
        this.contract = contract;
        this.events = this.contractEvents();
    }

    zip(keys, values) {
        return keys.reduce((obj, k, i) => ({...obj, [k]: values[i] }), {});
    }

    contractEvents(){
        let eventDefinitions = {};
        let events = Object.entries(this.contract.events).map(([hash, event]) => {
            event.inputs.forEach(({indexed, name, type}) => {
                if (!eventDefinitions.hasOwnProperty(event.name)) {
                    eventDefinitions[event.name] = {};
                }
                eventDefinitions[event.name][name] = {type, indexed};
            });
        });
        return eventDefinitions;
    }

    getEvents(tx, eventName = false){
        let logs = tx.logs;

        if (eventName) {
            logs = logs.filter(({event}) => event === eventName);
        }
        
        return logs.map(({event, args}) => {
                let keys = Object.keys(args);
                let values = Object.values(args)
                    .map((value, index) => this.cleanValue(value, this.events[event][keys[index]].type));
                
                return Object.assign({event}, this.zip(keys, values));
            });
    }   

    cleanValue(value, type='bytes32'){
        if (type === 'bytes32') {
            return web3.toAscii(value).replace(/\u0000/g, '');
        } else if (type.includes('uint')) {
            return +value;
        }
        return value;
    }
}