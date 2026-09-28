import React from 'react';
import { useRouter } from 'expo-router';
import { DoctorDirectory } from '../src/components/doctor/DoctorDirectory';

/**
 * "Find Doctors" destination: a full doctors list, reached from any screen.
 * It deliberately lives outside the tab bar so the user never bounces back to
 * the homepage while browsing or chatting with doctors.
 */
export default function DoctorsScreen() {
  const router = useRouter();
  return <DoctorDirectory onClose={() => router.back()} />;
}
