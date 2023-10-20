import type { FastifyInstance } from 'fastify';
import { FastifyMongoose } from './mongoose-fastify';
import { Types } from 'mongoose';

interface Options {
    forceClose: boolean;
    name?: string;
    newClient: boolean;
}

export interface FastifyMongooseObject {
    // instance: Mongoose;
    ObjectId: typeof Types.ObjectId;
    client: FastifyMongoose;
}

export interface FastifyMongooseNestedObject {
    [name: string]: FastifyMongooseObject;
}

export function decoratorInstance(fastify: FastifyInstance, fm: FastifyMongoose, options: Options) {
    const { forceClose, name, newClient } = options;

    if (newClient) {
        fastify.addHook('onClose', function () {
            return fm.close(forceClose);
        })
    }

    const fastifyMongoose: any = {
        ObjectId: Types.ObjectId,
        client: fm,
    }

    if (name) {
        if (!fastify.FastifyMongoose) {
            fastify.decorate('FastifyMongoose', fastifyMongoose);
        }
        if (fastify.FastifyMongoose[name]) {
            throw Error('Connection name already registered: ' + name);
        }
        fastify.FastifyMongoose[name] = fastifyMongoose;
    } else {
        if (fastify.FastifyMongoose) {
            throw Error('fastify-mongoose has already registered');
        }
    }

    if (!fastify.FastifyMongoose) {
        fastify.decorate('FastifyMongoose', fastifyMongoose);
    }
}