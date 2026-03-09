"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import s from "./LoginForm.module.scss";
import icon from "../../assets/white.svg";

import {
  ButtonComponentDefault,
  InputComponentTextDefault,
} from "@/components";

import { useAuthStore } from "@/features/auth/store/authStore";
import { login } from "../../api/auth.api";

export function LoginForm() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setEmployee);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    try {
      setLoading(true);

      const data = await login(email, password);

      if (typeof window !== "undefined") {
        localStorage.setItem("token", data.accessToken);
      }
      setUser(data.user as any);

      router.replace("/leads");
    } catch (e) {
      alert("Invalid email or password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className={s.LoginForm} onSubmit={handleSubmit}>
      <h2 className={s.LoginForm__subtitle}>
        Sign In to CRM
      </h2>

      <div className={s.LoginForm__inputs}>
        <InputComponentTextDefault
          label="Email Address"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <InputComponentTextDefault
          type="password"
          label="Password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <ButtonComponentDefault
        type="submit"
        disabled={loading}
        label={loading ? "Signing in..." : "Sign In"}
        backgroundColor="#00f5ff"
        color="#FFFFFF"
        iconPosition="left"
        icon={
          <Image
            src={icon}
            width={24}
            height={24}
            alt="Sign in"
          />
        }
      />
    </form>
  );
}