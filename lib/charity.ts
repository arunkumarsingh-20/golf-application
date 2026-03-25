"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function saveCharitySelection(formData: FormData) {
  const supabase = await createClient();

  const charityId = String(formData.get("charityId") || "").trim();
  const percentRaw = String(formData.get("percent") || "").trim();
  const percent = Number(percentRaw);

  if (!charityId) {
    redirect("/dashboard/charity?error=Please select a charity");
  }

  if (!percentRaw || Number.isNaN(percent) || percent < 10 || percent > 100) {
    redirect("/dashboard/charity?error=Contribution must be between 10 and 100");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: existing } = await supabase
    .from("user_charity_settings")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing?.id) {
    const { error } = await supabase
      .from("user_charity_settings")
      .update({
        charity_id: charityId,
        contribution_percent: percent,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);

    if (error) {
      redirect(`/dashboard/charity?error=${encodeURIComponent(error.message)}`);
    }
  } else {
    const { error } = await supabase.from("user_charity_settings").insert({
      user_id: user.id,
      charity_id: charityId,
      contribution_percent: percent,
    });

    if (error) {
      redirect(`/dashboard/charity?error=${encodeURIComponent(error.message)}`);
    }
  }

  revalidatePath("/dashboard/charity");
  redirect("/dashboard/charity?success=1");
}
