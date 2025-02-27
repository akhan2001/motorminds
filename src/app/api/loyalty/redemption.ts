// /pages/api/redemption.ts
import { createClient } from "@/utils/supabase/server";
import { NextApiRequest } from "next";
import { NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId, pointsToRedeem } = req.body;

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('users')
    .update({ points: supabase.raw('points - ?', [pointsToRedeem]) })
    .eq('id', userId);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ data });
}