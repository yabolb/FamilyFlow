import { AppShell } from '@/components/layout'

export default function ProfileLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <AppShell>{children}</AppShell>
}
