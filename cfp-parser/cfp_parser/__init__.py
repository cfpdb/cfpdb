import datetime
import glob
import os
import yaml
import re
from jsonschema import validators
from jsonschema import Draft6Validator

schema2 = {
    "type": "object",
    "definitions": {
        "dates": {
            "type": "array",
            "items": {
                "type": "date"
            },
            "uniqueItems": True,
            "minItems": 1,
            "maxItems": 2
        },
        "ccc": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "abstract":     { "$ref": "#/definitions/dates" },
                    "submit":       { "$ref": "#/definitions/dates" },
                    "notification": { "$ref": "#/definitions/dates" },
                    "rebuttal":     { "$ref": "#/definitions/dates" },
                    },
                "additionalProperties": False
            }
        }
    },
    "properties": {
        "venue": { "type": "string" },
        "year": { "type": "integer" },
        "location": {
            "type": "object",
            "properties": {
                "country": { "type": "string" },
                "state":   { "type": "string" },
                "city":    { "type": "string" },
                "venue":   { "type": "string" },
            }
        },
        "people": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "name": { "type": "string" },
                    "persons": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "affiliation": { "type": ["string", "null"] },
                                "name": { "type": "string" }
                            },
                            "additionalProperties": False
                        }
                    }
                },
                "additionalProperties": False
            }
        },
        "deadlines": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "poster":   { "$ref": "#/definitions/ccc" },
                    "workshop": { "$ref": "#/definitions/ccc" },
                    "tutorial": { "$ref": "#/definitions/ccc" },
                    "wip":      { "$ref": "#/definitions/ccc" },
                    "bof":      { "$ref": "#/definitions/ccc" }
                },
                "patternProperties": {
                    "^paper[0-9]*$": { "$ref": "#/definitions/ccc" },
                },
                "additionalProperties": False
            }
        },
        "topics": {
            "type": "array",
            "items": { "type": "string" }
        },
        "colocated": { "type": "string" },
        "homepage": {
            "type": "string",
            "format": "uri",
            "pattern": "^(https?)://"

        },
        "dates": { "$ref": "#/definitions/dates" },
    },
    "additionalProperties": False,
    "required": [
        "venue",
        "year"
    ]
}

def is_date(checker, instance):
    return isinstance(instance, datetime.date)

def deadline_key(d):
    return int(d.split("deadlines")[1])

def normalize_date(date):
    if isinstance(date, datetime.date):
        return datetime.datetime.combine(date, datetime.datetime.min.time())
    return date

def normalize_dates(dates):
    if isinstance(dates, datetime.date):
        return [normalize_date(dates)]
    return list(map(normalize_date, dates))

def normalize_named_dateset(dateset):
    for key in dateset.keys():
        dateset[key] = normalize_dates(dateset[key])
    return dateset

def normalize_dateset(dateset):
    if isinstance(dateset, dict):
        return normalize_named_dateset(dateset)
    dateset = normalize_dates(dateset)
    assert isinstance(dateset, list)
    return dict(submit = dateset)

def normalize_deadline_set(deadlines_set):
    for key in deadlines_set.keys():
        dateset = deadlines_set[key]
        deadlines_set[key] = normalize_dateset(dateset)

def num_suffix(s):
    m = re.match("^[a-z]+(?P<num>\d+)$", s)
    assert m
    return m.group("num")

def normalize_deadline_phases(deadlines_set):
    result = {}
    normalize = []
    for key in deadlines_set.keys():
        m = re.match("^(?P<type>[a-z]+)\d+$", key)
        if not m:
            result[key] = [deadlines_set[key]]
        else:
            ttype = m.group("type")
            if ttype not in result:
                result[ttype] = [key]
            else:
                result[ttype].append(key)
            normalize.append(ttype)

    for key in normalize:
        assert len(result[key]) > 1
        result[key] = sorted(result[key], key=num_suffix)

    update = {}
    for key in normalize:
        update[key] = list(map(lambda k: deadlines_set[k], result[key]))
    result.update(update)

    return result

def normalize_deadlines(call):
    deadline_sets = filter(lambda k:
            k.startswith("deadlines"), call.keys())
    for key in deadline_sets:
        normalize_deadline_set(call[key])
        call[key] = normalize_deadline_phases(call[key])

def normalize_people(call):
    if "people" in call:
        groups = []
        for group in call.get("people", []):
            people = []
            for person in call["people"][group]:
                people.append(dict(
                    name = person,
                    affiliation = call["people"][group][person]))
            groups.append(dict(
                name = group,
                persons = people))
        call["people"] = groups

def _normalize_call(call, venue):
    call["venue"] = venue

    if "dates" in call:
        call["dates"] = normalize_dates(call["dates"])

    normalize_people(call)
    normalize_deadlines(call)

    deadlines = []
    for key in call.keys():
        if key.startswith("deadlines"):
            deadlines.append(key)

    if deadlines:
        if "deadlines" in deadlines:
            assert len(deadlines) == 1
        else:
            assert len(deadlines) > 1
            deadlines = sorted(deadlines, key=deadline_key)

        update = dict(deadlines = list(map(lambda key: call[key], deadlines)))
        for key in deadlines:
            del call[key]
        assert "deadlines" not in call
        call.update(update)

    return call

def calls(db_path):
    type_checker = Draft6Validator.TYPE_CHECKER.redefine("date", is_date)
    CallValidator = validators.extend(Draft6Validator, type_checker=type_checker)
    validator = CallValidator(schema)
    validator2 = CallValidator(schema2)
    pattern = os.path.join(db_path, "**/*.yaml")
    for path in glob.glob(pattern, recursive=True):
        venue, _ = os.path.split(path)
        db, venue = os.path.split(venue)
        with open(path, "r") as f:
            call = yaml.load(f)
            validator.validate(call)
        nc = _normalize_call(call, venue)
        validator2.validate(nc)
        yield venue, path, nc
