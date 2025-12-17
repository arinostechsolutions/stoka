# Stoka - Controle de Estoque Simples

Sistema de controle de estoque moderno, mobile-first e extremamente simples para pequenos lojistas.

## 🚀 Tecnologias

- **Next.js 14+** (App Router)
- **TypeScript**
- **MongoDB** com Mongoose
- **NextAuth** para autenticação
- **Tailwind CSS** + **shadcn/ui**
- **React Query** (TanStack Query)
- **Zod** para validação

## 📋 Funcionalidades

- ✅ Autenticação (login/cadastro)
- ✅ Dashboard com visão geral
- ✅ CRUD completo de produtos
- ✅ Movimentações (entrada/saída/ajuste)
- ✅ Alertas de estoque baixo
- ✅ Interface mobile-first
- ✅ Performance otimizada

## 🛠️ Instalação

1. Clone o repositório
2. Instale as dependências:

```bash
npm install
```

3. Configure as variáveis de ambiente:

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
# Database (OBRIGATÓRIO)
MONGODB_URI=mongodb://localhost:27017/stoka

# NextAuth Configuration
# NEXTAUTH_URL é opcional em desenvolvimento, obrigatório em produção
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here-change-in-production
```

**Importante:** 
- `NEXTAUTH_SECRET` é **OBRIGATÓRIA** - gere uma chave secreta forte (use `openssl rand -base64 32` ou https://generate-secret.vercel.app/32)
- Sem `NEXTAUTH_SECRET`, a autenticação não funcionará e você verá erros JWT
- `NEXTAUTH_URL` é opcional em desenvolvimento, mas obrigatória em produção
- Veja `ENV_SETUP.md` para mais detalhes e exemplos

4. Execute o servidor de desenvolvimento:

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

## 📦 Deploy

O projeto está pronto para deploy no Railway. Configure as variáveis de ambiente no painel do Railway.

## 🎨 Design

- Mobile-first
- UI limpa e moderna
- Animações leves
- Alto contraste
- Tipografia legível

## 📝 Licença

MIT

