// node viewer/resolve.test.mjs
import assert from "node:assert/strict";
import { onSomeDrive } from "./mods/viewer/resolve.mjs";

const disk = (...paths) => (p) => paths.includes(p);
assert.equal(onSomeDrive("/dev/x.ts", "C:\\Users\\me", disk("C:/dev/x.ts", "D:/dev/x.ts")), "C:/dev/x.ts", "the terminal's drive wins");
assert.equal(onSomeDrive("/dev/x.ts", "c:\\Users\\me", disk("D:/dev/x.ts")), "D:/dev/x.ts", "the only other drive with it");
assert.equal(onSomeDrive("/dev/x.ts", "C:\\Users\\me", disk("D:/dev/x.ts", "E:/dev/x.ts")), null, "two other drives: ambiguous");
assert.equal(onSomeDrive("/dev/x.ts", null, disk("E:/dev/x.ts")), "E:/dev/x.ts", "no terminal folder");
assert.equal(onSomeDrive("/dev/x.ts", "C:\\", disk()), null);
console.log("ok");
