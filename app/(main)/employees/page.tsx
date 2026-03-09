"use client"
import { EmployeesPage } from "@/modules"
import s from "./page.module.scss"
export default function employeesPage() {
  return (
    <div className={s.main}>
      <EmployeesPage />
    </div>
  )
}