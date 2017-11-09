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
  "patternProperties": {
    "^deadlines[0-9]*$": {
      "normalizeDeadlinePhases": true,
      "type": "object",
      "properties": {
        "poster":   { "$ref": "#/definitions/dateSet" },
        "workshop": { "$ref": "#/definitions/dateSet" },
        "tutorial": { "$ref": "#/definitions/dateSet" },
        "wip":      { "$ref": "#/definitions/dateSet" }
      },
      "patternProperties": {
        "^paper[0-9]*$":    { "$ref": "#/definitions/dateSet" },
      },
      "additionalProperties": false
    },
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

ajv.addKeyword('normalizeDeadlinePhases', {
  modifying: true,
  schema: false,
  valid: true,
  validate: function(data, dataPath, parentData, parentDataProperty) {
    var result = {}
    var normalize = []
    for (const prop in data) {
      const res = /^([a-z]+)\d+$/.exec(prop);
      if (res === null) {
        // wrap in array of length 1
        result[prop] = [data[prop]];
      } else {
        const type = res[1]; // e.g. paper, workshop
        if (!(type in result)) {
          result[type] = [prop];
        } else {
          result[type].push(prop);
        }
        normalize.push(type)
      }
    }
    // sort the keys we'll replace
    for (const i in normalize) {
      const key = normalize[i];
      assert(result[key].length > 1);
      result[key].sort(function(a, b) {
        const am = /^[a-z]+([0-9]+)$/.exec(a)
        const bm = /^[a-z]+([0-9]+)$/.exec(b)
        return parseInt(am[1]) - parseInt(bm[1]);
      })
    }
    // do the replacements
    const update = {}
    for (const i in normalize) {
      const key = normalize[i];
      const tmp = result[key].map(function(key2) {
        return data[key2];
      })
      update[key] = tmp;
    }
    Object.assign(result, update)
    parentData[parentDataProperty] = result;
  }
})

const validate = ajv.compile(schema)

module.exports = function(data, quiet = true) {
  const doc = yaml.load(data);
  if (!validate(doc)) {
    if (!quiet) {
      console.log(validate.errors)
    }
    assert(false);
  }
  return doc
}
