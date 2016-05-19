import autoInstallNpm from 'meteor/cristo:auto-install-npm';

autoInstallNpm({
    uploadfs: '^1.3.1',
    mkdirp: '^0.3.4',
    'upload-file': '^1.2.0'
}, 'universe-files');
