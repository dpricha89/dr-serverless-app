'use strict'

var DataDog = require('./datadog.js')
var dd = new DataDog(process.env.DATA_DOG_KEY, process.env.DATA_DOG_SECRET)

class Stats {
  addDates (points) {
    return points.map(x => {
      return [Date.now() / 1000, x]
    })
  }

  event (title, text) {
    dd.postEvent({
      title: title,
      text: text
    })
  }

  counter (metric, points, tags) {
    dd.postSeries({
      series: [{
        metric: metric,
        points: this.addDates(points),
        type: 'counter',
        tags: tags
      }]
    })
  }

  guage (metric, points, tags) {
    dd.postSeries({
      series: [{
        metric: metric,
        points: this.addPoints(points),
        type: 'gauge',
        tags: tags
      }]
    })
  }
}

module.exports = new Stats()
