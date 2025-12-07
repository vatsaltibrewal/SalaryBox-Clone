import { Request, Response } from "express";
import { supabase } from "../config/supabase.js";

type CreateEmployeeBody = {
  name: string;
  jobTitle?: string;
  department?: string;
  mobile: string;
  email: string;
  dateOfJoining: string; // ISO string
  gender?: string;
  annualCtc?: number;
};

export const getCompanies = async (_req: Request, res: Response) => {
    try {
        const { data, error } = await supabase
            .from("companies")
            .select("*")
            .order("created_at", { ascending: true });

        if (error) throw error;

        return res.json(data);
    } catch (err) {
        console.error("[GET /companies]", err);
        return res.status(500).json({ message: "Failed to fetch companies" });
    }
}

export const createCompany = async (req: Request, res: Response) => {
    try {
        const { name, code, logoUrl } = req.body as {
            name?: string;
            code?: string;
            logoUrl?: string;
        };

        if (!name || typeof name !== "string") {
            return res.status(400).json({ message: "name is required" });
        }

        const insertPayload = {
            name,
            code: code || null,
            logo_url: logoUrl || null,
        };

        const { data, error } = await supabase
            .from("companies")
            .insert(insertPayload)
            .select("*")
            .single();

        if (error) throw error;

        return res.status(201).json(data);
    } catch (err: any) {
        console.error("[POST /companies]", err);
        // Unique constraint on code, etc.
        return res.status(500).json({
            message: "Failed to create company",
            details: err?.message ?? String(err),
        });
    }
}

export const getCompanyById = async (req: Request, res: Response) => {
    const { companyId } = req.params;

    try {
        const { data, error } = await supabase
            .from("companies")
            .select("*")
            .eq("id", companyId)
            .single();

        if (error) throw error;
        if (!data) return res.status(404).json({ message: "Company not found" });

        return res.json(data);
    } catch (err) {
        console.error("[GET /companies/:companyId]", err);
        return res.status(500).json({ message: "Failed to fetch company" });
    }
}

export const getEmployeesByCompanyId = async (req: Request, res: Response) => {
    const { companyId } = req.params;

    const page = Math.max(parseInt((req.query.page as string) ?? "1", 10) || 1, 1);
    const pageSizeRaw = parseInt((req.query.pageSize as string) ?? "20", 10) || 20;
    const pageSize = Math.min(Math.max(pageSizeRaw, 1), 100);
    const search = (req.query.search as string | undefined) ?? "";

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    try {
        let query = supabase
        .from("employees")
        .select("*", { count: "exact" })
        .eq("company_id", companyId);

        if (search) {
            // simple case-insensitive search on name
            query = query.ilike("name", `%${search}%`);
        }

        const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(from, to);

        if (error) throw error;

        return res.json({
            data: data ?? [],
            pagination: {
                page,
                pageSize,
                total: count ?? 0,
            },
        });
    } catch (err) {
        console.error("[GET /companies/:companyId/employees]", err);
        return res.status(500).json({ message: "Failed to fetch employees for company" });
    }
}

export const createEmployeeForCompany = async (req: Request<{ companyId: string }, any, CreateEmployeeBody>, res: Response) => {
    try {
        const { companyId } = req.params;
        const {
            name,
            jobTitle,
            department,
            mobile,
            email,
            dateOfJoining,
            gender,
            annualCtc,
        } = req.body;

        if (!name || !mobile || !email || !dateOfJoining) {
            return res.status(400).json({
                error: "name, mobile, email and dateOfJoining are required.",
            });
        }

        const loginOtp = Math.floor(100000 + Math.random() * 900000).toString();

        const { data, error } = await supabase
        .from("employees")
        .insert({
            company_id: companyId,
            name,
            job_title: jobTitle ?? null,
            department: department ?? null,
            mobile,
            email,
            date_of_joining: dateOfJoining,
            gender: gender ?? null,
            annual_ctc: annualCtc ?? null,
            login_otp: loginOtp,
            status: "active",
        })
        .select("*")
        .single();

        if (error) {
            console.error(error);
            return res.status(500).json({ error: error.message });
        }

        return res.status(201).json(data);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Unexpected error creating employee." });
    }
}

export const uploadCompanyLogo = async (req: Request<{ companyId: string }>, res: Response) => {
    try {
      const { companyId } = req.params;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ error: "No file provided." });
      }

      const { data: company, error: companyError } = await supabase
        .from("companies")
        .select("id")
        .eq("id", companyId)
        .single();

      if (companyError || !company) {
        console.error(companyError);
        return res.status(404).json({ error: "Company not found." });
      }

      const ext = file.originalname.split(".").pop() || "png";
      const path = `${companyId}/logo.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("company-logos")
        .upload(path, file.buffer, {
          cacheControl: "3600",
          upsert: true,
          contentType: file.mimetype,
        });

      if (uploadError) {
        console.error(uploadError);
        return res.status(500).json({ error: uploadError.message });
      }

      const { data: publicData } = supabase.storage
        .from("company-logos")
        .getPublicUrl(path);

      const logoUrl = publicData.publicUrl;

      const { data: updated, error: updateError } = await supabase
        .from("companies")
        .update({ logo_url: logoUrl })
        .eq("id", companyId)
        .select("*")
        .single();

      if (updateError) {
        console.error(updateError);
        return res.status(500).json({ error: updateError.message });
      }

      return res.json(updated);
    } catch (err) {
      console.error(err);
      return res
        .status(500)
        .json({ error: "Unexpected error uploading company logo." });
    }
}