"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { UserProfile } from "@/types";
import { getProfile, updateProfile, applyForVolunteerVerification } from "@/lib/api/profile";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, GraduationCap, MapPin, ShieldAlert, Share2, User, Save, Sparkles, ArrowRight, ArrowLeft, ShieldCheck, Clock } from "lucide-react";

export default function ProfilePage() {
  const { data: session, update: updateSession } = useSession();
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeStep, setActiveStep] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form states
  const [formData, setFormData] = useState<Partial<UserProfile>>({});

  useEffect(() => {
    async function load() {
      if (!session?.accessToken) return;
      const data = await getProfile(session.accessToken);
      if (data) {
        setProfile(data);
        setFormData(data);

        // Auto navigate to first incomplete step
        if (!data.is_educational_complete) setActiveStep(2);
        else if (!data.is_address_complete) setActiveStep(3);
        else if (!data.is_emergency_social_complete) setActiveStep(4);
        else setActiveStep(1);
      }
      setIsLoading(false);
    }
    load();
  }, [session?.accessToken]);

  const handleChange = (field: keyof UserProfile, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!session?.accessToken) return;

    setIsSaving(true);
    setMessage(null);

    try {
      const updated = await updateProfile(formData, session.accessToken);
      setProfile(updated);
      setFormData(updated);

      // Trigger session update so session.user gets new completion %
      await updateSession({
        profileCompletionPercentage: updated.profile_completion_percentage,
        position: updated.position,
      });

      setMessage({ type: 'success', text: `Profile updated! Current Completion: ${updated.profile_completion_percentage}%` });

      // Move to next step or redirect to ID card on step 4 completion
      if (activeStep < 4) {
        setActiveStep(prev => prev + 1);
      } else if (activeStep === 4 && updated.profile_completion_percentage === 100) {
        router.push('/opportunities');
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to save changes.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleVolunteerApply = async () => {
    if (!session?.accessToken) return;
    setIsSaving(true);
    setMessage(null);
    try {
      const updated = await applyForVolunteerVerification(session.accessToken);
      setProfile(updated);
      setMessage({ type: 'success', text: 'Volunteer Verification application submitted! Redirecting to Opportunities page...' });
      setTimeout(() => {
        router.push('/opportunities');
      }, 1500);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to submit volunteer application.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-oasis-emerald border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const completion = profile?.profile_completion_percentage || 25;

  return (
    <div className="container mx-auto px-4 py-10 max-w-5xl">
      {/* Header Banner */}
      <div className="glass-card rounded-3xl p-8 mb-8 border border-foreground/10 relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-oasis-emerald/10 border border-oasis-emerald/20 text-oasis-emerald text-xs font-bold uppercase tracking-wider mb-3">
              <Sparkles size={14} /> Account Settings & Profile System
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-2">
              Account Settings & Information
            </h1>
            <p className="text-oasis-muted text-sm max-w-xl">
              100% profile completion is required to unlock your verified Digital ID Card and apply for volunteer opportunities and programs.
            </p>
          </div>

          {/* Progress Ring / Bar Display */}
          <div className="w-full md:w-64 bg-foreground/5 p-5 rounded-2xl border border-foreground/10 text-center">
            <div className="flex items-center justify-between text-sm font-semibold mb-2">
              <span className="text-foreground/70">Completion Progress</span>
              <span className="text-oasis-emerald font-bold">{completion}%</span>
            </div>
            <Progress value={completion} className="h-3 bg-foreground/10 mb-3" />
            <p className="text-xs text-oasis-muted">
              {completion === 100 ? (
                <span className="text-oasis-emerald font-medium flex items-center justify-center gap-1">
                  <CheckCircle2 size={14} /> 100% Complete & Verified!
                </span>
              ) : (
                `Pending: ${profile?.pending_sections?.join(', ') || 'Remaining Info'}`
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Volunteer Verification Status Card */}
      {completion === 100 && (
        <div className="glass-card rounded-3xl p-6 mb-8 border border-oasis-emerald/30 bg-oasis-emerald/5 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3.5 rounded-2xl bg-oasis-emerald/20 text-oasis-emerald shrink-0">
                <ShieldCheck size={32} />
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-oasis-emerald mb-1">Volunteer Status Track</div>
                <h3 className="text-lg font-bold text-foreground">
                  {profile?.volunteer_status === 'approved' && "Official Verified Oasis Volunteer"}
                  {profile?.volunteer_status === 'pending' && "Verification Application Under Admin Review"}
                  {profile?.volunteer_status === 'rejected' && "Verification Application Requires Revision"}
                  {(!profile?.volunteer_status || profile?.volunteer_status === 'not_applied') && "Profile 100% Complete — Volunteer Verification Unlocked!"}
                </h3>
                <p className="text-xs text-oasis-muted mt-1">
                  {profile?.volunteer_status === 'approved' && `Registration Number: ${profile.registration_number}. Access full volunteer benefits, opportunities, and digital ID card.`}
                  {profile?.volunteer_status === 'pending' && "Your verification application has been received and is currently being reviewed by an Oasis administrator."}
                  {profile?.volunteer_status === 'rejected' && "Your verification application requires updates. Please check your info and click re-apply below."}
                  {(!profile?.volunteer_status || profile?.volunteer_status === 'not_applied') && "Submit your verification request to get vetted by administrators and earn your official Oasis Volunteer status."}
                </p>
              </div>
            </div>

            <div className="shrink-0 w-full sm:w-auto">
              {profile?.volunteer_status === 'approved' && (
                <Button onClick={() => router.push('/dashboard/id-card')} className="w-full sm:w-auto bg-oasis-emerald text-black font-bold rounded-xl px-5 py-2.5">
                  View Digital ID Card <ArrowRight className="ml-2" size={16} />
                </Button>
              )}
              {profile?.volunteer_status === 'pending' && (
                <div className="inline-flex items-center justify-center w-full sm:w-auto gap-2 px-4 py-3 rounded-xl bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
                  <Clock size={16} strokeWidth={2.5} /> Pending Admin Approval
                </div>
              )}
              {(!profile?.volunteer_status || profile?.volunteer_status === 'not_applied' || profile?.volunteer_status === 'rejected') && (
                <Button
                  onClick={handleVolunteerApply}
                  disabled={isSaving}
                  className="w-full sm:w-auto bg-oasis-emerald hover:bg-oasis-emeraldLight text-black font-extrabold rounded-xl px-6 py-3 shadow-lg shadow-oasis-emerald/20 transition-all hover:scale-105"
                >
                  {isSaving ? "Submitting..." : profile?.volunteer_status === 'rejected' ? "Re-Apply for Verification" : "Apply for Volunteer Verification"} <ShieldCheck className="ml-2" size={18} />
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Step Navigation Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <button
          onClick={() => setActiveStep(1)}
          className={`flex items-center gap-3 p-4 rounded-2xl border text-left transition-all ${
            activeStep === 1
              ? "bg-oasis-emerald/10 border-oasis-emerald text-foreground shadow-md"
              : "bg-foreground/5 border-foreground/10 text-foreground/70 hover:bg-foreground/10"
          }`}
        >
          <div className="p-2.5 rounded-xl bg-oasis-emerald/20 text-oasis-emerald shrink-0">
            <User size={20} />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-oasis-emerald">Step 1 (25%)</div>
            <div className="text-sm font-bold line-clamp-1">Personal Info</div>
          </div>
        </button>

        <button
          onClick={() => setActiveStep(2)}
          className={`flex items-center gap-3 p-4 rounded-2xl border text-left transition-all ${
            activeStep === 2
              ? "bg-oasis-emerald/10 border-oasis-emerald text-foreground shadow-md"
              : profile?.is_educational_complete
              ? "bg-foreground/5 border-oasis-emerald/30 text-foreground"
              : "bg-foreground/5 border-foreground/10 text-foreground/70 hover:bg-foreground/10"
          }`}
        >
          <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400 shrink-0">
            <GraduationCap size={20} />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-blue-400">Step 2 (50%)</div>
            <div className="text-sm font-bold line-clamp-1">Educational Info</div>
          </div>
        </button>

        <button
          onClick={() => setActiveStep(3)}
          className={`flex items-center gap-3 p-4 rounded-2xl border text-left transition-all ${
            activeStep === 3
              ? "bg-oasis-emerald/10 border-oasis-emerald text-foreground shadow-md"
              : profile?.is_address_complete
              ? "bg-foreground/5 border-oasis-emerald/30 text-foreground"
              : "bg-foreground/5 border-foreground/10 text-foreground/70 hover:bg-foreground/10"
          }`}
        >
          <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400 shrink-0">
            <MapPin size={20} />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-purple-400">Step 3 (75%)</div>
            <div className="text-sm font-bold line-clamp-1">Address Info</div>
          </div>
        </button>

        <button
          onClick={() => setActiveStep(4)}
          className={`flex items-center gap-3 p-4 rounded-2xl border text-left transition-all ${
            activeStep === 4
              ? "bg-oasis-emerald/10 border-oasis-emerald text-foreground shadow-md"
              : profile?.is_emergency_social_complete
              ? "bg-foreground/5 border-oasis-emerald/30 text-foreground"
              : "bg-foreground/5 border-foreground/10 text-foreground/70 hover:bg-foreground/10"
          }`}
        >
          <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
            <ShieldAlert size={20} />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-amber-400">Step 4 (100%)</div>
            <div className="text-sm font-bold line-clamp-1">Emergency & Social</div>
          </div>
        </button>
      </div>

      {/* Messages */}
      {message && (
        <div className={`p-4 rounded-2xl mb-6 font-medium text-sm border flex items-center justify-between ${
          message.type === 'success' ? 'bg-oasis-emerald/10 border-oasis-emerald/30 text-oasis-emerald' : 'bg-red-500/10 border-red-500/30 text-red-400'
        }`}>
          <span>{message.text}</span>
          {profile?.profile_completion_percentage === 100 && (
            <Button onClick={() => router.push('/dashboard/id-card')} className="bg-oasis-emerald text-black font-semibold text-xs rounded-xl px-3.5 py-2">
              View ID Card
            </Button>
          )}
        </div>
      )}

      {/* Step Form Body */}
      <form onSubmit={handleSave} className="glass-card rounded-3xl p-8 border border-foreground/10 space-y-6">
        {/* STEP 1: Personal Info */}
        {activeStep === 1 && (
          <div className="space-y-6">
            <div className="border-b border-foreground/10 pb-4">
              <h3 className="text-xl font-bold text-foreground">Step 1: Personal Information</h3>
              <p className="text-sm text-oasis-muted">Basic identity provided at registration.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="text-xs font-medium text-foreground/70 uppercase">First Name</label>
                <input
                  type="text"
                  value={formData.first_name || ''}
                  onChange={(e) => handleChange('first_name', e.target.value)}
                  className="w-full mt-1 bg-foreground/5 border border-foreground/10 rounded-xl p-3.5 text-foreground focus:outline-none focus:border-oasis-emerald/50"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground/70 uppercase">Last Name</label>
                <input
                  type="text"
                  value={formData.last_name || ''}
                  onChange={(e) => handleChange('last_name', e.target.value)}
                  className="w-full mt-1 bg-foreground/5 border border-foreground/10 rounded-xl p-3.5 text-foreground focus:outline-none focus:border-oasis-emerald/50"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground/70 uppercase">Gender</label>
                <select
                  value={formData.gender || 'male'}
                  onChange={(e) => handleChange('gender', e.target.value)}
                  className="w-full mt-1 bg-foreground/5 border border-foreground/10 rounded-xl p-3.5 text-foreground focus:outline-none focus:border-oasis-emerald/50"
                >
                  <option value="male" className="bg-oasis-bgSecondary">Male</option>
                  <option value="female" className="bg-oasis-bgSecondary">Female</option>
                  <option value="other" className="bg-oasis-bgSecondary">Other</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-foreground/70 uppercase">Date of Birth</label>
                <input
                  type="date"
                  value={formData.date_of_birth || ''}
                  onChange={(e) => handleChange('date_of_birth', e.target.value)}
                  className="w-full mt-1 bg-foreground/5 border border-foreground/10 rounded-xl p-3.5 text-foreground focus:outline-none focus:border-oasis-emerald/50"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground/70 uppercase">Phone Number</label>
                <input
                  type="tel"
                  value={formData.phone_number || ''}
                  onChange={(e) => handleChange('phone_number', e.target.value)}
                  className="w-full mt-1 bg-foreground/5 border border-foreground/10 rounded-xl p-3.5 text-foreground focus:outline-none focus:border-oasis-emerald/50"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground/70 uppercase">CNIC / B-Form Number</label>
                <input
                  type="text"
                  value={formData.cnic_number || ''}
                  onChange={(e) => handleChange('cnic_number', e.target.value)}
                  className="w-full mt-1 bg-foreground/5 border border-foreground/10 rounded-xl p-3.5 text-foreground focus:outline-none focus:border-oasis-emerald/50"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Educational Info */}
        {activeStep === 2 && (
          <div className="space-y-6">
            <div className="border-b border-foreground/10 pb-4">
              <h3 className="text-xl font-bold text-foreground">Step 2: Educational Information</h3>
              <p className="text-sm text-oasis-muted">Completing this section brings profile completion to 50%.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="text-xs font-medium text-foreground/70 uppercase">Institution / School / University Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. University of Lahore"
                  value={formData.institution_name || ''}
                  onChange={(e) => handleChange('institution_name', e.target.value)}
                  className="w-full mt-1 bg-foreground/5 border border-foreground/10 rounded-xl p-3.5 text-foreground focus:outline-none focus:border-oasis-emerald/50"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground/70 uppercase">Degree / Program / Major *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BS Computer Science"
                  value={formData.degree_program || ''}
                  onChange={(e) => handleChange('degree_program', e.target.value)}
                  className="w-full mt-1 bg-foreground/5 border border-foreground/10 rounded-xl p-3.5 text-foreground focus:outline-none focus:border-oasis-emerald/50"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground/70 uppercase">Semester / Class *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 6th Semester"
                  value={formData.semester_class || ''}
                  onChange={(e) => handleChange('semester_class', e.target.value)}
                  className="w-full mt-1 bg-foreground/5 border border-foreground/10 rounded-xl p-3.5 text-foreground focus:outline-none focus:border-oasis-emerald/50"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground/70 uppercase">Student ID (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. F2021-1234"
                  value={formData.student_id || ''}
                  onChange={(e) => handleChange('student_id', e.target.value)}
                  className="w-full mt-1 bg-foreground/5 border border-foreground/10 rounded-xl p-3.5 text-foreground focus:outline-none focus:border-oasis-emerald/50"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground/70 uppercase">Percentage / CGPA *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 3.75 CGPA or 85%"
                  value={formData.gpa_percentage || ''}
                  onChange={(e) => handleChange('gpa_percentage', e.target.value)}
                  className="w-full mt-1 bg-foreground/5 border border-foreground/10 rounded-xl p-3.5 text-foreground focus:outline-none focus:border-oasis-emerald/50"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground/70 uppercase">Graduation Year *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2026"
                  value={formData.graduation_year || ''}
                  onChange={(e) => handleChange('graduation_year', e.target.value)}
                  className="w-full mt-1 bg-foreground/5 border border-foreground/10 rounded-xl p-3.5 text-foreground focus:outline-none focus:border-oasis-emerald/50"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Address Info */}
        {activeStep === 3 && (
          <div className="space-y-6">
            <div className="border-b border-foreground/10 pb-4">
              <h3 className="text-xl font-bold text-foreground">Step 3: Address Information</h3>
              <p className="text-sm text-oasis-muted">Completing this section brings profile completion to 75%.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="text-xs font-medium text-foreground/70 uppercase">Province *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Punjab"
                  value={formData.province || ''}
                  onChange={(e) => handleChange('province', e.target.value)}
                  className="w-full mt-1 bg-foreground/5 border border-foreground/10 rounded-xl p-3.5 text-foreground focus:outline-none focus:border-oasis-emerald/50"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground/70 uppercase">City *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lahore / Islamabad / Karachi"
                  value={formData.city || ''}
                  onChange={(e) => handleChange('city', e.target.value)}
                  className="w-full mt-1 bg-foreground/5 border border-foreground/10 rounded-xl p-3.5 text-foreground focus:outline-none focus:border-oasis-emerald/50"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-medium text-foreground/70 uppercase">Complete Address *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="House #, Street, Sector / Area details..."
                  value={formData.complete_address || ''}
                  onChange={(e) => handleChange('complete_address', e.target.value)}
                  className="w-full mt-1 bg-foreground/5 border border-foreground/10 rounded-xl p-3.5 text-foreground focus:outline-none focus:border-oasis-emerald/50 resize-none"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground/70 uppercase">Postal Code (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. 54000"
                  value={formData.postal_code || ''}
                  onChange={(e) => handleChange('postal_code', e.target.value)}
                  className="w-full mt-1 bg-foreground/5 border border-foreground/10 rounded-xl p-3.5 text-foreground focus:outline-none focus:border-oasis-emerald/50"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Emergency & Social Info */}
        {activeStep === 4 && (
          <div className="space-y-6">
            <div className="border-b border-foreground/10 pb-4">
              <h3 className="text-xl font-bold text-foreground">Step 4: Emergency & Social Information</h3>
              <p className="text-sm text-oasis-muted">Completing this final section reaches 100% profile completion and generates your ID Card.</p>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-bold text-oasis-emerald uppercase tracking-wider">Emergency Contact Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="text-xs font-medium text-foreground/70 uppercase">Guardian Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Father / Guardian Name"
                    value={formData.guardian_name || ''}
                    onChange={(e) => handleChange('guardian_name', e.target.value)}
                    className="w-full mt-1 bg-foreground/5 border border-foreground/10 rounded-xl p-3.5 text-foreground focus:outline-none focus:border-oasis-emerald/50"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground/70 uppercase">Relationship *</label>
                  <input
                    type="text"
                    required
                    placeholder="Father / Mother / Brother"
                    value={formData.guardian_relationship || ''}
                    onChange={(e) => handleChange('guardian_relationship', e.target.value)}
                    className="w-full mt-1 bg-foreground/5 border border-foreground/10 rounded-xl p-3.5 text-foreground focus:outline-none focus:border-oasis-emerald/50"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground/70 uppercase">Emergency Contact Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+92 300 9876543"
                    value={formData.guardian_contact || ''}
                    onChange={(e) => handleChange('guardian_contact', e.target.value)}
                    className="w-full mt-1 bg-foreground/5 border border-foreground/10 rounded-xl p-3.5 text-foreground focus:outline-none focus:border-oasis-emerald/50"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground/70 uppercase">Alternate Contact Number (Optional)</label>
                  <input
                    type="tel"
                    placeholder="+92 321 1234567"
                    value={formData.alternate_contact || ''}
                    onChange={(e) => handleChange('alternate_contact', e.target.value)}
                    className="w-full mt-1 bg-foreground/5 border border-foreground/10 rounded-xl p-3.5 text-foreground focus:outline-none focus:border-oasis-emerald/50"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-foreground/10">
              <h4 className="text-sm font-bold text-oasis-emerald uppercase tracking-wider">Social Links & Portfolio</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="text-xs font-medium text-foreground/70 uppercase">LinkedIn Profile URL</label>
                  <input
                    type="url"
                    placeholder="https://linkedin.com/in/username"
                    value={formData.linkedin_url || ''}
                    onChange={(e) => handleChange('linkedin_url', e.target.value)}
                    className="w-full mt-1 bg-foreground/5 border border-foreground/10 rounded-xl p-3.5 text-foreground focus:outline-none focus:border-oasis-emerald/50"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground/70 uppercase">GitHub Profile URL</label>
                  <input
                    type="url"
                    placeholder="https://github.com/username"
                    value={formData.github_url || ''}
                    onChange={(e) => handleChange('github_url', e.target.value)}
                    className="w-full mt-1 bg-foreground/5 border border-foreground/10 rounded-xl p-3.5 text-foreground focus:outline-none focus:border-oasis-emerald/50"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground/70 uppercase">Portfolio Website URL</label>
                  <input
                    type="url"
                    placeholder="https://yourportfolio.com"
                    value={formData.portfolio_url || ''}
                    onChange={(e) => handleChange('portfolio_url', e.target.value)}
                    className="w-full mt-1 bg-foreground/5 border border-foreground/10 rounded-xl p-3.5 text-foreground focus:outline-none focus:border-oasis-emerald/50"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground/70 uppercase">Instagram Profile (Optional)</label>
                  <input
                    type="url"
                    placeholder="https://instagram.com/username"
                    value={formData.instagram_url || ''}
                    onChange={(e) => handleChange('instagram_url', e.target.value)}
                    className="w-full mt-1 bg-foreground/5 border border-foreground/10 rounded-xl p-3.5 text-foreground focus:outline-none focus:border-oasis-emerald/50"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-medium text-foreground/70 uppercase">Resume / CV Link (Optional)</label>
                  <input
                    type="url"
                    placeholder="https://drive.google.com/your-resume-link"
                    value={formData.resume_url || ''}
                    onChange={(e) => handleChange('resume_url', e.target.value)}
                    className="w-full mt-1 bg-foreground/5 border border-foreground/10 rounded-xl p-3.5 text-foreground focus:outline-none focus:border-oasis-emerald/50"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex items-center justify-between pt-6 border-t border-foreground/10">
          {activeStep > 1 ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => setActiveStep(prev => prev - 1)}
              className="border-foreground/10 rounded-xl px-5"
            >
              <ArrowLeft className="mr-2" size={16} /> Previous Step
            </Button>
          ) : (
            <div></div>
          )}

          <Button
            type="submit"
            disabled={isSaving}
            className="bg-oasis-emerald hover:bg-oasis-emeraldLight text-black font-semibold rounded-xl px-6 py-3 shadow-lg shadow-oasis-emerald/20"
          >
            {isSaving ? "Saving Progress..." : "Save & Continue"} <Save className="ml-2" size={16} />
          </Button>
        </div>
      </form>
    </div>
  );
}
