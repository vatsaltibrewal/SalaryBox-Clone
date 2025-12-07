import { Router, Request, Response } from "express";
import { supabase } from "../config/supabase.js";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
    try {
      const companyId = req.query.companyId as string | undefined;

      let query = supabase.from("document_templates").select("*");

      if (companyId) {
        // Either company-specific or global templates
        query = query.or(`company_id.eq.${companyId},company_id.is.null`);
      }

      const { data, error } = await query.order("name", { ascending: true });

      if (error) {
        console.error(error);
        return res.status(500).json({ error: error.message });
      }

      return res.json(data ?? []);
    } catch (err) {
      console.error(err);
      return res
        .status(500)
        .json({ error: "Unexpected error fetching document templates." });
    }
  }
);

export default router;