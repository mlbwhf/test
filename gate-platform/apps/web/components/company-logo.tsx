import type { Organization } from "@/lib/api";
import { ActionForm } from "@/components/action-form";
import { updateOrganizationLogoAction } from "@/app/(organizer)/money/logo-actions";

/** Company logo: Find a class, course pages and the schedule widget on your website. */
export function CompanyLogoCard({ org, canEdit }: { org: Organization; canEdit: boolean }) {
  return (
    <section className="card logo-card" aria-labelledby="logo-title">
      <h2 id="logo-title">Company logo</h2>
      <div className="logo-row">
        {org.logoUrl ? <img className="logo-preview" src={org.logoUrl} alt={`${org.name} logo`} /> : <span className="logo-preview logo-empty" aria-hidden="true">{org.name.slice(0, 2).toUpperCase()}</span>}
        <p className="hint">
          Shown next to your classes in Find a class, on your course pages and in the schedule widget on your website. A square PNG or SVG-exported PNG of at
          least 256×256 works best; up to 5 MB.
        </p>
      </div>
      {canEdit && (
        <div className="logo-actions">
          <ActionForm action={updateOrganizationLogoAction} submitLabel={org.logoUrl ? "Replace logo" : "Upload logo"} pendingLabel="Uploading…" inline>
            <input type="file" name="logo" accept="image/png,image/jpeg,image/webp,image/gif" required aria-label="Logo file" />
          </ActionForm>
          {org.logoUrl && (
            <ActionForm action={updateOrganizationLogoAction} submitLabel="Remove" pendingLabel="Removing…" variant="danger" inline>
              <input type="hidden" name="mode" value="remove" />
            </ActionForm>
          )}
        </div>
      )}
    </section>
  );
}
