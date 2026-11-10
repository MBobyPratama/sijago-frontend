const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const { NextRequest } = require("next/server");

function load(file, dependencies = {}, globals = {}) {
  const context = { exports: {}, require: name => name in dependencies ? dependencies[name] : require(name), ...globals };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, context);
  return context.exports;
}
const policy = load("src/lib/auth-types.ts");
const env = { publicEnv: { apiBaseUrl: "http://backend.test/v1" } };
let user = null, fail = false;
const fetchSession = async () => {
  if (fail) throw new Error("Backend unavailable");
  return { ok: Boolean(user), json: async () => ({ success: Boolean(user), data: { user } }) };
};
const middleware = load("src/middleware.ts", { "./lib/env": env, "./lib/auth-types": policy }, { URL, Headers, AbortSignal, fetch: fetchSession });
class Redirect extends Error { constructor(url) { super(url); this.url = url; } }
const server = load("src/lib/auth-server.ts", {
  "server-only": {}, "./env": env, "./auth-types": policy,
  "next/headers": { cookies: async () => ({ get: () => ({ value: "a".repeat(64) }) }), headers: async () => ({ get: () => "/admin/audit" }) },
  "next/navigation": { redirect: url => { throw new Redirect(url); } },
}, { AbortSignal, fetch: fetchSession });

(async () => {
  assert.ok(middleware.config.matcher.includes("/theme-guide/:path*"));
  const anonymous = await middleware.middleware(new NextRequest("http://localhost/theme-guide"));
  assert.ok(anonymous.headers.get("location").includes("/login?next=%2Ftheme-guide"));
  for (const role of ["ADMIN", "SUPER_ADMIN", "AUDITOR", "PETUGAS_INSTANSI"]) {
    user = { id: "test-user", role };
    const allowed = role === "ADMIN" || role === "SUPER_ADMIN";
    for (const path of ["/theme-guide", "/theme-guide/", "/theme-guide?tab=colors"]) assert.equal(policy.canAccessPortalPath(user, path), allowed);
    assert.equal(policy.safeLoginDestination("/theme-guide", user) === "/theme-guide", allowed);
    const response = await middleware.middleware(new NextRequest("http://localhost/theme-guide", { headers: { cookie: "sijago_session=" + "a".repeat(64) } }));
    if (allowed) {
      assert.equal(response.headers.get("x-middleware-next"), "1");
      assert.equal(await server.requirePortalUser("admin", "/theme-guide"), user);
    } else {
      assert.equal(new URL(response.headers.get("location")).pathname, policy.homeForUser(user));
      await assert.rejects(server.requirePortalUser("admin", "/theme-guide"), error => error instanceof Redirect && error.url === policy.homeForUser(user));
    }
  }
  fail = true;
  const unavailable = await middleware.middleware(new NextRequest("http://localhost/theme-guide", { headers: { cookie: "sijago_session=" + "a".repeat(64) } }));
  assert.equal(new URL(unavailable.headers.get("location")).pathname, "/login");
  await assert.rejects(server.requirePortalUser("admin", "/theme-guide"), error => error instanceof Redirect && error.url.startsWith("/login?next="));
  const layout = fs.readFileSync("src/app/theme-guide/layout.tsx", "utf8");
  assert.ok(layout.includes('await requirePortalUser("admin", "/theme-guide")'));
  console.log("PASS theme guide: anonymous redirect, ADMIN/SUPER_ADMIN access, agency/auditor denial, login return path, server layout guard and fail-closed session validation. No real accounts or data changed.");
})().catch(error => { console.error(error); process.exitCode = 1; });
