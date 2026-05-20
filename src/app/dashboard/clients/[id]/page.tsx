import { redirect } from "next/navigation";
import { motion } from "framer-motion";

import { getClientById } from "@/features/clients/actions/get-client-by-id";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ArrowLeft, Pencil } from "lucide-react";

// Server component – no "use client"

export default async function ClientDetailPage({ params }: { params: { id: string } }) {
  const response = await getClientById(params.id);
  if (!response.success || !response.data) {
    redirect("/dashboard/clients");
  }
  const client = response.data;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  return (
    <motion.main
      className="p-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center mb-6">
        <a href="/dashboard/clients" className="mr-4 btn btn-ghost btn-sm">
          <ArrowLeft className="h-5 w-5" /> Retour
        </a>
        <h1 className="text-2xl font-bold flex-1">
          {client.name}
          {client.company && (
            <span className="ml-2 px-2 py-1 text-sm bg-muted rounded">{client.company}</span>
          )}
        </h1>
        <a href="/dashboard/clients/${client.id}/edit" className="btn btn-primary btn-sm">
          <Pencil className="h-4 w-4 mr-1" /> Editer
        </a>
      </motion.div>

      {/* Stats Row */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Total dépensé</CardTitle>
          </CardHeader>
          <CardContent>{client.totalSpent?.toLocaleString() ?? 0} €</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Commandes</CardTitle>
          </CardHeader>
          <CardContent>{client.commandesCount ?? 0}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Événements</CardTitle>
          </CardHeader>
          <CardContent>{client.eventsCount ?? 0}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Membre depuis</CardTitle>
          </CardHeader>
          <CardContent>{new Date(client.createdAt).toLocaleDateString()}</CardContent>
        </Card>
      </motion.div>

      {/* Info Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardHeader><CardTitle>Contact</CardTitle></CardHeader>
          <CardContent>
            <p>{client.email}</p>
            <p>{client.phone}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Adresse</CardTitle></CardHeader>
          <CardContent>
            <p>{client.address}</p>
            <p>{client.city} {client.postalCode}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Entreprise</CardTitle></CardHeader>
          <CardContent>
            <p>{client.company}</p>
            <p>SIRET: {client.siret}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
          <CardContent>{client.notes || "Aucune note"}</CardContent>
        </Card>
      </motion.div>

      {/* Commandes History */}
      <motion.div variants={itemVariants} className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Dernières commandes</h2>
        {client.commandes && client.commandes.length > 0 ? (
          <div className="space-y-2">
            {client.commandes.map((c) => (
              <Card key={c.id}>
                <CardHeader className="flex justify-between items-center">
                  <CardTitle>#{c.number}</CardTitle>
                  <span className={`px-2 py-0.5 rounded text-xs ${statusBadgeClass(c.status)}`}> {c.status} </span>
                </CardHeader>
                <CardContent>
                  <p>Montant: {c.totalAmount?.toLocaleString()} €</p>
                  <p>Date: {new Date(c.createdAt).toLocaleDateString()}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">Aucune commande récente.</p>
        )}
      </motion.div>

      {/* Events History */}
      <motion.div variants={itemVariants} className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Derniers événements</h2>
        {client.events && client.events.length > 0 ? (
          <div className="space-y-2">
            {client.events.map((e) => (
              <Card key={e.id}>
                <CardHeader className="flex justify-between items-center">
                  <CardTitle>{e.name}</CardTitle>
                  <span className={`px-2 py-0.5 rounded text-xs ${statusBadgeClass(e.status)}`}> {e.status} </span>
                </CardHeader>
                <CardContent>
                  <p>Type: {e.type}</p>
                  <p>Début: {new Date(e.startDate).toLocaleDateString()}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">Aucun événement récent.</p>
        )}
      </motion.div>
    </motion.main>
  );
}

// Helper to map status to badge colors – adjust Tailwind classes as needed
function statusBadgeClass(status: string): string {
  switch (status?.toUpperCase()) {
    case "CONFIRMED":
    case "DELIVERED":
      return "bg-green-100 text-green-800";
    case "CANCELLED":
      return "bg-red-100 text-red-800";
    case "IN_PROGRESS":
      return "bg-yellow-100 text-yellow-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}
