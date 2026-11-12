/**
 * Destructive integration tests: only run against an isolated, disposable DB
 * and a separately started app with TEST_ALLOW_MUTATIONS=1 in this process.
 */
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import pg from "pg";
import bcrypt from "bcryptjs";

if (process.env.TEST_ALLOW_MUTATIONS !== "1" || !process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD || !process.env.DATABASE_URL) {
  throw new Error("Use a disposable test database and provide TEST_ALLOW_MUTATIONS=1, DATABASE_URL, ADMIN_EMAIL and ADMIN_PASSWORD.");
}
const base = process.env.TEST_BASE_URL || "http://127.0.0.1:3000";
const origin = new URL(base).origin;
class Browser {
  cookies = new Map();
  async request(path, { method = "GET", body, headers = {}, form } = {}) {
    const h = { ...headers };
    if (this.cookies.size) h.cookie = [...this.cookies].map(([k, v]) => `${k}=${v}`).join("; ");
    if (method !== "GET" && !h.origin) h.origin = origin;
    let requestBody;
    if (form) requestBody = form;
    else if (body !== undefined) { h["content-type"] = "application/json"; requestBody = JSON.stringify(body); }
    const response = await fetch(`${base}${path}`, { method, headers: h, body: requestBody, redirect: "manual" });
    for (const value of response.headers.getSetCookie()) {
      const [pair] = value.split(";"); const i = pair.indexOf("=");
      if (i !== -1) this.cookies.set(pair.slice(0, i), pair.slice(i + 1));
    }
    const text = await response.text();
    let data; try { data = JSON.parse(text); } catch { data = text; }
    return { status: response.status, data, headers: response.headers };
  }
}
const anonymous = new Browser(), admin = new Browser(), guest = new Browser(), customer = new Browser();
const fixture = randomBytes(5).toString("hex");
const customerEmail = `integration-${fixture}@example.invalid`;
const customerPassword = randomBytes(24).toString("base64url");
const placed = [];
let categoryId, productId;
const address = { name: "عميل اختبار", phone: "+249912345678", state: "الجزيرة", city: "ود مدني", district: "حي النيل", street: "شارع السوق مبنى ١" };
const product = () => ({ title: `منتج اختبار ${fixture}`, brand: "اختبار", description: "منتج للاختبارات", features: [], images: ["/images/sample-jebena.jpg"], price: "10000", listPrice: "12000", stock: "3", categoryId, isDeal: true, express: false });
const check = (response, status, label) => assert.equal(response.status, status, `${label}: expected ${status}, got ${response.status}: ${JSON.stringify(response.data).slice(0, 300)}`);

