'use client'

import {
  Calendar as CalendarIcon, Clock, MapPin, Users, Wallet, User, Phone,
  FileText, MessageCircle, HeartHandshake, Building2, Cake, Wine,
  Sparkles, ArrowUpRight, Trash2, Banknote,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { Event } from '@/features/events/types'
import { formatCurrency } from '@/lib/utils'
import { TYPE_LABEL } from '@/features/events/constants'

const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  WEDDING: HeartHandshake, CORPORATE: Building2, BIRTHDAY: Cake,
  ANNIVERSARY: Wine, HOLIDAY: Sparkles, OTHER: Sparkles,
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Brouillon', PLANNED: 'Planifié', CONFIRMED: 'Confirmé',
  IN_PROGRESS: 'En cours', COMPLETED: 'Terminé', CANCELLED: 'Annulé',
}

const STATUS_DOT: Record<string, string> = {
  DRAFT: 'bg-gray-400', PLANNED: 'bg-blue-500', CONFIRMED: 'bg-green-500',
  IN_PROGRESS: 'bg-orange-500', COMPLETED: 'bg-green-700', CANCELLED: 'bg-red-500',
}

const STATUS_BADGE_BG: Record<string, string> = {
  CONFIRMED: 'bg-green-50 text-green-700 border-green-200',
  PLANNED: 'bg-blue-50 text-blue-700 border-blue-200',
  IN_PROGRESS: 'bg-orange-50 text-orange-700 border-orange-200',
  CANCELLED: 'bg-red-50 text-red-700 border-red-200',
  COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  DRAFT: 'bg-gray-100 text-gray-700 border-gray-200',
}

function fmt(d: string | Date) {
  const date = new Date(d)
  if (isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

function fmtTime(d: string | Date) {
  const date = new Date(d)
  if (isNaN(date.getTime())) return '—'
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

export function EventDetailSheet({
  event,
  open,
  onOpenChange,
  onEdit,
  onDelete,
}: {
  event: Event | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit?: (event: Event) => void
  onDelete?: (event: Event) => void
}) {
  const router = useRouter()

  if (!event) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader>
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </SheetHeader>
          <div className="p-4 space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-5 w-full" />
            ))}
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  const TypeIcon = TYPE_ICONS[event.type] || Sparkles
  const whatsappUrl = event.clientPhone
    ? `https://wa.me/${event.clientPhone.replace(/[^0-9]/g, '')}`
    : null

  const hasEndDate = event.endDate && !isNaN(new Date(event.endDate).getTime())
  const sameDay = hasEndDate
    ? new Date(event.startDate).toDateString() === new Date(event.endDate!).toDateString()
    : true

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="px-5 pt-5 pb-0">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <SheetTitle className="text-lg truncate pr-8">{event.name}</SheetTitle>
              <SheetDescription className="flex items-center gap-2 mt-1">
                <TypeIcon className="size-3.5 text-muted-foreground/60" />
                <span>{TYPE_LABEL[event.type] || event.type}</span>
              </SheetDescription>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <Badge
              className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${STATUS_BADGE_BG[event.status] || 'bg-gray-100 text-gray-700 border-gray-200'}`}
            >
              <span className={`size-1.5 rounded-full ${STATUS_DOT[event.status] || 'bg-gray-400'}`} />
              {STATUS_LABELS[event.status] || event.status}
            </Badge>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Date & heure */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
              Date &amp; heure
            </h4>
            <div className="flex items-start gap-3 text-sm">
              <CalendarIcon className="size-4 text-muted-foreground/40 mt-0.5 shrink-0" />
              <div>
                <p className="text-foreground">{fmt(event.startDate)}</p>
                <p className="text-muted-foreground/60 text-xs mt-0.5">
                  {fmtTime(event.startDate)}
                  {hasEndDate && !sameDay && (
                    <> → {fmt(event.endDate!)}</>
                  )}
                  {hasEndDate && sameDay && (
                    <> → {fmtTime(event.endDate!)}</>
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="h-px bg-border/30" />

          {/* Client */}
          {event.clientName && (
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
                Client
              </h4>
              <div className="flex items-center gap-3 text-sm">
                <User className="size-4 text-muted-foreground/40 shrink-0" />
                <span className="text-foreground">{event.clientName}</span>
              </div>
              {event.clientPhone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="size-4 text-muted-foreground/40 shrink-0" />
                  <span className="text-foreground">{event.clientPhone}</span>
                </div>
              )}
              <div className="h-px bg-border/30" />
            </div>
          )}

          {/* Détails */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
              Détails
            </h4>

            {event.location && (
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="size-4 text-muted-foreground/40 shrink-0" />
                <span className="text-foreground truncate">{event.location}</span>
              </div>
            )}

            {event.guestCount != null && (
              <div className="flex items-center gap-3 text-sm">
                <Users className="size-4 text-muted-foreground/40 shrink-0" />
                <span className="text-foreground">{event.guestCount} invités</span>
              </div>
            )}

            {event.budget != null && (
              <div className="flex items-center gap-3 text-sm">
                <Wallet className="size-4 text-muted-foreground/40 shrink-0" />
                <span className="text-foreground font-semibold">{formatCurrency(event.budget)}</span>
              </div>
            )}

            {/* Paid amount */}
            {(event.totalPaid != null || event.totalRemaining != null) && (
              <div className="space-y-1.5">
                {event.totalPaid != null && (
                  <div className="flex items-center gap-3 text-sm">
                    <Banknote className="size-4 text-emerald-500/70 shrink-0" />
                    <span className="text-emerald-600 font-medium">Encaissé : {formatCurrency(event.totalPaid)}</span>
                  </div>
                )}
                {event.totalRemaining != null && event.totalRemaining > 0 && (
                  <div className="flex items-center gap-3 text-sm">
                    <Clock className="size-4 text-red-400/70 shrink-0" />
                    <span className="text-red-500 font-medium">Restant : {formatCurrency(event.totalRemaining)}</span>
                  </div>
                )}
                <div className="h-px bg-border/30" />
              </div>
            )}
          </div>

          {/* Contact */}
          {(event.contactPerson || event.contactPhone) && (
            <>
              <div className="h-px bg-border/30" />
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
                  Contact
                </h4>
                {event.contactPerson && (
                  <div className="flex items-center gap-3 text-sm">
                    <User className="size-4 text-muted-foreground/40 shrink-0" />
                    <span className="text-foreground">{event.contactPerson}</span>
                  </div>
                )}
                {event.contactPhone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="size-4 text-muted-foreground/40 shrink-0" />
                    <span className="text-foreground">{event.contactPhone}</span>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Notes */}
          {event.notes && (
            <>
              <div className="h-px bg-border/30" />
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
                  Notes
                </h4>
                <p className="text-sm text-muted-foreground/80 whitespace-pre-wrap leading-relaxed">
                  {event.notes}
                </p>
              </div>
            </>
          )}
        </div>

        <div className="border-t border-border/30 px-5 py-4 flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => { onOpenChange(false); router.push(`/dashboard/events/${event.id}`) }}
          >
            <FileText className="size-3.5" />
            Détails
            <ArrowUpRight className="size-3" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onEdit?.(event)}
          >
            <FileText className="size-3.5" />
            Modifier
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive border-destructive/20 hover:border-destructive/40"
            onClick={() => onDelete?.(event)}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
