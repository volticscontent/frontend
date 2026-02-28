"use client"

import { ClientSidebar } from "@/components/client-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { GradientCanvas } from "@/components/ui/gradient-canvas"
import { useRouter } from "next/navigation"
import React, { useEffect, useState } from "react"
import Script from "next/script"
import Image from "next/image"
import { DeveloperDock } from "@/components/developer-dock"

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [showVideoLoader, setShowVideoLoader] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem("agency_token")
    if (!token) {
      router.push("/login")
    } else {
      // Use setTimeout to avoid synchronous state update warning
      setTimeout(() => {
        setIsAuthorized(true)
      }, 0)
    }

    // Use a timer to hide the loader after a set duration since Spline scene continues indefinitely
    const fallbackTimer = setTimeout(() => setShowVideoLoader(false), 5000)
    return () => clearTimeout(fallbackTimer)
  }, [router])

  if (!isAuthorized || showVideoLoader) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background z-50 overflow-hidden">
        <Script
          type="module"
          src="https://unpkg.com/@splinetool/viewer@1.12.61/build/spline-viewer.js"
          strategy="afterInteractive"
        />
        {React.createElement("spline-viewer", {
          url: "https://prod.spline.design/6O2qvw7wzVBzKPw2/scene.splinecode",
          className: "w-full h-full"
        })}
      </div>
    )
  }

  return (
    <SidebarProvider>
      <ClientSidebar />
      <SidebarInset className="">
        <header className="flex h-16 w-full shrink-0 items-center justify-between gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 z-50">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="#">
                    Client Area
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Dashboard</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="flex items-center justify-end px-6">
            <img
              src="/logo.png"
              alt="Logo do Sistema"
              className="h-12 w-12 rounded-md object-contain"
            />
          </div>
        </header>
        <div className="relative pb-12 flex flex-1 flex-col gap-4 pt-0 overflow-hidden">
          <GradientCanvas className="absolute inset-0 w-full h-full pointer-events-none" />
          <div className="relative mx-12 z-10 flex flex-1 flex-col gap-4">
            {children}
          </div>
        </div>
        <DeveloperDock />
      </SidebarInset>
    </SidebarProvider>
  );
}
