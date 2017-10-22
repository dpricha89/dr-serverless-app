'use strict'

// libraries
const Promise = require('bluebird')
const AWS = require('aws-sdk')
const _ = require('underscore')
const dynamodb = Promise.promisifyAll(
    new AWS.DynamoDB.DocumentClient({
      region: process.env.REGION || 'us-west-2'
    }))
const stats = require('./stats.js')
const utls = require('./utls.js')
const log = utls.logs('db')

class DB {
    // scan returns all items in the table
  scan (table) {
    stats.counter(`${utls.stage()}.db.scan.try`, [1], ['db', 'scan'])
    log.info(`Scanning db table ${table}`)
    return dynamodb.scanAsync({
      TableName: table
    })
    .then(results => {
      stats.counter(`${utls.stage()}.db.scan.complete`, [1], ['db', 'scan'])
      return results.Items
    })
  }

    // get one item from the database
  get (table, email) {
    stats.counter(`${utls.stage()}.db.get.try`, [1], ['db', 'get'])
    log.info(`Getting user: ${email}`)
    return dynamodb.getAsync({
      TableName: table,
      Key: {
        email: email
      }
    })
    .then(results => {
      stats.counter(`${utls.stage()}.db.get.complete`, [1], ['db', 'get'])
      return results.Item
    })
  }

    // update db item
  update (table, email, user) {
    stats.counter(`${utls.stage()}.db.update.try`, [1], ['db', 'update'])
    log.info(`Updating user: ${email}`)

    // generate the correct update expression
    // in the wierd dynamo style
    let UpdateExpressions = []
    let ExpressionAttributeNames = {}
    let ExpressionAttributeValues = {}
    _.each(_.keys(user), x => {
      UpdateExpressions.push(`#${x} = :${x}`)
      ExpressionAttributeNames[`#${x}`] = x
      ExpressionAttributeValues[`:${x}`] = user[x]
    })

        // send updates
        // remove trailing comma from update expression
    return dynamodb.updateAsync({
      TableName: table,
      Key: {
        email: email
      },
      ReturnValues: 'UPDATED_NEW',
      UpdateExpression: `SET ${UpdateExpressions.join(', ')}`,
      ExpressionAttributeNames: ExpressionAttributeNames,
      ExpressionAttributeValues: ExpressionAttributeValues
    })
    .then(results => {
      stats.counter(`${utls.stage()}.db.update.complete`, [1], ['db', 'update'])
      return results
    })
  }

    // create new user
  put (table, item) {
    stats.counter(`${utls.stage()}.db.put.try`, [1], ['db', 'put'])
    log.info(`Putting new db object: ${JSON.stringify(item)}`)
    return dynamodb.putAsync({
      TableName: table,
      Item: item
    })
    .then(() => {
      // return the original object
      stats.counter(`${utls.stage()}.db.put.complete`, [1], ['db', 'put'])
      return item
    })
  }

  delete (table, email) {
    stats.counter(`${utls.stage()}.db.delete.try`, [1], ['db', 'delete'])
    log.info(`Deleting user with email: ${email}`)
    return dynamodb.deleteAsync({
      TableName: table,
      Key: {
        email: email
      }
    })
    .then(results => {
      stats.counter(`${utls.stage()}.db.delete.complete`, [1], ['db', 'delete'])
      return results
    })
  }

  getExperience (table, trips) {
    stats.counter(`${utls.stage()}.db.get.experience.try`, [1], ['db', 'get', 'experience'])
    log.info(`Getting a trips from table: ${table}`)
    // Make sure the trips are unique
    const uniqueExpIds = [...new Set(trips.map(trip => trip.experience_id))]
    const uniqueTrips = uniqueExpIds.map(experienceId => {
      return trips.find(trip => {
        return trip.experience_id === experienceId
      })
    })
    log.info(uniqueTrips)
    var requestedItems = {}
    requestedItems[table] = {
      Keys: []
    }
    requestedItems[table].Keys = uniqueTrips.map(trip => {
      return {
        id: trip.experience_id,
        destination_id: trip.destination_id
      }
    })
    return dynamodb.batchGetAsync({
      RequestItems: requestedItems
    })
    .then(results => {
      console.log('results', results)
      stats.counter(`${utls.stage()}.db.get.experience.complete`, [1], ['db', 'complete', 'experience'])
      return results.Responses[table]
    })
  }

