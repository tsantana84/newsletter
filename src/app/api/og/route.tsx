import { ImageResponse } from "@vercel/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

const CATEGORY_COLORS: Record<string, string> = {
  AI: "#A78BFA",
  SOFTWARE_ENGINEERING: "#60A5FA",
  ENGINEERING_MANAGEMENT: "#4ADE80",
};

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const title = searchParams.get("title") || "Inference";
  const category = searchParams.get("category") || "";
  const readingTime = searchParams.get("readingTime") || "";

  const categoryColor = CATEGORY_COLORS[category] || "#94A3B8";
  const categoryLabel = category.replace(/_/g, " ");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "60px 80px",
          backgroundColor: "#0F172A",
          backgroundImage:
            "linear-gradient(rgba(51, 65, 85, 0.25) 1px, transparent 1px), linear-gradient(90deg, rgba(51, 65, 85, 0.25) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      >
        {/* Top: Badge + Category */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {categoryLabel && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                backgroundColor: `${categoryColor}15`,
                border: `1px solid ${categoryColor}40`,
                borderRadius: "9999px",
                padding: "6px 16px",
              }}
            >
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "9999px",
                  backgroundColor: categoryColor,
                }}
              />
              <span
                style={{
                  color: categoryColor,
                  fontSize: "18px",
                  fontWeight: 600,
                }}
              >
                {categoryLabel}
              </span>
            </div>
          )}
          {readingTime && (
            <span style={{ color: "#64748B", fontSize: "18px" }}>
              {readingTime}
            </span>
          )}
        </div>

        {/* Middle: Title */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            flex: 1,
            justifyContent: "center",
          }}
        >
          <h1
            style={{
              color: "#F8FAFC",
              fontSize: title.length > 60 ? "48px" : "56px",
              fontWeight: 700,
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
              margin: 0,
            }}
          >
            {title}
          </h1>
        </div>

        {/* Bottom: Branding */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span
              style={{
                color: "#22C55E",
                fontSize: "28px",
                fontWeight: 700,
                letterSpacing: "-0.02em",
              }}
            >
              Inference
            </span>
            <span style={{ color: "#334155", fontSize: "28px" }}>|</span>
            <span style={{ color: "#64748B", fontSize: "20px" }}>
              AI, Software Engineering & Engineering Management
            </span>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
