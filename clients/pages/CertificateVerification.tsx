import React from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getApiBase } from "@/lib/apiBase";
import { Certificate } from "@/components/Certificate";
import { Loader2, ShieldCheck, AlertCircle, Home } from "lucide-react";
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
          <div className="text-center md:text-left">
            <h1 className="text-4xl font-black tracking-tight mb-1 uppercase">Certificate Verified</h1>
            <p className="text-green-100 text-lg opacity-90">This is an authentic Kigali Safety OSH Training Center certificate.</p>
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

          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-sm transition-all hover:shadow-md">
            <h2 className="text-xl font-bold text-gray-800 mb-4 uppercase border-b pb-2 tracking-tight">Studied Curriculum</h2>
            <div className="space-y-3">
               {(cert.courses?.toLowerCase().includes('mining') ? [
                 'Safety in Surface Mining',
                 'Underground Mining Hazards',
                 'Heavy Machinery Safety',
                 'Emergency Response in Mines',
                 'General Safety & Environment'
               ] : cert.courses?.toLowerCase().includes('construction') ? [
                 'Working at Heights',
                 'Electrical Safety',
                 'Excavation & Trenching',
                 'Construction PPE & Hazards',
                 'General Safety & Environment'
               ] : cert.courses?.toLowerCase().includes('industrial') ? [
                 'Machine Guarding',
                 'Chemical Safety (HAZMAT)',
                 'Fire Prevention',
                 'Factory OSH Standards',
                 'General Safety & Environment'
               ] : [
                 'Introduction to Workplace OSH',
                 'Hazard Identification',
                 'Fire Safety & Prevention',
                 'Personal Protective Equipment',
                 'General Safety & Environment'
               ]).map((topic, i) => (
                 <div key={i} className="flex items-center gap-3 text-gray-700 font-bold text-sm">
                   <div className="h-2 w-2 bg-[#004d40] rounded-full shrink-0"></div>
                   <span className="leading-tight">{topic}</span>
                 </div>
               ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
