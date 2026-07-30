export function DemoSection({
  children,
  form,
}: {
  children: React.ReactNode
  form: React.ReactNode
}) {
  return (
    <section className="relative mx-auto max-w-7xl px-6 pt-24 pb-24 lg:pt-28 lg:pb-32">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
        <div className="lg:self-start space-y-8">{children}</div>
        <div className="lg:mt-6">
          <div className="lg:sticky lg:top-24 h-fit">{form}</div>
        </div>
      </div>
    </section>
  )
}
