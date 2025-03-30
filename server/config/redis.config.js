const redis = require('redis');

const { REDIS_HOST, REDIS_PORT, REDIS_USERNAME, REDIS_PASSWORD } = process.env;

const client = redis.createClient({
    username: REDIS_USERNAME,
    password: REDIS_PASSWORD,
    socket: {
        host: REDIS_HOST,
        port: REDIS_PORT,
    },
});

client.on('connect', () => {
    console.log('Connected to Redis');
});


client.on('error', (err) => {
    console.error('Redis error:', err);
});


module.exports = client;