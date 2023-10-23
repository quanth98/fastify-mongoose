import Fastify from 'fastify';
import tap, { test } from 'tap';
import assert  from 'node:assert';

import mongoCustom, { mongoose } from '../src/index';

import { 
    CLIENT_NAME,
    DATABASE_NAME,
    DATABASE_NAME2,
    MODELS,
    MONGODB_URL,
    NO_DATABASE_MONGODB_URL,
    register,
    modelUser
} from './helper';

test('Fastify-mongoose should exits', async (_test) => {
    const fastify = Fastify();
    try {
        await fastify.register(mongoCustom, {
            models: MODELS,
            url: 'mongodb://localhost:27017',
            forceClose: true,
        }).ready();

        // ** Instance exits
        _test.ok(fastify.FastifyMongoose);
        _test.ok(fastify.FastifyMongoose.client);

        const userModel = fastify.FastifyMongoose.client.useDb('test_database')['Users'];
        const user = await userModel.find({});

        _test.ok(userModel);
        _test.ok(user);
    } catch (err) {
        _test.fail("Fastify threw", err);
    }

    _test.after(() => {
        _test.teardown(fastify.close.bind(fastify));
    })
});

test('Immutable options', async (t) => {
    t.plan(1)

    const given = { url: MONGODB_URL, name: CLIENT_NAME, models: MODELS }

    await register(t, given)
    t.same(given, {
        url: MONGODB_URL,
        name: CLIENT_NAME,
        models: MODELS
    })
})

test('double register without name', async (t) => {
    t.plan(2)

    const fastify = Fastify()
    t.teardown(fastify.close.bind(fastify))

    try {
        await fastify
            .register(mongoCustom, { url: MONGODB_URL, models: MODELS })
            .register(mongoCustom, { url: MONGODB_URL, models: MODELS })
            .ready()
    } catch (err) {
        t.ok(err)
        t.equal(err.message, 'fastify-mongoose has already registered')
    }
})

test('register with a name', async (t) => {
    const fastify = Fastify()

    t.teardown(fastify.close.bind(fastify));

    try {
        await fastify
            .register(mongoCustom, { url: MONGODB_URL, models: MODELS, name: CLIENT_NAME })
            .ready()

        t.ok(fastify.FastifyMongoose[CLIENT_NAME].client);
    } catch (err) {
        t.fail("Fastify threw", err)
    }
})

test('double register with the same name', async (t) => {
    const fastify = Fastify()

    t.teardown(fastify.close.bind(fastify));

    try {
        await fastify
            .register(mongoCustom, { url: MONGODB_URL, models: MODELS, name: CLIENT_NAME })
            .register(mongoCustom, { url: MONGODB_URL, models: MODELS, name: CLIENT_NAME })
            .ready()
    } catch (err) {
        t.ok(err)
        t.equal(err.message, 'Connection name already registered: ' + CLIENT_NAME)
    }
});

test('double register with different name', async (t) => {
    t.plan(14)

    const fastify = Fastify()
    t.teardown(fastify.close.bind(fastify))

    await fastify
        .register(mongoCustom, { url: NO_DATABASE_MONGODB_URL, models: MODELS, name: 'client1' })
        .register(mongoCustom, { url: NO_DATABASE_MONGODB_URL, models: MODELS, name: 'client2' })
        .ready()

    t.ok(fastify.FastifyMongoose)

    t.ok(fastify.FastifyMongoose.client1)
    t.ok(fastify.FastifyMongoose.client2)

    t.same(fastify.FastifyMongoose['client1'].client, fastify.FastifyMongoose.client);
    t.notSame(fastify.FastifyMongoose['client1'].client, fastify.FastifyMongoose['client2'].client);

    t.ok(fastify.FastifyMongoose.ObjectId)
    t.ok(fastify.FastifyMongoose.client)
    t.ok(fastify.FastifyMongoose.client.useDb(DATABASE_NAME).db, DATABASE_NAME)

    t.ok(fastify.FastifyMongoose.client1.client)
    t.ok(fastify.FastifyMongoose.client1.ObjectId)
    t.ok(fastify.FastifyMongoose.client1.client.useDb(DATABASE_NAME).db, DATABASE_NAME)

    t.ok(fastify.FastifyMongoose.client2.client)
    t.ok(fastify.FastifyMongoose.client2.ObjectId)
    t.ok(fastify.FastifyMongoose.client2.client.useDb(DATABASE_NAME2).db, DATABASE_NAME)
});

test('register with a name', async (t) => {
    const fastify = Fastify()

    t.teardown(fastify.close.bind(fastify));

    try {
        await fastify
            .register(mongoCustom, { url: NO_DATABASE_MONGODB_URL, models: MODELS, name: CLIENT_NAME })
            .ready()

        const connection = fastify.FastifyMongoose[CLIENT_NAME].client.useDb(DATABASE_NAME);
        await connection.close();
        t.ok(fastify.FastifyMongoose[CLIENT_NAME].client.allTenantConnections);
        t.notOk(fastify.FastifyMongoose[CLIENT_NAME].client.allTenantConnections[DATABASE_NAME]);
    } catch (err) {
        t.fail("Fastify threw", err)
    }
})

test('Add middleware', async (t) => {
    const fastify = Fastify()

    t.teardown(fastify.close.bind(fastify));

    try {
        const useSchema = new mongoose.Schema({
            username: {
                type: String,
                required: true,
            },
            age: {
                type: Number,
                required: true,
            },
        });
        useSchema.pre('save', function(next) {
            this.age += 2;
            next();
        })
        await fastify
            .register(mongoCustom, { url: NO_DATABASE_MONGODB_URL, models: [{
                name: "users",
                alias: "Users",
                schema: useSchema
            }], name: CLIENT_NAME })
            .ready()

        const connection = fastify.FastifyMongoose[CLIENT_NAME].client.useDb(DATABASE_NAME);
        const user = await connection['Users'].create<typeof modelUser.schema>({
            username: 'Test',
            age: 1,
        })
        t.ok(user);
        t.same(user.age, 3);
    } catch (err) {
        t.fail("Fastify threw", err)
    }
})

test('Add plugins global', async (t) => {
    t.plan(2)
    const fastify = Fastify()

    t.teardown(fastify.close.bind(fastify));

    try {
        const useSchema = new mongoose.Schema({
            username: {
                type: String,
                required: true,
            },
            age: {
                type: Number,
                required: true,
            },
        });
        await fastify
            .register(mongoCustom, { url: NO_DATABASE_MONGODB_URL, models: [{
                name: "users",
                alias: "Users",
                schema: useSchema
            }], name: CLIENT_NAME })
            .ready()

        const connection = fastify.FastifyMongoose[CLIENT_NAME].client.useDb(DATABASE_NAME);
        connection.plugin([() => {
            console.log('plugin 1')
        }]);

        t.ok(connection.plugins);
        t.same(connection.plugins.length, 1);

    } catch (err) {
        t.fail("Fastify threw", err)
    }
})
