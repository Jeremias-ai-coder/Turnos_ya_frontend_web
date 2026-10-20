export type UserRole = 'client' | 'owner' | 'administrator' | 'USER' | 'BUSINESS_OWNER' | 'ADMIN' | string;

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  phone?: string | null;
  emailNotifications?: boolean;
  whatsappNotifications?: boolean;
  createdAt?: string | null;
  deletedAt?: string | null;
}

export interface BusinessService {
  id: number;
  businessId?: number;
  name: string;
  description?: string;
  price?: number;
  durationMinutes?: number;
}

export interface Business {
  id: number;
  name: string;
  address: string;
  phone: string;
  category: string;
  categoryId?: number;
  description?: string;
  rating?: number | null;
  reviewCount?: number;
  services?: BusinessService[];
  imageUrl?: string;
  logoUrl?: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
  distanceKm?: number;
  ownerId?: number;
  owner?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface Schedule {
  id: number;
  businessId: number;
  dayOfWeek: number; // 1 = Lunes, ..., 7 = Domingo
  startTime: string; // "09:00:00"
  endTime: string;   // "18:00:00"
}

export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';

export interface Appointment {
  id: number;
  userId: number;
  businessId: number;
  serviceId: number;
  date: string;
  time: string;
  status: AppointmentStatus;
  notes?: string;
  holdToken?: string | null;
  cancelledReason?: string | null;
  cancelledByUserId?: string | null;
  business?: {
    id: number;
    name: string;
    address: string;
    phone?: string;
  };
  service?: {
    id: number;
    name: string;
    price?: number;
    durationMinutes?: number;
    minCancellationNoticeHours?: number;
  };
  user?: {
    id: number;
    name: string;
    email: string;
    phone?: string | null;
  };
  review?: Review | null;
}

export interface Review {
  id: number;
  userId?: number;
  businessId?: number;
  rating: number;
  comment?: string | null;
  createdAt: string;
  user?: {
    name: string;
  };
  appointment?: {
    user?: { id?: number; name: string };
    service?: { id?: number; name: string };
  };
}

export interface Category {
  id: number;
  name: string;
  icon?: string;
}
