"use client"

import { useState } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { Plus, X, Check, ListChecks } from "lucide-react";

export function TasksStep({ tasks, setTasks }: { tasks: any[]; setTasks: (t: any[]) => void }) {
  const [newTask, setNewTask] = useState("");
  const toggle = (id: string) => setTasks(tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  const add = () => {
    if (!newTask.trim()) return;
    setTasks([...tasks, { id: "t" + Date.now(), label: newTask, done: false }]);
    setNewTask("");
  };
  const remove = (id: string) => setTasks(tasks.filter((t) => t.id !== id));
  const done = tasks.filter((t) => t.done).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground tabular-nums">{done} / {tasks.length} terminées</div>
        <div className="h-1 w-32 rounded-full bg-secondary overflow-hidden">
          <motion.div
            initial={false}
            animate={{ width: `${tasks.length ? (done / tasks.length) * 100 : 0}%` }}
            className="h-full bg-gradient-gold"
          />
        </div>
      </div>
      <LayoutGroup>
        {tasks.map((t) => (
          <motion.div
            layout
            key={t.id}
            className={`group flex items-center gap-3 rounded-2xl border px-4 py-3 transition-colors ${
              t.done ? "border-border bg-surface-soft" : "border-border bg-card hover:border-foreground/20"
            }`}
          >
            <button
              onClick={() => toggle(t.id)}
              className={`h-5 w-5 rounded-md border flex items-center justify-center transition-all ${
                t.done ? "bg-gradient-gold border-gold text-gold-foreground" : "border-border hover:border-foreground"
              }`}
            >
              <AnimatePresence>
                {t.done && (
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                    <Check className="h-3 w-3" />
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
            <span className={`flex-1 text-sm transition-all ${t.done ? "line-through text-muted-foreground" : ""}`}>{t.label}</span>
            <button onClick={() => remove(t.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity">
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        ))}
      </LayoutGroup>
      <div className="flex items-center gap-2 rounded-2xl border border-border bg-surface-soft px-4 py-2">
        <ListChecks className="h-4 w-4 text-muted-foreground" />
        <input
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Ajouter une tâche…"
          className="flex-1 bg-transparent py-2 text-sm focus:outline-none"
        />
        <button onClick={add} className="inline-flex items-center gap-1 rounded-full bg-foreground text-primary-foreground px-3 py-1.5 text-xs">
          <Plus className="h-3 w-3" /> Ajouter
        </button>
      </div>
    </div>
  );
}
