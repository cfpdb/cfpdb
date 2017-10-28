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