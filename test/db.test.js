const fs = require('fs')
const path = require('path')
const parser = require("../parser.js")

test("parse database", function() {
  const db_dir = "db"
  fs.readdirSync(db_dir).forEach(cname => {
    const cpath = path.join(db_dir, cname)
    if (fs.lstatSync(cpath).isDirectory()) {
      fs.readdirSync(cpath).forEach(yname => {
        if (yname.endsWith(".yaml")) {
          const ypath = path.join(cpath, yname)
          const data = fs.readFileSync(ypath)
          const doc = parser(data, false)
        }
      })
    }
  })
})
