"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Bell, Clock, FileText, Calendar, User } from "lucide-react"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"

type NotificationType = "scale" | "activity" | "thought" | "session" | "patient"

type Notification = {
  id: string
  type: NotificationType
  title: string
  description: string
  time: string
  read: boolean
  link: string
}

interface NotificationsCardProps {
  notifications: Notification[]
  isLoading?: boolean
  error?: Error | null
  markAsRead?: (id: string) => Promise<boolean>
  markAllAsRead?: () => Promise<boolean>
}

export function NotificationsCard({
  notifications,
  isLoading = false,
  error = null,
  markAsRead,
  markAllAsRead,
}: NotificationsCardProps) {
  const unreadCount = notifications.filter((n) => !n.read).length

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case "scale":
        return <FileText className="h-5 w-5 text-blue-500" />
      case "activity":
        return <Calendar className="h-5 w-5 text-green-500" />
      case "thought":
        return <FileText className="h-5 w-5 text-purple-500" />
      case "session":
        return <Clock className="h-5 w-5 text-orange-500" />
      case "patient":
        return <User className="h-5 w-5 text-red-500" />
    }
  }

  if (error) {
    return (
      <Card className="col-span-full lg:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Notificações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-destructive">Erro ao carregar notificações: {error.message}</p>
            <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
              Tentar novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="col-span-full lg:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <CardTitle>Notificações</CardTitle>
          {!isLoading && unreadCount > 0 && <Badge className="bg-primary text-primary-foreground">{unreadCount}</Badge>}
        </div>
        {!isLoading && unreadCount > 0 && markAllAsRead && (
          <Button variant="ghost" size="sm" onClick={markAllAsRead}>
            Marcar todas como lidas
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {Array(5)
              .fill(0)
              .map((_, index) => (
                <div key={index} className="flex gap-3 rounded-lg border p-3">
                  <Skeleton className="h-6 w-6 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-3/4 mb-1" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  </div>
                </div>
              ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Bell className="mb-2 h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">Ainda não disponível</p>
          </div>
        ) : (
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex gap-3 rounded-lg border p-3 ${!notification.read ? "bg-muted/50" : ""}`}
                >
                  <div className="mt-1">{getIcon(notification.type)}</div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium">{notification.title}</p>
                      <p className="whitespace-nowrap text-xs text-muted-foreground">{notification.time}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">{notification.description}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <Button variant="link" size="sm" className="h-auto p-0" asChild>
                        <Link href={notification.link}>Ver detalhes</Link>
                      </Button>
                      {!notification.read && markAsRead && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 text-xs text-muted-foreground"
                          onClick={() => markAsRead(notification.id)}
                        >
                          Marcar como lida
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
