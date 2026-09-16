"use client"

import { Card } from "@/components/ui/card"

import { Wallet } from "lucide-react"

interface FeeSummary {
  totalCharges: number
  totalPaid: number
  totalOutstanding: number
}

interface PortalSchoolFeesWidgetProps {
  summary: FeeSummary
}

export function PortalSchoolFeesWidget({ summary }: PortalSchoolFeesWidgetProps) {
  const percentagePaid = summary.totalCharges > 0 
    ? Math.round((summary.totalPaid / summary.totalCharges) * 100) 
    : 100

  return (
    <Card className="p-6 h-full flex flex-col bg-card">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-info/15 text-info rounded-full p-2">
          <Wallet className="w-5 h-5" />
        </div>
        <h3 className="text-lg font-bold text-foreground">School Fees</h3>
      </div>

      <div className="flex-1 flex flex-col justify-center space-y-6">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Total Outstanding</p>
          <h4 className="text-3xl font-black text-foreground">
            ৳{summary.totalOutstanding.toLocaleString()}
          </h4>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-foreground">Paid: ৳{summary.totalPaid.toLocaleString()}</span>
            <span className="text-xs font-bold text-foreground">{percentagePaid}%</span>
          </div>
          <div className="relative flex h-2 w-full items-center overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-success transition-all"
              style={{ width: `${percentagePaid}%` }}
            />
          </div>
        </div>
      </div>
    </Card>
  )
}
