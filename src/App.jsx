import { useState, useEffect, useRef } from "react";

// ═══════════════════════════════════════════════════════
// DATI
// ═══════════════════════════════════════════════════════
const RANKS = ["F", "E", "D", "C", "B", "A", "S", "SS", "SSS"];
const RANK_TITOLI = {
  F: "Frammento Dormiente",
  E: "Risveglio Caotico",
  D: "Custode Minore",
  C: "Cercatore del Flusso",
  B: "Portatore del Codice",
  A: "Araldo Arcadiano",
  S: "Frammento Risvegliato",
  SS: "Nuova Bilancia",
  SSS: "Eco del Creatore",
};
const RANK_PA = { F: 0, E: 100, D: 300, C: 700, B: 1500, A: 3000, S: 6000, SS: 12000, SSS: 25000 };
const RANK_MHP = { F: 1.0, E: 1.15, D: 1.32, C: 1.52, B: 1.75, A: 2.0, S: 2.35, SS: 2.75, SSS: 3.2 };
const RANK_MFL = { F: 1.0, E: 1.12, D: 1.26, C: 1.42, B: 1.6, A: 1.82, S: 2.1, SS: 2.45, SSS: 2.85 };
const RANK_BDIF = { F: 0, E: 0, D: 1, C: 1, B: 2, A: 2, S: 3, SS: 4, SSS: 5 };
const rHP = (b, r) => Math.round(b * RANK_MHP[r]);
const rFL = (b, r) => Math.round(b * RANK_MFL[r]);
const rDIF = (b, r) => b + RANK_BDIF[r];

const CAT_COLORS = { 1: "#c0392b", 2: "#5f5e5a", 3: "#534ab7", 4: "#185fa5", 5: "#854f0b", 6: "#0f6e56" };
const CAT_GLOW = { 1: "#e74c3c", 2: "#95a5a6", 3: "#8e7df5", 4: "#3498db", 5: "#f39c12", 6: "#2ecc71" };
const CAT_IMAGES = { 1: "/cat1.jpg", 2: "/cat2.jpg", 3: "/cat3.jpg", 4: "/cat4.jpg", 5: "/cat5.jpg", 6: "/cat6.jpg" };
const CAT_GRADIENT = {
  1: "linear-gradient(135deg, #2a0a0a 0%, #1a0505 50%, #0d0a1a 100%)",
  2: "linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 50%, #0d0a1a 100%)",
  3: "linear-gradient(135deg, #0a0520 0%, #130a35 50%, #0d0a1a 100%)",
  4: "linear-gradient(135deg, #050a20 0%, #0a1535 50%, #0d0a1a 100%)",
  5: "linear-gradient(135deg, #1a0f00 0%, #251500 50%, #0d0a1a 100%)",
  6: "linear-gradient(135deg, #001a0f 0%, #002515 50%, #0d0a1a 100%)",
};

const CATEGORIE = [
  { id: 1, nome: "Forza e Acciaio", desc: "Combattenti che dominano il corpo a corpo con potenza bruta" },
  { id: 2, nome: "Velocità e Ombra", desc: "Combattenti agili che sfruttano posizionamento e velocità" },
  { id: 3, nome: "Flusso e Magia", desc: "Manipolatori del Flusso che attaccano con energia arcana" },
  { id: 4, nome: "Resistenza e Mura", desc: "Tank e difensori che assorbono danni e proteggono gli alleati" },
  { id: 5, nome: "Percezione e Legami", desc: "Supporto, tracker e domatori che usano la PER come arma" },
  { id: 6, nome: "Caos e Sacrificio", desc: "Classi ibride con meccaniche uniche che sfidano le regole" },
];

