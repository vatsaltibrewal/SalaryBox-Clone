"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import type { EmployeeRow } from "@/types/employee";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface EmployeesDataTableProps {
  columns: ColumnDef<EmployeeRow>[];
  data: EmployeeRow[];
  externalSearch?: string;
  externalDepartment?: string;
  showInternalToolbar?: boolean;
}

/**
 * TanStack Table v8 based employee table.
 */
export function EmployeesDataTable({
  columns,
  data,
  externalSearch,
  externalDepartment,
  showInternalToolbar,
}: EmployeesDataTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] =
    React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const [pageSize, setPageSize] = React.useState(10);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination: {
        pageIndex: 0,
        pageSize,
      },
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: false,
  });

  React.useEffect(() => {
    table.setPageSize(pageSize);
  }, [pageSize, table]);

  const showToolbar = showInternalToolbar ?? true;

  // Columns used for filtering
  const nameColumn = table.getColumn("name");
  const departmentColumn = table.getColumn("department");

  // Sync external search filter into TanStack column filter
  React.useEffect(() => {
    if (!nameColumn) return;
    const current = (nameColumn.getFilterValue() as string) ?? "";
    const target = externalSearch ?? "";
    if (current !== target) {
      nameColumn.setFilterValue(target);
    }
  }, [externalSearch, nameColumn]);

  // Sync external department filter into column filter
  React.useEffect(() => {
    if (!departmentColumn) return;
    const current = (departmentColumn.getFilterValue() as string) ?? "";
    const target =
      externalDepartment && externalDepartment !== "all"
        ? externalDepartment
        : "";
    if (current !== target) {
      departmentColumn.setFilterValue(target);
    }
  }, [externalDepartment, departmentColumn]);

  // Department options (used by internal toolbar)
  const internalDepartmentOptions = React.useMemo(() => {
    const set = new Set<string>();
    data.forEach((row) => {
      if (row.department) set.add(row.department);
    });
    return Array.from(set).sort();
  }, [data]);

  return (
    <div className="space-y-4">
      {/* Internal toolbar (can be hidden from dashboard) */}
      {showToolbar && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center gap-2">
            <Input
              placeholder="Search by name..."
              className="h-8 w-full max-w-xs"
              value={(nameColumn?.getFilterValue() as string) ?? ""}
              onChange={(event) =>
                nameColumn?.setFilterValue(event.target.value)
              }
            />
            {departmentColumn && internalDepartmentOptions.length > 0 && (
              <Select
                value={
                  (departmentColumn.getFilterValue() as string) || "all"
                }
                onValueChange={(value) =>
                  departmentColumn.setFilterValue(
                    value === "all" ? "" : value
                  )
                }
              >
                <SelectTrigger className="h-8 w-[160px]">
                  <SelectValue placeholder="All departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All departments</SelectItem>
                  {internalDepartmentOptions.map((dep) => (
                    <SelectItem key={dep} value={dep}>
                      {dep}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Page size selector */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Rows per page</span>
            <Select
              value={String(pageSize)}
              onValueChange={(value) => setPageSize(Number(value))}
            >
              <SelectTrigger className="h-8 w-[80px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={
                    row.getIsSelected() ? "selected" : undefined
                  }
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-sm text-muted-foreground"
                >
                  No employees found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination footer */}
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs text-muted-foreground">
          {table.getFilteredRowModel().rows.length} employees
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Previous</span>
            ‹
          </Button>
          <span className="text-xs">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount() || 1}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Next</span>
            ›
          </Button>
        </div>
      </div>
    </div>
  );
}
