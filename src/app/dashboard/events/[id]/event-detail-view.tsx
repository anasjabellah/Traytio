"use client"
import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { formatCurrency } from '@/lib/utils';
import { EditEventDialog } from "@/features/events/components/edit-event-dialog";
import { DeleteEventDialog } from "@/features/events/components/delete-event-dialog";

function statusBadgeClass(status: string): string {
  switch (status?.toUpperCase()) {
    case "CONFIRMED":
    case "COMPLETED":
      return "bg-green-100 text-green-800";
    case "CANCELLED":
    case "REJECTED":
      return "bg-red-100 text-red-800";
    case "IN_PROGRESS":
    case "PENDING":
      return "bg-yellow-100 text-yellow-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function typeBadgeClass(type: string): string {
  switch (type?.toUpperCase()) {
    case "MEETING":
      return "bg-blue-100 text-blue-800";
    case "WEBINAR":
      return "bg-purple-100 text-purple-800";
    case "WORKSHOP":
      return "bg-indigo-100 text-indigo-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export default function EventDetailView({ event }: { event: any }) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <motion.main
      className="p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Header */}
      <div className="flex items-center mb-6">
        <a href="/dashboard/events" className="mr-4 flex items-center gap-1 text-sm text-[#888888] hover:text-[#1a1a1a]">
          <ArrowLeft className="h-4 w-4" /> Retour
        </a>
        <h1 className="font-heading text-2xl font-medium flex-1 text-[#1a1a1a] no-underline" style={{ textDecoration: 'none' }}>
          {event.name}
        </h1>
        <button onClick={() => setEditOpen(true)} className="mr-2 text-[#1a1a1a] hover:text-[#C9A96E]"><Pencil className="h-4 w-4" /></button>
        <button onClick={() => setDeleteOpen(true)} className="text-[#1a1a1a] hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
      </div>

      {/* Badges */}
      <div className="flex space-x-2 mb-6">
        <span className={`px-2 py-0.5 rounded text-xs ${statusBadgeClass(event.status)}`}> {event.status} </span>
        <span className={`px-2 py-0.5 rounded text-xs ${typeBadgeClass(event.type)}`}> {event.type} </span>
      </div>

      {/* Main info cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card className="border border-[#e2e2e2]">
          <CardHeader>
            <CardTitle className="text-xs text-[#888888] uppercase tracking-wider font-sans font-medium">Date de début</CardTitle>
          </CardHeader>
          <CardContent className="text-xl font-medium">{new Date(event.startDate).toLocaleDateString()}</CardContent>
        </Card>
        {event.endDate && (
          <Card className="border border-[#e2e2e2]">
            <CardHeader>
              <CardTitle className="text-xs text-[#888888] uppercase tracking-wider font-sans font-medium">Date de fin</CardTitle>
            </CardHeader>
            <CardContent className="text-xl font-medium">{new Date(event.endDate).toLocaleDateString()}</CardContent>
          </Card>
        )}
        {event.location && (
          <Card className="border border-[#e2e2e2]">
            <CardHeader>
              <CardTitle className="text-xs text-[#888888] uppercase tracking-wider font-sans font-medium">Lieu</CardTitle>
            </CardHeader>
            <CardContent className="text-xl font-medium">{event.location}</CardContent>
          </Card>
        )}
        {event.budget != null && (
          <Card className="border border-[#e2e2e2]">
            <CardHeader>
              <CardTitle className="text-xs text-[#888888] uppercase tracking-wider font-sans font-medium">Budget</CardTitle>
            </CardHeader>
            <CardContent className="text-xl font-medium">{formatCurrency(event.budget)}</CardContent>
          </Card>
        )}
        {event.guestCount != null && (
          <Card className="border border-[#e2e2e2]">
            <CardHeader>
              <CardTitle className="text-xs text-[#888888] uppercase tracking-wider font-sans font-medium">Participants</CardTitle>
            </CardHeader>
            <CardContent className="text-xl font-medium">{event.guestCount}</CardContent>
          </Card>
        )}
        {event.clientId && (
          <Card className="border border-[#e2e2e2]">
            <CardHeader>
              <CardTitle className="text-xs text-[#888888] uppercase tracking-wider font-sans font-medium">Client</CardTitle>
            </CardHeader>
            <CardContent className="text-xl font-medium">
              <a href={`/dashboard/clients/${event.clientId}`} className="text-[#C9A96E] underline">Voir le client</a>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Notes */}
      <div className="mb-6">
        <h2 className="text-base font-semibold mb-2 text-[#1a1a1a] font-sans uppercase tracking-wider">Notes</h2>
        <p className="text-sm text-[#888888]">{event.notes || "Aucune note"}</p>
      </div>

      {/* Commandes liées */}
      <div className="mb-6">
        <h2 className="text-base font-semibold mb-4 text-[#1a1a1a] font-sans uppercase tracking-wider">Commandes liées</h2>
        {event.commandes && event.commandes.length > 0 ? (
          <div className="space-y-2">
            {event.commandes.map((c: any) => (
              <Card key={c.id} className="border border-[#e2e2e2]">
                <CardHeader className="flex flex-row justify-between items-center">
                  <CardTitle className="text-sm">#{c.number}</CardTitle>
                  <span className={`px-2 py-0.5 rounded text-xs ${statusBadgeClass(c.status)}`}>{c.status}</span>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">Montant: {formatCurrency(c.totalAmount)}</p>
                  <p className="text-sm text-[#888888]">Date: {new Date(c.createdAt).toLocaleDateString()}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[#888888]">Aucune commande liée.</p>
        )}
      </div>

      {/* Dialogs */}
      <EditEventDialog
        event={event}
        open={editOpen}
        onClose={setEditOpen}
        onSuccess={() => {
          // Reload the page after a successful edit
          window.location.reload();
        }}
      />
      <DeleteEventDialog
        event={event}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onSuccess={() => {
          // After deletion, navigate back to the events list
          window.location.href = '/dashboard/events';
        }}
      />
    </motion.main>
  );
}
