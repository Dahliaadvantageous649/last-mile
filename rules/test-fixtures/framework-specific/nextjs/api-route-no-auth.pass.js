import { getServerSession } from "next-auth";

// ok: nextjs-api-route-no-auth-pages
export default async function handler(req, res) {
  const session = await getSession({ req });
  if (!session) return res.status(401).json({ error: "Unauthorized" });
  const users = await db.getUsers();
  res.status(200).json(users);
}

// ok: nextjs-api-route-no-auth-app
export async function GET(request) {
  const session = await getServerSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const data = await fetchData();
  return Response.json(data);
}

// ok: nextjs-api-route-no-auth-app
export async function POST(request) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  return Response.json(await createItem(body));
}

// ok: nextjs-api-route-no-auth-app
export async function DELETE(request) {
  const user = await verifyAuth(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await request.json();
  await deleteItem(id);
  return Response.json({ success: true });
}
