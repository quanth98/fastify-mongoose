# Fastify plugin to expose API for Mongoose MongoDB models

[![npm package](https://nodei.co/npm/fastify-mongoose-multitenancy.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/fastify-mongoose-multitenancy)

## Installation

```bash
npm i fastify-mongoose-multitenancy -s
```

## Usage
```javascript
// User.model.js
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
    },
    age: {
        type: Number,
        required: true,
    },
});
module.exports = {
    userSchema
}
// app.js
const fastify = Fastify();
fastify.register(require("fastify-mongoose-multitenancy"), {
    // ** All options below are required.
    models: [{
        name: "users", // ** Name of model
        alias: "Users", // ** Alias for quick access to schema
        schema: userSchema // ** Mongoose schema
    }],
    url: 'mongodb://localhost:27017',
    forceClose: true,
    name: 'db1',
    // ... settings for mongoose
})
fastify.register(require("fastify-mongoose-multitenancy"), {
    // ** All options below are required.
    models: [{
        name: "users",
        alias: "Users",
        schema: userSchema
    }],
    url: 'mongodb://localhost:27017',
    forceClose: true,
    name: 'db2',
    // ... settings for mongoose
})
fastify.register(require("fastify-mongoose-multitenancy"), {
    models: [{
        name: "users",
        alias: "Users",
        schema: userSchema
    }],
    url: 'mongodb://localhost:27017',
    forceClose: true,
    // ... settings for mongoose
})
fastify.get("/default", async (request, reply) => {
  const connection = fastify.FastifyMongoose.client.useDb('DATABASE_NAME');
  const userModel = await connection['Users'].create({ username: 'Boo', age: 20 });
});
fastify.get("/db1", async (request, reply) => {
  const connection = fastify.FastifyMongoose['db1'].client.useDb('DATABASE_NAME');
  const userModel = await connection['Users'].create({ username: 'Boo', age: 20 });
});
fastify.get("/db2", async (request, reply) => {
  const connection = fastify.FastifyMongoose['db1'].client.useDb('DATABASE_NAME');
  const userModel = await connection['Users'].create({ username: 'Boo', age: 20 });
});
```

## Author

[Quan Tran Hong](quanth98)

## License

Licensed under [ISC](./LICENSE).
