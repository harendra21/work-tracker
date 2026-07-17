// End-to-end test: exercises the full auth + data flow that the
// extension uses, against the live Appwrite project. Validates that
// the schema, permissions, and code path are all wired correctly.

const ENDPOINT = "https://cloud.appwrite.io/v1";
const PROJECT = "work-tracker";
const SESSION_COOKIE = "a_session_work-tracker";

const userPerms = (uid) => [
  `read("user:${uid}")`,
  `update("user:${uid}")`,
  `delete("user:${uid}")`,
];

let cookie = null;

async function call(path, init = {}) {
  const headers = { "x-appwrite-project": PROJECT, ...(init.headers || {}) };
  if (init.body && !headers["content-type"]) headers["content-type"] = "application/json";
  if (cookie) headers["cookie"] = `${SESSION_COOKIE}=${cookie}`;
  const res = await fetch(`${ENDPOINT}${path}`, {
    method: init.method || "GET",
    headers,
    body: init.body ? JSON.stringify(init.body) : undefined,
  });
  const text = await res.text();
  if (!res.ok && init.expect !== false) {
    throw new Error(`${init.method || "GET"} ${path} -> ${res.status} ${text}`);
  }
  const setCookies = res.headers.getSetCookie();
  for (const c of setCookies) {
    if (c.startsWith(`${SESSION_COOKIE}=`)) {
      const eq = c.indexOf("=");
      const semi = c.indexOf(";", eq);
      cookie = decodeURIComponent(c.substring(eq + 1, semi === -1 ? c.length : semi));
    }
  }
  return { status: res.status, json: text ? JSON.parse(text) : null };
}

function assert(cond, msg) {
  if (!cond) throw new Error("ASSERT FAILED: " + msg);
}

async function main() {
  const email = `wt-e2e-${Date.now()}@example.com`;
  const password = "e2ePass123!";

  console.log("→ sign up");
  let r = await call("/account", {
    method: "POST",
    body: { userId: "unique()", email, password, name: "E2E" },
  });
  const uid = r.json.$id;
  assert(r.json.email === email, "email mismatch");

  console.log("→ sign in (cookie flow)");
  r = await call("/account/sessions/email", {
    method: "POST",
    body: { email, password },
  });
  assert(cookie && cookie.length > 100, "session cookie not captured");

  console.log("→ account.get");
  r = await call("/account");
  assert(r.json.$id === uid, "uid mismatch");
  assert(r.json.email === email, "email mismatch after login");

  console.log("→ create project");
  r = await call("/tablesdb/work-tracker/tables/projects/rows", {
    method: "POST",
    body: {
      rowId: "unique()",
      data: {
        userId: uid,
        name: "demo",
        path: "/repo",
        color: "#2D7DD2",
        isHidden: false,
        isArchived: false,
      },
      permissions: userPerms(uid),
    },
  });
  const projectId = r.json.$id;
  assert(r.json.name === "demo", "project name mismatch");

  console.log("→ query project by userId");
  const q1 = JSON.stringify({ method: "equal", attribute: "userId", values: [uid] });
  r = await call(`/tablesdb/work-tracker/tables/projects/rows?queries[]=${encodeURIComponent(q1)}`);
  assert(r.json.rows.length === 1, `expected 1 project, got ${r.json.rows.length}`);
  assert(r.json.rows[0].$id === projectId, "row mismatch");

  console.log("→ create heartbeats");
  for (let i = 0; i < 3; i++) {
    r = await call("/tablesdb/work-tracker/tables/heartbeats/rows", {
      method: "POST",
      body: {
        rowId: "unique()",
        data: {
          userId: uid,
          projectId,
          projectName: "demo",
          entity: `src/file${i}.ts`,
          language: "TypeScript",
          branch: "main",
          category: "coding",
          timestamp: new Date(Date.now() - i * 60_000).toISOString(),
          durationSeconds: 60,
          isWrite: i === 0,
          linesAdded: i,
          linesRemoved: 0,
          machineId: "m1",
          editor: "VS Code",
        },
        permissions: userPerms(uid),
      },
    });
  }

  console.log("→ query heartbeats by userId, order by timestamp desc");
  const q2 = JSON.stringify({ method: "equal", attribute: "userId", values: [uid] });
  const q3 = JSON.stringify({ method: "orderDesc", attribute: "timestamp" });
  const q4 = JSON.stringify({ method: "limit", values: [10] });
  r = await call(
    `/tablesdb/work-tracker/tables/heartbeats/rows?queries[]=${encodeURIComponent(q2)}&queries[]=${encodeURIComponent(q3)}&queries[]=${encodeURIComponent(q4)}`
  );
  assert(r.json.rows.length === 3, `expected 3 heartbeats, got ${r.json.rows.length}`);
  assert(r.json.rows[0].entity === "src/file0.ts", "most recent heartbeat wrong");

  console.log("→ create goal");
  r = await call("/tablesdb/work-tracker/tables/goals/rows", {
    method: "POST",
    body: {
      rowId: "unique()",
      data: {
        userId: uid,
        title: "Daily 2h",
        delta: "day",
        seconds: 7200,
        languages: "TypeScript,JavaScript",
        projects: "",
        isEnabled: true,
        createdAt: new Date().toISOString(),
      },
      permissions: userPerms(uid),
    },
  });
  assert(r.json.title === "Daily 2h", "goal title mismatch");

  console.log("→ sign out");
  r = await call("/account/sessions/current", { method: "DELETE" });

  console.log("→ verify session is dead");
  await call("/account", { expect: false }).then((r) => {
    assert(r.status === 401, "expected 401 after signout, got " + r.status);
  });

  console.log("✅ ALL OK");
}

main().catch((e) => {
  console.error("❌", e.message);
  process.exit(1);
});
