export interface Category {
  name: string;
  slug: string;
}

export interface Course {
  slug: string;
  title: string;
  subtitle: string | null;
  thumbnail_url: string | null;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  estimated_duration_minutes: number;
  module_count: number;
  enrollment_count: number;
  category: Category | null;
}

export interface LessonOutline {
  id: number;
  title: string;
  content_type: 'video' | 'text' | 'quiz';
  duration_seconds: number | null;
  order: number;
  is_preview: boolean;
  body?: string;
}

export interface ModuleOutline {
  id: number;
  title: string;
  description: string;
  order: number;
  lessons: LessonOutline[];
}

export interface CourseDetail extends Course {
  description: string;
  metadata: any;
  modules: ModuleOutline[];
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  items: T[];
}

export interface UserProfile {
  public_id: string;
  registration_number: string | null;
  email: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string;
  gender: string | null;
  date_of_birth: string | null;
  phone_number: string | null;
  cnic_number: string | null;
  user_type: 'volunteer' | 'member' | 'admin';
  position: string;
  role: string;
  volunteer_status: 'not_applied' | 'pending' | 'approved' | 'rejected';
  can_apply_for_volunteer?: boolean;
  email_verified: boolean;
  profile_completion_percentage: number;
  pending_sections: string[];

  // Educational
  institution_name: string | null;
  degree_program: string | null;
  semester_class: string | null;
  student_id: string | null;
  gpa_percentage: string | null;
  graduation_year: string | null;
  is_educational_complete: boolean;

  // Address
  province: string | null;
  city: string | null;
  complete_address: string | null;
  postal_code: string | null;
  is_address_complete: boolean;

  // Emergency
  guardian_name: string | null;
  guardian_relationship: string | null;
  guardian_contact: string | null;
  alternate_contact: string | null;

  // Social
  linkedin_url: string | null;
  github_url: string | null;
  portfolio_url: string | null;
  instagram_url: string | null;
  resume_url: string | null;
  is_emergency_social_complete: boolean;

  avatar_url: string | null;
  avatar_type: string;
  avatar_icon: string;
  bio: string | null;
  created_at: string;
}

export interface IdCardData {
  full_name: string;
  volunteer_id: string;
  registration_number: string;
  position: string;
  foundation_name: string;
  joining_date: string;
  photograph_url: string | null;
  qr_verification_code: string;
  verification_url: string;
  profile_completion_percentage: number;
  volunteer_status?: string;
  user_type?: string;
}

export interface Activity {
  public_id: string;
  title: string;
  description: string;
  category: string;
  available_positions: string[];
  eligibility_criteria: string;
  required_skills: string[];
  start_date: string;
  end_date: string;
  deadline: string;
  total_seats: number;
  remaining_seats: number;
  status: 'open' | 'closed' | 'completed' | 'draft';
  created_at: string;
}

export interface ActivityApplication {
  id: number;
  public_id: string;
  activity_title: string;
  activity_id: string;
  applicant_name: string;
  applicant_email: string;
  applicant_reg_num: string | null;
  applied_position: string;
  status: 'pending' | 'accepted' | 'waiting_list' | 'rejected';
  applied_at: string;
  admin_notes: string | null;
}

export interface NotificationItem {
  public_id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export interface CertificateItem {
  verification_uuid: string;
  certificate_number: string | null;
  title_snapshot: string;
  recipient_name_snapshot: string;
  role_snapshot: string | null;
  cert_type: string;
  status: string;
  issued_at: string;
  pdf_url: string | null;
  verification_url: string;
}

export interface CertificateTemplateItem {
  public_id: string;
  name: string;
  description: string | null;
  background_image_url: string | null;
  logo_image_url: string | null;
  signature_image_url: string | null;
  custom_positions: Record<string, any>;
  created_at: string;
}

export interface AdminStats {
  total_volunteers: number;
  total_members: number;
  completed_profiles: number;
  incomplete_profiles: number;
  active_volunteers: number;
  total_programs: number;
  total_certificates: number;
  pending_applications: number;
}

export interface VolunteerListItem {
  public_id: string;
  registration_number: string | null;
  full_name: string;
  email: string;
  phone_number: string | null;
  cnic_number: string | null;
  user_type: string;
  position: string;
  volunteer_status: 'not_applied' | 'pending' | 'approved' | 'rejected';
  gender: string | null;
  institution_name: string | null;
  city: string | null;
  province: string | null;
  profile_completion_percentage: number;
  program_participation_count: number;
  created_at: string;
}
