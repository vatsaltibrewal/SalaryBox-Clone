import { API_BASE_URL } from "@/lib/api";
import type { EmployeeWithCompany } from "@/types/employee";
import type { EmployeeDocument, Template } from "@/types/documents";
import { EmployeeProfilePage } from "@/components/employees/employee-profile-page";

type EmployeePageProps = {
  params: Promise<{ companyId: string; employeeId: string }>;
};

export default async function EmployeePage({ params }: EmployeePageProps) {
  const { companyId, employeeId } = await params;

  const [empRes, docsRes, tplRes] = await Promise.all([
    fetch(`${API_BASE_URL}/employees/${employeeId}`, { cache: "no-store" }),
    fetch(`${API_BASE_URL}/employees/${employeeId}/documents`, {
      cache: "no-store",
    }),
    fetch(`${API_BASE_URL}/document-templates?companyId=${companyId}`, {
      cache: "no-store",
    }),
  ]);

  if (!empRes.ok) throw new Error("Failed to load employee");
  if (!docsRes.ok) throw new Error("Failed to load documents");
  if (!tplRes.ok) throw new Error("Failed to load templates");

  const employee = (await empRes.json()) as EmployeeWithCompany;
  const documents = (await docsRes.json()) as EmployeeDocument[];
  const templates = (await tplRes.json()) as Template[];

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <EmployeeProfilePage
          companyId={companyId}
          employee={employee}
          documents={documents}
          templates={templates}
        />
      </div>
    </main>
  );
}
