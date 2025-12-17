# Como Verificar e Corrigir o MONGODB_URI

## Erro: "Invalid scheme, expected connection string to start with mongodb:// or mongodb+srv://"

Este erro significa que a string de conexão não está no formato correto.

## Verificações no Railway

### 1. Verificar se a variável está configurada

No Railway:
1. Vá em **"Variables"**
2. Procure por `MONGODB_URI`
3. Certifique-se de que está definida

### 2. Verificar o formato da string

A string deve começar com:
- `mongodb://` (para conexões padrão)
- `mongodb+srv://` (para MongoDB Atlas)

**Formato correto:**
```
mongodb+srv://usuario:senha@cluster.mongodb.net/database?options
```

### 3. Verificar se há espaços

A string NÃO deve ter:
- Espaços no início
- Espaços no final
- Quebras de linha

**Errado:**
```
MONGODB_URI= mongodb+srv://...
MONGODB_URI=mongodb+srv://... 
```

**Correto:**
```
MONGODB_URI=mongodb+srv://usuario:senha@cluster.mongodb.net/database
```

### 4. Verificar se a senha está codificada

Se a senha contém caracteres especiais, eles devem estar codificados:
- `#` → `%23`
- `@` → `%40`
- `:` → `%3A`
- `/` → `%2F`

**Exemplo:**
```
Senha original: 231120Ml#
Senha codificada: 231120Ml%23

String completa:
mongodb+srv://holkzdevops:231120Ml%23@stoka.xlekssj.mongodb.net/?appName=stoka
```

## String de Conexão Correta para seu Caso

Baseado na sua configuração, a string deve ser:

```
MONGODB_URI=mongodb+srv://holkzdevops:231120Ml%23@stoka.xlekssj.mongodb.net/?appName=stoka
```

**OU** se quiser especificar o banco de dados:

```
MONGODB_URI=mongodb+srv://holkzdevops:231120Ml%23@stoka.xlekssj.mongodb.net/stoka?appName=stoka
```

## Passos para Corrigir

1. **No Railway, vá em "Variables"**
2. **Encontre ou crie `MONGODB_URI`**
3. **Cole a string completa** (sem espaços):
   ```
   mongodb+srv://holkzdevops:231120Ml%23@stoka.xlekssj.mongodb.net/stoka?appName=stoka
   ```
4. **Salve**
5. **Faça um Redeploy**

## Verificação

Após configurar, verifique nos logs:
- Não deve aparecer mais o erro "Invalid scheme"
- Deve aparecer "Connected to MongoDB" (se houver log de sucesso)

## Problemas Comuns

### Problema: String cortada
**Solução:** Certifique-se de copiar a string completa, sem quebras de linha

### Problema: Espaços extras
**Solução:** Remova todos os espaços antes e depois da string

### Problema: Senha não codificada
**Solução:** Codifique caracteres especiais na senha usando `%XX`

### Problema: Variável não está sendo lida
**Solução:** 
- Verifique se o nome da variável é exatamente `MONGODB_URI` (maiúsculas)
- Faça um redeploy após alterar

