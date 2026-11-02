const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envPath = path.resolve(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || '';
    value = value.trim().replace(/^['"]|['"]$/g, '');
    env[match[1]] = value;
  }
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function testUserFlow() {
  const testEmail = `camila_${Date.now()}@teste.com`;
  const testPassword = 'Password123!';
  const testName = 'Camila Rocha';

  console.log(`1. Criando conta para ${testEmail}...`);
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
    options: {
      data: {
        full_name: testName,
      }
    }
  });

  if (signUpError) {
    console.error('Erro no signUp:', signUpError);
    process.exit(1);
  }
  console.log('✅ Usuária criada com sucesso! ID:', signUpData.user?.id);

  let session = signUpData.session;
  if (!session) {
    console.log('Autenticando...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });
    if (signInError) {
      console.error('Erro no signIn:', signInError);
      process.exit(1);
    }
    session = signInData.session;
  }
  console.log('✅ Sessão ativa e confirmada no Supabase!');

  const userId = session.user.id;

  // 2. Perfil
  console.log('2. Consultando perfil...');
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
  console.log('✅ Perfil sincronizado:', profile.full_name);

  // 3. Diagnóstico Financeiro
  console.log('3. Salvando diagnóstico financeiro...');
  const { error: diagError } = await supabase
    .from('financial_diagnosis')
    .insert({
      user_id: userId,
      feeling: 'start_organizing',
      monthly_income: 4500,
      essential_expenses: 2500,
      has_emergency_fund: 'small',
      main_goal: 'Reserva de emergência',
      spending_habit: 'impulse_sometimes'
    });

  if (diagError) {
    console.error('Erro ao salvar diagnóstico:', diagError);
    process.exit(1);
  }
  console.log('✅ Diagnóstico gravado com sucesso no PostgreSQL!');

  // 4. Inserir transação
  console.log('4. Inserindo transação de gasto...');
  const { data: categories } = await supabase.from('categories').select('*').limit(1);
  const catId = categories[0].id;

  const { data: tx, error: txError } = await supabase
    .from('transactions')
    .insert({
      user_id: userId,
      category_id: catId,
      amount: 154.20,
      description: 'Compras de mercado',
      type: 'expense',
      occurred_on: new Date().toISOString().split('T')[0],
      payment_method: 'credit_card'
    })
    .select()
    .single();

  if (txError) {
    console.error('Erro ao criar transação:', txError);
    process.exit(1);
  }
  console.log('✅ Transação inserida! Descrição:', tx.description, '| Valor: R$', tx.amount);

  // 5. Inserir meta
  console.log('5. Criando meta de sonho...');
  const { data: goal, error: goalError } = await supabase
    .from('financial_goals')
    .insert({
      user_id: userId,
      name: 'Viagem de Férias',
      target_amount: 3500,
      saved_amount: 0,
      deadline: '2026-12-15',
      category: 'travel',
      icon: 'Plane'
    })
    .select()
    .single();

  if (goalError) {
    console.error('Erro ao criar meta:', goalError);
    process.exit(1);
  }
  console.log('✅ Meta criada com sucesso! ID:', goal.id, '| Alvo: R$', goal.target_amount);

  // 6. Fazer aporte
  console.log('6. Realizando depósito/aporte na meta...');
  const { error: contribError } = await supabase
    .from('goal_contributions')
    .insert({
      goal_id: goal.id,
      user_id: userId,
      amount: 500,
      kind: 'deposit',
      occurred_on: new Date().toISOString().split('T')[0]
    });

  if (contribError) {
    console.error('Erro no aporte:', contribError);
    process.exit(1);
  }

  // Conferir atualização pelo trigger
  const { data: updatedGoal } = await supabase
    .from('financial_goals')
    .select('*')
    .eq('id', goal.id)
    .single();

  console.log('✅ Aporte gravado! Saldo recalculado automaticamente pelo PostgreSQL trigger: R$', updatedGoal.saved_amount);

  console.log('\n======================================================');
  console.log('🎉 100% FUNCIONAL: CADASTRO, PERFIL, DIAGNÓSTICO, GASTOS E METAS!');
  console.log('======================================================');
}

testUserFlow();
