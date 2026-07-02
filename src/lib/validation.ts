import { z } from 'zod';
import { normalizeRollNo } from '@/lib/event';

export const ROLL_NO_REGEX = /^\d{2}-[a-z]{2,4}-\d{1,4}$/i;
export const MOBILE_REGEX = /^(\+92|0)?3\d{9}$/;

export const TICKET_AMOUNT = 3000;

export const PAYMENT_INSTRUCTIONS = {
  bank: 'HBL',
  accountNumber: '54637000160203',
  title: 'Abdul Rehman Khalid',
  amount: TICKET_AMOUNT,
  note: 'Use your Roll Number as payment reference',
};

export const MALE_HOSTEL_OPTIONS = [
  'Abu-Bakar Hall',
  'Ali Hall',
  'Quaid-e-Azam Hall',
  'Iqbal Hall',
  'Jabir Bin Hayan Hall',
  'Muhammad Hall',
] as const;

export const FEMALE_HOSTEL_OPTIONS = [
  'Fatima Hall',
  'Ayesha Hall',
] as const;

export type MaleHostel = (typeof MALE_HOSTEL_OPTIONS)[number];
export type FemaleHostel = (typeof FEMALE_HOSTEL_OPTIONS)[number];

export function getHostelOptionsForGender(gender: 'male' | 'female') {
  return gender === 'male' ? MALE_HOSTEL_OPTIONS : FEMALE_HOSTEL_OPTIONS;
}

export function isValidHostelForGender(hostelName: string, gender: 'male' | 'female') {
  return (getHostelOptionsForGender(gender) as readonly string[]).includes(hostelName);
}

export const signupSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100),
    rollNo: z
      .string()
      .regex(ROLL_NO_REGEX, 'Invalid roll number format (e.g. 24-CS-151)')
      .transform(normalizeRollNo),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const studentLoginSchema = z.object({
  rollNo: z.string().min(1, 'Roll number is required'),
  password: z.string().min(1, 'Password is required'),
});

export const registrationSchema = z
  .object({
    mobile: z.string().regex(MOBILE_REGEX, 'Invalid Pakistani mobile number'),
    affiliation: z.string().min(2).max(100),
    gender: z.enum(['male', 'female'], { errorMap: () => ({ message: 'Please select gender' }) }),
    accommodationType: z.enum(['hostellite', 'day_scholar']),
    hostelName: z.string().optional(),
    website: z.string().max(0).optional(),
  })
  .refine((d) => d.accommodationType !== 'hostellite' || (d.hostelName && d.hostelName.length >= 2), {
    message: 'Please specify which hostel',
    path: ['hostelName'],
  })
  .refine(
    (d) =>
      d.accommodationType !== 'hostellite' ||
      !d.hostelName ||
      isValidHostelForGender(d.hostelName, d.gender),
    {
      message: 'Please select a valid hostel for your gender',
      path: ['hostelName'],
    }
  );

export const rejectionSchema = z.object({
  reason: z.string().min(10, 'Please provide a detailed rejection reason'),
});

export const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export const manualOverrideSchema = z.object({
  entryCode: z
    .string()
    .regex(/^CS26-[A-Z0-9]{6}$/i, 'Invalid ticket ID (e.g. CS26-7K4M2P)'),
  reason: z.string().min(10, 'Reason required for manual entry'),
});
