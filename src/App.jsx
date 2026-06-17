import { useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "./supabaseClient";

// =============================================================================
// BASE DOUTRINARIA - DAMEPLAN CE 5.80 (2a Ed / 2025) + MC-5.60 (4a Ed / 2025)
// =============================================================================

// Tipos de municao por material (MC-5.60 + DAMEPLAN 4.1)
const MUNICAO = {
  "Mrt 60 mm": [
    { sigla: "HE",   nome: "Explosiva (HE)",           efeitos: ["Neutralizacao","Inquietacao","Interdicao"] },
    { sigla: "Fum",  nome: "Fumigena (WP/HC)",          efeitos: ["Supressao","Fumigena"] },
    { sigla: "Ilum", nome: "Iluminativa",               efeitos: ["Iluminacao"] },
  ],
  "Mrt 81 mm": [
    { sigla: "HE",   nome: "Explosiva (HE)",            efeitos: ["Neutralizacao","Inquietacao","Interdicao"] },
    { sigla: "Fum",  nome: "Fumigena (WP/HC)",          efeitos: ["Supressao","Fumigena"] },
    { sigla: "Ilum", nome: "Iluminativa",               efeitos: ["Iluminacao"] },
    { sigla: "TF",   nome: "Treinamento/Fumigena cor",  efeitos: ["Marcacao"] },
  ],
  "Mrt 120 mm": [
    { sigla: "HE",       nome: "Explosiva HE convencional (alc 6.600m)", efeitos: ["Neutralizacao","Inquietacao","Interdicao","Barragem","Destruicao"] },
    { sigla: "HE-PR",    nome: "HE pre-raiada (alc 8.500m)",             efeitos: ["Neutralizacao","Destruicao"] },
    { sigla: "HE-Asst",  nome: "HE assistida (alc 13.000m)",             efeitos: ["Neutralizacao","Interdicao","Destruicao"] },
    { sigla: "Fum",      nome: "Fumigena (WP/HC)",                       efeitos: ["Supressao","Fumigena"] },
    { sigla: "Ilum",     nome: "Iluminativa (area 1.500m / alc 5.500m)", efeitos: ["Iluminacao"] },
  ],
  "Obus 105 mm AR": [
    { sigla: "HE",    nome: "Explosiva HE (M1/M107)",        efeitos: ["Neutralizacao","Destruicao","Barragem","Saturacao","Interdicao","Inquietacao"] },
    { sigla: "Fum",   nome: "Fumigena (WP M60 / HC M84)",   efeitos: ["Supressao","Fumigena"] },
    { sigla: "Ilum",  nome: "Iluminativa (area 1.000m / alc 8.500m)", efeitos: ["Iluminacao"] },
    { sigla: "HEDP",  nome: "HEDP Duplo Proposito",          efeitos: ["Destruicao","Neutralizacao"] },
    { sigla: "BE",    nome: "Bomblets / Submunitions",       efeitos: ["Saturacao","Neutralizacao"] },
    { sigla: "ICM",   nome: "Municao de Efeito Combinado",   efeitos: ["Saturacao","Destruicao"] },
  ],
  "Obus 105 mm L118": [
    { sigla: "HE",       nome: "Explosiva HE comum",           efeitos: ["Neutralizacao","Destruicao","Barragem","Saturacao","Interdicao","Inquietacao"] },
    { sigla: "HE-Asst",  nome: "HE assistida / RAP (alc 21km)", efeitos: ["Neutralizacao","Interdicao","Destruicao"] },
    { sigla: "Fum",      nome: "Fumigena (WP/HC)",             efeitos: ["Supressao","Fumigena"] },
    { sigla: "Ilum",     nome: "Iluminativa (area 1.000m / alc 8.500m)", efeitos: ["Iluminacao"] },
    { sigla: "HEDP",     nome: "HEDP Duplo Proposito",         efeitos: ["Destruicao","Neutralizacao"] },
    { sigla: "ICM",      nome: "Municao de Efeito Combinado",  efeitos: ["Saturacao","Destruicao"] },
  ],
  "Obus 155 mm AR": [
    { sigla: "HE",        nome: "Explosiva HE (M107/M795)",    efeitos: ["Neutralizacao","Destruicao","Barragem","Saturacao","Interdicao","Inquietacao"] },
    { sigla: "HE-Asst",   nome: "HE assistida / RAP (alc 19,3km)", efeitos: ["Neutralizacao","Interdicao","Destruicao"] },
    { sigla: "Fum",       nome: "Fumigena (M110/M825 WP)",    efeitos: ["Supressao","Fumigena"] },
    { sigla: "Ilum M118", nome: "Iluminativa M118 (area 1.000m / alc 11.600m)", efeitos: ["Iluminacao"] },
    { sigla: "Ilum M485", nome: "Iluminativa M485 (area 2.000m / alc 14.000m)", efeitos: ["Iluminacao"] },
    { sigla: "ICM/DPICM", nome: "ICM / DPICM Duplo Proposito", efeitos: ["Saturacao","Destruicao"] },
    { sigla: "Copperhead", nome: "Copperhead (guiada a laser)", efeitos: ["Destruicao"] },
    { sigla: "Excalibur",  nome: "Excalibur GPS (alta precisao)", efeitos: ["Destruicao","Neutralizacao"] },
  ],
  "Obus 155 mm AP": [
    { sigla: "HE",        nome: "Explosiva HE (M107/M795)",    efeitos: ["Neutralizacao","Destruicao","Barragem","Saturacao","Interdicao","Inquietacao"] },
    { sigla: "HE-Asst",   nome: "HE assistida / RAP (alc 23,5km)", efeitos: ["Neutralizacao","Interdicao","Destruicao"] },
    { sigla: "Fum",       nome: "Fumigena (WP M825)",          efeitos: ["Supressao","Fumigena"] },
    { sigla: "Ilum M485", nome: "Iluminativa M485 (area 2.000m / alc 14.000m)", efeitos: ["Iluminacao"] },
    { sigla: "ICM/DPICM", nome: "ICM / DPICM Duplo Proposito", efeitos: ["Saturacao","Destruicao"] },
    { sigla: "Excalibur",  nome: "Excalibur GPS (alta precisao)", efeitos: ["Destruicao","Neutralizacao"] },
    { sigla: "Copperhead", nome: "Copperhead (guiada a laser)", efeitos: ["Destruicao"] },
  ],
  "LMF SS30 127mm": [
    { sigla: "HE-Frag",  nome: "HE Fragmentacao (padrao)",     efeitos: ["Neutralizacao","Saturacao","Supressao"] },
    { sigla: "Thermo",   nome: "Termobárica",                  efeitos: ["Destruicao","Saturacao"] },
    { sigla: "Fum",      nome: "Fumigena",                     efeitos: ["Supressao","Fumigena"] },
  ],
  "LMF SS40 180mm": [
    { sigla: "HE-Frag",  nome: "HE Fragmentacao (padrao)",     efeitos: ["Neutralizacao","Saturacao","Supressao"] },
    { sigla: "Thermo",   nome: "Termobarica",                  efeitos: ["Destruicao","Saturacao"] },
  ],
  "LMF SS60 300mm": [
    { sigla: "HE-Frag",  nome: "HE Fragmentacao (padrao)",     efeitos: ["Neutralizacao","Saturacao","Supressao","Interdicao"] },
    { sigla: "ICM",      nome: "Submunitions / ICM",           efeitos: ["Saturacao","Destruicao"] },
    { sigla: "Thermo",   nome: "Termobarica",                  efeitos: ["Destruicao","Saturacao"] },
  ],
};

// Dados dos meios (DAMEPLAN CE 5.80 - Tab 4.1.1 / 4.1.9)
const MEIOS = {
  "Mrt 60 mm": {
    tipo: "morteiro", calibre: 60,
    alcMin: 200, alcMax: 4300,
    areaEficaz: { larg: 20, prof: 15 },
    efeitos: ["Neutralizacao","Inquietacao","Interdicao","Supressao","Fumigena","Iluminacao"],
    cadencia: { min1: 15, min10: 80, hr1: 150 },
    frente_barragem: null,
    obs: "Mrt leve - organico de pelotao de fuzileiros"
  },
  "Mrt 81 mm": {
    tipo: "morteiro", calibre: 81,
    alcMin: 200, alcMax: 6000,
    areaEficaz: { larg: 30, prof: 20 },
    efeitos: ["Neutralizacao","Inquietacao","Interdicao","Supressao","Fumigena","Iluminacao","Marcacao"],
    cadencia: { min1: 15, min10: 80, hr1: 200 },
    frente_barragem: null,
    obs: "Mrt medio - organico Cia/Btl"
  },
  "Mrt 120 mm": {
    tipo: "morteiro", calibre: 120,
    alcMin: 500, alcMax: 6600,
    alcMaxAsst: 13000,
    areaEficaz: { larg: 40, prof: 30 },
    efeitos: ["Neutralizacao","Interdicao","Inquietacao","Barragem","Destruicao","Supressao","Fumigena","Iluminacao"],
    cadencia: { min1: 15, min10: 60, hr1: 150 },
    frente_barragem: 200,
    obs: "Mrt pesado 4.2 - Pel Mrt P. HE: 6.600m / PR: 8.500m / Asst: 13.000m"
  },
  "Obus 105 mm AR": {
    tipo: "artilharia", calibre: 105,
    alcMin: 1500, alcMax: 11300, alcUtil: 9500,
    areaEficaz: { larg: 50, prof: 30, bia_larg: 200, bia_prof: 100 },
    efeitos: ["Neutralizacao","Interdicao","Barragem","Saturacao","Supressao","Destruicao","Inquietacao","Fumigena","Iluminacao"],
    cadencia: { min1: 4, min10: 40, hr1: 120 },
    frente_barragem: 200,
    org: { pecas_bia: 6, bias_gp: 3 },
    obs: "M101/M102 AR. Setor: 45 graus"
  },
  "Obus 105 mm L118": {
    tipo: "artilharia", calibre: 105,
    alcMin: 2500, alcMax: 17200, alcUtil: 15200,
    alcMaxAsst: 21000,
    areaEficaz: { larg: 50, prof: 30, bia_larg: 200, bia_prof: 100 },
    efeitos: ["Neutralizacao","Interdicao","Barragem","Saturacao","Supressao","Destruicao","Inquietacao","Fumigena","Iluminacao"],
    cadencia: { min1: 6, min10: 60, hr1: 180 },
    frente_barragem: 200,
    org: { pecas_bia: 6, bias_gp: 3 },
    obs: "Light Gun AR. Setor: 360 graus. Com Mun Asst: 21 km"
  },
  "Obus 155 mm AR": {
    tipo: "artilharia", calibre: 155,
    alcMin: 2000, alcMax: 15000, alcUtil: 12700,
    alcMaxAsst: 19300,
    areaEficaz: { larg: 50, prof: 20, bia_larg: 300, bia_prof: 130 },
    efeitos: ["Neutralizacao","Interdicao","Barragem","Saturacao","Supressao","Destruicao","Inquietacao","Fumigena","Iluminacao"],
    cadencia: { min1: 2, min10: 30, hr1: 60 },
    frente_barragem: 300,
    org: { pecas_bia: 6, bias_gp: 3 },
    obs: "M114 AR. Mun Asst: 19,3 km"
  },
  "Obus 155 mm AP": {
    tipo: "artilharia", calibre: 155,
    alcMin: 2000, alcMax: 18000, alcUtil: 15500,
    alcMaxAsst: 23500,
    areaEficaz: { larg: 50, prof: 20, bia_larg: 300, bia_prof: 130 },
    efeitos: ["Neutralizacao","Interdicao","Barragem","Saturacao","Supressao","Destruicao","Inquietacao","Fumigena","Iluminacao"],
    cadencia: { min1: 2, min10: 30, hr1: 60 },
    frente_barragem: 300,
    org: { pecas_bia: 6, bias_gp: 3 },
    obs: "M109 A3 AP. Setor 360 graus. Mun Asst: 23,5 km"
  },
  "LMF SS30 127mm": {
    tipo: "foguete", calibre: 127,
    alcMin: 10100, alcMax: 30600,
    areaEficaz: { raio: 80, bia_larg: 1700, bia_prof: 740 },
    efeitos: ["Neutralizacao","Supressao","Saturacao","Destruicao","Fumigena"],
    cadencia: { min1: 32 },
    org: { pecas_bia: 6, bias_gp: 3 },
    obs: "SS30 127mm. Area eficaz Bia: 1.700x740m"
  },
  "LMF SS40 180mm": {
    tipo: "foguete", calibre: 180,
    alcMin: 13600, alcMax: 35600,
    areaEficaz: { raio: null, bia_larg: 1700, bia_prof: 740 },
    efeitos: ["Neutralizacao","Supressao","Saturacao","Destruicao"],
    cadencia: { min1: 16 },
    org: { pecas_bia: 6, bias_gp: 3 },
    obs: "SS40 180mm"
  },
  "LMF SS60 300mm": {
    tipo: "foguete", calibre: 300,
    alcMin: 20600, alcMax: 70700,
    areaEficaz: { raio: null, bia_larg: 3900, bia_prof: 2700 },
    efeitos: ["Neutralizacao","Supressao","Interdicao","Saturacao","Destruicao"],
    cadencia: { min1: 4 },
    org: { pecas_bia: 6, bias_gp: 3 },
    obs: "SS60 300mm"
  },
};

const EFEITOS = {
  "Neutralizacao":  { sigla: "N", cor: "#ea580c", desc: "Incapacitar temporariamente. >= 10% baixas. Ref: 18 tir/ha/min (105mm)." },
  "Destruicao":     { sigla: "D", cor: "#dc2626", desc: "Incapacitar permanentemente. >= 20% baixas + destruicao material." },
  "Supressao":      { sigla: "S", cor: "#d97706", desc: "Impedir observacao/movimento. Nao requer baixas." },
  "Interdicao":     { sigla: "I", cor: "#7c3aed", desc: "Negar uso de area/rota. Ref: 120 tir/ha/h (105mm)." },
  "Inquietacao":    { sigla: "Q", cor: "#0284c7", desc: "Dificultar descanso/reorganizacao. Ref: 60 tir/ha/h." },
  "Saturacao":      { sigla: "T", cor: "#059669", desc: "Volume maximo sobre area. Ref: 16 tir/ha (105mm)." },
  "Barragem":       { sigla: "B", cor: "#be185d", desc: "Cortina continua sobre linha. DAMEPLAN 4.1.9." },
  "Fumigena":       { sigla: "F", cor: "#6b7280", desc: "Ocultacao / cegamento. Coordenacao DAMEPLAN 4.1.6." },
  "Iluminacao":     { sigla: "L", cor: "#ca8a04", desc: "Iluminacao do campo de batalha. DAMEPLAN 4.1.8." },
};

// Sistema de designacao de concentracoes (MC-5.60 Anexo B)
const ESCALOES = [
  { sigla: "CEx", nome: "Corpo de Exercito" },
  { sigla: "DE",  nome: "Divisao de Exercito" },
  { sigla: "Bda", nome: "Brigada" },
  { sigla: "U",   nome: "Unidade (Batalhao/Regimento)" },
  { sigla: "SU",  nome: "Subunidade (Cia/Esqd/Pel)" },
];

// Identificacao de quem lanca a concentracao (MC-5.60 Anexo B)
function identificarLancador(designacao) {
  if (!designacao) return null;
  var partes = designacao.trim().split(/\s+/);
  var letras = partes[0] || "";
  var numero = partes[1] ? parseInt(partes[1]) : NaN;
  var resultado = { letras: letras, numero: numero, escalao: null, elemento: null, tipoMeio: null };

  // Identificar escalao pelo comprimento das letras
  if (letras.length === 1) resultado.escalao = "CEx ou DE (letra unica)";
  else if (letras.length === 2) resultado.escalao = "Brigada ou DE (duas letras)";
  else resultado.escalao = "Elemento especifico";

  // Numero par = Art Cmp / impar = Mrt ou outros sistemas
  if (!isNaN(numero)) {
    resultado.tipoMeio = numero % 2 === 0 ? "Artilharia de Campanha (numero par)" : "Morteiro / outro sistema (numero impar)";
    // Faixa de numeros (DAMEPLAN Quadro B-2 e B-3)
    if (numero >= 1 && numero <= 2999) resultado.elemento = "COT GAC / CCAF Bda";
    else if (numero >= 3000 && numero <= 3999) resultado.elemento = "1o Btl/Rgt subordinado";
    else if (numero >= 4000 && numero <= 4999) resultado.elemento = "2o Btl/Rgt subordinado";
    else if (numero >= 5000 && numero <= 5999) resultado.elemento = "3o Btl/Rgt subordinado";
    else if (numero >= 6000 && numero <= 7999) resultado.elemento = "Btl complementar";
    // Dentro do batalhao
    var modulo = numero % 1000;
    if (modulo >= 1 && modulo <= 199) resultado.subElemento = "Celula de Fogos Btl/Rgt";
    else if (modulo >= 200 && modulo <= 299) resultado.subElemento = "1a SU (Cia/Esqd)";
    else if (modulo >= 300 && modulo <= 399) resultado.subElemento = "2a SU (Cia/Esqd)";
    else if (modulo >= 400 && modulo <= 499) resultado.subElemento = "3a SU (Cia/Esqd)";
    else if (modulo >= 500 && modulo <= 599) resultado.subElemento = "4a SU (Cia/Esqd)";
  }
  return resultado;
}

// Selecionar municao compativel com o efeito desejado
function municipaoRecomendada(material, efeito) {
  var lista = MUNICAO[material];
  if (!lista) return [];
  return lista.filter(function(m) { return m.efeitos.includes(efeito); });
}

// ============================================================
// UTILITARIOS GEOGRAFICOS - UTM / GEO / POLAR
// ============================================================

// --- UTM para Lat/Lon (WGS-84, algoritmo Bowring/Karney) ---
function utmToLatLon(zona, hemi, easting, northing) {
  // Constantes WGS-84
  var a  = 6378137.0;
  var f  = 1 / 298.257223563;
  var b  = a * (1 - f);
  var e2 = 1 - (b*b)/(a*a);
  var e  = Math.sqrt(e2);
  var k0 = 0.9996;

  var x = easting  - 500000.0;
  var y = hemi === "S" ? northing - 10000000.0 : northing;

  var lon0 = ((zona - 1) * 6 - 180 + 3) * Math.PI / 180;

  var M  = y / k0;
  var mu = M / (a * (1 - e2/4 - 3*e2*e2/64 - 5*e2*e2*e2/256));

  var e1  = (1 - Math.sqrt(1 - e2)) / (1 + Math.sqrt(1 - e2));
  var phi = mu
    + (3*e1/2 - 27*e1*e1*e1/32) * Math.sin(2*mu)
    + (21*e1*e1/16 - 55*e1*e1*e1*e1/32) * Math.sin(4*mu)
    + (151*e1*e1*e1/96) * Math.sin(6*mu)
    + (1097*e1*e1*e1*e1/512) * Math.sin(8*mu);

  var N1   = a / Math.sqrt(1 - e2 * Math.sin(phi)*Math.sin(phi));
  var T1   = Math.tan(phi) * Math.tan(phi);
  var C1   = e2/(1-e2) * Math.cos(phi)*Math.cos(phi);
  var R1   = a*(1-e2) / Math.pow(1 - e2*Math.sin(phi)*Math.sin(phi), 1.5);
  var D    = x / (N1 * k0);

  var lat = phi - (N1 * Math.tan(phi) / R1) * (
    D*D/2
    - (5 + 3*T1 + 10*C1 - 4*C1*C1 - 9*e2/(1-e2)) * D*D*D*D/24
    + (61 + 90*T1 + 298*C1 + 45*T1*T1 - 252*e2/(1-e2) - 3*C1*C1) * D*D*D*D*D*D/720
  );

  var lon = lon0 + (
    D
    - (1 + 2*T1 + C1) * D*D*D/6
    + (5 - 2*C1 + 28*T1 - 3*C1*C1 + 8*e2/(1-e2) + 24*T1*T1) * D*D*D*D*D/120
  ) / Math.cos(phi);

  return { lat: lat * 180/Math.PI, lon: lon * 180/Math.PI };
}

// Parsear string UTM nos formatos militares e civis
// Aceita: "23K 456789 7612345"  |  "23 S 456789 7612345"  |  "456789 7612345 23S"
// Tambem aceita MGRS simplificado ou separado por espacos/virgulas
function parseUTM(str) {
  str = str.trim().toUpperCase().replace(/,/g, " ").replace(/\s+/g, " ");

  // Tenta formato: ZONA HEMI E N  (ex: "23 S 456789 7612345")
  var m1 = str.match(/^(\d{1,2})\s+([NS])\s+(\d{5,7})\s+(\d{6,8})$/);
  if (m1) return utmToLatLon(parseInt(m1[1]), m1[2], parseFloat(m1[3]), parseFloat(m1[4]));

  // Tenta formato: ZONA+LETRA_BANDA E N  (ex: "23K 456789 7612345")
  var m2 = str.match(/^(\d{1,2})([A-Z])\s+(\d{5,7})\s+(\d{6,8})$/);
  if (m2) {
    var banda = m2[2];
    var hemi = (banda >= "N") ? "N" : "S";
    return utmToLatLon(parseInt(m2[1]), hemi, parseFloat(m2[3]), parseFloat(m2[4]));
  }

  // Tenta formato: E N ZONA+HEMI  (ex: "456789 7612345 23S")
  var m3 = str.match(/^(\d{5,7})\s+(\d{6,8})\s+(\d{1,2})([A-Z])$/);
  if (m3) {
    var banda3 = m3[4];
    var hemi3 = (banda3 >= "N") ? "N" : "S";
    return utmToLatLon(parseInt(m3[3]), hemi3, parseFloat(m3[1]), parseFloat(m3[2]));
  }

  // Tenta formato campo militar BR: ZONA LETRA E(8d) N(8d)  sem espacos internos
  // ex: "23K45678976123456" ou com espaco "23K 45678976123456"
  var m4 = str.match(/^(\d{1,2})([A-Z])\s*(\d{5,7})\s*(\d{6,8})$/);
  if (m4) {
    var h4 = m4[2] >= "N" ? "N" : "S";
    return utmToLatLon(parseInt(m4[1]), h4, parseFloat(m4[3]), parseFloat(m4[4]));
  }

  return null;
}

// Validar se o resultado UTM e razoavel
function utmValido(pos) {
  if (!pos) return false;
  if (isNaN(pos.lat) || isNaN(pos.lon)) return false;
  if (pos.lat < -90 || pos.lat > 90) return false;
  if (pos.lon < -180 || pos.lon > 180) return false;
  return true;
}

// Converter Lat/Lon de volta para UTM (para exibicao)
function latLonToUTM(lat, lon) {
  var a  = 6378137.0;
  var f  = 1/298.257223563;
  var b  = a*(1-f);
  var e2 = 1-(b*b)/(a*a);
  var k0 = 0.9996;

  var zona = Math.floor((lon + 180)/6) + 1;
  var lon0 = ((zona - 1)*6 - 180 + 3) * Math.PI/180;
  var latR = lat * Math.PI/180;
  var lonR = lon * Math.PI/180;

  var N = a/Math.sqrt(1-e2*Math.sin(latR)*Math.sin(latR));
  var T = Math.tan(latR)*Math.tan(latR);
  var C = e2/(1-e2)*Math.cos(latR)*Math.cos(latR);
  var A = Math.cos(latR)*(lonR-lon0);
  var M = a*(
    (1-e2/4-3*e2*e2/64-5*e2*e2*e2/256)*latR
    -(3*e2/8+3*e2*e2/32+45*e2*e2*e2/1024)*Math.sin(2*latR)
    +(15*e2*e2/256+45*e2*e2*e2/1024)*Math.sin(4*latR)
    -(35*e2*e2*e2/3072)*Math.sin(6*latR)
  );

  var E = 500000 + k0*N*(A+(1-T+C)*A*A*A/6+(5-18*T+T*T+72*C-58*e2/(1-e2))*A*A*A*A*A/120);
  var Nv= k0*(M+N*Math.tan(latR)*(A*A/2+(5-T+9*C+4*C*C)*A*A*A*A/24+(61-58*T+T*T+600*C-330*e2/(1-e2))*A*A*A*A*A*A/720));
  if (lat < 0) Nv += 10000000;

  // Letra da banda de latitude
  var bandas = "CDEFGHJKLMNPQRSTUVWX";
  var idx = Math.floor((lat+80)/8);
  idx = Math.max(0, Math.min(19, idx));
  var banda = bandas[idx];

  return {
    zona: zona, banda: banda, hemi: lat >= 0 ? "N" : "S",
    E: Math.round(E), N: Math.round(Nv),
    str: zona + banda + " " + Math.round(E) + " " + Math.round(Nv)
  };
}

// --- GEO (decimal / DMS) ---
function dmsToDecimal(str) {
  str = str.trim();
  if (/^-?\d+\.?\d*$/.test(str)) return parseFloat(str);
  var neg = /[SwO]/i.test(str) || str.startsWith("-");
  var nums = str.match(/\d+\.?\d*/g);
  if (!nums) return NaN;
  var dec = parseFloat(nums[0]);
  if (nums[1]) dec += parseFloat(nums[1]) / 60;
  if (nums[2]) dec += parseFloat(nums[2]) / 3600;
  return neg ? -dec : dec;
}

function parseCoord(latStr, lonStr) {
  return { lat: dmsToDecimal(latStr), lon: dmsToDecimal(lonStr) };
}

function haversineKm(c1, c2) {
  var R = 6371;
  var dLat = (c2.lat - c1.lat) * Math.PI / 180;
  var dLon = (c2.lon - c1.lon) * Math.PI / 180;
  var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(c1.lat*Math.PI/180) * Math.cos(c2.lat*Math.PI/180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function azimuth(c1, c2) {
  var dLon = (c2.lon - c1.lon) * Math.PI / 180;
  var lat1 = c1.lat * Math.PI / 180;
  var lat2 = c2.lat * Math.PI / 180;
  var y = Math.sin(dLon) * Math.cos(lat2);
  var x = Math.cos(lat1)*Math.sin(lat2) - Math.sin(lat1)*Math.cos(lat2)*Math.cos(dLon);
  return ((Math.atan2(y, x) * 180 / Math.PI) + 360) % 360;
}

function polarToLatLon(origin, distKm, azDeg) {
  var R = 6371;
  var az = azDeg * Math.PI / 180;
  var lat1 = origin.lat * Math.PI / 180;
  var lon1 = origin.lon * Math.PI / 180;
  var d = distKm / R;
  var lat2 = Math.asin(Math.sin(lat1)*Math.cos(d) + Math.cos(lat1)*Math.sin(d)*Math.cos(az));
  var lon2 = lon1 + Math.atan2(Math.sin(az)*Math.sin(d)*Math.cos(lat1), Math.cos(d)-Math.sin(lat1)*Math.sin(lat2));
  return { lat: lat2 * 180 / Math.PI, lon: lon2 * 180 / Math.PI };
}

// ============================================================
// COMPONENTES BASE
// ============================================================
function Badge({ cor, children }) {
  return (
    <span style={{ background: cor, color: "#fff", padding: "2px 8px", borderRadius: 4,
      fontSize: 11, fontWeight: 700, marginRight: 4, display: "inline-block" }}>
      {children}
    </span>
  );
}

function Card({ title, accent, children }) {
  return (
    <div style={{ border: "2px solid " + (accent || "#374151"), borderRadius: 8,
      background: "#111827", marginBottom: 12, overflow: "hidden" }}>
      {title && (
        <div style={{ background: accent || "#374151", padding: "6px 14px",
          fontWeight: 700, fontSize: 13, color: "#fff", letterSpacing: 1 }}>
          {title}
        </div>
      )}
      <div style={{ padding: 14 }}>{children}</div>
    </div>
  );
}

function FInput({ label, value, onChange, placeholder }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <label style={{ display: "block", fontSize: 11, color: "#9ca3af", marginBottom: 3, fontWeight: 600 }}>
        {label}
      </label>
      <input type="text" value={value}
        onChange={function(e) { onChange(e.target.value); }}
        placeholder={placeholder}
        style={{ width: "100%", background: "#1f2937", border: "1px solid #374151",
          borderRadius: 6, padding: "7px 10px", color: "#f9fafb", fontSize: 13,
          outline: "none", boxSizing: "border-box" }} />
    </div>
  );
}

function FSelect({ label, value, onChange, options }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <label style={{ display: "block", fontSize: 11, color: "#9ca3af", marginBottom: 3, fontWeight: 600 }}>
        {label}
      </label>
      <select value={value} onChange={function(e) { onChange(e.target.value); }}
        style={{ width: "100%", background: "#1f2937", border: "1px solid #374151",
          borderRadius: 6, padding: "7px 10px", color: "#f9fafb", fontSize: 13,
          outline: "none", boxSizing: "border-box" }}>
        {options.map(function(o) { return <option key={o.value} value={o.value}>{o.label}</option>; })}
      </select>
    </div>
  );
}

// ============================================================
// FORMULARIO DE MEIO
// ============================================================
function FormMeio({ idx, meio, onChange, onRemove }) {
  var [modo, setModo] = useState("utm");
  var [utmErro, setUtmErro] = useState("");

  var btnS = function(ativo) {
    return { flex: 1, padding: "5px 0", cursor: "pointer", fontSize: 11, fontWeight: 700,
      border: "1px solid #374151", borderRadius: 5,
      background: ativo ? "#1d4ed8" : "#1f2937", color: "#f9fafb" };
  };
  var materialOpts = [{ value: "", label: "-- selecionar --" }].concat(
    Object.keys(MEIOS).map(function(k) { return { value: k, label: k }; })
  );
  var escalaoOpts = [{ value: "", label: "-- escalao lancador --" }].concat(
    ESCALOES.map(function(e) { return { value: e.sigla, label: e.sigla + " - " + e.nome }; })
  );

  // Preview UTM -> LatLon
  var utmPreview = null;
  if (modo === "utm" && meio.utmStr) {
    var p = parseUTM(meio.utmStr);
    if (utmValido(p)) {
      utmPreview = p;
      var utm2 = latLonToUTM(p.lat, p.lon);
      utmPreview.utmStr = utm2.str;
    }
  }

  return (
    <Card title={"Meio " + (idx+1) + " - " + (meio.nome || "(sem nome)")} accent="#1d4ed8">
      {/* Tabs de modo */}
      <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
        <button onClick={function() { setModo("utm"); setUtmErro(""); }} style={btnS(modo === "utm")}>UTM (principal)</button>
        <button onClick={function() { setModo("geo"); setUtmErro(""); }} style={btnS(modo === "geo")}>Geo (decimal/DMS)</button>
        <button onClick={function() { setModo("polar"); setUtmErro(""); }} style={btnS(modo === "polar")}>Polar</button>
      </div>

      {/* Identificacao e material */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <FInput label="Designacao do meio" value={meio.nome}
          onChange={function(v) { onChange(Object.assign({}, meio, { nome: v })); }}
          placeholder="Ex: GAC 105 - 1a Bia" />
        <FSelect label="Material" value={meio.material}
          onChange={function(v) { onChange(Object.assign({}, meio, { material: v })); }}
          options={materialOpts} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <FSelect label="Escalao lancador" value={meio.escalaoLancador}
          onChange={function(v) { onChange(Object.assign({}, meio, { escalaoLancador: v })); }}
          options={escalaoOpts} />
        <FInput label="Unidade responsavel" value={meio.unidade}
          onChange={function(v) { onChange(Object.assign({}, meio, { unidade: v })); }}
          placeholder="Ex: 1o GAC / 4a Bia" />
      </div>

      {/* Entrada UTM */}
      {modo === "utm" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 8 }}>
            <div>
              <FInput label="Coordenada UTM completa" value={meio.utmStr}
                onChange={function(v) {
                  onChange(Object.assign({}, meio, { utmStr: v }));
                  setUtmErro("");
                }}
                placeholder="23K 456789 7612345" />
            </div>
            <FInput label="Zona (se separada)" value={meio.utmZona}
              onChange={function(v) { onChange(Object.assign({}, meio, { utmZona: v })); }}
              placeholder="23" />
            <FInput label="Hemisferio" value={meio.utmHemi}
              onChange={function(v) { onChange(Object.assign({}, meio, { utmHemi: v })); }}
              placeholder="S" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <FInput label="E - Leste (m)" value={meio.utmE}
              onChange={function(v) { onChange(Object.assign({}, meio, { utmE: v })); }}
              placeholder="456789" />
            <FInput label="N - Norte (m)" value={meio.utmN}
              onChange={function(v) { onChange(Object.assign({}, meio, { utmN: v })); }}
              placeholder="7612345" />
          </div>
          <div style={{ fontSize: 10, color: "#6b7280", marginTop: -4, marginBottom: 6 }}>
            Use o campo UTM completa OU os campos separados (Zona + E + N + Hemisferio).
          </div>
          {utmPreview && (
            <div style={{ background: "#0a1a0e", border: "1px solid #15803d", borderRadius: 5,
              padding: "6px 10px", fontSize: 11, color: "#86efac" }}>
              Convertido: Lat {utmPreview.lat.toFixed(5)} / Lon {utmPreview.lon.toFixed(5)}
              <span style={{ color: "#6b7280", marginLeft: 8 }}>({utmPreview.utmStr})</span>
            </div>
          )}
          {utmErro && (
            <div style={{ background: "#7f1d1d", borderRadius: 5, padding: "4px 8px",
              fontSize: 11, color: "#fca5a5" }}>{utmErro}</div>
          )}
        </div>
      )}

      {/* Entrada GEO */}
      {modo === "geo" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <FInput label="Latitude (ex: -3.7219 ou 03 43 18 S)" value={meio.lat}
            onChange={function(v) { onChange(Object.assign({}, meio, { lat: v })); }}
            placeholder="-3.7219" />
          <FInput label="Longitude (ex: -40.3505 ou 40 21 02 W)" value={meio.lon}
            onChange={function(v) { onChange(Object.assign({}, meio, { lon: v })); }}
            placeholder="-40.3505" />
        </div>
      )}

      {/* Entrada POLAR */}
      {modo === "polar" && (
        <div>
          <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 6 }}>Polar a partir de ponto de referencia (UTM ou Geo):</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <FInput label="Ref UTM completa (ou Lat abaixo)" value={meio.refUtm}
              onChange={function(v) { onChange(Object.assign({}, meio, { refUtm: v })); }}
              placeholder="23K 456789 7612345" />
            <div />
            <FInput label="Ref Lat (se nao usar UTM)" value={meio.refLat}
              onChange={function(v) { onChange(Object.assign({}, meio, { refLat: v })); }} placeholder="-3.7" />
            <FInput label="Ref Lon" value={meio.refLon}
              onChange={function(v) { onChange(Object.assign({}, meio, { refLon: v })); }} placeholder="-40.3" />
            <FInput label="Distancia (km)" value={meio.polarDist}
              onChange={function(v) { onChange(Object.assign({}, meio, { polarDist: v })); }} placeholder="8.5" />
            <FInput label="Azimute (graus)" value={meio.polarAz}
              onChange={function(v) { onChange(Object.assign({}, meio, { polarAz: v })); }} placeholder="225" />
          </div>
        </div>
      )}

      <button onClick={onRemove} style={{ background: "#7f1d1d", border: "none", color: "#fca5a5",
        padding: "4px 14px", borderRadius: 5, cursor: "pointer", fontSize: 12, marginTop: 6 }}>
        Remover meio
      </button>
    </Card>
  );
}

