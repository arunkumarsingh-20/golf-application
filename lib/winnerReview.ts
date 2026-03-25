"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";

/* ================= APPROVE ================= */
export async function approveProof(formData: FormData) {
  const proofId = String(formData.get("proofId") || "");

  if (!proofId) {
    redirect("/admin/winners?error=Missing proof id");
  }

  const { data: proof } = await supabaseAdmin
    .from("winner_proofs")
    .select("draw_result_id, user_id")
    .eq("id", proofId)
    .maybeSingle();

  if (!proof) {
    redirect("/admin/winners?error=Proof not found");
  }

  // ✅ Update proof
  await supabaseAdmin
    .from("winner_proofs")
    .update({
      review_status: "approved",
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", proofId);

  // ✅ Update draw result
  await supabaseAdmin
    .from("draw_results")
    .update({ status: "verified" })
    .eq("id", proof.draw_result_id);

  // ✅ FETCH USER (IMPORTANT FIX: user_id added above)
  const { data: user } = await supabaseAdmin
    .from("profiles")
    .select("email, full_name")
    .eq("id", proof.user_id)
    .maybeSingle();

  // ✅ SEND EMAIL
  if (user?.email) {
    await sendEmail({
      to: user.email,
      subject: "Your win is verified!",
      html: `
        <h2>Congratulations${user.full_name ? `, ${user.full_name}` : ""}!</h2>
        <p>Your winning proof has been approved.</p>
        <p>We’ll process your payout shortly.</p>
      `,
    });
  }

  revalidatePath("/admin/winners");
  redirect("/admin/winners?success=1");
}

/* ================= REJECT ================= */
export async function rejectProof(formData: FormData) {
  const proofId = String(formData.get("proofId") || "");

  if (!proofId) {
    redirect("/admin/winners?error=Missing proof id");
  }

  const { data: proof } = await supabaseAdmin
    .from("winner_proofs")
    .select("draw_result_id")
    .eq("id", proofId)
    .maybeSingle();

  if (!proof) {
    redirect("/admin/winners?error=Proof not found");
  }

  await supabaseAdmin
    .from("winner_proofs")
    .update({
      review_status: "rejected",
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", proofId);

  await supabaseAdmin
    .from("draw_results")
    .update({ status: "pending" })
    .eq("id", proof.draw_result_id);

  revalidatePath("/admin/winners");
  redirect("/admin/winners?success=1");
}

/* ================= MARK PAID ================= */
export async function markPaid(formData: FormData) {
  const proofId = String(formData.get("proofId") || "");

  if (!proofId) {
    redirect("/admin/winners?error=Missing proof id");
  }

  const { data: proof } = await supabaseAdmin
    .from("winner_proofs")
    .select("draw_result_id, review_status")
    .eq("id", proofId)
    .maybeSingle();

  if (!proof) {
    redirect("/admin/winners?error=Proof not found");
  }

  if (proof.review_status !== "approved") {
    redirect("/admin/winners?error=Only approved proofs can be paid");
  }

  await supabaseAdmin
    .from("draw_results")
    .update({
      status: "paid",
      paid_at: new Date().toISOString(),
    })
    .eq("id", proof.draw_result_id);

  revalidatePath("/admin/winners");
  redirect("/admin/winners?success=1");
}