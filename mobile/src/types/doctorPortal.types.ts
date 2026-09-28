export interface DoctorPortalAccount {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  specialization: string;
  licenseNumber?: string;
  hospitalOrClinic?: string;
  phoneNumber?: string;
  chamberAddress?: string;
  visitingHours?: string;
  isAvailable: boolean;
  /** True while the doctor holds a live realtime socket. */
  isOnline?: boolean;
  lastActiveAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PatientThread {
  patientId: string;
  patientName: string;
  patientPhone?: string;
  lastMessage: string;
  lastMessageFromDoctor: boolean;
  lastMessageAt: string;
  messageCount: number;
}

export interface DoctorMessage {
  id: string;
  doctorAccountId: string;
  /** The doctor's user id — the routing id used for realtime delivery. */
  doctorUserId?: string;
  doctorName?: string;
  patientId: string;
  patientName?: string;
  body: string;
  fromDoctor: boolean;
  isRead?: boolean;
  createdAt: string;
}

export interface DoctorPost {
  id: string;
  doctorAccountId: string;
  doctorName?: string;
  doctorSpecialization?: string;
  title: string;
  body: string;
  category?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt?: string;
}
