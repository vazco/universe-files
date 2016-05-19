import uploadfs from 'uploadfs';
import {
    UPLOADS_PATH, TEMP_PATH, UPLOADS_URL, ACCEPT_FILE_TYPES, MAX_FILE_SIZE_KB,
    BACKEND, S3_REGION, S3_KEY, S3_SECRET, S3_BUCKET, IMAGE_SIZES, UPLOADING_URL
} from './constants';
import FilesCollection from './index';
import {Meteor} from 'meteor/meteor';
import {UniConfig, UniUtils} from 'meteor/universe:utilities';

const ufs = uploadfs();
const init = Meteor.wrapAsync(ufs.init);

if (BACKEND === 's3') {
    init({
        backend: BACKEND,
        secret: S3_SECRET,
        key: S3_KEY,
        bucket: S3_BUCKET,
        region: S3_REGION,
        // Required if you use copyImageIn
        // Temporary files are made here and later automatically removed
        tempPath: TEMP_PATH,
        imageSizes: IMAGE_SIZES,
        parallel: 4
    });
} else {
    init({
        backend: BACKEND,
        uploadsPath: UPLOADS_PATH,
        tempPath: TEMP_PATH,
        uploadsUrl: UPLOADS_URL,
        imageSizes: IMAGE_SIZES,
        // Render up to 4 image sizes at once. Note this means 4 at once per call
        // to copyImageIn. There is currently no built-in throttling of multiple calls to
        // copyImageIn
        parallel: 4
    });
}

UniConfig.public.set('universe:files', {
    BACKEND,
    UPLOADS_URL: UPLOADS_URL || ufs.getUrl(),
    UPLOADING_URL,
    IMAGE_SIZES,
    ACCEPT_FILE_TYPES,
    MAX_FILE_SIZE_KB
}, true);

FilesCollection.onAfterCall('remove', 'removeFiles', function() {
    this.getPreviousDocs().forEach(doc => doc.status === FilesCollection.STATUS_DONE && ufs.remove(doc.path));
});

FilesCollection.allow({
    upload () {
        return UniUtils.get(FilesCollection, '_universeValidators.upload.allow.length') === 1;
    }
});

FilesCollection.uploadfs = ufs;

export default ufs;