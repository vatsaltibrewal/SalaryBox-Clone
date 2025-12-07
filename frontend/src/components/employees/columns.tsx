"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { EmployeeRow } from "@/types/employee";
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@/components/ui/avatar";

/**
 * Column definitions for the employees table.
 */
export const employeeColumns: ColumnDef<EmployeeRow>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="px-0 font-semibold"
        onClick={() =>
          column.toggleSorting(column.getIsSorted() === "asc")
        }
      >
        Name
        <ArrowUpDown className="ml-1 h-3 w-3" />
      </Button>
    ),
    cell: ({ row }) => {
      const { name, jobTitle, avatarUrl, updatedAt } = row.original;
      const params = useParams<{ companyId: string }>();
      const companyId = params.companyId;
      const id = row.original.id;

      const initials =
        name
          ?.split(" ")
          .map((part) => part[0])
          .join("")
          .slice(0, 2)
          .toUpperCase() ?? "";

      return (
        <Link
          href={`/companies/${companyId}/employees/${id}`}
          className="font-medium text-primary hover:underline"
        >
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              {avatarUrl ? (
                <AvatarImage
                  src={avatarUrl + `?v=${updatedAt}`}
                  alt={name || "Employee avatar"}
                />
              ) : (
                <AvatarFallback className="text-xs font-medium">
                  {initials}
                </AvatarFallback>
              )}
            </Avatar>

            <div className="flex flex-col">
              <span className="font-medium">{name}</span>
              {jobTitle && (
                <span className="text-xs text-muted-foreground">
                  {jobTitle}
                </span>
              )}
            </div>
          </div>
        </Link>
      );
    },
  },
  {
    accessorKey: "department",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="px-0"
        onClick={() =>
          column.toggleSorting(column.getIsSorted() === "asc")
        }
      >
        Department
        <ArrowUpDown className="ml-1 h-3 w-3" />
      </Button>
    ),
    cell: ({ getValue }) => {
      const value = getValue<string | null>();
      return (
        <span className="text-xs text-muted-foreground">
          {value || "—"}
        </span>
      );
    },
  },
  {
    accessorKey: "mobile",
    header: () => <span>Mobile</span>,
    cell: ({ getValue }) => (
      <span className="text-xs font-mono">{getValue<string>()}</span>
    ),
  },
  {
    accessorKey: "email",
    header: () => <span>Email</span>,
    cell: ({ getValue }) => {
      const value = getValue<string | null>();
      return (
        <span className="text-xs text-muted-foreground">
          {value || "—"}
        </span>
      );
    },
  },
  {
    accessorKey: "dateOfJoining",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="px-0"
        onClick={() =>
          column.toggleSorting(column.getIsSorted() === "asc")
        }
      >
        Date of Joining
        <ArrowUpDown className="ml-1 h-3 w-3" />
      </Button>
    ),
    cell: ({ getValue }) => {
      const iso = getValue<string | null>();
      if (!iso) {
        return (
          <span className="text-xs text-muted-foreground">—</span>
        );
      }
      const date = new Date(iso);
      return (
        <span className="text-xs">
          {date.toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "2-digit",
          })}
        </span>
      );
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="px-0"
        onClick={() =>
          column.toggleSorting(column.getIsSorted() === "asc")
        }
      >
        Status
        <ArrowUpDown className="ml-1 h-3 w-3" />
      </Button>
    ),
    cell: ({ getValue }) => {
      const raw = (getValue<string>() ?? "").toLowerCase();
      const label = raw || "unknown";
      const colorClass =
        raw === "active"
          ? "bg-emerald-100 text-emerald-700"
          : raw === "inactive"
          ? "bg-slate-200 text-slate-700"
          : "bg-amber-100 text-amber-800";

      return (
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${colorClass}`}
        >
          {label}
        </span>
      );
    },
  },
  {
    accessorKey: "gender",
    header: () => <span>Gender</span>,
    cell: ({ getValue }) => {
      const value = (getValue<string | null>() ?? "").trim();
      if (!value) {
        return (
          <span className="text-xs text-muted-foreground">—</span>
        );
      }
      const lower = value.toLowerCase();
      const label =
        lower === "male"
          ? "Male"
          : lower === "female"
          ? "Female"
          : lower.charAt(0).toUpperCase() + lower.slice(1);

      return (
        <span className="text-xs text-muted-foreground">{label}</span>
      );
    },
  },
];
