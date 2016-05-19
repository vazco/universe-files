import mkdirp from 'mkdirp';
import fs from 'fs';
import os from 'os';
import path from 'path';
import {Meteor} from 'meteor/meteor';

//TODO: Gets config from Meteor.settings

const {
    uploadsPath,
    tempPath,
    uploadsUrl,
    uploadingUrl,
    acceptFileTypes,
    maxFileSizeKB,
    s3 = {},
    imageSizes

} = (Meteor.settings || {})['universe:files'] || {};
const isS3 = s3.region && s3.secret && s3.bucket && s3.key;
export const METEOR_ROOT_PATH = process.cwd().split('/build/')[0];
export const UPLOADS_PATH = uploadsPath || path.join(METEOR_ROOT_PATH, 'uploads');
export const TEMP_PATH = tempPath || path.join(os.tmpdir(), 'universe');
export const UPLOADS_URL = uploadsUrl || (!isS3 ? '/uploads' : undefined);
export const UPLOADING_URL = uploadingUrl || '/uploading';
export const ACCEPT_FILE_TYPES = acceptFileTypes || 'gif|jpe?g|png|pdf|doc?x|zip|rar|pages|abw|odt|ps|txt|md';
export const MAX_FILE_SIZE_KB = maxFileSizeKB || 2024;
export const BACKEND = isS3? 's3' : 'local';
export const S3_REGION = s3.region;
export const S3_KEY = s3.key;
export const S3_SECRET = s3.secret;
export const S3_BUCKET = s3.bucket;
export const IMAGE_SIZES = imageSizes || [
        {
            name: 'small',
            width: 128,
            height: 128
        },
        {
            name: 'medium',
            width: 512,
            height: 512
        },
        {
            name: 'large',
            width: 1024,
            height: 1024
        }
    ];

ensureDir(UPLOADS_PATH);
ensureDir(TEMP_PATH);

// Info level log
console.info('TEMP_PATH', TEMP_PATH);
if (BACKEND === 's3') {
    console.info('S3_BUCKET', S3_BUCKET);
} else {
    console.info('UPLOADS_PATH', UPLOADS_PATH);
}

function ensureDir(path, mode = '0744') {
    fs.stat(path, function (err) {
        if (err) {
            // Create the temp directory
            mkdirp(path, {mode: mode}, function (err) {
                if (err) {
                    console.error('files: cannot create temp directory at ' + path + ' (' + err.message + ')');
                } else {
                    console.log('files: temp directory created at ' + path);
                }
            });
        } else {
            // Set directory permissions
            fs.chmod(path, mode, function (err) {
                err && console.error('files: cannot set temp directory permissions ' + mode + ' (' + err.message + ')');
            });
        }
    });
}