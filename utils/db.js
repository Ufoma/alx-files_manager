const MongoClient = require('mongodb').MongoClient;

class DBClient {
  constructor() {
    this.url = `mongodb://${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 27017}`;
    this.dbName = process.env.DB_DATABASE || 'files_manager';
    this.client = new MongoClient(this.url, { useNewUrlParser: true, useUnifiedTopology: true });
    this.db = null;
  }

  async connect() {
    try {
      await this.client.connect();
      this.db = this.client.db(this.dbName);
    } catch (err) {
      console.error('DB connection error:', err);
    }
  }

  isAlive() {
    return this.client.topology.isConnected();
  }

  async nbUsers() {
    if (!this.db) await this.connect();
    const usersCollection = this.db.collection('users');
    return await usersCollection.countDocuments();
  }

  async nbFiles() {
    if (!this.db) await this.connect();
    const filesCollection = this.db.collection('files');
    return await filesCollection.countDocuments();
  }
}

const dbClient = new DBClient();
dbClient.connect(); // Initialize the connection
module.exports = dbClient;
