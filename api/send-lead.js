// /api/send-lead — Vercel serverless function (Node.js runtime).
//
// This is the fix for the exposed Telegram bot token: the token now lives
// ONLY here, read from an environment variable, and is never sent to the
// browser. Set these in Vercel → Project → Settings → Environment Variables:
//
//   TELEGRAM_BOT_TOKEN   (the bot token — rotate it first, see note below)
//   TELEGRAM_CHAT_ID     (currently 6221013974)
//
// IMPORTANT: the old token (8736514197:AAFEE9...) was live in client-side
// code and is now considered compromised — anyone who viewed page source
// could have copied it. Revoke/regenerate it with @BotFather (/revoke or
// /token) BEFORE putting the new token into TELEGRAM_BOT_TOKEN.

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 5;
const rateLimitStore = new Map(); // ip -> [timestamps]  (resets on cold start; fine for basic abuse control)

function isRateLimited(ip) {
  const now = Date.now();
  const timestamps = (rateLimitStore.get(ip) || []).filter(t => now - t < RATE_LIMIT_WINDOW_MS);
  timestamps.push(now);
  rateLimitStore.set(ip, timestamps);
  return timestamps.length > RATE_LIMIT_MAX_REQUESTS;
}

function escapeHtml(text) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return String(text).replace(/[&<>"']/g, m => map[m]);
}

function clip(value, maxLen) {
  return String(value || '').slice(0, maxLen);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }

  const ip = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
  if (isRateLimited(ip)) {
    return res.status(429).json({ ok: false, error: 'rate_limited' });
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!botToken || !chatId) {
    console.error('Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID env vars');
    return res.status(500).json({ ok: false, error: 'server_not_configured' });
  }

  try {
    const body = req.body || {};

    // Honeypot: real users never fill this hidden field.
    if (body.website) {
      return res.status(200).json({ ok: true }); // pretend success, drop silently
    }

    const name = clip(body.name, 100).trim();
    const phone = clip(body.phone, 30).trim();
    const device = clip(body.device, 100).trim();
    const problem = clip(body.problem, 200).trim();
    const comment = clip(body.comment, 500).trim();
    const page = clip(body.page, 100).trim();

    const phoneDigits = phone.replace(/\D/g, '');
    if (!name || !phone || phoneDigits.length < 9 || phoneDigits.length > 15 || !device || !problem) {
      return res.status(400).json({ ok: false, error: 'invalid_input' });
    }

    const message = `
📱 <b>НОВА ЗАЯВКА НА РЕМОНТ</b>

👤 <b>Ім'я:</b> ${escapeHtml(name)}
📞 <b>Телефон:</b> <code>${escapeHtml(phone)}</code>
🔧 <b>Пристрій:</b> ${escapeHtml(device)}
⚠️ <b>Проблема:</b> ${escapeHtml(problem)}
${comment ? `💬 <b>Коментар:</b> ${escapeHtml(comment)}` : ''}
${page ? `🔗 <b>Сторінка:</b> ${escapeHtml(page)}` : ''}

🕐 <b>Час:</b> ${new Date().toLocaleString('uk-UA')}
    `.trim();

    const tgResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'HTML' }),
    });
    const tgResult = await tgResponse.json();

    if (!tgResult.ok) {
      console.error('Telegram API error:', tgResult);
      return res.status(502).json({ ok: false, error: 'telegram_error' });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('send-lead error:', err);
    return res.status(500).json({ ok: false, error: 'internal_error' });
  }
}
