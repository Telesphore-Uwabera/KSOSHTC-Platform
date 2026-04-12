import React from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getApiBase } from "@/lib/apiBase";
import { Certificate } from "@/components/Certificate";
import { Loader2, ShieldCheck, AlertCircle, Home, Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

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

  const handleDownload = () => {
    const printContent = document.getElementById("certificate-print-area");
    if (!printContent) return;

    const printArea = printContent.outerHTML;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Certificate - ${cert.learnerName}</title>
          <style>
            @media print {
              @page { size: landscape; margin: 0; }
              body { margin: 0; padding: 0; }
              #certificate-print-area { border: none !important; box-shadow: none !important; width: 1122px; height: 793px; }
            }
            body { margin: 0; display: flex; justify-content: center; align-items: flex-start; background: #fff; }
          </style>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap" rel="stylesheet">
          <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body>
          ${printArea}
          <script>
            window.onload = () => {
              window.print();
              setTimeout(() => { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#f8f9fa]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-xl font-medium text-gray-600">Verifying certificate...</p>
      </div>
    );
  }

  if (error || !cert) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-white text-center">
        <div className="bg-red-50 p-6 rounded-full mb-6">
          <AlertCircle className="h-16 w-16 text-red-500" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Invalid Certificate</h1>
        <p className="text-lg text-gray-600 max-w-md mb-8">
          The certificate ID provided could not be verified in our records. Please contact KSOHTC for assistance.
        </p>
        <Link to="/">
          <Button variant="outline" size="lg">
            <Home className="mr-2 h-5 w-5" /> Back to Home
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f3f4f6] pb-20 overflow-x-hidden">
      <div className="bg-[#004d40] text-white py-12 px-4 shadow-lg mb-12">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-6">
          <div className="bg-white p-3 rounded-2xl shadow-xl">
             <ShieldCheck className="h-16 w-16 text-[#004d40]" />
          </div>
          <div className="text-center md:text-left flex-1">
            <h1 className="text-4xl font-black tracking-tight mb-1 uppercase">Certificate Verified</h1>
            <p className="text-green-100 text-lg opacity-90">This is an authentic Kigali Safety OSH Training Center certificate.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={handleDownload} className="bg-white text-[#004d40] hover:bg-white/90 font-bold shadow-lg">
              <Download className="mr-2 h-5 w-5" /> Download PDF
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-[1240px] mx-auto p-4 flex flex-col items-center w-full">
        
        {/* Responsive Certificate Container */}
        <div className="w-full flex justify-center overflow-hidden mb-6">
           <div style={{ 
             width: '1122px', 
             height: '793px',
             transformOrigin: 'top center',
           }} className="transform scale-[0.3] sm:scale-[0.5] md:scale-[0.7] lg:scale-100 transition-transform duration-300">
              <div className="bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden">
                <Certificate data={cert} />
              </div>
           </div>
        </div>

        {/* Height adjustment to pull content up (replaces the ghost space logic) */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media (max-width: 639px) { .responsive-cert-spacer { margin-top: -540px; } }
          @media (min-width: 640px) and (max-width: 767px) { .responsive-cert-spacer { margin-top: -380px; } }
          @media (min-width: 768px) and (max-width: 1023px) { .responsive-cert-spacer { margin-top: -220px; } }
          @media (min-width: 1024px) { .responsive-cert-spacer { margin-top: 0px; } }
        `}} />
        
        <div className="responsive-cert-spacer w-full h-1" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-sm transition-all hover:shadow-md">
            <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Verification Registry</h2>
            <div className="space-y-4">
               <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Student Name</p>
                  <p className="text-lg font-black text-[#004d40] leading-tight">{cert.learnerName}</p>
               </div>
               <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Certificate ID</p>
                  <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                    <code className="text-[#004d40] font-black font-mono text-sm break-all">
                      {cert.certificateId}
                    </code>
                  </div>
               </div>
               <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Status</p>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-black border border-green-100">
                     <ShieldCheck className="h-4 w-4" /> Validated Original
                  </div>
               </div>
            </div>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-sm transition-all hover:shadow-md h-fit">
            <h2 className="text-xl font-bold text-gray-800 mb-4 uppercase border-b pb-2 tracking-tight">Certified Content</h2>
            <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
               {modulesLoading ? (
                 <div className="flex items-center gap-2 text-gray-400 py-4">
                   <Loader2 className="h-4 w-4 animate-spin" />
                   <span className="text-sm">Fetching syllabus...</span>
                 </div>
               ) : curriculumData?.curriculum?.length > 0 ? (
                 curriculumData.curriculum.map((mod: any, i: number) => (
                   <div key={i} className="space-y-2">
                     <h3 className="text-sm font-black text-[#004d40] uppercase tracking-wider flex items-center gap-2">
                       <div className="h-1.5 w-1.5 bg-[#004d40] rounded-full"></div>
                       {mod.moduleTitle}
                     </h3>
                     <div className="pl-4 space-y-1.5">
                       {mod.lessons.map((lesson: string, j: number) => (
                         <div key={j} className="flex items-start gap-2 text-gray-600 text-xs">
                           <span className="text-[#004d40] mt-0.5">•</span>
                           <span className="leading-tight font-medium text-justify">{lesson}</span>
                         </div>
                       ))}
                     </div>
                   </div>
                 ))
               ) : (
                 <p className="text-sm text-gray-500 italic">Curriculum details not available.</p>
               )}
            </div>
            
            <div className="mt-8 pt-4 border-t border-gray-100 flex items-center justify-between">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Program Duration</div>
              <div className="text-sm font-black text-[#004d40]">3 MONTHS (120 HOURS)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
