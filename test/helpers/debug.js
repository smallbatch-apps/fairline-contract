module.exports = {
    eventString: async function(tx){
        console.log('String: ', web3.toAscii(tx.logs[0].args.output));
    },
    eventInteger: async function(tx){
        console.log('Number: ', +tx.logs[0].args.output);
    },
    eventStruct: async function(tx){
        console.log(tx.logs[0].args.output);
    },
    eventLog: async function(tx, key, type = 'string', index = 0){
        if (type === 'string') {
            return web3.toAscii(tx.logs[index].args[key]).replace(/\u0000/g, '');
        }
        if (type === 'integer') {
            return +tx.logs[index].args[key];
        }
    },
    cleanString: function(value){
        return web3.toAscii(value).replace(/\u0000/g, '');
    },
    cleanInteger: function(value){
        return +value;
    },
    eventContains: async function(tx, eventName, key, type = 'string'){
        let logs = tx.logs.filter(({event}) => event === eventName)
            .map(({args}) => {
                console.log(args);
            });
    },
};