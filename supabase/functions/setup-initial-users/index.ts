import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface UserSetup {
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'user' | 'professional';
  setor?: string;
}

interface SpecialtySetup {
  name: string;
  description: string;
  duration_minutes: number;
}

interface ProfessionalSetup {
  name: string;
  email: string;
  specialty: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const results: any[] = [];

    // 1. Create specialties
    const specialties: SpecialtySetup[] = [
      { name: "Massagem", description: "Massagem terapêutica e relaxante", duration_minutes: 60 },
      { name: "Psicólogo", description: "Atendimento psicológico", duration_minutes: 50 },
      { name: "Nutricionista", description: "Consulta nutricional", duration_minutes: 45 }
    ];

    const specialtyIds: Record<string, string> = {};

    for (const specialty of specialties) {
      const { data: existing } = await supabaseAdmin
        .from("specialties")
        .select("id")
        .eq("name", specialty.name)
        .maybeSingle();

      if (!existing) {
        const { data: created, error } = await supabaseAdmin
          .from("specialties")
          .insert({
            name: specialty.name,
            description: specialty.description,
            duration_minutes: specialty.duration_minutes,
            active: true
          })
          .select("id")
          .single();

        if (error) {
          console.error(`Error creating specialty ${specialty.name}:`, error);
        } else {
          specialtyIds[specialty.name] = created.id;
          console.log(`Specialty created: ${specialty.name}`);
          results.push({ type: 'specialty', name: specialty.name, status: 'created' });
        }
      } else {
        specialtyIds[specialty.name] = existing.id;
        console.log(`Specialty already exists: ${specialty.name}`);
        results.push({ type: 'specialty', name: specialty.name, status: 'exists' });
      }
    }

    // 2. Create users
    const usersToCreate: UserSetup[] = [
      {
        email: "joao.leal@aiatecnologia.com.br",
        password: "123456",
        name: "João Leal",
        role: "user",
        setor: "TI"
      },
      {
        email: "adilio.silva@aiatecnologia.com.br", 
        password: "123456",
        name: "Adílio Silva",
        role: "professional",
        setor: "Profissional"
      },
      {
        email: "igo.batista@aiatecnologia.com.br",
        password: "123456",
        name: "Igo Batista",
        role: "admin",
        setor: "Administração"
      },
      {
        email: "maria.souza@ficticio.com",
        password: "123456",
        name: "Maria Souza",
        role: "professional",
        setor: "Profissional"
      },
      {
        email: "carlos.pereira@ficticio.com",
        password: "123456",
        name: "Carlos Pereira",
        role: "professional",
        setor: "Profissional"
      }
    ];

    const userIds: Record<string, string> = {};

    for (const user of usersToCreate) {
      console.log(`Processing user: ${user.email}`);

      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      let authUser = existingUsers?.users?.find(u => u.email === user.email);

      if (!authUser) {
        const { data: authData, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
          email: user.email,
          password: user.password,
          email_confirm: true,
          user_metadata: {
            name: user.name,
            setor: user.setor
          }
        });

        if (createUserError) {
          console.error(`Error creating user ${user.email}:`, createUserError);
          results.push({ type: 'user', email: user.email, status: 'error', error: createUserError.message });
          continue;
        }
        authUser = authData.user;
        console.log(`Auth user created for ${user.email}`);
      } else {
        console.log(`Auth user already exists for ${user.email}`);
      }

      const userId = authUser.id;
      userIds[user.email] = userId;

      // Create profile if not exists
      const { data: existingProfile } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (!existingProfile) {
        const { error: profileError } = await supabaseAdmin
          .from("profiles")
          .insert({
            user_id: userId,
            name: user.name,
            email: user.email,
            setor: user.setor
          });

        if (profileError) {
          console.error(`Error creating profile for ${user.email}:`, profileError);
        } else {
          console.log(`Profile created for ${user.email}`);
        }
      }

      // Update/create user role
      const { data: existingRole } = await supabaseAdmin
        .from("user_roles")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (!existingRole) {
        const { error: roleError } = await supabaseAdmin
          .from("user_roles")
          .insert({ 
            user_id: userId, 
            role: user.role 
          });

        if (roleError) {
          console.error(`Error creating role for ${user.email}:`, roleError);
        } else {
          console.log(`Role ${user.role} assigned to ${user.email}`);
        }
      } else {
        const { error: roleUpdateError } = await supabaseAdmin
          .from("user_roles")
          .update({ role: user.role })
          .eq("user_id", userId);

        if (roleUpdateError) {
          console.error(`Error updating role for ${user.email}:`, roleUpdateError);
        }
      }

      console.log(`User ${user.email} setup complete with role ${user.role}`);
      results.push({ type: 'user', email: user.email, status: 'success', role: user.role });
    }

    // 3. Create professionals and link to specialties
    const professionals: ProfessionalSetup[] = [
      { name: "Adílio Silva", email: "adilio.silva@aiatecnologia.com.br", specialty: "Massagem" },
      { name: "Maria Souza", email: "maria.souza@ficticio.com", specialty: "Psicólogo" },
      { name: "Carlos Pereira", email: "carlos.pereira@ficticio.com", specialty: "Nutricionista" }
    ];

    for (const prof of professionals) {
      const userId = userIds[prof.email];
      const specialtyId = specialtyIds[prof.specialty];

      // Check if professional exists
      const { data: existingProf } = await supabaseAdmin
        .from("professionals")
        .select("id")
        .eq("email", prof.email)
        .maybeSingle();

      let professionalId: string;

      if (existingProf) {
        professionalId = existingProf.id;
        // Update with user_id if needed
        await supabaseAdmin
          .from("professionals")
          .update({ user_id: userId })
          .eq("id", existingProf.id);
        console.log(`Professional already exists: ${prof.name}`);
      } else {
        const { data: created, error } = await supabaseAdmin
          .from("professionals")
          .insert({
            name: prof.name,
            email: prof.email,
            user_id: userId,
            active: true
          })
          .select("id")
          .single();

        if (error) {
          console.error(`Error creating professional ${prof.name}:`, error);
          continue;
        }
        professionalId = created.id;
        console.log(`Professional created: ${prof.name}`);
      }

      // Link professional to specialty
      if (specialtyId) {
        const { data: existingLink } = await supabaseAdmin
          .from("professional_specialties")
          .select("id")
          .eq("professional_id", professionalId)
          .eq("specialty_id", specialtyId)
          .maybeSingle();

        if (!existingLink) {
          await supabaseAdmin
            .from("professional_specialties")
            .insert({
              professional_id: professionalId,
              specialty_id: specialtyId
            });
          console.log(`Linked ${prof.name} to ${prof.specialty}`);
        }
      }

      // Add available days (Monday to Friday, 8h-18h)
      const { data: existingDays } = await supabaseAdmin
        .from("available_days")
        .select("id")
        .eq("professional_id", professionalId);

      if (!existingDays || existingDays.length === 0) {
        const daysToInsert = [];
        for (let day = 1; day <= 5; day++) {
          daysToInsert.push({
            professional_id: professionalId,
            day_of_week: day,
            start_time: "08:00",
            end_time: "18:00"
          });
        }
        await supabaseAdmin.from("available_days").insert(daysToInsert);
        console.log(`Available days created for ${prof.name}`);
      }

      results.push({ type: 'professional', name: prof.name, specialty: prof.specialty, status: 'success' });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Initial data setup completed",
        results 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error in setup-initial-users:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
