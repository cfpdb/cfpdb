[![Build Status](https://travis-ci.org/cfpdb/cfpdb.svg?branch=ci)](https://travis-ci.org/cfpdb/cfpdb)

The only required element is `year`, which specifies when the event will be
held. The following is the smallest allowed event specification. It describes an
event that will be held in 2018:

```yaml
year: 2018
```

```yaml
# single day
dates: yyyy-mm-dd

# range of days
dates:
  - yyyy-mm-ddd
  - yyyy-mm-ddd
```

```yaml
# paper submission deadline: 2015-09-16
deadlines: 2015-09-16
deadlines:
  submit: 2015-09-16

# paper submission deadline: 2015-09-16
# paper notification: 2015-09-30
deadlines:
  abstract: 2015-09-10
  submit: 2015-09-16
  notification: 2015-09-30

# paper and work-in-process deadlines
deadlines:
  paper:
    submit: 2015-09-16
    notification: 2015-09-30
  wip:
    submit: 2015-11-01
    notification: 2015-11-06
```

types: paper, wip

``` yaml
homepage: url
```

```yaml
# name of another target
colocated: name
```

watch out for nested colons
Alex C. Snoeren: University of California: San Diego