// ============================================================
// FORMULARIO DE CONCENTRACAO
// ============================================================
function FormConc({ idx, conc, onChange, onRemove }) {
  var [modo, setModo] = useState("utm");

  var btnS = function(ativo) {
    return { flex: 1, padding: "5px 0", cursor: "pointer", fontSize: 11, fontWeight: 700,
      border: "1px solid #374151", borderRadius: 5,
      background: ativo ? "#065f46" : "#1f2937", color: "#f9fafb" };
  };
  var efeitoOpts = Object.keys(EFEITOS).map(function(k) {
    return { value: k, label: EFEITOS[k].sigla + " - " + k };
  });
  var escalaoOpts = [{ value: "", label: "-- escalao solicitante --" }].concat(
    ESCALOES.map(function(e) { return { value: e.sigla, label: e.sigla + " - " + e.nome }; })
  );

  // Preview UTM
  var utmPreview = null;
  if (modo === "utm" && conc.utmStr) {
    var p = parseUTM(conc.utmStr);
    if (utmValido(p)) {
      utmPreview = p;
      utmPreview.utmStr = latLonToUTM(p.lat, p.lon).str;
    }
  }

  var info = identificarLancador(conc.codigoDesig);

  return (
    <Card title={"Concentracao " + (idx+1) + " - " + (conc.designacao || "(sem designacao)")} accent="#065f46">
      {/* Tabs de modo */}
      <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
        <button onClick={function() { setModo("utm"); }} style={btnS(modo === "utm")}>UTM (principal)</button>
        <button onClick={function() { setModo("geo"); }} style={btnS(modo === "geo")}>Geo (decimal/DMS)</button>
        <button onClick={function() { setModo("polar"); }} style={btnS(modo === "polar")}>Polar</button>
      </div>

      {/* Identificacao e efeito */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <FInput label="Designacao do alvo (livre)" value={conc.designacao}
          onChange={function(v) { onChange(Object.assign({}, conc, { designacao: v })); }}
          placeholder="PC Ini / Artilharia Ini" />
        <FSelect label="Efeito desejado" value={conc.efeito}
          onChange={function(v) { onChange(Object.assign({}, conc, { efeito: v })); }}
          options={efeitoOpts} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        <FInput label="Codigo (Anx B MC-5.60 - ex: BB 3202)" value={conc.codigoDesig}
          onChange={function(v) { onChange(Object.assign({}, conc, { codigoDesig: v })); }}
          placeholder="BB 3202" />
        <FSelect label="Escalao solicitante" value={conc.escalaoSolicitante}
          onChange={function(v) { onChange(Object.assign({}, conc, { escalaoSolicitante: v })); }}
          options={escalaoOpts} />
        <FInput label="Elemento solicitante" value={conc.solicitante}
          onChange={function(v) { onChange(Object.assign({}, conc, { solicitante: v })); }}
          placeholder="Ex: 3a Cia / 1o Btl" />
      </div>
      {info && info.tipoMeio && (
        <div style={{ background: "#1e3a5f", borderRadius: 5, padding: "6px 10px", marginBottom: 8, fontSize: 11 }}>
          <span style={{ color: "#93c5fd", fontWeight: 700 }}>Anx B: </span>
          <span style={{ color: "#d1d5db" }}>
            {info.escalao}
            {info.elemento ? " | " + info.elemento : ""}
            {info.subElemento ? " | " + info.subElemento : ""}
            {" | " + info.tipoMeio}
          </span>
        </div>
      )}

      {/* Entrada UTM */}
      {modo === "utm" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 8 }}>
            <FInput label="Coordenada UTM completa do alvo" value={conc.utmStr}
              onChange={function(v) { onChange(Object.assign({}, conc, { utmStr: v })); }}
              placeholder="23K 456789 7612345" />
            <FInput label="Zona (se separada)" value={conc.utmZona}
              onChange={function(v) { onChange(Object.assign({}, conc, { utmZona: v })); }}
              placeholder="23" />
            <FInput label="Hemisferio" value={conc.utmHemi}
              onChange={function(v) { onChange(Object.assign({}, conc, { utmHemi: v })); }}
              placeholder="S" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <FInput label="E - Leste (m)" value={conc.utmE}
              onChange={function(v) { onChange(Object.assign({}, conc, { utmE: v })); }}
              placeholder="456789" />
            <FInput label="N - Norte (m)" value={conc.utmN}
              onChange={function(v) { onChange(Object.assign({}, conc, { utmN: v })); }}
              placeholder="7612345" />
          </div>
          <div style={{ fontSize: 10, color: "#6b7280", marginTop: -4, marginBottom: 6 }}>
            Use o campo UTM completa OU os campos separados (Zona + E + N + Hemisferio).
          </div>
          {utmPreview && (
            <div style={{ background: "#0a1a0e", border: "1px solid #15803d", borderRadius: 5,
              padding: "6px 10px", fontSize: 11, color: "#86efac" }}>
              Convertido: Lat {utmPreview.lat.toFixed(5)} / Lon {utmPreview.lon.toFixed(5)}
              <span style={{ color: "#6b7280", marginLeft: 8 }}>({utmPreview.utmStr})</span>
            </div>
          )}
        </div>
      )}

      {/* Entrada GEO */}
      {modo === "geo" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <FInput label="Latitude alvo" value={conc.lat}
            onChange={function(v) { onChange(Object.assign({}, conc, { lat: v })); }} placeholder="-3.6800" />
          <FInput label="Longitude alvo" value={conc.lon}
            onChange={function(v) { onChange(Object.assign({}, conc, { lon: v })); }} placeholder="-40.2500" />
        </div>
      )}

      {/* Entrada POLAR */}
      {modo === "polar" && (
        <div>
          <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 6 }}>Polar a partir de ponto de referencia (UTM ou Geo):</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <FInput label="Ref UTM completa (ou Lat abaixo)" value={conc.refUtm}
              onChange={function(v) { onChange(Object.assign({}, conc, { refUtm: v })); }}
              placeholder="23K 456789 7612345" />
            <div />
            <FInput label="Ref Lat (se nao usar UTM)" value={conc.refLat}
              onChange={function(v) { onChange(Object.assign({}, conc, { refLat: v })); }} placeholder="-3.7" />
            <FInput label="Ref Lon" value={conc.refLon}
              onChange={function(v) { onChange(Object.assign({}, conc, { refLon: v })); }} placeholder="-40.3" />
            <FInput label="Distancia (km)" value={conc.polarDist}
              onChange={function(v) { onChange(Object.assign({}, conc, { polarDist: v })); }} placeholder="5.0" />
            <FInput label="Azimute (graus)" value={conc.polarAz}
              onChange={function(v) { onChange(Object.assign({}, conc, { polarAz: v })); }} placeholder="45" />
          </div>
        </div>
      )}

      <FInput label="Descricao / natureza do alvo (opcional)" value={conc.descricao}
        onChange={function(v) { onChange(Object.assign({}, conc, { descricao: v })); }}
        placeholder="Secao de obuseiros / PC de batalhao / reserva Ini" />
      <button onClick={onRemove} style={{ background: "#7f1d1d", border: "none", color: "#fca5a5",
        padding: "4px 14px", borderRadius: 5, cursor: "pointer", fontSize: 12, marginTop: 4 }}>
        Remover concentracao
      </button>
    </Card>
  );
}

