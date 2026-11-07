import { NextResponse } from "next/server";
import { getAttributesWithValues } from "@/server/actions/attribute-actions";

export async function GET() {
  const data = await getAttributesWithValues();
  return NextResponse.json(data);
}


