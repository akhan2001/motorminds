import { Nav } from "@/app/components/nav";

export default function LoadingPage({ page }: { page: string }) {
    return (
        <div className="bg-[#000] min-h-screen">
            <Nav activeLink={page} />
        </div>
    )
}
