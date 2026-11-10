import type { NextApiRequest, NextApiResponse } from "next";
import { apiUrl } from "@/lib/apiFetch";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ message: `Method ${req.method} not allowed` });
  }

  try {
    const targetUrl = apiUrl("/banners");
    const response = await fetch(targetUrl, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({ message: "Failed to fetch banners from backend" });
    }

    const data = await response.json();
    res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=120");
    return res.status(200).json(data);
  } catch (error) {
    console.error("[pages/api/banners] Error proxying banners:", error);
    return res.status(500).json({ message: "Internal server error fetching banners" });
  }
}
