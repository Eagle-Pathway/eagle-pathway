import Image from 'next/image';
import Link from 'next/link';
import { GraduationCap, Sparkles, CheckCircle2 } from 'lucide-react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F8FAFC]">
      {/* Left Hero Pane (Desktop) */}
      <div className="hidden md:flex md:w-1/2 lg:w-5/12 bg-gradient-to-br from-[#0B2A5B] via-[#0D3472] to-[#1E4D9B] p-12 text-white flex-col justify-between relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#C9A84C]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />

        {/* Brand */}
        <div className="relative z-10 flex items-center gap-3">
          <Image
            src="/brand/icon-light.svg"
            alt="Eagle Pathway"
            width={44}
            height={44}
            className="object-contain"
          />
          <div>
            <h1 className="font-bold text-xl tracking-tight text-white leading-none">
              Eagle Pathway
            </h1>
            <p className="text-xs text-[#C9A84C] font-medium tracking-wider uppercase mt-1">
              Global Education &amp; Tutoring
            </p>
          </div>
        </div>

        {/* Center Pitch */}
        <div className="relative z-10 my-auto space-y-6 max-w-md">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-[#C9A84C] text-xs font-semibold backdrop-blur-sm border border-[#C9A84C]/30">
            <Sparkles size={14} />
            <span>Your Gateway to World-Class Education</span>
          </div>

          <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight text-white">
            Unlock fully-funded scholarships and top-tier 1-on-1 tutoring.
          </h2>

          <p className="text-sm text-slate-200/90 leading-relaxed">
            Connect directly with verified admissions tutors, discover matching international university scholarships, and track your applications every step of the way.
          </p>

          <div className="space-y-3 pt-2 text-xs font-medium text-slate-200">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 size={16} className="text-[#C9A84C]" />
              <span>Verified academic &amp; SAT/IELTS tutors</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 size={16} className="text-[#C9A84C]" />
              <span>Curated global scholarships with live deadlines</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 size={16} className="text-[#C9A84C]" />
              <span>AI-powered statement of purpose &amp; essay assistant</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-xs text-white/50">
          &copy; {new Date().getFullYear()} Eagle Pathway. All rights reserved.
        </div>
      </div>

      {/* Right Content Form Pane */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}

