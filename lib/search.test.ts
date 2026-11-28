import { test } from 'node:test';
import assert from 'node:assert/strict';
import { indexDocuments, normalizeText, searchDocuments } from './search';

const documents = indexDocuments([
    { item: 'jit', fields: [{ value: 'JIT 컴파일', weight: 10 }, { value: 'Just-in-Time Compilation', weight: 8 }] },
    { item: 'first-request', fields: [{ value: '첫 요청 지연', weight: 10 }, { value: 'Ready 뒤 첫 호출이 느리다', weight: 2 }] },
    { item: 'warm-up', fields: [{ value: 'Warm-up', weight: 10 }, { value: '첫 요청 지연을 줄인다', weight: 2 }] },
]);

test('대소문자, 공백 차이를 무시한다', () => {
    assert.equal(normalizeText('  JIT  Compilation '), 'jitcompilation');
    assert.deepEqual(searchDocuments(documents, 'jit').map(({ item }) => item), ['jit']);
    assert.deepEqual(searchDocuments(documents, 'just-in').map(({ item }) => item), ['jit']);
});

test('한국어는 띄어쓰기가 달라도 찾고, 이름이 맞는 쪽을 설명이 맞는 쪽보다 앞에 둔다', () => {
    assert.deepEqual(searchDocuments(documents, '첫요청').map(({ item }) => item), ['first-request', 'warm-up']);
});

test('여러 단어는 모두 들어 있는 문서만 남긴다', () => {
    assert.deepEqual(searchDocuments(documents, '첫 warm').map(({ item }) => item), ['warm-up']);
    assert.deepEqual(searchDocuments(documents, '   '), []);
});
