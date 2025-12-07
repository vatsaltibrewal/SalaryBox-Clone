"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { API_BASE_URL } from "@/lib/api";
import type { EmployeeWithCompany } from "@/types/employee";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import * as React from "react";
import { useRouter } from "next/navigation";

const personalSchema = z.object({
  name: z.string().min(2),
  mobile: z.string().min(5),
  email: z.string().email(),
  dateOfJoining: z.string().min(1),
});

type Values = z.infer<typeof personalSchema>;

export function PersonalDetailsForm({
  employee,
}: {
  employee: EmployeeWithCompany;
}) {
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(
    employee.avatar_url ?? null
  );
  const [avatarUploading, setAvatarUploading] = React.useState(false);
  const [avatarError, setAvatarError] = React.useState<string | null>(null);

  const router = useRouter();

  const form = useForm<Values>({
    resolver: zodResolver(personalSchema),
    defaultValues: {
      name: employee.name ?? "",
      mobile: employee.mobile ?? "",
      email: employee.email ?? "",
      dateOfJoining: employee.date_of_joining?.slice(0, 10) ?? "",
    },
  });

  const onSubmit = async (values: Values) => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`${API_BASE_URL}/employees/${employee.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          mobile: values.mobile,
          email: values.email,
          dateOfJoining: values.dateOfJoining,
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }
      setMessage("Saved successfully.");
      window.location.reload();
    } catch (err) {
      console.error(err);
      setMessage("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    setAvatarError(null);

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(
      `${API_BASE_URL}/employees/${employee.id}/avatar`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!res.ok) {
      console.error(await res.text());
      setAvatarUploading(false);
      return;
    }

    const updated = await res.json();
    setAvatarUrl(updated.avatar_url ?? null);
    setAvatarUploading(false);
    router.refresh();
  };

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input {...field} />
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
                <FormLabel>Mobile</FormLabel>
                <FormControl>
                  <Input {...field} />
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
                  <Input type="email" {...field} />
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

          <div className="space-y-2">
            <FormLabel>Upload New Profile photo (optional)</FormLabel>
            <FormControl>
              <Input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                disabled={avatarUploading}
              />
            </FormControl>
            <p className="text-xs text-muted-foreground">
              {avatarUploading
                ? "Uploading..."
                : "Upload a clear, square image (JPG, PNG, etc.)."}
            </p>
            {avatarError && (
              <p className="text-xs text-destructive">{avatarError}</p>
            )}
          </div>
        </div>

        {message && (
          <p className="text-xs text-muted-foreground">{message}</p>
        )}

        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save changes"}
        </Button>
      </form>
    </Form>
  );
}
