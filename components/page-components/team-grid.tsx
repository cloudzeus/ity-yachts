"use client"

import { TeamMemberCard } from "./team-member-card"
import { cn } from "@/lib/utils"
import { useTranslations } from "@/lib/use-translations"

export interface StaffMember {
  id: string
  name: string
  position: Record<string, string>  // { en, el, de }
  department: Record<string, string>
  image: string | null
  bio: Record<string, string>
  sortOrder: number
}

export interface TeamGridProps {
  staff: StaffMember[]
  columns?: number
  variant?: "minimal" | "card" | "overlay"
  showBio?: boolean
  maxMembers?: number
  lang?: string
}

export function TeamGrid({
  staff,
  columns = 4,
  variant = "minimal",
  maxMembers = 0,
}: TeamGridProps) {
  const { locale } = useTranslations()
  const members = maxMembers > 0 ? staff.slice(0, maxMembers) : staff

  const gridCols = {
    2: "grid-cols-2",
    3: "grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-2 lg:grid-cols-4",
    5: "grid-cols-2 lg:grid-cols-5",
    6: "grid-cols-2 md:grid-cols-3 lg:grid-cols-6",
  }[columns] ?? "grid-cols-2 lg:grid-cols-4"

  return (
    <div className={cn("grid gap-x-4 gap-y-10 md:gap-8", gridCols)}>
      {members.map((member) => (
        <TeamMemberCard
          key={member.id}
          name={member.name}
          position={member.position?.[locale] || member.position?.en || ""}
          image={member.image}
          variant={variant}
        />
      ))}
    </div>
  )
}
