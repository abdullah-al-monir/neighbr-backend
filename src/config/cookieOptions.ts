import { CookieOptions } from "express";
import { config } from "./env";


export const getCookieOptions = (): CookieOptions => {
  const isProduction = config.nodeEnv === "production";

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  };
};

export const getRefreshCookieOptions = (): CookieOptions => {
  const isProduction = config.nodeEnv === "production";

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 30 * 24 * 60 * 60 * 1000, 
    path: "/",
  };
};