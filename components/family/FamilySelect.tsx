import type { FamilyOption } from "@/lib/family";
import { Label } from "@/components/ui/label";

/** Dropdown for picking a member's family. Submits `familyId` ("" for none). */
export function FamilySelect({
  families,
  defaultValue,
}: {
  families: FamilyOption[];
  defaultValue: string | null;
}) {
  return (
    <div>
      <Label htmlFor="familyId">Family</Label>
      <select
        id="familyId"
        name="familyId"
        defaultValue={defaultValue ?? ""}
        className="w-full rounded-2lg bg-background-tertiary-default px-3 py-2 text-body-regular text-text-primary max-sm:py-2.5 max-sm:text-base ring-2 ring-inset ring-transparent outline-none hover:ring-border-button-hover focus:ring-border-button-active"
      >
        <option value="">No family yet</option>
        {families.map((family) => (
          <option key={family.id} value={family.id}>
            {family.name}
          </option>
        ))}
      </select>
    </div>
  );
}
