const advanceTime = (time) => {
    return new Promise((resolve, reject) => {
        web3.currentProvider.send({
            jsonrpc: '2.0',
            method: 'evm_increaseTime',
            params: [time],
            id: new Date().getTime()
        }, (err1) => {
            if (err1) return reject(err1);

            web3.currentProvider.send({
                jsonrpc: '2.0',
                method: 'evm_mine',
                id: new Date().getTime()
            }, (err2, res) => {
                if (err2) return reject(err2);
                return resolve(res);
            });
        });
    });
}


module.exports = {
    advanceTime
};