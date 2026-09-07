export interface Doctor {
  id: string;
  userId: string;
  name: string;
  specialization: string;
  hospitalOrClinic: string;
  phoneNumber?: string;
  email?: string;
  chamberAddress?: string;
  visitingHours?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
