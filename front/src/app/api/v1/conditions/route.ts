import { createCondition } from "~/lib/models/conditions";
import { z } from "zod";

const postRequestBodySchema = z.object({
  id: z.string(),
  temperature: z.number(),
  humidity: z.number(),
});

export async function POST(request: Request) {
  const now = new Date();
  const body = await request.json();

  const parsedBody = postRequestBodySchema.safeParse(body);
  if (!parsedBody.success) {
    return new Response(
      JSON.stringify({
        message: "Invalid request body",
        errors: parsedBody.error.errors,
      }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }

  await createCondition(
    parsedBody.data.id,
    now,
    parsedBody.data.temperature,
    parsedBody.data.humidity,
  );

  return new Response(JSON.stringify({ message: "success" }), {
    status: 201,
    headers: {
      "Content-Type": "application/json",
    },
  });
}
