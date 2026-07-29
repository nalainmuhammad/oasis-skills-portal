"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { CertificateTemplateItem, Activity } from "@/types";
import { getCertificateTemplates, createCertificateTemplate, updateTemplatePositions, issueIndividualCertificate, issueProgramCertificates } from "@/lib/api/certificates";
import { getActivities } from "@/lib/api/activities";
import { getVolunteersFiltered } from "@/lib/api/admin";
import { Button } from "@/components/ui/button";
import { Award, Plus, Layers, Move, Sparkles, CheckCircle2, User, Zap } from "lucide-react";

export default function AdminCertificatesPage() {
  const { data: session } = useSession();
  const token = session?.accessToken || '';

  const [templates, setTemplates] = useState<CertificateTemplateItem[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [volunteers, setVolunteers] = useState<any[]>([]);

  const [activeTab, setActiveTab] = useState<'templates' | 'individual' | 'program'>('templates');

  // New Template form
  const [templateName, setTemplateName] = useState("");
  const [tmplBg, setTmplBg] = useState("");
  const [tmplLogo, setTmplLogo] = useState("");
  const [tmplSig, setTmplSig] = useState("");

  // Position Editor state
  const [selectedTemplate, setSelectedTemplate] = useState<CertificateTemplateItem | null>(null);
  const [positions, setPositions] = useState<{
    name: { x: number; y: number; fontSize: number; color: string };
    role: { x: number; y: number; fontSize: number; color: string };
    program_name: { x: number; y: number; fontSize: number; color: string };
    date: { x: number; y: number; fontSize: number; color: string };
    cert_number: { x: number; y: number; fontSize: number; color: string };
    signature: { x: number; y: number; width: number };
    qr_code: { x: number; y: number; width: number };
  }>({
    name: { x: 50, y: 40, fontSize: 28, color: '#ffffff' },
    role: { x: 50, y: 48, fontSize: 18, color: '#00d47e' },
    program_name: { x: 50, y: 56, fontSize: 22, color: '#ffffff' },
    date: { x: 20, y: 80, fontSize: 12, color: '#aaaaaa' },
    cert_number: { x: 80, y: 80, fontSize: 12, color: '#aaaaaa' },
    signature: { x: 75, y: 68, width: 120 },
    qr_code: { x: 20, y: 68, width: 80 }
  });

  // Individual Issue form
  const [selectedUserUuid, setSelectedUserUuid] = useState("");
  const [certTitle, setCertTitle] = useState("Best Volunteer Award 2026");
  const [certRole, setCertRole] = useState("Lead Coordinator");
  const [individualTemplateId, setIndividualTemplateId] = useState("");

  // Program Issue form
  const [selectedActivityId, setSelectedActivityId] = useState("");
  const [programCertTitle, setProgramCertTitle] = useState("");

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      if (!token) return;
      const [tmpls, acts, vols] = await Promise.all([
        getCertificateTemplates(token),
        getActivities(),
        getVolunteersFiltered({}, token)
      ]);
      setTemplates(tmpls);
      setActivities(acts);
      setVolunteers(vols);

      if (tmpls.length > 0) {
        setSelectedTemplate(tmpls[0]);
        if (tmpls[0].custom_positions && Object.keys(tmpls[0].custom_positions).length > 0) {
          setPositions(prev => ({ ...prev, ...tmpls[0].custom_positions }));
        }
      }
    }
    load();
  }, [token]);

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setIsSubmitting(true);
    setMessage(null);

    try {
      const created = await createCertificateTemplate(
        {
          name: templateName,
          background_image_url: tmplBg || null,
          logo_image_url: tmplLogo || null,
          signature_image_url: tmplSig || null,
          custom_positions: positions
        },
        token
      );
      setTemplates(prev => [...prev, created]);
      setSelectedTemplate(created);
      setTemplateName("");
      setMessage({ type: 'success', text: "Template created successfully!" });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || "Failed to create template." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSavePositions = async () => {
    if (!selectedTemplate || !token) return;
    setIsSubmitting(true);
    try {
      const updated = await updateTemplatePositions(selectedTemplate.public_id, positions, token);
      setTemplates(prev => prev.map(t => t.public_id === updated.public_id ? updated : t));
      setMessage({ type: 'success', text: "Custom positions saved successfully!" });
    } catch (err: any) {
      setMessage({ type: 'error', text: "Failed to save positions." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleIssueIndividual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserUuid || !token) return;
    setIsSubmitting(true);
    setMessage(null);

    try {
      await issueIndividualCertificate(
        {
          user_id: selectedUserUuid,
          template_id: individualTemplateId || undefined,
          title: certTitle,
          role: certRole
        },
        token
      );
      setMessage({ type: 'success', text: `Certificate successfully issued!` });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || "Failed to issue certificate." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleIssueProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedActivityId || !token) return;
    setIsSubmitting(true);
    setMessage(null);

    try {
      const res = await issueProgramCertificates(
        {
          activity_id: selectedActivityId,
          custom_title: programCertTitle || undefined
        },
        token
      );
      setMessage({ type: 'success', text: res.message });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || "Failed to generate program certificates." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-10 max-w-7xl">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Certificate Management System
          </h1>
          <p className="text-oasis-muted text-sm mt-1">
            Customizable drag-and-position layout builder, individual award issuing, and bulk program generator.
          </p>
        </div>
      </div>

      {/* Tabs Header */}
      <div className="flex items-center gap-3 mb-8 border-b border-foreground/10 pb-4">
        <button
          onClick={() => setActiveTab('templates')}
          className={`px-5 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all ${
            activeTab === 'templates'
              ? 'bg-oasis-emerald text-black shadow-md'
              : 'bg-foreground/5 text-foreground/70 hover:bg-foreground/10'
          }`}
        >
          1. Template Position Studio
        </button>
        <button
          onClick={() => setActiveTab('individual')}
          className={`px-5 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all ${
            activeTab === 'individual'
              ? 'bg-oasis-emerald text-black shadow-md'
              : 'bg-foreground/5 text-foreground/70 hover:bg-foreground/10'
          }`}
        >
          2. Issue Individual Award (Type 1)
        </button>
        <button
          onClick={() => setActiveTab('program')}
          className={`px-5 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all ${
            activeTab === 'program'
              ? 'bg-oasis-emerald text-black shadow-md'
              : 'bg-foreground/5 text-foreground/70 hover:bg-foreground/10'
          }`}
        >
          3. Issue Program Certificates (Type 2)
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-2xl mb-6 text-xs font-bold border ${
          message.type === 'success' ? 'bg-oasis-emerald/20 text-oasis-emerald border-oasis-emerald/40' : 'bg-red-500/20 text-red-400 border-red-500/40'
        }`}>
          {message.text}
        </div>
      )}

      {/* TAB 1: TEMPLATE POSITION STUDIO */}
      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Controls Column */}
          <div className="lg:col-span-5 space-y-6">
            {/* Create Template Box */}
            <form onSubmit={handleCreateTemplate} className="glass-card rounded-3xl p-6 border border-foreground/10 space-y-4">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Plus className="text-oasis-emerald" size={18} /> Add New Template
              </h3>
              <div>
                <label className="text-xs font-bold uppercase text-foreground/70">Template Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Oasis Appreciation Award"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="w-full mt-1 bg-foreground/5 border border-foreground/10 rounded-xl p-3 text-xs text-foreground focus:outline-none focus:border-oasis-emerald/50"
                />
              </div>
              <Button type="submit" disabled={isSubmitting} className="w-full bg-oasis-emerald text-black font-bold py-2.5 rounded-xl text-xs">
                Create Template
              </Button>
            </form>

            {/* Position Adjusters */}
            <div className="glass-card rounded-3xl p-6 border border-foreground/10 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-foreground">Custom Position Editor</h3>
                <Button onClick={handleSavePositions} disabled={isSubmitting} className="bg-oasis-emerald text-black font-bold text-xs rounded-xl px-4 py-2">
                  Save Positions
                </Button>
              </div>

              {/* Slider Position Controls */}
              <div className="space-y-4 text-xs">
                <div>
                  <div className="flex justify-between text-foreground/70 mb-1">
                    <span>Name Vertical Position (Y: {positions.name.y}%)</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="90"
                    value={positions.name.y}
                    onChange={(e) => setPositions(prev => ({ ...prev, name: { ...prev.name, y: Number(e.target.value) } }))}
                    className="w-full accent-oasis-emerald"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-foreground/70 mb-1">
                    <span>Role / Position Vertical Position (Y: {positions.role.y}%)</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="90"
                    value={positions.role.y}
                    onChange={(e) => setPositions(prev => ({ ...prev, role: { ...prev.role, y: Number(e.target.value) } }))}
                    className="w-full accent-oasis-emerald"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-foreground/70 mb-1">
                    <span>Program Name Vertical Position (Y: {positions.program_name.y}%)</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="90"
                    value={positions.program_name.y}
                    onChange={(e) => setPositions(prev => ({ ...prev, program_name: { ...prev.program_name, y: Number(e.target.value) } }))}
                    className="w-full accent-oasis-emerald"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Live Canvas Preview */}
          <div className="lg:col-span-7">
            <div className="sticky top-28">
              <h3 className="text-sm font-bold text-foreground/70 uppercase tracking-wider mb-3">Live Template Preview Canvas</h3>
              <div className="w-full aspect-[1.414/1] bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#0f0f23] rounded-3xl border-2 border-oasis-emerald/40 p-6 relative overflow-hidden shadow-2xl text-white">
                
                {/* Dynamic Text Elements */}
                <div
                  style={{ top: `${positions.name.y}%`, left: `${positions.name.x}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 text-center w-full px-4"
                >
                  <h2 style={{ fontSize: `${positions.name.fontSize}px`, color: positions.name.color }} className="font-bold tracking-wide">
                    Recipient Full Name
                  </h2>
                </div>

                <div
                  style={{ top: `${positions.role.y}%`, left: `${positions.role.x}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 text-center w-full px-4"
                >
                  <p style={{ fontSize: `${positions.role.fontSize}px`, color: positions.role.color }} className="font-semibold uppercase tracking-wider">
                    Volunteer / Coordinator Role
                  </p>
                </div>

                <div
                  style={{ top: `${positions.program_name.y}%`, left: `${positions.program_name.x}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 text-center w-full px-4"
                >
                  <p style={{ fontSize: `${positions.program_name.fontSize}px`, color: positions.program_name.color }} className="font-medium">
                    Oasis Leadership & Excellence Program
                  </p>
                </div>

                <div
                  style={{ top: `${positions.date.y}%`, left: `${positions.date.x}%` }}
                  className="absolute -translate-y-1/2 font-mono text-xs text-white/50"
                >
                  Date: {new Date().toLocaleDateString()}
                </div>

                <div
                  style={{ top: `${positions.cert_number.y}%`, left: `${positions.cert_number.x}%` }}
                  className="absolute -translate-x-full -translate-y-1/2 font-mono text-xs text-oasis-emerald font-bold"
                >
                  CERT-OASIS-2026-1001
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: INDIVIDUAL CERTIFICATES */}
      {activeTab === 'individual' && (
        <form onSubmit={handleIssueIndividual} className="glass-card rounded-3xl p-8 border border-foreground/10 max-w-2xl mx-auto space-y-5">
          <h3 className="text-xl font-bold text-foreground mb-4">Issue Individual Certificate (Type 1)</h3>

          <div>
            <label className="text-xs font-bold uppercase text-foreground/70">Select Volunteer / Member *</label>
            <select
              required
              value={selectedUserUuid}
              onChange={(e) => setSelectedUserUuid(e.target.value)}
              className="w-full mt-1 bg-foreground/5 border border-foreground/10 rounded-xl p-3 text-xs text-foreground focus:outline-none focus:border-oasis-emerald/50"
            >
              <option value="" className="bg-oasis-bgSecondary">-- Select Person --</option>
              {volunteers.map(v => (
                <option key={v.public_id} value={v.public_id} className="bg-oasis-bgSecondary">
                  {v.full_name} ({v.registration_number || v.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold uppercase text-foreground/70">Certificate Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Best Volunteer Award 2026 / Appreciation Certificate"
              value={certTitle}
              onChange={(e) => setCertTitle(e.target.value)}
              className="w-full mt-1 bg-foreground/5 border border-foreground/10 rounded-xl p-3 text-xs text-foreground focus:outline-none focus:border-oasis-emerald/50"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase text-foreground/70">Role / Award Subtitle</label>
            <input
              type="text"
              placeholder="e.g. Lead Coordinator / Research Volunteer"
              value={certRole}
              onChange={(e) => setCertRole(e.target.value)}
              className="w-full mt-1 bg-foreground/5 border border-foreground/10 rounded-xl p-3 text-xs text-foreground focus:outline-none focus:border-oasis-emerald/50"
            />
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full bg-oasis-emerald text-black font-bold py-3 rounded-xl shadow-lg mt-4">
            {isSubmitting ? "Issuing..." : "Issue Individual Certificate"}
          </Button>
        </form>
      )}

      {/* TAB 3: PROGRAM CERTIFICATES */}
      {activeTab === 'program' && (
        <form onSubmit={handleIssueProgram} className="glass-card rounded-3xl p-8 border border-foreground/10 max-w-2xl mx-auto space-y-5">
          <h3 className="text-xl font-bold text-foreground mb-4">Bulk Program Certificates Generator (Type 2)</h3>
          <p className="text-xs text-oasis-muted mb-4">
            Automatically generates and distributes certificates to all accepted participants of the selected program/activity.
          </p>

          <div>
            <label className="text-xs font-bold uppercase text-foreground/70">Select Program / Activity *</label>
            <select
              required
              value={selectedActivityId}
              onChange={(e) => setSelectedActivityId(e.target.value)}
              className="w-full mt-1 bg-foreground/5 border border-foreground/10 rounded-xl p-3 text-xs text-foreground focus:outline-none focus:border-oasis-emerald/50"
            >
              <option value="" className="bg-oasis-bgSecondary">-- Select Activity --</option>
              {activities.map(a => (
                <option key={a.public_id} value={a.public_id} className="bg-oasis-bgSecondary">
                  {a.title} ({a.category})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold uppercase text-foreground/70">Custom Certificate Title (Optional)</label>
            <input
              type="text"
              placeholder="Defaults to: Certificate of Completion: [Activity Name]"
              value={programCertTitle}
              onChange={(e) => setProgramCertTitle(e.target.value)}
              className="w-full mt-1 bg-foreground/5 border border-foreground/10 rounded-xl p-3 text-xs text-foreground focus:outline-none focus:border-oasis-emerald/50"
            />
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full bg-oasis-emerald text-black font-bold py-3 rounded-xl shadow-lg mt-4">
            {isSubmitting ? "Generating Certificates..." : "Generate Bulk Program Certificates"}
          </Button>
        </form>
      )}
    </div>
  );
}
