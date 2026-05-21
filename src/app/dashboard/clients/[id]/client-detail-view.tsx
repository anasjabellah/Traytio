"use client"
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ArrowLeft, Pencil } from "lucide-react";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

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

export default function ClientDetailView({ client }: { client: any }) {
  return (
    <motion.main
      className="p-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.div variants={itemVariants} className="flex items-center mb-6">
        <a href="/dashboard/clients" className="mr-4 flex items-center gap-1 text-sm text-[#888888] hover:text-[#1a1a1a]">
          <ArrowLeft className="h-4 w-4" /> Retour
        </a>
        <h1
          className="font-heading text-2xl font-medium flex-1 text-[#1a1a1a] no-underline decoration-none"
          style={{ textDecoration: 'none' }}
        >
          {client.name}
          {client.company && (
            <span className="ml-2 px-2 py-1 text-sm bg-[#f5f5f5] rounded text-[#888888]">{client.company}</span>
          )}
        </h1>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="border border-[#e2e2e2] border-l-2 border-l-[#C9A96E]">
          <CardHeader>
            <CardTitle className="text-xs text-[#888888] uppercase tracking-wider font-sans font-medium">
              Total dépensé
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xl font-medium">{client.totalSpent?.toLocaleString() ?? 0} €</CardContent>
        </Card>
        <Card className="border border-[#e2e2e2]">
          <CardHeader>
            <CardTitle className="text-xs text-[#888888] uppercase tracking-wider font-sans font-medium">
              Commandes
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xl font-medium">{client.commandesCount ?? 0}</CardContent>
        </Card>
        <Card className="border border-[#e2e2e2]">
          <CardHeader>
            <CardTitle className="text-xs text-[#888888] uppercase tracking-wider font-sans font-medium">
              Événements
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xl font-medium">{client.eventsCount ?? 0}</CardContent>
        </Card>
        <Card className="border border-[#e2e2e2]">
          <CardHeader>
            <CardTitle className="text-xs text-[#888888] uppercase tracking-wider font-sans font-medium">
              Membre depuis
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xl font-medium">{new Date(client.createdAt).toLocaleDateString()}</CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card className="border border-[#e2e2e2]">
          <CardHeader>
            <CardTitle className="text-xs text-[#888888] uppercase tracking-wider font-sans font-medium">
              Contact
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="text-sm">{client.email}</p>
            <p className="text-sm">{client.phone}</p>
          </CardContent>
        </Card>
        <Card className="border border-[#e2e2e2]">
          <CardHeader>
            <CardTitle className="text-xs text-[#888888] uppercase tracking-wider font-sans font-medium">
              Adresse
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="text-sm">{client.address}</p>
            <p className="text-sm">{client.city} {client.postalCode}</p>
          </CardContent>
        </Card>
        <Card className="border border-[#e2e2e2]">
          <CardHeader>
            <CardTitle className="text-xs text-[#888888] uppercase tracking-wider font-sans font-medium">
              Entreprise
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="text-sm">{client.company}</p>
            <p className="text-sm text-[#888888]">SIRET: {client.siret}</p>
          </CardContent>
        </Card>
        <Card className="border border-[#e2e2e2]">
          <CardHeader>
            <CardTitle className="text-xs text-[#888888] uppercase tracking-wider font-sans font-medium">
              Notes
            </CardTitle>
          </CardHeader>
          <CardContent><p className="text-sm">{client.notes || "Aucune note"}</p></CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants} className="mb-6">
        <h2
          className="text-base font-semibold mb-4 text-[#1a1a1a] font-sans uppercase tracking-wider mb-4"
          style={{ textDecoration: 'none' }}
        >
          Dernières commandes
        </h2>
        {client.commandes && client.commandes.length > 0 ? (
          <div className="space-y-2">
            {client.commandes.map((c: any) => (
              <Card key={c.id} className="border border-[#e2e2e2]">
                <CardHeader className="flex flex-row justify-between items-center">
                  <CardTitle className="text-sm">#{c.number}</CardTitle>
                  <span className={`px-2 py-0.5 rounded text-xs ${statusBadgeClass(c.status)}`}>{c.status}</span>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">Montant: {c.totalAmount?.toLocaleString()} €</p>
                  <p className="text-sm text-[#888888]">Date: {new Date(c.createdAt).toLocaleDateString()}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[#888888]">Aucune commande récente.</p>
        )}
      </motion.div>

      <motion.div variants={itemVariants} className="mb-6">
        <h2
          className="text-base font-semibold mb-4 text-[#1a1a1a] font-sans uppercase tracking-wider mb-4"
          style={{ textDecoration: 'none' }}
        >
          Derniers événements
        </h2>
        {client.events && client.events.length > 0 ? (
          <div className="space-y-2">
            {client.events.map((e: any) => (
              <Card key={e.id} className="border border-[#e2e2e2]">
                <CardHeader className="flex flex-row justify-between items-center">
                  <CardTitle className="text-sm">{e.name}</CardTitle>
                  <span className={`px-2 py-0.5 rounded text-xs ${statusBadgeClass(e.status)}`}>{e.status}</span>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">Type: {e.type}</p>
                  <p className="text-sm text-[#888888]">Début: {new Date(e.startDate).toLocaleDateString()}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[#888888]">Aucun événement récent.</p>
        )}
      </motion.div>
    </motion.main>
  );
}
