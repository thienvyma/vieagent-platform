import NextAuth from "next-auth"
import { Role, Plan } from "@prisma/client"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name?: string
      role: Role
      plan: Plan
      image?: string
    }
  }

  interface User {
    id: string
    email: string
    name?: string
    role: Role
    plan: Plan
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: Role
    plan: Plan
  }
} 