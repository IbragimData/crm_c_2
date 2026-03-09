import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    const { dst, src } = req.body ?? {};
    if (dst == null || src == null) {
        return res.status(400).json({ error: "Missing dst or src in body" });
    }

    try {
        const apiKey = process.env.VOICEFLOW_C2C_API_KEY || process.env.C2C_API_KEY;
        if (!apiKey) {
            console.error("C2C: VOICEFLOW_C2C_API_KEY or C2C_API_KEY not set");
            return res.status(500).json({ error: "Server configuration error" });
        }

        const response = await axios.post(
            "https://apiv2.voiceflow.cc/c2c",
            {
                call: {
                    dst,
                    src
                }
            },
            {
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                },
                timeout: 15000,
            }
        );

        return res.status(200).json(response.data);
    } catch (error: unknown) {
        const err = error as { response?: { status?: number; data?: unknown }; message?: string };
        console.error("C2C ERROR:", err.response?.data ?? err.message);

        return res.status(err.response?.status ?? 500).json({
            error: err.response?.data ?? "C2C request failed",
        });
    }
}