const fs = require('fs')
const path = require('path')
const parser = require("../parser.js")

function test_cases(dir) {
  const case_dir = path.join("test", dir)
  return fs.readdirSync(case_dir).map(cname => {
    return path.join(case_dir, cname)
  })
}

test_cases("pass").forEach(fname => {
  test("file " + fname + " parses", function() {
    const data = fs.readFileSync(fname)
    parser(data)
  })
})

test_cases("fail").forEach(fname => {
  test("file " + fname + " doesn't parse", function() {
    const data = fs.readFileSync(fname)
    expect(() => {
      parser(data)
    }).toThrow()
  })
})
