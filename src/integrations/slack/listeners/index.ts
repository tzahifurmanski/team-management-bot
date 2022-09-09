const events = require('./events');

module.exports.registerListeners = (app : any) => {
    events.register(app);
};
