module.exports = function(error) {
    assert.equal(error.message.search('revert'), 43, 'Invalid opcode error must be returned');
}