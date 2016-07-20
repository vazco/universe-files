import {WebApp} from 'meteor/webapp';
import path from 'path';
import fs from 'fs';
import contentTypes from 'uploadfs/lib/storage/contentTypes';
import {UPLOADS_URL, UPLOADS_PATH} from './constants';

if (UPLOADS_URL) {
    WebApp.connectHandlers.use(UPLOADS_URL, function (req, res, next) {
        const {fileName, download} = req.query;
        const url = (req.url || '').replace(/\?.*$/, '');
        const localPath = path.join(UPLOADS_PATH, url.replace(/\.\.|~|^\\+|^\/+/g, ''));
        if (!fs.existsSync(localPath)) {
            return next();
        }
        const stat = fs.statSync(localPath);
        let ext = path.extname(localPath) || '';
        ext = ext.replace(/^\./, '');

        if(download){
            if(fileName) {
                const downloadFileName = fileName.replace(/ą/g, 'a').replace(/Ą/g, 'A')
                                                 .replace(/ć/g, 'c').replace(/Ć/g, 'C')
                                                 .replace(/ę/g, 'e').replace(/Ę/g, 'E')
                                                 .replace(/ł/g, 'l').replace(/Ł/g, 'L')
                                                 .replace(/ń/g, 'n').replace(/Ń/g, 'N')
                                                 .replace(/ó/g, 'o').replace(/Ó/g, 'O')
                                                 .replace(/ś/g, 's').replace(/Ś/g, 'S')
                                                 .replace(/ż/g, 'z').replace(/Ż/g, 'Z')
                                                 .replace(/ź/g, 'z').replace(/Ź/g, 'Z') + '.' + ext;
                res.setHeader('Content-disposition', 'attachment; filename=' + downloadFileName);
            }else{
                res.setHeader('Content-disposition', 'attachment');
            }
            res.setHeader('Content-Description', 'File Transfer');
        }

        res.writeHead(200, {
            'Content-Type': contentTypes[ext] || 'application/octet-stream',
            'Content-Length': stat.size
        });
        const readStream = fs.createReadStream(localPath);
        readStream.pipe(res);
    });
}
