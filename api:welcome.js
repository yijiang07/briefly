export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, topics } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email required' });
  }

  const RESEND_KEY = process.env.RESEND_KEY;
  const FROM_EMAIL = process.env.FROM_EMAIL || 'Briefly <hello@readbriefly.com>';
  const SITE_URL = process.env.SITE_URL || 'https://www.readbriefly.com';

  // Generate unsubscribe token
  const token = Buffer.from(email).toString('base64url');
  const unsubLink = `${SITE_URL}/unsubscribe.html?token=${token}`;
  const topicsDisplay = topics || 'your selected topics';

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f2eb;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:32px 16px;">
    <div style="border-bottom:1px solid #e8e4dc;padding-bottom:20px;margin-bottom:28px;">
      <div style="font-family:Georgia,serif;font-size:22px;font-weight:400;margin-bottom:4px;">● Briefly</div>
      <div style="font-size:12px;color:#7a7670;">Welcome to your morning briefing</div>
    </div>
    <div style="font-family:Georgia,serif;font-size:24px;font-weight:400;margin-bottom:16px;line-height:1.3;">
      You're all set. Your first brief arrives tomorrow morning.
    </div>
    <div style="font-size:15px;color:#4a4845;line-height:1.7;margin-bottom:28px;">
      Every morning, Briefly scans 80+ sources and builds a personalized briefing based on what you care about.
      No noise, no algorithm — just the stories that matter to you, with a plain-English explanation of why each one is relevant.
    </div>
    <div style="background:#fff;border-radius:16px;padding:24px;border:1px solid #e8e4dc;margin-bottom:28px;">
      <div style="font-size:11px;font-weight:500;letter-spacing:.08em;text-transform:uppercase;color:#2b4fff;margin-bottom:10px;">Your topics</div>
      <div style="font-size:15px;color:#0f0e0c;line-height:1.7;">${topicsDisplay}</div>
    </div>
    <div style="background:#eef1ff;border-left:3px solid #2b4fff;border-radius:0 10px 10px 0;padding:14px 18px;margin-bottom:28px;">
      <div style="font-size:13px;color:#0f0e0c;line-height:1.7;">
        <strong>Want to change your topics?</strong> Just reply to this email and let us know.
      </div>
    </div>
    <div style="font-size:14px;color:#7a7670;line-height:1.7;margin-bottom:28px;">
      Talk soon,<br><strong style="color:#0f0e0c;">The Briefly team</strong>
    </div>
    <div style="border-top:1px solid #e8e4dc;padding-top:20px;text-align:center;font-size:11px;color:#7a7670;line-height:1.8;">
      You're receiving this because you signed up at readbriefly.com<br>
      <a href="${unsubLink}" style="color:#7a7670;text-decoration:underline;">Unsubscribe</a>
    </div>
  </div>
</body>
</html>`;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [email],
        subject: 'Welcome to Briefly — your first brief arrives tomorrow',
        html,
        tags: [{ name: 'type', value: 'welcome' }],
      }),
    });

    if (response.ok) {
      return res.status(200).json({ success: true });
    } else {
      const err = await response.text();
      return res.status(500).json({ error: err });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
