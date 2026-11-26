#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync('Code.gs', 'utf8');
const match = source.match(/function calculateAgeCategory_\(dobText,gender\)\s*\{[\s\S]*?\n\}/);
assert.ok(match, 'calculateAgeCategory_ must exist in Code.gs');
const context = {getRegistrationClosingDate_:()=>({text:'2026-12-31',year:2026,month:12,day:31,date:new Date(Date.UTC(2026,11,31))})};
vm.runInNewContext(match[0], context);
const calc = context.calculateAgeCategory_;
const cases = [['2016-12-20',10,'Junior'],['2009-12-31',17,'Junior'],['2008-12-31',18,'Senior'],['1982-12-31',44,'Senior'],['1981-12-31',45,'Super Senior']];
for (const [dob,age,category] of cases) {const result=calc(dob,'Female');assert.equal(result.age,age,'age mismatch '+dob);assert.equal(result.category,category,'category mismatch '+dob);}
for (const dob of ['2016-12-21','2017-01-01','2027-01-01','2001-02-29','not-a-date','']) assert.throws(()=>calc(dob,'Male'),undefined,'DOB should be rejected '+dob);

// Regression coverage for dashboard count keys and category-card search filters.
for (const name of ['normalizeGender_','categoryFilterKey_','matchesCategoryFilter_','normalizeDobValue_']) {
  const helper = source.match(new RegExp('function '+name+'\\([^\\n]*\\)\\s*\\{[\\s\\S]*?\\n\\}'));
  assert.ok(helper, name+' must exist in Code.gs');
  vm.runInNewContext(helper[0], context);
}
const row = (gender,dob)=>Array(28).fill('').map((v,i)=>i===24?gender:i===25?dob:v);
const divisions = [
  ['Female','2016-12-20','female-junior'],
  ['Male','2016-12-20','male-junior'],
  ['Female','2008-12-31','female-senior'],
  ['Male','2008-12-31','male-senior'],
  ['Female','1981-12-31','female-super-senior'],
  ['Male','1981-12-31','male-super-senior']
];
for (const [gender,dob,filter] of divisions) {
  const record=row(gender,dob);
  assert.equal(context.categoryFilterKey_(record),filter,'dashboard key mismatch '+filter);
  assert.equal(context.matchesCategoryFilter_(record,filter),true,'search filter mismatch '+filter);
}
assert.equal(context.categoryFilterKey_(row('female','2016-12-20')),'female-junior','lowercase gender should normalize');
assert.equal(context.matchesCategoryFilter_(row('Female','2016-12-20'),'FEMALE-JUNIOR'),true,'filter should be case-insensitive');
assert.equal(context.categoryFilterKey_(row('Other','2016-12-20')),'','invalid gender must not be inferred');
assert.equal(context.categoryFilterKey_(row('Female','2016-12-21')),'','ineligible DOB must not be counted');
console.log('Age/category tests passed: eligibility cutoff, all six divisions, case-insensitive gender/filter handling, super-senior spacing and invalid DOBs.');

