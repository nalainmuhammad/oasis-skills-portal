"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export function PdfDownloader({ 
  verificationUuid, 
  recipientName, 
  courseTitle, 
  issuedAt,
  hostUrl
}: { 
  verificationUuid: string;
  recipientName: string;
  courseTitle: string;
  issuedAt: string;
  hostUrl: string;
}) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleDownload = async () => {
    setIsDownloading(true);
    setErrorMsg(null);
    
    let container: HTMLDivElement | null = null;
    
    try {
      // 1. Create off-screen rendering container with layout dimensions
      container = document.createElement("div");
      container.style.position = "fixed";
      container.style.left = "0";
      container.style.top = "0";
      container.style.width = "1000px";
      container.style.height = "700px";
      container.style.zIndex = "-9999";
      container.style.opacity = "0.01";
      container.style.pointerEvents = "none";
      
      const formattedDate = new Date(issuedAt).toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      });

      // Certificate HTML
      container.innerHTML = `
        <div id="cert-to-print" style="
            width: 1000px;
            height: 700px;
            background: linear-gradient(145deg, #161b22, #0d1117);
            border: 4px solid #ffc641;
            position: relative;
            padding: 40px;
            box-sizing: border-box;
            text-align: center;
            color: #e6edf3;
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            overflow: hidden;
        ">
            <!-- Corners -->
            <div style="position: absolute; width: 80px; height: 80px; border: 4px solid #ffc641; opacity: 0.8; top: 20px; left: 20px; border-right: none; border-bottom: none;"></div>
            <div style="position: absolute; width: 80px; height: 80px; border: 4px solid #ffc641; opacity: 0.8; top: 20px; right: 20px; border-left: none; border-bottom: none;"></div>
            <div style="position: absolute; width: 80px; height: 80px; border: 4px solid #ffc641; opacity: 0.8; bottom: 20px; left: 20px; border-right: none; border-top: none;"></div>
            <div style="position: absolute; width: 80px; height: 80px; border: 4px solid #ffc641; opacity: 0.8; bottom: 20px; right: 20px; border-left: none; border-top: none;"></div>

            <div style="margin-top: 30px;">
                <div style="font-size: 32px; color: #00d47e; font-weight: 700; letter-spacing: 2px; margin-bottom: 20px;">
                    OASIS <span style="color: #ffc641;">FOUNDATION</span>
                </div>
                <h1 style="font-size: 56px; color: #ffc641; margin: 0; letter-spacing: 4px; text-transform: uppercase; font-weight: 800;">Certificate</h1>
                <div style="font-size: 18px; color: #8b949e; margin-top: 10px; text-transform: uppercase; letter-spacing: 2px;">Of Achievement</div>
            </div>

            <div style="margin-top: 50px;">
                <div style="font-size: 16px; color: #8b949e; margin-bottom: 10px;">This is proudly presented to</div>
                <h2 style="font-size: 44px; color: #e6edf3; margin: 0; border-bottom: 2px solid rgba(255, 198, 65, 0.5); display: inline-block; padding: 0 40px 10px 40px; font-weight: 700;">
                    ${recipientName}
                </h2>
                
                <div style="font-size: 16px; color: #8b949e; margin-top: 25px; margin-bottom: 10px;">For successfully completing the course</div>
                <h3 style="font-size: 30px; font-weight: 600; color: #00d47e; margin: 0;">${courseTitle}</h3>
            </div>

            <div style="position: absolute; bottom: 60px; left: 80px; right: 80px; display: flex; justify-content: space-between; align-items: flex-end;">
                <div style="text-align: center; width: 250px;">
                    <div style="border-bottom: 1px solid rgba(255, 198, 65, 0.5); margin-bottom: 10px; font-size: 18px; padding-bottom: 5px;">${formattedDate}</div>
                    <div style="font-size: 14px; color: #8b949e; text-transform: uppercase; letter-spacing: 1px;">Date Issued</div>
                </div>

                <div style="width: 110px; height: 110px; border: 3px dashed #ffc641; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 13px; font-weight: bold; color: #ffc641; text-align: center; background: rgba(255, 198, 65, 0.05); transform: rotate(-15deg);">
                    OASIS<br>OFFICIAL<br>VERIFIED
                </div>

                <div style="text-align: center; width: 250px;">
                    <div style="border-bottom: 1px solid rgba(255, 198, 65, 0.5); margin-bottom: 10px; font-size: 18px; padding-bottom: 5px; color: #00d47e; font-style: italic; font-weight: 600;">Oasis Admin</div>
                    <div style="font-size: 14px; color: #8b949e; text-transform: uppercase; letter-spacing: 1px;">Lead Instructor</div>
                </div>
            </div>

            <div style="position: absolute; bottom: 20px; width: 100%; left: 0; text-align: center; font-size: 12px; color: #8b949e; font-family: monospace;">
                Credential ID: ${verificationUuid} | Verify at: ${hostUrl}/verify/${verificationUuid}
            </div>
        </div>
      `;

      document.body.appendChild(container);

      // Brief tick for DOM render
      await new Promise(resolve => setTimeout(resolve, 200));

      const element = document.getElementById("cert-to-print");
      if (!element) throw new Error("Certificate container failed to mount.");

      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#0d1117',
        useCORS: true,
        allowTaint: true,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = (pdfHeight - imgHeight * ratio) / 2;

      pdf.addImage(imgData, 'JPEG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.link(imgX, imgY, imgWidth * ratio, imgHeight * ratio, { url: `${hostUrl}/verify/${verificationUuid}` });

      const cleanFileName = (courseTitle || 'Certificate').replace(/[^a-zA-Z0-9]/g, '_');
      pdf.save(`Oasis_Certificate_${cleanFileName}.pdf`);
    } catch (error: any) {
      console.error("PDF generation failed:", error);
      setErrorMsg("Failed to generate PDF. Please try again or refresh.");
    } finally {
      if (container && document.body.contains(container)) {
        document.body.removeChild(container);
      }
      setIsDownloading(false);
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-xs">
      <button 
        onClick={handleDownload}
        disabled={isDownloading}
        className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-oasis-gold text-black hover:bg-oasis-gold/90 transition-all font-bold text-sm shadow-[0_0_20px_rgba(255,198,65,0.25)] hover:shadow-[0_0_25px_rgba(255,198,65,0.4)] disabled:opacity-50 cursor-pointer"
      >
        {isDownloading ? (
          <>
            <Loader2 size={18} className="animate-spin" /> Generating PDF...
          </>
        ) : (
          <>
            <Download size={18} /> Download PDF
          </>
        )}
      </button>
      {errorMsg && (
        <p className="text-xs text-red-400 mt-2 font-medium">{errorMsg}</p>
      )}
    </div>
  );
}

