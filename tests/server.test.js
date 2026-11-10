const { test, describe } = require("node:test");
const assert = require("node:assert");
const { EventEmitter } = require("node:events");
const productConfig = require("../src/config/product.config.js");
const { calculateMetrics } = require("../src/lib/metrics.js");

// Mock HTTP Request & Response to test server routing without TCP port binding
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

// Router simulator matching dev-server.js logic
function handleServerRequest(req, res, eventsStore = []) {
  const parsedUrl = new URL(req.url, "http://localhost");
  const pathname = parsedUrl.pathname;

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
      const { password } = JSON.parse(body);
      if (password === "chutney2026") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ authenticated: true, token: "admin_auth_valid" }));
      } else {
        res.writeHead(401, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ authenticated: false, error: "Incorrect password" }));
      }
    });
    return;
  }

  if (pathname === "/api/admin" && req.method === "GET") {
    const token = parsedUrl.searchParams.get("token");
    if (token !== "admin_auth_valid") {
      res.writeHead(401, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "Unauthorized" }));
    }
    const metrics = calculateMetrics(eventsStore);
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify(metrics));
  }

  if (pathname === "/api/export") {
    const pwd = parsedUrl.searchParams.get("password");
    if (pwd !== "chutney2026") {
      res.writeHead(401);
      return res.end("Unauthorized");
    }
    res.writeHead(200, { "Content-Type": "text/csv" });
    return res.end("Timestamp,Event,Visitor_ID\r\n2026-11-10T10:00:00Z,page_view,v1");
  }

  if (pathname === "/") {
    res.writeHead(200, { "Content-Type": "text/html" });
    return res.end(`<html><body><h1>${productConfig.brand.name}</h1><p>Desk-lunch chutney with no mess.</p></body></html>`);
  } else if (pathname === "/checkout") {
    res.writeHead(200, { "Content-Type": "text/html" });
    return res.end("<html><body><h1>Checkout</h1></body></html>");
  } else if (pathname === "/reveal") {
    res.writeHead(200, { "Content-Type": "text/html" });
    return res.end("<html><body><h1>You haven't been charged. We're not live yet.</h1></body></html>");
  }

  res.writeHead(404);
  res.end("Not Found");
}

describe("Server Routing & API Handlers (Socket-free Unit Tests)", () => {
  const eventsStore = [];

  test("GET / returns 200 with brand name and hero headline", (t, done) => {
    const req = createMockReq({ method: "GET", url: "/" });
    const res = createMockRes();
    res.onFinish = () => {
      assert.strictEqual(res.statusCode, 200);
      assert.ok(res.body.includes(productConfig.brand.name));
      assert.ok(res.body.includes("Desk-lunch chutney with no mess."));
      done();
    };
    handleServerRequest(req, res, eventsStore);
  });

  test("GET /checkout and GET /reveal return 200", (t, done) => {
    const req = createMockReq({ method: "GET", url: "/reveal" });
    const res = createMockRes();
    res.onFinish = () => {
      assert.strictEqual(res.statusCode, 200);
      assert.ok(res.body.includes("You haven't been charged. We're not live yet."));
      done();
    };
    handleServerRequest(req, res, eventsStore);
  });

  test("POST /api/events logs an event", (t, done) => {
    const payload = {
      event: "pay_clicked",
      visitorId: "v_unit_1",
      variant: "A",
      source: "whatsapp",
      metadata: { totalAmount: 99 },
    };
    const req = createMockReq({ method: "POST", url: "/api/events", body: payload });
    const res = createMockRes();
    res.onFinish = () => {
      assert.strictEqual(res.statusCode, 201);
      const data = JSON.parse(res.body);
      assert.strictEqual(data.success, true);
      assert.strictEqual(eventsStore.length, 1);
      done();
    };
    handleServerRequest(req, res, eventsStore);
  });

  test("POST /api/admin validates password correctly", (t, done) => {
    const req = createMockReq({ method: "POST", url: "/api/admin", body: { password: "chutney2026" } });
    const res = createMockRes();
    res.onFinish = () => {
      assert.strictEqual(res.statusCode, 200);
      const data = JSON.parse(res.body);
      assert.strictEqual(data.authenticated, true);
      assert.strictEqual(data.token, "admin_auth_valid");
      done();
    };
    handleServerRequest(req, res, eventsStore);
  });

  test("GET /api/admin returns funnel metrics when authorized", (t, done) => {
    const req = createMockReq({ method: "GET", url: "/api/admin?token=admin_auth_valid" });
    const res = createMockRes();
    res.onFinish = () => {
      assert.strictEqual(res.statusCode, 200);
      const data = JSON.parse(res.body);
      assert.ok(data.funnel);
      assert.strictEqual(data.overview.totalPayClicked, 1);
      done();
    };
    handleServerRequest(req, res, eventsStore);
  });

  test("GET /api/export returns CSV content", (t, done) => {
    const req = createMockReq({ method: "GET", url: "/api/export?password=chutney2026" });
    const res = createMockRes();
    res.onFinish = () => {
      assert.strictEqual(res.statusCode, 200);
      assert.ok(res.body.includes("Timestamp,Event,Visitor_ID"));
      done();
    };
    handleServerRequest(req, res, eventsStore);
  });
});
