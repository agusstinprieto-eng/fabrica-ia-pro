
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const VERIFY_TOKEN = "notedejes_webhook_verify_2026";

serve(async (req) => {
    try {
        const url = new URL(req.url);

        // 1. WEBHOOK VERIFICATION (GET)
        if (req.method === "GET") {
            const mode = url.searchParams.get("hub.mode");
            const token = url.searchParams.get("hub.verify_token");
            const challenge = url.searchParams.get("hub.challenge");

            if (mode && token) {
                if (mode === "subscribe" && token === VERIFY_TOKEN) {
                    console.log("WEBHOOK_VERIFIED");
                    return new Response(challenge, { status: 200 });
                } else {
                    console.error("VERIFICATION_FAILED", { mode, token });
                    return new Response("Forbidden", { status: 403 });
                }
            }
        }

        // 2. MESSAGE HANDLING (POST)
        if (req.method === "POST") {
            const body = await req.json();
            console.log("WEBHOOK_RECEIVED", JSON.stringify(body, null, 2));

            // Handle messages here (placeholder logic)
            if (body.object) {
                if (
                    body.entry &&
                    body.entry[0].changes &&
                    body.entry[0].changes[0] &&
                    body.entry[0].changes[0].value.messages &&
                    body.entry[0].changes[0].value.messages[0]
                ) {
                    const message = body.entry[0].changes[0].value.messages[0];
                    const confirmId = message.id;
                    console.log("Message received:", message);

                    // Return 200 OK immediately
                    // (In a real app, you'd process asynchronously or queue tasks)
                }
                return new Response("EVENT_RECEIVED", { status: 200 });
            } else {
                return new Response("Not Found", { status: 404 });
            }
        }

        return new Response("Method Not Allowed", { status: 405 });
    } catch (error) {
        console.error("WEBHOOK_ERROR", error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
});
