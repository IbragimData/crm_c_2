'use client'

export default function SchedulesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <section className="main__content main__content_schedules">
      {children}
    </section>
  )
}
