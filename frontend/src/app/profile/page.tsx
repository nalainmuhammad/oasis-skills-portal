"use client";

import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { User, Mail, Save, ShieldCheck, AlertCircle, Key, Eye, EyeOff, MapPin, Briefcase, Calendar, Globe, Phone, Camera, Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { AvatarPicker } from "@/components/profile/avatar-picker";
import { getAvatarIcon } from "@/components/profile/avatar-icons";

export default function ProfileSettingsPage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState("profile");
  const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  
  // Profile Data
  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    institution: "",
    location: "",
    phone_number: "",
    date_of_birth: "",
    gender: "",
    website_url: "",
    social_links: {
      github: "",
      linkedin: "",
      twitter: ""
    }
  });

  // Security Data
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);

  // Load initial data
  useEffect(() => {
    if (session?.accessToken) {
      fetchProfile();
    }
  }, [session?.accessToken]);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://oasis-skills-portal.onrender.com'}/api/auth/me`, {
        headers: { "Authorization": `Bearer ${session!.accessToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setFormData({
          name: data.full_name || "",
          bio: data.bio || "",
          institution: data.institution || "",
          location: data.location || "",
          phone_number: data.phone_number || "",
          date_of_birth: data.date_of_birth || "",
          gender: data.gender || "",
          website_url: data.website_url || "",
          social_links: {
            github: data.social_links?.github || "",
            linkedin: data.social_links?.linkedin || "",
            twitter: data.social_links?.twitter || ""
          }
        });
      }
    } catch (e) {
      console.error("Failed to fetch profile data:", e);
    }
  };

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 rounded-full border-2 border-oasis-emerald/30 border-t-oasis-emerald animate-spin"></div>
      </div>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('social.')) {
      const network = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        social_links: { ...prev.social_links, [network]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ text: "", type: "" });

    try {
      const payload = {
        full_name: formData.name,
        bio: formData.bio,
        institution: formData.institution,
        location: formData.location,
        phone_number: formData.phone_number,
        date_of_birth: formData.date_of_birth || null,
        gender: formData.gender || null,
        website_url: formData.website_url,
        social_links: formData.social_links
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://oasis-skills-portal.onrender.com'}/api/auth/me`, {
        method: 'PATCH',
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.accessToken}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Failed to update profile");
      
      await update({ name: formData.name }); // Update NextAuth session
      setMessage({ text: "Profile updated successfully!", type: "success" });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setMessage({ text: "An error occurred while updating.", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage({ text: "New passwords do not match.", type: "error" });
      return;
    }
    
    setIsLoading(true);
    setMessage({ text: "", type: "" });

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://oasis-skills-portal.onrender.com'}/api/auth/password`, {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.accessToken}`
        },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || errorData.message || "Failed to update password");
      }
      
      setMessage({ text: "Password updated successfully!", type: "success" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setMessage({ text: err.message || "An error occurred.", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOtpFromProfile = async () => {
    setIsLoading(true);
    setMessage({ text: "", type: "" });
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://oasis-skills-portal.onrender.com'}/api/auth/send-verification-otp`, {
        method: 'POST',
        headers: {
          "Authorization": `Bearer ${session?.accessToken}`
        }
      });
      if (res.ok) {
        router.push(`/verify-email?email=${encodeURIComponent(session?.user?.email || '')}`);
      } else {
        const errorData = await res.json();
        setMessage({ text: errorData.detail || "Failed to send verification code.", type: "error" });
      }
    } catch (err) {
      setMessage({ text: "An error occurred while sending OTP.", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveIcon = async (iconId: string) => {
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
      
      await update({ avatarType: 'icon', avatarIcon: iconId });
      setMessage({ text: "Avatar updated successfully!", type: "success" });
    } catch (err) {
      setMessage({ text: "Failed to update avatar.", type: "error" });
      throw err;
    }
  };

  const handleSaveUpload = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://oasis-skills-portal.onrender.com'}/api/auth/upload-avatar`, {
        method: 'POST',
        headers: {
          "Authorization": `Bearer ${session.accessToken}`
        },
        body: formData
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to upload photo");
      }
      
      const data = await res.json();
      await update({ avatarType: 'upload', image: data.avatar_url });
      setMessage({ text: "Photo uploaded successfully!", type: "success" });
    } catch (err) {
      setMessage({ text: "Failed to upload photo.", type: "error" });
      throw err;
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.oasisportal.tech';
      const res = await fetch(`${apiUrl}/api/auth/account`, {
        method: 'DELETE',
        headers: {
          "Authorization": `Bearer ${session.accessToken}`
        }
      });
      if (res.ok) {
        await signOut({ callbackUrl: '/' });
      } else {
        const data = await res.json();
        setMessage({ text: data.detail || "Failed to delete account", type: "error" });
        setIsDeleteModalOpen(false);
      }
    } catch (err) {
      setMessage({ text: "An error occurred while deleting account", type: "error" });
      setIsDeleteModalOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  // Avatar rendering logic
  const renderAvatar = () => {
    const type = session.user.avatarType;
    if ((type === 'upload' || type === 'google') && session.user.image) {
      return <img src={session.user.image} alt="Avatar" className="w-full h-full object-cover" />;
    }
    
    // Icon fallback
    const iconId = session.user.avatarIcon || 'default';
    const icon = getAvatarIcon(iconId);
    return (
      <div className="w-full h-full flex items-center justify-center text-oasis-emerald bg-oasis-emerald/10">
        {icon.svg}
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen pt-24 pb-20">
      <div className="container mx-auto px-4 md:px-6 max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-2">Account Settings</h1>
          <p className="text-oasis-muted">Manage your personal information and preferences.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Sidebar Nav */}
          <div className="md:col-span-1">
            <nav className="flex flex-col space-y-2 sticky top-24">
              <button 
                onClick={() => { setActiveTab("profile"); setMessage({ text: "", type: "" }); }}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'profile' ? 'bg-foreground/10 text-foreground border border-foreground/5' : 'text-foreground/60 hover:text-foreground hover:bg-foreground/5'}`}
              >
                <User size={18} className={activeTab === 'profile' ? 'text-oasis-emerald' : 'text-foreground/40'} /> Profile
              </button>
              <button 
                onClick={() => { setActiveTab("account"); setMessage({ text: "", type: "" }); }}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'account' ? 'bg-foreground/10 text-foreground border border-foreground/5' : 'text-foreground/60 hover:text-foreground hover:bg-foreground/5'}`}
              >
                <Mail size={18} className={activeTab === 'account' ? 'text-oasis-emerald' : 'text-foreground/40'} /> Account
              </button>
              <button 
                onClick={() => { setActiveTab("security"); setMessage({ text: "", type: "" }); }}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'security' ? 'bg-foreground/10 text-foreground border border-foreground/5' : 'text-foreground/60 hover:text-foreground hover:bg-foreground/5'}`}
              >
                <ShieldCheck size={18} className={activeTab === 'security' ? 'text-oasis-emerald' : 'text-foreground/40'} /> Security
              </button>
            </nav>
          </div>

          {/* Main Content Area */}
          <div className="md:col-span-3 space-y-6">
            <div className="glass-card p-6 md:p-8 rounded-2xl border border-foreground/5 relative overflow-hidden">
              {/* Background Glows */}
              {activeTab === 'profile' && <div className="absolute top-0 right-0 w-64 h-64 bg-oasis-emerald/5 rounded-full blur-[80px] -z-10"></div>}
              {activeTab === 'account' && <div className="absolute top-0 right-0 w-64 h-64 bg-oasis-cyan/5 rounded-full blur-[80px] -z-10"></div>}
              {activeTab === 'security' && <div className="absolute top-0 right-0 w-64 h-64 bg-oasis-gold/5 rounded-full blur-[80px] -z-10"></div>}
              
              {message.text && (
                <div className={`p-4 rounded-xl mb-6 flex items-start gap-3 text-sm ${message.type === 'success' ? 'bg-oasis-emerald/10 text-oasis-emerald border border-oasis-emerald/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                  {message.type === 'error' ? <AlertCircle size={18} className="mt-0.5 shrink-0" /> : <ShieldCheck size={18} className="mt-0.5 shrink-0" />}
                  <p>{message.text}</p>
                </div>
              )}

              {/* PROFILE TAB */}
              {activeTab === 'profile' && (
                <div className="space-y-8">
                  {/* Avatar Section */}
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pb-8 border-b border-foreground/10">
                    <div className="relative group">
                      <div className="w-24 h-24 rounded-full border-2 border-foreground/10 overflow-hidden bg-foreground/5">
                        {renderAvatar()}
                      </div>
                      <button 
                        onClick={() => setIsAvatarPickerOpen(true)}
                        className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Camera size={24} className="text-white" />
                      </button>
                    </div>
                    <div className="text-center sm:text-left">
                      <h3 className="text-lg font-semibold text-foreground mb-1">Profile Photo</h3>
                      <p className="text-sm text-foreground/50 mb-3 max-w-sm">
                        This avatar will be displayed on your certificates and public profile (if enabled).
                      </p>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsAvatarPickerOpen(true)}
                        className="border-foreground/20 hover:bg-foreground/10"
                      >
                        Change Avatar
                      </Button>
                    </div>
                  </div>

                  <form onSubmit={handleUpdateProfile} className="space-y-8">
                    {/* Basic Info */}
                    <div className="space-y-5">
                      <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                        <User size={18} className="text-oasis-emerald" /> Basic Information
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-foreground/70 uppercase tracking-wider">Full Name *</label>
                          <input 
                            type="text" name="name" value={formData.name} onChange={handleInputChange} required
                            className="w-full bg-foreground/5 border border-foreground/10 rounded-xl py-3 px-4 text-foreground focus:outline-none focus:border-oasis-emerald/50 focus:bg-foreground/10 transition-colors"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-foreground/70 uppercase tracking-wider">Phone Number</label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" size={16} />
                            <input 
                              type="tel" name="phone_number" value={formData.phone_number} onChange={handleInputChange}
                              className="w-full bg-foreground/5 border border-foreground/10 rounded-xl py-3 pl-10 pr-4 text-foreground focus:outline-none focus:border-oasis-emerald/50 focus:bg-foreground/10 transition-colors"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-medium text-foreground/70 uppercase tracking-wider">Short Bio</label>
                        <textarea 
                          name="bio" value={formData.bio} onChange={handleInputChange} rows={3}
                          placeholder="Tell us a little about yourself..."
                          className="w-full bg-foreground/5 border border-foreground/10 rounded-xl py-3 px-4 text-foreground focus:outline-none focus:border-oasis-emerald/50 focus:bg-foreground/10 transition-colors resize-none"
                        ></textarea>
                      </div>
                    </div>

                    {/* Professional Info */}
                    <div className="space-y-5 pt-6 border-t border-foreground/10">
                      <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                        <Briefcase size={18} className="text-oasis-gold" /> Professional
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-foreground/70 uppercase tracking-wider">Institution / Company</label>
                          <input 
                            type="text" name="institution" value={formData.institution} onChange={handleInputChange}
                            className="w-full bg-foreground/5 border border-foreground/10 rounded-xl py-3 px-4 text-foreground focus:outline-none focus:border-oasis-emerald/50 focus:bg-foreground/10 transition-colors"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-foreground/70 uppercase tracking-wider">Location</label>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" size={16} />
                            <input 
                              type="text" name="location" value={formData.location} onChange={handleInputChange} placeholder="City, Country"
                              className="w-full bg-foreground/5 border border-foreground/10 rounded-xl py-3 pl-10 pr-4 text-foreground focus:outline-none focus:border-oasis-emerald/50 focus:bg-foreground/10 transition-colors"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Personal Info */}
                    <div className="space-y-5 pt-6 border-t border-foreground/10">
                      <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                        <Calendar size={18} className="text-oasis-cyan" /> Demographics
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-foreground/70 uppercase tracking-wider">Date of Birth</label>
                          <input 
                            type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleInputChange}
                            className="w-full bg-foreground/5 border border-foreground/10 rounded-xl py-3 px-4 text-foreground focus:outline-none focus:border-oasis-emerald/50 focus:bg-foreground/10 transition-colors dark:[color-scheme:dark]"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-foreground/70 uppercase tracking-wider">Gender</label>
                          <select 
                            name="gender" value={formData.gender} onChange={handleInputChange}
                            className="w-full bg-foreground/5 border border-foreground/10 rounded-xl py-3 px-4 text-foreground focus:outline-none focus:border-oasis-emerald/50 focus:bg-foreground/10 transition-colors appearance-none"
                          >
                            <option value="" className="bg-oasis-bgSecondary text-foreground">Select gender...</option>
                            <option value="male" className="bg-oasis-bgSecondary text-foreground">Male</option>
                            <option value="female" className="bg-oasis-bgSecondary text-foreground">Female</option>
                            <option value="other" className="bg-oasis-bgSecondary text-foreground">Other</option>
                            <option value="prefer_not_to_say" className="bg-oasis-bgSecondary text-foreground">Prefer not to say</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Links */}
                    <div className="space-y-5 pt-6 border-t border-foreground/10">
                      <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                        <Globe size={18} className="text-purple-400" /> Links & Socials
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-xs font-medium text-foreground/70 uppercase tracking-wider">Personal Website / Portfolio</label>
                          <div className="relative">
                            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" size={16} />
                            <input 
                              type="url" name="website_url" value={formData.website_url} onChange={handleInputChange} placeholder="https://"
                              className="w-full bg-foreground/5 border border-foreground/10 rounded-xl py-3 pl-10 pr-4 text-foreground focus:outline-none focus:border-oasis-emerald/50 focus:bg-foreground/10 transition-colors"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-foreground/70 uppercase tracking-wider">GitHub</label>
                          <div className="relative">
                            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" size={16} />
                            <input 
                              type="url" name="social.github" value={formData.social_links.github} onChange={handleInputChange} placeholder="https://github.com/..."
                              className="w-full bg-foreground/5 border border-foreground/10 rounded-xl py-3 pl-10 pr-4 text-foreground focus:outline-none focus:border-oasis-emerald/50 focus:bg-foreground/10 transition-colors"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-foreground/70 uppercase tracking-wider">LinkedIn</label>
                          <div className="relative">
                            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" size={16} />
                            <input 
                              type="url" name="social.linkedin" value={formData.social_links.linkedin} onChange={handleInputChange} placeholder="https://linkedin.com/in/..."
                              className="w-full bg-foreground/5 border border-foreground/10 rounded-xl py-3 pl-10 pr-4 text-foreground focus:outline-none focus:border-oasis-emerald/50 focus:bg-foreground/10 transition-colors"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-8 border-t border-foreground/10 flex justify-end">
                      <Button 
                        type="submit" 
                        disabled={isLoading}
                        className="bg-oasis-emerald hover:bg-oasis-emeraldLight text-black font-semibold h-12 px-8 rounded-xl shadow-[0_0_15px_rgba(0,212,126,0.2)] disabled:opacity-50"
                      >
                        <Save className="mr-2" size={18} />
                        {isLoading ? "Saving..." : "Save Profile"}
                      </Button>
                    </div>
                  </form>
                </div>
              )}

              {/* ACCOUNT TAB */}
              {activeTab === 'account' && (
                <div className="space-y-8">
                  <h2 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
                    <Mail className="text-oasis-emerald" size={20} /> Account Details
                  </h2>

                  <div className="space-y-2 max-w-md">
                    <label className="text-xs font-medium text-foreground/70 uppercase tracking-wider">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" size={18} />
                      <input 
                        type="email" 
                        value={session.user.email || ""}
                        disabled
                        className="w-full bg-black/20 border border-foreground/5 rounded-xl py-3 pl-10 pr-4 text-foreground/50 cursor-not-allowed"
                      />
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-foreground/40">Email address cannot be changed.</p>
                      {session.user.emailVerified ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-oasis-emerald">
                          <ShieldCheck size={14} /> Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-500">
                          <AlertCircle size={14} /> Unverified
                        </span>
                      )}
                    </div>
                  </div>

                  {!session.user.emailVerified && (
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-5 max-w-md">
                      <h4 className="text-amber-500 font-medium flex items-center gap-2 mb-2">
                        <AlertCircle size={16} /> Email Verification Required
                      </h4>
                      <p className="text-sm text-foreground/70 mb-4">
                        You must verify your email address before you can enroll in any courses or earn certificates.
                      </p>
                      <Button 
                        onClick={() => router.push(`/verify-email?email=${encodeURIComponent(session.user.email || '')}`)}
                        className="bg-amber-500 hover:bg-amber-400 text-black font-medium h-9 text-sm"
                      >
                        Verify Now
                      </Button>
                    </div>
                  )}

                  {/* Danger Zone */}
                  <div className="pt-8 border-t border-foreground/10 max-w-md">
                    <h3 className="text-lg font-semibold text-red-500 mb-4 flex items-center gap-2">
                      <AlertTriangle size={18} /> Danger Zone
                    </h3>
                    <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-5">
                      <h4 className="font-medium text-foreground mb-1">Delete Account</h4>
                      <p className="text-xs text-foreground/60 mb-4">
                        Permanently remove your personal account and all of its contents from the platform. 
                        <strong className="text-red-500/80 block mt-1">Warning: All your earned certificates will be permanently revoked and invalidated.</strong>
                      </p>
                      <Button 
                        variant="destructive"
                        onClick={() => setIsDeleteModalOpen(true)}
                        className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 h-10 w-full"
                      >
                        <Trash2 size={16} className="mr-2" /> Delete Account
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* SECURITY TAB */}
              {activeTab === 'security' && (
                <div className="space-y-8 max-w-md">
                  <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                    <ShieldCheck className="text-oasis-emerald" size={20} /> Security Settings
                  </h2>

                  {/* Email Verification Section */}
                  <div className="bg-foreground/5 border border-foreground/10 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Mail className="text-oasis-emerald" size={18} />
                        <span className="text-sm font-medium text-foreground">Email Verification Status</span>
                      </div>
                      {session?.user?.emailVerified ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-oasis-emerald/10 text-oasis-emerald border border-oasis-emerald/20">
                          <ShieldCheck size={14} /> Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
                          <AlertCircle size={14} /> Unverified
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-foreground/60 leading-relaxed">
                      {session?.user?.emailVerified 
                        ? "Your account email is fully verified. You have complete access to all courses, certifications, and features."
                        : "Your email address is currently unverified. Verify your email to earn certificates and access all portal features."
                      }
                    </p>
                    {!session?.user?.emailVerified && (
                      <Button
                        type="button"
                        onClick={handleSendOtpFromProfile}
                        disabled={isLoading}
                        className="w-full bg-amber-500 hover:bg-amber-400 text-black font-semibold h-10 text-sm rounded-xl shadow-md transition-all"
                      >
                        {isLoading ? "Sending Code..." : "Send Verification Code & Verify"}
                      </Button>
                    )}
                  </div>
                  
                  {/* Password Change Form */}
                  <form onSubmit={handleUpdatePassword} className="space-y-6">
                  
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-foreground/70 uppercase tracking-wider">Current Password</label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" size={18} />
                      <input 
                        type={showPasswords ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                        className="w-full bg-foreground/5 border border-foreground/10 rounded-xl py-3 pl-10 pr-12 text-foreground focus:outline-none focus:border-oasis-emerald/50 focus:bg-foreground/10 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(!showPasswords)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground transition-colors"
                      >
                        {showPasswords ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-foreground/70 uppercase tracking-wider">New Password</label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" size={18} />
                      <input 
                        type={showPasswords ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        minLength={8}
                        className="w-full bg-foreground/5 border border-foreground/10 rounded-xl py-3 pl-10 pr-12 text-foreground focus:outline-none focus:border-oasis-emerald/50 focus:bg-foreground/10 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-foreground/70 uppercase tracking-wider">Confirm New Password</label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" size={18} />
                      <input 
                        type={showPasswords ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={8}
                        className="w-full bg-foreground/5 border border-foreground/10 rounded-xl py-3 pl-10 pr-12 text-foreground focus:outline-none focus:border-oasis-emerald/50 focus:bg-foreground/10 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button 
                      type="submit" 
                      disabled={isLoading || !currentPassword || !newPassword || !confirmPassword}
                      className="bg-oasis-emerald hover:bg-oasis-emeraldLight text-black font-semibold h-11 px-8 rounded-xl shadow-[0_0_15px_rgba(0,212,126,0.2)] disabled:opacity-50"
                    >
                      <Save className="mr-2" size={16} />
                      {isLoading ? "Updating..." : "Update Password"}
                    </Button>
                  </div>
                </form>
              </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {isAvatarPickerOpen && (
        <AvatarPicker
          currentType={session.user.avatarType}
          currentIcon={session.user.avatarIcon}
          currentUrl={session.user.image || null}
          onClose={() => setIsAvatarPickerOpen(false)}
          onSaveIcon={handleSaveIcon}
          onSaveUpload={handleSaveUpload}
        />
      )}

      {/* Delete Account Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-oasis-bgSecondary border border-foreground/10 rounded-2xl p-6 max-w-md w-full shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-[50px] -z-10"></div>
            
            <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle size={24} />
            </div>
            
            <h3 className="text-xl font-bold text-foreground mb-2">Delete Account</h3>
            <div className="text-sm text-foreground/70 mb-6 space-y-3">
              <p>Are you absolutely sure you want to delete your account? This action cannot be undone.</p>
              <ul className="list-disc pl-5 space-y-1 text-red-400 font-medium">
                <li>All your personal data will be permanently removed.</li>
                <li>Your course enrollments and progress will be lost.</li>
                <li><strong>All earned certificates will be permanently revoked and invalidated.</strong></li>
              </ul>
            </div>
            
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isDeleting}
                className="flex-1 border-foreground/20 hover:bg-foreground/10"
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white"
              >
                {isDeleting ? "Deleting..." : "Yes, Delete Account"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
