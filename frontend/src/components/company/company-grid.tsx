"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { Company } from "@/types/company";
import { API_BASE_URL } from "@/lib/api";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";

type CompanyGridProps = {
  initialCompanies: Company[];
};

type NewCompanyForm = {
  name: string;
  code: string;
  logoUrl: string;
};

export function CompanyGrid({ initialCompanies }: CompanyGridProps) {
  const router = useRouter();

  const [companies, setCompanies] =
    React.useState<Company[]>(initialCompanies);

  const [open, setOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [logoFile, setLogoFile] = React.useState<File | null>(null);

  const [form, setForm] = React.useState<NewCompanyForm>({
    name: "",
    code: "",
    logoUrl: "",
  });

  const onCardClick = (companyId: string) => {
    router.push(`/companies/${companyId}/dashboard`);
  };

  const handleChange = (
    field: keyof NewCompanyForm,
    value: string
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!form.name.trim()) {
      setError("Company name is required.");
      return;
    }

    try {
      setSubmitting(true);

      const res = await fetch(`${API_BASE_URL}/companies`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name.trim(),
          code: form.code.trim() || null,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(
          `Failed to create company: ${res.status} ${text}`
        );
      }

      let created = (await res.json()) as Company;

      if (logoFile) {
        const fd = new FormData();
        fd.append("logo", logoFile);

        const logoRes = await fetch(
          `${API_BASE_URL}/companies/${created.id}/logo`,
          {
            method: "POST",
            body: fd,
          }
        );

        if (logoRes.ok) {
          const updated = (await logoRes.json()) as Company;
          created = updated;
        } else {
          console.error("Logo upload failed:", await logoRes.text());
        }
      }

      setLogoFile(null);
      setCompanies((prev) => [created, ...prev]);
      setForm({ name: "", code: "", logoUrl: "" });
      setOpen(false);

      router.refresh();
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const initialsForCompany = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return "?";
    const parts = trimmed.split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (
      (parts[0][0] ?? "") + (parts[1][0] ?? "")
    ).toUpperCase();
  };

  return (
    <div className="space-y-4">
      {/* Companies grid */}
      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {/* Add company card */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button
              type="button"
              className="flex h-40 flex-col items-center justify-center rounded-xl border border-dashed border-muted-foreground/40 bg-muted/30 text-sm font-medium text-muted-foreground transition hover:border-primary/60 hover:bg-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <span className="mb-2 flex h-10 w-10 items-center justify-center rounded-full border border-dashed border-primary/40 text-2xl leading-none">
                +
              </span>
              Add company
            </button>
          </DialogTrigger>

          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create company</DialogTitle>
              <DialogDescription>
                Add a company workspace. You can update details later
                from the settings.
              </DialogDescription>
            </DialogHeader>

            <form
              className="space-y-4 py-2"
              onSubmit={handleSubmit}
            >
              <div className="space-y-1">
                <label className="text-sm font-medium" htmlFor="name">
                  Company name<span className="text-destructive">*</span>
                </label>
                <Input
                  id="name"
                  placeholder="Demo Company"
                  autoFocus
                  value={form.name}
                  onChange={(e) =>
                    handleChange("name", e.target.value)
                  }
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium" htmlFor="code">
                  Company code
                </label>
                <Input
                  id="code"
                  placeholder="Optional short code, e.g. DEMO"
                  value={form.code}
                  onChange={(e) =>
                    handleChange("code", e.target.value.toUpperCase())
                  }
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium" htmlFor="logoUrl">
                  Upload Logo
                </label>

                <input
                  id="logoUrl"
                  type="file"
                  accept="image/*"
                  className="
                    mt-1 block w-full text-xs
                    cursor-pointer
                    bg-gray-50
                    file:mr-3 file:rounded-md file:border file:border-gray-300
                    file:bg-gray-100 file:px-3 file:py-1.5
                    file:text-xs file:font-medium file:text-gray-700
                    file:hover:bg-gray-200
                    file:transition file:duration-150
                  "
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    setLogoFile(file);
                  }}
                />

                <p className="mt-1 text-[11px] text-muted-foreground">
                  Square logo works best, up to 2–3MB.
                </p>
              </div>


              {error && (
                <p className="text-xs text-destructive">{error}</p>
              )}

              <DialogFooter className="mt-2 flex justify-end gap-2">
                <DialogClose asChild disabled={submitting}>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-8 px-3 text-xs"
                  >
                    Cancel
                  </Button>
                </DialogClose>
                <Button
                  type="submit"
                  className="h-8 px-4 text-xs"
                  disabled={submitting}
                >
                  {submitting ? "Creating..." : "Create company"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Existing companies */}
        {companies.map((company) => (
          <Card
            key={company.id}
            className="group flex h-40 cursor-pointer flex-col items-center justify-center gap-2 border border-border/70 bg-card/80 transition hover:border-primary/70 hover:bg-card"
            onClick={() => onCardClick(company.id)}
          >
            <CardHeader className="flex items-center justify-center p-0">
              <Avatar className="h-14 w-14 border border-border/70">
                {company.logo_url && (
                  <AvatarImage src={company.logo_url} alt={company.name} />
                )}
                <AvatarFallback className="text-base font-semibold">
                  {initialsForCompany(company.name)}
                </AvatarFallback>
              </Avatar>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-1 p-0">
              <CardTitle className="line-clamp-1 text-sm font-medium">
                {company.name}
              </CardTitle>
              {company.code && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] uppercase tracking-wide text-muted-foreground">
                  {company.code}
                </span>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {companies.length === 0 && (
        <p className="text-xs text-muted-foreground">
          You don&apos;t have any companies yet. Click &quot;Add
          company&quot; to create your first one.
        </p>
      )}
    </div>
  );
}
