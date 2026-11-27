import { test } from "node:test";
import assert from "node:assert/strict";
import { canEditRecipe, canViewRecipe } from "../permissions";

const member = { id: "u1", role: "MEMBER" as const, status: "APPROVED" };
const otherMember = { id: "u2", role: "MEMBER" as const, status: "APPROVED" };
const moderator = { id: "m1", role: "MODERATOR" as const, status: "APPROVED" };
const admin = { id: "a1", role: "ADMIN" as const, status: "APPROVED" };

const published = { submittedById: "u1", status: "PUBLISHED" as const };

test("the author can edit their own published and pending recipes", () => {
  assert.equal(canEditRecipe(member, published), true);
  assert.equal(canEditRecipe(member, { ...published, status: "PENDING" }), true);
});

test("other members and moderators can't edit someone else's recipe", () => {
  assert.equal(canEditRecipe(otherMember, published), false);
  assert.equal(canEditRecipe(moderator, published), false);
});

test("admins can edit any recipe, including ones with no submitter", () => {
  assert.equal(canEditRecipe(admin, published), true);
  assert.equal(canEditRecipe(admin, { submittedById: null, status: "PUBLISHED" }), true);
});

test("nobody gets in through a recipe with no submitter unless they're an admin", () => {
  assert.equal(canEditRecipe(member, { submittedById: null, status: "PUBLISHED" }), false);
});

test("rejected recipes go through the resubmit flow instead", () => {
  assert.equal(canEditRecipe(member, { ...published, status: "REJECTED" }), false);
  assert.equal(canEditRecipe(admin, { ...published, status: "REJECTED" }), false);
});

test("signed-out and unapproved accounts can't edit", () => {
  assert.equal(canEditRecipe(null, published), false);
  assert.equal(canEditRecipe({ ...member, status: "PENDING" }, published), false);
  assert.equal(canEditRecipe({ ...admin, status: "PENDING" }, published), false);
});

test("a pending recipe's preview is open to reviewers and its author only", () => {
  const pending = { submittedById: "u1", status: "PENDING" as const };
  assert.equal(canViewRecipe(admin, pending), true);
  assert.equal(canViewRecipe(moderator, pending), true);
  assert.equal(canViewRecipe(member, pending), true);
  assert.equal(canViewRecipe(otherMember, pending), false);
  assert.equal(canViewRecipe(null, pending), false);
  assert.equal(canViewRecipe({ ...moderator, status: "PENDING" }, pending), false);
});

test("published recipes are open to everyone; rejected ones to no one", () => {
  assert.equal(canViewRecipe(otherMember, published), true);
  assert.equal(canViewRecipe(null, published), true);
  assert.equal(canViewRecipe(admin, { ...published, status: "REJECTED" }), false);
  assert.equal(canViewRecipe(member, { ...published, status: "REJECTED" }), false);
});
