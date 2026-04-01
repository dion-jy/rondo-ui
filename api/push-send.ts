// Vercel Serverless Function — sends Web Push notification to user's subscriptions.
// Authenticated via Supabase JWT in Authorization header.

import type { VercelRequest, VercelResponse } from "@vercel/node";
import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";

// Support both VAPID_PUBLIC_KEY and VITE_VAPID_PUBLIC_KEY (Vercel env naming varies)
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || process.env.VITE_VAPID_PUBLIC_KEY || "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "";
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:admin@rondo.app";
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    return res.status(500).json({ error: "VAPID keys not configured on server" });
  }
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return res.status(500).json({ error: "Supabase credentials not configured on server" });
  }

  // Authenticate via Supabase JWT
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  let userId: string;
  if (token) {
    const { data, error } = await supabaseAuth.auth.getUser(token);
    if (error || !data.user) {
      return res.status(401).json({ error: "Invalid token" });
    }
    userId = data.user.id;
  } else {
    return res.status(401).json({ error: "Authorization header required" });
  }

  // Fetch user's push subscriptions
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const { data: subs, error: fetchError } = await supabase
    .from("push_subscriptions")
    .select("endpoint, keys_p256dh, keys_auth")
    .eq("user_id", userId);

  if (fetchError) {
    return res.status(500).json({ error: "Failed to fetch subscriptions" });
  }
  if (!subs || subs.length === 0) {
    return res.status(404).json({ error: "No push subscriptions found" });
  }

  // Build push payload
  const { test, title, body, tag, deepLink } = req.body || {};
  const payload = JSON.stringify({
    title: test ? "Rondo — Push Test" : (title || "Rondo"),
    body: test ? "Web Push 알림 테스트입니다. 백그라운드에서도 수신 가능!" : (body || ""),
    tag: tag || (test ? "test:push" : "rondo-push"),
    deepLink: deepLink || "/",
  });

  // Send to all subscriptions, remove stale ones
  const results = await Promise.allSettled(
    subs.map(async (sub) => {
      const pushSub = {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.keys_p256dh, auth: sub.keys_auth },
      };
      try {
        await webpush.sendNotification(pushSub, payload);
        return { endpoint: sub.endpoint, ok: true };
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        // 404 or 410 = subscription expired/invalid → remove
        if (statusCode === 404 || statusCode === 410) {
          await supabase
            .from("push_subscriptions")
            .delete()
            .match({ user_id: userId, endpoint: sub.endpoint });
        }
        return { endpoint: sub.endpoint, ok: false, status: statusCode };
      }
    }),
  );

  const sent = results.filter(
    (r) => r.status === "fulfilled" && r.value.ok,
  ).length;

  return res.status(200).json({ sent, total: subs.length });
}
