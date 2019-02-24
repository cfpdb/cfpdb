import glob
import datetime
import json
import yaml
import pytest
from jsonschema import validators
from jsonschema import Draft6Validator

def is_date(checker, instance):
    return isinstance(instance, datetime.date)

type_checker = Draft6Validator.TYPE_CHECKER.redefine("date", is_date)
CallValidator = validators.extend(Draft6Validator, type_checker=type_checker)

with open("schema.json", "r") as fp:
    schema = json.load(fp)

validator = CallValidator(schema)

@pytest.mark.parametrize("cfp_path",
    glob.glob("db/**/*.yaml", recursive=True))
def test_cfp_schema(cfp_path):
    with open(cfp_path, "r") as fp:
        cfp = yaml.load(fp)
        validator.validate(cfp)
