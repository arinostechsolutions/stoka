# Como Corrigir o Erro "Password contains unescaped characters"

## Problema

A senha do MongoDB contém caracteres especiais (como `#`, `@`, `:`, etc.) que precisam ser codificados na URL de conexão.

## Solução

### Opção 1: Codificar a Senha Manualmente

Sua senha atual: `231120Ml#`

Caracteres que precisam ser codificados:
- `#` → `%23`
- `@` → `%40`
- `:` → `%3A`
- `/` → `%2F`
- `?` → `%3F`
- `&` → `%26`
- `=` → `%3D`

**Sua senha codificada:** `231120Ml%23`

**String de conexão corrigida:**
```
mongodb+srv://holkzdevops:231120Ml%23@stoka.xlekssj.mongodb.net/?appName=stoka
```

### Opção 2: Usar uma Ferramenta Online

1. Acesse: https://www.urlencoder.org/
2. Cole sua senha: `231120Ml#`
3. Clique em "Encode"
4. Copie o resultado
5. Substitua na string de conexão

### Opção 3: Usar JavaScript (Node.js)

```javascript
encodeURIComponent('231120Ml#')
// Resultado: '231120Ml%23'
```

## Configuração no Railway

No Railway, configure a variável `MONGODB_URI` com a string codificada:

```
MONGODB_URI=mongodb+srv://holkzdevops:231120Ml%23@stoka.xlekssj.mongodb.net/?appName=stoka
```

## Verificação

Após configurar:
1. Faça um **Redeploy** no Railway
2. Verifique os logs novamente
3. O erro deve desaparecer

## Dica de Segurança

Para evitar problemas futuros, considere:
- Usar uma senha sem caracteres especiais
- Ou sempre codificar caracteres especiais na string de conexão

