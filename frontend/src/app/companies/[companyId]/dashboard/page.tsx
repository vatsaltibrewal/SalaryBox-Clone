import { API_BASE_URL } from "@/lib/api";
import type { Company } from "@/types/company";
import type {
  EmployeeRow,
  EmployeesApiResponse,
} from "@/types/employee";
import { CompanyDashboard } from "@/components/company/company-dashboard";

type DashboardPageProps = {
  params: Promise<{ companyId: string }>;
};

export default async function CompanyDashboardPage({
  params,
}: DashboardPageProps) {
  const { companyId } = await params;

  const [companyRes, employeesRes] = await Promise.all([
    fetch(`${API_BASE_URL}/companies/${companyId}`, {
      cache: "no-store",
    }),
    fetch(
      `${API_BASE_URL}/companies/${companyId}/employees?page=1&pageSize=1000`,
      {
        cache: "no-store",
      }
    ),
  ]);

  if (!companyRes.ok) {
    throw new Error(
      `Failed to fetch company: ${companyRes.status} ${companyRes.statusText}`
    );
  }

  if (!employeesRes.ok) {
    throw new Error(
      `Failed to fetch employees: ${employeesRes.status} ${employeesRes.statusText}`
    );
  }

  const company = (await companyRes.json()) as Company;
  const employeesJson =
    (await employeesRes.json()) as EmployeesApiResponse;

  const employees: EmployeeRow[] =
    employeesJson.data?.map((emp) => ({
      id: emp.id,
      name: emp.name,
      jobTitle: emp.job_title,
      department: emp.department,
      mobile: emp.mobile,
      email: emp.email,
      dateOfJoining: emp.date_of_joining,
      gender: emp.gender,
      status: emp.status,
      createdAt: emp.created_at,
    })) ?? [];

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6">
        <CompanyDashboard
          companyId={companyId}
          companyName={company.name}
          employees={employees}
        />
      </div>
    </main>
  );
}
