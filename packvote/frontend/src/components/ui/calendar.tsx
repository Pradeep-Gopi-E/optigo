"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
    className,
    classNames,
    showOutsideDays = true,
    ...props
}: CalendarProps) {
    return (
        <DayPicker
            showOutsideDays={showOutsideDays}
            className={cn("p-3 bg-[#09090b] border border-white/10 rounded-xl shadow-2xl font-sans", className)}
            classNames={{
                months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                month: "space-y-4",
                caption: "flex justify-center pt-1 relative items-center",
                caption_label: "hidden", // Hidden to avoid duplication with dropdowns
                nav: "space-x-1 flex items-center",
                nav_button: cn(
                    buttonVariants({ variant: "outline" }),
                    "h-7 w-7 bg-transparent border-white/10 p-0 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                ),
                nav_button_previous: "absolute left-1",
                nav_button_next: "absolute right-1",

                // NATIVE TABLE STYLES - NO FLEX HACKS
                table: "w-full border-collapse", // Removed space-y-1 as it doesn't work on tables
                head_row: "", // Native table row
                head_cell: "text-zinc-500 rounded-md w-9 font-normal text-[0.8rem] align-middle", // Added align-middle
                row: "", // Native table row
                cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-zinc-800/50 [&:has([aria-selected])]:bg-zinc-800 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",

                day: cn(
                    buttonVariants({ variant: "ghost" }),
                    "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-white/10 hover:text-white text-zinc-300"
                ),
                day_range_end: "day-range-end",
                day_selected:
                    "bg-white text-black hover:bg-white hover:text-black focus:bg-white focus:text-black font-medium",
                day_today: "bg-zinc-800 text-white font-bold",
                day_outside:
                    "day-outside text-zinc-700 opacity-50 aria-selected:bg-zinc-800/50 aria-selected:text-zinc-500 aria-selected:opacity-30",
                day_disabled: "text-zinc-700 opacity-50",
                day_range_middle:
                    "aria-selected:bg-zinc-900 aria-selected:text-zinc-100",
                day_hidden: "invisible",
                caption_dropdowns: "flex justify-center gap-1",
                dropdown: "bg-zinc-900 text-white p-1 rounded border border-white/10 text-sm cursor-pointer hover:bg-zinc-800 transition-colors",
                ...classNames,
            }}
            captionLayout="dropdown"
            fromYear={2020}
            toYear={2030}
            components={{
                IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" />,
                IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" />,
            } as any}
            {...props}
        />
    )
}
Calendar.displayName = "Calendar"

export { Calendar }
