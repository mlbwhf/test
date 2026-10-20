import { api } from "@/lib/api";
import { ApiNotice } from "@/components/ui";
import { EventWizard } from "@/components/event-wizard";
import { getMe } from "@/lib/console-data";

export const dynamic = "force-dynamic";

export default async function NewEventPage() {
  const [coursesRes, orgRes, meRes] = await Promise.all([api.listCourses(), api.getOrganization(), getMe()]);
  if (!coursesRes.ok) return <ApiNotice failure={coursesRes.error} />;
  const manager = meRes.ok && meRes.data.permissions.includes("settings");
  const partiesRes = manager ? await api.listParties() : null;
  const instructors = partiesRes?.ok ? partiesRes.data.items.filter((p) => p.kind === "instructor").map((p) => ({ id: p.id, name: p.name })) : [];
  const viewer = !meRes.ok || meRes.data.role !== "instructor" ? "manager" : orgRes.ok && orgRes.data.instructorAccess.publish === "approval" ? "instructor-approval" : "instructor";
  return <EventWizard courses={coursesRes.data.items} currency={orgRes.ok ? orgRes.data.currency : "USD"} instructors={instructors} viewer={viewer} />;
}
