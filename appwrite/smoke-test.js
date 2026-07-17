// Smoke test using REST + cookies (the same path the extension uses).
const SESSION_COOKIE = "a_session_work-tracker";
const ENDPOINT = "https://cloud.appwrite.io/v1";
const PROJECT = "work-tracker";

const userPerms = (uid) => [
  `read("user:${uid}")`,
  `update("user:${uid}")`,
  `delete("user:${uid}")`,
];

async function call(path, init = {}) {
  const headers = { "x-appwrite-project": PROJECT, ...(init.headers || {}) };
  if (init.body && !headers["content-type"]) headers["content-type"] = "application/json";
  if (init.sessionCookie) headers["cookie"] = `${SESSION_COOKIE}=${init.sessionCookie}`;
  const res = await fetch(`${ENDPOINT}${path}`, {
    method: init.method || "GET",
    headers,
    body: init.body ? JSON.stringify(init.body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`${init.method || "GET"} ${path} -> ${res.status} ${text}`);
  }
  const cookies = res.headers.getSetCookie();
  return { status: res.status, json: text ? JSON.parse(text) : null, cookies };
}

function extractSessionCookie(cookies) {
  for (const c of cookies) {
    if (c.startsWith(`${SESSION_COOKIE}=`)) {
      const eq = c.indexOf("=");
      const semi = c.indexOf(";", eq);
      return decodeURIComponent(c.substring(eq + 1, semi === -1 ? c.length : semi));
    }
  }
  return null;
}

(async () => {
  const email = `wt-test-${Date.now()}@example.com`;
  const password = "testPass123!";

  // 1. create user
  let r = await call("/account", {
    method: "POST",
    body: { userId: "unique()", email, password, name: "Test" },
  });
  console.log("user created:", r.json.$id, r.json.email);
  const uid = r.json.$id;

  // 2. create session via cookie endpoint
  r = await call("/account/sessions/email", {
    method: "POST",
    body: { email, password },
  });
  const sessionCookie = extractSessionCookie(r.cookies);
  if (!sessionCookie) {
    throw new Error("no session cookie returned");
  }
  console.log("session cookie len:", sessionCookie.length);

  // 3. verify account
  r = await call("/account", { sessionCookie });
  console.log("account ok:", r.json.$id, r.json.email);

  // 4. write to all 4 tables via REST (so we test the same API path the SDK uses)
  r = await call("/tablesdb/work-tracker/tables/projects/rows", {
    method: "POST",
    sessionCookie,
    body: {
      rowId: "unique()",
      data: {
        userId: uid,
        name: "test-project",
        path: "/tmp",
        color: "#2D7DD2",
        isHidden: false,
        isArchived: false,
      },
      permissions: userPerms(uid),
    },
  });
  console.log("project created:", r.json.$id, r.json.name);
  const projectId = r.json.$id;

  r = await call("/tablesdb/work-tracker/tables/heartbeats/rows", {
    method: "POST",
    sessionCookie,
    body: {
      rowId: "unique()",
      data: {
        userId: uid,
        projectId,
        projectName: "test-project",
        entity: "src/main.ts",
        language: "TypeScript",
        branch: "main",
        category: "coding",
        timestamp: new Date().toISOString(),
        durationSeconds: 30,
        isWrite: true,
        linesAdded: 5,
        linesRemoved: 2,
        machineId: "m1",
        editor: "VS Code",
      },
      permissions: userPerms(uid),
    },
  });
  console.log("heartbeat created:", r.json.$id, r.json.entity, r.json.durationSeconds + "s");

  r = await call("/tablesdb/work-tracker/tables/daily_summaries/rows", {
    method: "POST",
    sessionCookie,
    body: {
      rowId: "unique()",
      data: {
        userId: uid,
        date: "2026-07-14",
        projectId,
        projectName: "test-project",
        language: "TypeScript",
        totalSeconds: 120,
        linesAdded: 10,
        linesRemoved: 3,
        sessions: 2,
      },
      permissions: userPerms(uid),
    },
  });
  console.log("daily_summary created:", r.json.$id, r.json.totalSeconds + "s");

  r = await call("/tablesdb/work-tracker/tables/goals/rows", {
    method: "POST",
    sessionCookie,
    body: {
      rowId: "unique()",
      data: {
        userId: uid,
        title: "Daily 2h",
        delta: "day",
        seconds: 7200,
        languages: "TypeScript",
        projects: "",
        isEnabled: true,
        createdAt: new Date().toISOString(),
      },
      permissions: userPerms(uid),
    },
  });
  console.log("goal created:", r.json.$id, r.json.title);

  // 5. verify queries
  const q = JSON.stringify({ method: "equal", attribute: "userId", values: [uid] });
  r = await call(
    `/tablesdb/work-tracker/tables/heartbeats/rows?queries[]=${encodeURIComponent(q)}`,
    { sessionCookie }
  );
  console.log("heartbeats visible to me:", r.json.rows?.length ?? r.json.total);

  // 6. cleanup rows we created
  for (const d of [projectId]) {
    try {
      await call(`/tablesdb/work-tracker/tables/projects/rows/${d}`, {
        method: "DELETE",
        sessionCookie,
      });
    } catch (_) {}
  }
  // 7. sign out
  r = await call("/account/sessions/current", { method: "DELETE", sessionCookie });
  console.log("session deleted");
  // Note: account self-deletion is restricted on some Appwrite projects;
  // the user can do it from the console if needed.
  console.log("ALL OK");
})().catch((e) => {
  console.error("FAIL:", e.message);
  process.exit(1);
});
