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
    <div className="min-h-screen bg-[#f3f4f6] pb-20">
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

      <div className="max-w-[1240px] mx-auto p-4 flex flex-col items-center">
        <div className="bg-white rounded-3xl shadow-2xl p-4 md:p-12 border border-gray-100 scale-[0.55] md:scale-[0.8] lg:scale-100 origin-top overflow-hidden">
          <Certificate data={cert} />
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl">
          <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm transition-all hover:shadow-md">
            <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Verification Registry</h2>
            <div className="space-y-4">
               <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Student Name</p>
                  <p className="text-lg font-bold text-gray-800">{cert.learnerName}</p>
               </div>
               <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Certificate ID</p>
                  <code className="block bg-gray-50 p-3 rounded-lg text-[#004d40] font-mono text-xs break-all border border-gray-100">
                    {cert.certificateId}
                  </code>
               </div>
               <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Status</p>
                  <div className="flex items-center text-green-600 font-bold gap-1">
                     <ShieldCheck className="h-4 w-4" /> Validated Original
                  </div>
               </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm transition-all hover:shadow-md">
            <h2 className="text-xl font-bold text-gray-800 mb-4 uppercase border-b pb-2">Studied Curriculum</h2>
            <div className="space-y-3">
               {(cert.courses?.toLowerCase().includes('mining') ? [
                 'Safety in Surface Mining',
                 'Underground Mining Hazards',
                 'Heavy Machinery Safety',
                 'Emergency Response in Mines'
               ] : cert.courses?.toLowerCase().includes('construction') ? [
                 'Working at Heights',
                 'Electrical Safety',
                 'Excavation & Trenching',
                 'Construction PPE & Hazards'
               ] : [
                 'Machine Guarding',
                 'Chemical Safety (HAZMAT)',
                 'Fire Prevention',
                 'Factory OSH Standards'
               ]).map((topic, i) => (
                 <div key={i} className="flex items-center gap-3 text-gray-700 font-bold text-sm">
                   <div className="h-2 w-2 bg-[#004d40] rounded-full"></div>
                   {topic}
                 </div>
               ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
