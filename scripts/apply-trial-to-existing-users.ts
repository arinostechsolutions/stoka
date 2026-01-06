/**
 * Script para aplicar trial de 7 dias a todos os usuários existentes
 * que ainda não possuem campos de subscription preenchidos.
 * 
 * Para executar:
 * npx ts-node scripts/apply-trial-to-existing-users.ts
 * 
 * Ou adicione no package.json:
 * "scripts": {
 *   "apply-trial": "npx ts-node scripts/apply-trial-to-existing-users.ts"
 * }
 * 
 * E execute: npm run apply-trial
 */

import mongoose from 'mongoose'
import dotenv from 'dotenv'

// Carregar variáveis de ambiente
dotenv.config({ path: '.env.local' })

// Schema do User (simplificado para o script)
const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  subscriptionStatus: String,
  plan: String,
  trialEndsAt: Date,
  stripeCustomerId: String,
  stripeSubscriptionId: String,
}, { timestamps: true })

const User = mongoose.models.User || mongoose.model('User', UserSchema)

// Configurações do trial
const TRIAL_DAYS = 7
const DEFAULT_PLAN = 'premium' // Dar acesso total durante o trial

async function applyTrialToExistingUsers() {
  try {
    // Conectar ao MongoDB
    const mongoUri = process.env.MONGODB_URI
    
    if (!mongoUri) {
      console.error('❌ MONGODB_URI não está configurada no .env.local')
      process.exit(1)
    }

    console.log('🔌 Conectando ao MongoDB...')
    await mongoose.connect(mongoUri)
    console.log('✅ Conectado ao MongoDB')

    // Calcular data de fim do trial (7 dias a partir de agora)
    const trialEndsAt = new Date()
    trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_DAYS)

    // Buscar usuários sem subscription
    const usersWithoutSubscription = await User.find({
      $or: [
        { subscriptionStatus: { $exists: false } },
        { subscriptionStatus: null },
        { subscriptionStatus: '' },
      ]
    })

    console.log(`\n📊 Encontrados ${usersWithoutSubscription.length} usuários sem assinatura\n`)

    if (usersWithoutSubscription.length === 0) {
      console.log('✅ Todos os usuários já possuem assinatura configurada!')
      await mongoose.disconnect()
      return
    }

    // Listar usuários que serão atualizados
    console.log('Usuários que receberão trial:')
    console.log('─'.repeat(50))
    usersWithoutSubscription.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (${user.name})`)
    })
    console.log('─'.repeat(50))

    // Aplicar trial a todos
    const result = await User.updateMany(
      {
        $or: [
          { subscriptionStatus: { $exists: false } },
          { subscriptionStatus: null },
          { subscriptionStatus: '' },
        ]
      },
      {
        $set: {
          subscriptionStatus: 'trialing',
          plan: DEFAULT_PLAN,
          trialEndsAt: trialEndsAt,
        }
      }
    )

    console.log(`\n✅ Trial aplicado com sucesso!`)
    console.log(`   - Usuários atualizados: ${result.modifiedCount}`)
    console.log(`   - Plano: ${DEFAULT_PLAN}`)
    console.log(`   - Trial termina em: ${trialEndsAt.toLocaleDateString('pt-BR')}`)

    // Desconectar
    await mongoose.disconnect()
    console.log('\n🔌 Desconectado do MongoDB')

  } catch (error) {
    console.error('❌ Erro ao executar script:', error)
    process.exit(1)
  }
}

// Executar
applyTrialToExistingUsers()

