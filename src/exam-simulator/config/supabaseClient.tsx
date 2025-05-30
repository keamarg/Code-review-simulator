import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  "https://gzoltpvnxwjoeycomcby.supabase.co",

  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6b2x0cHZueHdqb2V5Y29tY2J5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1ODIxNjgsImV4cCI6MjA2NDE1ODE2OH0.BwW_I5QvYwzNpu8oF5y4GisYC9WHSKWbAIW9kOQKv5w"
  /*"https://eqertgbvnnyyqqytvxjt.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxZXJ0Z2J2bm55eXFxeXR2eGp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU5MTMxNjIsImV4cCI6MjA2MTQ4OTE2Mn0.PPY7wW9U02XmNySowkdxQnh_R5jnvjEouVEBakowpIY"*/
);
