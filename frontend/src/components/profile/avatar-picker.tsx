"use client";

import { useState, useRef } from "react";
import { X, Upload, Image as ImageIcon, Save, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AVATAR_ICONS, AvatarIconId } from "./avatar-icons";

interface AvatarPickerProps {
  currentType: string;
  currentIcon: string;
  currentUrl: string | null;
  onClose: () => void;
  onSaveIcon: (iconId: string) => Promise<void>;
  onSaveUpload: (file: File) => Promise<void>;
}

export function AvatarPicker({
  currentType,
  currentIcon,
  currentUrl,
  onClose,
  onSaveIcon,
  onSaveUpload
}: AvatarPickerProps) {
  const [activeTab, setActiveTab] = useState<'icon' | 'upload'>('icon');
  const [selectedIcon, setSelectedIcon] = useState<string>(currentType === 'icon' ? currentIcon : 'default');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError("");
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("File is too large. Maximum size is 5MB.");
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError("Please select a valid image file.");
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError("");
    
    try {
      if (activeTab === 'icon') {
        await onSaveIcon(selectedIcon);
      } else if (activeTab === 'upload' && selectedFile) {
        await onSaveUpload(selectedFile);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to update avatar. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-oasis-bgSecondary border border-foreground/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-foreground/10">
          <h2 className="text-xl font-display font-bold text-foreground">Choose Avatar</h2>
          <button 
            onClick={onClose}
            className="p-2 text-foreground/50 hover:text-foreground hover:bg-foreground/5 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-foreground/10">
          <button
            onClick={() => setActiveTab('icon')}
            className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'icon' 
                ? 'border-oasis-emerald text-oasis-emerald' 
                : 'border-transparent text-foreground/60 hover:text-foreground hover:bg-foreground/5'
            }`}
          >
            <ImageIcon size={16} className="inline mr-2" /> Preset Icons
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'upload' 
                ? 'border-oasis-emerald text-oasis-emerald' 
                : 'border-transparent text-foreground/60 hover:text-foreground hover:bg-foreground/5'
            }`}
          >
            <Upload size={16} className="inline mr-2" /> Upload Photo
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm mb-4">
              {error}
            </div>
          )}

          {activeTab === 'icon' ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
              {AVATAR_ICONS.map((icon) => (
                <button
                  key={icon.id}
                  onClick={() => setSelectedIcon(icon.id)}
                  className={`relative flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                    selectedIcon === icon.id
                      ? 'border-oasis-emerald bg-oasis-emerald/5'
                      : 'border-foreground/5 bg-foreground/5 hover:border-foreground/20 hover:bg-foreground/10'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    selectedIcon === icon.id ? 'text-oasis-emerald' : 'text-foreground/70'
                  }`}>
                    {icon.svg}
                  </div>
                  <span className="text-xs font-medium text-foreground/70">{icon.name}</span>
                  
                  {selectedIcon === icon.id && (
                    <div className="absolute -top-2 -right-2 w-5 h-5 bg-oasis-emerald text-black rounded-full flex items-center justify-center shadow-lg">
                      <Check size={12} strokeWidth={3} />
                    </div>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-4">
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden" 
              />
              
              <div className="w-32 h-32 rounded-full bg-foreground/5 border-2 border-dashed border-foreground/20 flex items-center justify-center overflow-hidden mb-6 relative group">
                {previewUrl || (currentType === 'upload' && currentUrl) ? (
                  <>
                    <img 
                      src={previewUrl || currentUrl!} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Upload size={24} className="text-white" />
                    </div>
                  </>
                ) : (
                  <div className="text-foreground/40 flex flex-col items-center">
                    <Upload size={24} className="mb-2" />
                    <span className="text-xs font-medium uppercase tracking-wider">No Photo</span>
                  </div>
                )}
                
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 w-full h-full cursor-pointer z-10 opacity-0"
                  aria-label="Upload photo"
                />
              </div>

              <div className="text-center max-w-sm">
                <Button 
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="mb-3 border-foreground/20 hover:bg-foreground/10"
                >
                  Choose a file
                </Button>
                <p className="text-xs text-foreground/40">
                  JPEG, PNG, WebP or GIF. Maximum file size 5MB.<br/>
                  Square images work best.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-foreground/10 flex justify-end gap-3 bg-foreground/5">
          <Button 
            onClick={onClose} 
            variant="ghost" 
            className="hover:bg-foreground/10"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={
              isSubmitting || 
              (activeTab === 'upload' && !selectedFile && currentType !== 'upload')
            }
            className="bg-oasis-emerald hover:bg-oasis-emeraldLight text-black font-semibold shadow-[0_0_15px_rgba(0,212,126,0.2)]"
          >
            {isSubmitting ? "Saving..." : "Save Avatar"}
          </Button>
        </div>
      </div>
    </div>
  );
}
