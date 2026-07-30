"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { UserProfile } from "@/types";
import { getProfile, updateProfile, applyForVolunteerVerification } from "@/lib/api/profile";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AvatarPicker } from "@/components/profile/avatar-picker";
import { getAvatarIcon } from "@/components/profile/avatar-icons";
import { 
  User, Mail, ShieldCheck, Key, Eye, EyeOff, MapPin, GraduationCap, 
  Clock, CheckCircle2, ArrowRight, Camera, Save, Trash2, AlertTriangle, ShieldAlert, Sparkles, AlertCircle 
} from "lucide-react";

export default function SettingsPage() {
  const { data: session, update: updateSession } = useSession();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"profile" | "account" | "security">("profile");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeStep, setActiveStep] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Avatar State
  const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false);

  // Form states
  const [formData, setFormData] = useState<Partial<UserProfile>>({});

  // Security Form State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);

  // Account Delete Modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    async function load() {
      if (!session?.accessToken) return;
      setIsLoading(true);
      try {
        const data = await getProfile(session.accessToken);
        if (data) {
          setProfile(data);
          setFormData(data);

          if (!data.phone_number || !data.cnic_number) setActiveStep(1);
          else if (!data.is_educational_complete) setActiveStep(2);
          else if (!data.is_address_complete) setActiveStep(3);
          else if (!data.is_emergency_social_complete) setActiveStep(4);
          else setActiveStep(1);
        }
      } catch (err) {
        console.error("Error loading profile:", err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [session?.accessToken]);

  const handleChange = (field: keyof UserProfile, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!session?.accessToken) return;

    setIsSaving(true);
    setMessage(null);

    try {
      const updated = await updateProfile(formData, session.accessToken);
      setProfile(updated);
      setFormData(updated);

      await updateSession({
        profileCompletionPercentage: updated.profile_completion_percentage,
        position: updated.position,
      });

      setMessage({ type: 'success', text: `Profile updated! Completion: ${updated.profile_completion_percentage}%` });

      if (activeStep < 4) {
        setActiveStep(prev => prev + 1);
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

  const handleSelectPresetAvatar = async (iconId: string) => {
    if (!session?.accessToken) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://oasis-skills-portal.onrender.com'}/api/auth/me`, {
        method: 'PATCH',
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.accessToken}`
        },
        body: JSON.stringify({ avatar_type: 'icon', avatar_icon: iconId })
      });

      if (!res.ok) throw new Error("Failed to update avatar");

      setProfile(prev => prev ? { ...prev, avatar_type: 'icon', avatar_icon: iconId } : null);
      await updateSession({ avatarType: 'icon', avatarIcon: iconId });
      setMessage({ type: 'success', text: "Avatar updated successfully!" });
    } catch (err) {
      setMessage({ type: 'error', text: "Failed to update avatar." });
    }
  };

  const handleFileUploadAvatar = async (file: File) => {
    if (!session?.accessToken) return;
    try {
      setIsSaving(true);
      setMessage(null);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://oasis-skills-portal.onrender.com';
      const fd = new FormData();
      fd.append('file', file);

      const res = await fetch(`${apiUrl}/api/auth/upload-avatar`, {
        method: 'POST',
        headers: { "Authorization": `Bearer ${session.accessToken}` },
        body: fd
      });

      if (res.ok) {
        const data = await res.json();
        const uploadedUrl = data.avatar_url;
        setProfile(prev => prev ? { ...prev, avatar_url: uploadedUrl, avatar_type: 'upload' } : null);
        await updateSession({ image: uploadedUrl, avatarType: 'upload' });
        setMessage({ type: 'success', text: "Profile photo uploaded successfully!" });
        return;
      }

      // Fallback: Convert to Base64 Data URL
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Url = e.target?.result as string;
        if (!base64Url) return;

        const patchRes = await fetch(`${apiUrl}/api/auth/me`, {
          method: 'PATCH',
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.accessToken}`
          },
          body: JSON.stringify({ avatar_url: base64Url, avatar_type: 'url' })
        });

        if (patchRes.ok) {
          setProfile(prev => prev ? { ...prev, avatar_url: base64Url, avatar_type: 'url' } : null);
          await updateSession({ image: base64Url, avatarType: 'url' });
          setMessage({ type: 'success', text: "Profile photo saved successfully!" });
        } else {
          setMessage({ type: 'error', text: "Failed to save photo." });
        }
      };
      reader.readAsDataURL(file);

    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || "Failed to upload photo." });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.accessToken) return;

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: "New passwords do not match." });
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://oasis-skills-portal.onrender.com'}/api/auth/password`, {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.accessToken}`
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to update password.");
      }

      setMessage({ type: 'success', text: "Password updated successfully!" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || "Failed to update password." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!session?.accessToken) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://oasis-skills-portal.onrender.com'}/api/auth/me`, {
        method: 'DELETE',
        headers: { "Authorization": `Bearer ${session.accessToken}` }
      });
      if (res.ok) {
        signOut({ callbackUrl: '/' });
      } else {
        throw new Error("Account deletion failed.");
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || "An error occurred while deleting account." });
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-oasis-emerald border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const completion = profile?.profile_completion_percentage ?? 0;
  const iconInfo = getAvatarIcon(profile?.avatar_icon || 'default');

  return (
    <div className="container mx-auto px-4 py-10 max-w-6xl">
      {/* Header Banner */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">
          Account Settings & Preferences
        </h1>
        <p className="text-oasis-muted text-sm mt-1">
          Manage your personal information, avatar, progressive profile, security credentials, and volunteer status.
        </p>
      </div>

      {message && (
        <div className={`p-4 rounded-2xl mb-6 text-sm flex items-center gap-2 ${
          message.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'
        }`}>
          {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Main Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Sidebar Navigation Tabs */}
        <div className="lg:col-span-1 space-y-2">
          <button
            onClick={() => { setActiveTab("profile"); setMessage(null); }}
            className={`w-full flex items-center gap-3 p-4 rounded-2xl font-bold text-sm text-left transition-all ${
              activeTab === "profile"
                ? "bg-oasis-emerald/15 border border-oasis-emerald text-oasis-emerald shadow-md"
                : "bg-foreground/5 border border-foreground/10 text-foreground/70 hover:bg-foreground/10"
            }`}
          >
            <User size={18} /> Profile & Details
          </button>

          <button
            onClick={() => { setActiveTab("account"); setMessage(null); }}
            className={`w-full flex items-center gap-3 p-4 rounded-2xl font-bold text-sm text-left transition-all ${
              activeTab === "account"
                ? "bg-oasis-emerald/15 border border-oasis-emerald text-oasis-emerald shadow-md"
                : "bg-foreground/5 border border-foreground/10 text-foreground/70 hover:bg-foreground/10"
            }`}
          >
            <Mail size={18} /> Account & Danger Zone
          </button>

          <button
            onClick={() => { setActiveTab("security"); setMessage(null); }}
            className={`w-full flex items-center gap-3 p-4 rounded-2xl font-bold text-sm text-left transition-all ${
              activeTab === "security"
                ? "bg-oasis-emerald/15 border border-oasis-emerald text-oasis-emerald shadow-md"
                : "bg-foreground/5 border border-foreground/10 text-foreground/70 hover:bg-foreground/10"
            }`}
          >
            <Key size={18} /> Security & Password
          </button>
        </div>

        {/* Right Tab Content Panel */}
        <div className="lg:col-span-3 space-y-8">
          {/* ───────────────────────────────────────────── */}
          {/* TAB 1: PROFILE & DETAILS */}
          {/* ───────────────────────────────────────────── */}
          {activeTab === "profile" && (
            <div className="space-y-8">
              {/* SECTION 1 (FIRST): AVATAR SETTINGS */}
              <div className="glass-card rounded-3xl p-6 md:p-8 border border-foreground/10 space-y-6">
                <div className="flex items-center justify-between border-b border-foreground/10 pb-4">
                  <div>
                    <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                      <Camera className="text-oasis-emerald" size={20} /> 1. Avatar & Profile Photo
                    </h3>
                    <p className="text-xs text-oasis-muted mt-0.5">Customize your visual identity on cards and certificates.</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-6">
                  {/* Current Avatar Box */}
                  <div className="relative group">
                    <div className="w-24 h-24 rounded-2xl border-2 border-oasis-emerald p-1 bg-black/40 overflow-hidden flex items-center justify-center shadow-lg">
                      {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover rounded-xl" />
                      ) : (
                        <div className="w-12 h-12 text-oasis-emerald">{iconInfo.svg}</div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3 text-center sm:text-left">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                      <Button
                        onClick={() => setIsAvatarPickerOpen(true)}
                        className="bg-oasis-emerald/20 border border-oasis-emerald/40 text-oasis-emerald hover:bg-oasis-emerald/30 font-bold rounded-xl px-4 py-2 text-xs"
                      >
                        Choose Preset Avatar Icon
                      </Button>
                      <label className="cursor-pointer bg-foreground/5 hover:bg-foreground/10 border border-foreground/10 text-foreground font-bold rounded-xl px-4 py-2 text-xs transition-colors">
                        Upload Custom Photo
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files?.[0]) handleFileUploadAvatar(e.target.files[0]);
                          }}
                        />
                      </label>
                    </div>
                    <p className="text-[11px] text-oasis-muted">Supports PNG, JPG, or WebP up to 5MB.</p>
                  </div>
                </div>
              </div>

              {/* SECTION 2 (SECOND): PROGRESSIVE PROFILE SYSTEM */}
              <div className="glass-card rounded-3xl p-6 md:p-8 border border-foreground/10 space-y-6">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-foreground/10 pb-4">
                  <div>
                    <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                      <Sparkles className="text-oasis-emerald" size={20} /> 2. Progressive Profile Information
                    </h3>
                    <p className="text-xs text-oasis-muted mt-0.5">Complete all 4 sections to reach 100% and unlock your Digital ID Card.</p>
                  </div>
                  <div className="w-full md:w-48 text-right bg-foreground/5 p-3 rounded-xl border border-foreground/10">
                    <div className="text-xs font-bold text-oasis-emerald mb-1">Completion: {completion}%</div>
                    <Progress value={completion} className="h-2 bg-foreground/10" />
                  </div>
                </div>

                {/* Step Navigation Pills */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <button
                    onClick={() => setActiveStep(1)}
                    className={`p-3 rounded-xl font-bold text-xs text-left transition-all ${
                      activeStep === 1 ? "bg-oasis-emerald text-black shadow-md" : "bg-foreground/5 text-foreground/70"
                    }`}
                  >
                    1. Personal (+25%)
                  </button>
                  <button
                    onClick={() => setActiveStep(2)}
                    className={`p-3 rounded-xl font-bold text-xs text-left transition-all ${
                      activeStep === 2 ? "bg-oasis-emerald text-black shadow-md" : "bg-foreground/5 text-foreground/70"
                    }`}
                  >
                    2. Educational (+25%)
                  </button>
                  <button
                    onClick={() => setActiveStep(3)}
                    className={`p-3 rounded-xl font-bold text-xs text-left transition-all ${
                      activeStep === 3 ? "bg-oasis-emerald text-black shadow-md" : "bg-foreground/5 text-foreground/70"
                    }`}
                  >
                    3. Address (+25%)
                  </button>
                  <button
                    onClick={() => setActiveStep(4)}
                    className={`p-3 rounded-xl font-bold text-xs text-left transition-all ${
                      activeStep === 4 ? "bg-oasis-emerald text-black shadow-md" : "bg-foreground/5 text-foreground/70"
                    }`}
                  >
                    4. Emergency/Social (+25%)
                  </button>
                </div>

                {/* Form Steps */}
                <form onSubmit={handleSaveProfile} className="space-y-4 pt-2">
                  {activeStep === 1 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold uppercase text-foreground/70">Full Name *</label>
                        <input
                          type="text"
                          required
                          value={formData.full_name || ''}
                          onChange={e => handleChange('full_name', e.target.value)}
                          className="w-full mt-1 bg-foreground/5 border border-foreground/10 rounded-xl p-3 text-xs text-foreground focus:outline-none focus:border-oasis-emerald/50"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold uppercase text-foreground/70">Phone Number *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. +92 300 1234567"
                          value={formData.phone_number || ''}
                          onChange={e => handleChange('phone_number', e.target.value)}
                          className="w-full mt-1 bg-foreground/5 border border-foreground/10 rounded-xl p-3 text-xs text-foreground focus:outline-none focus:border-oasis-emerald/50"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold uppercase text-foreground/70">Date of Birth</label>
                        <input
                          type="date"
                          value={formData.date_of_birth ? String(formData.date_of_birth) : ''}
                          onChange={e => handleChange('date_of_birth', e.target.value)}
                          className="w-full mt-1 bg-foreground/5 border border-foreground/10 rounded-xl p-3 text-xs text-foreground focus:outline-none focus:border-oasis-emerald/50"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold uppercase text-foreground/70">Gender</label>
                        <select
                          value={formData.gender || ''}
                          onChange={e => handleChange('gender', e.target.value)}
                          className="w-full mt-1 bg-foreground/5 border border-foreground/10 rounded-xl p-3 text-xs text-foreground focus:outline-none focus:border-oasis-emerald/50"
                        >
                          <option value="" className="bg-oasis-bgSecondary">Select Gender</option>
                          <option value="male" className="bg-oasis-bgSecondary">Male</option>
                          <option value="female" className="bg-oasis-bgSecondary">Female</option>
                          <option value="other" className="bg-oasis-bgSecondary">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-bold uppercase text-foreground/70">CNIC / Identification Number *</label>
                        <input
                          type="text"
                          required
                          placeholder="35202-xxxxxxx-x"
                          value={formData.cnic_number || ''}
                          onChange={e => handleChange('cnic_number', e.target.value)}
                          className="w-full mt-1 bg-foreground/5 border border-foreground/10 rounded-xl p-3 text-xs text-foreground focus:outline-none focus:border-oasis-emerald/50"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold uppercase text-foreground/70">Desired Volunteer Position</label>
                        <input
                          type="text"
                          placeholder="e.g. Research Volunteer / Event Manager"
                          value={formData.position || ''}
                          onChange={e => handleChange('position', e.target.value)}
                          className="w-full mt-1 bg-foreground/5 border border-foreground/10 rounded-xl p-3 text-xs text-foreground focus:outline-none focus:border-oasis-emerald/50"
                        />
                      </div>
                    </div>
                  )}

                  {activeStep === 2 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold uppercase text-foreground/70">Institution / University Name *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. UET Lahore / NUST"
                          value={formData.institution_name || ''}
                          onChange={e => handleChange('institution_name', e.target.value)}
                          className="w-full mt-1 bg-foreground/5 border border-foreground/10 rounded-xl p-3 text-xs text-foreground focus:outline-none focus:border-oasis-emerald/50"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold uppercase text-foreground/70">Degree Program *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. BS Computer Science"
                          value={formData.degree_program || ''}
                          onChange={e => handleChange('degree_program', e.target.value)}
                          className="w-full mt-1 bg-foreground/5 border border-foreground/10 rounded-xl p-3 text-xs text-foreground focus:outline-none focus:border-oasis-emerald/50"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold uppercase text-foreground/70">Semester / Class</label>
                        <input
                          type="text"
                          placeholder="e.g. 6th Semester"
                          value={formData.semester_class || ''}
                          onChange={e => handleChange('semester_class', e.target.value)}
                          className="w-full mt-1 bg-foreground/5 border border-foreground/10 rounded-xl p-3 text-xs text-foreground focus:outline-none focus:border-oasis-emerald/50"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold uppercase text-foreground/70">Graduation Year</label>
                        <input
                          type="text"
                          placeholder="e.g. 2026"
                          value={formData.graduation_year || ''}
                          onChange={e => handleChange('graduation_year', e.target.value)}
                          className="w-full mt-1 bg-foreground/5 border border-foreground/10 rounded-xl p-3 text-xs text-foreground focus:outline-none focus:border-oasis-emerald/50"
                        />
                      </div>
                    </div>
                  )}

                  {activeStep === 3 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold uppercase text-foreground/70">City *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Lahore"
                          value={formData.city || ''}
                          onChange={e => handleChange('city', e.target.value)}
                          className="w-full mt-1 bg-foreground/5 border border-foreground/10 rounded-xl p-3 text-xs text-foreground focus:outline-none focus:border-oasis-emerald/50"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold uppercase text-foreground/70">Province / Region *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Punjab"
                          value={formData.province || ''}
                          onChange={e => handleChange('province', e.target.value)}
                          className="w-full mt-1 bg-foreground/5 border border-foreground/10 rounded-xl p-3 text-xs text-foreground focus:outline-none focus:border-oasis-emerald/50"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-xs font-bold uppercase text-foreground/70">Complete Residential Address *</label>
                        <textarea
                          rows={2}
                          required
                          value={formData.complete_address || ''}
                          onChange={e => handleChange('complete_address', e.target.value)}
                          className="w-full mt-1 bg-foreground/5 border border-foreground/10 rounded-xl p-3 text-xs text-foreground focus:outline-none focus:border-oasis-emerald/50 resize-none"
                        />
                      </div>
                    </div>
                  )}

                  {activeStep === 4 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold uppercase text-foreground/70">Guardian / Emergency Contact Name *</label>
                        <input
                          type="text"
                          required
                          value={formData.guardian_name || ''}
                          onChange={e => handleChange('guardian_name', e.target.value)}
                          className="w-full mt-1 bg-foreground/5 border border-foreground/10 rounded-xl p-3 text-xs text-foreground focus:outline-none focus:border-oasis-emerald/50"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold uppercase text-foreground/70">Guardian Contact Number *</label>
                        <input
                          type="text"
                          required
                          value={formData.guardian_contact || ''}
                          onChange={e => handleChange('guardian_contact', e.target.value)}
                          className="w-full mt-1 bg-foreground/5 border border-foreground/10 rounded-xl p-3 text-xs text-foreground focus:outline-none focus:border-oasis-emerald/50"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold uppercase text-foreground/70">LinkedIn Profile URL</label>
                        <input
                          type="url"
                          placeholder="https://linkedin.com/in/username"
                          value={formData.linkedin_url || ''}
                          onChange={e => handleChange('linkedin_url', e.target.value)}
                          className="w-full mt-1 bg-foreground/5 border border-foreground/10 rounded-xl p-3 text-xs text-foreground focus:outline-none focus:border-oasis-emerald/50"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold uppercase text-foreground/70">GitHub / Portfolio URL</label>
                        <input
                          type="url"
                          placeholder="https://github.com/username"
                          value={formData.github_url || ''}
                          onChange={e => handleChange('github_url', e.target.value)}
                          className="w-full mt-1 bg-foreground/5 border border-foreground/10 rounded-xl p-3 text-xs text-foreground focus:outline-none focus:border-oasis-emerald/50"
                        />
                      </div>
                    </div>
                  )}

                  <div className="pt-4 flex justify-end">
                    <Button
                      type="submit"
                      disabled={isSaving}
                      className="bg-oasis-emerald text-black font-bold px-6 py-2.5 rounded-xl shadow-lg flex items-center gap-2"
                    >
                      <Save size={16} /> {isSaving ? "Saving..." : "Save Section Data"}
                    </Button>
                  </div>
                </form>
              </div>

              {/* SECTION 3 (THIRD): VOLUNTEER VERIFICATION REQUEST */}
              <div className="glass-card rounded-3xl p-6 md:p-8 border border-foreground/10 space-y-4">
                <div className="flex items-center justify-between border-b border-foreground/10 pb-4">
                  <div>
                    <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                      <ShieldCheck className="text-oasis-emerald" size={20} /> 3. Volunteer Verification Status
                    </h3>
                    <p className="text-xs text-oasis-muted mt-0.5">Earn your official Verified Volunteering Digital ID Card.</p>
                  </div>
                </div>

                {profile?.volunteer_status === 'approved' && (
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-bold">
                      <CheckCircle2 size={18} /> Official Verified Oasis Volunteer
                    </div>
                    <Button onClick={() => router.push('/dashboard/id-card')} className="bg-oasis-emerald text-black font-bold rounded-xl text-xs px-4 py-2">
                      View ID Card <ArrowRight size={14} className="ml-1" />
                    </Button>
                  </div>
                )}

                {profile?.volunteer_status === 'pending' && (
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 flex items-center gap-2 text-sm font-bold">
                    <Clock size={18} /> Verification Application Under Admin Review
                  </div>
                )}

                {(!profile?.volunteer_status || profile?.volunteer_status === 'not_applied' || profile?.volunteer_status === 'rejected') && (
                  <div className="space-y-4 pt-2">
                    <p className="text-xs text-oasis-muted">
                      Once your profile reaches 100% completion, submit your verification request to unlock your Volunteering Card and apply for programs.
                    </p>
                    <Button
                      onClick={handleVolunteerApply}
                      disabled={isSaving || completion < 100}
                      className="bg-oasis-emerald hover:bg-oasis-emeraldLight text-black font-extrabold rounded-xl px-6 py-3 shadow-lg shadow-oasis-emerald/20"
                    >
                      {isSaving ? "Submitting..." : profile?.volunteer_status === 'rejected' ? "Re-Apply for Verification" : "Apply for Volunteer Verification"} <ShieldCheck className="ml-2" size={18} />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ───────────────────────────────────────────── */}
          {/* TAB 2: ACCOUNT & DANGER ZONE */}
          {/* ───────────────────────────────────────────── */}
          {activeTab === "account" && (
            <div className="space-y-8">
              <div className="glass-card rounded-3xl p-6 md:p-8 border border-foreground/10 space-y-6">
                <h3 className="text-xl font-bold text-foreground flex items-center gap-2 border-b border-foreground/10 pb-4">
                  <Mail className="text-oasis-emerald" size={20} /> Account Details
                </h3>

                <div className="space-y-4 max-w-xl">
                  <div>
                    <label className="text-xs font-bold uppercase text-foreground/50">Email Address</label>
                    <div className="flex items-center justify-between mt-1 bg-foreground/5 border border-foreground/10 rounded-xl p-3 text-xs text-foreground font-mono">
                      <span>{session?.user?.email}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 size={12} /> Verified
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase text-foreground/50">Registration Number</label>
                    <div className="mt-1 bg-foreground/5 border border-foreground/10 rounded-xl p-3 text-xs font-mono font-bold text-oasis-emerald">
                      {profile?.registration_number || (session?.user as any)?.registrationNumber || 'OASIS-MBR-2026-10001'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="glass-card rounded-3xl p-6 md:p-8 border border-red-500/30 bg-red-500/5 space-y-4">
                <h3 className="text-xl font-bold text-red-400 flex items-center gap-2 border-b border-red-500/20 pb-4">
                  <AlertTriangle size={20} /> Danger Zone
                </h3>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-foreground">Delete Account</h4>
                    <p className="text-xs text-oasis-muted mt-1 max-w-md">
                      Permanently remove your personal account, registrations, and earned data. This action is non-reversible.
                    </p>
                  </div>
                  <Button
                    onClick={() => setIsDeleteModalOpen(true)}
                    className="bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 font-bold rounded-xl text-xs px-5 py-2.5"
                  >
                    Delete Account
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* ───────────────────────────────────────────── */}
          {/* TAB 3: SECURITY & PASSWORD */}
          {/* ───────────────────────────────────────────── */}
          {activeTab === "security" && (
            <div className="glass-card rounded-3xl p-6 md:p-8 border border-foreground/10 space-y-6">
              <h3 className="text-xl font-bold text-foreground flex items-center gap-2 border-b border-foreground/10 pb-4">
                <Key className="text-oasis-emerald" size={20} /> Password & Security
              </h3>

              <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                <div>
                  <label className="text-xs font-bold uppercase text-foreground/70">Current Password *</label>
                  <div className="relative mt-1">
                    <input
                      type={showPasswords ? "text" : "password"}
                      required
                      value={currentPassword}
                      onChange={e => setCurrentPassword(e.target.value)}
                      className="w-full bg-foreground/5 border border-foreground/10 rounded-xl p-3 text-xs text-foreground focus:outline-none focus:border-oasis-emerald/50 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(!showPasswords)}
                      className="absolute right-3 top-3 text-foreground/40 hover:text-foreground"
                    >
                      {showPasswords ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase text-foreground/70">New Password *</label>
                  <input
                    type={showPasswords ? "text" : "password"}
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="w-full mt-1 bg-foreground/5 border border-foreground/10 rounded-xl p-3 text-xs text-foreground focus:outline-none focus:border-oasis-emerald/50"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase text-foreground/70">Confirm New Password *</label>
                  <input
                    type={showPasswords ? "text" : "password"}
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="w-full mt-1 bg-foreground/5 border border-foreground/10 rounded-xl p-3 text-xs text-foreground focus:outline-none focus:border-oasis-emerald/50"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSaving}
                  className="bg-oasis-emerald text-black font-bold px-6 py-2.5 rounded-xl shadow-lg mt-2"
                >
                  {isSaving ? "Updating Password..." : "Update Password"}
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Preset Avatar Picker Modal */}
      {isAvatarPickerOpen && (
        <AvatarPicker
          currentType={profile?.avatar_type || 'icon'}
          currentIcon={profile?.avatar_icon || 'default'}
          currentUrl={profile?.avatar_url || null}
          onClose={() => setIsAvatarPickerOpen(false)}
          onSaveIcon={handleSelectPresetAvatar}
          onSaveUpload={handleFileUploadAvatar}
        />
      )}

      {/* Account Deletion Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card bg-oasis-bgSecondary rounded-3xl max-w-md w-full p-6 border border-red-500/30 text-center space-y-4">
            <AlertTriangle size={48} className="text-red-400 mx-auto" />
            <h3 className="text-xl font-bold text-foreground">Confirm Account Deletion</h3>
            <p className="text-xs text-oasis-muted">
              Are you completely sure? This will delete your profile, application history, and access permanently.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button
                onClick={() => setIsDeleteModalOpen(false)}
                className="bg-foreground/10 hover:bg-foreground/20 text-foreground font-bold rounded-xl text-xs px-4 py-2"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl text-xs px-4 py-2"
              >
                {isDeleting ? "Deleting..." : "Permanently Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
