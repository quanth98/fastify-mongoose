import Fastify from 'fastify';
import tap, { test } from 'tap';
import assert  from 'node:assert';

import mongoCustom from '../src/index';

import { CLIENT_NAME, DATABASE_NAME, DATABASE_NAME2, MODELS, MONGODB_URL, NO_DATABASE_MONGODB_URL, register } from './helper';

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

        const userModel = fastify.FastifyMongoose.client.useBb('test_database')['Users'];
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
    t.ok(fastify.FastifyMongoose.client.useBb(DATABASE_NAME).db, DATABASE_NAME)

    t.ok(fastify.FastifyMongoose.client1.client)
    t.ok(fastify.FastifyMongoose.client1.ObjectId)
    t.ok(fastify.FastifyMongoose.client1.client.useBb(DATABASE_NAME).db, DATABASE_NAME)

    t.ok(fastify.FastifyMongoose.client2.client)
    t.ok(fastify.FastifyMongoose.client2.ObjectId)
    t.ok(fastify.FastifyMongoose.client2.client.useBb(DATABASE_NAME2).db, DATABASE_NAME)

    // t.objectId(fastify.FastifyMongoose.ObjectId)
    // t.client(fastify.mongo.client)
    // t.database(fastify.mongo.db)

    // t.objectId(fastify.mongo.client1.ObjectId)
    // t.client(fastify.mongo.client1.client)
    // t.database(fastify.mongo.client1.db)

    // t.objectId(fastify.mongo.client2.ObjectId)
    // t.client(fastify.mongo.client2.client)
    // t.database(fastify.mongo.client2.db)
});

test('register with a name', async (t) => {
    const fastify = Fastify()

    t.teardown(fastify.close.bind(fastify));

    try {
        await fastify
            .register(mongoCustom, { url: NO_DATABASE_MONGODB_URL, models: MODELS, name: CLIENT_NAME })
            .ready()

        const connection = fastify.FastifyMongoose[CLIENT_NAME].client.useBb(DATABASE_NAME);
        await connection.close();
        t.ok(fastify.FastifyMongoose[CLIENT_NAME].client.allTenantConnections);
        t.notOk(fastify.FastifyMongoose[CLIENT_NAME].client.allTenantConnections[DATABASE_NAME]);
    } catch (err) {
        t.fail("Fastify threw", err)
    }
})
