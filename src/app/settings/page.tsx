import { ProfileForm } from "@/app/settings/profile-form"
import { Nav } from "../components/nav"

export default function SettingsProfilePage() {
    return (
        
        <div className="flex flex-col min-h-screen bg-black text-white">
            <Nav activeLink="Settings"/>
            <ProfileForm />
        </div>
    )
}