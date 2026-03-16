// ruleid: nextjs-api-route-no-auth-pages
export default async function handler(req, res) {
  const users = await db.getUsers();
  res.status(200).json(users);
}

// ruleid: nextjs-api-route-no-auth-app
export async function GET(request) {
  const data = await fetchData();
  return Response.json(data);
}

// ruleid: nextjs-api-route-no-auth-app
export async function POST(request) {
  const body = await request.json();
  const result = await createItem(body);
  return Response.json(result);
}

// ruleid: nextjs-api-route-no-auth-app
export async function DELETE(request) {
  const { id } = await request.json();
  await deleteItem(id);
  return Response.json({ success: true });
}
