export type EmployeeApi = {
  id: string;
  company_id: string;
  name: string;
  job_title: string | null;
  department: string | null;
  mobile: string;
  email: string;
  date_of_joining: string; // ISO date string
  gender: string | null;
  status: "active" | "inactive" | "terminated" | null;
  created_at: string;
  updated_at: string;
  annual_ctc: number | null;
  avatar_url: string | null; // computed from storage path
};

export type EmployeesApiResponse = {
  data: EmployeeApi[];
  page: number;
  pageSize: number;
  total: number;
};

export type EmployeeRow = {
  id: string;
  name: string;
  jobTitle: string | null;
  department: string | null;
  mobile: string;
  email: string;
  dateOfJoining: string;
  gender: string | null;
  status: string | null;
  createdAt: string;
  updatedAt: string;
  avatarUrl: string | null;
};

export type EmployeeWithCompany = EmployeeApi & {
  companies: {
    id: string;
    name: string;
    logo_url: string | null;
  } | null;
};
