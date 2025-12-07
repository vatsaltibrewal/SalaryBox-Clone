export type Template = {
  id: string;
  company_id: string | null;
  name: string;
  slug: string | null;
  document_type: string;
  body_html: string;
};

export type EmployeeDocument = {
  id: string;
  employee_id: string;
  company_id: string;
  template_id: string | null;
  file_path: string;
  document_type: string;
  created_at: string;
  template?: {
    id: string;
    name: string;
  } | null;
};
