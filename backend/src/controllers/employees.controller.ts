import { Request, Response } from "express";
import { supabase } from "../config/supabase.js";
import puppeteer from "puppeteer";

type GenerateDocBody = {
  templateId: string;
};

function renderTemplate(templateHtml: string, ctx: { employee: any; company: any }) {
    const { employee, company } = ctx;
    let html = templateHtml;

    const replacements: Record<string, string> = {
        "{{employee_name}}": employee.name ?? "",
        "{{company_name}}": company.name ?? "",
        "{{date_of_joining}}": employee.date_of_joining ?? "",
        "{{job_title}}": employee.job_title ?? "",
        "{{annual_ctc}}": employee.annual_ctc ? String(employee.annual_ctc) : "",
    };

    for (const [key, value] of Object.entries(replacements)) {
        html = html.replaceAll(key, value);
    }

    return html;
}

async function generatePdfFromHtml(html: string): Promise<Buffer> {
    const browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    try {
        const page = await browser.newPage();
        page.setDefaultNavigationTimeout(0);
        await page.setContent(html, { waitUntil: "domcontentloaded", timeout: 0 });

        const pdfBuffer = await page.pdf({
            format: "A4",
            printBackground: true,
            margin: { top: "20mm", bottom: "20mm", left: "15mm", right: "15mm" },
        });

        return Buffer.from(pdfBuffer);
    } finally {
        await browser.close();
    }
}

export const createEmployeeDocuments = async (req: Request<{ employeeId: string }, any, GenerateDocBody>, res: Response) => {
    const { employeeId } = req.params;
    const { templateId } = req.body;

    if (!templateId) {
      return res.status(400).json({ error: "templateId is required." });
    }

    try {
      // 1) Fetch employee
      const { data: employee, error: employeeError } = await supabase
        .from("employees")
        .select("*")
        .eq("id", employeeId)
        .single();

      if (employeeError || !employee) {
        console.error(employeeError);
        return res.status(404).json({ error: "Employee not found." });
      }

      // 2) Fetch company
      const { data: company, error: companyError } = await supabase
        .from("companies")
        .select("*")
        .eq("id", employee.company_id)
        .single();

      if (companyError || !company) {
        console.error(companyError);
        return res.status(404).json({ error: "Company not found." });
      }

      // 3) Fetch template
      const { data: template, error: templateError } = await supabase
        .from("document_templates")
        .select("*")
        .eq("id", templateId)
        .single();

      if (templateError || !template) {
        console.error(templateError);
        return res.status(404).json({ error: "Template not found." });
      }

      // 4) Render HTML from template.body_html
      const html = renderTemplate(template.body_html, { employee, company });

      // 5) Generate PDF with Puppeteer
      const pdfBuffer = await generatePdfFromHtml(html);

      // 6) Upload to Supabase Storage
      const now = new Date();
      const safeName = `${employee.name.replace(/\s+/g, "_")}_${template.slug || template.id}`;
      const filePath = `${employee.company_id}/${employeeId}/${safeName}_${now.getTime()}.pdf`;

      const { error: uploadError } = await supabase.storage
        .from("employee-documents")
        .upload(filePath, pdfBuffer, {
          contentType: "application/pdf",
          upsert: false,
        });

      if (uploadError) {
        console.error(uploadError);
        return res.status(500).json({ error: uploadError.message });
      }

      // 7) Insert employee_documents row
      const { data: docRow, error: docError } = await supabase
        .from("employee_documents")
        .insert({
          employee_id: employeeId,
          company_id: employee.company_id,
          template_id: templateId,
          file_name: safeName + ".pdf",
          file_path: filePath,
          document_type: template.document_type,
        })
        .select("*")
        .single();

      if (docError) {
        console.error(docError);
        return res.status(500).json({ error: docError.message });
      }

      return res.status(201).json(docRow);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Unexpected error generating document." });
    }
}

export const getEmployeeDetails = async (req: Request<{ employeeId: string }>, res: Response) => {
    try {
      const { employeeId } = req.params;

      const { data, error } = await supabase
        .from("employees")
        .select(
          `
          *,
          companies (
            id,
            name,
            logo_url
          )
        `
        )
        .eq("id", employeeId)
        .single();

      if (error || !data) {
        console.error(error);
        return res.status(404).json({ error: "Employee not found." });
      }

      return res.json(data);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Unexpected error fetching employee." });
    }
}

type UpdateEmployeeBody = {
  name?: string;
  jobTitle?: string;
  department?: string;
  mobile?: string;
  email?: string;
  dateOfJoining?: string;
  gender?: string;
  annualCtc?: number;
  status?: string;
};

export const updateEmployeeDetails = async (req: Request<{ employeeId: string }, any, UpdateEmployeeBody>, res: Response) => {
    try {
      const { employeeId } = req.params;
      const {
        name,
        jobTitle,
        department,
        mobile,
        email,
        dateOfJoining,
        gender,
        annualCtc,
        status
      } = req.body;

      const update: any = {};
      if (name !== undefined) update.name = name;
      if (jobTitle !== undefined) update.job_title = jobTitle;
      if (department !== undefined) update.department = department;
      if (mobile !== undefined) update.mobile = mobile;
      if (email !== undefined) update.email = email;
      if (dateOfJoining !== undefined) update.date_of_joining = dateOfJoining;
      if (gender !== undefined) update.gender = gender;
      if (annualCtc !== undefined) update.annual_ctc = annualCtc;
      if (status !== undefined) update.status = status;

      const { data, error } = await supabase
        .from("employees")
        .update(update)
        .eq("id", employeeId)
        .select("*")
        .single();

      if (error) {
        console.error(error);
        return res.status(500).json({ error: error.message });
      }

      return res.json(data);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Unexpected error updating employee." });
    }
}

