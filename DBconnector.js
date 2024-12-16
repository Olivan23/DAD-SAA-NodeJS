import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const uri = 'mongodb+srv://eliasolivan230802:9UwOkfEUkDWMhXyi@mensajeriacluster.6xuvf.mongodb.net/Mensajeria?retryWrites=true&w=majority';
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

class DBConnector {
    constructor() {
        client.connect();
        this.db = client.db('Mensajeria');
    }

    async insertOne(collection, document) {
        return this.db.collection(collection).insertOne(document);
    }

    async find(collection, query) {
        return this.db.collection(collection).find(query).toArray();
    }

    async findOne(collection, query) {
        return this.db.collection(collection).findOne(query);
    }
}

export default new DBConnector();
