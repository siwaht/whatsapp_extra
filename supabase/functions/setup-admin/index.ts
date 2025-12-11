import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
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

    const { data: adminRole } = await supabaseAdmin
      .from("roles")
      .select("id")
      .eq("name", "admin")
      .maybeSingle();

    if (!adminRole) {
      throw new Error("Admin role not found");
    }

    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(
      (u) => u.email === "cc@siwaht.com"
    );

    if (existingUser) {
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        existingUser.id,
        {
          password: "Hola173!",
          email_confirm: true,
        }
      );

      if (updateError) {
        throw updateError;
      }

      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .update({
          role_id: adminRole.id,
          full_name: "Admin User",
        })
        .eq("id", existingUser.id);

      if (profileError) {
        console.error("Profile update error:", profileError);
      }

      return new Response(
        JSON.stringify({ 
          message: "Admin user updated successfully",
          userId: existingUser.id 
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: user, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: "cc@siwaht.com",
      password: "Hola173!",
      email_confirm: true,
    });

    if (createError) {
      throw createError;
    }

    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({
        role_id: adminRole.id,
        full_name: "Admin User",
      })
      .eq("id", user.user.id);

    if (profileError) {
      console.error("Profile update error:", profileError);
    }

    return new Response(
      JSON.stringify({ 
        message: "Admin user created successfully",
        userId: user.user.id 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});