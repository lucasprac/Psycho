import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/app/lib/supabase/server-actions"
import { getUser } from "@/lib/auth"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getUser()

    if (!user || user.role !== "psychologist") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const supabase = await createSupabaseServerClient()

    // Verificar se o usuário é um psicólogo ou o próprio paciente
    const { data: patient, error } = await supabase
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
      .eq("id", params.id)
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    if (!patient) {
      return NextResponse.json(
        { error: "Patient not found" },
        { status: 404 }
      )
    }

    // Verificar se o paciente pertence ao psicólogo
    if (patient.psychologist_id !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const formattedPatient = {
      id: patient.id,
      name: patient.users.name,
      email: patient.users.email,
      phone: patient.phone,
      dateOfBirth: patient.date_of_birth,
      emergencyContact: patient.emergency_contact,
      notes: patient.notes,
      status: patient.status,
      createdAt: patient.created_at,
    }

    return NextResponse.json(formattedPatient)
  } catch (error) {
    console.error("Error fetching patient:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getUser()

    if (!user || user.role !== "psychologist") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, email, phone, dateOfBirth, emergencyContact, notes, status } = body

    const supabase = await createSupabaseServerClient()

    // Verificar se o usuário é um psicólogo ou o próprio paciente
    const { data: patient, error: patientError } = await supabase
      .from("patients")
      .select("psychologist_id")
      .eq("id", params.id)
      .single()

    if (patientError) {
      return NextResponse.json(
        { error: patientError.message },
        { status: 400 }
      )
    }

    if (!patient) {
      return NextResponse.json(
        { error: "Patient not found" },
        { status: 404 }
      )
    }

    // Verificar se o paciente pertence ao psicólogo
    if (patient.psychologist_id !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Atualizar dados do usuário
    const { error: userError } = await supabase
      .from("users")
      .update({
        name,
        email,
      })
      .eq("id", params.id)

    if (userError) {
      return NextResponse.json(
        { error: userError.message },
        { status: 400 }
      )
    }

    // Atualizar dados do paciente
    const { data: updatedPatient, error: updateError } = await supabase
      .from("patients")
      .update({
        phone,
        date_of_birth: dateOfBirth,
        emergency_contact: emergencyContact,
        notes,
        status,
      })
      .eq("id", params.id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 400 }
      )
    }

    return NextResponse.json(updatedPatient)
  } catch (error) {
    console.error("Error updating patient:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getUser()

    if (!user || user.role !== "psychologist") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const supabase = await createSupabaseServerClient()

    // Verificar se o paciente pertence a este psicólogo
    const { data: patient, error: patientError } = await supabase
      .from("patients")
      .select("psychologist_id")
      .eq("id", params.id)
      .single()

    if (patientError) {
      return NextResponse.json(
        { error: patientError.message },
        { status: 400 }
      )
    }

    if (!patient) {
      return NextResponse.json(
        { error: "Patient not found" },
        { status: 404 }
      )
    }

    if (patient.psychologist_id !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Desativar o paciente em vez de excluir
    const { error: updateError } = await supabase
      .from("patients")
      .update({ status: "inactive" })
      .eq("id", params.id)

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deactivating patient:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
