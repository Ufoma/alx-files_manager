const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');
const crypto = require('crypto');
const uuid = require('uuid/v4');

class AuthController {
  static async getConnect(req, res) {
    const authHeader = req.header('Authorization');
    if (!authHeader) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const credentials = Buffer.from(authHeader.split(' ')[1], 'base64').toString('utf8').split(':');
    const email = credentials[0];
    const password = credentials[1];

    const user = await dbClient.db.collection('users').findOne({ email, password: crypto.createHash('sha1').update(password).digest('hex') });
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const token = uuid();
    await redisClient.set(`auth_${token}`, user._id, 'EX', 24 * 60 * 60);

    res.json({ token });
  }

  static async getDisconnect(req, res) {
    const token = req.header('X-Token');
    if (!token) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    await redisClient.del(`auth_${token}`);

    res.status(204).send();
  }
}

module.exports = AuthController;
