const { exec } = require('child_process');
const AWS = require('aws-sdk');
const child_process = require("child_process");
var path = require('path');
var fs = require('fs');
const zipFolder = require('folder-zip-sync')
var shell = require('shelljs');

exports.handler = async (event) => {
    var name = 'nxworkspace3'; //event.queryStringParameters.name
    var command = 'ng new hello-world-project --interactive=false --routing=true --skipGit=true --style=css --skipInstall=true --directory=.';
    var dir = '/tmp/' + name;
    var zipFile = dir + '.zip';
    var bucketName = 'temp-files-s3-bucket';
    var uploadParams = { Bucket: bucketName, Key: '', Body: '' };
    s3 = new AWS.S3({ apiVersion: '2006-03-01' });

    //create dir
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
        console.log(dir + " has been created!");
    } else {
        console.log(dir + " already exists!");
    }

    //run commands
    shell.cd(dir);

    if (shell.exec(command).code !== 0) {
        shell.echo('failed to create projet');
        shell.exit(1);
    }

    //zip file
    console.log("zipping file...");
    zipFolder(dir, zipFile);


    //upload to S3
    console.log("preparing to upload zip file. Updating upload params...");
    var fileStream = fs.createReadStream(zipFile);
    fileStream.on('error', function (err) {
        console.log('File Error', err);
    });
    uploadParams.Body = fileStream;
    uploadParams.Key = path.basename(zipFile);
    console.log("uploading zip file...");
    s3.upload(uploadParams, function (err, data) {
        if (err) {
            console.log('ERROR MSG: ', err);
        } else {
            console.log('Successfully uploaded data');
        }
    });

    const response = {
        statusCode: 200,
        body: JSON.stringify("Hello from Lambda!"),
    };
    return response;
};
