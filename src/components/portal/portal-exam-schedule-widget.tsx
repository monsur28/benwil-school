"use client"

import { Card } from "@/components/ui/card"
import { CalendarDays, CheckCircle2, Clock } from "lucide-react"

type ExamSchedule = {
  id: string
  subject: string
  date: string
  time: string
  status: "UPCOMING" | "COMPLETED"
}

interface PortalExamScheduleWidgetProps {
  exams: ExamSchedule[]
}

export function PortalExamScheduleWidget({ exams }: PortalExamScheduleWidgetProps) {
  return (
    <Card className="p-6 h-full flex flex-col bg-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-foreground">Exam Schedule</h3>
        <button className="shrink-0 whitespace-nowrap text-sm text-info hover:underline">View All</button>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-4">
        {exams.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground py-8">
            <CalendarDays className="w-8 h-8 mb-2 text-muted-foreground/50" />
            <p className="text-sm">No upcoming exams scheduled.</p>
          </div>
        ) : (
          exams.map((exam) => (
            <div key={exam.id} className="relative pl-4 border-l-2 border-border pb-4 last:pb-0">
              <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-4 border-card ${exam.status === 'COMPLETED' ? 'bg-success' : 'bg-info'}`}></div>

              <div className="flex justify-between items-start mb-1">
                <h4 className="font-semibold text-foreground">{exam.subject}</h4>
                {exam.status === 'COMPLETED' ? (
                  <span className="flex items-center text-[10px] font-medium text-success bg-success/10 px-2 py-0.5 rounded">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> Completed
                  </span>
                ) : (
                  <span className="flex items-center text-[10px] font-medium text-info bg-info/10 px-2 py-0.5 rounded">
                    <Clock className="w-3 h-3 mr-1" /> Upcoming
                  </span>
                )}
              </div>

              <div className="flex items-center text-xs text-muted-foreground space-x-3 mt-2">
                <span className="flex items-center">
                  <CalendarDays className="w-3.5 h-3.5 mr-1 text-muted-foreground" />
                  {exam.date}
                </span>
                <span className="flex items-center">
                  <Clock className="w-3.5 h-3.5 mr-1 text-muted-foreground" />
                  {exam.time}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  )
}
