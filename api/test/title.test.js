import { test } from "node:test";
import assert from "node:assert/strict";
import { parseTitle } from "../dist/title.js";

test("reads a title", () => {
  assert.equal(parseTitle("<html><title> Hi </title></html>"), "Hi");
});

test("returns null when there is none", () => {
  assert.equal(parseTitle("<html></html>"), null);
});