export const uploadEmployeeAvatar = async (req: Request<{ employeeId: string }>, res: Response) => {
    try {
      const { employeeId } = req.params;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ error: "No file provided." });
      }

      if (file.size > 5 * 1024 * 1024) {
        return res.status(400).json({ error: "File too large." });
      }

      const { data: employee, error: empError } = await supabase
        .from("employees")
        .select("id, company_id")
        .eq("id", employeeId)
        .single();

      if (empError || !employee) {
        console.error(empError);
        return res.status(404).json({ error: "Employee not found." });
      }

      const ext = file.originalname.split(".").pop() || "jpg";
      const path = `${employee.company_id}/${employeeId}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file.buffer, {
          cacheControl: "3600",
          upsert: true,
          contentType: file.mimetype,
        });

      if (uploadError) {
        console.error(uploadError);
        return res.status(500).json({ error: uploadError.message });
      }

      // Get public URL (bucket must be public)
      const { data: publicData } = supabase.storage
        .from("avatars")
        .getPublicUrl(path);

      const avatarUrl = publicData.publicUrl;
      const now = new Date().toISOString();

      const { data: updated, error: updateError } = await supabase
        .from("employees")
        .update({ avatar_url: avatarUrl, updated_at: now })
        .eq("id", employeeId)
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
        .json({ error: "Unexpected error uploading avatar." });
    }
}

export const getEmployeeDocuments = async (req: Request<{ employeeId: string }>, res: Response) => {
    try {
      const { employeeId } = req.params;

      const { data, error } = await supabase
        .from("employee_documents")
        .select(
          `
          id,
          employee_id,
          company_id,
          template_id,
          file_path,
          document_type,
          created_at,
          document_templates!employee_documents_template_id_fkey (
            id,
            name
          )
        `
        )
        .eq("employee_id", employeeId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
        return res.status(500).json({ error: error.message });
      }

      // Map to match EmployeeDocument type
      const docs =
        data?.map((row: any) => ({
          id: row.id,
          employee_id: row.employee_id,
          company_id: row.company_id,
          template_id: row.template_id,
          file_path: row.file_path,
          document_type: row.document_type,
          created_at: row.created_at,
          template: row.document_templates
            ? {
                id: row.document_templates.id,
                name: row.document_templates.name,
              }
            : null,
        })) ?? [];

      return res.json(docs);
    } catch (err) {
      console.error(err);
      return res
        .status(500)
        .json({ error: "Unexpected error fetching employee documents." });
    }
}

export const downloadEmployeeDocument = async (req: Request<{ employeeId: string; documentId: string }>, res: Response) => {
    try {
      const { documentId } = req.params;

      const { data: doc, error } = await supabase
        .from("employee_documents")
        .select("id, file_path")
        .eq("id", documentId)
        .single();

      if (error || !doc) {
        console.error(error);
        return res.status(404).json({ error: "Document not found." });
      }

      const { data: signed, error: signedError } = await supabase.storage
        .from("employee-documents")
        .createSignedUrl(doc.file_path, 60 * 10); // 10 minutes

      if (signedError || !signed) {
        console.error(signedError);
        return res
          .status(500)
          .json({ error: signedError?.message ?? "Failed to sign URL." });
      }

      return res.json({ url: signed.signedUrl });
    } catch (err) {
      console.error(err);
      return res
        .status(500)
        .json({ error: "Unexpected error generating download URL." });
    }
}

export const previewEmployeeDocument = async (
  req: Request<{ employeeId: string }, any, any, { templateId?: string }>,
  res: Response
) => {
  try {
    const { employeeId } = req.params;
    const templateId = req.query.templateId as string | undefined;

    if (!templateId) {
      return res.status(400).json({ error: "templateId is required." });
    }

    // 1) Fetch employee
    const { data: employee, error: employeeError } = await supabase
      .from("employees")
      .select("*")
      .eq("id", employeeId)
      .single();

    if (employeeError || !employee) {
      console.error(employeeError);
      return res.status(404).json({ error: "Employee not found." });
    }

    // 2) Fetch company
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("*")
      .eq("id", employee.company_id)
      .single();

    if (companyError || !company) {
      console.error(companyError);
      return res.status(404).json({ error: "Company not found." });
    }

    // 3) Fetch template
    const { data: template, error: templateError } = await supabase
      .from("document_templates")
      .select("*")
      .eq("id", templateId)
      .single();

    if (templateError || !template) {
      console.error(templateError);
      return res.status(404).json({ error: "Template not found." });
    }

    // 4) Render HTML & generate PDF (reuse your helpers)
    const html = renderTemplate(template.body_html, { employee, company });
    const pdfBuffer = await generatePdfFromHtml(html);

    // 5) Stream PDF inline
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'inline; filename="preview.pdf"');
    return res.send(pdfBuffer);
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ error: "Unexpected error generating document preview." });
  }
};
