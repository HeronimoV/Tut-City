import { createServerClient } from "./supabase";

const supabase = () => createServerClient();

// Known disposable/throwaway email domains
const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com", "tempmail.com", "throwaway.email", "guerrillamail.com",
  "sharklasers.com", "guerrillamailblock.com", "grr.la", "guerrillamail.info",
  "guerrillamail.net", "guerrillamail.org", "guerrillamail.de", "tempail.com",
  "temp-mail.org", "temp-mail.io", "fakeinbox.com", "mailnesia.com",
  "maildrop.cc", "dispostable.com", "yopmail.com", "trashmail.com",
  "trashmail.me", "trashmail.net", "10minutemail.com", "minutemail.com",
  "emailondeck.com", "getnada.com", "mohmal.com", "tempinbox.com",
  "burnermail.io", "inboxkitten.com", "mailsac.com", "harakirimail.com",
  "33mail.com", "maildax.com", "crazymailing.com", "mytemp.email",
]);

export function isDisposableEmail(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return true;
  return DISPOSABLE_DOMAINS.has(domain);
}

// Generate a 6-digit verification code
export function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Store verification code in Supabase (expires in 10 minutes)
export async function storeVerificationCode(email: string, code: string) {
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  // Upsert — one pending code per email
  const { error } = await supabase()
    .from("email_verifications")
    .upsert(
      { email: email.toLowerCase(), code, expires_at: expiresAt, verified: false },
      { onConflict: "email" }
    );

  if (error) throw error;
}

// Verify a code
export async function verifyCode(email: string, code: string): Promise<boolean> {
  const { data, error } = await supabase()
    .from("email_verifications")
    .select("*")
    .eq("email", email.toLowerCase())
    .eq("code", code)
    .single();

  if (error || !data) return false;
  if (new Date(data.expires_at) < new Date()) return false;

  // Mark as verified
  await supabase()
    .from("email_verifications")
    .update({ verified: true })
    .eq("email", email.toLowerCase());

  return true;
}

// Check if email is verified
export async function isEmailVerified(email: string): Promise<boolean> {
  const { data } = await supabase()
    .from("email_verifications")
    .select("verified")
    .eq("email", email.toLowerCase())
    .single();

  return data?.verified === true;
}
