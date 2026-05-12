import React from "react";
import { QRCodeSVG } from "qrcode.react";
import { Mail, Globe, Shield } from "lucide-react";

interface CertificateProps {
  data: {
    type?: 'general' | 'first-aid' | 'lifting-safety' | 'height-safety';
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
  const isFirstAid = data.type === 'first-aid';
  const isLifting = data.type === 'lifting-safety';
  const isHeight = data.type === 'height-safety';

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
          <h1 className="text-[#004d40] text-4xl font-black tracking-[0.15em] uppercase mb-4 whitespace-nowrap">
            Certificate of Competence
          </h1>
          <p className="text-gray-500 text-[10px] font-bold tracking-[0.4em] uppercase mt-2">
            This is to certify that
          </p>
        </div>

        <div className="mb-5 text-center w-full px-4">
          <h2 className="text-[#1a1a1a] text-5xl font-serif italic font-bold tracking-tight leading-tight">
             {data.title} {data.learnerName || "Telesphore Uwabera"}
          </h2>
        </div>

        {/* Success Statement */}
        <div className="text-center w-full max-w-[900px] mb-6">
          <p className="text-gray-700 text-lg leading-relaxed font-medium mb-6">
            {isFirstAid ? (
              <>has successfully completed First Aid Training conducted by Kigali Safety OSH Training Center (KSOSHTC) and has been assessed and found competent in accordance with the applicable standards for:</>
            ) : (isLifting || isHeight) ? (
              <>has successfully completed professional training in</>
            ) : (
              <>has successfully completed Occupational Safety and Health (OSH) training and has been assessed and found competent in accordance with the applicable OSH standards for:</>
            )}
          </p>
          <div className="flex flex-col items-center justify-center w-full overflow-visible">
            <h3 className="text-[#004d40] text-4xl font-black uppercase tracking-widest whitespace-nowrap mb-4">
              {isFirstAid ? "FIRST AID TRAINING" : 
               isLifting ? "SAFE LIFTING OPERATIONS" :
               isHeight ? "WORKING AT HEIGHT SAFETY" :
               (data.courses || "CONSTRUCTION WORKPLACES")}
            </h3>
            {(isLifting || isHeight) && (
              <div className="text-gray-700 text-sm font-medium leading-tight text-center">
                <p>conducted by <span className="font-bold text-[#004d40]">Kigali Safety OSH Training Center (KSOSHTC)</span></p>
                <p className="mt-1">
                  {isLifting 
                    ? "in accordance with occupational safety and lifting operation safety requirements." 
                    : "in accordance with occupational safety and fall protection requirements."}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ID Section */}
        <div className="w-full max-w-3xl flex justify-center gap-14 border-t border-b border-[#c4ac6a]/50 py-3 mb-4">
          <p className="text-sm font-bold"><span className="text-[#004d40] uppercase mr-2 opacity-60">Duration:</span> {data.duration}</p>
          <div className="w-px h-full bg-[#c4ac6a]"></div>
          <p className="text-sm font-bold"><span className="text-[#004d40] uppercase mr-2 opacity-60">Certificate ID:</span> {data.certificateId}</p>
        </div>

        {/* Slogan Section for Lifting/Height */}
        {(isLifting || isHeight) && (
          <div className="mb-6 text-center w-full px-12">
            <div className="flex items-center gap-4 justify-center">
              <div className="h-[1px] bg-[#c4ac6a]/30 flex-1 max-w-[100px]"></div>
              <p className="text-[#004d40] text-sm italic font-bold tracking-[0.2em] uppercase">
                {isLifting ? "Safety in lifting is not optional-it is a professional responsibility" : 
                 "One unsafe step at height can become a lifetime consequence"}
              </p>
              <div className="h-[1px] bg-[#c4ac6a]/30 flex-1 max-w-[100px]"></div>
            </div>
          </div>
        )}

        {/* Signatures & QR Area - Flex Layout for better PDF rendering */}
        {!isFirstAid ? (
          <div className="w-full mt-auto flex justify-between items-end mb-20">
            {/* Left: Signature with Digital Overlay */}
            <div className="flex flex-col items-start h-full justify-center w-[35%] relative">
               <div className="absolute top-[30px] left-[45px] z-[25] pointer-events-none opacity-40 transform -rotate-12 border-2 border-primary/50 text-primary px-3 py-1 rounded font-bold overflow-hidden select-none whitespace-nowrap">
                  <p className="text-[10px] leading-tight text-center tracking-widest uppercase">Verified System Signature</p>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                     <div className="h-[1px] bg-primary/30 flex-1"></div>
                     <p className="text-[8px] font-mono leading-none">{data.certificateId}</p>
                     <div className="h-[1px] bg-primary/30 flex-1"></div>
                  </div>
                  <p className="text-[6px] text-center uppercase tracking-tighter mt-0.5">Authenticated by Kigali Safety OSH Training Center</p>
               </div>
               <div className="pl-[65px] relative h-[110px] w-full flex flex-col justify-end">
                  <div className="absolute top-0 left-[65px] w-56 h-[70px] flex items-center justify-center">
                   <p className="text-[#004d40] text-[60px] font-normal leading-none opacity-90" style={{ fontFamily: '"Mrs Saint Delafield", cursive', transform: 'rotate(-8deg) scaleX(1.1)' }}>
                     E. N.
                   </p>
                  </div>
                 <div className="w-56 h-[1px] bg-gray-400 mb-2 opacity-50"></div>
                 <div className="flex flex-col items-start">
                   <p className="font-bold text-[#004d40] text-[10px] uppercase leading-none tracking-wide mb-1">Emmanuel NIYOBUHUNGIRO</p>
                   <p className="text-[#444] text-[8px] font-bold uppercase tracking-widest leading-none mb-1">Director, Instructor</p>
                   <p className="text-[#444] text-[8px] font-medium uppercase tracking-widest leading-none">Kigali Safety OSH Training Center</p>
                 </div>
               </div>
            </div>
             <div className="flex flex-col items-center justify-center w-[30%] min-h-[160px]">
                <div className="z-20 pointer-events-none flex items-center justify-center" style={{ width: '150px', height: '150px' }}>
                   <img src="/certificate/stamp.webp" alt="Stamp" className="w-[150px] h-[150px]" style={{ width: '150px', height: '150px', maxWidth: '150px', maxHeight: '150px', objectFit: 'contain', mixBlendMode: 'multiply' }} />
                </div>
             </div>
            <div className="flex flex-col items-end justify-center h-full w-[35%]">
               <div className="flex flex-col items-center gap-2 mb-3">
                  <div className="bg-white p-1.5 border-[1px] border-[#c4ac6a] shadow-sm flex items-center justify-center">
                     <QRCodeSVG value={verificationUrl} size={55} level="H" />
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
        ) : (
          <div className="w-full mt-auto flex flex-col items-center gap-6 pb-20">
            {/* First Aid Special Slogan - Positioned here to avoid footer overlap */}
            <div className="flex items-center gap-4 w-full justify-center mb-2">
               <div className="h-[1px] bg-[#c4ac6a]/40 flex-1"></div>
               <p className="text-[#004d40] text-[13px] italic font-bold tracking-[0.25em] uppercase whitespace-nowrap opacity-80">
                 Trained not for a certificate, but for saving lives.
               </p>
               <div className="h-[1px] bg-[#c4ac6a]/40 flex-1"></div>
            </div>

            <div className="w-full flex justify-between items-end">
              {/* 1. Trainer Sign */}
              <div className="flex flex-col items-center w-1/4">
                 <div className="relative h-16 w-full flex items-center justify-center mb-1">
                   <p className="text-[#004d40] text-[45px] font-normal leading-none opacity-90" style={{ fontFamily: '"Mrs Saint Delafield", cursive', transform: 'rotate(-5deg)' }}>
                     K. J. M. V.
                   </p>
                 </div>
                 <div className="w-4/5 h-[1px] bg-gray-400 mb-2 opacity-50"></div>
                 <p className="font-bold text-[#004d40] text-[10px] uppercase leading-none text-center">KARINGANIRE Jean Marie Vianney</p>
                 <p className="text-[#444] text-[8px] font-bold uppercase tracking-widest leading-none mt-1.5">Trainer</p>
                 <p className="text-[#444] text-[7px] font-medium uppercase tracking-widest leading-none mt-1">Kigali Safety OSH Training Center</p>
              </div>

              {/* 2. QR Code */}
              <div className="flex flex-col items-center w-1/4 pb-1">
                 <div className="bg-white p-1.5 border-[1px] border-[#c4ac6a] shadow-sm mb-2">
                    <QRCodeSVG value={verificationUrl} size={50} level="H" />
                 </div>
                 <p className="text-[7px] text-gray-400 font-bold uppercase tracking-widest italic leading-none mb-1">Verify Authenticity</p>
                 <p className="text-gray-800 font-bold text-[10px]">
                   <span className="text-gray-400 uppercase mr-1 text-[7px] tracking-widest">Date:</span> 
                   <span className="whitespace-nowrap">{data.dateIssued ? new Date(data.dateIssued).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : "May 08, 2026"}</span>
                 </p>
              </div>

              {/* 3. Stamp */}
              <div className="flex flex-col items-center w-1/4">
                 <div className="h-24 w-24 flex items-center justify-center">
                    <img src="/certificate/stamp.webp" alt="Stamp" className="w-24 h-24 object-contain mix-blend-multiply" />
                 </div>
              </div>

              {/* 4. Director Sign */}
              <div className="flex flex-col items-center w-1/4 relative">
                 {/* Dynamic Digital Watermark for Director */}
                 <div className="absolute top-[-5px] left-[10px] z-[25] pointer-events-none opacity-40 transform -rotate-12 border-2 border-primary/50 text-primary px-2 py-0.5 rounded font-bold overflow-hidden select-none whitespace-nowrap scale-75 origin-center">
                    <p className="text-[9px] leading-tight text-center tracking-widest uppercase">Verified System Signature</p>
                    <div className="flex items-center justify-between gap-1.5 mt-0.5">
                       <div className="h-[1px] bg-primary/30 flex-1"></div>
                       <p className="text-[7px] font-mono leading-none">{data.certificateId}</p>
                       <div className="h-[1px] bg-primary/30 flex-1"></div>
                    </div>
                    <p className="text-[5px] text-center uppercase tracking-tighter mt-0.5">Authenticated by Kigali Safety OSH Training Center</p>
                 </div>

                 <div className="relative h-16 w-full flex items-center justify-center mb-1">
                   <p className="text-[#004d40] text-[45px] font-normal leading-none opacity-90" style={{ fontFamily: '"Mrs Saint Delafield", cursive', transform: 'rotate(-8deg)' }}>
                     E. N.
                   </p>
                 </div>
                 <div className="w-4/5 h-[1px] bg-gray-400 mb-2 opacity-50"></div>
                 <p className="font-bold text-[#004d40] text-[10px] uppercase leading-none text-center">Emmanuel NIYOBUHUNGIRO</p>
                 <p className="text-[#444] text-[8px] font-bold uppercase tracking-widest leading-none mt-1.5">Director, Instructor</p>
                 <p className="text-[#444] text-[7px] font-medium uppercase tracking-widest leading-none mt-1">Kigali Safety OSH Training Center</p>
              </div>
            </div>
          </div>
        )}
      </div>

       {/* Footer Bar - Perfectly Distributed Row */}
       <div className="absolute bottom-0 left-0 right-0 h-10 bg-[#004d40] flex items-center justify-between px-24 z-30">
         
         {/* Left: Email */}
         <div className="flex flex-row items-center gap-2 w-1/3">
            <Mail className="h-3.5 w-3.5 text-white/90 shrink-0" />
            <p className="text-white text-[10px] font-bold tracking-widest leading-none">ksoshtc@gmail.com</p>
         </div>
 
         {/* Center: Website */}
         <div className="flex flex-row items-center justify-center gap-2 w-1/3">
            <Globe className="h-3.5 w-3.5 text-white/90 shrink-0" />
            <p className="text-white text-[10px] font-bold tracking-widest leading-none uppercase">www.kigalisafetytraining.com</p>
         </div>
 
         {/* Right: Slogan */}
         <div className="flex flex-row items-center justify-end gap-2 w-1/3 text-right whitespace-nowrap">
            <Shield className="h-3.5 w-3.5 text-white/90 shrink-0" />
            <p className="text-white text-[10px] italic font-bold tracking-widest uppercase leading-none">
              Safety today, prosperity tomorrow.
            </p>
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
