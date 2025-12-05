import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://tkbikpiivwtqfsxhxvwa.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRrYmlrcGlpdnd0cWZzeGh4dndhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxMDA5ODgsImV4cCI6MjA3ODY3Njk4OH0.QLgf-9KsGGUhgRLgHaR-gSCXt5sTGOuV1DNqEc-N48k";

export const supabase = createClient(supabaseUrl, supabaseKey);