try {
  let response = await anonymous.request("/"); check(response, 200, "home");
  assert.match(response.data, /dir="rtl"/); assert.match(response.data, /سوق السودان/);
  response = await anonymous.request("/admin"); assert.equal(response.status, 307);
  response = await anonymous.request("/api/admin/categories"); check(response, 403, "admin access control");
  response = await anonymous.request("/api/admin/upload", { method: "POST", form: new FormData() }); check(response, 403, "upload access control");
  response = await anonymous.request("/login"); check(response, 200, "login page");
  assert.doesNotMatch(response.data, /admin1234|demo1234|حسابات تجريبية جاهزة/);

  response = await admin.request("/api/auth/login", { method: "POST", body: { email: process.env.ADMIN_EMAIL, password: "incorrect-password" } }); check(response, 401, "bad login");
  response = await admin.request("/api/auth/login", { method: "POST", body: { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD } }); check(response, 200, "admin login");
  response = await admin.request("/admin"); check(response, 200, "admin dashboard");
  for (const destination of ["//attacker.invalid", "/\t/attacker.invalid", "/\\attacker.invalid"]) {
    response = await admin.request(`/login?next=${encodeURIComponent(destination)}`);
    check(response, 307, "reject external login redirect");
    assert.equal(response.headers.get("location"), "/");
  }
  response = await admin.request("/api/admin/categories", { method: "POST", headers: { origin: "https://attacker.invalid", "sec-fetch-site": "cross-site" }, body: { name: "منع" } }); assert.notEqual(response.status, 200); assert.notEqual(response.status, 201);
  const connection = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await connection.connect();
  const adminRow = (await connection.query("select password_hash, role from users where email=$1", [process.env.ADMIN_EMAIL.toLowerCase()])).rows[0];
  assert.equal(adminRow.role, "admin"); assert.match(adminRow.password_hash, /^\$2[aby]\$/); assert.equal(await bcrypt.compare(process.env.ADMIN_PASSWORD, adminRow.password_hash), true);
  await connection.end();
  console.log("✓ Admin auth, bcrypt seed, origin protection and anonymous access");

  response = await admin.request("/api/admin/categories", { method: "POST", body: { name: `قسم اختبار ${fixture}`, tagline: "وصف", image: "" } }); check(response, 201, "create category"); categoryId = response.data.id;
  response = await admin.request(`/api/admin/categories/${categoryId}`, { method: "PATCH", body: { name: `قسم معدل ${fixture}`, tagline: "وصف معدل", image: "" } }); check(response, 200, "update category");
  response = await admin.request("/api/admin/products", { method: "POST", body: product() }); check(response, 200, "create product"); productId = response.data.id;
  response = await admin.request(`/api/admin/products/${productId}`, { method: "PATCH", body: { ...product(), title: `منتج معدل ${fixture}` } }); check(response, 200, "update product");
  response = await admin.request(`/api/admin/categories/${categoryId}`, { method: "DELETE", body: {} }); check(response, 409, "category with products cannot be deleted");
  response = await admin.request("/admin/products/new"); check(response, 200, "product form"); assert.match(response.data, /type="file"/);
  response = await admin.request("/api/admin/upload", { method: "POST", form: new FormData() });
  // Without Cloudinary credentials this returns 503; with credentials the
  // intentionally empty form must still be rejected as an invalid file.
  assert.ok([422, 503].includes(response.status), `invalid upload: got ${response.status}`);
  console.log("✓ Category/product CRUD, protected file input and invalid upload handling");

  response = await guest.request("/api/cart", { method: "POST", body: { productId, quantity: 1 } }); check(response, 200, "add guest cart");
  response = await guest.request("/api/orders", { method: "POST", body: { ...address, paymentMethod: "bank", paymentProvider: "invalid" } }); check(response, 422, "invalid bank");
  response = await guest.request("/api/orders", { method: "POST", body: { ...address, paymentMethod: "bank", paymentProvider: "bank-of-khartoum", paymentReference: "BANK-TEST-42" } }); check(response, 201, "bank checkout"); const bankId = response.data.id; placed.push(bankId);
  response = await anonymous.request(`/api/orders/${bankId}`); check(response, 404, "guest order privacy");
  response = await guest.request(`/api/orders/${bankId}`); check(response, 200, "guest order capability"); assert.equal(response.data.order.paymentProvider, "bank-of-khartoum"); assert.equal(response.data.order.paymentReference, "BANK-TEST-42"); assert.equal(response.data.order.shipPhone, "0912345678"); assert.equal(response.data.order.shipState, "الجزيرة"); assert.equal("guestAccessHash" in response.data.order, false);
  response = await guest.request(`/orders/${bankId}?placed=1`); check(response, 200, "guest confirmation");
  response = await admin.request(`/api/admin/orders/${bankId}`, { method: "PATCH", body: { paymentStatus: "paid" } }); check(response, 200, "manual payment verification");
  response = await guest.request(`/api/orders/${bankId}/cancel`, { method: "POST", body: {} }); check(response, 200, "guest cancel");
  response = await guest.request(`/api/orders/${bankId}/cancel`, { method: "POST", body: {} }); check(response, 409, "double cancel");

  response = await guest.request("/api/cart", { method: "POST", body: { productId, quantity: 1 } }); check(response, 200, "wallet cart");
  response = await guest.request("/api/orders", { method: "POST", body: { ...address, paymentMethod: "wallet", paymentProvider: "zain-cash", paymentReference: "WALLET-42" } }); check(response, 201, "wallet checkout"); const walletId = response.data.id; placed.push(walletId);
  response = await guest.request(`/api/orders/${walletId}`); check(response, 200, "wallet order"); assert.equal(response.data.order.paymentProvider, "zain-cash");
  response = await admin.request(`/api/admin/orders/${walletId}`, { method: "PATCH", body: { status: "cancelled" } }); check(response, 200, "admin cancellation");
  response = await admin.request(`/api/admin/orders/${walletId}`, { method: "PATCH", body: { status: "processing" } }); check(response, 409, "cancelled order final");
  console.log("✓ Guest bank/wallet checkout, order privacy, manual payment and cancellation");

  // A guest cart must survive registration, and a customer's order must not
  // be readable by another visitor. Credentials are generated per test run.
  check(await customer.request("/api/cart", { method: "POST", body: { productId, quantity: 1 } }), 200, "customer guest cart");
  check(await customer.request("/api/auth/register", { method: "POST", body: { name: "عميل اختبار", email: customerEmail, password: customerPassword } }), 200, "customer registration");
  response = await customer.request("/api/auth/me"); check(response, 200, "customer session");
  assert.equal(response.data.user.email, customerEmail); assert.equal(response.data.user.role, "customer"); assert.equal(response.data.cartCount, 1);
  check(await customer.request("/api/admin/categories"), 403, "customer cannot access admin");
  response = await customer.request("/api/orders", { method: "POST", body: { ...address, paymentMethod: "cod" } }); check(response, 201, "registered checkout");
  const customerOrderId = response.data.id, customerOrderNumber = response.data.number; placed.push(customerOrderId);
  check(await anonymous.request(`/api/orders/${customerOrderId}`), 404, "registered order privacy");
  check(await customer.request(`/api/orders/${customerOrderId}`), 200, "customer can read own order");
  response = await customer.request("/orders"); check(response, 200, "customer orders page"); assert.ok(response.data.includes(customerOrderNumber));
  check(await customer.request(`/api/orders/${customerOrderId}/cancel`, { method: "POST", body: {} }), 200, "registered customer cancel");
  check(await customer.request("/api/auth/logout", { method: "POST", body: {} }), 200, "customer logout");
  check(await customer.request(`/api/orders/${customerOrderId}`), 404, "logged-out customer cannot read order");
  check(await customer.request("/api/auth/login", { method: "POST", body: { email: customerEmail, password: customerPassword } }), 200, "customer login");
  check(await customer.request(`/api/orders/${customerOrderId}`), 200, "customer order after login");
  console.log("✓ Customer registration, cart merge, checkout, privacy, cancellation and login");

  response = await admin.request(`/api/admin/products/${productId}`, { method: "PATCH", body: { ...product(), stock: "1" } }); check(response, 200, "set last unit");
  const first = new Browser(), second = new Browser();
  check(await first.request("/api/cart", { method: "POST", body: { productId, quantity: 1 } }), 200, "first cart");
  check(await second.request("/api/cart", { method: "POST", body: { productId, quantity: 1 } }), 200, "second cart");
  const concurrent = await Promise.all([first, second].map((browser) => browser.request("/api/orders", { method: "POST", body: { ...address, paymentMethod: "cod" } })));
  assert.deepEqual(concurrent.map((item) => item.status).sort(), [201, 409]);
  placed.push(concurrent.find((item) => item.status === 201).data.id);
  response = await anonymous.request(`/api/products/${productId}`); check(response, 200, "product after concurrency"); assert.equal(response.data.product.stock, 0);
  console.log("✓ Cash-on-delivery checkout and concurrent stock locking");
  console.log("All integration checks passed.");
} finally {
  for (const id of placed) await admin.request(`/api/admin/orders/${id}`, { method: "DELETE", body: {} }).catch(() => {});
  if (productId) await admin.request(`/api/admin/products/${productId}`, { method: "DELETE", body: {} }).catch(() => {});
  if (categoryId) await admin.request(`/api/admin/categories/${categoryId}`, { method: "DELETE", body: {} }).catch(() => {});
  const cleanup = new pg.Client({ connectionString: process.env.DATABASE_URL });
  try {
    await cleanup.connect();
    await cleanup.query("delete from users where email = $1", [customerEmail]);
  } finally {
    await cleanup.end().catch(() => {});
  }
}
