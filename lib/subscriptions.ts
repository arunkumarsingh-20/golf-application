import { createClient } from "@/lib/supabase/server";

export async function getCurrentUserSubscription(userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("user_subscriptions")
    .select(`
      id,
      status,
      current_period_start,
      current_period_end,
      cancel_at_period_end,
      subscription_plans (
        name,
        price,
        billing_interval
      )
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