const CLASSI = [
  {cat:1,pos:1,nome:"Guerriero Hardcore",flavor:"Impara da ogni battaglia",icon:"⚔️",FOR:15,AGI:12,RES:13,INT:8,PER:10,CAR:8,hp:62,fl:22,dif:11,vel:6,dado:"1d10",
   desc:"La classe più adattabile. Osservando i nemici in combattimento può tentare di acquisire le loro tecniche. Nessun limite di Skill acquisibili.",
   skills:[{nome:"Lama dell'Ego",costo:"2",desc:"Attacco FOR. Danno 2d8+2. Se supera Difesa di 5+: Rottura Armatura (–2 Difesa, 2 turni).",lv2:"+1d danno o –1 costo Flusso",lv3:"Ignora 50% bonus armatura",lv4:"Danno 3d10+2, Rottura dura 3t",lv5:"FINALE: colpisce sempre, 4d8+2, Rottura permanente"},
    {nome:"Tempesta di Lame",costo:"4",desc:"Colpisce TUTTI i nemici in portata ravvicinata. FOR separato. Danno 1d8+2.",lv2:"2d8+2 ciascuno",lv3:"Portata 4m",lv4:"2d10+2 + Rallentato 1t",lv5:"FINALE: no tiro vs già colpiti, 3d8+2"},
    {nome:"Sfida del Guerriero",costo:"1+✦",desc:"Bersaglio: Svantaggio vs altri 2t. Tu: +1 Difesa vs lui.",lv2:"Dura 3t, costo ✦ rimosso",lv3:"–1 danni bersaglio attivo",lv4:"2 bersagli (2 Flusso)",lv5:"FINALE: bersaglio DEVE attaccare te. Se attacca altri: 1d6 automatici"}]},
  {cat:1,pos:2,nome:"Berserker",flavor:"Potenza pura — massimo danno",icon:"🔥",FOR:16,AGI:10,RES:14,INT:8,PER:8,CAR:8,hp:68,fl:16,dif:10,vel:5,dado:"1d12",
   desc:"Il Berserker non difende — travolge. Dado vita 1d12, danno più alto del gioco. Il prezzo è la Difesa bassa e l'Esausto post-Frenesia.",
   skills:[{nome:"Colpo Selvaggio",costo:"0",desc:"Attacco FOR. Danno 1d12+3. Manca di 1-3: 1d6 da pressione. No Schivata stessa turno.",lv2:"2d10+3",lv3:"Pressione sale a 1d8",lv4:"2d12+3. Critico: vola 3m (Prono)",lv5:"FINALE: colpisce sempre, 3d10+3"},
    {nome:"Frenesia",costo:"3",desc:"Azione Bonus. Per 3t: +3 danni, no Skill >2 Flusso, immune Spaventato. Poi: Esausto 2t.",lv2:"Dura 4t, Esausto 1t",lv3:"+5 danni, immune anche Stordito",lv4:"Esausto scompare",lv5:"FINALE: attiva automaticamente sotto 30% HP, costo 0"},
    {nome:"Grido di Guerra",costo:"0",desc:"A.Bonus. Alleati entro 6m: +1 danni 2t. Tu: +2. 1/scontro.",lv2:"Alleati +2",lv3:"+1 Difesa per tutti 2t",lv4:"Utilizzabile 2/scontro",lv5:"FINALE: automatico a inizio scontro, dura 3t"}]},
  {cat:1,pos:3,nome:"Paladino del Sogno",flavor:"Forza fisica e Flusso curativo",icon:"✨",FOR:13,AGI:10,RES:14,INT:10,PER:12,CAR:11,hp:67,fl:32,dif:10,vel:5,dado:"1d10",
   desc:"La classe più completa. Non eccelle in nulla ma riesce in tutto. Il sacrificio dell'Imposizione delle Mani è un meccanismo di scelta tattica.",
   skills:[{nome:"Colpo Sacro",costo:"2",desc:"Attacco FOR. Danno 1d8+1 + 1d6 sacro (ignora armatura). Vs non-morti/corrotti: sacro x2.",lv2:"2d6+1 fisico",lv3:"Sacro 2d6 + Benedizione alleato",lv4:"2d8+1, sacro 2d8",lv5:"FINALE: sacro guarisce il Paladino del 50%"},
    {nome:"Aura Protettiva",costo:"3",desc:"A.Bonus. Alleati entro 4m: +1 Difesa e resist. veleni 3t.",lv2:"Portata 6m, costo 2",lv3:"+2 Difesa + resist. Spaventato",lv4:"Dura 5t",lv5:"FINALE: sempre attiva, costo 1 a inizio scontro"},
    {nome:"Imposizione delle Mani",costo:"0*",desc:"A.Bonus. Cura alleato adiacente 1d8+1 HP. *Tu perdi metà HP curati.",lv2:"Cura 2d6+1",lv3:"Sacrificio scende a 1/3. Rimuove Avvelenato",lv4:"Cura 2d8+1. No sacrificio.",lv5:"FINALE: portata 6m, 3d6+1, rimuove qualsiasi condizione"}]},
  {cat:1,pos:4,nome:"Cacciatore di Bestie",flavor:"Conosce i nemici meglio di loro",icon:"🎯",FOR:14,AGI:14,RES:12,INT:8,PER:12,CAR:8,hp:55,fl:22,dif:12,vel:7,dado:"1d8",
   desc:"Versatile e tecnico. Il valore reale emerge con la conoscenza del nemico. Nei dungeon con mostri variati è la classe più efficace in assoluto.",
   skills:[{nome:"Analisi della Preda",costo:"1",desc:"A.Bonus. Scopri HP approssimativi, Difesa esatta o debolezza elementale. +2 danni 3t.",lv2:"Scopri tutte e 3 le info",lv3:"+3 danni, dura 5t",lv4:"Debolezza causa danni doppi",lv5:"FINALE: sempre attiva su qualsiasi nemico incontrato"},
    {nome:"Trappola Esplosiva",costo:"3",desc:"Piazza trappola entro 4m. Primo nemico: 2d6 + Rallentato 2t (RES DC 13). Attiva 3t.",lv2:"3d6, 2 trappole per attivazione",lv3:"Rallentato → Immobilizzato",lv4:"Non scade mai",lv5:"FINALE: invisibile anche a sensi soprannaturali, 4d6 + Stordito 1t"},
    {nome:"Colpo del Cacciatore",costo:"2",desc:"Vantaggio se già colpito. Danno 1d8+2. Marca: ogni attacco +1d4.",lv2:"+1d6 invece di +1d4",lv3:"Vantaggio anche 1° attacco se marcato",lv4:"Marca non svanisce mai",lv5:"FINALE: ignora tutta l'armatura del bersaglio marcato"}]},
  {cat:2,pos:1,nome:"Assassino",flavor:"Un colpo — bersaglio eliminato",icon:"🗡️",FOR:10,AGI:16,RES:10,INT:10,PER:12,CAR:8,hp:52,fl:28,dif:13,vel:8,dado:"1d8",
   desc:"Fragile se scoperto, letale se in posizione. Con Difesa 13 regge discretamente, ma i 52 HP sono il limite reale. Ogni scontro è una finestra temporale.",
   skills:[{nome:"Lama Avvelenata",costo:"2",desc:"Attacco AGI. Danno 1d6+3 + Veleno (1d4/turno 3t, RES DC 13).",lv2:"Veleno 4t, DC 14",lv3:"Veleno applica –1 a tutti i tiri",lv4:"2d6+3, veleno 2 stack",lv5:"FINALE: veleno permanente per lo scontro"},
    {nome:"Passo d'Ombra",costo:"3",desc:"A.Bonus. Stealth assoluto. Prossimo attacco da stealth = critico automatico (x2). 1/scontro.",lv2:"2/scontro",lv3:"Critico da stealth = x2.5",lv4:"Costo 2, 3/scontro",lv5:"FINALE: gratuito (0 Flusso), illimitato"},
    {nome:"Esecuzione",costo:"4",desc:"Solo da stealth. Colpisce sempre: 3d6+3, ignora tutta l'armatura. Bersaglio >75% HP: x1.5.",lv2:"4d6+3",lv3:"Soglia sale a >50% HP",lv4:"Se uccide: rientra in stealth gratis",lv5:"FINALE: usabile senza stealth (danno /2). Da stealth: 5d6+3"}]},
  {cat:2,pos:2,nome:"Ranger del Sogno",flavor:"Efficace a distanza e in mischia",icon:"🏹",FOR:12,AGI:15,RES:11,INT:10,PER:13,CAR:8,hp:50,fl:26,dif:12,vel:7,dado:"1d8",
   desc:"La classe più consistente del gioco. Nessun punto debole grave, nessun vantaggio estremo.",
   skills:[{nome:"Freccia Perforante",costo:"2",desc:"Attacco AGI a distanza. Danno 1d8+2. Ignora 50% bonus armatura.",lv2:"2d6+2",lv3:"Ignora 100% armatura",lv4:"Portata doppia, 2d8+2",lv5:"FINALE: colpisce 2 bersagli in linea retta"},
    {nome:"Colpo Doppio",costo:"3",desc:"2 attacchi: 1d20+2, danno 1d6+2. Il 2° ha –2 al tiro.",lv2:"2° senza penalità",lv3:"Colpo Triplo (3° ha –1)",lv4:"Vantaggio su tutti e 3 se marcato",lv5:"FINALE: Colpo Quadruplo. Critico aggiunge attacco bonus"},
    {nome:"Marcatura",costo:"1",desc:"A.Bonus. Bersaglio marcato: Vantaggio su tutti i tuoi attacchi 3t.",lv2:"Dura 5t",lv3:"Tutti gli alleati hanno Vantaggio vs marcato",lv4:"2 bersagli simultanei",lv5:"FINALE: permanente per lo scontro, costo 0"}]},
  {cat:2,pos:3,nome:"Danzatore di Lame",flavor:"Ogni schivata genera il prossimo attacco",icon:"💫",FOR:12,AGI:15,RES:10,INT:10,PER:8,CAR:11,hp:49,fl:30,dif:12,vel:7,dado:"1d8",
   desc:"Trasforma la difesa in attacco. Il ritmo è unico: più il nemico manca, più si mette in pericolo.",
   skills:[{nome:"Passo del Vento",costo:"2",desc:"Reazione quando colpito: AGI DC 13. Successo: schivi. Se schivi: Vantaggio prossimo attacco.",lv2:"DC scende a 11",lv3:"Schivata: +2 danni prossimo attacco",lv4:"Costo 1",lv5:"FINALE: gratuito. 2 schivate consecutive → prossimo attacco critico auto"},
    {nome:"Danza delle Lame",costo:"4",desc:"4 attacchi rapidi: 1d4+2. Ogni colpo riduce costo Flusso prossimo di 1.",lv2:"5 attacchi, 1d6+2",lv3:"Tutti a segno: bersaglio Stordito 1t",lv4:"Costo 3",lv5:"FINALE: 6 attacchi, 1d8+2. 1° critico → tutti lo sono"},
    {nome:"Contrattacco Fluido",costo:"0",desc:"Passivo. Nemico ti manca: contrattacca (1d6+2, no tiro). 1/round.",lv2:"1d8+2",lv3:"Applica anche Sanguinante",lv4:"2/round",lv5:"FINALE: attivo anche quando alleati entro 3m vengono mancati"}]},
  {cat:2,pos:4,nome:"Ombra del Vento",flavor:"Mobile e inafferrabile",icon:"🌑",FOR:8,AGI:16,RES:10,INT:12,PER:10,CAR:10,hp:55,fl:42,dif:13,vel:8,dado:"1d6",
   desc:"La più mobile del gioco. Combina la velocità dell'Assassino con la flessibilità magica.",
   skills:[{nome:"Passo Dimensionale",costo:"2",desc:"A.Bonus. Teletrasporto a punto visibile entro 8m. +2 danni prossimo attacco.",lv2:"Portata 12m, +3 danni",lv3:"Trascina un alleato adiacente",lv4:"2/turno",lv5:"FINALE: gratuito, portata illimitata"},
    {nome:"Lama d'Ombra",costo:"3",desc:"Attacco AGI. 1d6+3 + 1d6 oscuro (ignora armatura). Dopo Passo: oscuro x2.",lv2:"2d6+3 fisico",lv3:"Oscuro 2d6",lv4:"Dopo Passo: oscuro x3",lv5:"FINALE: a cono (3m). Tutti i bersagli subiscono danno completo"},
    {nome:"Velo d'Ombra",costo:"2",desc:"A.Bonus. Campo oscuro 3m 2t: Svantaggio su attacchi verso di te.",lv2:"Campo 5m",lv3:"Dura 3t + Rallentato chi entra",lv4:"Si sposta con te",lv5:"FINALE: invisibile. Ti dà stealth mentre sei al suo interno"}]},
  {cat:3,pos:1,nome:"Mago del Caos",flavor:"Distrugge aree — fragile come cristallo",icon:"⚡",FOR:8,AGI:12,RES:9,INT:16,PER:12,CAR:9,hp:50,fl:56,dif:11,vel:6,dado:"1d6",
   desc:"Il Flusso più alto del gioco (56 al Rank F, 160 al Rank SSS).",
   skills:[{nome:"Nova Oscura",costo:"5",desc:"Area 4m entro 20m. AGI DC 13. Fallimento: 3d6+3. Successo: metà.",lv2:"4d6+3",lv3:"Raggio 6m, DC 14",lv4:"Tipo danno a scelta",lv5:"FINALE: colpisce TUTTI i nemici visibili. No tiro. 4d8+3"},
    {nome:"Sigillo del Silenzio",costo:"3",desc:"INT vs RES DC 12. Pieno: no Skill 2t. Parziale: 1t.",lv2:"Pieno 3t, Parziale 2t",lv3:"Il Sigillo si trasferisce se il bersaglio muore",lv4:"Costo 2",lv5:"FINALE: area 5m (tutti i nemici), 1t. Costo 6"},
    {nome:"Scudo Arcano",costo:"3",desc:"Reazione. Assorbe 1d8+3 danni. Se assorbe tutto: nessuna condizione.",lv2:"2d8+3",lv3:"Attivabile su alleato entro 6m",lv4:"3d6+3. Se assorbe tutto: 50% riflesso",lv5:"FINALE: sempre attivo (passivo), assorbe 1d6+3 da qualsiasi fonte"}]},
  {cat:3,pos:2,nome:"Evocatore di Sogni",flavor:"Combatte tramite creature create dal Flusso",icon:"🌀",FOR:8,AGI:10,RES:10,INT:15,PER:14,CAR:9,hp:53,fl:52,dif:10,vel:5,dado:"1d6",
   desc:"La forza cresce nel tempo. Al Rank S, con 3 Sentinelle rinforzate, produce danni devastanti in area.",
   skills:[{nome:"Evoca Sentinella",costo:"4",desc:"Sentinella: HP 30, Attacco 1d6+2, Difesa 12. Dura 3t. Max 1.",lv2:"HP 50, Attacco 2d6+2",lv3:"Max 2 attive",lv4:"HP 70, si interpone tra te e attacchi",lv5:"FINALE: nessuna durata. Max 3 attive"},
    {nome:"Esplosione di Evocazione",costo:"5",desc:"Ogni creatura evocata esplode area 3m: 2d6+2 (AGI DC 12 per metà). Svanisce.",lv2:"3d6+2",lv3:"Raggio 5m",lv4:"Creatura sostituita gratis dopo esplosione",lv5:"FINALE: scegli se svanisce o sopravvive. 4d6+2"},
    {nome:"Rinforzo Mistico",costo:"3",desc:"A.Bonus. Creatura evocata: +4 danni 2t. Prossima Reazione gratis.",lv2:"+6 danni",lv3:"+2 Difesa e +10 HP temporanei",lv4:"Dura 3t",lv5:"FINALE: gratuito, si applica a tutte le creature attive"}]},
  {cat:3,pos:3,nome:"Negromante",flavor:"Si nutre dell'energia dei nemici",icon:"💀",FOR:10,AGI:10,RES:11,INT:15,PER:10,CAR:10,hp:58,fl:50,dif:10,vel:5,dado:"1d6",
   desc:"Più il combattimento dura, più il Negromante sta bene. Eccelle contro boss solitari con molti HP.",
   skills:[{nome:"Tocco Drenante",costo:"3",desc:"Attacco INT. Danno 1d6+2. Recuperi 50% HP. Bersaglio <30%: recuperi 100%.",lv2:"Soglia sale a <40%",lv3:"Drena anche 1 Flusso ogni 5 HP drenati",lv4:"2d6+2, soglia <50%",lv5:"FINALE: costo 0, usabile come A.Bonus"},
    {nome:"Maledizione di Debolezza",costo:"4",desc:"INT vs RES DC 12. Pieno: –3 a tutti i tiri 2t. Parziale: –2 prossimo tiro.",lv2:"Pieno –4 per 3t",lv3:"Si trasferisce se il bersaglio muore",lv4:"Area 4m, –3 a tutti",lv5:"FINALE: permanente per lo scontro"},
    {nome:"Vincolo dell'Anima",costo:"5",desc:"Per 2t: ogni HP che perde il bersaglio, recuperi metà. Può spezzare (RES DC 15).",lv2:"3t",lv3:"Recuperi 75%, DC spezzare 17",lv4:"Bidirezionale: lui recupera 25% dei tuoi",lv5:"FINALE: non spezzabile. Recuperi 100%"}]},
  {cat:3,pos:4,nome:"Illusionista",flavor:"Vince senza fare danni",icon:"👁️",FOR:8,AGI:13,RES:9,INT:15,PER:11,CAR:10,hp:50,fl:52,dif:11,vel:6,dado:"1d6",
   desc:"La più difficile da giocare bene. Non fa quasi danni — toglie i turni ai nemici.",
   skills:[{nome:"Doppio Illusorio",costo:"3",desc:"A.Bonus. 1 copia. Nemici: INT DC 13 per capire il vero bersaglio. Svanisce al 1° colpo.",lv2:"2 copie",lv3:"Copie si muovono autonomamente, DC 14",lv4:"Copie usano Skill base",lv5:"FINALE: copie hanno 15 HP ciascuna. Max 3 attive"},
    {nome:"Terrore Reale",costo:"4",desc:"INT vs INT DC 13. Pieno: Spaventato 2t + Svantaggio su tutto. Parziale: Spaventato 1t.",lv2:"Pieno 3t",lv3:"Area 5m, tiro separato per ciascuno",lv4:"DC 15, chi fallisce anche Paralizzato 1t",lv5:"FINALE: istantaneo. Tutti i nemici visibili: Spaventati 2t"},
    {nome:"Labirinto Illusorio",costo:"6",desc:"Bersaglio salta turno intero (INT vs INT DC 14). Fallisce su immuni.",lv2:"Costo 5",lv3:"2 bersagli",lv4:"Bersaglio subisce 2d6 psichici all'uscita",lv5:"FINALE: dura 2 turni. Il bersaglio non ricorda nulla"}]},
  {cat:4,pos:1,nome:"Guardiano del Sogno",flavor:"HP massimi del gioco — il muro indistruttibile",icon:"🛡️",FOR:11,AGI:8,RES:16,INT:10,PER:13,CAR:8,hp:79,fl:28,dif:9,vel:4,dado:"1d12",
   desc:"91 HP al Rank C — il più resistente del gioco. Lo Scudo dell'Anima rende il gruppo quasi invincibile.",
   skills:[{nome:"Barriera Cristallina",costo:"3",desc:"Scudo su sé o alleato entro 8m. Assorbe RES×4 (base 64) HP. Dura fino a fine scontro.",lv2:"RES×5 (base 80)",lv3:"20% danni assorbiti riflessi all'attaccante",lv4:"2 scudi simultanei su bersagli diversi",lv5:"FINALE: si rigenera di 10 HP ogni round"},
    {nome:"Aura di Guarigione",costo:"3",desc:"Alleati entro 6m (non sé): 1d8+1 HP. Se sotto 50%: cura doppia.",lv2:"2d6+1, soglia 60%",lv3:"Rimuove una condizione a scelta",lv4:"Costo 2, cura anche sé stesso",lv5:"FINALE: persistente — 1d6+1 a inizio ogni suo turno a tutti entro 6m"},
    {nome:"Scudo dell'Anima",costo:"0",desc:"Passivo. Alleato entro 8m subisce danno: puoi riceverlo tu, dimezzato. Dichiara prima.",lv2:"Danno ridotto di ulteriori 3",lv3:"Portata 12m",lv4:"Puoi deviare su qualsiasi bersaglio entro portata",lv5:"FINALE: automatico. Qualsiasi danno agli alleati automaticamente dimezzato"}]},
  {cat:4,pos:2,nome:"Campione di Pietra",flavor:"Assorbe i colpi e risponde con forza",icon:"🪨",FOR:12,AGI:8,RES:16,INT:8,PER:10,CAR:12,hp:77,fl:16,dif:9,vel:4,dado:"1d12",
   desc:"La versione offensiva del Guardiano. La Sfida in forma finale rende impossibile ignorarlo.",
   skills:[{nome:"Sfida del Campione",costo:"0+✦",desc:"A.Bonus. Bersaglio: Svantaggio vs altri 2t. Tu: +1 Difesa vs lui.",lv2:"Costo ✦ rimosso, costo 1 Flusso",lv3:"2 bersagli, penalità = impossibile attaccare altri",lv4:"+2 Difesa, dura 3t",lv5:"FINALE: attiva su TUTTI i nemici all'inizio scontro (passiva), costo 2"},
    {nome:"Scossa Sismica",costo:"4",desc:"Colpisci il terreno. Nemici entro 3m: RES DC 13. Fallimento: Proni + 1d6.",lv2:"2d6",lv3:"Raggio 5m, Prono → Immobilizzato 1t",lv4:"DC 15",lv5:"FINALE: crea fessura 3m. Chi attraversa: Prono automaticamente"},
    {nome:"Fortezza",costo:"3",desc:"Reazione. Dimezza un singolo attacco. Se danno dimezzato = 0: recuperi 3 HP.",lv2:"Danno 0 → recuperi 6 HP",lv3:"Costo 2",lv4:"Dimezza tutti gli attacchi 1 turno intero",lv5:"FINALE: passiva — dimezza ogni attacco >20 danni"}]},
  {cat:4,pos:3,nome:"Monaco del Sogno",flavor:"Resistenza e velocità in un corpo solo",icon:"☯️",FOR:12,AGI:14,RES:13,INT:8,PER:11,CAR:8,hp:62,fl:20,dif:12,vel:7,dado:"1d10",
   desc:"Il tank che non si ferma. Il Vortice in forma finale è una delle Skill più devastanti del gioco.",
   skills:[{nome:"Pugno del Fulmine",costo:"2",desc:"Attacco FOR. Danno 1d8+1. Se critico: bersaglio Stordito 1t.",lv2:"2d6+1",lv3:"Stordito anche senza critico se superi Difesa di 5+",lv4:"2d8+1",lv5:"FINALE: ogni Pugno accumula contatore (max 3). Al 3°: esplosione 3d8 area 3m"},
    {nome:"Vortice del Monaco",costo:"4",desc:"Muoviti 4m e attacca ogni nemico attraversato: 1d6+1. No attacchi di opportunità.",lv2:"6m, 2d4+1",lv3:"Ogni bersaglio: Rallentato 1t",lv4:"Percorso x2 (attacchi doppi)",lv5:"FINALE: nessun limite distanza. 2d6+
