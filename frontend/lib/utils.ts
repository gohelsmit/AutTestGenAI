import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type UserRole = 'admin' | 'radiologist' | 'technician' | 'doctor' | 'patient';

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Admin',
  radiologist: 'Radiologist',
  technician: 'Technician',
  doctor: 'Doctor',
  patient: 'Patient',
};

export function getRoleLabel(role: string | undefined): string {
  if (!role) return 'User';
  return ROLE_LABELS[role as UserRole] ?? role;
}

/** Normalize role from DB. Handles "Doctor", "doctor", or enum format like "public.doctor". Default 'patient'. */
export function normalizeRole(role: string | undefined | null): UserRole {
  const raw = role != null && typeof role === 'object' ? (role as { value?: string }).value : role;
  const s = typeof raw === 'string' ? raw.toLowerCase().trim() : '';
  const valid: UserRole[] = ['admin', 'radiologist', 'technician', 'doctor', 'patient'];
  if (valid.includes(s as UserRole)) return s as UserRole;
  // PostgreSQL enum can return e.g. "public.doctor" or "user_role.doctor"
  for (const r of valid) {
    if (s.includes(r)) return r;
  }
  return 'patient';
}

/** Roles that can access Patients list/page (patient sees only own linked record) */
export const ROLES_CAN_ACCESS_PATIENTS: UserRole[] = ['admin', 'radiologist', 'technician', 'doctor', 'patient'];
/** Roles that can access Studies list/page (patient sees only own studies) */
export const ROLES_CAN_ACCESS_STUDIES: UserRole[] = ['admin', 'radiologist', 'technician', 'doctor', 'patient'];
/** Roles that can access Reports list/page (patient sees only own reports) */
export const ROLES_CAN_ACCESS_REPORTS: UserRole[] = ['admin', 'radiologist', 'technician', 'doctor', 'patient'];
/** Roles that can add new patients (doctor included for doctor-only setups) */
export const ROLES_CAN_ADD_PATIENT: UserRole[] = ['admin', 'technician', 'doctor'];
/** Roles that can create new studies */
export const ROLES_CAN_CREATE_STUDY: UserRole[] = ['admin', 'technician', 'doctor'];
/** Roles that can upload DICOM / manage images on a study */
export const ROLES_CAN_UPLOAD_DICOM: UserRole[] = ['admin', 'technician', 'doctor'];

export function canAccessPatients(role: string | undefined): boolean {
  return role != null && (ROLES_CAN_ACCESS_PATIENTS as string[]).includes(role);
}
export function canAccessStudies(role: string | undefined): boolean {
  return role != null && (ROLES_CAN_ACCESS_STUDIES as string[]).includes(role);
}
export function canAccessReports(role: string | undefined): boolean {
  return role != null && (ROLES_CAN_ACCESS_REPORTS as string[]).includes(role);
}
export function canAddPatient(role: string | undefined): boolean {
  return role != null && (ROLES_CAN_ADD_PATIENT as string[]).includes(role);
}
export function canCreateStudy(role: string | undefined): boolean {
  return role != null && (ROLES_CAN_CREATE_STUDY as string[]).includes(role);
}
export function canUploadDicom(role: string | undefined): boolean {
  return role != null && (ROLES_CAN_UPLOAD_DICOM as string[]).includes(role);
}
