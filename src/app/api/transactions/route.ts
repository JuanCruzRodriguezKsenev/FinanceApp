import { createTransaction } from "@/core/actions/transactions";

type TransactionPayload = {
  type?: string;
  category?: string;
  amount?: string | number;
  description?: string;
  date?: string;
  currency?: string;
  fromAccountId?: string | null;
  toAccountId?: string | null;
  goalId?: string | null;
  transferRecipient?: string | null;
  transferSender?: string | null;
};

function setIfPresent(
  formData: FormData,
  key: string,
  value?: string | number | null,
) {
  if (value === undefined || value === null || value === "") {
    return;
  }
  formData.set(key, String(value));
}

export async function POST(req: Request) {
  try {
    const idempotencyKey = req.headers.get("Idempotency-Key");
    if (!idempotencyKey) {
      return Response.json(
        { error: "Idempotency-Key header required" },
        { status: 400 },
      );
    }

    const data = (await req.json()) as TransactionPayload;
    const formData = new FormData();

    setIfPresent(formData, "type", data.type);
    setIfPresent(formData, "category", data.category);
    setIfPresent(formData, "amount", data.amount);
    setIfPresent(formData, "description", data.description);
    setIfPresent(formData, "date", data.date ?? new Date().toISOString());
    setIfPresent(formData, "currency", data.currency);
    setIfPresent(formData, "fromAccountId", data.fromAccountId);
    setIfPresent(formData, "toAccountId", data.toAccountId);
    setIfPresent(formData, "goalId", data.goalId);
    setIfPresent(formData, "transferRecipient", data.transferRecipient);
    setIfPresent(formData, "transferSender", data.transferSender);
    setIfPresent(formData, "idempotencyKey", idempotencyKey);

    const result = await createTransaction(formData);

    if (result.isOk()) {
      return Response.json({ ok: true }, { status: 201 });
    }

    return Response.json({ error: result.error }, { status: 400 });
  } catch (error) {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
