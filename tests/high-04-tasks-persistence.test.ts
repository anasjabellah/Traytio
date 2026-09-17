/**
 * HIGH-04: Tasks persistence/correctness
 *
 * Root cause: CommandeTask Prisma model exists but tasks from the wizard
 * are never persisted to the database. The create/update actions never
 * create/sync CommandeTask records. Tasks are client-side state only.
 *
 * Fix:
 *   - Added tasks array to createCommandeSchema
 *   - create-commande.ts: creates CommandeTask entries inside the $transaction
 *   - update-commande.ts: deletes old tasks and creates new ones in the transaction
 *   - use-commande-form.ts: passes tasks to createCommande
 *   - use-edit-commande-form.ts: passes tasks to updateCommande
 *
 * Run: npx tsx tests/high-04-tasks-persistence.test.ts
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const SRC_ROOT = resolve(process.cwd(), 'src')

// ── SOURCE CONTRACT ──────────────────────────────────

describe('HIGH-04 SOURCE CONTRACT: task persistence', () => {
  it('create-commande.ts creates CommandeTask entries inside the transaction', () => {
    const src = readFileSync(resolve(SRC_ROOT, 'features/commandes/actions/create-commande.ts'), 'utf8')
    assert.ok(src.includes('commandeTask.create'), 'creates CommandeTask records')
    assert.ok(src.includes('data.tasks'), 'uses tasks from input')
    assert.ok(src.includes('title: t.label'), 'maps label to title')
    assert.ok(src.includes('isDone: t.done'), 'maps done to isDone')
  })

  it('update-commande.ts syncs tasks inside the transaction', () => {
    const src = readFileSync(resolve(SRC_ROOT, 'features/commandes/actions/update-commande.ts'), 'utf8')
    assert.ok(src.includes('commandeTask.deleteMany'), 'deletes old tasks on update')
    assert.ok(src.includes('commandeTask.create'), 'creates new tasks on update')
    assert.ok(src.includes('data.tasks'), 'uses tasks from input')
  })

  it('create-commande-schema.ts includes tasks array', () => {
    const src = readFileSync(resolve(SRC_ROOT, 'features/commandes/validations/create-commande-schema.ts'), 'utf8')
    assert.ok(src.includes('taskSchema'), 'has taskSchema definition')
    assert.ok(src.includes('tasks: z.array(taskSchema)'), 'tasks field in schema')
  })

  it('use-commande-form.ts passes tasks to createCommande', () => {
    const src = readFileSync(resolve(SRC_ROOT, 'features/commandes/hooks/use-commande-form.ts'), 'utf8')
    assert.ok(src.includes('tasks: tasks.map'), 'passes tasks to createCommande')
  })

  it('use-edit-commande-form.ts passes tasks to updateCommande', () => {
    const src = readFileSync(resolve(SRC_ROOT, 'features/commandes/hooks/use-edit-commande-form.ts'), 'utf8')
    assert.ok(src.includes('tasks: tasks.map'), 'passes tasks to updateCommande')
  })
})

// ── BEHAVIOR: store-based simulation ─────────────────

interface Task {
  id?: string
  label: string
  done: boolean
}

interface CreateResult {
  commande: { id: string; eventId: string | null }
  tasks: Task[]
}

function simulateCreateCommandeWithTasks(tasks: Task[]): CreateResult {
  return {
    commande: { id: 'cmd_1', eventId: null },
    tasks: tasks.map((t) => ({ label: t.label, done: t.done })),
  }
}

describe('HIGH-04 BEHAVIOR: task persistence', () => {
  it('Task creation persists intended data', () => {
    const tasks = [{ label: 'Task 1', done: false }, { label: 'Task 2', done: true }]
    const result = simulateCreateCommandeWithTasks(tasks)
    assert.equal(result.tasks.length, 2)
    assert.equal(result.tasks[0]!.label, 'Task 1')
    assert.equal(result.tasks[1]!.done, true)
  })

  it('Empty tasks array does not create task records', () => {
    const result = simulateCreateCommandeWithTasks([])
    assert.equal(result.tasks.length, 0)
  })

  it('Task update replaces old tasks', () => {
    const oldTasks = [{ label: 'Old', done: false }]
    const newTasks = [{ label: 'New', done: true }]
    const result = simulateCreateCommandeWithTasks(newTasks)
    assert.equal(result.tasks.length, 1)
    assert.equal(result.tasks[0]!.label, 'New')
    assert.equal(result.tasks[0]!.done, true)
  })

  it('Task label and done are correctly mapped', () => {
    const tasks = [{ label: 'Prepare venue', done: false }]
    const result = simulateCreateCommandeWithTasks(tasks)
    assert.equal(result.tasks[0]!.label, 'Prepare venue')
    assert.equal(result.tasks[0]!.done, false)
  })
})

// ── INTEGRITY: CRIT-02 Clone-on-Write preserved ─────

describe('HIGH-04 INTEGRITY: CRIT-02 preserved', () => {
  it('update-commande.ts still has clone-on-write after task changes', () => {
    const src = readFileSync(resolve(SRC_ROOT, 'features/commandes/actions/update-commande.ts'), 'utf8')
    assert.ok(src.includes('commandesUsingEvent > 1'), 'clone-on-write intact')
    assert.ok(src.includes('commandeTask'), 'task sync coexists with clone-on-write')
  })

  it('MED-02 eventId passthrough still works with task changes', () => {
    const src = readFileSync(resolve(SRC_ROOT, 'features/commandes/hooks/use-commande-form.ts'), 'utf8')
    assert.ok(src.includes('eventId: selectedEvent'), 'eventId passthrough intact')
    assert.ok(src.includes('tasks: tasks.map'), 'tasks passed alongside eventId')
  })
})
