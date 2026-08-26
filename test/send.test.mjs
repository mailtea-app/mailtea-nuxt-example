import assert from "node:assert/strict";
import { createServer } from "node:http";
import { after, before, describe, it } from "node:test";
import {
  createApp,
  createError,
  createRouter,
  defineEventHandler,
  readBody,
  toNodeListener
} from "h3";
import { startMockMailtea } from "./mock-mailtea.mjs";

// Nuxt auto-imports these into every server route, which is why
// server/api/send.post.ts imports only the SDK. Outside Nuxt we supply them by
// hand before loading the route: the h3 three are the real implementations, so
// body parsing and error-to-status mapping are genuinely exercised.
// `useRuntimeConfig` is the one piece Nitro generates at build time, so the
// test stands in for it and drives the config the route reads.
globalThis.defineEventHandler = defineEventHandler;
globalThis.readBody = readBody;
globalThis.createError = createError;

let runtimeConfig = {};
globalThis.useRuntimeConfig = () => runtimeConfig;

const { default: sendHandler } = await import("../server/api/send.post.ts");

const API_KEY = "mt_pat_test_key";

/** Mount the real route in a real h3 server, the way Nitro does. */
async function startApp() {
  const router = createRouter();
  router.post("/api/send", sendHandler);

  const app = createApp();
  app.use(router);

  const server = createServer(toNodeListener(app));
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));

  return {
    url: `http://127.0.0.1:${server.address().port}/api/send`,
    close: () => new Promise((resolve) => server.close(resolve))
  };
}

const post = (url, body) =>
  fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });

describe("POST /api/send", () => {
  let mailtea;
  let app;

  before(async () => {
    mailtea = await startMockMailtea();
    app = await startApp();
  });

  after(async () => {
    await app.close();
    await mailtea.close();
  });

  it("sends the form through the Mailtea API and returns the email id", async () => {
    runtimeConfig = {
      mailteaApiKey: API_KEY,
      mailteaFrom: "Nuxt Example <hello@yourdomain.com>",
      mailteaApiBaseUrl: mailtea.url
    };

    const response = await post(app.url, {
      to: "reader@yourdomain.com",
      subject: "Hello from Nuxt",
      message: 'Sent from a form. 1 < 2 & "done".'
    });

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      id: "txemail_00000000000000000000000000000000"
    });

    const request = mailtea.last;
    assert.equal(request.method, "POST");
    assert.equal(request.path, "/v1/emails");
    assert.equal(request.authorization, `Bearer ${API_KEY}`);
    assert.equal(request.body.from, "Nuxt Example <hello@yourdomain.com>");
    assert.equal(request.body.to, "reader@yourdomain.com");
    assert.equal(request.body.subject, "Hello from Nuxt");
    // The message is escaped on its way into the HTML body.
    assert.equal(
      request.body.html,
      '<p>Sent from a form. 1 &lt; 2 &amp; "done".</p>'
    );
  });

  it("rejects an incomplete form without calling Mailtea", async () => {
    runtimeConfig = {
      mailteaApiKey: API_KEY,
      mailteaFrom: "Nuxt Example <hello@yourdomain.com>",
      mailteaApiBaseUrl: mailtea.url
    };
    const before = mailtea.requests.length;

    const response = await post(app.url, { to: "reader@yourdomain.com" });

    assert.equal(response.status, 400);
    assert.equal(mailtea.requests.length, before);
  });

  it("passes a Mailtea failure through with its own status", async () => {
    runtimeConfig = {
      mailteaApiKey: API_KEY,
      mailteaFrom: "Nuxt Example <hello@yourdomain.com>",
      // A base URL the mock does not serve, so the SDK raises a MailteaError.
      mailteaApiBaseUrl: `${mailtea.url}/not-the-api`
    };

    const response = await post(app.url, {
      to: "reader@yourdomain.com",
      subject: "Hello from Nuxt",
      message: "Sent from a form."
    });

    assert.equal(response.status, 404);
    const body = await response.json();
    assert.equal(body.statusMessage, "Mailtea rejected the send");
  });

  it("fails loudly when the API key is not configured", async () => {
    runtimeConfig = { mailteaApiKey: "", mailteaFrom: "", mailteaApiBaseUrl: "" };

    const response = await post(app.url, {
      to: "reader@yourdomain.com",
      subject: "Hello from Nuxt",
      message: "Sent from a form."
    });

    assert.equal(response.status, 500);
  });
});
