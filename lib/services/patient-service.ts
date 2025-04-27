import { createSupabaseClient } from "@/lib/supabase/client"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import type { Database } from "@/lib/supabase/database.types"

// Tipo para os dados do paciente
export type PatientData = {
  name: string
  email: string
  phone?: string
  dateOfBirth?: string
  emergencyContact?: string
  notes?: string
}

// Função para cadastrar um novo paciente (lado do cliente)
export async function registerPatient(patientData: PatientData, psychologistId: string) {
  const supabase = createSupabaseClient()

  try {
    // Gerar uma senha temporária
    const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8)

    // 1. Verificar se o e-mail já está em uso
    const { data: existingUser, error: checkError } = await supabase
      .from("users")
      .select("id")
      .eq("email", patientData.email)
      .maybeSingle()

    if (checkError) {
      console.error("Erro ao verificar e-mail:", checkError)
      throw new Error("Erro ao verificar se o e-mail já está em uso.")
    }

    if (existingUser) {
      throw new Error("Este e-mail já está cadastrado no sistema.")
    }

    // 2. Criar o usuário no Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: patientData.email,
      password: tempPassword,
      options: {
        data: {
          name: patientData.name,
          user_type: "paciente",
        },
      },
    })

    if (authError) {
      console.error("Erro na autenticação:", authError)
      throw authError
    }

    if (!authData.user) {
      throw new Error("Falha ao criar usuário.")
    }

    const newUserId = authData.user.id

    // 3. Inserir na tabela users
    const { error: userError } = await supabase.from("users").insert({
      id: newUserId,
      email: patientData.email,
      name: patientData.name,
      password: "", // Não armazenamos a senha em texto simples
      user_type: "paciente",
    })

    if (userError) {
      console.error("Erro ao inserir usuário:", userError)
      // Tentar limpar o usuário Auth criado em caso de erro
      await supabase.auth.admin.deleteUser(newUserId)
      throw userError
    }

    // 4. Inserir na tabela patients
    const { error: patientError } = await supabase.from("patients").insert({
      id: newUserId,
      psychologist_id: psychologistId,
      date_of_birth: patientData.dateOfBirth || null,
      phone: patientData.phone || null,
      emergency_contact: patientData.emergencyContact || null,
      notes: patientData.notes || null,
      status: "active",
    })

    if (patientError) {
      console.error("Erro ao inserir paciente:", patientError)
      // Tentar limpar os dados em caso de erro
      await supabase.from("users").delete().eq("id", newUserId)
      await supabase.auth.admin.deleteUser(newUserId)
      throw patientError
    }

    // 5. Criar notificação para o psicólogo
    const { error: notificationError } = await supabase.from("notifications").insert({
      recipient_id: psychologistId,
      type: "patient",
      title: "Novo paciente cadastrado",
      description: `${patientData.name} foi adicionado à sua lista de pacientes.`,
      link: `/dashboard/pacientes/${newUserId}`,
      read: false,
    })

    if (notificationError) {
      console.error("Erro ao criar notificação:", notificationError)
      // Não vamos falhar o cadastro por causa de uma notificação
    }

    return { success: true, patientId: newUserId }
  } catch (error) {
    console.error("Erro no cadastro de paciente:", error)
    throw error
  }
}

// Função para buscar todos os pacientes de um psicólogo (lado do servidor)
export async function getPatients(psychologistId: string) {
  const supabase = createServerComponentClient<Database>({ cookies })

  try {
    const { data, error } = await supabase
      .from("patients")
      .select(`
        id,
        status,
        date_of_birth,
        phone,
        emergency_contact,
        notes,
        users (
          id,
          name,
          email
        )
      `)
      .eq("psychologist_id", psychologistId)
      .order("status", { ascending: false })
      .order("users(name)", { ascending: true })

    if (error) throw error

    return data.map((patient) => ({
      id: patient.id,
      name: patient.users.name,
      email: patient.users.email,
      status: patient.status,
      dateOfBirth: patient.date_of_birth,
      phone: patient.phone,
      emergencyContact: patient.emergency_contact,
      notes: patient.notes,
    }))
  } catch (error) {
    console.error("Erro ao buscar pacientes:", error)
    throw error
  }
}

// Função para buscar um paciente específico (lado do servidor)
export async function getPatient(patientId: string) {
  const supabase = createServerComponentClient<Database>({ cookies })

  try {
    const { data, error } = await supabase
      .from("patients")
      .select(`
        id,
        status,
        date_of_birth,
        phone,
        emergency_contact,
        notes,
        users (
          id,
          name,
          email
        )
      `)
      .eq("id", patientId)
      .single()

    if (error) throw error

    return {
      id: data.id,
      name: data.users.name,
      email: data.users.email,
      status: data.status,
      dateOfBirth: data.date_of_birth,
      phone: data.phone,
      emergencyContact: data.emergency_contact,
      notes: data.notes,
    }
  } catch (error) {
    console.error("Erro ao buscar paciente:", error)
    throw error
  }
}

// Função para atualizar um paciente (lado do cliente)
export async function updatePatient(patientId: string, patientData: Partial<PatientData>) {
  const supabase = createSupabaseClient()

  try {
    // Atualizar na tabela users
    if (patientData.name || patientData.email) {
      const updateData: any = {}
      if (patientData.name) updateData.name = patientData.name
      if (patientData.email) updateData.email = patientData.email

      const { error: userError } = await supabase.from("users").update(updateData).eq("id", patientId)

      if (userError) throw userError
    }

    // Atualizar na tabela patients
    const updateData: any = {}
    if (patientData.dateOfBirth !== undefined) updateData.date_of_birth = patientData.dateOfBirth || null
    if (patientData.phone !== undefined) updateData.phone = patientData.phone || null
    if (patientData.emergencyContact !== undefined) updateData.emergency_contact = patientData.emergencyContact || null
    if (patientData.notes !== undefined) updateData.notes = patientData.notes || null

    if (Object.keys(updateData).length > 0) {
      const { error: patientError } = await supabase.from("patients").update(updateData).eq("id", patientId)

      if (patientError) throw patientError
    }

    return { success: true }
  } catch (error) {
    console.error("Erro ao atualizar paciente:", error)
    throw error
  }
}

// Função para ativar/desativar um paciente (lado do cliente)
export async function togglePatientStatus(patientId: string, active: boolean) {
  const supabase = createSupabaseClient()

  try {
    const { error } = await supabase
      .from("patients")
      .update({ status: active ? "active" : "inactive" })
      .eq("id", patientId)

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error("Erro ao alterar status do paciente:", error)
    throw error
  }
}
