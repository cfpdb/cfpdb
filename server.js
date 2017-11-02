const fs = require('fs')
const path = require('path')
const express = require('express')
const loki = require('lokijs')
const app = express()
const parser = require('./parser')

const db = new loki()

const calls = db.addCollection('calls')
const targets = db.addCollection('targets')

const db_dir = "db"
fs.readdirSync(db_dir).forEach(cname => {
  const cpath = path.join(db_dir, cname)
  if (fs.lstatSync(cpath).isDirectory()) {
    targets.insert({shortname: cname})
    fs.readdirSync(cpath).forEach(yname => {
      if (yname.endsWith(".yaml")) {
        const ypath = path.join(cpath, yname)
        console.log("loading call: " + ypath)
        const data = fs.readFileSync(ypath)
        const doc = parser(data)
        doc['target'] = cname
        calls.insert(doc)
      }
    })
  }
})

// targets => list all targets
app.get('/targets', function (req, res) {
  res.json(targets.find())
});

// targets/:target => get target
app.get('/targets/:target', function (req, res) {
  const { target } = req.params
  const doc = targets.findOne({ shortname: target })
  res.json(doc)
})

// targets/:target/calls => get target calls
app.get('/targets/:target/calls', function (req, res) {
  const { target } = req.params
  const doc = calls.find({ target: target })
  res.json(doc)
})

app.get('/targets/:target/:year(\\d+)', function (req, res) {
  const { target, year } = req.params
  const doc = calls.findOne({ target: target, year: +year })
  res.json(doc)
})

app.listen(3000, function () {
    console.log('Example app listening on port 3000!')
})
