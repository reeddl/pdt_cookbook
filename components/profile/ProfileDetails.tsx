"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import { updateOwnProfile } from "@/app/(app)/profile/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { FamilySelect } from "@/components/family/FamilySelect";
import type { FamilyOption } from "@/lib/family";

interface ProfileDetailsProps {
  name: string;
  bondNumber: string | null;
  pledgeClass: string | null;
  graduationYear: number | null;
  family: FamilyOption | null;
  families: FamilyOption[];
}

/**
 * The member's own profile details. Shows plain text until they press
 * "Edit profile", which swaps in the form; Save or Cancel returns to the
 * read-only view. Cancel just unmounts the form, so unsaved edits are dropped.
 */
export function ProfileDetails({
  name,
  bondNumber,
  pledgeClass,
  graduationYear,
  family,
  families,
}: ProfileDetailsProps) {
  const [editing, setEditing] = useState(false);
  // Only move focus after the member switches modes, not on first render.
  const switched = useRef(false);
  const editButtonRef = useRef<HTMLButtonElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!switched.current) return;
    if (editing) nameInputRef.current?.focus();
    else editButtonRef.current?.focus();
  }, [editing]);

  function switchTo(next: boolean) {
    switched.current = true;
    setEditing(next);
  }

  async function save(formData: FormData) {
    await updateOwnProfile(formData);
    switchTo(false);
  }

  return (
    <section className="mt-10 max-w-md">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-title-3-semibold text-text-primary">Profile details</h2>
        {!editing && (
          <Button ref={editButtonRef} variant="secondary" onClick={() => switchTo(true)}>
            Edit profile
          </Button>
        )}
      </div>

      {editing ? (
        <form action={save} className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input ref={nameInputRef} id="name" name="name" required defaultValue={name} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="bondNumber">Bond number</Label>
              <Input id="bondNumber" name="bondNumber" defaultValue={bondNumber ?? ""} />
            </div>
            <div>
              <Label htmlFor="pledgeClass">Pledge class</Label>
              <Input id="pledgeClass" name="pledgeClass" defaultValue={pledgeClass ?? ""} />
            </div>
          </div>
          <div>
            <Label htmlFor="graduationYear">Graduation year</Label>
            <Input
              id="graduationYear"
              name="graduationYear"
              type="number"
              defaultValue={graduationYear ?? ""}
            />
          </div>
          <FamilySelect families={families} defaultValue={family?.id ?? null} />
          <div className="flex flex-col gap-3 sm:flex-row">
            <SubmitButton pendingLabel="Saving…">Save changes</SubmitButton>
            <Button variant="ghost" onClick={() => switchTo(false)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <dl className="grid grid-cols-2 gap-4">
          <Detail label="Name" className="col-span-2">
            {name}
          </Detail>
          <Detail label="Bond number">{bondNumber}</Detail>
          <Detail label="Pledge class">{pledgeClass}</Detail>
          <Detail label="Graduation year">{graduationYear}</Detail>
          <Detail label="Family">{family?.name}</Detail>
        </dl>
      )}
    </section>
  );
}

function Detail({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  const empty = children === null || children === undefined || children === "";
  return (
    <div className={className}>
      <dt className="mb-1 text-body-medium text-text-secondary">{label}</dt>
      <dd
        className={
          empty
            ? "text-body-regular text-text-tertiary"
            : "text-body-regular break-words text-text-primary"
        }
      >
        {empty ? "Not set" : children}
      </dd>
    </div>
  );
}
