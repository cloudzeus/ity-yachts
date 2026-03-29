"use client"

import Image from "next/image"
import { cn } from "@/lib/utils"

export interface TeamMemberCardProps {
  name: string
  position: string
  image: string | null
  variant?: "minimal" | "card" | "overlay"
}

export function TeamMemberCard({ name, position, image, variant = "minimal" }: TeamMemberCardProps) {
  return (
    <div
      className={cn(
        "group flex flex-col items-center text-center cursor-pointer p-4 rounded-2xl bg-white",
        "transform transition-all duration-300",
        "hover:-translate-y-1.5 hover:shadow-[0_12px_40px_-12px_rgba(30,58,95,0.15)]"
      )}
    >
      {/* Avatar */}
      <div className="relative mb-4">
        <div className="rounded-full ring-0 group-hover:ring-[6px] ring-[#1e3a5f]/10 transition-all duration-300 ease-out">
          <div className="relative w-20 h-20 lg:w-24 lg:h-24 rounded-full overflow-hidden bg-[#f0f2f5] shadow-sm">
            {image ? (
              <Image
                src={image}
                alt={name}
                fill
                className={cn(
                  "object-cover object-top",
                  "grayscale sepia-[0.4] hue-rotate-[350deg] saturate-[1.1] brightness-[0.95] contrast-[1.05]",
                  "transition-all duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
                  "group-hover:grayscale-0 group-hover:sepia-0 group-hover:hue-rotate-0 group-hover:saturate-100 group-hover:brightness-100 group-hover:contrast-100",
                  "group-hover:scale-[1.08]"
                )}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-[#1e3a5f]/30">
                {name.charAt(0)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Name */}
      <h3 className="text-[14px] font-semibold text-[#1e3a5f] leading-tight transition-colors duration-300">
        {name}
      </h3>

      {/* Position */}
      <div className="flex items-center justify-center gap-1.5 mt-1 text-[#1e3a5f]/60 transition-colors duration-300 group-hover:text-[#1e3a5f]/80">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-3 h-3"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
        </svg>
        <p className="text-[12px] font-medium">{position}</p>
      </div>
    </div>
  )
}