// ============================================================
// BLOCO DE MUNICAO RECOMENDADA
// ============================================================
function BlocoMunicao({ material, efeito }) {
  var muns = municipaoRecomendada(material, efeito);
  if (!muns || muns.length === 0) return null;
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ fontSize: 10, color: "#a78bfa", fontWeight: 700, marginBottom: 4 }}>
        MUNICAO RECOMENDADA PARA EFEITO "{efeito}":
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
        {muns.map(function(m) {
          return (
            <span key={m.sigla} style={{ background: "#1e1b4b", border: "1px solid #4c1d95",
              borderRadius: 4, padding: "3px 8px", fontSize: 11, color: "#c4b5fd" }}>
              <b>{m.sigla}</b> - {m.nome}
            </span>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// RESULTADO
// ============================================================
function Resultado({ resultado }) {
  if (!resultado) return null;
  var concs = resultado.concentracoes;

  return (
    <div>
      <div style={{ textAlign: "center", padding: "10px 0 16px", borderBottom: "1px solid #374151", marginBottom: 16 }}>
        <div style={{ fontSize: 17, fontWeight: 800, color: "#f9fafb", letterSpacing: 1 }}>
          PLANO DE FOGOS - RESULTADO AUTOMATICO
        </div>
        <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>
          MC-5.60 (4a Ed 2025) - CE 5.80 DAMEPLAN (2025)
        </div>
      </div>

      {concs.map(function(conc, i) {
        var ef = EFEITOS[conc.efeito] || EFEITOS["Neutralizacao"];
        var info = identificarLancador(conc.codigoDesig);
        return (
          <div key={i} style={{ marginBottom: 20 }}>
            {/* Cabecalho da concentracao */}
            <div style={{ background: "#1e3a5f", borderRadius: "8px 8px 0 0",
              padding: "8px 14px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontWeight: 800, color: "#93c5fd", fontSize: 14 }}>
                  {conc.codigoDesig ? conc.codigoDesig + " - " : ""}{conc.designacao}
                </div>
                {conc.descricao && (
                  <div style={{ color: "#6b7280", fontSize: 11 }}>{conc.descricao}</div>
                )}
              </div>
              <div style={{ textAlign: "right" }}>
                <Badge cor={ef.cor}>{ef.sigla} - {conc.efeito}</Badge>
                {conc.escalaoSolicitante && (
                  <div style={{ fontSize: 10, color: "#6b7280", marginTop: 3 }}>
                    Solicitante: {conc.escalaoSolicitante}
                    {conc.solicitante ? " / " + conc.solicitante : ""}
                  </div>
                )}
              </div>
            </div>

            <div style={{ background: "#111827", border: "1px solid #1e3a5f",
              borderTop: "none", borderRadius: "0 0 8px 8px", padding: 14 }}>

              {/* Identificacao automatica do lancador */}
              {info && info.tipoMeio && (
                <div style={{ background: "#0f172a", border: "1px solid #1e3a5f", borderRadius: 5,
                  padding: "8px 12px", marginBottom: 12 }}>
                  <div style={{ fontSize: 10, color: "#60a5fa", fontWeight: 700, marginBottom: 4 }}>
                    IDENTIFICACAO AUTOMATICA - CODIGO ANX B MC-5.60
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 6, fontSize: 11 }}>
                    <div><span style={{ color: "#6b7280" }}>Codigo: </span><b style={{ color: "#93c5fd" }}>{conc.codigoDesig}</b></div>
                    <div><span style={{ color: "#6b7280" }}>Escalao: </span><span style={{ color: "#d1d5db" }}>{info.escalao}</span></div>
                    {info.elemento && <div><span style={{ color: "#6b7280" }}>Elemento: </span><span style={{ color: "#d1d5db" }}>{info.elemento}</span></div>}
                    {info.subElemento && <div><span style={{ color: "#6b7280" }}>SubElem: </span><span style={{ color: "#d1d5db" }}>{info.subElemento}</span></div>}
                    <div><span style={{ color: "#6b7280" }}>Tipo meio: </span><span style={{ color: "#fbbf24" }}>{info.tipoMeio}</span></div>
                  </div>
                </div>
              )}

              {/* Posicao e efeito */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                <div style={{ background: "#1f2937", padding: "8px 12px", borderRadius: 6 }}>
                  <div style={{ fontSize: 10, color: "#6b7280" }}>POSICAO DO ALVO (UTM WGS-84)</div>
                  <div style={{ fontSize: 12, color: "#fbbf24", fontFamily: "monospace", fontWeight: 700 }}>
                    {latLonToUTM(conc.posAlvo.lat, conc.posAlvo.lon).str}
                  </div>
                  <div style={{ fontSize: 10, color: "#6b7280", fontFamily: "monospace", marginTop: 2 }}>
                    {conc.posAlvo.lat.toFixed(5) + " / " + conc.posAlvo.lon.toFixed(5)}
                  </div>
                </div>
                <div style={{ background: "#1f2937", padding: "8px 12px", borderRadius: 6 }}>
                  <div style={{ fontSize: 10, color: "#6b7280" }}>EFEITO DOUTRINARIO</div>
                  <div style={{ fontSize: 11, color: "#d1d5db" }}>{ef.desc}</div>
                </div>
              </div>

              {/* Meios habilitados */}
              {conc.meiosHabilitados.length === 0 ? (
                <div style={{ background: "#7f1d1d", padding: "10px 14px", borderRadius: 6,
                  color: "#fca5a5", fontSize: 13 }}>
                  NENHUM MEIO DISPONIVEL pode engajar este alvo com o efeito solicitado.
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#86efac", marginBottom: 8 }}>
                    {"MEIOS HABILITADOS (" + conc.meiosHabilitados.length + "):"}
                  </div>
                  {conc.meiosHabilitados.map(function(m, j) {
                    var dados = MEIOS[m.material];
                    var muns = municipaoRecomendada(m.material, conc.efeito);
                    return (
                      <div key={j} style={{ background: "#0f2918", border: "1px solid #15803d",
                        borderRadius: 6, padding: "10px 14px", marginBottom: 8 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div>
                            <div style={{ fontWeight: 700, color: "#86efac", fontSize: 13 }}>
                              {m.nome}
                              {m.escalaoLancador && (
                                <span style={{ fontWeight: 400, color: "#6b7280", fontSize: 11, marginLeft: 8 }}>
                                  [{m.escalaoLancador}{m.unidade ? " / " + m.unidade : ""}]
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: 11, color: "#6b7280", fontFamily: "monospace" }}>
                              {"UTM: " + latLonToUTM(m.posReal.lat, m.posReal.lon).str}
                            </div>
                            <div style={{ fontSize: 10, color: "#4b5563", fontFamily: "monospace" }}>
                              {"Geo: " + m.posReal.lat.toFixed(5) + " / " + m.posReal.lon.toFixed(5)}
                            </div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: 20, fontWeight: 900, color: "#22c55e" }}>
                              {m.distKm.toFixed(2) + " km"}
                            </div>
                            <div style={{ fontSize: 11, color: "#6b7280" }}>
                              {"Az: " + m.azimute.toFixed(1) + " gr"}
                            </div>
                          </div>
                        </div>

                        {/* Grid tecnico */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 5, marginTop: 10 }}>
                          <div style={{ background: "#0a1a0e", padding: "6px 8px", borderRadius: 4 }}>
                            <div style={{ fontSize: 9, color: "#4ade80" }}>MATERIAL</div>
                            <div style={{ fontSize: 11, color: "#f0fdf4" }}>{m.material}</div>
                          </div>
                          <div style={{ background: "#0a1a0e", padding: "6px 8px", borderRadius: 4 }}>
                            <div style={{ fontSize: 9, color: "#4ade80" }}>ALC MIN/MAX</div>
                            <div style={{ fontSize: 11, color: "#f0fdf4", fontFamily: "monospace" }}>
                              {(dados.alcMin/1000).toFixed(1) + "-" + (dados.alcMax/1000).toFixed(1) + " km"}
                            </div>
                          </div>
                          {dados.alcUtil ? (
                            <div style={{ background: "#0a1a0e", padding: "6px 8px", borderRadius: 4 }}>
                              <div style={{ fontSize: 9, color: "#4ade80" }}>ALC UTIL</div>
                              <div style={{ fontSize: 11, color: m.distKm*1000 <= dados.alcUtil ? "#4ade80" : "#fbbf24" }}>
                                {(dados.alcUtil/1000).toFixed(1) + " km " + (m.distKm*1000 <= dados.alcUtil ? "[OK]" : "[ALEM]")}
                              </div>
                            </div>
                          ) : null}
                          {dados.alcMaxAsst ? (
                            <div style={{ background: "#0a1a0e", padding: "6px 8px", borderRadius: 4 }}>
                              <div style={{ fontSize: 9, color: "#4ade80" }}>ALC ASST</div>
                              <div style={{ fontSize: 11, color: m.distKm*1000 <= dados.alcMaxAsst ? "#4ade80" : "#f87171" }}>
                                {(dados.alcMaxAsst/1000).toFixed(1) + " km"}
                              </div>
                            </div>
                          ) : null}
                          <div style={{ background: "#0a1a0e", padding: "6px 8px", borderRadius: 4 }}>
                            <div style={{ fontSize: 9, color: "#4ade80" }}>AREA EFICAZ</div>
                            <div style={{ fontSize: 11, color: "#f0fdf4" }}>
                              {dados.areaEficaz.larg
                                ? dados.areaEficaz.larg + "x" + dados.areaEficaz.prof + " m"
                                : dados.areaEficaz.raio
                                  ? "R: " + dados.areaEficaz.raio + " m"
                                  : "-"}
                            </div>
                          </div>
                          <div style={{ background: "#0a1a0e", padding: "6px 8px", borderRadius: 4 }}>
                            <div style={{ fontSize: 9, color: "#4ade80" }}>CAD 1o MIN</div>
                            <div style={{ fontSize: 11, color: "#f0fdf4" }}>
                              {dados.cadencia && dados.cadencia.min1 ? dados.cadencia.min1 + " tir/pc" : "-"}
                            </div>
                          </div>
                          {dados.frente_barragem ? (
                            <div style={{ background: "#0a1a0e", padding: "6px 8px", borderRadius: 4 }}>
                              <div style={{ fontSize: 9, color: "#4ade80" }}>FR BARRAGEM</div>
                              <div style={{ fontSize: 11, color: "#f0fdf4" }}>{dados.frente_barragem + " m"}</div>
                            </div>
                          ) : null}
                        </div>

                        {/* Municao recomendada */}
                        {muns.length > 0 && (
                          <div style={{ marginTop: 10, padding: "8px 10px", background: "#0f0a2e",
                            border: "1px solid #3730a3", borderRadius: 5 }}>
                            <div style={{ fontSize: 9, color: "#a78bfa", fontWeight: 700, marginBottom: 5 }}>
                              MUNICAO RECOMENDADA PARA "{conc.efeito}":
                            </div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                              {muns.map(function(mn) {
                                return (
                                  <span key={mn.sigla} style={{ background: "#1e1b4b", border: "1px solid #4c1d95",
                                    borderRadius: 4, padding: "3px 8px", fontSize: 11, color: "#c4b5fd" }}>
                                    <b>{mn.sigla}</b> - {mn.nome}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {dados.obs && (
                          <div style={{ fontSize: 10, color: "#6b7280", marginTop: 6, fontStyle: "italic" }}>
                            {dados.obs}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Meios nao habilitados */}
              {conc.meiosNaoHabilitados.length > 0 && (
                <details style={{ marginTop: 8 }}>
                  <summary style={{ fontSize: 12, color: "#6b7280", cursor: "pointer" }}>
                    {conc.meiosNaoHabilitados.length + " meio(s) NAO habilitado(s) - ver motivo"}
                  </summary>
                  <div style={{ marginTop: 6 }}>
                    {conc.meiosNaoHabilitados.map(function(m, j) {
                      return (
                        <div key={j} style={{ fontSize: 11, color: "#9ca3af", padding: "4px 10px",
                          background: "#1f2937", borderRadius: 4, marginBottom: 3 }}>
                          <span style={{ color: "#f87171", fontWeight: 700 }}>{m.nome + " (" + m.material + ")"}</span>
                          {" - " + m.motivo + " | Dist: " + m.distKm.toFixed(2) + " km"}
                          {m.dados ? " | Alc: " + (m.dados.alcMin/1000).toFixed(1) + "-" + (m.dados.alcMax/1000).toFixed(1) + " km" : ""}
                        </div>
                      );
                    })}
                  </div>
                </details>
              )}
            </div>
          </div>
        );
      })}

      {/* Resumo executivo */}
      <Card title="RESUMO EXECUTIVO - PLANO DE FOGOS" accent="#7c3aed">
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, minWidth: 700 }}>
            <thead>
              <tr style={{ background: "#1e1b4b", color: "#c4b5fd" }}>
                {["Codigo/Alvo","Solicitante","Efeito","Meio Execucao","Escalao","Material","Mun Recom","Dist","Az","Status"].map(function(h) {
                  return <th key={h} style={{ padding: "5px 8px", border: "1px solid #374151", textAlign: "left", whiteSpace: "nowrap" }}>{h}</th>;
                })}
              </tr>
            </thead>
            <tbody>
              {concs.map(function(conc, i) {
                var ef = EFEITOS[conc.efeito] || EFEITOS["Neutralizacao"];
                if (conc.meiosHabilitados.length > 0) {
                  return conc.meiosHabilitados.map(function(m, j) {
                    var muns = municipaoRecomendada(m.material, conc.efeito);
                    var munStr = muns.map(function(mn) { return mn.sigla; }).join(" / ");
                    return (
                      <tr key={i + "-" + j} style={{ background: i%2===0 ? "#111827" : "#0f172a" }}>
                        {j === 0 ? (
                          <td rowSpan={conc.meiosHabilitados.length}
                            style={{ padding: "5px 8px", border: "1px solid #374151", color: "#93c5fd",
                              fontWeight: 700, verticalAlign: "top", fontSize: 11 }}>
                            {conc.codigoDesig && <span style={{ color: "#60a5fa" }}>{conc.codigoDesig + " "}</span>}
                            {conc.designacao}
                          </td>
                        ) : null}
                        {j === 0 ? (
                          <td rowSpan={conc.meiosHabilitados.length}
                            style={{ padding: "5px 8px", border: "1px solid #374151", color: "#9ca3af",
                              verticalAlign: "top", fontSize: 10 }}>
                            {conc.escalaoSolicitante}{conc.solicitante ? " / " + conc.solicitante : ""}
                          </td>
                        ) : null}
                        {j === 0 ? (
                          <td rowSpan={conc.meiosHabilitados.length}
                            style={{ padding: "5px 8px", border: "1px solid #374151", verticalAlign: "top" }}>
                            <Badge cor={ef.cor}>{ef.sigla}</Badge>
                          </td>
                        ) : null}
                        <td style={{ padding: "5px 8px", border: "1px solid #374151", color: "#86efac", fontWeight: 700 }}>{m.nome}</td>
                        <td style={{ padding: "5px 8px", border: "1px solid #374151", color: "#9ca3af", fontSize: 10 }}>
                          {m.escalaoLancador || "-"}
                        </td>
                        <td style={{ padding: "5px 8px", border: "1px solid #374151", color: "#d1d5db", fontSize: 10 }}>{m.material}</td>
                        <td style={{ padding: "5px 8px", border: "1px solid #374151", color: "#c4b5fd", fontSize: 10 }}>{munStr || "-"}</td>
                        <td style={{ padding: "5px 8px", border: "1px solid #374151", fontFamily: "monospace", color: "#d1d5db" }}>
                          {m.distKm.toFixed(2)}
                        </td>
                        <td style={{ padding: "5px 8px", border: "1px solid #374151", fontFamily: "monospace", color: "#d1d5db" }}>
                          {m.azimute.toFixed(0)}
                        </td>
                        <td style={{ padding: "5px 8px", border: "1px solid #374151", textAlign: "center",
                          color: "#4ade80", fontWeight: 700 }}>BATE</td>
                      </tr>
                    );
                  });
                } else {
                  return (
                    <tr key={i} style={{ background: "#1c0a0a" }}>
                      <td style={{ padding: "5px 8px", border: "1px solid #374151", color: "#93c5fd", fontWeight: 700 }}>
                        {conc.codigoDesig ? conc.codigoDesig + " " : ""}{conc.designacao}
                      </td>
                      <td style={{ padding: "5px 8px", border: "1px solid #374151", color: "#9ca3af", fontSize: 10 }}>
                        {conc.escalaoSolicitante || "-"}
                      </td>
                      <td style={{ padding: "5px 8px", border: "1px solid #374151" }}>
                        <Badge cor={ef.cor}>{ef.sigla}</Badge>
                      </td>
                      <td colSpan={6} style={{ padding: "5px 8px", border: "1px solid #374151", color: "#f87171" }}>
                        Nenhum meio habilitado
                      </td>
                      <td style={{ padding: "5px 8px", border: "1px solid #374151", textAlign: "center",
                        color: "#f87171", fontWeight: 700 }}>S/COB</td>
                    </tr>
                  );
                }
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ============================================================
// APP PRINCIPAL
// ============================================================
export default function App() {
  var meioI = { nome: "", material: "", lat: "", lon: "", refLat: "", refLon: "",
    polarDist: "", polarAz: "", escalaoLancador: "", unidade: "",
    utmStr: "", utmZona: "", utmHemi: "S", utmE: "", utmN: "", refUtm: "" };
  var concI = { designacao: "", efeito: "Neutralizacao", lat: "", lon: "", descricao: "",
    refLat: "", refLon: "", polarDist: "", polarAz: "",
    codigoDesig: "", escalaoSolicitante: "", solicitante: "",
    utmStr: "", utmZona: "", utmHemi: "S", utmE: "", utmN: "", refUtm: "" };

  var [meios, setMeios] = useState([]);
  var [concs, setConcs] = useState([]);
  var [resultado, setResultado] = useState(null);
  var [erro, setErro] = useState("");
  var [tab, setTab] = useState("entrada");
  var [carregando, setCarregando] = useState(true);
  var [syncStatus, setSyncStatus] = useState("conectando");

  // Controle de edicao em andamento (evita sobrescrever o que a pessoa esta digitando)
  var dirtyMeios = useRef(new Set());
  var dirtyConcs = useRef(new Set());
  var timersMeios = useRef({});
  var timersConcs = useRef({});

  function rowToItem(row) {
    return Object.assign({ id: row.id }, row.dados || {});
  }

  // Carregamento inicial + sincronizacao em tempo real entre dispositivos (Supabase)
  useEffect(function() {
    var cancelado = false;

    function carregarTudo() {
      Promise.all([
        supabase.from("meios").select("*").order("created_at", { ascending: true }),
        supabase.from("concentracoes").select("*").order("created_at", { ascending: true })
      ]).then(function(resultados) {
        if (cancelado) return;
        var rMeios = resultados[0];
        var rConcs = resultados[1];

        if (!rMeios.error && rMeios.data) {
          setMeios(function(prevLocal) {
            return rMeios.data.map(function(row) {
              if (dirtyMeios.current.has(row.id)) {
                var local = prevLocal.find(function(m) { return m.id === row.id; });
                if (local) return local;
              }
              return rowToItem(row);
            });
          });
        }
        if (!rConcs.error && rConcs.data) {
          setConcs(function(prevLocal) {
            return rConcs.data.map(function(row) {
              if (dirtyConcs.current.has(row.id)) {
                var local = prevLocal.find(function(c) { return c.id === row.id; });
                if (local) return local;
              }
              return rowToItem(row);
            });
          });
        }
        setCarregando(false);
        setSyncStatus(rMeios.error || rConcs.error ? "erro" : "sincronizado");
      }).catch(function() {
        if (!cancelado) { setSyncStatus("erro"); setCarregando(false); }
      });
    }

    carregarTudo();

    var chMeios = supabase.channel("meios-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "meios" }, function() {
        carregarTudo();
      })
      .subscribe();

    var chConcs = supabase.channel("concs-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "concentracoes" }, function() {
        carregarTudo();
      })
      .subscribe();

    return function() {
      cancelado = true;
      supabase.removeChannel(chMeios);
      supabase.removeChannel(chConcs);
    };
  }, []);

  // --- Handlers de MEIOS (persistem no Supabase) ---
  function addMeio() {
    var novo = Object.assign({}, meioI);
    supabase.from("meios").insert({ dados: novo }).select().single().then(function(res) {
      if (res.data) {
        setMeios(function(p) { return p.concat([Object.assign({ id: res.data.id }, novo)]); });
      }
    });
  }

  function removeMeio(id) {
    setMeios(function(p) { return p.filter(function(x) { return x.id !== id; }); });
    dirtyMeios.current.delete(id);
    if (timersMeios.current[id]) clearTimeout(timersMeios.current[id]);
    supabase.from("meios").delete().eq("id", id);
  }

  function updateMeio(id, novoObj) {
    setMeios(function(p) { return p.map(function(x) { return x.id === id ? novoObj : x; }); });
    dirtyMeios.current.add(id);
    if (timersMeios.current[id]) clearTimeout(timersMeios.current[id]);
    timersMeios.current[id] = setTimeout(function() {
      var toSave = Object.assign({}, novoObj);
      delete toSave.id;
      supabase.from("meios").update({ dados: toSave, updated_at: new Date().toISOString() }).eq("id", id)
        .then(function() {
          setTimeout(function() { dirtyMeios.current.delete(id); }, 1200);
        });
    }, 700);
  }

  // --- Handlers de CONCENTRACOES (persistem no Supabase) ---
  function addConc() {
    var novo = Object.assign({}, concI);
    supabase.from("concentracoes").insert({ dados: novo }).select().single().then(function(res) {
      if (res.data) {
        setConcs(function(p) { return p.concat([Object.assign({ id: res.data.id }, novo)]); });
      }
    });
  }

  function removeConc(id) {
    setConcs(function(p) { return p.filter(function(x) { return x.id !== id; }); });
    dirtyConcs.current.delete(id);
    if (timersConcs.current[id]) clearTimeout(timersConcs.current[id]);
    supabase.from("concentracoes").delete().eq("id", id);
  }

  function updateConc(id, novoObj) {
    setConcs(function(p) { return p.map(function(x) { return x.id === id ? novoObj : x; }); });
    dirtyConcs.current.add(id);
    if (timersConcs.current[id]) clearTimeout(timersConcs.current[id]);
    timersConcs.current[id] = setTimeout(function() {
      var toSave = Object.assign({}, novoObj);
      delete toSave.id;
      supabase.from("concentracoes").update({ dados: toSave, updated_at: new Date().toISOString() }).eq("id", id)
        .then(function() {
          setTimeout(function() { dirtyConcs.current.delete(id); }, 1200);
        });
    }, 700);
  }

  function resolvePosicao(item) {
    // --- POLAR (referencia UTM ou Geo) ---
    if (item.polarDist && (item.refUtm || item.refLat)) {
      var ref = null;
      if (item.refUtm) {
        ref = parseUTM(item.refUtm);
        if (!utmValido(ref)) ref = null;
      }
      if (!ref && item.refLat) {
        var rg = parseCoord(item.refLat, item.refLon);
        if (!isNaN(rg.lat) && !isNaN(rg.lon)) ref = rg;
      }
      if (!ref) return null;
      var dist = parseFloat(item.polarDist);
      var az = parseFloat(item.polarAz);
      if (isNaN(dist) || isNaN(az)) return null;
      return polarToLatLon(ref, dist, az);
    }

    // --- UTM completa no campo utmStr ---
    if (item.utmStr && item.utmStr.trim()) {
      var pu = parseUTM(item.utmStr);
      if (utmValido(pu)) return pu;
    }

    // --- UTM em campos separados (Zona + E + N + Hemi) ---
    if (item.utmE && item.utmN && (item.utmZona || item.utmStr)) {
      var zona = parseInt(item.utmZona);
      var hemi = (item.utmHemi || "S").toUpperCase().trim();
      var e = parseFloat(item.utmE);
      var n = parseFloat(item.utmN);
      if (!isNaN(zona) && !isNaN(e) && !isNaN(n)) {
        var ps = utmToLatLon(zona, hemi, e, n);
        if (utmValido(ps)) return ps;
      }
    }

    // --- GEO decimal / DMS ---
    if (item.lat && item.lon) {
      var pos = parseCoord(item.lat, item.lon);
      if (!isNaN(pos.lat) && !isNaN(pos.lon)) return pos;
    }

    return null;
  }

  var calcular = useCallback(function() {
    setErro("");
    setResultado(null);

    var meiosRes = meios.map(function(m, i) {
      var pos = resolvePosicao(m);
      if (!pos) return { ok: false, idx: i, msg: "posicao invalida" };
      if (!m.material) return { ok: false, idx: i, msg: "sem material" };
      return Object.assign({}, m, { ok: true, posReal: pos });
    });

    var inv = meiosRes.filter(function(m) { return !m.ok; });
    if (inv.length > 0) {
      setErro("Dados incompletos: " + inv.map(function(m) { return "Meio " + (m.idx+1) + " (" + m.msg + ")"; }).join(", "));
      return;
    }

    var concRes = concs.map(function(conc) {
      var posAlvo = resolvePosicao(conc);
      if (!posAlvo) {
        return Object.assign({}, conc, { posAlvo: { lat: 0, lon: 0 },
          meiosHabilitados: [], meiosNaoHabilitados: [] });
      }
      var hab = [], nHab = [];
      meiosRes.forEach(function(m) {
        var dist = haversineKm(m.posReal, posAlvo);
        var az = azimuth(m.posReal, posAlvo);
        var dados = MEIOS[m.material];
        var distM = dist * 1000;
        var foraAlc = distM < dados.alcMin || distM > dados.alcMax;
        var semEf = !dados.efeitos.includes(conc.efeito);
        if (!foraAlc && !semEf) {
          hab.push({ nome: m.nome, material: m.material, posReal: m.posReal,
            distKm: dist, azimute: az,
            escalaoLancador: m.escalaoLancador, unidade: m.unidade });
        } else {
          var motivo = foraAlc
            ? (distM < dados.alcMin
              ? "Muito proximo: " + dist.toFixed(2) + "km < min " + (dados.alcMin/1000).toFixed(1) + "km"
              : "Fora do alcance: " + dist.toFixed(2) + "km > max " + (dados.alcMax/1000).toFixed(1) + "km")
            : "Sem efeito " + conc.efeito;
          nHab.push({ nome: m.nome, material: m.material, distKm: dist, azimute: az, motivo: motivo, dados: dados });
        }
      });
      hab.sort(function(a, b) { return a.distKm - b.distKm; });
      return Object.assign({}, conc, { posAlvo: posAlvo, meiosHabilitados: hab, meiosNaoHabilitados: nHab });
    });

    setResultado({ concentracoes: concRes });
    setTab("resultado");
  }, [meios, concs]);

  var tabS = function(key) {
    return { padding: "8px 16px", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700,
      background: tab === key ? "#1d4ed8" : "#111827", color: tab === key ? "#fff" : "#6b7280",
      borderRadius: "6px 6px 0 0", marginRight: 2 };
  };

  return (
    <div style={{ background: "#030712", minHeight: "100vh", color: "#f9fafb",
      fontFamily: "Courier New, Courier, monospace", maxWidth: 920, margin: "0 auto", padding: "0 16px 60px" }}>

      <div style={{ textAlign: "center", padding: "24px 0 18px", borderBottom: "2px solid #1e3a5f" }}>
        <div style={{ fontSize: 19, fontWeight: 900, color: "#60a5fa", letterSpacing: 2 }}>
          SISTEMA AUTOMATIZADO DE PLANEJAMENTO DE FOGOS
        </div>
        <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>
          MC-5.60 (4a Ed / 2025) - CE 5.80 DAMEPLAN (2a Ed / 2025) - EB / COTER
        </div>
        <div style={{ marginTop: 8 }}>
          {syncStatus === "sincronizado" && (
            <span style={{ fontSize: 10, color: "#4ade80", background: "#0a1a0e",
              border: "1px solid #15803d", borderRadius: 10, padding: "2px 10px" }}>
              Sincronizado entre dispositivos
            </span>
          )}
          {syncStatus === "conectando" && (
            <span style={{ fontSize: 10, color: "#fbbf24", background: "#1f1a05",
              border: "1px solid #92400e", borderRadius: 10, padding: "2px 10px" }}>
              Conectando ao banco de dados...
            </span>
          )}
          {syncStatus === "erro" && (
            <span style={{ fontSize: 10, color: "#f87171", background: "#1c0a0a",
              border: "1px solid #7f1d1d", borderRadius: 10, padding: "2px 10px" }}>
              Erro de sincronizacao - verifique a configuracao do banco
            </span>
          )}
        </div>
      </div>

      <div style={{ display: "flex", margin: "16px 0 0", borderBottom: "1px solid #374151" }}>
        <button style={tabS("entrada")} onClick={function() { setTab("entrada"); }}>Entrada de Dados</button>
        <button style={tabS("resultado")} onClick={function() { setTab("resultado"); }}>Resultado</button>
        <button style={tabS("referencia")} onClick={function() { setTab("referencia"); }}>Referencia</button>
      </div>

      <div style={{ paddingTop: 20 }}>

        {tab === "entrada" && (
          <div>
            {carregando ? (
              <div style={{ textAlign: "center", padding: 40, color: "#6b7280" }}>
                Carregando dados sincronizados...
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#60a5fa", marginBottom: 12 }}>
                  1. MEIOS DE APOIO DE FOGO DISPONIVEIS
                </div>
                {meios.map(function(m, i) {
                  return (
                    <FormMeio key={m.id} idx={i} meio={m}
                      onChange={function(v) { updateMeio(m.id, v); }}
                      onRemove={function() { removeMeio(m.id); }} />
                  );
                })}
                <button onClick={addMeio}
                  style={{ background: "#1d4ed8", border: "none", color: "#fff", padding: "8px 20px",
                    borderRadius: 6, cursor: "pointer", fontWeight: 700, fontSize: 13, marginBottom: 24 }}>
                  + Adicionar meio
                </button>

                <div style={{ fontSize: 14, fontWeight: 700, color: "#34d399", marginBottom: 12 }}>
                  2. CONCENTRACOES (ALVOS)
                </div>
                {concs.map(function(c, i) {
                  return (
                    <FormConc key={c.id} idx={i} conc={c}
                      onChange={function(v) { updateConc(c.id, v); }}
                      onRemove={function() { removeConc(c.id); }} />
                  );
                })}
                <button onClick={addConc}
                  style={{ background: "#065f46", border: "none", color: "#fff", padding: "8px 20px",
                    borderRadius: 6, cursor: "pointer", fontWeight: 700, fontSize: 13, marginBottom: 24 }}>
                  + Adicionar concentracao
                </button>
              </div>
            )}

            {erro && (
              <div style={{ background: "#7f1d1d", padding: "10px 16px", borderRadius: 6,
                color: "#fca5a5", marginBottom: 12, fontSize: 13 }}>
                {erro}
              </div>
            )}
            <div style={{ textAlign: "center" }}>
              <button onClick={calcular}
                style={{ background: "#1d4ed8", border: "none", color: "#fff",
                  padding: "12px 40px", borderRadius: 8, cursor: "pointer", fontWeight: 900, fontSize: 15, letterSpacing: 2 }}>
                CALCULAR PLANO DE FOGOS
              </button>
            </div>
          </div>
        )}

        {tab === "resultado" && (
          resultado
            ? <Resultado resultado={resultado} />
            : <div style={{ textAlign: "center", padding: 60, color: "#4b5563" }}>
                Nenhum calculo realizado. Va ate Entrada de Dados e clique em Calcular.
              </div>
        )}

        {tab === "referencia" && (
          <div>
            <Card title="MUNICAO POR MATERIAL E EFEITO - MC-5.60 / DAMEPLAN" accent="#a21caf">
              {Object.keys(MUNICAO).map(function(mat) {
                return (
                  <div key={mat} style={{ marginBottom: 12 }}>
                    <div style={{ fontWeight: 700, color: "#e879f9", fontSize: 12, marginBottom: 5 }}>{mat}</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {MUNICAO[mat].map(function(m) {
                        return (
                          <div key={m.sigla} style={{ background: "#1e1b4b", border: "1px solid #4c1d95",
                            borderRadius: 4, padding: "4px 10px", fontSize: 11 }}>
                            <span style={{ color: "#f0abfc", fontWeight: 700 }}>{m.sigla}</span>
                            <span style={{ color: "#9ca3af" }}> - {m.nome}</span>
                            <span style={{ color: "#6b7280", fontSize: 9, display: "block" }}>
                              Efeitos: {m.efeitos.join(", ")}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </Card>

            <Card title="ALCANCES DOS MEIOS - DAMEPLAN CE 5.80 Tab 4.1.1" accent="#7c3aed">
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                <thead>
                  <tr style={{ background: "#1e1b4b", color: "#c4b5fd" }}>
                    {["Material","Tipo","Cal","Min(km)","Util(km)","Max(km)","Asst(km)","Cad/min"].map(function(h) {
                      return <th key={h} style={{ padding: "5px 8px", border: "1px solid #374151", textAlign: "left" }}>{h}</th>;
                    })}
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(MEIOS).map(function(nome, i) {
                    var d = MEIOS[nome];
                    return (
                      <tr key={nome} style={{ background: i%2===0 ? "#111827" : "#0f172a" }}>
                        <td style={{ padding: "4px 8px", border: "1px solid #374151", color: "#93c5fd", fontWeight: 700 }}>{nome}</td>
                        <td style={{ padding: "4px 8px", border: "1px solid #374151", color: "#d1d5db" }}>{d.tipo}</td>
                        <td style={{ padding: "4px 8px", border: "1px solid #374151", color: "#d1d5db" }}>{d.calibre}</td>
                        <td style={{ padding: "4px 8px", border: "1px solid #374151", color: "#fbbf24", fontFamily: "monospace" }}>
                          {(d.alcMin/1000).toFixed(1)}
                        </td>
                        <td style={{ padding: "4px 8px", border: "1px solid #374151", color: "#4ade80", fontFamily: "monospace" }}>
                          {d.alcUtil ? (d.alcUtil/1000).toFixed(1) : "-"}
                        </td>
                        <td style={{ padding: "4px 8px", border: "1px solid #374151", color: "#f87171", fontFamily: "monospace" }}>
                          {(d.alcMax/1000).toFixed(1)}
                        </td>
                        <td style={{ padding: "4px 8px", border: "1px solid #374151", color: "#a78bfa", fontFamily: "monospace" }}>
                          {d.alcMaxAsst ? (d.alcMaxAsst/1000).toFixed(1) : "-"}
                        </td>
                        <td style={{ padding: "4px 8px", border: "1px solid #374151", color: "#d1d5db" }}>
                          {d.cadencia && d.cadencia.min1 ? d.cadencia.min1 + " tir" : "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>

            <Card title="EFEITOS DOUTRINARIOS - MC-5.60 (2025)" accent="#dc2626">
              {Object.keys(EFEITOS).map(function(ef) {
                var d = EFEITOS[ef];
                return (
                  <div key={ef} style={{ display: "flex", gap: 12, padding: "6px 0", borderBottom: "1px solid #1f2937" }}>
                    <Badge cor={d.cor}>{d.sigla}</Badge>
                    <div>
                      <span style={{ fontWeight: 700, color: "#f9fafb", fontSize: 12 }}>{ef}</span>
                      <span style={{ color: "#9ca3af", fontSize: 11, marginLeft: 8 }}>{d.desc}</span>
                    </div>
                  </div>
                );
              })}
            </Card>

            <Card title="DESIGNACAO DE CONCENTRACOES - ANX B MC-5.60" accent="#0369a1">
              <div style={{ fontSize: 12, color: "#d1d5db", lineHeight: 2 }}>
                <b style={{ color: "#60a5fa" }}>Letra unica (A,B,C,D):</b> CEx ou DE<br/>
                <b style={{ color: "#60a5fa" }}>Duas letras (AA,BA,BB,BC...):</b> Brigada ou elemento orgânico<br/>
                <b style={{ color: "#60a5fa" }}>Numero 0001-2999:</b> COT GAC / CCAF Bda<br/>
                <b style={{ color: "#60a5fa" }}>Numero 3000-3999:</b> 1o Btl/Rgt subordinado<br/>
                <b style={{ color: "#60a5fa" }}>Numero 4000-4999:</b> 2o Btl/Rgt subordinado<br/>
                <b style={{ color: "#60a5fa" }}>Numero 5000-5999:</b> 3o Btl/Rgt subordinado<br/>
                <b style={{ color: "#60a5fa" }}>xX200-299 / 300-399 / 400-499 / 500-599:</b> 1a a 4a SU<br/>
                <b style={{ color: "#fbbf24" }}>Numero PAR:</b> Artilharia de Campanha<br/>
                <b style={{ color: "#fbbf24" }}>Numero IMPAR:</b> Morteiro ou outro sistema<br/>
                <br/>
                <b style={{ color: "#60a5fa" }}>Coordenadas aceitas:</b><br/>
                UTM campo unico: 23K 456789 7612345 (zona+banda E N)<br/>
                UTM separado: 23 S 456789 7612345 (zona hemi E N)<br/>
                UTM campos individuais: Zona=23, Hemi=S, E=456789, N=7612345<br/>
                Geo decimal: -3.7219 / -40.3505<br/>
                DMS: 03 43 18 S / 40 21 02 W<br/>
                Polar: Ref UTM (ou Geo) + Distancia (km) + Azimute (graus)<br/>
                Banda N ate Z = hemisferio Norte. A ate M = hemisferio Sul.
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
