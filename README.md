# Image middlware server
---
This module acts as a middleware server handles uploading/getting images to/from **Amazon S3** servers with different sizes.
## Getting started
---
These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.
### Pre-requisites
- Get [Git](https://git-scm.com/downloads) and [NodeJS](https://nodejs.org/en/download/) installed on your machine
- Get an [Amazon Simple Storage Service](https://aws.amazon.com/s3/) \(Amazon S3\) valid account
- Get [Postman](https://www.getpostman.com/) installed on your machine (either desktop/browser version)
### Installation
- Clone the repo locally: ```git clone https://github.com/goodsensejp/image-middleware.git```
- Navigate inside the repo folder ```cd image-middlware```
- Install its dependencies: ```npm install```
- Set the following values in your machine's environment path:   
        \(_If you don't know how,_ [click here](https://java.com/en/download/help/path.xml)\)
	* AWS\_ACCESS\_KEY\_ID
	* AWS\_SECRET\_ACCESS\_KEY
	* PORT (_Optional, just in case you want to run the server locally_, default:9999)

### API Reference
- Import this [collection](https://www.getpostman.com/collections/5992381874c2f3e65d33) to your Postman
- Set ``Secret-Key`` value in the header of any ongoing request
- The following **EIGHT apis** will be in details below:  

1.  **LIST BUCKETS**
    * _api_: /list-buckets
    * _method_: get
    * _desc_: List all the buckets created on your S3 account
    * _headers_:
        * ``secret-key``: The secret key that authorizes your request
    * _return_: Array of objects of name and creation_date attributes of buckets
        ```
        [{
            "name": "abc", 
            "creation_date": "2014-02-15T03:54:05.000Z"
        }]
        ```
2.  **LIST OBJECTS**
    * _api_: /list-objects/:bucketName
    * _method_: get
    * _desc_: List all the objects of a specific bucket
    * _headers_:
        * ``secret-key``: The secret key that authorizes your request
    * _params_:
        * bucketName: Name of the bucket (Case sensitive)
    * _return_: Objects of bucket name meta data and list of objects of s3 objects
        ```
        {
            "IsTruncated": false,
            "Marker": "",
            "Contents": [{
                "Key": "/path/to/key.jpg",
                "LastModified": "2016-04-25T13:14:07.000Z",
                "ETag": "\"721c7bcc3bab0562818e68c4451c7cca\"",
                "Size": 19139,
                "StorageClass": "STANDARD",
                "Owner": {
                    "DisplayName": "dghijben",
                    "ID": "507ea2bd4b02d43f1c84aa5c599b2cb3e92da92cbe489efadcb11edb05472e14"
                }
            }],
            "Name": "bucketName",
            "Prefix": "",
            "MaxKeys": 1000,
            "CommonPrefixes": []
        }
        ```
3.  **CREATE BUCKET**
    * _api_: /create-bucket
    * _method_: get
    * _desc_: Create a new bucket
    * _headers_:
        * ``secret-key``: The secret key that authorizes your request
    * _query_:
        * bucket: Name of the bucket (Case sensitive)
    * _return_: Response object
4.  **CREATE OBJECT**
    * _api_: /create-object
    * _method_: get
    * _desc_: Create a new object in a specific bucket
    * _headers_:
        * ``secret-key``: The secret key that authorizes your request
    * _query_:
        * bucket: Name of the bucket (Case sensitive)
        * key: Name of the object (Case sensitive, over-rides if exists)
        * bodycontent: Content of the object
    * _return_: Response object
5.  **DELETE BUCKET**
    * _api_: /delete-bucket
    * _method_: get
    * _desc_: Delete an existed bucket
    * _headers_:
        * ``secret-key``: The secret key that authorizes your request
    * _query_:
        * bucket: Name of the bucket (Case sensitive)
    * _return_: Response object
6.  **DELETE OBJECT**
    * _api_: /delete-object
    * _method_: get
    * _desc_: Delete an existed object in a specific bucket
    * _headers_:
        * ``secret-key``: The secret key that authorizes your request
    * _query_:
        * bucket: Name of the bucket (Case sensitive)
        * key: Name of the object (Case sensitive)
    * _return_: Response object
7.  **GET IMAGE**
    * _api_: /get-image
    * _method_: get
    * _desc_: Get an existed object (of type image) in a specific bucket
    * _headers_:
        * ``secret-key``: The secret key that authorizes your request
    * _query_:
        * bucket: Name of the bucket (Case sensitive)
        * key: Name of the object in a form of path (Case sensitive)
    * _return_: Image object (Base64)
8.  **POST IMAGE**
    * _api_: /post-image
    * _method_: post
    * _desc_: Post an object (of type image) in a specific bucket
    * _headers_:
        * ``secret-key``: The secret key that authorizes your request
        * ``resize-img-config``: A stringified array of objects determines the configuration of the original/resized images to be uploaded, that consists of three optional attributes (prefix, width and/or height)
        *       [
                    {
                        //Nulling prefix, width, height means upload as is
                    }, 
                    {
                        "width": 50, //in pixels
                        "height": 50, //inpixels
                        "prefix": "thumb-" //to be prepend to the filename
                    }, 
                    {
                        "width": 100, //Height not set, means auto
                        "prefix": "medium-"
                    }
                ]
        Default: ``[{}]`` that means just upload the original image as is
    * _query_:
        * bucket: Name of the bucket (Case sensitive)
        * imgRelPath: Relative name of the object in a form of relative path that filename, from file in body, will be appended to it (Case sensitive)
    * _body_: Image object (base64)
    * _return_: Array of keys (full path) of images (original and/or resized one) that has/have been uploaded
    
### Run the server

* Double click on the batch file ``start.bat``

## Enjoy!

[MD syntax documentation]: <https://confluence.atlassian.com/bitbucketserver/markdown-syntax-guide-776639995.html>
[Online MD to HTML converter]: <http://dillinger.io/>