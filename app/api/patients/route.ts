import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/app/lib/supabase/server-actions"

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      )
    }

    // Check if user is a psychologist
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("user_type")
      .eq("id", user.id)
      .single()

    if (userError || !userData || userData.user_type !== "psicologo") {
      return NextResponse.json(
        { error: "Apenas psicólogos podem cadastrar pacientes" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, email, phone, dateOfBirth, emergencyContact, notes } = body

    if (!name || !email) {
      return NextResponse.json(
        { error: "Nome e e-mail são obrigatórios" },
        { status: 400 }
      )
    }

    // Gerar uma senha temporária
    const tempPassword = Math.random().toString(36).slice(-8)

    // Criar usuário no Auth com metadata
    const { data: authData, error: createUserError } = await supabase.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        name,
        user_type: "paciente"
      }
    })

    if (createUserError) {
      return NextResponse.json(
        { error: createUserError.message },
        { status: 400 }
      )
    }

    // Criar registro na tabela users com o mesmo tipo do metadata
    const { error: userInsertError } = await supabase
      .from("users")
      .insert({
        id: authData.user.id,
        name,
        email,
        user_type: authData.user.user_metadata.user_type
      })

    if (userInsertError) {
      return NextResponse.json(
        { error: userInsertError.message },
        { status: 400 }
      )
    }

    // Criar registro na tabela patients
    const { data: patientData, error: patientError } = await supabase
      .from("patients")
      .insert({
        id: authData.user.id,
        psychologist_id: user.id,
        phone,
        date_of_birth: dateOfBirth,
        emergency_contact: emergencyContact,
        notes,
        status: "active",
      })
      .select()
      .single()

    if (patientError) {
      return NextResponse.json(
        { error: patientError.message },
        { status: 400 }
      )
    }

    // Criar notificação para o psicólogo
    const { error: notificationError } = await supabase
      .from("notifications")
      .insert({
        recipient_id: user.id,
        type: "patient",
        title: "Novo Paciente",
        message: `O paciente ${name} foi cadastrado com sucesso.`,
        reference_id: patientData.id,
      })

    if (notificationError) {
      console.error("Error creating notification:", notificationError)
    }

    return NextResponse.json(patientData)
  } catch (error) {
    console.error("Error creating patient:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const user = await getUser()

    if (!user || user.role !== "psychologist") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const supabase = await createSupabaseServerClient()

    // Buscar pacientes do psicólogo
    const { data: patients, error } = await supabase
      .from("patients")
      .select(`
        id,
        status,
        phone,
        date_of_birth,
        emergency_contact,
        notes,
        created_at,
        users (
          name,
          email
        )
      `)
      .eq("psychologist_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    // Formatar os dados dos pacientes
    const formattedPatients = patients.map(patient => ({
      id: patient.id,
      name: patient.users.name,
      email: patient.users.email,
      phone: patient.phone,
      dateOfBirth: patient.date_of_birth,
      emergencyContact: patient.emergency_contact,
      notes: patient.notes,
      status: patient.status,
      createdAt: patient.created_at,
    }))

    return NextResponse.json(formattedPatients)
  } catch (error) {
    console.error("Error fetching patients:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
