import assert from 'node:assert/strict';
import { isValidAccessCode } from '../src/lib/access-code.js';
assert.equal(isValidAccessCode('211621166'), true, 'owner code should unlock');
assert.equal(isValidAccessCode('211621165'), false, 'wrong code should stay locked');
assert.equal(isValidAccessCode(' 211621166 '), false, 'code must match exactly');
console.log('access tests passed');
