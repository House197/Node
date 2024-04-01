import { envs } from "./config/plugins/envs.plugin";
import { MongoDatabase } from "./data/mongo-set/init";
import { LogModel } from "./data/mongo-set/models/log.model";
import { Server } from "./presentation/server"

(async() => {
    main();
})()

async function main() {
    await MongoDatabase.connect({mongoUrl: envs.MONGO_URL, dbName: envs.MONGO_DB_NAME});

/*     const newLog = await LogModel.create({
        message: 'Test message desde mongo',
        origin: 'App.ts',
        level: 'low'
    });

    await newLog.save(); */

    const logs = await LogModel.find();
    console.log(logs);

    Server.start();
}