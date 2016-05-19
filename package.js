Package.describe({
    name: 'universe:files',
    version: '1.0.0',
    // Brief, one-line summary of the package.
    summary: 'Easy file uploading feature for meteor with local file system and amazon s3 support',
    // URL to the Git repository containing the source code for this package.
    git: 'https://github.com/vazco/universe-files',
    // By default, Meteor will default to using README.md for documentation.
    // To avoid submitting documentation, set this field to null.
    documentation: 'README.md'
});

Package.onUse(function (api) {
    api.versionsFrom('1.3.2.4');
    api.use(['ecmascript', 'cristo:auto-install-npm', 'webapp',
        'universe:collection', 'random', 'ejson', 'universe:utilities']);
    api.addFiles(['autoInstall.js', 'uploadAction.js', 'files.js', 'fileHandler.js'], 'server');
    api.mainModule('index.js');
});