  queryExperiences (table, hashValue) {
    stats.counter(`${utls.stage()}.db.query.experience.try`, [1], ['db', 'query', 'experience'])
    log.info(`Running a query on table: ${table} rangeKey: destination
      rangeValue: ${hashValue}`)
    return dynamodb.queryAsync({
      TableName: table,
      KeyConditionExpression: 'destination_id = :hashValue',
      ExpressionAttributeValues: {
        ':hashValue': hashValue
      }
    })
    .then(results => {
      stats.counter(`${utls.stage()}.db.query.experience.complete`, [1], ['db', 'query', 'experience'])
      return results.Items
    })
  }

  queryHostExperiences (table, hostId) {
    stats.counter(`${utls.stage()}.db.query.hosts.experience.try`, [1], ['db', 'query', 'hosts', 'experience'])
    log.info(`Running a query on table: ${table} rangeKey: host_id
      rangeValue: ${hostId}`)
    return dynamodb.queryAsync({
      TableName: table,
      IndexName: 'host_id',
      KeyConditionExpression: 'host_id = :hostId',
      ExpressionAttributeValues: {
        ':hostId': hostId
      }
    })
    .then(results => {
      stats.counter(`${utls.stage()}.db.query.hosts.experience.complete`, [1], ['db', 'query', 'hosts', 'experience'])
      return results.Items
    })
  }

  queryTrips (table, accountId) {
    stats.counter(`${utls.stage()}.db.query.trips.try`, [1], ['db', 'query', 'trips'])
    log.info(`Running a query on table: ${table} rangeKey: account_id
      rangeValue: ${accountId}`)
    return dynamodb.queryAsync({
      TableName: table,
      KeyConditionExpression: 'account_id = :hashValue',
      ExpressionAttributeValues: {
        ':hashValue': accountId
      }
    })
    .then(results => {
      stats.counter(`${utls.stage()}.db.query.trips.complete`, [1], ['db', 'query', 'trips'])
      return results.Items
    })
  }

  queryReviews (table, experienceId) {
    stats.counter(`${utls.stage()}.db.query.reviews.try`, [1], ['db', 'query', 'reviews'])
    log.info(`Running a query on table: ${table} rangeKey: experience_id
      rangeValue: ${experienceId}`)
    return dynamodb.queryAsync({
      TableName: table,
      KeyConditionExpression: 'experience_id = :hashValue',
      ExpressionAttributeValues: {
        ':hashValue': experienceId
      }
    })
      .then(results => {
        stats.counter(`${utls.stage()}.db.query.reviews.complete`, [1], ['db', 'query', 'reviews'])
        return results.Items
      })
  }

  getHost (table, hostId) {
    stats.counter(`${utls.stage()}.db.query.host.try`, [1], ['db', 'query', 'host'])
    return dynamodb.queryAsync({
      TableName: table,
      IndexName: 'host_id',
      Select: 'SPECIFIC_ATTRIBUTES',
      ProjectionExpression: ['id', 'host_description', 'imageUrl', 'host_title', 'firstname', 'lastname'],
      KeyConditionExpression: 'id = :hostId',
      ExpressionAttributeValues: {
        ':hostId': hostId
      }
    })
    .then(results => {
      stats.counter(`${utls.stage()}.db.query.host.complete`, [1], ['db', 'query', 'host'])
      return (results.Items.length > 0) ? _.first(results.Items) : []
    })
  }
}

module.exports = new DB()
