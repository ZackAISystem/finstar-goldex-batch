export async function onRequestPost(context) {
  try {
    const webhookUrl = context.env.BITRIX_WEBHOOK_URL;

    if (!webhookUrl) {
      return jsonResponse(
        { ok: false, error: "BITRIX_WEBHOOK_URL is not configured" },
        500
      );
    }

    const data = await context.request.json();

    const name = String(data.name || "").trim();
    const phone = String(data.phone || "").trim();
    const message = String(data.message || "").trim();
    const pageUrl = String(data.page_url || "").trim();
    const ctaSource = String(data.cta_source || "").trim();
    const ctaText = String(data.cta_text || "").trim();

    if (!name || !phone) {
      return jsonResponse(
        { ok: false, error: "Name and phone are required" },
        400
      );
    }

    const title = `Заявка Goldex: ${name}`;

    const comments = [
      message ? `Сообщение: ${message}` : "",
      pageUrl ? `Страница: ${pageUrl}` : "",
      ctaSource ? `Источник CTA: ${ctaSource}` : "",
      ctaText ? `Текст кнопки: ${ctaText}` : "",
      `Дата: ${new Date().toISOString()}`
    ].filter(Boolean).join("\n");

    const bitrixPayload = {
      fields: {
        TITLE: title,
        NAME: name,
        PHONE: [
          {
            VALUE: phone,
            VALUE_TYPE: "WORK"
          }
        ],
        COMMENTS: comments,
        SOURCE_ID: "WEB",
        SOURCE_DESCRIPTION: "Finstar Goldex landing"
      },
      params: {
        REGISTER_SONET_EVENT: "Y"
      }
    };

    const response = await fetch(`${webhookUrl}crm.lead.add.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(bitrixPayload)
    });

    const result = await response.json();

    if (!response.ok || result.error) {
      return jsonResponse(
        {
          ok: false,
          error: "Bitrix error",
          details: result
        },
        502
      );
    }

    return jsonResponse({
      ok: true,
      lead_id: result.result
    });

  } catch (error) {
    return jsonResponse(
      {
        ok: false,
        error: error.message || "Unknown error"
      },
      500
    );
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders()
  });
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...corsHeaders()
    }
  });
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
}
