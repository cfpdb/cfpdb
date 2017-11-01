const yaml = require('js-yaml')
const Ajv = require('ajv')
const assert = require('assert')

// TODO: handling date https://github.com/epoberezkin/ajv-keywords
// TODO: in the short term, just do conversions in the reader and figure out how
// to get ajv to do everything later...
const schema = {
  "type": "object",
  "definitions": {
    "dates": {
      "normalizeDates": true,
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

ajv.addKeyword('normalizeDates', {
  modifying: true,
  schema: false,
  valid: true,
  validate: function(data, dataPath, parentData, parentDataProperty) {
    if (typeof data === 'string') {
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
  const doc = yaml.load(data, {
    schema: yaml.JSON_SCHEMA
  })
  if (!validate(doc)) {
    assert(false);
  }
  return doc
}
