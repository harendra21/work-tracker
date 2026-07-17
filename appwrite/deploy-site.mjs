import { readFileSync } from "fs";
import { join } from "path";

const ENDPOINT = "https://cloud.appwrite.io/v1";
const PROJECT_ID = "work-tracker";
const SITE_ID = "6a58fa9958b9b0efe407";
const tarPath = join(process.env.TEMP || process.env.TMP || "/tmp", "site-src.tar.gz");
const apiKey = process.env.APPWRITE_API_KEY;

if (!apiKey) {
  console.error("Set APPWRITE_API_KEY");
  process.exit(1);
}

const tarBuffer = readFileSync(tarPath);
console.log(`Uploading ${(tarBuffer.length / 1024).toFixed(0)} KB...`);

const blob = new Blob([tarBuffer], { type: "application/gzip" });
const formData = new FormData();
formData.append("siteId", SITE_ID);

formData.append("code", blob, "site.tar.gz");

const res = await fetch(`${ENDPOINT}/sites/${SITE_ID}/deployments`, {
  method: "POST",
  headers: { "X-Appwrite-Project": PROJECT_ID, "X-Appwrite-Key": apiKey },
  body: formData,
});


const json = await res.json();
if (res.ok) {
  console.log(`Deployment: ${json.$id} | Status: ${json.status}`);
} else {
  console.error("Failed:", JSON.stringify(json, null, 2));
  process.exit(1);
}
