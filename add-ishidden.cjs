const https = require("https");
const apiKey =
  "standard_9e3c07d13c278f78be5474f64d5020ce5facfba04b1fbaf972e874918427d0b014f8c98c67afaec2af6a2d41daf066ea6bb561364241ed7519ee726943ceb02f298337adfc72bb5b5b971725cb9e47d788f0331635d3607c4dd217c157443919807b6c93ad74aa1b96a14ca5d8cbc94f73ffc362e4130e33d7e1cdad0d391dc5";

const req = (method, path, body) =>
  new Promise((resolve) => {
    const data = body ? JSON.stringify(body) : "";
    const headers = { "X-Appwrite-Project": "work-tracker", "X-Appwrite-Key": apiKey };
    if (body) {
      headers["Content-Type"] = "application/json";
      headers["Content-Length"] = Buffer.byteLength(data);
    }
    const r = https.request({ hostname: "cloud.appwrite.io", path, method, headers }, (res) => {
      let b = "";
      res.on("data", (c) => (b += c));
      res.on("end", () => resolve({ status: res.statusCode, body: b }));
    });
    r.on("error", (e) => resolve({ status: 0, body: e.message }));
    if (data) r.write(data);
    r.end();
  });

(async () => {
  // Try PUT on /columns (not POST)
  const paths = [
    "/v1/tablesdb/work-tracker/tables/projects/columns",
    "/v1/tablesdb/work-tracker/tables/projects/columns/isHidden",
    "/v1/tablesdb/work-tracker/tables/projects/columns/boolean/isHidden",
  ];
  const body = { key: "isHidden", type: "boolean", required: true };
  for (const p of paths) {
    const r = await req("POST", p, body);
    console.log("POST", p, "[" + r.status + "]:", r.body.substring(0, 200));
    if (r.status < 400) break;
  }
  // Also try PUT
  for (const p of paths) {
    const r = await req("PUT", p, body);
    console.log("PUT", p, "[" + r.status + "]:", r.body.substring(0, 200));
    if (r.status < 400) break;
  }
})();
