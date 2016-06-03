<a href="http://unicms.io"><img src="http://unicms.io/banners/standalone.png" /></a>

# Universe files
This package aims make file uploading easy by less configuration requirement but still be configurable.
Universe Files package includes both S3-based and local filesystem-based backend.

Additionally:
- it includes handlers for uploading and access point for local storing,
- it offers also an image resizing.
- uploading access control

Everything works on top of [uploadfs](https://github.com/punkave/uploadfs) package, so you can easily implement more features.

## Installation

```sh
    $ meteor add universe:files
```

## Storing files
As a default option this package stores files locally.
Because of that this package is auto configured,
storing of files should work out of the box in most cases.

### Storing in Amazon S3
If you want to store files in amazon s3,
you should just attach configuration in Meteor Settings
under key `universe:files`.
Just like following example:

```json
{
  "universe:files": {
    "s3": {
      "bucket": "my-bucket",
      "region": "eu-west-1",
      "key": "FAKEWJ62U26K6FAKE",
      "secret": "Fake+4sdf/LZzBYWARg8O6LKS0XsRspwFake"
    },
    //Optional
    "uploadsUrl": "https://s3-eu-west-1.amazonaws.com/bizmaster-test"
  }
}
```

## Changing default configuration:
- uploadsPath - the place at server, where are stored files
- tempPath - the place at server, where are stored temporary files
- uploadsUrl - name of handler or url where are localized files for www access.
- uploadingUrl - name of handler for uploading point
- acceptFileTypes - acceptable extensions separated by char `|`
  example:`gif|jpe?g|png|pdf|doc?x|zip|rar|pages|abw|odt|ps|txt|md`
- maxFileSizeKB - size of uploading file (default: 2048),
- imageSizes - array of available sizes of images, like following:

default sizes:

```js
[
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
]
```

## Uploading
Uploading is made on top of `upload-file` package,
Url for handling file uploads over HTTP (multipart form data)
by method `getUploadingUrl` (it's a reactive source of data)

```
import FileCollection from 'meteor/universe:files';

Tracker.autorun(function () {
    //log url for files
    console.log(FileCollection.getUploadingUrl());

    //log url for images (will make sizes)
    console.log(FileCollection.getUploadingUrl(true));
});
```
#### Uploading example
with using `jquery-simple-upload` package.

```html
<template name='imageForm'>
    <input type="file" name="file">
</template>
```

```js
import FileCollection from 'meteor/universe:files';
import {Template} from 'meteor/templating';
import 'jquery-simple-upload';

Template.imageForm.events({
    'change input[type=file]' (e, tmpl) {
            tmpl.$(e.target).simpleUpload(FileCollection.getUploadingUrl(), {
                start: function (file) {
                    //upload started
                    console.log('upload started', file);
                },
                progress (progress) {
                    //received progress
                    console.log('upload progress: ' + Math.round(progress) + '%');
                },
                success (data) {
                    //upload successful
                    console.log('upload successful!');
                    console.log(data);
                },
                error (error) {
                    //upload failed
                    console.log('upload error: ' + error.name + ': ' + error.message);
                }
            });
        }
});
```
### In response you will be have a json data
- on success:
`{"file":{"_id":"vnSvFbGFWA7SYudmm","path":"file/vnSvFbGFWA7SYudmm.png"}}`
- on error:
  - if global error:
  `{"error":"uploading","reason":"File type not allowed","message":"File type not allowed [uploading]","errorType":"Meteor.Error"}`
  - if only for some file (in processing step):
  `{"file":"{\"error\":\"processing\",\"reason\":\"fs is not defined\",\"message\":\"fs is not defined [processing]\",\"errorType\":\"Meteor.Error\"}"}`

## Access control
As a default option, anyone can upload files
but you can limit it by allow/deny functions.

You can do it with `upload` key, just like you did for insert or update function.

```js

import FileCollection from 'meteor/universe:files';

FileCollection.allow({
    upload (userId, queries, request) {
        return !!userId;
    }
});

```

## Getting url
As you can see successful uploading return id and path inside store.
Path you can find also in file document in FileCollection

You can call `getFullFileUrl(path)` or `getFullImageUrl(path, size)` (for images)
with this path. As a return you will be get url to resource.

Both of functions (`getFullFileUrl` or `getFullImageUrl`) are
reactive data source.

example:
```
import FileCollection from 'meteor/universe:files';

FileCollection.getFullImageUrl('file/abdf533f67.jpg', 'small);
//output (if s3): http://test.s3.amazonaws.com/file/abdf533f67.small.jpg
```
##  License MIT
