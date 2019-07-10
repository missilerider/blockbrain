async function math_number(context) {
  return parseFloat(context.getField('NUM'));
}

module.exports = {
  "math_number": { run: math_number }
}
