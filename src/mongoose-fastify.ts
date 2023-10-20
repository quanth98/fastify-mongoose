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

    public useBb(dbName: string) {
        const connection = this.getOrCreateConnectionByDbName(dbName);

        const fastifyMongooseClient: { [key: string]: Model<any> } = {};

        this._models.forEach(model => {
            const { name, alias, schema, options, plugins, middlewares } = model;

            const newSchema = new mongoose.Schema(schema, options || {});
            // ** Logic xử lý middleware, plugins, methods, statics,... sẽ định nghĩa ở đây;
            // ** Eg: newSchema.plugins = [];
            
            // ** Chưa test
            if (plugins) {
                // ** Chỉ sử dụng cho từng model.
                plugins.forEach(plugin => {
                    if (plugin.func) {
                        newSchema.plugin(plugin.func, plugin.options);
                    } else {
                        newSchema.plugin(plugin);
                    }
                })
            }

            if (middlewares) {
                // middlewares.forEach(middleware => {
                //     const prefix = middleware.prefix;
                //     switch (prefix) {
                //         case 'pre':
                //             newSchema.pre<typeof schema>(middleware.method, middleware.func)
                //         case 'post':
                //             newSchema.post<typeof schema>(middleware.method, middleware.func)
                //         default:
                //             break;
                //     }
                // })
            }

            fastifyMongooseClient[alias] = connection.model(alias, newSchema, name) as Model<any>;
        });

        // ** Cần thêm logic quản lý connection sẽ trả về ở đây.
        return {
            ...fastifyMongooseClient,
            close: (forceClose?: boolean) => this.closeConnections(dbName, forceClose), // ** close current connection
            db: dbName,
        };
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
