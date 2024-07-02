import "https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts";
import { createClient } from 'https://cdn.skypack.dev/@supabase/supabase-js';

const supabaseUrl = 'https://xrvqmewmdjzsxyiprxck.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhydnFtZXdtZGp6c3h5aXByeGNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTk4MDgyNDYsImV4cCI6MjAzNTM4NDI0Nn0.pumkW0fPJgVaRX7WBosyCIsobhWTOGbetubwPGwBKuc';
const supabase = createClient(supabaseUrl, supabaseKey);

Deno.serve(async (req) => {
  try {
    const { recognition_number, device_fingerprint } = await req.json();
    if (!recognition_number || !device_fingerprint) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers: { "Content-Type": "application/json" } });
    }

    const { data, error } = await supabase
      .from('responses')
      .insert([{ recognition_number, device_fingerprint }])
      .select('*');

    if (error) {
      throw error;
    }

    if (data && data.length > 0) {
      return new Response(JSON.stringify({ id: data[0].id }), { status: 200, headers: { "Content-Type": "application/json" } });
    } else {
      return new Response(JSON.stringify({ error: 'Data was inserted but no data returned', detail: data }), { status: 500, headers: { "Content-Type": "application/json" } });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});
