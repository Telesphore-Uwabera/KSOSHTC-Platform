import React from "react";
import { QRCodeSVG } from "qrcode.react";
import { Mail, Globe, Shield } from "lucide-react";

interface CertificateProps {
  data: {
    title: string;
    learnerName: string;
    courses: string;
    dateIssued: string;
    startDate?: string;
    completionDate?: string;
    duration: string;
    certificateId: string;
  };
}

export const Certificate: React.FC<CertificateProps> = ({ data }) => {
  const verificationUrl = `https://www.kigalisafetytraining.com/verify-certificate/${data.certificateId}`;

  return (
    <div 
      id="certificate-print-area"
      className="relative w-[1122px] h-[793px] bg-[#e9e4d1] overflow-hidden shadow-2xl mx-auto font-serif text-[#1e272e] flex flex-col items-center"
      style={{ 
        printColorAdjust: 'exact',
        backgroundImage: 'radial-gradient(circle at 50% 50%, #f1eddf 0%, #e9e4d1 100%)'
      }}
    >
      {/* Wave Decoration - Top Right */}
      <div className="absolute top-0 right-0 w-[420px] h-[320px] z-0 overflow-hidden pointer-events-none">
        <svg viewBox="0 0 500 500" preserveAspectRatio="none" className="w-full h-full transform translate-x-10 -translate-y-10">
          <path d="M0,100 C150,200 350,0 500,100 L500,0 L0,0 Z" fill="#005b41" className="opacity-90" />
          <path d="M0,80 C150,180 350,-20 500,80 L500,0 L0,0 Z" fill="#2c3e50" className="opacity-30" />
          <path d="M500,120 C350,20 150,220 0,120" fill="none" stroke="#c4ac6a" strokeWidth="8" />
        </svg>
      </div>

      {/* Border Frame */}
      <div className="absolute inset-8 border-[1px] border-[#c4ac6a]/40 pointer-events-none z-10"></div>
      <div className="absolute inset-10 border-[3px] border-[#c4ac6a] pointer-events-none z-10"></div>

      {/* Main Content Flow */}
      <div className="relative z-20 w-full h-full flex flex-col items-center pt-10 pb-12 px-24">
        
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <img src="/logo_transparent.webp" alt="KSOHTC" className="h-20 w-auto mb-4" />
          <h1 className="text-[#004d40] text-4xl font-black tracking-[0.15em] uppercase mb-2 whitespace-nowrap">
            Certificate of Competence
          </h1>
          <p className="text-gray-500 text-[10px] font-bold tracking-[0.4em] uppercase">
            This is to certify that
          </p>
        </div>

        <div className="mb-5 text-center w-full px-4">
          <h2 className="text-[#1a1a1a] text-5xl font-serif italic font-bold tracking-tight leading-tight">
             {data.title} {data.learnerName || "Telesphore Uwabera"}
          </h2>
        </div>

        {/* Success Statement */}
        <div className="text-center max-w-4xl mb-4">
          <p className="text-gray-700 text-lg leading-relaxed font-medium mb-4">
            has successfully completed Occupational Safety and Health (OSH) training within a period of <span className="font-black text-[#004d40]">{data.duration}</span> and has been assessed and found competent in accordance with the applicable OSH standards for:
          </p>
          <h3 className="text-[#004d40] text-4xl font-black uppercase tracking-widest">
            {data.courses || "CONSTRUCTION WORKPLACES"}
          </h3>
        </div>

        {/* ID Section */}
        <div className="w-full max-w-3xl flex justify-center gap-14 border-t border-b border-[#c4ac6a]/50 py-3 mb-6">
          <p className="text-sm font-bold"><span className="text-[#004d40] uppercase mr-2 opacity-60">Duration:</span> {data.duration}</p>
          <div className="w-px h-full bg-[#c4ac6a]"></div>
          <p className="text-sm font-bold"><span className="text-[#004d40] uppercase mr-2 opacity-60">Certificate ID:</span> {data.certificateId}</p>
        </div>

        {/* Signatures & QR Area - Flex Layout for better PDF rendering */}
        <div className="w-full mt-auto flex justify-between items-center">
          
          {/* Left: Signature with Digital Overlay */}
          <div className="flex flex-col items-start h-full justify-center w-[35%] relative">
             {/* Dynamic Digital Watermark */}
             <div className="absolute top-[30px] left-[45px] z-[25] pointer-events-none opacity-40 transform -rotate-12 border-2 border-primary/50 text-primary px-3 py-1 rounded font-bold overflow-hidden select-none whitespace-nowrap">
                <p className="text-[10px] leading-tight text-center tracking-widest uppercase">Verified System Signature</p>
                <div className="flex items-center justify-between gap-2 mt-0.5">
                   <div className="h-[1px] bg-primary/30 flex-1"></div>
                   <p className="text-[8px] font-mono leading-none">{data.certificateId}</p>
                   <div className="h-[1px] bg-primary/30 flex-1"></div>
                </div>
                <p className="text-[6px] text-center uppercase tracking-tighter mt-0.5">Authenticated by Kigali Safety OSH Training Center</p>
             </div>

             <div className="relative h-[85px] w-full flex items-end mb-2 pl-[65px]">
               <div className="w-56 flex items-end justify-center mb-1">
                 <p className="text-[#004d40] text-[80px] font-normal leading-none opacity-90" style={{ fontFamily: '"Mrs Saint Delafield", cursive', transform: 'rotate(-8deg) scaleX(1.1)' }}>
                   E. N.
                 </p>
               </div>
             </div>
             <div className="pt-2 pl-[65px]">
               <p className="font-black text-[#004d40] text-sm uppercase leading-tight tracking-wide">Emmanuel NIYOBUHUNGIRO</p>
               <p className="text-[#444] text-[9px] font-black uppercase tracking-widest mt-0.5">HSE Director</p>
             </div>
          </div>

          <div className="flex flex-col items-center justify-center w-[30%] min-h-[200px]">
             <div className="z-20 pointer-events-none flex items-center justify-center" style={{ width: '180px', height: '180px' }}>
                <img 
                   src="/certificate/ksohtc-logo.webp" 
                   alt="Stamp" 
                   className="w-[180px] h-[180px]"
                   style={{ 
                     width: '180px', 
                     height: '180px', 
                     maxWidth: '180px', 
                     maxHeight: '180px',
                     objectFit: 'contain',
                     mixBlendMode: 'multiply'
                   }} 
                />
             </div>
          </div>

          {/* Right: QR & Date - Vertical Layout */}
          <div className="flex flex-col items-end justify-center h-full w-[35%]">
             <div className="flex flex-col items-center gap-2 mb-3">
                <div className="bg-white p-1.5 border-[1px] border-[#c4ac6a] shadow-sm flex items-center justify-center">
                   <QRCodeSVG value={verificationUrl} size={65} level="H" />
                </div>
                <div className="text-center">
                   <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest italic leading-none mb-1">Verify Authenticity</p>
                   <p className="text-gray-800 font-bold text-[10px]">
                     <span className="text-gray-400 uppercase mr-1 text-[8px] tracking-widest">Date:</span> 
                     <span className="whitespace-nowrap">{data.dateIssued ? new Date(data.dateIssued).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : "April 10, 2026"}</span>
                   </p>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Footer Bar - Perfectly Distributed Row */}
      <div className="absolute bottom-0 left-0 right-0 h-10 bg-[#004d40] flex items-center justify-between px-24 z-30">
        
        {/* Left: Email */}
        <div className="flex items-center gap-2 w-1/3">
           <Mail className="h-3 w-3 text-white/80" />
           <p className="text-white text-[10px] font-bold tracking-widest">ksoshtc@gmail.com</p>
        </div>

        {/* Center: Website */}
        <div className="flex items-center justify-center gap-2 w-1/3">
           <Globe className="h-3 w-3 text-white/80" />
           <p className="text-white text-[10px] font-bold tracking-widest">www.kigalisafetytraining.com</p>
        </div>

        {/* Right: Slogan */}
        <div className="flex items-center justify-end gap-2 text-right whitespace-nowrap">
           <Shield className="h-3 w-3 text-white/80 shrink-0" />
           <p className="text-white text-[10px] italic font-bold tracking-widest uppercase whitespace-nowrap">Safety today, prosperity tomorrow.</p>
        </div>

      </div>

      {/* Wave Decoration Bottom */}
      <div className="absolute bottom-0 right-0 w-[500px] h-[120px] z-10 pointer-events-none opacity-30">
        <svg viewBox="0 0 600 150" className="w-full h-full">
           <path d="M0,150 Q150,0 300,150 T600,150 L600,150 L0,150 Z" fill="#c4ac6a" />
        </svg>
      </div>
    </div>
  );
};
