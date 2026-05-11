import { AXIOS_TIMEOUT_MS, COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { ForbiddenError } from "@shared/_core/errors";
import axios, { type AxiosInstance } from "axios";
import { parse as parseCookieHeader } from "cookie";
import type { Request } from "express";
import { SignJWT, jwtVerify } from "jose";
import type { User } from "../../drizzle/schema";
import * as db from "../db";
import { ENV } from "./env";

export type SessionPayload = { openId: string; appId: string; name: string };

class SDKServer {
  private readonly client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: ENV.oAuthServerUrl,
      timeout: AXIOS_TIMEOUT_MS,
    });
  }

  async exchangeCodeForToken(code: string, state: string) {
    const redirectUri = atob(state);
    const { data } = await this.client.post("/webdev.v1.WebDevAuthPublicService/ExchangeToken", {
      clientId: ENV.appId,
      grantType: "authorization_code",
      code,
      redirectUri,
    });
    return data;
  }

  async getUserInfo(accessToken: string) {
    const { data } = await this.client.post("/webdev.v1.WebDevAuthPublicService/GetUserInfo", { accessToken });
    return data;
  }

  async getUserInfoWithJwt(jwtToken: string) {
    const { data } = await this.client.post("/webdev.v1.WebDevAuthPublicService/GetUserInfoWithJwt", {
      jwtToken,
      projectId: ENV.appId,
    });
    return data;
  }

  private parseCookies(cookieHeader: string | undefined) {
    if (!cookieHeader) return new Map<string, string>();
    return new Map(Object.entries(parseCookieHeader(cookieHeader)));
  }

  private getSessionSecret() {
    return new TextEncoder().encode(ENV.cookieSecret);
  }

  async createSessionToken(openId: string, options: { expiresInMs?: number; name?: string } = {}): Promise<string> {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1000);
    return new SignJWT({ openId, appId: ENV.appId, name: options.name || "" })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setExpirationTime(expirationSeconds)
      .sign(this.getSessionSecret());
  }

  async verifySession(cookieValue: string | undefined | null): Promise<SessionPayload | null> {
    if (!cookieValue) return null;
    try {
      const { payload } = await jwtVerify(cookieValue, this.getSessionSecret(), { algorithms: ["HS256"] });
      const { openId, appId, name } = payload as Record<string, unknown>;
      if (typeof openId !== "string" || typeof appId !== "string" || typeof name !== "string") return null;
      return { openId, appId, name };
    } catch {
      return null;
    }
  }

  async authenticateRequest(req: Request): Promise<User> {
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);
    const session = await this.verifySession(sessionCookie);

    if (!session) throw ForbiddenError("Invalid session cookie");

    let user = await db.getUserByOpenId(session.openId);
    if (!user) {
      try {
        const userInfo = await this.getUserInfoWithJwt(sessionCookie ?? "");
        await db.upsertUser({
          openId: userInfo.openId,
          name: userInfo.name || null,
          email: userInfo.email ?? null,
          loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        });
        user = await db.getUserByOpenId(userInfo.openId);
      } catch {
        throw ForbiddenError("Failed to sync user info");
      }
    }

    if (!user) throw ForbiddenError("User not found");
    return user;
  }
}

export const sdk = new SDKServer();
