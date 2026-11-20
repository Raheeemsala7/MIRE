"use client";

import * as React from "react";
import { useEmployees } from "../hooks/use-employees";
import { EmployeesHeader } from "./employees-header";
import { EmployeesMetrics } from "./employees-metrics";
import { EmployeesTable } from "./employees-table";
import { CreateEmployeeDialog } from "./create-employee-dialog";
import { EditEmployeeDialog } from "./edit-employee-dialog";
import { EmployeeStatusDialog } from "./employee-status-dialog";
import { EmployeesSkeleton } from "./employees-skeleton";
import { calculateEmployeeMetrics } from "../utils/employee.util";
import type {
  Employee,
  EmployeeFilters,
  EmployeesPaginatedResponse,
} from "../types/employee.types";
import type { SafeUser } from "@/lib/auth/types";

interface EmployeesDashboardProps {
  initialData?: EmployeesPaginatedResponse;
  locale: string;
  currentUser: SafeUser | null;
}

export function EmployeesDashboard({
  initialData,
  locale,
  currentUser,
}: EmployeesDashboardProps) {
  const [filters, setFilters] = React.useState<EmployeeFilters>({
    page: 1,
    limit: 20,
    search: "",
    sort: "-createdAt",
  });

  // Dialog states
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [statusOpen, setStatusOpen] = React.useState(false);
  const [selectedEmployee, setSelectedEmployee] = React.useState<Employee | null>(null);
  const [editInitialTab, setEditInitialTab] = React.useState<"general" | "permissions">("general");

  const { data, isLoading, isFetching } = useEmployees(filters, initialData);

  const employees = React.useMemo(() => data?.data || [], [data?.data]);
  const pagination = data?.meta;

  const metrics = React.useMemo(() => {
    return calculateEmployeeMetrics(employees, pagination?.total);
  }, [employees, pagination?.total]);

  function handleEdit(emp: Employee) {
    setSelectedEmployee(emp);
    setEditInitialTab("general");
    setEditOpen(true);
  }

  function handleManagePermissions(emp: Employee) {
    setSelectedEmployee(emp);
    setEditInitialTab("permissions");
    setEditOpen(true);
  }

  function handleToggleStatus(emp: Employee) {
    setSelectedEmployee(emp);
    setStatusOpen(true);
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <EmployeesHeader
        currentUser={currentUser}
        onCreateClick={() => setCreateOpen(true)}
      />

      {/* Metrics Cards */}
      <EmployeesMetrics metrics={metrics} />

      {/* Table / Skeleton */}
      {isLoading && employees.length === 0 ? (
        <EmployeesSkeleton />
      ) : (
        <EmployeesTable
          employees={employees}
          pagination={pagination}
          filters={filters}
          onFilterChange={setFilters}
          currentUser={currentUser}
          locale={locale}
          isFetching={isFetching}
          onEdit={handleEdit}
          onManagePermissions={handleManagePermissions}
          onToggleStatus={handleToggleStatus}
        />
      )}

      {/* Dialogs */}
      <CreateEmployeeDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        currentUser={currentUser}
      />

      <EditEmployeeDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        employee={selectedEmployee}
        currentUser={currentUser}
        initialTab={editInitialTab}
      />

      <EmployeeStatusDialog
        open={statusOpen}
        onOpenChange={setStatusOpen}
        employee={selectedEmployee}
      />
    </div>
  );
}
