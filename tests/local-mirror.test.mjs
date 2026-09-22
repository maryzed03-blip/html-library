import test from 'node:test';
import assert from 'node:assert/strict';
import { safeName, componentFileName, folderParts } from '../src/lib/local-mirror.js';

test('safeName removes Windows-invalid filename characters', () => {
  assert.equal(safeName('  Mail: 4/10 <test>?  '), 'Mail 4-10 test');
});

test('componentFileName stores HTML as a readable .html file', () => {
  assert.equal(componentFileName({ id: 'abc123', name: 'Newsletter Οκτωβρίου' }), 'Newsletter Οκτωβρίου.html');
});

test('folderParts follows the existing nested library structure', () => {
  const folders = [
    { id: 'a', name: 'Newsletters', parentId: null },
    { id: 'b', name: 'Σύλλογος', parentId: 'a' },
  ];
  assert.deepEqual(folderParts(folders, 'b'), ['Newsletters', 'Σύλλογος']);
  assert.deepEqual(folderParts(folders, null), []);
});
