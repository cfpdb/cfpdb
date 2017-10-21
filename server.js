const fs = require('fs')
const path = require('path')
const yaml = require('js-yaml')
const express = require('express')
const loki = require('lokijs')
const app = express()

const db = new loki()
const calls = db.addCollection('calls')

const db_dir = "db"
fs.readdirSync(db_dir).forEach(cname => {
  const cpath = path.join(db_dir, cname)
  if (fs.lstatSync(cpath).isDirectory()) {
    fs.readdirSync(cpath).forEach(yname => {
      if (yname.endsWith(".yaml")) {
        const ypath = path.join(cpath, yname)
        console.log("loading call: " + ypath)
        const data = fs.readFileSync(ypath)
        const doc = yaml.load(data)
        doc['call'] = cname
        calls.insert(doc)
      }
    })
  }
})

app.get('/:call/:year(\\d+)', function (req, res) {
  const { call, year } = req.params
  const doc = calls.findOne({ call: call, year: +year })
  res.send(doc)
})

app.listen(3000, function () {
    console.log('Example app listening on port 3000!')
})
