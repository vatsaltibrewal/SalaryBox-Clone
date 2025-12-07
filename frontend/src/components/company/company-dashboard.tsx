"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

import { EmployeesDataTable } from "@/components/employees/data-table";
import { employeeColumns } from "@/components/employees/columns";
import type { EmployeeRow } from "@/types/employee";
import { Plus } from "lucide-react";

type CompanyDashboardProps = {
  companyId: string;
  companyName: string;
  employees: EmployeeRow[];
};

export function CompanyDashboard({
  companyId,
  companyName,
  employees,
}: CompanyDashboardProps) {
  const router = useRouter();

  const [search, setSearch] = React.useState("");
  const [branch, setBranch] = React.useState("all");
  const [department, setDepartment] = React.useState("all");

  // Compute department options from employees
  const departmentOptions = React.useMemo(() => {
    const set = new Set<string>();
    employees.forEach((emp) => {
      if (emp.department) set.add(emp.department);
    });
    return Array.from(set).sort();
  }, [employees]);

  const handleAddEmployee = () => {
    router.push(`/companies/${companyId}/employees/new`);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <section className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          My Team
        </h1>
        <p className="text-sm text-muted-foreground">
          Staff details for{" "}
          <span className="font-medium text-foreground">
            {companyName}
          </span>
          . Search, filter, and manage employees in one place.
        </p>
      </section>

      {/* Tabs row – Staff Details active, others placeholders */}
      <Tabs defaultValue="staff" className="space-y-4">
        <TabsList className="flex w-full flex-wrap justify-start gap-1">
          <TabsTrigger value="staff" className="px-4">
            Staff Details
          </TabsTrigger>
          <TabsTrigger value="attendance" className="px-4">
            Attendance Details
          </TabsTrigger>
          <TabsTrigger value="bank" className="px-4">
            Bank Details
          </TabsTrigger>
          <TabsTrigger value="salary" className="px-4">
            Salary Details
          </TabsTrigger>
          <TabsTrigger value="leave" className="px-4">
            Leave &amp; Balances
          </TabsTrigger>
          <TabsTrigger value="permissions" className="px-4">
            Permissions
          </TabsTrigger>
        </TabsList>

        {/* Staff Details tab content */}
        <TabsContent value="staff" className="space-y-4">
          {/* Filter strip */}
          <div className="flex flex-col gap-3 border-b pb-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 flex-wrap items-center gap-2">
              {/* Search Staff */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">
                  Search Staff
                </span>
                <Input
                  placeholder="Type a name or email..."
                  className="h-8 w-48"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {/* Branch (placeholder for now) */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">
                  Branch
                </span>
                <Select
                  value={branch}
                  onValueChange={(value) => setBranch(value)}
                >
                  <SelectTrigger className="h-8 w-40">
                    <SelectValue placeholder="All branches" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All branches</SelectItem>
                    <SelectItem value="main">Main branch</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Department */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">
                  Department
                </span>
                <Select
                  value={department}
                  onValueChange={(value) => setDepartment(value)}
                >
                  <SelectTrigger className="h-8 w-44">
                    <SelectValue placeholder="All departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All departments</SelectItem>
                    {departmentOptions.map((dep) => (
                      <SelectItem key={dep} value={dep}>
                        {dep}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Placeholder controls */}
              <Button
                type="button"
                variant="outline"
                className="h-8 px-3 text-xs"
              >
                More Filters
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-8 px-3 text-xs"
              >
                Show Fields
              </Button>
            </div>

            {/* Add Employee CTA */}
            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                className="h-9 px-4 text-xs font-medium"
                onClick={handleAddEmployee}
              >
                <Plus className="mr-1 h-4 w-4" />
                Add Employee
              </Button>
            </div>
          </div>

          {/* Employee table (no internal toolbar; controlled by filters above) */}
          <EmployeesDataTable
            columns={employeeColumns}
            data={employees}
            externalSearch={search}
            externalDepartment={department}
            showInternalToolbar={false}
          />
        </TabsContent>

        {/* Placeholder content for other tabs */}
        <TabsContent value="attendance" className="py-10 text-sm text-muted-foreground">
          Attendance module will live here. For now this is a placeholder.
        </TabsContent>
        <TabsContent value="bank" className="py-10 text-sm text-muted-foreground">
          Bank details for employees will live here. Placeholder for v1.
        </TabsContent>
        <TabsContent value="salary" className="py-10 text-sm text-muted-foreground">
          Salary and payroll information will live here. Placeholder for v1.
        </TabsContent>
        <TabsContent value="leave" className="py-10 text-sm text-muted-foreground">
          Leave balances and policies will live here. Placeholder for v1.
        </TabsContent>
        <TabsContent value="permissions" className="py-10 text-sm text-muted-foreground">
          Role and permission management will live here. Placeholder for v1.
        </TabsContent>
      </Tabs>
    </div>
  );
}
