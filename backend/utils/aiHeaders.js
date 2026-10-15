// Our backend proves itself to the AI service with a shared key. It is sent only when the key is
// configured, so everything keeps working while the AI service's authentication is still off.
const aiHeaders = () => (process.env.AI_SERVICE_KEY ? { "x-service-key": process.env.AI_SERVICE_KEY } : {});

module.exports = { aiHeaders };
