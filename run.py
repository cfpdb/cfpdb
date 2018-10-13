import cfpdb
import pprint

for call in cfpdb.calls("db"):
    pprint.pprint(call[0])
