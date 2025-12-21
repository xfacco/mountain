export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        // Admin layout specific resets or providers can go here
        <div className="antialiased text-slate-900 bg-slate-50 min-h-screen">
            {children}
        </div>
    );
}
