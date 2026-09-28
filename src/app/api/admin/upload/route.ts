import { assertAdmin } from "@/lib/auth";
import { saveUpload } from "@/lib/storage";

/** Admin media upload: multipart `file` (+ optional `folder`) → `{ url }`. */
export async function POST(req: Request) {
  try {
    await assertAdmin();
  } catch {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return Response.json({ error: "Send the file as multipart/form-data" }, { status: 400 });
  }
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return Response.json({ error: "Choose a file to upload" }, { status: 400 });
  }
  const folder = typeof form.get("folder") === "string" ? String(form.get("folder")) : "misc";

  try {
    const url = await saveUpload(file, folder);
    return Response.json({ url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    return Response.json({ error: message }, { status: 400 });
  }
}
