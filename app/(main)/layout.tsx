import { SideBar } from "@/widgets";
import { MainContent } from "./MainContent";

export default function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <main className="main">
            <SideBar />
            <MainContent>{children}</MainContent>
        </main>
    );
}