import React from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { getApiBase } from "@/lib/apiBase";
import { Certificate } from "@/components/Certificate";
import { Loader2, ShieldCheck, AlertCircle, Home, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function CertificateVerification() {
  const { id } = useParams();

  const { data: cert, isLoading, error } = useQuery({
    queryKey: ["certificate", id],
    queryFn: async () => {
      const res = await fetch(`${getApiBase()}/api/certificates/${id}`);
      if (!res.ok) throw new Error("Certificate not found");
      return res.json();
    },
    enabled: !!id,
  });

  const { data: curriculumData, isLoading: modulesLoading } = useQuery({
    queryKey: ["curriculum", id],
    queryFn: async () => {
      const res = await fetch(`${getApiBase()}/api/certificates/${id}/curriculum`);
      if (!res.ok) throw new Error("Failed to load curriculum");
      return res.json();
    },
    enabled: !!cert,
  });

  const handleDownload = async () => {
    const printContent = document.getElementById("certificate-print-area");
    if (!printContent) return;

    try {
      // Temporarily revert the scale to get actual pixel dimensions rather than minified viewport width sizes on mobile
      const oldTransform = printContent.parentElement ? printContent.parentElement.style.transform : '';
      if (printContent.parentElement && oldTransform.includes("scale")) {
          printContent.parentElement.style.transform = "scale(1)";
      }

      const canvas = await html2canvas(printContent, {
        scale: 2, 
        useCORS: true,
        logging: false,
        backgroundColor: '#e9e4d1',
        windowWidth: 1122,
        windowHeight: 793,
        width: 1122,
        height: 793
      });

      if (printContent.parentElement && oldTransform) {
          printContent.parentElement.style.transform = oldTransform;
      }

      const imgData = canvas.toDataURL('image/jpeg', 1.0);

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`KSOSHTC_Certificate_${cert.certificateId}.pdf`);

    } catch (err) {
      console.error("Failed to generate PDF", err);
      // Fallback in case of module failure during build
      alert("Generating PDF, if nothing happened, please ensure it finished loading.");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#FCFAF6]">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="font-mono text-xs uppercase tracking-widest text-ink/70">Verifying credential records...</p>
      </div>
    );
  }

  if (error || !cert) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#FCFAF6] text-center font-sans">
        <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mb-6 border border-red-100">
          <AlertCircle className="h-8 w-8" />
        </div>
        <div className="font-mono text-xs uppercase tracking-widest text-red-600 mb-2">// Verification Failed</div>
        <h1 className="font-display text-3xl sm:text-4xl font-normal text-ink mb-3">Invalid Certificate ID</h1>
        <p className="text-base text-ink/70 max-w-md mb-8 font-light">
          The certificate ID provided could not be verified in our institutional records. Please contact KSOSHTC for registry assistance.
        </p>
        <Link to="/">
          <Button variant="outline" className="rounded-full px-6 py-2.5 font-medium border-black/15 bg-white text-ink hover:bg-black/5">
            <Home className="mr-2 h-4 w-4" /> Back to Home
          </Button>
        </Link>
      </div>
    );
  }

  // Dynamically enforce that Program Score strictly refers to actual course details scores
  let displayHours = Number(cert.totalHours) || 120;
  let displayScore = Number(cert.averageScore) || 90;
  let displayGpa = cert.gpa || "3.60";

  if (cert.transcript && cert.transcript.length > 0) {
    let tHrs = 0;
    let tScorePoints = 0;
    let tGpaPoints = 0;

    cert.transcript.forEach((item: any) => {
      const h = Number(item.hours) || 0;
      const sSrc = item.score;
      if (sSrc !== "" && sSrc !== null && sSrc !== undefined) {
        const s = Number(sSrc);
        tHrs += h;
        tScorePoints += (s * h);
        let gp = (s / 100) * 4.0;
        tGpaPoints += (gp * h);
      }
    });

    if (tHrs > 0) {
      displayHours = tHrs;
      displayScore = Math.round(tScorePoints / tHrs);
      displayGpa = (tGpaPoints / tHrs).toFixed(2);
    }
  }

  return (
    <div className="min-h-screen bg-[#FCFAF6] text-ink pb-20 overflow-x-hidden font-sans antialiased">
      {/* Top Editorial Banner */}
      <div className="bg-[#121815] text-bone py-12 px-4 border-b border-white/10 mb-12">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5 text-center md:text-left flex-1">
            <div className="w-16 h-16 rounded-2xl bg-accent/15 border border-accent/30 text-accent flex items-center justify-center shrink-0">
               <ShieldCheck className="h-8 w-8" />
            </div>
            <div>
              <div className="font-mono text-[11px] text-brass uppercase tracking-widest mb-1">
                // INSTITUTIONAL VERIFICATION RECORD
              </div>
              <h1 className="font-display text-3xl sm:text-4xl font-light text-bone tracking-tight">
                Certificate <span className="font-serif italic text-accent font-normal">Verified</span>
              </h1>
              <p className="text-bone/70 text-sm font-light mt-0.5">
                Authentic credential issued by Kigali Safety OSH Training Center (KSOSHTC) · RTB Accredited
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleDownload}
              className="bg-accent text-[#121815] hover:bg-accent-light font-semibold text-xs tracking-wide uppercase px-6 py-5 rounded-full shadow-lg hover:shadow-xl transition-all"
            >
              <Download className="mr-2 h-4 w-4" /> Download PDF
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-[1240px] mx-auto p-4 flex flex-col items-center w-full">
        {/* Responsive Certificate Container */}
        <div className="w-full flex justify-center overflow-hidden mb-8">
           <div style={{ 
             width: '1122px', 
             height: '793px',
             transformOrigin: 'top center',
           }} className="transform scale-[0.3] sm:scale-[0.5] md:scale-[0.7] lg:scale-100 transition-transform duration-300">
              <div className="bg-white rounded-xl shadow-2xl border border-black/10 overflow-hidden">
                <Certificate data={cert} />
              </div>
           </div>
        </div>

        {/* Height adjustment to pull content up */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media (max-width: 639px) { .responsive-cert-spacer { margin-top: -540px; } }
          @media (min-width: 640px) and (max-width: 767px) { .responsive-cert-spacer { margin-top: -380px; } }
          @media (min-width: 768px) and (max-width: 1023px) { .responsive-cert-spacer { margin-top: -220px; } }
          @media (min-width: 1024px) { .responsive-cert-spacer { margin-top: 0px; } }
        `}} />
        
        <div className="responsive-cert-spacer w-full h-1" />

        <div className="w-full max-w-5xl bg-white shadow-xl rounded-[28px] border border-black/[0.08] p-8 sm:p-14 mb-12">
          {/* Transcript Header */}
          <div className="flex flex-col items-center justify-center text-center border-b border-black/[0.08] pb-8 mb-8 gap-3">
            <img src="/logo.webp" alt="KSOSHTC Logo" className="h-20 sm:h-24 w-auto object-contain mx-auto" />
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-normal text-ink tracking-tight uppercase">
                Kigali Safety OSH Training Center
              </h2>
              <p className="font-mono text-[10px] sm:text-xs text-brass uppercase tracking-[0.25em] mt-1 font-semibold">
                Occupational Safety &amp; Health Training · RTB Accredited
              </p>
            </div>
            <div className="mt-4 border-t border-black/[0.06] pt-4 w-full max-w-md mx-auto">
              <h1 className="font-display text-xl sm:text-2xl font-light text-ink uppercase tracking-wider">
                Official Student Transcript
              </h1>
            </div>
          </div>

          {/* Student Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="space-y-4">
              <div>
                <Label className="font-mono text-[10px] font-bold text-brass uppercase tracking-widest block mb-1">
                  Student Name
                </Label>
                <div className="font-display text-2xl font-normal text-ink uppercase tracking-tight">
                  {cert.learnerName}
                </div>
              </div>
              <p className="text-sm text-ink/70 leading-relaxed font-light">
                {cert.learnerName} has successfully completed the required professional development certificate programs and courses listed below. These accomplishments demonstrate continued academic excellence and a commitment to occupational safety and health.
              </p>
            </div>
            <div className="border-t md:border-t-0 md:border-l border-black/[0.08] pt-6 md:pt-0 md:pl-8 space-y-3.5">
              <div className="flex justify-between items-center border-b border-black/[0.04] pb-2">
                <span className="font-mono text-[10px] uppercase tracking-wider text-ink/60">Certificate / Student ID</span>
                <span className="font-mono font-bold text-ink text-sm">{cert.certificateId}</span>
              </div>
              <div className="flex justify-between items-center border-b border-black/[0.04] pb-2">
                <span className="font-mono text-[10px] uppercase tracking-wider text-ink/60">Enrollment Date</span>
                <span className="font-medium text-ink text-sm">{format(new Date(cert.createdAt || cert.dateIssued), "MM/dd/yyyy")}</span>
              </div>
              <div className="flex justify-between items-center border-b border-black/[0.04] pb-2">
                <span className="font-mono text-[10px] uppercase tracking-wider text-ink/60">Location of Issue</span>
                <span className="font-medium text-ink text-sm">{cert.issueLocation || "KICUKIRO-KIGALI"}</span>
              </div>
              {cert.startDate && (
                <div className="flex justify-between items-center border-b border-black/[0.04] pb-2">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-ink/60">Program Start</span>
                  <span className="font-medium text-ink text-sm">{format(new Date(cert.startDate), "MM/dd/yyyy")}</span>
                </div>
              )}
              {cert.completionDate && (
                <div className="flex justify-between items-center border-b border-black/[0.04] pb-2">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-ink/60">Program Completion</span>
                  <span className="font-medium text-ink text-sm">{format(new Date(cert.completionDate), "MM/dd/yyyy")}</span>
                </div>
              )}
            </div>
          </div>

          {/* Main Programs Table */}
          <div className="mb-12">
            <div className="font-mono text-xs uppercase tracking-widest text-brass mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent" />
              PROFESSIONAL CERTIFICATE PROGRAM
            </div>
            <div className="overflow-x-auto border border-black/[0.08] rounded-xl">
              <table className="w-full text-left whitespace-nowrap min-w-max">
                <thead>
                  <tr className="bg-bone text-[10px] font-mono text-ink/70 uppercase tracking-widest border-b border-black/[0.08]">
                    <th className="py-3 px-4">Program Title</th>
                    <th className="py-3 px-4 text-center">Hours</th>
                    <th className="py-3 px-4 text-center">Score (%)</th>
                    <th className="py-3 px-4 text-center">GPA</th>
                    <th className="py-3 px-4 text-right">Issue Date</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  <tr className="border-b border-black/[0.04] font-medium text-ink">
                    <td className="py-3.5 px-4 font-semibold text-ink">{cert.courses}</td>
                    <td className="py-3.5 px-4 text-center font-mono">{displayHours}</td>
                    <td className="py-3.5 px-4 text-center font-mono">{displayScore}%</td>
                    <td className="py-3.5 px-4 text-center font-mono">{displayGpa}</td>
                    <td className="py-3.5 px-4 text-right font-mono text-ink/70">{format(new Date(cert.dateIssued), "MM/dd/yyyy")}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Individual Courses Table */}
          <div>
            <div className="font-mono text-xs uppercase tracking-widest text-brass mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent" />
              DETAILED COURSEWORK &amp; MODULE PERFORMANCE
            </div>
            <div className="overflow-x-auto border border-black/[0.08] rounded-xl">
              <table className="w-full text-left whitespace-nowrap min-w-max">
                <thead>
                  <tr className="bg-bone text-[10px] font-mono text-ink/70 uppercase tracking-widest border-b border-black/[0.08]">
                    <th className="py-3 px-4">Course Title</th>
                    <th className="py-3 px-4 text-center">Score (%)</th>
                    <th className="py-3 px-4 text-center">Issue Date</th>
                    <th className="py-3 px-4 text-center">Hours</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {cert.transcript && cert.transcript.length > 0 ? (
                    cert.transcript.map((item: any, idx: number) => (
                      <tr key={idx} className={`border-b border-black/[0.04] ${idx % 2 === 0 ? 'bg-white' : 'bg-bone/40'}`}>
                        <td className="py-3 px-4 font-medium text-ink">{item.title}</td>
                        <td className="py-3 px-4 text-center font-mono font-semibold text-ink">{item.score}%</td>
                        <td className="py-3 px-4 text-center text-ink/60 font-mono text-xs">
                          {format(new Date(item.date || cert.dateIssued), "MM/dd/yyyy")}
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-ink/80">{item.hours} hrs</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-ink/50 italic font-light">No detailed course breakdown available.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="mt-16 text-center border-t border-black/[0.08] pt-8">
            <p className="font-mono text-[10px] text-ink/40 uppercase tracking-[0.4em]">
              Kigali Safety OSH Training Center · Official Verification Document · Accredited by RTB
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
