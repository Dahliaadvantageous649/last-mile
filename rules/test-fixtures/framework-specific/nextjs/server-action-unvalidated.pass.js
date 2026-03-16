"use server";

import { z } from "zod";

const postSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
});

// ok: nextjs-server-action-unvalidated
async function createPost(formData) {
  const raw = {
    title: formData.get("title"),
    content: formData.get("content"),
  };
  const validated = postSchema.parse(raw);
  await db.posts.create(validated);
}

const updateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
});

// ok: nextjs-server-action-unvalidated
async function updateUser(data) {
  const validated = updateSchema.safeParse(data);
  if (!validated.success) throw new Error("Invalid input");
  await db.users.update(validated.data.id, validated.data);
}
