import { API_BASE_URL } from "@/lib/api";
import type { Company } from "@/types/company";
import { AddEmployeeWizard } from "@/components/employees/add-employee-wizard";

type NewEmployeePageProps = {
  params: Promise<{ companyId: string }>;
};

export default async function NewEmployeePage({
  params,
}: NewEmployeePageProps) {
  const { companyId } = await params;

  const res = await fetch(`${API_BASE_URL}/companies/${companyId}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to load company");
  }

  const company = (await res.json()) as Company;

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Add employee
          </h1>
          <p className="text-sm text-muted-foreground">
            Create a new staff member in{" "}
            <span className="font-medium text-foreground">
              {company.name}
            </span>
            . You can also generate offer letters in the next step.
          </p>
        </header>

        <AddEmployeeWizard companyId={companyId} />
      </div>
    </main>
  );
}
