import { DashboardNav } from "@/components/DashboardNav";
import { ProjectProvider } from "@/components/ProjectContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProjectProvider>
      <div className="min-h-screen bg-background">
        <DashboardNav />
        <main className="pl-56">{children}</main>
      </div>
    </ProjectProvider>
  );
}
