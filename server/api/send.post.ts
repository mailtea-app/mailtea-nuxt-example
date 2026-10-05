import { Mailtea, MailteaError } from "mailtea-sdk";

interface SendRequest {
  to?: string;
  subject?: string;
  message?: string;
}

/** The message is plain text typed into a browser. It must not become markup. */
function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export default defineEventHandler(async (event) => {
  // The key is read here and nowhere else. `useRuntimeConfig` resolves
  // server-only keys, and this file only ever runs on the server, so the key
  // never reaches the client bundle.
  const config = useRuntimeConfig(event);

  if (!config.mailteaApiKey || !config.mailteaFrom) {
    throw createError({
      statusCode: 500,
      statusMessage: "Server not configured",
      message: "Set NUXT_MAILTEA_API_KEY and NUXT_MAILTEA_FROM."
    });
  }

  const body = (await readBody(event)) as SendRequest | undefined;
  const to = body?.to?.trim();
  const subject = body?.subject?.trim();
  const message = body?.message?.trim();

  if (!to || !subject || !message) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing field",
      message: "to, subject and message are all required."
    });
  }

  const mailtea = new Mailtea(config.mailteaApiKey, {
    // Optional override of the API host. Unset, the SDK uses https://api.mailtea.app.
    baseUrl: config.mailteaApiBaseUrl || undefined
  });

  try {
    const { id } = await mailtea.emails.send({
      from: config.mailteaFrom,
      to,
      subject,
      html: `<p>${escapeHtml(message)}</p>`
    });

    return { id };
  } catch (error) {
    if (error instanceof MailteaError) {
      // Pass Mailtea's own status and message through. "Domain not verified"
      // and "invalid recipient" need very different fixes from the caller, and
      // a generic 500 hides which one you got.
      throw createError({
        statusCode: error.status,
        statusMessage: "Mailtea rejected the send",
        message: error.message,
        data: { code: error.code, requestId: error.requestId }
      });
    }

    throw error;
  }
});
