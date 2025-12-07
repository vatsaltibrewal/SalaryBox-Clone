import { API_BASE_URL } from "@/lib/api";
import type { Company } from "@/types/company";
import { CompanyGrid } from "@/components/company/company-grid";

export default async function HomePage() {
  const res = await fetch(`${API_BASE_URL}/companies`, {
    cache: "no-store", // always show freshest companies
  });

  if (!res.ok) {
    throw new Error(
      `Failed to fetch companies: ${res.status} ${res.statusText}`
    );
  }

  const companies = (await res.json()) as Company[];

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-10">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">
            Select a company
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Choose a company to manage employees, or create a new one. This is
            your Netflix-style selector for all organizations.
          </p>
        </header>

        <CompanyGrid initialCompanies={companies} />
      </div>
    </main>
  );
}
