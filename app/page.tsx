import InvitationExperience from "@/components/InvitationExperience";
import { invitation } from "@/lib/invitation";

export default function HomePage() {
  return <InvitationExperience invitation={invitation} />;
}
