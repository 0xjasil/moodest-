import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET: Fetch all saved addresses for the logged-in user
export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const addresses = await prisma.address.findMany({
      where: { userId: session.user.id },
      orderBy: [
        { isDefault: "desc" },
        { createdAt: "desc" }
      ],
    });

    return NextResponse.json(addresses);
  } catch (err) {
    console.error("Fetch addresses error:", err);
    return NextResponse.json({ error: "Failed to fetch addresses" }, { status: 500 });
  }
}

// POST: Add a new address
export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, phoneNumber, street, city, state, pincode, isDefault } = body;

    if (!name || !phoneNumber || !street || !city || !state || !pincode) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if this is the user's first address
    const count = await prisma.address.count({
      where: { userId: session.user.id },
    });

    const shouldBeDefault = count === 0 || isDefault === true;

    // If setting as default, clear default status from other addresses
    if (shouldBeDefault) {
      await prisma.address.updateMany({
        where: { userId: session.user.id },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.create({
      data: {
        userId: session.user.id,
        name,
        phoneNumber,
        street,
        city,
        state,
        pincode,
        isDefault: shouldBeDefault,
      },
    });

    return NextResponse.json(address, { status: 201 });
  } catch (err) {
    console.error("Create address error:", err);
    return NextResponse.json({ error: "Failed to create address" }, { status: 500 });
  }
}

// PATCH: Update an address
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, name, phoneNumber, street, city, state, pincode, isDefault } = body;

    if (!id) {
      return NextResponse.json({ error: "Address ID is required" }, { status: 400 });
    }

    // Verify ownership
    const existing = await prisma.address.findUnique({
      where: { id },
    });

    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Address not found or unauthorized" }, { status: 404 });
    }

    const shouldBeDefault = isDefault === true;

    // If making default, unset other addresses
    if (shouldBeDefault) {
      await prisma.address.updateMany({
        where: { userId: session.user.id, NOT: { id } },
        data: { isDefault: false },
      });
    }

    const updated = await prisma.address.update({
      where: { id },
      data: {
        name: name !== undefined ? name : existing.name,
        phoneNumber: phoneNumber !== undefined ? phoneNumber : existing.phoneNumber,
        street: street !== undefined ? street : existing.street,
        city: city !== undefined ? city : existing.city,
        state: state !== undefined ? state : existing.state,
        pincode: pincode !== undefined ? pincode : existing.pincode,
        isDefault: shouldBeDefault || existing.isDefault,
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("Update address error:", err);
    return NextResponse.json({ error: "Failed to update address" }, { status: 500 });
  }
}

// DELETE: Delete an address
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Address ID is required" }, { status: 400 });
    }

    // Verify ownership
    const existing = await prisma.address.findUnique({
      where: { id },
    });

    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Address not found or unauthorized" }, { status: 404 });
    }

    await prisma.address.delete({
      where: { id },
    });

    // If deleted address was the default, make another one default (if any exists)
    if (existing.isDefault) {
      const nextDefault = await prisma.address.findFirst({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
      });

      if (nextDefault) {
        await prisma.address.update({
          where: { id: nextDefault.id },
          data: { isDefault: true },
        });
      }
    }

    return NextResponse.json({ success: true, message: "Address deleted successfully" });
  } catch (err) {
    console.error("Delete address error:", err);
    return NextResponse.json({ error: "Failed to delete address" }, { status: 500 });
  }
}
