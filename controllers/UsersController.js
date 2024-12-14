const dbClient = require('../utils/db');
const crypto = require('crypto');

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;

    if (!email) {
      res.status(400).json({ error: 'Missing email' });
      return;
    }

    if (!password) {
      res.status(400).json({ error: 'Missing password' });
      return;
    }

    const existingUser = await dbClient.db.collection('users').findOne({ email });
    if (existingUser) {
      res.status(400).json({ error: 'Already exist' });
      return;
    }

    const hashedPassword = crypto.createHash('sha1').update(password).digest('hex');
    const newUser = { email, password: hashedPassword };

    const result = await dbClient.db.collection('users').insertOne(newUser);
    const userId = result.insertedId;

    res.status(201).json({ id: userId, email });
  }
}

module.exports = UsersController;
