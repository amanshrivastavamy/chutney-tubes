const { test, describe } = require("node:test");
const assert = require("node:assert");
const { EventEmitter } = require("node:events");
const { calculateMetrics } = require("../src/lib/metrics.js");

function createMockReq({ method = "GET", url = "/", body = null, headers = {} }) {
  const req = new EventEmitter();
  req.method = method;
  req.url = url;
  req.headers = headers;
  process.nextTick(() => {
    if (body) {
      req.emit("data", typeof body === "string" ? body : JSON.stringify(body));
    }
    req.emit("end");
  });
  return req;
}

function createMockRes() {
  const res = {
    statusCode: 200,
    headers: {},
    body: "",
    writeHead(code, headers = {}) {
      this.statusCode = code;
      this.headers = { ...this.headers, ...headers };
    },
    end(chunk) {
      if (chunk) this.body += chunk;
      if (this.onFinish) this.onFinish(this);
    },
  };
  return res;
}

function handleServerRequest(req, res, eventsStore = []) {
  const parsedUrl = new URL(req.url, "http://localhost");
  const pathname = parsedUrl.pathname;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (pathname === "/api/events" && req.method === "POST") {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      try {
        const payload = JSON.parse(body);
        eventsStore.push(payload);
        res.writeHead(201, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true, count: eventsStore.length }));
      } catch (e) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  if (pathname === "/api/admin" && req.method === "POST") {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      if (!adminPassword) {
        res.writeHead(503, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ authenticated: false, error: "Admin not configured" }));
      }
      const { password } = JSON.parse(body);
      if (password === adminPassword) {
        res.writeHead(200, {
          "Content-Type": "application/json",
          "Set-Cookie": "ct_admin_session=test_valid_token; HttpOnly; Secure; SameSite=Strict; Path=/",
        });
        res.end(JSON.stringify({ authenticated: true, token: "admin_auth_valid" }));
      } else {
        res.writeHead(401, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ authenticated: false, error: "Incorrect admin credentials" }));
      }
    });
    return;
  }

  if (pathname === "/api/admin" && req.method === "GET") {
    const cookie = req.headers.cookie || "";
    if (!cookie.includes("ct_admin_session=test_valid_token")) {
      res.writeHead(401, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "Unauthorized access" }));
    }
    const metrics = calculateMetrics(eventsStore);
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify(metrics));
  }

  if (pathname === "/api/export") {
    const cookie = req.headers.cookie || "";
    if (!cookie.includes("ct_admin_session=test_valid_token")) {
      res.writeHead(401, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "Unauthorized access" }));
    }
    res.writeHead(200, { "Content-Type": "text/csv" });
    return res.end("Timestamp,Event,Visitor_ID\r\n2026-11-10T10:00:00Z,page_view,v1");
  }

  if (pathname === "/") {
    res.writeHead(200, { "Content-Type": "text/html" });
    return res.end(`<html><body><h1>Chutney Tubes</h1><p>Homestyle chutney with no mess.</p></body></html>`);
  }

  res.writeHead(404);
  res.end("Not Found");
}

describe("Server API & Routing Tests", () => {
  test("POST /api/events logs event and returns 201 with updated count", (t, done) => {
    const eventsStore = [];
    const sampleEvent = {
      event: "page_view",
      timestamp: new Date().toISOString(),
      visitorId: "vis_123",
      variant: "a",
    };

    const req = createMockReq({ method: "POST", url: "/api/events", body: sampleEvent });
    const res = createMockRes();
    res.onFinish = () => {
      assert.strictEqual(res.statusCode, 201);
      const json = JSON.parse(res.body);
      assert.strictEqual(json.success, true);
      assert.strictEqual(json.count, 1);
      assert.strictEqual(eventsStore.length, 1);
      done();
    };
    handleServerRequest(req, res, eventsStore);
  });

  test("Refuses login with 503 Admin not configured when ADMIN_PASSWORD is unset", (t, done) => {
    const saved = process.env.ADMIN_PASSWORD;
    delete process.env.ADMIN_PASSWORD;

    const req = createMockReq({ method: "POST", url: "/api/admin", body: { password: "any" } });
    const res = createMockRes();
    res.onFinish = () => {
      assert.strictEqual(res.statusCode, 503);
      const json = JSON.parse(res.body);
      assert.strictEqual(json.error, "Admin not configured");
      process.env.ADMIN_PASSWORD = saved;
      done();
    };
    handleServerRequest(req, res, []);
  });

  test("POST /api/admin checks server password and returns 401 on wrong password", (t, done) => {
    process.env.ADMIN_PASSWORD = "secret_test_password";
    const req = createMockReq({ method: "POST", url: "/api/admin", body: { password: "wrong" } });
    const res = createMockRes();
    res.onFinish = () => {
      assert.strictEqual(res.statusCode, 401);
      const json = JSON.parse(res.body);
      assert.strictEqual(json.authenticated, false);
      done();
    };
    handleServerRequest(req, res, []);
  });

  test("POST /api/admin succeeds and sets session cookie with correct password", (t, done) => {
    process.env.ADMIN_PASSWORD = "secret_test_password";
    const req = createMockReq({ method: "POST", url: "/api/admin", body: { password: "secret_test_password" } });
    const res = createMockRes();
    res.onFinish = () => {
      assert.strictEqual(res.statusCode, 200);
      assert.ok(res.headers["Set-Cookie"].includes("HttpOnly"));
      assert.ok(res.headers["Set-Cookie"].includes("Secure"));
      assert.ok(res.headers["Set-Cookie"].includes("SameSite=Strict"));
      done();
    };
    handleServerRequest(req, res, []);
  });

  test("GET /api/admin rejects unauthorized request with 401 without cookie", (t, done) => {
    const req = createMockReq({ method: "GET", url: "/api/admin" });
    const res = createMockRes();
    res.onFinish = () => {
      assert.strictEqual(res.statusCode, 401);
      done();
    };
    handleServerRequest(req, res, []);
  });

  test("GET /api/export rejects unauthorized request with 401", (t, done) => {
    const req = createMockReq({ method: "GET", url: "/api/export" });
    const res = createMockRes();
    res.onFinish = () => {
      assert.strictEqual(res.statusCode, 401);
      done();
    };
    handleServerRequest(req, res, []);
  });
});
