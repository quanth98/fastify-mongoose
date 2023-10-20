import Fastify from 'fastify';

import mongoCustom from '../src/index';
import { ModelMongooseFastify } from '../src/shared/mongoose-fastify';

const modelUser = {
    name: "users",
    alias: "Users",
    schema: {
        username: {
            type: String,
            required: true,
        },
        age: {
            type: Number,
            required: true,
        },
    },
}
const modelPost: ModelMongooseFastify = {
    name: "posts",
    alias: "Post",
    schema: {
        title: {
            type: String,
            required: true,
        },
        content: {
            type: String,
            required: true,
        },
    },

}

export const MODELS = [modelUser, modelPost];
export const NO_DATABASE_MONGODB_URL = 'mongodb://localhost:27017'
export const DATABASE_NAME = 'test_database'
export const DATABASE_NAME2 = 'test_database2'
export const MONGODB_URL = 'mongodb://localhost:27017/' + DATABASE_NAME
export const CLIENT_NAME = 'client_name'
export const ANOTHER_DATABASE_NAME = 'test_database2'

export async function register(t, options) {
    const fastify = Fastify()
    t.teardown(fastify.close.bind(fastify))

    fastify.register(mongoCustom, options)

    await fastify.ready()

    return fastify
}
