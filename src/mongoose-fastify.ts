import mongoose, { Model } from 'mongoose';

import type { ModelMongooseFastify, OptionsMongooseFastify } from './shared/mongoose-fastify';

export class FastifyMongoose {
    static create(opts: Omit<OptionsMongooseFastify, 'name'>): FastifyMongoose {
        opts = Object.assign({
            serverSelectionTimeoutMS: 7500,
        }, opts);

        if (!opts.url) {
            throw Error('MongoDB url is required for the plugin.');
        }

        if (!opts.models) {
            throw Error('`Model` parameter is mandatory');
        }

        return new FastifyMongoose(opts);
    }

    constructor(opts: Omit<OptionsMongooseFastify, 'name'>) {
        const { url, models, ...options } = opts;

        this._defaultConnection = mongoose.createConnection(url, options) || null;
        this._models = models;
    }

    private _defaultConnection: mongoose.Connection | null = null;
    private _tenantConnections: { [key: string]: mongoose.Connection } = {};
    private _models: ModelMongooseFastify[] = [];

    get defaultConnection() {
        return this._defaultConnection;
    }

    get allTenantConnections() {
        return this._tenantConnections;
    }

    public useDb(dbName: string) {
        const connection = this.getOrCreateConnectionByDbName(dbName);

        const fastifyMongooseClient: { [key: string]: Model<any> } = {};

        this._models.forEach(model => {
            const { name, alias, schema } = model;

            fastifyMongooseClient[alias] = connection.model(alias, schema, name) as Model<any>;
        });

        // ** Cần thêm logic quản lý connection sẽ trả về ở đây.
        return Object.freeze(Object.assign({
            close: (forceClose?: boolean) => this.closeConnections(dbName, forceClose), // ** close current connection
            db: dbName,
        }, fastifyMongooseClient));
    }

    // ** Close All tenant connections and default connection
    public close(forceClose?: boolean) {
        const closePromises = Object.keys(this._tenantConnections).map((dbName): Promise<boolean> => {
            return new Promise((resolve, reject) => {
                // this._tenantConnections[dbName].close(forceClose)
                this.closeConnections(dbName, forceClose)
                    .then(() => resolve(true))
                    .catch(err => {
                        reject(`Error closing connections: ${dbName}`);
                    });
            });
        });
        try {
            const defaultConnection = this._defaultConnection;
            return Promise.all(closePromises).then((isAllTenantClosed) => {
                if (isAllTenantClosed) {
                    defaultConnection?.close(forceClose);
                }
            });
        } catch (err) {
            throw err;
        }
    }

    private getOrCreateConnectionByDbName(dbName: string) {
        if (!this._defaultConnection) {
            throw Error('Mongodb not connected');
        }
        if (!this._tenantConnections[dbName]) {
            // ** Create new connection to @dbName and cached
            this._tenantConnections[dbName] = this._defaultConnection.useDb(dbName, {});
        }
        return this._tenantConnections[dbName];
    }

    private async closeConnections(dbNames: string | string[], forceClose?: boolean) {
        try {
            if (typeof dbNames === 'string') {
                return this.closeConnectionAndRemove(dbNames, forceClose);
            } else {
                dbNames.forEach(async dbName => {
                    this.closeConnectionAndRemove(dbName, forceClose);
                });
            }
        } catch (err) {
            throw err;
        }
    }

    private async closeConnectionAndRemove(dbName: string, forceClose?: boolean) {
        try {
            if (this.connectionValid(dbName)) {
                await this._tenantConnections[dbName].close(forceClose ?? true);
                delete this._tenantConnections[dbName]; // ** Đóng kết nối thành công cần xoá khỏi object tenantConnections
            }
        } catch (err) {
            throw err;
        }
    }

    private connectionValid(dbName: string) {
        return !!this._tenantConnections[dbName]
    }
}
