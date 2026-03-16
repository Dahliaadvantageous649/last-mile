"use server";

// ruleid: nextjs-server-action-unvalidated
async function createPost(formData) {
  const title = formData.get("title");
  const content = formData.get("content");
  await db.posts.create({ title, content });
}

// ruleid: nextjs-server-action-unvalidated
async function updateUser(data) {
  await db.users.update(data.id, data);
}

// ruleid: nextjs-server-action-unvalidated
async function deleteItem(formData) {
  const id = formData.get("id");
  await db.items.delete(id);
}
