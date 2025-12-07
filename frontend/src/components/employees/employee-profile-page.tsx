"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { EmployeeWithCompany } from "@/types/employee";
import type { EmployeeDocument, Template } from "@/types/documents";
import { PersonalDetailsForm } from "./personal-details-form";
import { EmploymentDetailsForm } from "./employment-details-form";
import { EmployeeDocumentsTab } from "./employee-documents-tab";

type Section =
  | "personal"
  | "employment"
  | "custom"
  | "background"
  | "bank"
  | "requests"
  | "permissions"
  | "attendance"
  | "salary"
  | "leave"
  | "penalty"
  | "tax"
  | "documents"
  | "settings";

type Props = {
  companyId: string;
  employee: EmployeeWithCompany;
  documents: EmployeeDocument[];
  templates: Template[];
};

export function EmployeeProfilePage({
  companyId,
  employee,
  documents,
  templates,
}: Props) {
  const router = useRouter();
  const [section, setSection] = React.useState<Section>("personal");
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(
    employee.avatar_url ? employee.avatar_url + `?v=${employee.updated_at}` : null
  );

  return (
    <div className="flex gap-4">
      {/* Left sidebar */}
      <aside className="flex w-64 flex-col border-r bg-card/40">
        <div className="flex items-center gap-3 px-4 py-4">
          <div className="relative h-12 w-12 overflow-hidden rounded-full bg-muted">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={employee.name}
                fill
                sizes="(max-width: 768px) 40px, 64px"
                className="rounded-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs font-medium text-muted-foreground">
                {employee.name
                  .split(" ")
                  .map((x) => x[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">{employee.name}</span>
            <span className="text-xs text-muted-foreground">
              {employee.job_title || "No job title"}
            </span>
          </div>
        </div>

        <Separator />

        <nav className="flex flex-1 flex-col gap-1 px-2 py-3 text-xs">
          {(
            [
              ["personal", "Personal Details"],
              ["employment", "Employment Details"],
              ["custom", "Custom Details"],
              ["background", "Background Verification"],
              ["bank", "Bank Account"],
              ["requests", "Requests"],
              ["permissions", "User Permission"],
              ["attendance", "Attendance Details"],
              ["salary", "Salary Details"],
              ["leave", "Leave & Balance Details"],
              ["penalty", "Penalty & Overtime Details"],
              ["tax", "Tax Declarations"],
              ["documents", "Documents"],
              ["settings", "Additional Settings"],
            ] as [Section, string][]
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setSection(value)}
              className={cn(
                "flex w-full items-center rounded-md px-2 py-1.5 text-left hover:bg-muted",
                section === value && "bg-muted font-medium"
              )}
            >
              {label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Right content */}
      <section className="flex-1 space-y-4">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              {sectionTitle(section)}
            </h1>
            <p className="text-xs text-muted-foreground">
              {sectionSubtitle(section)}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              router.push(`/companies/${companyId}/dashboard`)
            }
          >
            Back to staff list
          </Button>
        </header>

        <Separator />

        {section === "personal" && <PersonalDetailsForm employee={employee} />}
        {section === "employment" && (
          <EmploymentDetailsForm employee={employee} />
        )}
        {section === "documents" && (
          <EmployeeDocumentsTab
            employeeId={employee.id}
            initialDocuments={documents}
            templates={templates}
          />
        )}

        {/* Dummy placeholders for the rest */}
        {section !== "personal" &&
          section !== "employment" &&
          section !== "documents" && (
            <p className="text-xs text-muted-foreground">
              This section is a placeholder for now. You can wire it up in a
              later iteration.
            </p>
          )}
      </section>
    </div>
  );
}

function sectionTitle(section: Section) {
  switch (section) {
    case "personal":
      return "Personal Details";
    case "employment":
      return "Employment Details";
    case "documents":
      return "Documents";
    default:
      return "Coming soon";
  }
}

function sectionSubtitle(section: Section) {
  switch (section) {
    case "personal":
      return "Update contact info and basic identity details.";
    case "employment":
      return "Track the employee's role, branch and joining details.";
    case "documents":
      return "View, generate and download HR documents for this employee.";
    default:
      return "This area is reserved for future modules.";
  }
}
