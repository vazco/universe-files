import {WebApp} from 'meteor/webapp';
import {EJSON} from 'meteor/ejson';
import {UniConfig} from 'meteor/universe:utilities';
import {UniUsers} from 'meteor/universe:collection';
import path from 'path';
import fs from 'fs';
import Upload from 'upload-file';
import FilesCollection from './index';
import UploadService from './files';
import {TEMP_PATH, UPLOADING_URL, ACCEPT_FILE_TYPES, MAX_FILE_SIZE_KB, IMAGE_SIZES} from './constants';

const createDoc = Meteor.bindEnvironment(file => FilesCollection.insert(file));

const copyToStore = Meteor.wrapAsync(UploadService.copyIn);
const copyImageIn = Meteor.wrapAsync(UploadService.copyImageIn);
const identifyLocalImage = Meteor.wrapAsync(UploadService.identifyLocalImage);

WebApp.connectHandlers.use(UPLOADING_URL, function (req, res) {
    const ids = [];
    let userId;
    const isImage = req.query && req.query.image;
    const upload = new Upload({
        dest: TEMP_PATH,
        maxFileSize: MAX_FILE_SIZE_KB * 1024,
        acceptFileTypes: new RegExp('(\.|\/)(' + ACCEPT_FILE_TYPES + ')$', 'i'),
        rename (name, file) {
            file._id = Random.id();
            ids.push(file._id);
            file.name = name || 'file';
            file.orgName = file.filename;
            if (userId) {
                file.ownerId = userId;
            }
            file.createdAt = new Date();
            file.status = FilesCollection.STATUS_START;
            file.filename = file._id + '.file';
            file.extension = path.extname(file.orgName);
            file.path = `${file.name}/${file._id}${file.extension}`;
            createDoc(file);
            return file.filename;
        }
    });

    upload.on('end', Meteor.bindEnvironment(function (fields, files) {
        const fileNames = Object.keys(files);
        const result = {};
        fileNames.forEach(fileKey => {
            const file = files[fileKey];
            const setError = (err, details = '') => {
                console.error('uploading file', err, details);
                result[fileKey] = EJSON.stringify(
                    new Meteor.Error(FilesCollection.STATUS_PROCESSING, err && err.message || err)
                );
                FilesCollection.update(file._id, {
                    $set: {
                        status: FilesCollection.STATUS_ERROR
                    }
                });
            };
            try {
                const tmpPath = path.join(TEMP_PATH, file._id + '.file');
                FilesCollection.update(file._id, {
                    $set: {
                        status: FilesCollection.STATUS_PROCESSING,
                        isStoredAsImage: isImage,
                        metadata: fields
                    }
                });
                const doneData = {
                    status: FilesCollection.STATUS_DONE,
                    metadata: fields,
                    filename: file._id + file.extension
                };
                if (!fs.existsSync(tmpPath)) {
                    setError(new Error('Missing temporary file'), tmpPath);
                }
                if (isImage) {
                    const imInfo = identifyLocalImage(tmpPath);
                    if (imInfo && imInfo.extension) {
                        const newExt = '.' + imInfo.extension;
                        doneData['filename'] = file._id + newExt;
                        file.path = file.path.replace(new RegExp('\.'+file.extension+'$'), newExt);
                        file.extension = newExt;
                    }
                    doneData.imageInfo = copyImageIn(tmpPath, '/' + file.path);
                    doneData.imageSizes = IMAGE_SIZES;
                } else {
                    copyToStore(tmpPath, '/' + file.path);
                }
                FilesCollection.update(file._id, {
                    $set: doneData
                });
                result[fileKey] = {_id: file._id, path: file.path, orgName: file.orgName};
            } catch (err) {
                setError(err);
            }
        });
        res.end(EJSON.stringify(result));
    }));

    upload.on('error', Meteor.bindEnvironment(function (err) {
        res.end(EJSON.stringify(new Meteor.Error('uploading', err && err.message || err)));
        if (ids && ids.length) {
            FilesCollection.update({_id: {$in: ids}, status: FilesCollection.STATUS_START}, {
                $set: {
                    status: FilesCollection.STATUS_ERROR
                }
            }, {multi: true});
        }
    }));

    try {
        let {user, token} = req.query || {};
        if (user && token && UniConfig.users.get('fileToken', undefined, user) === token) {
            UniUsers.runWithUser(user, () => {
                if (FilesCollection.validateUniverseRule('upload', user, req.query, req)) {
                    userId = user;
                    upload.parse(req);
                }
            });
            return;
        }
        if (FilesCollection.validateUniverseRule('upload', null, req.query, req)) {
            upload.parse(req);
            return;
        }
        const er = new Meteor.Error('403', 'Uploading is denied for you.');
        console.error('uploading file', er);
        res.end(EJSON.stringify(er));
    } catch (err) {
        console.error('uploading file', err);
        res.end(EJSON.stringify(err));
    }

});