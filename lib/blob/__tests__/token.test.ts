import { test } from "node:test";
import assert from "node:assert/strict";
import { inspectBlobToken } from "../token";

const GOOD = "vercel_blob_rw_AbC123xyz_s3cr3tPart_with_underscores";

test("a clean key has no problems and yields its store id", () => {
  const r = inspectBlobToken(GOOD);
  assert.deepEqual(r.problems, []);
  assert.equal(r.token, GOOD);
  assert.equal(r.storeId, "AbC123xyz");
});

test("a missing key is reported", () => {
  for (const raw of [undefined, null, "", "   "]) {
    const r = inspectBlobToken(raw);
    assert.equal(r.token, null);
    assert.equal(r.problems.length, 1);
  }
});

test("quotes and whitespace are stripped and reported", () => {
  const r = inspectBlobToken(`  "${GOOD}"\n`);
  assert.equal(r.token, GOOD);
  assert.equal(r.storeId, "AbC123xyz");
  assert.equal(r.problems.length, 2);
  assert.equal(inspectBlobToken(`'${GOOD}'`).token, GOOD);
});

test("a line break inside the key is removed and reported", () => {
  const r = inspectBlobToken(GOOD.slice(0, 20) + "\n" + GOOD.slice(20));
  assert.equal(r.token, GOOD);
  assert.equal(r.problems.length, 1);
});

test("the wrong kind of key is reported", () => {
  assert.equal(inspectBlobToken("vercel_blob_client_abc_def").storeId, null);
  assert.match(inspectBlobToken("vercel_blob_client_abc_def").problems[0], /read-write/);
  assert.match(inspectBlobToken("sk_live_123").problems[0], /doesn't look like/);
});

test("a cut-off key is reported", () => {
  assert.match(inspectBlobToken("vercel_blob_rw_onlystore").problems[0], /cut short/);
});
