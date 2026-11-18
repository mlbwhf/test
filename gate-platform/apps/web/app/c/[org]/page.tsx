import { redirect } from "next/navigation";

/** /c/<organizer> on its own: the organizer's public profile lists all their classes. */
export default async function OrganizerClasses({ params }: { params: Promise<{ org: string }> }) {
  const { org } = await params;
  redirect(`/o/${encodeURIComponent(org)}`);
}
