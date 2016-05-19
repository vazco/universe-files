import {WebApp} from 'meteor/webapp';
import path from 'path';
import fs from 'fs';
import contentTypes from 'uploadfs/lib/storage/contentTypes';
import {UPLOADS_URL, UPLOADS_PATH} from './constants';

if (UPLOADS_URL) {
    WebApp.connectHandlers.use(UPLOADS_URL, function (req, res, next) {
        const url = (req.url || '').replace(/\?.*$/, '');
        const localPath = path.join(UPLOADS_PATH, url.replace(/\.\.|~|^\\+|^\/+/g, ''));
        if (!fs.existsSync(localPath)) {
            return next();
        }
        const stat = fs.statSync(localPath);
        let ext = path.extname(localPath) || '';
        ext = ext.replace(/^\./, '');
        res.writeHead(200, {
            'Content-Type': contentTypes[ext] || 'application/octet-stream',
            'Content-Length': stat.size
        });
        const readStream = fs.createReadStream(localPath);
        readStream.pipe(res);
    });
}
