import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")

    if (!supabaseUrl || !supabaseServiceKey) {
      if (!supabaseUrl) console.error("[recover-password] Variável ausente: SUPABASE_URL")
      if (!supabaseServiceKey) console.error("[recover-password] Variável ausente: SUPABASE_SERVICE_ROLE_KEY")
      return new Response(
        JSON.stringify({ error: "Erro de configuração interna do servidor." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const body = await req.json()
    const action = body.action || "request"

    // Ação para excluir a própria conta autenticada com segurança total
    if (action === "delete_account") {
      const authHeader = req.headers.get("Authorization")
      if (!authHeader) {
        return new Response(
          JSON.stringify({ error: "Sessão não autorizada." }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )
      }

      const supabaseUserClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
      })

      const { data: userData, error: userErr } = await supabaseUserClient.auth.getUser()
      if (userErr || !userData?.user) {
        return new Response(
          JSON.stringify({ error: "Não foi possível validar o usuário autenticado." }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )
      }

      const uid = userData.user.id

      // Remover todos os registros vinculados ao usuário antes de excluir o usuário no Auth
      await supabaseAdmin.from("goal_contributions").delete().eq("user_id", uid)
      await supabaseAdmin.from("financial_goals").delete().eq("user_id", uid)
      await supabaseAdmin.from("transactions").delete().eq("user_id", uid)
      await supabaseAdmin.from("budgets").delete().eq("user_id", uid)
      await supabaseAdmin.from("bank_connections").delete().eq("user_id", uid)
      await supabaseAdmin.from("financial_diagnosis").delete().eq("user_id", uid)
      await supabaseAdmin.from("profiles").delete().eq("id", uid)

      const { error: delAuthErr } = await supabaseAdmin.auth.admin.deleteUser(uid)
      if (delAuthErr) {
        return new Response(
          JSON.stringify({ error: delAuthErr.message || "Erro ao excluir usuário." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )
      }

      return new Response(
        JSON.stringify({ ok: true, message: "Sua conta e todos os seus dados foram excluídos com sucesso." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const rawEmail = (body.email || "").trim().toLowerCase()

    if (!rawEmail || !rawEmail.includes("@")) {
      return new Response(
        JSON.stringify({ error: "Informe um endereço de e-mail válido." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Buscar perfil correspondente ao e-mail cadastrado
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, email")
      .ilike("email", rawEmail)
      .maybeSingle()

    let targetUserId = profile?.id || null
    let targetName = profile?.full_name || "Usuária"

    if (!targetUserId) {
      // Fallback: procurar direto na listagem de auth.users
      const { data: usersList } = await supabaseAdmin.auth.admin.listUsers({ perPage: 200 })
      const foundUser = usersList?.users?.find(
        (u) => (u.email || "").toLowerCase() === rawEmail
      )
      if (foundUser) {
        targetUserId = foundUser.id
        targetName = (foundUser.user_metadata?.full_name as string) || "Usuária"
      }
    }

    if (!targetUserId) {
      return new Response(
        JSON.stringify({
          error: "Não encontramos nenhuma conta cadastrada com este e-mail no PurplePiggy.",
        }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    if (action === "request") {
      // Gerar código numérico de 6 dígitos válido por 15 minutos
      const code = String(Math.floor(100000 + Math.random() * 900000))
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString()

      // Invalidar códigos anteriores desse e-mail
      await supabaseAdmin
        .from("password_reset_codes")
        .update({ used: true })
        .ilike("email", rawEmail)
        .eq("used", false)

      await supabaseAdmin.from("password_reset_codes").insert({
        email: rawEmail,
        code,
        expires_at: expiresAt,
        used: false,
      })

      // Disparar também o e-mail oficial do Supabase Auth (caso o limite SMTP permita)
      const redirectTo = body.redirectTo || "https://localhost/redefinir-senha?mode=recovery"
      const { error: smtpError } = await supabaseAdmin.auth.resetPasswordForEmail(rawEmail, {
        redirectTo,
      })

      return new Response(
        JSON.stringify({
          ok: true,
          email: rawEmail,
          fullName: targetName,
          emailSent: !smtpError,
          recoveryCode: code,
          expiresInMinutes: 15,
          message: !smtpError
            ? "Enviamos o link de redefinição para o seu e-mail e geramos seu código de verificação."
            : "Código de verificação gerado para redefinição imediata.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    if (action === "verify_and_reset") {
      const code = String(body.code || "").trim()
      const newPassword = String(body.newPassword || "")

      if (!code || code.length < 6) {
        return new Response(
          JSON.stringify({ error: "Informe o código de 6 dígitos enviado para seu e-mail." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )
      }

      if (!newPassword || newPassword.length < 6) {
        return new Response(
          JSON.stringify({ error: "A nova senha deve ter pelo menos 6 caracteres." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )
      }

      const { data: resetRecord } = await supabaseAdmin
        .from("password_reset_codes")
        .select("*")
        .ilike("email", rawEmail)
        .eq("code", code)
        .eq("used", false)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!resetRecord) {
        // Tentar também verificar caso o usuário tenha digitado um token OTP nativo do Supabase Auth
        const { data: otpData, error: otpErr } = await supabaseAdmin.auth.verifyOtp({
          email: rawEmail,
          token: code,
          type: "recovery",
        })
        if (otpErr || !otpData?.user) {
          return new Response(
            JSON.stringify({
              error: "Código inválido ou expirado. Solicite um novo código e tente novamente.",
            }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          )
        }
      }

      // Atualizar a senha do usuário no Supabase Auth usando privilégio Admin
      const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
        password: newPassword,
      })

      if (updateErr) {
        return new Response(
          JSON.stringify({ error: updateErr.message || "Erro ao atualizar a senha." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )
      }

      if (resetRecord) {
        await supabaseAdmin
          .from("password_reset_codes")
          .update({ used: true })
          .eq("id", resetRecord.id)
      }

      return new Response(
        JSON.stringify({
          ok: true,
          message: "Sua senha foi redefinida com sucesso! Você já pode entrar com a nova senha.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    return new Response(
      JSON.stringify({ error: "Ação inválida." }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message || "Erro interno ao processar solicitação." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
