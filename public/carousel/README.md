# Carrossel de Imagens

Para adicionar imagens ao carrossel da landing page:

1. Coloque suas imagens nesta pasta (`public/carousel/`)
2. Atualize o array `carouselImages` no arquivo `app/landing.tsx`

Exemplo:
```typescript
const carouselImages = [
  {
    src: '/carousel/imagem1.jpg',
    alt: 'Descrição da imagem 1',
    title: 'Título opcional',
    description: 'Descrição opcional'
  },
  {
    src: '/carousel/imagem2.jpg',
    alt: 'Descrição da imagem 2'
  }
]
```

O carrossel só será exibido quando houver pelo menos uma imagem no array.

