export const EVENT = {
  id: 'cs-annual-lunch-2k26',
  department: 'CS DEPARTMENT',
  year: 'Annual Event 2026',
  name: 'Computer Science Annual Lunch 2k26',
  heroTitle: 'Computer Science',
  heroSubtitle: 'Annual Lunch 2k26',
  subtitle: 'Computer Science Department',
  tagline: 'A celebration of our CS family',
  date: 'Saturday, July 18th, 2026',
  day: 'Saturday',
  dateShort: '18 Jul 2026',
  dateHero: 'Saturday, July 18th',
  time: '12:30 PM',
  timeRange: '12:30 PM – 4:00 PM',
  venue: 'CS Department Main Lawn',
  venueDetail: 'CS Department Main Lawn, University Campus',
  backgroundImage: '/images/cs-department-bg.jpg',
  backgroundFallback: '/images/cs-department-bg.svg',
  registrationClosesAt: '2026-07-10T23:59:59',
  eventStartsAt: '2026-07-18T12:30:00',
  ticketAmount: 3000,
  pricingDisplay: 'PKR 3,000 per person',
  passIncludes: 'Annual Lunch, Networking, and Digital Swag Bag!',
  schedule: [
    { time: '12:30 PM', title: 'Registration & Check-in', description: 'Students arrive and collect their entry passes at the gate.' },
    { time: '1:00 PM', title: 'Welcome Address', description: 'Opening remarks by the CS Department Head and faculty.' },
    { time: '1:30 PM', title: 'Annual Lunch', description: 'Buffet lunch served for all registered students and faculty.' },
    { time: '2:30 PM', title: 'Student Recognition', description: 'Awards and recognition for outstanding CS students.' },
    { time: '3:15 PM', title: 'Networking & Photos', description: 'Group photos, meet fellow students, and department networking.' },
    { time: '4:00 PM', title: 'Closing Ceremony', description: 'Vote of thanks and event wrap-up.' },
  ],
  details: [
    { title: 'About the Event', text: 'The Computer Science Annual Lunch 2k26 is a flagship gathering for CS students, faculty, and alumni. It celebrates the spirit of our department with food, fellowship, and recognition of student achievements.' },
    { title: 'Date & Time', text: 'Saturday, July 18th, 2026 · 12:30 PM – 4:00 PM' },
    { title: 'Venue', text: 'CS Department Main Lawn, University Campus. Entry via QR ticket at the gate.' },
    { title: 'Ticket Price', text: 'PKR 3,000 per person. Payment via bank transfer to HBL account (details on registration page).' },
    { title: 'Who Can Attend', text: 'All CS department students — Day Scholars and Hostellites. Registration requires sign-up, payment proof upload, and admin approval.' },
    { title: 'What to Bring', text: 'Your approved QR ticket (digital or printed) and your university ID card for verification at the gate.' },
    { title: 'Dress Code', text: 'Smart casual. Department colors encouraged.' },
  ],
  faqs: [
    { q: 'How do I register?', a: 'Click Register Now on the homepage, create an account, log in, complete the registration form, and upload your payment screenshot. Admin will verify within 24 hours.' },
    { q: 'What is the roll number format?', a: 'Use your official format, e.g. 24-CS-151 or 24-cs-151 (letters can be uppercase or lowercase).' },
    { q: 'How do I check if my payment is approved?', a: 'Log in with your roll number and password, then visit your Dashboard to see status and download your ticket once approved.' },
    { q: 'What if my payment is rejected?', a: 'Log in, read the rejection reason on your Dashboard, and resubmit with corrected payment proof.' },
    { q: 'Can hostellites from any hostel register?', a: 'Yes. Select Hostellite and choose your hostel from the list. Male hostellites see boys halls; female hostellites see girls halls.' },
  ],
} as const;

export type EventConfig = typeof EVENT;

export function getCountdown(targetIso: string) {
  const diff = new Date(targetIso).getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    expired: false,
  };
}

export function formatCountdown(c: ReturnType<typeof getCountdown>) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(c.days)}d : ${pad(c.hours)}h : ${pad(c.minutes)}m : ${pad(c.seconds)}s`;
}

export function normalizeRollNo(rollNo: string): string {
  const parts = rollNo.trim().split('-');
  if (parts.length === 3) {
    return `${parts[0]}-${parts[1].toUpperCase()}-${parts[2]}`;
  }
  return rollNo.trim();
}
