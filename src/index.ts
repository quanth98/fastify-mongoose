import fp from 'fastify-plugin';

import { FastifyMongoose } from "./mongoose-fastify";
import { decoratorInstance } from './docorator-instance';

import type { FastifyPluginCallback } from "fastify";
import type { OptionsMongooseFastify } from "./shared/mongoose-fastify";

const mongooseFastifyPlugin: FastifyPluginCallback<OptionsMongooseFastify> = async (fastify, options, done) => {
    const { name, forceClose, ...opts } = options;
    
    try {
        const fastifyMongoose = FastifyMongoose.create(opts);
        decoratorInstance(fastify, fastifyMongoose, {
            forceClose: forceClose ?? true,
            newClient: true,
            name,
        })
    } catch(err: any) {
        console.log('PLUGIN ERROR: ', err)
        throw err;
    }

    done();
}

export default fp(mongooseFastifyPlugin, {
    fastify: '4.x',
    name: '@fastify/mongooseFastifyPlugin'
});
