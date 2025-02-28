import { ProfileForm } from "@/app/settings/profile-form"
import { Nav } from "../components/nav"

export default function SettingsProfilePage() {
  return (
    
    <div className="h-screen">
      {/* <Nav activeLink="Settings" /> */}
        <ProfileForm />
    </div>
  )
}