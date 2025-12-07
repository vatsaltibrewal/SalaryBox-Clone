"use client";

import * as React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import type { EmployeeWithCompany } from "@/types/employee";
import { API_BASE_URL } from "@/lib/api";

import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const schema = z.object({
  jobTitle: z.string().optional(),
  department: z.string().optional(),
  annualCtc: z
    .string()
    .optional()
    .refine(
      (v) => !v || (!Number.isNaN(Number(v)) && Number(v) >= 0),
      "CTC must be a positive number"
    ),
  status: z.enum(["active", "inactive", "terminated"]).optional(),
});

type FormValues = z.infer<typeof schema>;

export function EmploymentDetailsForm({
  employee,
}: {
  employee: EmployeeWithCompany;
}) {
  const [saving, setSaving] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      jobTitle: employee.job_title ?? "",
      department: employee.department ?? "",
      annualCtc: employee.annual_ctc ? String(employee.annual_ctc) : "",
      status: (employee.status as FormValues["status"]) ?? "active",
    },
  });

  const onSubmit = async (values: FormValues) => {
    setSaving(true);
    setMsg(null);

    // Convert string -> number here safely
    const annualCtcNumber =
      values.annualCtc && values.annualCtc.trim() !== ""
        ? Number(values.annualCtc)
        : undefined;

    try {
      const res = await fetch(`${API_BASE_URL}/employees/${employee.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobTitle: values.jobTitle || null,
          department: values.department || null,
          annualCtc: annualCtcNumber,
          status: values.status ?? null,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }

      setMsg("Employment details updated.");
    } catch (err) {
      console.error(err);
      setMsg("Failed to update employment details.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid gap-4 sm:grid-cols-2">
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
            name="annualCtc"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Annual CTC</FormLabel>
                <FormControl>
                  <Input
                    placeholder="1200000"
                    inputMode="numeric"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select
                  value={field.value ?? "active"}
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="terminated">Terminated</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {msg && <p className="text-xs text-muted-foreground">{msg}</p>}

        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save changes"}
        </Button>
      </form>
    </Form>
  );
}
