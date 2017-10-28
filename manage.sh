#!/bin/bash
set -e

function add_call() {
  local target=$1
  local year=$2
  mkdir -p db/${target}
  sed "s/YYYY/${year}/g" db/call.yaml.tmpl | tee \
    db/${target}/${target}${year}.yaml
}

add_call $1 $2
