module.exports = function(error) {
    assert.equal(error.message.search('invalid opcode'), 43, 'Invalid opcode error must be returned');
}