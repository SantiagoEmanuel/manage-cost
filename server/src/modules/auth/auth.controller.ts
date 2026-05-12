import type { Request, Response, NextFunction } from "express";
import { AuthService } from "./auth.service.js";
import {
  COOKIE_NAMES,
  REFRESH_TOKEN_DAYS,
} from "../../shared/constants/index.js";
import { env } from "../../config/env.js";
import type { AuthenticatedRequest } from "../../shared/types/index.js";

const service = new AuthService();
const cookieBase = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
};
const ACCESS_MAX_AGE = 15 * 60 * 1000;
const REFRESH_MAX_AGE = REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000;

export async function register(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { user } = await service.register(req.body);
    res.status(201).json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
}

export async function login(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const meta = {
      ...(req.headers["user-agent"] !== undefined && {
        userAgent: req.headers["user-agent"],
      }),
      ...(req.ip !== undefined && { ipAddress: req.ip }),
    };
    const { user, accessToken, refreshToken } = await service.login(
      req.body,
      meta,
    );
    res.cookie(COOKIE_NAMES.ACCESS_TOKEN, accessToken, {
      ...cookieBase,
      maxAge: ACCESS_MAX_AGE,
    });
    res.cookie(COOKIE_NAMES.REFRESH_TOKEN, refreshToken, {
      ...cookieBase,
      maxAge: REFRESH_MAX_AGE,
      path: "/api/auth",
    });
    res.json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
}

export async function refresh(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const rawRefreshToken: string | undefined =
      req.cookies[COOKIE_NAMES.REFRESH_TOKEN];
    if (!rawRefreshToken) {
      res
        .status(401)
        .json({
          success: false,
          code: "UNAUTHORIZED",
          message: "No refresh token",
        });
      return;
    }
    const meta = {
      ...(req.headers["user-agent"] !== undefined && {
        userAgent: req.headers["user-agent"],
      }),
      ...(req.ip !== undefined && { ipAddress: req.ip }),
    };
    const { accessToken, refreshToken } = await service.refresh(
      rawRefreshToken,
      meta,
    );
    res.cookie(COOKIE_NAMES.ACCESS_TOKEN, accessToken, {
      ...cookieBase,
      maxAge: ACCESS_MAX_AGE,
    });
    res.cookie(COOKIE_NAMES.REFRESH_TOKEN, refreshToken, {
      ...cookieBase,
      maxAge: REFRESH_MAX_AGE,
      path: "/api/auth",
    });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

export async function logout(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const rawRefreshToken: string | undefined =
      req.cookies[COOKIE_NAMES.REFRESH_TOKEN];
    if (rawRefreshToken) await service.logout(rawRefreshToken);
    res.clearCookie(COOKIE_NAMES.ACCESS_TOKEN, { ...cookieBase });
    res.clearCookie(COOKIE_NAMES.REFRESH_TOKEN, {
      ...cookieBase,
      path: "/api/auth",
    });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

export async function me(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    res.json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
}
