const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');
const fs = require('fs');
const path = require('path');
const uuid = require('uuid/v4');

class FilesController {
  static async postUpload(req, res) {
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

    const { name, type, parentId, isPublic, data } = req.body;

    if (!name) {
      res.status(400).json({ error: 'Missing name' });
      return;
    }

    if (!type || !['folder', 'file', 'image'].includes(type)) {
      res.status(400).json({ error: 'Missing type' });
      return;
    }

    if (type !== 'folder' && !data) {
      res.status(400).json({ error: 'Missing data' });
      return;
    }

    if (parentId) {
      const parentFile = await dbClient.db.collection('files').findOne({ _id: parentId });
      if (!parentFile) {
        res.status(400).json({ error: 'Parent not found' });
        return;
      }

      if (parentFile.type !== 'folder') {
        res.status(400).json({ error: 'Parent is not a folder' });
        return;
      }
    }

    const file = {
      userId,
      name,
      type,
      isPublic: isPublic || false,
      parentId: parentId || 0,
    };

    if (type !== 'folder') {
      const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath);
      }

      const localPath = path.join(folderPath, uuid());
      fs.writeFileSync(localPath, Buffer.from(data, 'base64'));

      file.localPath = localPath;
    }

    const result = await dbClient.db.collection('files').insertOne(file);
    const fileId = result.insertedId;

    res.status(201).json({ id: fileId, ...file });
  }
}

module.exports = FilesController;
