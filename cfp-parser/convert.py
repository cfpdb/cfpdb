import sys
import os
import json
import cfp_parser as cfps

for venue, source, info in cfps.calls(sys.argv[1]):
    venue_dir = os.path.join(sys.argv[2], venue)
    if not os.path.exists(venue_dir):
        os.makedirs(venue_dir)
        call_fn = "{}.json".format(info["year"])
        call_fn = os.path.join(venue_dir, call_fn)
        with open(call_fn, "w") as f:
            f.write(json.dumps(info, indent=2, default=str))
