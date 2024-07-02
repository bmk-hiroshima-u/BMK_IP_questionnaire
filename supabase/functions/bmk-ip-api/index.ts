import "https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts";
import { createClient } from 'https://cdn.skypack.dev/@supabase/supabase-js';

const supabaseUrl = 'https://xrvqmewmdjzsxyiprxck.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhydnFtZXdtZGp6c3h5aXByeGNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTk4MDgyNDYsImV4cCI6MjAzNTM4NDI0Nn0.pumkW0fPJgVaRX7WBosyCIsobhWTOGbetubwPGwBKuc';
const supabase = createClient(supabaseUrl, supabaseKey);

// CORS ヘッダー設定関数
function setCorsHeaders(response) {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

Deno.serve(async (req) => {
  // OPTIONS リクエストのハンドリング
  if (req.method === "OPTIONS") {
    const response = new Response(null, { status: 204 });
    setCorsHeaders(response);
    return response;
  }

  try {
    const {
      recognition_number,
      user_agent,
      screen_resolution,
      timezone,
      language,
      platform
    } = await req.json();

    if (!recognition_number || !user_agent || !screen_resolution || !timezone || !language || !platform) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const { data, error } = await supabase
      .from('responses')
      .insert([{
        recognition_number,
        user_agent,
        screen_resolution,
        timezone,
        language,
        platform
      }])
      .select('*');

    if (error) {
      throw error;
    }

    if (data && data.length > 0) {
      const response = new Response(JSON.stringify({ id: data[0].id }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
      setCorsHeaders(response);
      return response;
    } else {
      const response = new Response(JSON.stringify({ error: 'Data was inserted but no data returned', detail: data }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
      setCorsHeaders(response);
      return response;
    }
  } catch (error) {
    const response = new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
    setCorsHeaders(response);
    return response;
  }
});
