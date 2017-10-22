'use strict'

const uuidV4 = require('uuid/v4')
const Promise = require('bluebird')
const AWS = require('aws-sdk')
const s3 = Promise.promisifyAll(
    new AWS.S3({
      region: process.env.REGION || 'us-west-2'
    }))
const s3BaseUrl = 'https://s3-us-west-2.amazonaws.com'

class Storage {
  // Send a list of strings and get back a lists of objects back
  // {url: "", title: "", uploadUrl: ""}
  getPreSignedUrls (bucket, accountId, imageTitles) {
    // Loop over the imageTitles and ge
    return Promise.map(imageTitles, title => {
      const key = `images/${accountId}/${uuidV4()}`
      var params = {Bucket: bucket, Key: key}
      return s3.getSignedUrlAsync('putObject', params)
      .then(response => {
        return {uploadUrl: response, url: `${s3BaseUrl}/${bucket}/${key}`, title: title}
      })
    })
  }
}

module.exports = new Storage()
