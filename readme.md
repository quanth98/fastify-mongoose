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
fastify.register(require("fastify-mongoose-driver"), {
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
fastify.get("/", async (request, reply) => {
  console.log(fastify.FastifyMongoose['db1']); // Using mongoose connect to localhost:27017
  const connection = fastify.FastifyMongoose['db1'].client.useDb('DATABASE_NAME');
  const userModel = await connection['Users'].create({ username: 'Boo', age: 20 });
});
```

## Author

[Quan Tran Hong](quanth98)

## License

Licensed under [ISC](./LICENSE).
