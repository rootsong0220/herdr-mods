// node updates/versions.test.mjs
import assert from "node:assert/strict";
import { newer, latestTag } from "./mods/updates/versions.js";

assert.equal(newer("v0.10.0", "v0.9.3"), true);
assert.equal(newer("v1.0.0", "v1.0.0"), false);
assert.equal(newer("v0.2.0", "v0.10.0"), false);
assert.equal(newer("v0.2.0", "garbage"), false);
const out = "a1\trefs/tags/v0.2.0\nb2\trefs/tags/v0.10.0\nc3\trefs/tags/v1.0.0-rc1\nd4\trefs/tags/v0.9.9\n";
assert.equal(latestTag(out), "v0.10.0");
assert.equal(latestTag(""), null);
console.log("ok");
