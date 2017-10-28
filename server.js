const fs = require('fs')
const path = require('path')
const yaml = require('js-yaml')
const express = require('express')
const loki = require('lokijs')
const Ajv = require('ajv')
const assert = require('assert')
const app = express()

// TODO: handling date https://github.com/epoberezkin/ajv-keywords
// TODO: in the short term, just do conversions in the reader and figure out how
// to get ajv to do everything later...
const schema = {
  "type": "object",
  "definitions": {
    "dates": {
      "oneOf": [
        {
          "type": "string",
          "format": "date"
        },
        {
          "type": "array",
          "items": {
            "type": "string",
            "format": "date"
          },
          "uniqueItems": true,
          "minItems": 2
        }
      ]
    },
    "namedDateSet": {
      "type": "object",
      "properties": {
        "abstract":     { "$ref": "#/definitions/dates" },
        "submit":       { "$ref": "#/definitions/dates" },
        "notification": { "$ref": "#/definitions/dates" },
        "rebuttal":     { "$ref": "#/definitions/dates" },
      },
      "additionalProperties": false
    },
    "dateSet": {
      "oneOf": [
        { "$ref": "#/definitions/dates" },
        { "$ref": "#/definitions/namedDateSet" }
      ]
    }
  },
  "properties": {
    "year": {
      "type": "integer"
    },
    "dates": { "$ref": "#/definitions/dates" },
    "deadlines": {
      "oneOf": [
        { "$ref": "#/definitions/namedDateSet" },
        {
          "type": "object",
          "properties": {
            "paper":    { "$ref": "#/definitions/dateSet" },
            "poster":   { "$ref": "#/definitions/dateSet" },
            "workshop": { "$ref": "#/definitions/dateSet" },
            "tutorial": { "$ref": "#/definitions/dateSet" },
            "wip":      { "$ref": "#/definitions/dateSet" }
          },
          "additionalProperties": false
        }
      ]
    },
    "location": {
      "type": "object",
      "properties": {
        "country": { "type": "string" },
        "state":   { "type": "string" },
        "city":    { "type": "string" },
        "venue":   { "type": "string" },
      }
    },
    "homepage": {
      "type": "string",
      "format": "url"
    },
    "colocated": { "type": "string" }
  },
  "additionalProperties": false,
  "required": [
    "year"
  ]
}

const ajv = new Ajv({ allErrors: true, verbose: true });
const validate = ajv.compile(schema)

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
        const doc = yaml.load(data, {
          schema: yaml.JSON_SCHEMA
        })

        if (!validate(doc)) {
          console.log(validate.errors);
          assert(false);
        }

        // normalize deadlines
        //   1. convert bare date to { submit: date }
        for (key in doc.deadlines) {
          const val = doc.deadlines[key]
          if (val instanceof Date) {
            doc.deadlines[key] = {
              submit: val
            }
          }
        }

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
