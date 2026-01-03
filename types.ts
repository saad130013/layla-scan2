
export interface Worker {
  Worker_ID: string;
  Worker_Name: string;
  Gender?: string;
  Area: string;
  Location: string;
  LOCATION_RAW?: string;
  Nationality?: string;
  Company?: string;
  Position?: string;
  [key: string]: any;
}

export interface Inspector {
  Inspector_ID: string;
  Inspector_Name: string;
  Status: 'Active' | 'Inactive';
  Notes?: string;
  PreferredDay: WeekDay;
  MaxLocationsPerDay: number;
  LocationQueue: string[]; // Array of Location IDs
  Color?: string; // Hex color code for visual distinction
}

export interface LocationData {
  id: string; // Normalized name
  name: string;
  area: string;
  workerIds: string[];
  lastVisited?: string;
}

export interface AreaData {
  name: string;
  locations: LocationData[];
}

export interface VisitRecord {
  id: string;
  locationId: string;
  inspectorId: string;
  date: string;
  visited: boolean;
  actualCount?: number;
  notes?: string;
  photo?: string;
  scheduledWeek: string; // ISO week string
}

export type ViewState = 'dashboard' | 'upload' | 'map' | 'assignment' | 'scheduling' | 'inspection' | 'reporting';
export type Language = 'en' | 'ar';
export type WeekDay = 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday';
export type PlanningPeriod = 'Weekly' | 'Monthly';
export type ScheduleMethod = 'Smart' | 'Manual';

export const WEEKDAYS: WeekDay[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];

export const INSPECTOR_COLORS = [
  '#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', 
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
];

export const TRANSLATIONS = {
  en: {
    Sunday: 'Sunday',
    Monday: 'Monday',
    Tuesday: 'Tuesday',
    Wednesday: 'Wednesday',
    Thursday: 'Thursday',
    nav: {
      dashboard: 'Dashboard',
      upload: 'Upload Data',
      map: 'Location Map',
      assignment: 'Assignments',
      scheduling: 'Smart Planner',
      inspection: 'Field Visit',
      reporting: 'Reports'
    }
  },
  ar: {
    Sunday: 'الأحد',
    Monday: 'الأثنين',
    Tuesday: 'الثلاثاء',
    Wednesday: 'الأربعاء',
    Thursday: 'الخميس',
    nav: {
      dashboard: 'لوحة التحكم',
      upload: 'رفع البيانات',
      map: 'خريطة المواقع',
      assignment: 'التكاليف',
      scheduling: 'الجدولة الذكية',
      inspection: 'الزيارة الميدانية',
      reporting: 'التقارير'
    }
  }
};
