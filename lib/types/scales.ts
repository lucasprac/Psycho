export type ApplicationStatus = "pending" | "completed" | "expired"

export interface Scale {
  id: string
  name: string
  description: string
  type: "padronizada" | "customizada"
  status: "active" | "inactive"
  created_at: string
  questions: {
    instructions?: string
    items?: string[]
    groups?: {
      title: string
      options: {
        value: number
        text: string
      }[]
    }[]
    options?: {
      value: number
      label: string
    }[]
    reverse_items?: number[]
    scoring?: {
      ranges: {
        min: number
        max: number
        label: string
      }[]
    }
  }
}

export interface ScaleApplication {
  id: string
  psychologist_id: string
  patient_id: string
  scale_id: string
  due_date: string
  status: ApplicationStatus
  responses?: Record<string, any>
  score?: number
  created_at: string
  completed_at?: string
  scale?: Scale
  patient?: {
    name: string
    email: string
  }
}
