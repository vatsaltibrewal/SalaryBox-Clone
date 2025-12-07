"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { API_BASE_URL } from "@/lib/api";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";

const employeeSchema = z.object({
  name: z.string().min(2, "Name is required"),
  jobTitle: z.string().optional(),
  department: z.string().optional(),
  mobile: z.string().min(10, "Mobile is required"),
  email: z.string().email("Invalid email"),
  dateOfJoining: z.string().min(1, "Date of joining is required"),
  gender: z.string().optional(),

  // 👇 keep as string, just validate that it is a positive number if present
  annualCtc: z
    .string()
    .optional()
    .refine(
      (v) => !v || (!Number.isNaN(Number(v)) && Number(v) >= 0),
      "CTC must be a positive number"
    ),
});


type EmployeeFormValues = z.infer<typeof employeeSchema>;

type AddEmployeeWizardProps = {
  companyId: string;
};

type Template = {
  id: string;
  name: string;
  document_type: string;
};

export function AddEmployeeWizard({ companyId }: AddEmployeeWizardProps) {
  const router = useRouter();

  const [step, setStep] = React.useState<1 | 2>(1);
  const [submitting, setSubmitting] = React.useState(false);
  const [apiError, setApiError] = React.useState<string | null>(null);

  const [createdEmployeeId, setCreatedEmployeeId] =
    React.useState<string | null>(null);

  const [templates, setTemplates] = React.useState<Template[]>([]);
  const [avatarFile, setAvatarFile] = React.useState<File | null>(null);
  const [selectedTemplateIds, setSelectedTemplateIds] = React.useState<
    string[]
  >([]);

  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = React.useState(false);


  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
        name: "",
        jobTitle: "",
        department: "",
        mobile: "",
        email: "",
        dateOfJoining: "",
        gender: "",
        annualCtc: "",
    },
  });


  // Load templates once for step 2
  React.useEffect(() => {
    const loadTemplates = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/document-templates?companyId=${companyId}`
        );
        if (!res.ok) return;
        const json = (await res.json()) as Template[];
        setTemplates(json);
      } catch (err) {
        console.error("Failed to load templates", err);
      }
    };
    loadTemplates();
  }, [companyId]);

    const handleSubmitStep1 = async (values: EmployeeFormValues) => {
        setApiError(null);
        setSubmitting(true);

        try {
            const annualCtcNumber =
            values.annualCtc && values.annualCtc.trim() !== ""
                ? Number(values.annualCtc)
                : undefined;

            const res = await fetch(
            `${API_BASE_URL}/companies/${companyId}/employees`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                name: values.name,
                jobTitle: values.jobTitle,
                department: values.department,
                mobile: values.mobile,
                email: values.email,
                dateOfJoining: values.dateOfJoining,
                gender: values.gender,
                annualCtc: annualCtcNumber,
                }),
            }
            );

            if (!res.ok) {
              const text = await res.text();
              throw new Error(
                  `Failed to create employee: ${res.status} ${text}`
              );
            }

            let created = (await res.json()) as { id: string };

            if (avatarFile) {
              const fd = new FormData();
              fd.append("file", avatarFile);

              const logoRes = await fetch(
                `${API_BASE_URL}/employees/${created.id}/avatar`,
                {
                  method: "POST",
                  body: fd,
                }
              );

              if (logoRes.ok) {
                const updated = (await logoRes.json()) as { id: string };
                created = updated; // use record with logo_url set
              } else {
                console.error("Logo upload failed:", await logoRes.text());
              }
            }

            setAvatarFile(null);
            setCreatedEmployeeId(created.id);
            setStep(2);
        } catch (err) {
            console.error(err);
            setApiError(
            err instanceof Error ? err.message : "Failed to create employee."
            );
        } finally {
            setSubmitting(false);
        }
    };

  const handleGenerateDocuments = async () => {
    if (!createdEmployeeId || selectedTemplateIds.length === 0) {
      router.push(`/companies/${companyId}/dashboard`);
      router.refresh();
      return;
    }

    setApiError(null);
    setSubmitting(true);

    try {
      // Fire requests sequentially to keep it simple
      for (const templateId of selectedTemplateIds) {
        const res = await fetch(
          `${API_BASE_URL}/employees/${createdEmployeeId}/documents`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ templateId }),
          }
        );

        if (!res.ok) {
          const text = await res.text();
          throw new Error(
            `Failed to generate document: ${res.status} ${text}`
          );
        }
      }

      router.push(`/companies/${companyId}/dashboard`);
      router.refresh();
    } catch (err) {
      console.error(err);
      setApiError(
        err instanceof Error ? err.message : "Failed to generate documents."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const toggleTemplate = (id: string, checked: boolean) => {
    setSelectedTemplateIds((prev) =>
      checked ? [...prev, id] : prev.filter((x) => x !== id)
    );
  };

  const handlePreviewTemplate = async (tplId: string) => {
    if (!createdEmployeeId) return;

    try {
      setPreviewLoading(true);
      setPreviewUrl(null);

      const res = await fetch(
        `${API_BASE_URL}/employees/${createdEmployeeId}/documents/preview?templateId=${tplId}`
      );

      if (!res.ok) {
        console.error(await res.text());
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      setPreviewOpen(true);
    } catch (err) {
      console.error(err);
    } finally {
      setPreviewLoading(false);
    }
  };


  if (step === 1) {
    return (
      <div className="space-y-4 rounded-lg border bg-card p-5">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Step 1 · Employee details</h2>
          <p className="text-xs text-muted-foreground">
            Fill in basic information about the employee. You can add more
            details later from the employee profile.
          </p>
        </div>

        <Separator />

        <Form {...form}>
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit(handleSubmitStep1)}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="jobTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job title</FormLabel>
                    <FormControl>
                      <Input placeholder="Software Engineer" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                    <FormControl>
                      <Input placeholder="Engineering" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="mobile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mobile number</FormLabel>
                    <FormControl>
                      <Input placeholder="+91 99999 99999" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="john@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dateOfJoining"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of joining</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender</FormLabel>
                    <Select
                      value={field.value ?? ""}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="annualCtc"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Annual CTC</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="1200000"
                        {...field}
                        // treat as string while typing
                        onChange={(e) => field.onChange(e.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-1">
                <label className="text-sm font-medium" htmlFor="pictureUrl">
                  Upload Picture (optional)
                </label>

                <input
                  id="pictureUrl"
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
                    setAvatarFile(file);
                  }}
                />

                <p className="mt-1 text-[11px] text-muted-foreground">
                  Square logo works best, up to 2–3MB.
                </p>
              </div>
            </div>

            {apiError && (
              <p className="text-xs text-destructive">{apiError}</p>
            )}

            <div className="flex items-center justify-between pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  router.push(`/companies/${companyId}/dashboard`)
                }
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving..." : "Save & continue"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    );
  }

  // Step 2: Documents
  return (
    <div className="space-y-4 rounded-lg border bg-card p-5">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">
          Step 2 · Generate documents (optional)
        </h2>
        <p className="text-xs text-muted-foreground">
          Select which documents to generate for this employee now. You can
          always create more from the employee&apos;s Documents tab later.
        </p>
      </div>

      <Separator />

      {templates.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          No templates configured yet. You can skip this step.
        </p>
      ) : (
        <div className="space-y-3">
          {templates.map((tpl) => (
            <div
              key={tpl.id}
              className="flex items-center justify-between rounded-md border bg-background px-3 py-2 text-sm"
            >
              <label className="flex items-center gap-3">
                <Checkbox
                  checked={selectedTemplateIds.includes(tpl.id)}
                  onCheckedChange={(checked) => toggleTemplate(tpl.id, !!checked)}
                />
                <div className="flex flex-col">
                  <span className="font-medium">{tpl.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {tpl.document_type}
                  </span>
                </div>
              </label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => handlePreviewTemplate(tpl.id)}
                disabled={previewLoading}
              >
                {previewLoading ? "Loading..." : "Preview"}
              </Button>
            </div>
          ))}
        </div>
      )}

      {apiError && (
        <p className="text-xs text-destructive">{apiError}</p>
      )}

      <div className="flex items-center justify-between pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => setStep(1)}
          disabled={submitting}
        >
          ← Back
        </Button>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              router.push(`/companies/${companyId}/dashboard`);
              router.refresh();
            }}
            disabled={submitting}
          >
            Skip for now
          </Button>
          <Button
            type="button"
            onClick={handleGenerateDocuments}
            disabled={submitting || selectedTemplateIds.length === 0}
          >
            {submitting ? "Generating..." : "Generate & finish"}
          </Button>
        </div>
      </div>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-[80vw] w-full h-[90vh] p-0 flex flex-col bg-white">
          <DialogHeader className="px-6 pt-6 pb-2 shrink-0">
            <DialogTitle>Template preview</DialogTitle>
          </DialogHeader>

          <div className="px-6 pb-6 flex-1 overflow-hidden h-full">
            {previewUrl ? (
              <object
                data={previewUrl}
                type="application/pdf"
                className="h-full w-full rounded-md border"
              >
                <p className="text-xs">
                  Your browser does not support embedded PDFs.{" "}
                  <a href={previewUrl} target="_blank" rel="noreferrer" className="underline text-blue-600">
                    Download the PDF
                  </a>
                  .
                </p>
              </object>
            ) : (
              <div className="flex h-full items-center justify-center bg-muted/20">
                <p className="text-sm text-muted-foreground animate-pulse">Loading preview…</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
