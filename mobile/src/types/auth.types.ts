export interface User {
  id: string;
  fullName: string;
  name?: string;
  email: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  gender?: string;
  bloodGroup?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  allergies?: string[];
  chronicConditions?: string[];
  role?: string;
  /** Consent for automated medication follow-up calls (future AI voice). Off by default. */
  followUpCallsOptIn?: boolean;
  lastActiveAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  token: string;
  tokenType: string;
  expiresIn: number;
  user: User;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  bloodGroup?: string;
}

export interface DoctorRegisterPayload {
  fullName: string;
  email: string;
  password: string;
  specialization: string;
  licenseNumber: string;
  hospitalOrClinic?: string;
  phoneNumber?: string;
  chamberAddress?: string;
  visitingHours?: string;
}
