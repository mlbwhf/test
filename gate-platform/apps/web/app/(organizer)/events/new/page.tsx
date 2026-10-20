import { api } from "@/lib/api";
import { ApiNotice } from "@/components/ui";
import { EventWizard } from "@/components/event-wizard";

export const dynamic = "force-dynamic";

export default async function NewEventPage() {
  const [coursesRes, orgRes] = await Promise.all([api.listCourses(), api.getOrganization()]);
  if (!coursesRes.ok) return <ApiNotice failure={coursesRes.error} />;
  return <EventWizard courses={coursesRes.data.items} currency={orgRes.ok ? orgRes.data.currency : "USD"} />;
}
