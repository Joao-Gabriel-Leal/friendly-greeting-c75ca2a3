import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const developerEmail = 'desenvolvimento@anadem.com.br'
    const developerPassword = '123456'

    // Check if developer already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existingDeveloper = existingUsers?.users?.find(u => u.email === developerEmail)

    if (existingDeveloper) {
      // Update role to developer if not already
      const { data: existingRole } = await supabaseAdmin
        .from('user_roles')
        .select('role')
        .eq('user_id', existingDeveloper.id)
        .single()

      if (existingRole?.role !== 'developer') {
        await supabaseAdmin
          .from('user_roles')
          .update({ role: 'developer' })
          .eq('user_id', existingDeveloper.id)
        
        console.log('Developer role updated for existing user')
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Developer account already exists' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create developer user
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: developerEmail,
      password: developerPassword,
      email_confirm: true,
      user_metadata: {
        name: 'Desenvolvedor',
        setor: 'Tecnologia da Informação'
      }
    })

    if (createError) {
      console.error('Error creating developer:', createError)
      throw createError
    }

    console.log('Developer user created:', newUser.user?.id)

    // Update the role from 'user' (default from trigger) to 'developer'
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .update({ role: 'developer' })
      .eq('user_id', newUser.user?.id)

    if (roleError) {
      console.error('Error updating role:', roleError)
      // Try insert if update fails
      await supabaseAdmin
        .from('user_roles')
        .upsert({ 
          user_id: newUser.user?.id, 
          role: 'developer' 
        }, { onConflict: 'user_id' })
    }

    console.log('Developer account created successfully')

    return new Response(
      JSON.stringify({ success: true, message: 'Developer account created successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
