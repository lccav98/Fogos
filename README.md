# Sistema Automatizado de Planejamento de Fogos

Base doutrinaria: **MC-5.60** (4a Ed / 2025) + **CE 5.80 DAMEPLAN** (2a Ed / 2025)
Exercito Brasileiro / COTER

**Link publico:** https://lccav98.github.io/Fogos

## Funcionalidades

- Entrada de coordenadas **UTM** (principal), Geografico (decimal/DMS) e **Polar**
- Conversao automatica UTM <-> Lat/Lon (WGS-84)
- Selecao automatica de **meios habilitados** por alcance e efeito
- **Tipos de municao** recomendados por material e efeito (MC-5.60 + DAMEPLAN)
- **Identificacao do lancador** pelo codigo de concentracao (Anexo B MC-5.60)
- Calculo de distancia (Haversine) e azimute entre meios e alvos
- Resumo executivo do Plano de Fogos em tabela consolidada

## Instalacao e uso local

```bash
npm install
npm run dev
```

Acesse em: http://localhost:5173

## Publicar no GitHub Pages

```bash
# Primeira vez: conectar ao repositorio remoto
git init
git add .
git commit -m "inicial"
git branch -M main
git remote add origin https://github.com/lccav98/Fogos.git
git push -u origin main

# Publicar no GitHub Pages
npm install
npm run deploy
```

Apos o deploy, ativar GitHub Pages:
- Settings -> Pages -> Branch: gh-pages -> / (root) -> Save

Link final: https://lccav98.github.io/Fogos

## Atualizacoes futuras

Para publicar uma nova versao apos alteracoes:

```bash
git add .
git commit -m "atualizacao"
git push
npm run deploy
```

## Referencias normativas

- MC-5.60 Planejamento e Coordenacao de Fogos, 4a Ed, 2025 (PortCOTER 545/2025)
- CE 5.80 Dados Medios de Planejamento Escolar (DAMEPLAN), 2a Ed, 2025
