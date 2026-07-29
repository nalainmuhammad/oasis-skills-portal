"use client";

import { useState } from "react";
import { Download } from "lucide-react";
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

  const handleDownload = async () => {
    setIsDownloading(true);
    
    try {
      // 1. Create an off-screen container for the certificate
      const container = document.createElement("div");
      container.style.position = "fixed";
      container.style.top = "-9999px";
      container.style.left = "-9999px";
      
      // Load fonts manually for html2canvas
      const style = document.createElement('style');
      style.innerHTML = `
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700&family=Inter:wght@400;500;600&display=swap');
      `;
      container.appendChild(style);

      // Certificate HTML (matching the exact backend design)
      const certHtml = `
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
            font-family: 'Inter', sans-serif;
            overflow: hidden;
        ">
            <!-- Corners -->
            <div style="position: absolute; width: 80px; height: 80px; border: 4px solid #ffc641; opacity: 0.8; top: 20px; left: 20px; border-right: none; border-bottom: none;"></div>
            <div style="position: absolute; width: 80px; height: 80px; border: 4px solid #ffc641; opacity: 0.8; top: 20px; right: 20px; border-left: none; border-bottom: none;"></div>
            <div style="position: absolute; width: 80px; height: 80px; border: 4px solid #ffc641; opacity: 0.8; bottom: 20px; left: 20px; border-right: none; border-top: none;"></div>
            <div style="position: absolute; width: 80px; height: 80px; border: 4px solid #ffc641; opacity: 0.8; bottom: 20px; right: 20px; border-left: none; border-top: none;"></div>

            <div style="margin-top: 30px;">
                <div style="font-family: 'Cinzel', serif; font-size: 32px; color: #00d47e; font-weight: 700; letter-spacing: 2px; margin-bottom: 20px;">
                    OASIS <span style="color: #ffc641;">FOUNDATION</span>
                </div>
                <h1 style="font-family: 'Cinzel', serif; font-size: 56px; color: #ffc641; margin: 0; letter-spacing: 4px; text-transform: uppercase;">Certificate</h1>
                <div style="font-size: 18px; color: #8b949e; margin-top: 10px; text-transform: uppercase; letter-spacing: 2px;">Of Achievement</div>
            </div>

            <div style="margin-top: 60px;">
                <div style="font-size: 16px; color: #8b949e; margin-bottom: 10px;">This is proudly presented to</div>
                <h2 style="font-family: 'Cinzel', serif; font-size: 48px; color: #e6edf3; margin: 0; border-bottom: 1px solid rgba(255, 198, 65, 0.5); display: inline-block; padding: 0 40px 10px 40px;">
                    ${recipientName}
                </h2>
                
                <div style="font-size: 16px; color: #8b949e; margin-top: 30px; margin-bottom: 10px;">For successfully completing the course</div>
                <h3 style="font-size: 32px; font-weight: 600; color: #00d47e; margin: 0;">${courseTitle}</h3>
            </div>

            <div style="position: absolute; bottom: 60px; left: 80px; right: 80px; display: flex; justify-content: space-between; align-items: flex-end;">
                <div style="text-align: center; width: 250px;">
                    <div style="border-bottom: 1px solid rgba(255, 198, 65, 0.5); margin-bottom: 10px; font-size: 18px; padding-bottom: 5px;">${new Date(issuedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
                    <div style="font-size: 14px; color: #8b949e; text-transform: uppercase; letter-spacing: 1px;">Date Issued</div>
                </div>

                <div style="width: 120px; height: 120px; border: 4px dashed #ffc641; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-family: 'Cinzel', serif; font-size: 14px; color: #ffc641; text-align: center; background: rgba(255, 198, 65, 0.05); transform: rotate(-15deg);">
                    OASIS<br>OFFICIAL<br>VERIFIED
                </div>

                <div style="text-align: center; width: 250px;">
                    <div style="border-bottom: 1px solid rgba(255, 198, 65, 0.5); margin-bottom: 10px; font-size: 18px; padding-bottom: 5px; font-family: 'Cinzel', serif; color: #00d47e; font-style: italic;">Oasis Admin</div>
                    <div style="font-size: 14px; color: #8b949e; text-transform: uppercase; letter-spacing: 1px;">Lead Instructor</div>
                </div>
            </div>

            <div style="position: absolute; bottom: 20px; width: 100%; left: 0; text-align: center; font-size: 12px; color: #484f58; font-family: monospace;">
                Credential ID: ${verificationUuid} | Verify at: ${hostUrl}/verify
            </div>
        </div>
      `;
      container.innerHTML += certHtml;
      document.body.appendChild(container);

      // Wait a moment for fonts to render
      await new Promise(resolve => setTimeout(resolve, 500));

      const element = document.getElementById("cert-to-print");
      if (!element) return;

      const canvas = await html2canvas(element, {
        scale: 2, // High resolution
        backgroundColor: '#0d1117',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      
      // A4 is 297x210 mm, landscape
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      
      // Calculate aspect ratio fit for A4
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = (pdfHeight - imgHeight * ratio) / 2;

      pdf.addImage(imgData, 'JPEG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      
      // Include real clickable link in the PDF metadata/annotations
      pdf.link(imgX, imgY + (imgHeight * ratio) - 15, imgWidth * ratio, 10, { url: `${hostUrl}/verify/${verificationUuid}` });

      pdf.save(`Oasis_Certificate_${courseTitle.replace(/\s+/g, '_')}.pdf`);
      
      // Cleanup
      document.body.removeChild(container);
    } catch (error) {
      console.error("PDF generation failed:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <button 
      onClick={handleDownload}
      disabled={isDownloading}
      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-oasis-gold/10 text-oasis-gold hover:bg-oasis-gold/20 transition-colors font-medium text-sm disabled:opacity-50"
    >
      <Download size={16} /> {isDownloading ? "Generating..." : "Download PDF"}
    </button>
  );
}
