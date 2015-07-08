var debug = require('trace-debug-log')
var _ = require('lodash')
var diffChars = require('diff').diffChars

module.exports = function _diffCompare(original_text, compare_text, opts) {
  opts = opts || {}
  var threshold = opts.threshold || 0.8

  var results = []
  var annotations = [{
      omissions: [],
      changes: [],
      inert: []
    }, {
      additions: [],
      changes: [],
      inert: []
    }]
    // Omissions and changes, original_text > compare_text
  _.forEach(original_text, function _forEachOriginal(line, index) {
      if (line !== compare_text[index]) {
        var offset = 0
        var found = false
        for (var i = index; i < original_text.length; i++) {

          // simple omission check

          if (!found && original_text[i] === compare_text[index]) { // found exact match
            found = true
            for (var ii = 0; ii < offset; ii++) {
              compare_text.splice(index, 0, '');
              annotations[0].omissions.push(index + ii)
              annotations[1].inert.push(index + ii)
            }
          }
          else if (!found && _isChange(original_text[i], compare_text[index],threshold)) { // found changed line
            found = true
            annotations[0].changes.push(index + offset)
            annotations[1].changes.push(index + offset)
          }
          else if (!found && original_text[i] !== compare_text[index]) { // increment offset and continue searching
            offset++
          }
        }
      }
    })
    // Additions + changes, original_text > compare_text
  _.forEach(compare_text, function _forEachCompare(line, index) {
    if (line !== original_text[index]) {
      var offset = 0
      var found = false
      for (var i = index; i < compare_text.length; i++) {
        // simple addition check
        if (!found && compare_text[i] === original_text[index]) { // found exact match
          found = true
          for (var ii = 0; ii < offset; ii++) {
            original_text.splice(index, 0, '');
            annotations[1].additions.push(index + ii)
            annotations[0].inert.push(index + ii)
          }
        }
        else if (!found && _isChange(compare_text[i], original_text[index],threshold)) { // found changed line
          found = true
          console.log('a change found!')
          annotations[0].changes.push(index + offset)
          annotations[1].changes.push(index + offset)
        }
        else if (!found && compare_text[i] !== original_text[index]) { // increment offset and continue searching
          offset++
        }
      }
    }
  })
  annotations[0].changes = _.uniq(annotations[0].changes)
  annotations[1].changes = _.uniq(annotations[1].changes)
  console.log(annotations)
  return {
    results: [original_text, compare_text],
    annotations: annotations
  }
}

function _isChange(original_line, compare_line, threshold) {

  // diff check
  var diff = diffChars(original_line, compare_line)

  var addLength = 0
  var omitLength = 0

  var additions = _.filter(diff, {added:true})
  if(additions.length){
    additions = _.pluck(additions,'value').join('')
    addLength = additions.length
  }
  var omissions = _.filter(diff, {removed:true})
  if(omissions.length){
    omissions = _.pluck(omissions,'value').join('')
    omitLength = omissions.length
  }
  var changeRate = (addLength+omitLength)/(original_line.length+compare_line.length)
  return changeRate < threshold
}
