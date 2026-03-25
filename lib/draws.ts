"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";



function generateRandomDraw() {
  const nums = new Set<number>();
  while (nums.size < 5) {
    nums.add(Math.floor(Math.random() * 45) + 1);
  }
  return Array.from(nums).sort((a, b) => a - b);
}

export async function createDraw(formData: FormData) {
  const supabase = await createClient();

  const month = Number(formData.get("month"));
  const year = Number(formData.get("year"));
  const drawType = String(formData.get("drawType") || "random");

  if (!month || !year) {
    redirect("/admin/draws?error=Month and year are required");
  }

  const drawNumbers = drawType === "random" ? generateRandomDraw() : [];

  const { error } = await supabase.from("draws").insert({
    month,
    year,
    draw_type: drawType,
    status: "simulated",
    draw_numbers: drawNumbers,
  });

  if (error) {
    redirect(`/admin/draws?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/draws");
  redirect("/admin/draws?success=1");
}

export async function simulateDraw(formData: FormData) {
  const drawId = String(formData.get("drawId") || "").trim();

  if (!drawId) {
    redirect("/admin/draws?error=Missing draw id");
  }

  const { data: draw, error: drawError } = await supabaseAdmin
    .from("draws")
    .select("*")
    .eq("id", drawId)
    .maybeSingle();

  if (drawError || !draw) {
    redirect("/admin/draws?error=Draw not found");
  }

  const drawNumbers: number[] = Array.isArray(draw.draw_numbers)
    ? draw.draw_numbers
    : [];

  if (drawNumbers.length !== 5) {
    redirect("/admin/draws?error=Draw has no numbers");
  }

  await supabaseAdmin.from("draw_entries").delete().eq("draw_id", drawId);
  await supabaseAdmin.from("draw_results").delete().eq("draw_id", drawId);

  const { data: scores, error: scoresError } = await supabaseAdmin
    .from("scores")
    .select("id, user_id, score, played_at, created_at")
    .order("played_at", { ascending: false })
    .order("created_at", { ascending: false });

  if (scoresError || !scores) {
    redirect("/admin/draws?error=Failed to load scores");
  }

  const byUser = new Map<string, typeof scores>();
  for (const s of scores) {
    if (!byUser.has(s.user_id)) byUser.set(s.user_id, []);
    byUser.get(s.user_id)!.push(s);
  }

  for (const [userId, userScores] of byUser.entries()) {
    const latestFive = userScores.slice(0, 5);
    if (latestFive.length < 5) continue;

    const numbersSnapshot = latestFive.map((s) => s.score);

    const matchCount = numbersSnapshot.filter((n) =>
      drawNumbers.includes(n)
    ).length;

    await supabaseAdmin.from("draw_entries").insert({
      draw_id: drawId,
      user_id: userId,
      numbers_snapshot: numbersSnapshot,
    });

    if (matchCount >= 3) {
      await supabaseAdmin.from("draw_results").insert({
        draw_id: drawId,
        user_id: userId,
        match_count: matchCount,
        prize_amount: 0,
        status: "pending",
      });
    }
  }

  await supabaseAdmin
    .from("draws")
    .update({ status: "simulated" })
    .eq("id", drawId);

  revalidatePath("/admin/draws");
  redirect("/admin/draws?success=1");
}

function splitPrizePool(total: number) {
  return {
    pool5: total * 0.4,
    pool4: total * 0.35,
    pool3: total * 0.25,
  };
}

export async function calculatePrizes(formData: FormData) {
  const drawId = String(formData.get("drawId") || "").trim();

  if (!drawId) {
    redirect("/admin/draws?error=Missing draw id");
  }

  const { data: draw } = await supabaseAdmin
    .from("draws")
    .select("*")
    .eq("id", drawId)
    .maybeSingle();

  if (!draw) {
    redirect("/admin/draws?error=Draw not found");
  }

  // total pool = active subscribers * fixed amount (example: $5 each)
  const fixedAmountPerUser = 5;

  const { count: activeSubs } = await supabaseAdmin
    .from("user_subscriptions")
    .select("id", { count: "exact", head: true })
    .eq("status", "active");

  const totalPool = (activeSubs ?? 0) * fixedAmountPerUser;

  // check previous rollover
  const { data: lastPool } = await supabaseAdmin
    .from("prize_pools")
    .select("rollover_amount")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const rollover = lastPool?.rollover_amount ?? 0;

  const { pool5, pool4, pool3 } = splitPrizePool(totalPool + rollover);

  // count winners
  const { data: results } = await supabaseAdmin
    .from("draw_results")
    .select("id, match_count")
    .eq("draw_id", drawId);

  const winners5 = results?.filter((r) => r.match_count === 5) ?? [];
  const winners4 = results?.filter((r) => r.match_count === 4) ?? [];
  const winners3 = results?.filter((r) => r.match_count === 3) ?? [];

  const prize5 = winners5.length ? pool5 / winners5.length : 0;
  const prize4 = winners4.length ? pool4 / winners4.length : 0;
  const prize3 = winners3.length ? pool3 / winners3.length : 0;

  // update prize pool record
  await supabaseAdmin.from("prize_pools").insert({
    draw_id: drawId,
    total_pool: totalPool,
    pool_5_match: pool5,
    pool_4_match: pool4,
    pool_3_match: pool3,
    rollover_amount: winners5.length ? 0 : pool5,
  });

  // update draw_results prizes
  for (const r of winners5) {
    await supabaseAdmin
      .from("draw_results")
      .update({ prize_amount: prize5 })
      .eq("id", r.id);
  }
  for (const r of winners4) {
    await supabaseAdmin
      .from("draw_results")
      .update({ prize_amount: prize4 })
      .eq("id", r.id);
  }
  for (const r of winners3) {
    await supabaseAdmin
      .from("draw_results")
      .update({ prize_amount: prize3 })
      .eq("id", r.id);
  }

  revalidatePath("/admin/draws");
  redirect("/admin/draws?success=1");
}

export async function publishDraw(formData: FormData) {
  const drawId = String(formData.get("drawId") || "").trim();

  if (!drawId) {
    redirect("/admin/draws?error=Missing draw id");
  }

  // Mark draw as published
  await supabaseAdmin
    .from("draws")
    .update({
      status: "published",
      published_at: new Date().toISOString(),
    })
    .eq("id", drawId);

  // Load results for this draw (optional, but keeps logic clear)
  const { data: results } = await supabaseAdmin
    .from("draw_results")
    .select("user_id, match_count, prize_amount")
    .eq("draw_id", drawId);

  // Resend test mode: send only to your email
  const testEmail = "arunnsingh7609@gmail.com";

  if (results?.length) {
    await sendEmail({
      to: testEmail,
      subject: "Draw results are live!",
      html: `
        <h2>Hello!</h2>
        <p>The monthly draw has been published.</p>
        <p>This is a test email (Resend test mode).</p>
      `,
    });
  }

  revalidatePath("/admin/draws");
  redirect("/admin/draws?success=1");
}
