import {UniCollection, UniUsers} from 'meteor/universe:collection';
import {UniConfig, UniUtils} from 'meteor/universe:utilities';
import {Meteor} from 'meteor/meteor';

const files = new UniCollection('universeFiles');
files.STATUS_START = 'start';
files.STATUS_DONE = 'done';
files.STATUS_PROCESSING = 'processing';
files.STATUS_ERROR = 'error';

const httpRegx = /https?:\/\//;

let confUF;

files.getFullFileUrl = pathInStore => {
    confUF = confUF || UniConfig.public.get('universe:files');
    const {UPLOADS_URL} = confUF || {};
    if (/\/$/.test(UPLOADS_URL)) {
        return UPLOADS_URL + pathInStore;
    }
    let url = UPLOADS_URL + '/' + pathInStore;
    if (httpRegx.test(url)) {
        return url;
    }
    if (url[0] === '/'){
        url = url.substr(1);
    }
    return Meteor.absoluteUrl(url);
};

files.getFullImageUrl = (pathInStore, size = '') => {
    if (size) {
        const paths = pathInStore.match(/^(.*)(\.[^\.\/]*)$/);
        if (paths && paths.length === 3) {
            pathInStore = paths[1] + '.' + size + paths[2];
        }
    }
    return files.getFullFileUrl(pathInStore);
};

files.getUploadingUrl = (isImage = false) => {
    const userId = UniUsers.getLoggedInId();
    const queries = [];
    let fileToken;
    if (userId) {
        queries.push('user='+userId);
        fileToken = UniConfig.users.get('fileToken');
        if (!fileToken && UniConfig.ready()) {
            fileToken = Random.id();
            UniConfig.users.set('fileToken', fileToken);
        }
        if (fileToken) {
            queries.push('token='+fileToken);
        }
    }
    confUF = confUF || UniConfig.public.get('universe:files');
    const {UPLOADING_URL = '/uploading'} = confUF || {};
    if (isImage) {
        queries.push('image=1');
    }
    let url = UPLOADING_URL + (queries.length ? '?' + queries.join('&') : '');
    if (httpRegx.test(url)) {
        return url;
    }
    if (url[0] === '/'){
        url = url.substr(1);
    }
    return Meteor.absoluteUrl(url);
};

files.addNewAllowDenyValidatorType('upload');

export default files;
export const getFullFileUrl =  files.getFullFileUrl;
export const getFullImageUrl =  files.getFullImageUrl;
export const getUploadingUrl =  files.getUploadingUrl;
