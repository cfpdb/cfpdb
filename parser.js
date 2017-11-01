const yaml = require('js-yaml')
const Ajv = require('ajv')
const assert = require('assert')

const schema = {
  "type": "object",
  "definitions": {
    "dates": {
      "normalizeDates": true,
      "oneOf": [
        {
          "instanceof": "Date"
        },
        {
          "type": "array",
          "items": {
            "instanceof": "Date"
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
      "normalizeDateSet": true,
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
      "type": "object",
      "properties": {
        "paper":    { "$ref": "#/definitions/dateSet" },
        "poster":   { "$ref": "#/definitions/dateSet" },
        "workshop": { "$ref": "#/definitions/dateSet" },
        "tutorial": { "$ref": "#/definitions/dateSet" },
        "wip":      { "$ref": "#/definitions/dateSet" }
      },
      "additionalProperties": false
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
require('ajv-keywords')(ajv, 'instanceof')

ajv.addKeyword('normalizeDates', {
  modifying: true,
  schema: false,
  valid: true,
  validate: function(data, dataPath, parentData, parentDataProperty) {
    if (data instanceof Date) {
      parentData[parentDataProperty] = [data]
    }
  }
})

ajv.addKeyword('normalizeDateSet', {
  modifying: true,
  schema: false,
  valid: true,
  validate: function(data, dataPath, parentData, parentDataProperty) {
    if (data.constructor === Array) {
      parentData[parentDataProperty] = {"submit": data}
    }
  }
})

const validate = ajv.compile(schema)

module.exports = function(data) {
  const doc = yaml.load(data);
  if (!validate(doc)) {
    console.log(validate.errors)
    assert(false);
  }
  return doc
}
