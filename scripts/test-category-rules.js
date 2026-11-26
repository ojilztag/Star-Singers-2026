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
console.log('Age/category tests passed: Dec-20 eligibility, Dec-31 category boundaries and invalid DOBs.');
