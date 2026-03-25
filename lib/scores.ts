"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function addScore(formData: FormData) {
  const supabase = await createClient();

  const scoreRaw = String(formData.get("score") || "").trim();
  const playedAt = String(formData.get("playedAt") || "").trim();

  const score = Number(scoreRaw);

  if (!scoreRaw || !playedAt) {
    redirect("/dashboard/scores?error=Score and date are required");
  }

  if (Number.isNaN(score) || score < 1 || score > 45) {
    redirect("/dashboard/scores?error=Score must be between 1 and 45");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { error: insertError } = await supabase.from("scores").insert({
    user_id: user.id,
    score,
    played_at: playedAt,
  });

  if (insertError) {
    redirect(`/dashboard/scores?error=${encodeURIComponent(insertError.message)}`);
  }

  revalidatePath("/dashboard/scores");
  redirect("/dashboard/scores?success=1");
}
