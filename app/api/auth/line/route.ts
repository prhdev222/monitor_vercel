import { NextResponse } from "next/server";

export async function GET() {
  try {
    const channelId = process.env.NEXT_PUBLIC_LINE_CHANNEL_ID;
    const redirectUri = process.env.NEXT_PUBLIC_LINE_REDIRECT_URI;
    
    if (!channelId || !redirectUri) {
      return NextResponse.json({ error: "LINE configuration missing" }, { status: 500 });
    }

    // Generate state parameter for security
    const state = Math.random().toString(36).substring(2, 15);
    
    // Build LINE Login URL
    const lineLoginUrl = new URL("https://access.line.me/oauth2/v2.1/authorize");
    lineLoginUrl.searchParams.set("response_type", "code");
    lineLoginUrl.searchParams.set("client_id", channelId);
    lineLoginUrl.searchParams.set("redirect_uri", redirectUri);
    lineLoginUrl.searchParams.set("state", state);
    lineLoginUrl.searchParams.set("scope", "profile openid");

    return NextResponse.redirect(lineLoginUrl.toString());
  } catch (error) {
    console.error("LINE Login initiation error:", error);
    return NextResponse.json({ error: "Failed to initiate LINE login" }, { status: 500 });
  }
}

export async function POST() {
  try {
    const channelId = process.env.NEXT_PUBLIC_LINE_CHANNEL_ID;
    const redirectUri = process.env.NEXT_PUBLIC_LINE_REDIRECT_URI;
    
    if (!channelId || !redirectUri) {
      return NextResponse.json({ error: "LINE configuration missing" }, { status: 500 });
    }

    // Generate state parameter for security
    const state = Math.random().toString(36).substring(2, 15);
    
    // Build LINE Login URL
    const lineLoginUrl = new URL("https://access.line.me/oauth2/v2.1/authorize");
    lineLoginUrl.searchParams.set("response_type", "code");
    lineLoginUrl.searchParams.set("client_id", channelId);
    lineLoginUrl.searchParams.set("redirect_uri", redirectUri);
    lineLoginUrl.searchParams.set("state", state);
    lineLoginUrl.searchParams.set("scope", "profile openid");

    return NextResponse.json({ 
      loginUrl: lineLoginUrl.toString(),
      state 
    });
  } catch (error) {
    console.error("LINE Login URL generation error:", error);
    return NextResponse.json({ error: "Failed to generate LINE login URL" }, { status: 500 });
  }
}