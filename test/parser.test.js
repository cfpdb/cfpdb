describe('xcall parser', () => {
  test('empty', () => {
    expect(true).toBe(true)
  });
})

describe("hello", () => {
  var tests = [1, 2]
  tests.forEach(function(test) {
    it("what " + test, function() {
      expect(true).toBe(true)
    })
  })
})

var tests = [1, 2]
tests.forEach(function(testx) {
  test("what " + testx, function() {
    expect(true).toBe(true)
  })
})
