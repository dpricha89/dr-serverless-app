'use strict'

// Third party libs
const Promise = require('bluebird')
const AWS = require('aws-sdk')
const _ = require('lodash')
const dynamodb = Promise.promisifyAll(
    new AWS.DynamoDB.DocumentClient({
      region: process.env.REGION || 'us-west-2'
    }))

// Internal libs
const Helpers = require('./helpers')

class DB {
  constructor () {
    const helpers = new Helpers()
    this.logger = helpers.logs(this.constructor.name)
  }
  // scan returns all items in the table
  scan (table) {
    this.logger.info(`Scanning db table ${table}`)
    return dynamodb.scanAsync({
      TableName: table
    })
    .then(results => {
      return results.Items
    })
  }

    // get one item from the database
  get (table, email) {
    this.logger.info(`Getting user: ${email}`)
    return dynamodb.getAsync({
      TableName: table,
      Key: {
        email: email
      }
    })
    .then(results => {
      return results.Item
    })
  }

  // update db item
  update (table, email, user) {
    this.logger.info(`Updating user: ${email}`)

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
      return results
    })
  }

    // create new user
  put (table, item) {
    this.logger.info(`Putting new db object: ${JSON.stringify(item)}`)
    return dynamodb.putAsync({
      TableName: table,
      Item: item
    })
    .then(() => {
      // return the original object
      return item
    })
  }

  delete (table, email) {
    this.logger.info(`Deleting user with email: ${email}`)
    return dynamodb.deleteAsync({
      TableName: table,
      Key: {
        email: email
      }
    })
    .then(results => {
      return results
    })
  }

  getExperience (table, trips) {
    this.logger.info(`Getting a trips from table: ${table}`)
    // Make sure the trips are unique
    const uniqueExpIds = [...new Set(trips.map(trip => trip.experience_id))]
    const uniqueTrips = uniqueExpIds.map(experienceId => {
      return trips.find(trip => {
        return trip.experience_id === experienceId
      })
    })
    this.logger.info(uniqueTrips)
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
      return results.Responses[table]
    })
  }

  queryExperiences (table, hashValue) {
    this.logger.info(`Running a query on table: ${table} rangeKey: destination
      rangeValue: ${hashValue}`)
    return dynamodb.queryAsync({
      TableName: table,
      KeyConditionExpression: 'destination_id = :hashValue',
      ExpressionAttributeValues: {
        ':hashValue': hashValue
      }
    })
    .then(results => {
      return results.Items
    })
  }

  queryHostExperiences (table, hostId) {
    this.logger.info(`Running a query on table: ${table} rangeKey: host_id
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
      return results.Items
    })
  }

  queryTrips (table, accountId) {
    this.logger.info(`Running a query on table: ${table} rangeKey: account_id
      rangeValue: ${accountId}`)
    return dynamodb.queryAsync({
      TableName: table,
      KeyConditionExpression: 'account_id = :hashValue',
      ExpressionAttributeValues: {
        ':hashValue': accountId
      }
    })
    .then(results => {
      return results.Items
    })
  }

  queryReviews (table, experienceId) {
    this.logger.info(`Running a query on table: ${table} rangeKey: experience_id
      rangeValue: ${experienceId}`)
    return dynamodb.queryAsync({
      TableName: table,
      KeyConditionExpression: 'experience_id = :hashValue',
      ExpressionAttributeValues: {
        ':hashValue': experienceId
      }
    })
      .then(results => {
        return results.Items
      })
  }

  getHost (table, hostId) {
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
      return (results.Items.length > 0) ? _.first(results.Items) : []
    })
  }
}

module.exports = DB
