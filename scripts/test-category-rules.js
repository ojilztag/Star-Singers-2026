#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync('Code.gs', 'utf8');
const match = source.match(/function calculateAgeCategory_\\(dobText\\)\\s*\\{[\\s\\S]*?\\n\\}/);
assert.ok(match, 'calculateAgeCategory_ must exist in Code.gs');
const context = {};
vm.runInNewContext(match[0], context);
const calc = context.calculateAgeCategory_;
const cases = [
  ['2021-12-31', 5, 'Junior'],
  ['2009-12-31', 17, 'Junior'],
  ['2008-12-31', 18, 'Senior'],
  ['1987-12-31', 39, 'Senior'],
  ['1986-12-31', 40, 'Super Senior'],
  ['1900-01-01', 126, 'Super Senior']
];
for (const [dob, age, category] of cases) {
  const result = calc(dob);
  assert.equal(result.age, age, 'age mismatch for ' + dob);
  assert.equal(result.category, category, 'category mismatch for ' + dob);
}
for (const dob of ['2022-01-01', '2027-01-01', '2001-02-29', 'not-a-date', '']) {
  assert.throws(() => calc(dob), undefined, 'invalid DOB must be rejected: ' + dob);
}
console.log('Age-category boundary tests passed: ' + cases.length + ' valid DOBs and 5 invalid DOBs.');
