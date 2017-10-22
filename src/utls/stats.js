'use strict'

var DataDog = require('../lib/datadog.js')

class Stats {
  constructor () {
    this.dd = new DataDog(process.env.DATA_DOG_KEY, process.env.DATA_DOG_SECRET)
  }
  addDates (points) {
    return points.map(x => {
      return [Date.now() / 1000, x]
    })
  }

  event (title, text) {
    this.dd.postEvent({
      title: title,
      text: text
    })
  }

  counter (metric, points, tags) {
    this.dd.postSeries({
      series: [{
        metric: metric,
        points: this.addDates(points),
        type: 'counter',
        tags: tags
      }]
    })
  }

  guage (metric, points, tags) {
    this.dd.postSeries({
      series: [{
        metric: metric,
        points: this.addPoints(points),
        type: 'gauge',
        tags: tags
      }]
    })
  }
}

module.exports = Stats
