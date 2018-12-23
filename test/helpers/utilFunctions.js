const Web3Import = require('web3');
const web3 = new Web3Import();

const inputType = (value, type) => {
  switch(type) {
    case 'bytes32': return web3.utils.utf8ToHex(value);
    case 'timestamp':
      if (value instanceof Date) {
        value = dateToSeconds(value);
      }
      return value;
    default: return value;
  }
}

const dateToSeconds = dateObject => {
  return Math.floor(dateObject.getTime() / 1000);
}

const returnType = (value, type) => {
  if (type.includes('uint')) {
    type = 'uint';
  }

  switch(type) {
    case 'bytes32': return web3.utils.hexToUtf8(value);
    case 'uint': return Number(value);
    case 'timestamp': return new Date(value * 1000);
    default: return value;
  }
}