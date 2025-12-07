"use client";

import * as React from "react";
import { API_BASE_URL } from "@/lib/api";
import type { EmployeeDocument, Template } from "@/types/documents";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Props = {
  employeeId: string;
  initialDocuments: EmployeeDocument[];
  templates: Template[];
};

export function EmployeeDocumentsTab({
  employeeId,
  initialDocuments,
  templates,
}: Props) {
  const [docs, setDocs] = React.useState(initialDocuments);
  const [templateId, setTemplateId] = React.useState<string | undefined>();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = React.useState(false);


  const refreshDocs = async () => {
    const res = await fetch(
      `${API_BASE_URL}/employees/${employeeId}/documents`,
      { cache: "no-store" }
    );
    if (!res.ok) return;
    const json = (await res.json()) as EmployeeDocument[];
    setDocs(json);
  };

  const handleGenerate = async () => {
    if (!templateId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${API_BASE_URL}/employees/${employeeId}/documents`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ templateId }),
        }
      );
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }
      await refreshDocs();
    } catch (err) {
      console.error(err);
      setError("Failed to generate document.");
    } finally {
      setLoading(false);
    }
  };

    const handleDownload = async (docId: string) => {
        try {
            const res = await fetch(
                `${API_BASE_URL}/employees/${employeeId}/documents/${docId}/download`
            );
            if (!res.ok) {
                console.error(await res.text());
                return;
            }
            const json = (await res.json()) as { url: string };
            window.open(json.url, "_blank");
        } catch (err) {
            console.error(err);
        }
    };
  
  const handlePreview = async (tplId?: string) => {
    if (!tplId) return;

    try {
      setPreviewLoading(true);
      setPreviewUrl(null);

      const res = await fetch(
        `${API_BASE_URL}/employees/${employeeId}/documents/preview?templateId=${tplId}`
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



  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={templateId}
          onValueChange={(value) => setTemplateId(value)}
        >
          <SelectTrigger className="h-8 w-80 min-w-[200px]">
            <SelectValue placeholder="Select template to Preview or Generate" />
          </SelectTrigger>
          <SelectContent>
            {templates.map((tpl) => (
              <SelectItem key={tpl.id} value={tpl.id}>
                {tpl.name} · {tpl.document_type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          size="sm"
          variant="outline"
          onClick={() => handlePreview(templateId!)}
          disabled={!templateId || previewLoading}
        >
          {previewLoading ? "Loading…" : "Preview Template"}
        </Button>
        <Button
          size="sm"
          onClick={handleGenerate}
          disabled={!templateId || loading}
        >
          {loading ? "Generating..." : "Generate New"}
        </Button>

        {error && (
          <span className="text-xs text-destructive">{error}</span>
        )}
      </div>

      <div className="overflow-hidden rounded-md border">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left">Document</th>
              <th className="px-3 py-2 text-left">Type</th>
              <th className="px-3 py-2 text-left">Created</th>
              <th className="px-3 py-2 text-right w-[220px]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {docs.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-3 py-6 text-center text-xs text-muted-foreground"
                >
                  No documents yet. Generate an offer letter or contract to
                  see it here.
                </td>
              </tr>
            )}
            {docs.map((doc) => (
              <tr key={doc.id} className="border-t">
                <td className="px-3 py-2">
                  {doc.template?.name ?? doc.document_type}
                </td>
                <td className="px-3 py-2">{doc.document_type}</td>
                <td className="px-3 py-2 text-xs text-muted-foreground">
                  {new Date(doc.created_at).toLocaleString()}
                </td>
                <td className="px-3 py-2 text-right">
                  <div className="inline-flex items-center gap-2 whitespace-nowrap">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePreview(doc.template?.id)}
                      disabled={!doc.template?.id || previewLoading}
                    >
                      {previewLoading ? "Loading…" : "Preview"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownload(doc.id)}
                    >
                      Download PDF
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
