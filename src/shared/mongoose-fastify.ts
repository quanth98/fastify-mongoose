import type { 
    SchemaDefinition,
    ConnectOptions,
    SchemaOptions,
    Schema,
    MongooseQueryMiddleware,
    PreMiddlewareFunction
} from 'mongoose';

import { FastifyMongooseNestedObject, FastifyMongooseObject } from '../docorator-instance';

export type PluginModel = (schema: Schema, opts?: any) => void;

export type PluginWithOptionsModel = {
    func: (schema: Schema, opts?: any) => void;
    options: any;
}

export interface MiddlewareModel {
    prefix: 'pre' | 'post';
    method: MongooseQueryMiddleware;
    func: PreMiddlewareFunction;
}

export interface ModelMongooseFastify {
    name: string;
    alias: string;
    schema: SchemaDefinition;
    options?: SchemaOptions;
    plugins?: PluginModel[] | PluginWithOptionsModel[];
    middlewares?: MiddlewareModel[];
}

export interface OptionsMongooseFastify extends ConnectOptions {
    url: string;
    models: ModelMongooseFastify[];
    name?: string;
    forceClose?: boolean;
}

declare module 'fastify' {
    interface FastifyInstance {
        FastifyMongoose: FastifyMongooseObject & FastifyMongooseNestedObject;
    }
}
