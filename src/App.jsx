import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { NPCS, BESTIARIO, ARSENALE } from "./compendio_data.js";

// ═══════════════════════════════════════════════════════
// DATI
// ═══════════════════════════════════════════════════════
const RANKS = ["F","E","D","C","B","A","S","SS","SSS"];
const RANK_TITOLI = {F:"Frammento Dormiente",E:"Risveglio Caotico",D:"Custode Minore",C:"Cercatore del Flusso",B:"Portatore del Codice",A:"Araldo Arcadiano",S:"Frammento Risvegliato",SS:"Nuova Bilancia",SSS:"Eco del Creatore"};
const RANK_PA = {F:0,E:100,D:300,C:700,B:1500,A:3000,S:6000,SS:12000,SSS:25000};
const RANK_MHP = {F:1.0,E:1.15,D:1.32,C:1.52,B:1.75,A:2.0,S:2.35,SS:2.75,SSS:3.2};
const RANK_MFL = {F:1.0,E:1.12,D:1.26,C:1.42,B:1.60,A:1.82,S:2.10,SS:2.45,SSS:2.85};
const RANK_BDIF = {F:0,E:0,D:1,C:1,B:2,A:2,S:3,SS:4,SSS:5};
const rHP = (b,r) => Math.round(b*RANK_MHP[r]);
const rFL = (b,r) => Math.round(b*RANK_MFL[r]);
const rDIF = (b,r) => b+RANK_BDIF[r];

const CAT_COLORS = {1:"#c0392b",2:"#5f5e5a",3:"#534ab7",4:"#185fa5",5:"#854f0b",6:"#0f6e56"};
const CAT_GLOW   = {1:"#e74c3c",2:"#95a5a6",3:"#8e7df5",4:"#3498db",5:"#f39c12",6:"#2ecc71"};

// Immagini categorie — metti i tuoi file in public/ con questi nomi
const CAT_IMAGES = {
  1: "/cat1.jpg",
  2: "/cat2.jpg",
  3: "/cat3.jpg",
  4: "/cat4.jpg",
  5: "/cat5.jpg",
  6: "/cat6.jpg",
};

// Fallback gradient per ogni categoria (usato finché l'immagine non è caricata)
const CAT_GRADIENT = {
  1: "linear-gradient(135deg, #2a0a0a 0%, #1a0505 50%, #0d0a1a 100%)",
  2: "linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 50%, #0d0a1a 100%)",
  3: "linear-gradient(135deg, #0a0520 0%, #130a35 50%, #0d0a1a 100%)",
  4: "linear-gradient(135deg, #050a20 0%, #0a1535 50%, #0d0a1a 100%)",
  5: "linear-gradient(135deg, #1a0f00 0%, #251500 50%, #0d0a1a 100%)",
  6: "linear-gradient(135deg, #001a0f 0%, #002515 50%, #0d0a1a 100%)",
};

const CATEGORIE = [
  {id:1,nome:"Forza e Acciaio",    desc:"Specialisti del combattimento ravvicinato. La risoluzione degli scontri passa attraverso il corpo: danno fisico, armi pesanti, posizionamento frontale."},
  {id:2,nome:"Velocità e Ombra",   desc:"Operatori tattici che risolvono gli scontri attraverso il movimento e la posizione. L'agilità sostituisce la resistenza come meccanismo di sopravvivenza."},
  {id:3,nome:"Flusso e Magia",     desc:"Manipolatori diretti del Flusso. Il danno viene prodotto attraverso la canalizzazione, non attraverso il corpo. Difesa fisica bassa, controllo del campo elevato."},
  {id:4,nome:"Resistenza e Mura",  desc:"Strutture difensive del gruppo. Assorbono danni destinati agli alleati e mantengono la linea. La loro sconfitta apre il gruppo all'eliminazione sequenziale."},
  {id:5,nome:"Percezione e Legami",desc:"Specialisti del supporto e dell'informazione. Operano attraverso la Percezione come caratteristica primaria. Il loro valore cresce esponenzialmente con il numero di alleati coordinati."},
  {id:6,nome:"Caos e Sacrificio",  desc:"Classi con meccaniche non standard. Scambiano risorse in modi che le altre categorie non possono. Il prezzo del loro potere si paga in progressione o in condizioni persistenti."},
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
    {nome:"Vortice del Monaco",costo:"4",desc:"Muoviti 4m e attacca ogni nemico attraversato: 1d6+1. No attacchi di opportunità.",lv2:"6m, 2d4+1",lv3:"Ogni bersaglio: Rallentato 1t",lv4:"Percorso x2 (attacchi doppi)",lv5:"FINALE: nessun limite distanza. 2d6+1 per bersaglio. Ogni colpito: Prono"},
    {nome:"Meditazione in Battaglia",costo:"2",desc:"A.Bonus. 1/scontro: recupera 2d6+1 HP. Sotto 30%: 3d6+1.",lv2:"2/scontro",lv3:"Rimuove una condizione",lv4:"Sotto 30%: 4d8+1",lv5:"FINALE: illimitato, costo 1"}]},
  {cat:4,pos:4,nome:"Araldo della Fine",flavor:"Più è vicino alla morte, più è letale",icon:"💥",FOR:14,AGI:10,RES:14,INT:10,PER:8,CAR:10,hp:63,fl:26,dif:10,vel:5,dado:"1d10",
   desc:"La classe più drammatica del gioco. Sotto il 20% HP il danno raddoppia, Flusso a 0, quasi inarrestabile.",
   skills:[{nome:"Sacrificio di Sangue",costo:"0*",desc:"*Costa HP. Spendi X HP (min 5): infliggi X×1.5 danni puri. Sotto 20% HP: X×2.5.",lv2:"Base X×2. Sotto 20%: X×3",lv3:"Può colpire area 3m",lv4:"Base X×2.5. Sotto 20%: X×4",lv5:"FINALE: costo HP /2. Sotto 20%: X×5"},
    {nome:"Rinascita nel Sangue",costo:"0 (1/scontro)",desc:"Reazione automatica a 0 HP. Sopravvivi con 1 HP. Nemici entro 4m: 2d6 (RES DC 13 Storditi).",lv2:"3d6",lv3:"Raggio 6m",lv4:"2/scontro",lv5:"FINALE: recuperi 20% HP massimi. Danno nemici: 4d8"},
    {nome:"Flagello del Moribondo",costo:"5",desc:"3 attacchi FOR: 1d10+2. Sotto 20% HP: ogni colpo +1d6.",lv2:"4 attacchi, 1d12+2",lv3:"Sotto 20%: +2d6",lv4:"Costo 4",lv5:"FINALE: 5 attacchi, 2d8+2. Sotto 20%: costo 0"}]},
  {cat:5,pos:1,nome:"Domatore di Anime",flavor:"La forza cresce con ogni mostro domato",icon:"🐉",FOR:10,AGI:11,RES:11,INT:12,PER:15,CAR:7,hp:49,fl:36,dif:10,vel:5,dado:"1d8",
   desc:"Debole al Rank F, potentissimo al Rank S. Ogni mostro domato è un moltiplicatore di forza permanente.",
   skills:[{nome:"Doma",costo:"0",desc:"Su bersaglio ≤25% HP. PER vs DC (8+Rank mostro). Pieno: permanente. Parziale: 1 scontro.",lv2:"Tentabile fino a 35% HP",lv3:"Tentabile fino a 45%, Parziale → 1 sessione",lv4:"Tentabile su qualsiasi bersaglio (DC +8)",lv5:"FINALE: istantanea (A.Bonus)"},
    {nome:"Ruggito del Branco",costo:"4",desc:"Tutti i compagni attivi entro 20m attaccano stesso bersaglio. Ogni attacco: +1d4 cumulativo.",lv2:"+1d6 cumulativo",lv3:"Puoi designare bersagli diversi",lv4:"Costo 3",lv5:"FINALE: automatico ogni tuo turno, costo 2"},
    {nome:"Legame Empatico",costo:"2",desc:"A.Bonus. Vedi attraverso gli occhi di un compagno 1t. Il compagno: Vantaggio su tutto 2t.",lv2:"Comunicazione bidirezionale",lv3:"Vantaggio dura 3t, controllo diretto",lv4:"Condividi le tue Skill al compagno",lv5:"FINALE: permanente su tutti i compagni attivi"}]},
  {cat:5,pos:2,nome:"Veggente del Sogno",flavor:"Anticipa i pericoli e mantiene il gruppo in vita",icon:"🔮",FOR:8,AGI:10,RES:10,INT:13,PER:16,CAR:9,hp:43,fl:44,dif:10,vel:5,dado:"1d6",
   desc:"La classe di supporto più pura. HP bassi — deve stare protetto. Mantiene il gruppo in piedi in situazioni impossibili.",
   skills:[{nome:"Previsione del Colpo",costo:"2",desc:"Inizio round: designa 1 alleato. Se attaccato quel turno: +3 Difesa contro quell'attacco.",lv2:"2 alleati",lv3:"+4 Difesa",lv4:"Copre tutti gli attacchi del turno",lv5:"FINALE: si applica a tutti gli alleati, costo 0"},
    {nome:"Tocco Curativo Avanzato",costo:"4",desc:"Cura alleato entro 6m di 2d8+2 HP. Se già a piena salute: Scudo pari alla cura.",lv2:"3d6+2",lv3:"Rimuove una condizione",lv4:"Costo 3, portata 10m",lv5:"FINALE: cura tutti gli alleati visibili, 2d8+2 a ciascuno"},
    {nome:"Destino Condiviso",costo:"3+✦",desc:"A.Bonus. Per 2t, ogni Scintilla che un alleato spende conta doppio.",lv2:"Costo ✦ rimosso",lv3:"Conta triplo",lv4:"2 alleati simultanei",lv5:"FINALE: intero gruppo per 1t. Costo 6"}]},
  {cat:5,pos:3,nome:"Cacciatore di Anime",flavor:"Nessuno sfugge — nessuno si nasconde",icon:"🎭",FOR:12,AGI:13,RES:11,INT:10,PER:14,CAR:6,hp:48,fl:28,dif:11,vel:6,dado:"1d8",
   desc:"Specializzato contro un singolo bersaglio prioritario. La Caccia Finale è uno dei danni singoli più alti del gioco.",
   skills:[{nome:"Tracciamento Arcano",costo:"1",desc:"A.Bonus. Marca bersaglio. Per tutta la sessione: posizione entro 100m. Vantaggio per inseguire.",lv2:"2 bersagli simultanei",lv3:"Portata 1km, stato approssimativo noto",lv4:"Marca permanente (tutta la campagna)",lv5:"FINALE: passivo — ogni creatura che ti ha visto è automaticamente marcata"},
    {nome:"Colpo di Arresto",costo:"3",desc:"Attacco PER. Danno 1d8+2. Se colpisce: Rallentato 2t (vel /2, –1 azione).",lv2:"Rallentato più severo: vel /3",lv3:"Aggiunge Sanguinante",lv4:"2d6+2, cono",lv5:"FINALE: su bersaglio marcato → Immobilizzato invece di Rallentato"},
    {nome:"Caccia Finale",costo:"5",desc:"Solo su bersaglio marcato. Danno 3d8+2, ignora 50% armatura. Sotto 40% HP: x1.5.",lv2:"4d8+2",lv3:"Ignora 100% armatura",lv4:"Soglia sale a 50% HP",lv5:"FINALE: se uccide → +3 Scintille e Tracciamento si azzera"}]},
  {cat:5,pos:4,nome:"Cercatore del Sogno",flavor:"Conosce il terreno prima ancora di entrarci",icon:"🗺️",FOR:10,AGI:12,RES:11,INT:11,PER:15,CAR:7,hp:56,fl:34,dif:11,vel:6,dado:"1d8",
   desc:"La classe con più vantaggi fuori dal combattimento. La conoscenza del terreno si traduce in danno e controllo precisi.",
   skills:[{nome:"Lettura del Campo",costo:"1",desc:"A.Bonus. Rileva trappole entro 10m, creature invisibili, uscite, coperture. Alleati: +1 Init. prossimo round.",lv2:"Portata 15m, +2 Iniziativa",lv3:"Rivela Skill già usate dai nemici",lv4:"Auto-aggiornamento ogni round",lv5:"FINALE: sempre attiva (passiva)"},
    {nome:"Colpo del Conoscitore",costo:"2",desc:"Attacco PER. Danno 1d8+2. Conosce la debolezza: x1.5 + applica debolezza.",lv2:"2d6+2",lv3:"x2 invece di x1.5",lv4:"Scopre debolezza al momento del colpo",lv5:"FINALE: ignora sempre tutta l'armatura"},
    {nome:"Trappola del Sogno",costo:"3",desc:"Piazza trappola entro 4m. Prima creatura: scegli Immobilizzato (2t), Spaventato (1t+Svantaggio), o Stordito (1t).",lv2:"2 trappole per attivazione",lv3:"Area 2m (più creature)",lv4:"Invisibile anche a sensi soprannaturali",lv5:"FINALE: combina 2 effetti + 2d6 bonus"}]},
  {cat:6,pos:1,nome:"Cavaliere Oscuro",flavor:"Ogni colpo porta un'eco di Flusso oscuro",icon:"🌑",FOR:13,AGI:10,RES:13,INT:12,PER:8,CAR:10,hp:60,fl:36,dif:10,vel:5,dado:"1d10",
   desc:"L'ibrido per eccellenza. La Corruzione accumulata svuota rapidamente il Flusso dei nemici.",
   skills:[{nome:"Lama Corrotta",costo:"3",desc:"Attacco FOR. 1d8+1 + 1d6 oscuro (ignora armatura). Corruzione: prossima Skill nemica +2 Flusso.",lv2:"2d6+1 fisico, 2d6 oscuro",lv3:"Corruzione max 2 stack",lv4:"2d8+1, oscuro 3d6",lv5:"FINALE: Corruzione senza limite stack, si applica a tutti i colpiti"},
    {nome:"Aura di Tenebra",costo:"4",desc:"A.Bonus. Aura 3m 2t: nemici –2 a tutti i tiri, alleati +1 danni oscuri. Immune.",lv2:"Raggio 5m",lv3:"Malus –3",lv4:"Dura 3t",lv5:"FINALE: sempre attiva, costo 2 a inizio scontro"},
    {nome:"Drenaggio Oscuro",costo:"3",desc:"Attacco INT. Drena 1d8+1 Flusso (o HP se esaurito). Recuperi metà del drenato.",lv2:"2d6+1",lv3:"Recuperi 100% del drenato",lv4:"Può drenare Scintille (1 ✦ = 5 Flusso)",lv5:"FINALE: A.Bonus invece di Azione, costo 2"}]},
  {cat:6,pos:2,nome:"Bardo del Sogno",flavor:"Trasforma il gruppo in qualcosa di superiore",icon:"🎵",FOR:10,AGI:12,RES:10,INT:12,PER:10,CAR:16,hp:51,fl:38,dif:11,vel:6,dado:"1d8",
   desc:"Non è forte da solo. In gruppo è un moltiplicatore. Il Canto in forma finale è la combinazione offensiva più alta del gioco.",
   skills:[{nome:"Canto di Battaglia",costo:"3",desc:"Azione. Alleati entro 8m: +1d4 danni 2t. Tu non attacchi mentre canti.",lv2:"+1d6",lv3:"Raggio 12m",lv4:"+1d8, costo 2",lv5:"FINALE: sempre attivo (passivo), costo 2 a inizio scontro, +1d6 permanente"},
    {nome:"Nota Dissonante",costo:"2",desc:"CAR vs INT DC 12. Pieno: Svantaggio su tutto 1t + 1d6 sonici. Parziale: Svantaggio.",lv2:"Pieno 2t + 2d6",lv3:"Area 4m, tiro separato per ciascuno",lv4:"DC 14 + Rallentato",lv5:"FINALE: no tiro difensivo. Tutti nemici entro 6m subiscono automaticamente"},
    {nome:"Ballata Ispiratrice",costo:"4+✦",desc:"A.Bonus. Un alleato: Vantaggio su TUTTI i tiri nel suo prossimo turno intero.",lv2:"Costo ✦ rimosso",lv3:"Dura 2 turni",lv4:"Costo 3",lv5:"FINALE: tutti gli alleati simultaneamente per 1t. Costo 6"}]},
  {cat:6,pos:3,nome:"Sciamano",flavor:"Controlla il campo con le forze naturali",icon:"🌊",FOR:10,AGI:10,RES:12,INT:13,PER:13,CAR:8,hp:59,fl:42,dif:10,vel:5,dado:"1d8",
   desc:"Lo Sciamano non ha un ruolo fisso — è tutto nello stesso corpo. Danno, controllo, supporto.",
   skills:[{nome:"Fulmine dello Sciamano",costo:"4",desc:"Catena automatica: 2d6+1 al primo, salta al più vicino (1d6+1), poi ancora (1d4+1). No tiro.",lv2:"Catena 4 salti",lv3:"2° e 3° salto = 2d6+1",lv4:"Tutti i salti 3d6+1",lv5:"FINALE: catena illimitata. 2d8+1 per salto"},
    {nome:"Radici di Pietra",costo:"3",desc:"Bersaglio entro 12m. PER vs AGI DC 13. Pieno: Immobilizzato 1t. Parziale: Rallentato.",lv2:"Immobilizzato 2t",lv3:"Area 4m",lv4:"DC 15, radici fanno 1d6/turno",lv5:"FINALE: durata a discrezione Sciamano. 2d6/turno"},
    {nome:"Totem Curativo",costo:"3",desc:"Piazza totem entro 6m (HP 10). Ogni turno: 1d4+1 HP all'alleato più vicino entro 4m. Dura 3t.",lv2:"HP 20, 1d6+1",lv3:"Cura tutti gli alleati entro 4m",lv4:"Totem si sposta (tua A.Bonus)",lv5:"FINALE: 2 totem, 2d4+1 HP a tutti entro 4m ogni turno"}]},
  {cat:6,pos:4,nome:"Maestro del Tempo",flavor:"Chi controlla il ritmo controlla tutto",icon:"⏳",FOR:8,AGI:14,RES:10,INT:14,PER:10,CAR:10,hp:53,fl:48,dif:12,vel:7,dado:"1d6",
   desc:"Una delle classi più complesse ma più potenti. Rubare un turno al nemico può ribaltare qualsiasi scontro.",
   skills:[{nome:"Rallentamento Temporale",costo:"4",desc:"INT vs INT DC 13. Pieno: Rallentato (vel/3, 1 azione/turno) 2t. Parziale: 1t.",lv2:"Pieno 3t, Parziale 2t",lv3:"Area 4m",lv4:"DC 15, quasi totale: 1 azione per 2 turni",lv5:"FINALE: no tiro vs già colpiti in questo scontro"},
    {nome:"Bolla Temporale",costo:"3",desc:"A.Bonus. Alleato entro 8m: turno extra a fine round (A.Bonus + Movimento). 1/sessione.",lv2:"2/sessione",lv3:"Turno completo invece di A.Bonus",lv4:"3/sessione",lv5:"FINALE: ogni round, nessun limite, sempre turno completo"},
    {nome:"Inversione del Momento",costo:"6",desc:"Reazione. Sospendi danno a un alleato: il Maestro lo paga al prossimo turno.",lv2:"Costo 5",lv3:"Sospende qualsiasi effetto negativo, non solo danni",lv4:"Costo 4",lv5:"FINALE: costo 0, 3/round"}]},
];

const GRUPPI_FRAMMENTI = [
  {id:1,nome:"Guardiani",desc:"Eco diretto dei quattro Guardiani primordiali"},
  {id:2,nome:"Caos",desc:"Eco del Cristallo Oscuro e della Frattura"},
  {id:3,nome:"Fazioni",desc:"Eco delle grandi Fazioni di Arkadia2099"},
  {id:4,nome:"Guerra",desc:"Eco dei tre Pandora e delle guerre cosmiche"},
  {id:5,nome:"Corpo",desc:"Eco delle trasformazioni fisiche e biologiche"},
  {id:6,nome:"Destino",desc:"Eco del Creatore frammentato e della profezia"},
];

const FRAMMENTI = [
  {gruppo:1,pos:1,nome:"Frammento di Raos",fonte:"Guardiano della Luce",flavor:"In chi la ospita, la luce brucia più forte — anche nell'oscurità totale.",mec_breve:"Osserva Skill nemica 3× → INT DC 12 per apprenderla",mec:"Dopo aver visto la stessa Skill nemica usata 3 volte: tiro INT DC 12 (Rank uguale/inferiore) o DC 17 (Rank superiore). Successo: Skill tua a Lv 1, costo 60 PS. Nessun limite."},
  {gruppo:1,pos:2,nome:"Frammento di Baros",fonte:"Guardiano della Materia",flavor:"Chi porta il suo frammento diventa un muro tra il caos e chi ama.",mec_breve:"Passivo. Devia danno alleato su te, dimezzato",mec:"Passivo permanente. Quando un alleato visibile entro 8m sta per subire danno: puoi riceverlo tu al suo posto, dimezzato. Dichiara PRIMA del calcolo. Nessun limite."},
  {gruppo:1,pos:3,nome:"Frammento di Arkan",fonte:"Guardiano del Tempo",flavor:"Chi porta un suo frammento tocca il tempo — brevemente, a carissimo prezzo.",mec_breve:"Reazione: modifica dado ±1d4 (3 Flusso) o ritiro (8 Flusso+✦). 3/sessione.",mec:"Come Reazione dopo un tiro: spendi 3 Flusso per modificarlo di ±1d4, OPPURE 8 Flusso + 1 Scintilla per un ritiro completo. Utilizzi: 3/sessione (Rank F-D), 5 (C-A), illimitati (S+)."},
  {gruppo:1,pos:4,nome:"Frammento di Drako",fonte:"Guardiano dell'Ombra",flavor:"Un frammento di quella quiete assoluta risiede in te.",mec_breve:"Immune a 1 condizione (Rank F). Da Rank B: immune a 2.",mec:"Scegli una condizione al Rank F: Veleno, Paura, Stordimento, Rallentamento, o Accecamento. Immune permanentemente. Da Rank B: scegli una seconda condizione."},
  {gruppo:1,pos:5,nome:"Frammento del Muro Arkano",fonte:"Reliquia Era della Ricostruzione",flavor:"Un frammento di quella struttura vive in te.",mec_breve:"1/sessione: per 1 turno intero tutti i danni ricevuti diventano 1.",mec:"Una volta per sessione, come Reazione prima del calcolo del danno: per l'intero turno in corso, ogni fonte di danno ti infligge esattamente 1 HP."},
  {gruppo:1,pos:6,nome:"Frammento della Prima Legge",fonte:"Eco del Creatore primordiale",flavor:"'A ogni principio segue una fine. E ogni fine conserva un'origine.'",mec_breve:"1/giorno: a 0 HP sopravvivi con 1 HP. Nemici entro 4m: 2d6 danni.",mec:"Reazione automatica a 0 HP. Rimani in piedi con 1 HP. Nemici entro 4m: 2d6 danni (RES DC 13: Storditi 1t). Si riattiva ad ogni riposo lungo."},
  {gruppo:2,pos:1,nome:"Frammento del Cristallo Oscuro",fonte:"Eco del Primo Tradimento",flavor:"Alcuni frammenti conservano la promessa originaria: la libertà dal limite.",mec_breve:"A.Bonus (3 Flusso): stealth assoluto. Prossimo attacco = critico auto. 1-3/scontro.",mec:"Azione Bonus (3 Flusso): Ombra Assoluta. Invisibile e inudibile. Primo attacco in questo stato = critico auto (danno x2). Termina dopo l'attacco o fine turno. Utilizzi: 1 (F-D), 2 (C-A), 3 (S+)."},
  {gruppo:2,pos:2,nome:"Frammento di Seraphin",fonte:"Eco del Primo Traditore",flavor:"Seraphin non fu mai sconfitto — fu esiliato.",mec_breve:"Non puoi essere sorpreso. Critici 19-20. Vantaggio vs bersagli con meno HP.",mec:"Tre effetti passivi permanenti: non puoi essere sorpreso; critici con 19 o 20 naturale (danno x2); Vantaggio se attacchi bersaglio con HP correnti inferiori ai tuoi."},
  {gruppo:2,pos:3,nome:"Frammento della Frattura",fonte:"Eco del Primo Pandora",flavor:"Alcune creature impararono ad abitare l'instabilità.",mec_breve:"Pari su d20 = +2. Dispari = -1. La fortuna diventa statistica.",mec:"Passivo. Risultato naturale pari su 1d20: conta come +2 in più. Risultato naturale dispari: conta come -1. Il 20 pari vale 22 (sempre critico). L'1 dispari vale 0 (sempre fallimento critico)."},
  {gruppo:2,pos:4,nome:"Frammento del Velo Riflesso",fonte:"Eco delle Memorie Viventi",flavor:"Chi porta questo frammento restituisce il danno narrativo ai mittenti.",mec_breve:"Reazione (4 Flusso): riflette 30% danno magico ricevuto al mittente.",mec:"Come Reazione a danno magico/Flusso: spendi 4 Flusso. Il 30% del danno subito viene riflesso al mittente come danno puro non riducibile. Se lo uccide: +2 Scintille."},
  {gruppo:2,pos:5,nome:"Frammento dell'Onda d'Impatto",fonte:"Eco della Guerra del Codice",flavor:"Ogni colpo risuonava su più piani. Un eco di quella risonanza persiste.",mec_breve:"Passivo. Ogni tuo attacco a segno: 2 danni automatici a ogni nemico entro 2m.",mec:"Passivo. Ogni volta che un tuo attacco colpisce, tutti gli altri nemici entro 2 metri dal bersaglio subiscono automaticamente 2 danni non riducibili."},
  {gruppo:2,pos:6,nome:"Frammento della Dissonanza",fonte:"Eco del Secondo Pandora",flavor:"Le magie fallivano con frequenza crescente. Un eco imprevedibile persiste.",mec_breve:"Condizioni che applichi: +1 turno. Applicarne 2+ nello stesso turno: +1 Scintilla.",mec:"Due effetti: ogni condizione che applichi ha durata +1 turno; se applichi 2+ condizioni distinte allo stesso bersaglio nello stesso turno, guadagni immediatamente 1 Scintilla."},
  {gruppo:3,pos:1,nome:"Frammento dell'A.R.U.",fonte:"Eco Saint of Cosmos",flavor:"Un frammento di quell'armonia cerca di distribuirsi.",mec_breve:"Inizio sessione: tutti gli alleati +1 a un tipo di tiro. Dura tutta la sessione.",mec:"All'inizio di ogni sessione, designi un tipo di tiro (attacco, danno, tiri salvezza, o iniziativa). Ogni alleato guadagna +1 a quel tipo per l'intera sessione."},
  {gruppo:3,pos:2,nome:"Frammento della Culla Cogher",fonte:"Eco di Breyin Cogher — Lullaby",flavor:"Un frammento della sua empatia cerca chi sa sentire gli altri.",mec_breve:"A.Bonus (1 Flusso): vedi attraverso alleato entro 60m. Alla sua morte: +2✦ + Vantaggio 2t.",mec:"Due effetti: (1) Azione Bonus (1 Flusso): vedi e senti attraverso un alleato entro 60m per 1 turno; (2) Ogni volta che un alleato muore in combattimento: +2 Scintille e Vantaggio su tutto per 2 turni."},
  {gruppo:3,pos:3,nome:"Frammento del Codice Rosso",fonte:"Eco Lions and Blood",flavor:"Il Codice Rosso è inciso su armi da cerimonia. Chi lo ha interiorizzato non dimentica.",mec_breve:"Skill mancata: +1 al prossimo tiro con quella Skill (max +5). Si azzera al primo colpo.",mec:"Passivo. Ogni volta che una Skill non colpisce/fallisce, accumuli +1 al prossimo tiro con QUELLA STESSA Skill. Massimo +5. Si azzera al primo colpo riuscito."},
  {gruppo:3,pos:4,nome:"Frammento dei Nodi Neri",fonte:"Eco degli Ombra",flavor:"Chi porta questo frammento fa lo stesso con se stesso.",mec_breve:"1/sessione: teletrasporto a luoghi visitati. In combattimento: 30m (2 Flusso, A.Bonus).",mec:"Due modalità: (1) 1/sessione come Azione Principale: teletrasporto a qualsiasi luogo visitato in questa campagna; (2) Azione Bonus (2 Flusso): teletrasporto a punto visibile entro 30m."},
  {gruppo:3,pos:5,nome:"Frammento della Coscienza Civile",fonte:"Eco Nova Era",flavor:"Un frammento di quella tecnologia permette di modificare la realtà.",mec_breve:"1/sessione: modifica terreno entro 30m. In combattimento: effetto minore (INT DC 14).",mec:"1/sessione come Azione Principale: modifica fisicamente il terreno entro 30m. Il GM valida la plausibilità."},
  {gruppo:3,pos:6,nome:"Frammento Multialleanza",fonte:"Eco M.A.F.I.A.",flavor:"Chi comanda, riscrive. Un frammento di quella filosofia pragmatica persiste.",mec_breve:"1/sessione: crea copia funzionale di te per 2 turni (HP/2, stessa Difesa, 1 Skill base).",mec:"1/sessione come Azione Principale: crei una copia funzionale. HP = metà dei tuoi correnti, stessa Difesa, usa una tua Skill base a scelta. Agisce subito dopo di te. Dura 2 turni."},
  {gruppo:4,pos:1,nome:"Frammento della Guerra delle Meteore",fonte:"Eco della rabbia orchesca",flavor:"Il furore si condensò come rabbia purificata nel Flusso.",mec_breve:"1/scontro (A.Bonus): Furia 3t — danni fisici +50%, immune condizioni fisiche. Poi Esausto 2t.",mec:"1/scontro Azione Bonus: Furia Ancestrale 3 turni. Durante: danni fisici +50%, immune condizioni fisiche, no Skill >2 Flusso. Fine: Esausto 2 turni."},
  {gruppo:4,pos:2,nome:"Frammento del Codice Bruciato",fonte:"Ceneri del Codice Arkadiano",flavor:"Le ultime parole del Codice non si spensero. Cercano ancora qualcuno.",mec_breve:"Passivo. Ogni tuo critico applica Rottura Armatura (–2 Difesa, max –6, fino a fine scontro).",mec:"Passivo. Ogni tuo critico applica automaticamente Rottura Armatura: –2 Difesa al bersaglio. Cumulabile fino a –6. La riduzione dura fino a fine scontro."},
  {gruppo:4,pos:3,nome:"Frammento della Bilancia Rotta",fonte:"Reliquia del Terzo Pandora",flavor:"Chi porta questo frammento vede i fili del destino prima che si tendano.",mec_breve:"Inizio sessione: il GM ti dice un evento certo. 1/scontro: inverte un risultato di dado.",mec:"Due effetti: (1) Il GM ti rivela in segreto un evento certo all'inizio sessione; (2) 1/scontro, dopo un tiro, puoi dichiarare Inversione: il risultato diventa (21 − risultato naturale)."},
  {gruppo:4,pos:4,nome:"Frammento della Soglia",fonte:"Eco del potere limite",flavor:"Sotto il 20% HP, qualcosa si sveglia nel codice.",mec_breve:"Passivo. Sotto 20% HP: danni x2, Flusso 0, +3 Difesa, immune Spaventato/Stordito.",mec:"Passivo. Sotto 20% HP massimi: danni x2, costo Flusso 0, Difesa +3, immune Spaventato e Stordito. Sotto 10%: danni x2.5 + 1 Scintilla per turno sopravvissuto."},
  {gruppo:4,pos:5,nome:"Frammento di Jixal",fonte:"Eco del Re di Arkadium",flavor:"La sua volontà era cosmica — non si piegava a nulla.",mec_breve:"Immune a controllo mentale/illusioni. Scintille guadagnate +1. Max Scintille +3.",mec:"Tre effetti permanenti: immune a controllo mentale e illusioni; ogni Scintilla guadagnata è +1; limite massimo Scintille sale da 10 a 13."},
  {gruppo:4,pos:6,nome:"Frammento dei Sette Eroi",fonte:"Eco dell'Era degli Eroi",flavor:"Un eco di quella coesione persiste.",mec_breve:"Passivo. Per ogni alleato con Frammento entro 10m: +1 a tutti i tuoi tiri.",mec:"Passivo. Per ogni alleato con Frammento del Creatore entro 10m da te durante uno scontro: +1 cumulativo a tutti i tuoi tiri."},
  {gruppo:5,pos:1,nome:"Frammento Adattivo",fonte:"Eco delle Mutazioni Frammentarie",flavor:"Un frammento di quella adattabilità può essere controllato.",mec_breve:"Passivo. Primo tipo di danno per scontro: guadagni Resistenza a quel tipo (max 3).",mec:"Passivo. La prima volta che subisci danno di un tipo specifico in uno scontro, guadagni Resistenza a quel tipo per il resto dello scontro. Massimo 3 resistenze diverse simultaneamente."},
  {gruppo:5,pos:2,nome:"Frammento del Vampirismo",fonte:"Eco del Flusso Residuale",flavor:"Chi lo tocca impara a nutrirsi delle realtà in dissolvenza.",mec_breve:"Passivo. Ogni attacco a segno: recuperi HP = 20% del danno inflitto.",mec:"Passivo. Ogni volta che infliggi danno con qualsiasi attacco o Skill, recuperi HP pari al 20% del danno (min 1 se colpisci)."},
  {gruppo:5,pos:3,nome:"Frammento della Velocità",fonte:"Eco dell'Instabilità Post-Pandorica",flavor:"Un eco di quella velocità impossibile sopravvive.",mec_breve:"Velocità +3 permanente. Mai attacchi di opportunità. A.Bonus (1 Flusso): 2° movimento.",mec:"Tre effetti: velocità di movimento +3 permanente; non provochi mai attacchi di opportunità; Azione Bonus (1 Flusso) per un secondo movimento nello stesso turno."},
  {gruppo:5,pos:4,nome:"Frammento della Pelle di Mithral",fonte:"Eco dei Custodi della Pietra",flavor:"Il corpo divenne parte della pietra stessa.",mec_breve:"+1 Difesa permanente. Immune ai veleni. Vantaggio su TS contro condizioni fisiche.",mec:"Tre effetti permanenti: Difesa Base +1; immunità completa a tutti i veleni; Vantaggio su tutti i tiri salvezza contro condizioni fisiche."},
  {gruppo:5,pos:5,nome:"Frammento della Rigenerazione",fonte:"Eco della Furia del Sangue",flavor:"Un frammento di quella biologia impossibile persiste.",mec_breve:"Passivo. Inizio di ogni tuo turno in combattimento: recupera 2+mod RES HP (min 2).",mec:"Passivo. All'inizio di ogni tuo turno in combattimento: recuperi automaticamente 2 + modificatore RES HP (minimo 2)."},
  {gruppo:5,pos:6,nome:"Frammento della Visione del Sogno",fonte:"Eco degli Elfi Luminali",flavor:"Chi porta questo frammento vede oltre la superficie della realtà.",mec_breve:"Rileva invisibili entro 10m. Vantaggio su illusioni. Vantaggio su Percezione passiva.",mec:"Tre effetti permanenti: rilevi automaticamente entità invisibili entro 10m; Vantaggio su qualsiasi tiro per smascherare illusioni; Vantaggio su tutti i tiri di Percezione passiva."},
  {gruppo:6,pos:1,nome:"Il Nome Vero del Creatore",fonte:"Frammento Primordiale",flavor:"Chi pronuncia il Nome Vero non è più solo un avventuriero. È una nuova bilancia.",mec_breve:"1/campagna: effetto meccanicamente impossibile concordato col GM.",mec:"Una volta per campagna: pronuncia il Nome Vero per ottenere un effetto meccanicamente impossibile concordato col GM. Il Flusso di Arkadia2099 reagisce sempre."},
  {gruppo:6,pos:2,nome:"Frammento del Destino Condiviso",fonte:"Eco della Profezia della Nuova Frattura",flavor:"I Sette Eroi lasciarono nel mondo i semi di una nuova era.",mec_breve:"Inizio sessione: evento certo dal GM. 1/scontro: ritira qualsiasi dado.",mec:"Due effetti: (1) Il GM ti rivela un evento certo all'inizio sessione; (2) 1/scontro: dopo qualsiasi tiro, puoi dichiarare Ritiro Destino — il dado viene ritirato e si usa il nuovo risultato."},
  {gruppo:6,pos:3,nome:"Frammento del Contratto Perduto",fonte:"Eco del Codice Arkadiano",flavor:"Il frammento del tentativo rimase.",mec_breve:"1/campagna: Contratto col GM. Obiettivo impossibile → potere permanente unico.",mec:"1/campagna: stipula un Contratto col GM con un obiettivo narrativo impossibile. Se lo raggiungi: potere permanente unico. Se fallisci: penalità narrativa grave concordata."},
  {gruppo:6,pos:4,nome:"Frammento dell'Anima Accumulata",fonte:"Eco del Codice d'Onore",flavor:"Non si guadagna rango per eredità — lo si guadagna su sangue volontario.",mec_breve:"Ogni scontro vinto: +1 PA speciale. Spendi: +1 danno Skill (1), +5 HP max (2), +1 stat (5).",mec:"Ogni scontro vinto: +1 Punto Anima. Spesa: 1 PA = +1 danno permanente a una Skill; 2 PA = +5 HP massimi permanenti; 5 PA = +1 a una caratteristica permanente."},
  {gruppo:6,pos:5,nome:"Frammento della Benedizione",fonte:"Eco del Serafino Arveil",flavor:"Portarono spiriti antichi come guide.",mec_breve:"1/sessione: evoca Spirito Antico (Battaglia/Guarigione/Saggezza). Stats = tuo Rank.",mec:"1/sessione come Azione Principale: evochi uno Spirito Antico. BATTAGLIA: attacca ogni turno. GUARIGIONE: cura alleato adiacente ogni turno. SAGGEZZA: +2 a tutti i tiri di un alleato. Dura fino a fine sessione."},
  {gruppo:6,pos:6,nome:"Frammento dell'Eco Finale",fonte:"Eco dell'ultima parola del Creatore",flavor:"'Ora siete soli.' Non del tutto.",mec_breve:"1/sessione: boss non può ucciderti (vai a 1 HP). Alleati vicini: +1✦ a inizio sessione.",mec:"Due effetti: (1) 1/sessione, se un boss ti porterebbe a 0 HP con singolo attacco: vai a 1 HP invece; (2) All'inizio di ogni sessione, ogni alleato entro 8m guadagna 1 Scintilla bonus."},
];

const RAZZE = [
  {nome:"Umano",flavor:"Adattabile — nessun limite naturale, nessuna barriera",bonus:"+1 a due caratteristiche diverse a scelta",tratto1:"Adattamento (1/giorno): dopo aver visto il risultato di un dado, aggiungi +2 prima che il GM dichiari l'esito.",tratto2:"Potenziale: PS guadagnati +10%. Ogni Rank pari (E, C, A, SS) sblocca un Talento permanente.",malus:"+1 Scintilla a inizio sessione. Nessun malus.",mod_hp:0,mod_fl:0,mod_dif:0,color:"#185fa5"},
  {nome:"Elfo del Sogno",flavor:"Creatura nativa del Flusso — leggera, magica, fragile",bonus:"+2 AGI, +2 PER, +1 INT / –2 RES / HP max –15%",tratto1:"Visione del Sogno: rilevi automaticamente entità invisibili entro 10m e illusioni.",tratto2:"Affinità Magica: ogni Skill costa 1 Flusso in meno (min 0). Recupera 2 Flusso extra per riposo breve.",malus:"RES –2, HP max –15%, danni da corruzione +2.",mod_hp:-0.15,mod_fl:0,mod_dif:0,color:"#0f6e56"},
  {nome:"Orc del Sogno",flavor:"Guerriero nato — ogni sconfitta lo rende più pericoloso",bonus:"+3 FOR, +2 RES, +1 a scelta / –2 INT / Flusso max –20%",tratto1:"Furia del Sangue: sotto 30% HP automaticamente +2 danni e immunità Spaventato. No Skill >2 Flusso.",tratto2:"Rigenerazione: recupera 2+mod RES HP all'inizio di ogni proprio turno in combattimento.",malus:"INT –2, Flusso max –20%.",mod_hp:9,mod_fl:-0.2,mod_dif:0,color:"#c0392b"},
  {nome:"Fantasma",flavor:"Entità semi-corporea — già attraversata la morte una volta",bonus:"+2 INT, +2 PER, +1 CAR / –3 FOR / no armature pesanti",tratto1:"Corpo d'Ombra: 1/sessione, ignora completamente il primo colpo fisico ricevuto.",tratto2:"Eco della Memoria: percepisce emozioni entro 5m. 1/turno: +3 Difesa contro attacco visto partire.",malus:"FOR –3, nessuna armatura pesante, danno sacro/purificazione ×1.5.",mod_hp:-9,mod_fl:0,mod_dif:0,color:"#534ab7"},
  {nome:"Nano del Sogno",flavor:"Custode della pietra — indistruttibile, lento, insostituibile",bonus:"+2 RES, +2 FOR, +1 INT / –2 AGI / Velocità –1",tratto1:"Pelle di Mithral: +1 Difesa permanente. Immune ai veleni naturali. Vantaggio su TS condizioni fisiche.",tratto2:"Maestro Artigiano: ogni riposo lungo crea 1 oggetto (Bomba, Pozione, Trappola, o Arnese +3).",malus:"AGI –2, Velocità –1 (min 1). Svantaggio su Schivata Attiva.",mod_hp:6,mod_fl:0,mod_dif:1,color:"#854f0b"},
  {nome:"Bestian",flavor:"Umanoide con tratti animali — sensi affinati, corpo agile",bonus:"+2 AGI, +1 PER, +1 FOR / scegli sottospecie al Rank F",tratto1:"Sensi Acuti: non puoi essere sorpreso. Vantaggio su Percezione passiva. Rilevi stealth entro 8m.",tratto2:"Artigli/Morso: 1d6+FOR o AGI come Azione Bonus dopo attacco con arma. Sottospecie: Felino (+1 AGI), Canide (+1 FOR), Rapace (+1 PER).",malus:"Svantaggio Furtività in spazi chiusi (odore). Scegli sottospecie al Rank F.",mod_hp:0,mod_fl:0,mod_dif:0,color:"#3b6d11"},
];

// ═══════════════════════════════════════════════════════
// CANVAS PARTICELLE FLUSSO
// ═══════════════════════════════════════════════════════
function FluxParticles() {
  const canvasRef = useRef(null);
  const animRef   = useRef(null);
  const particles = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    function resize() {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    // Crea particelle
    const N = Math.min(120, Math.floor(window.innerWidth / 14));
    particles.current = Array.from({ length: N }, () => ({
      x:    Math.random() * canvas.width,
      y:    Math.random() * canvas.height,
      vx:   (Math.random() - 0.5) * 0.4,
      vy:   (Math.random() - 0.5) * 0.4 - 0.15,
      r:    Math.random() * 1.8 + 0.4,
      life: Math.random(),
      maxLife: Math.random() * 0.6 + 0.4,
      // colore: viola o teal
      hue:  Math.random() < 0.65 ? 260 + Math.random()*30 : 165 + Math.random()*20,
      sat:  70 + Math.random() * 30,
      pulse: Math.random() * Math.PI * 2,
    }));

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const now = Date.now() * 0.001;

      particles.current.forEach(p => {
        p.pulse += 0.018;
        p.life  += 0.003;
        if (p.life > p.maxLife) {
          // Respawn
          p.x = Math.random() * canvas.width;
          p.y = canvas.height + 10;
          p.life = 0;
          p.maxLife = Math.random() * 0.6 + 0.4;
          p.vx = (Math.random() - 0.5) * 0.4;
          p.vy = -(Math.random() * 0.5 + 0.1);
          p.r  = Math.random() * 1.8 + 0.4;
          p.hue = Math.random() < 0.65 ? 260 + Math.random()*30 : 165 + Math.random()*20;
        }

        p.x += p.vx + Math.sin(now * 0.7 + p.pulse) * 0.2;
        p.y += p.vy;

        const progress = p.life / p.maxLife;
        const alpha = progress < 0.15
          ? progress / 0.15
          : progress > 0.75
            ? (1 - progress) / 0.25
            : 1;

        const glow = p.r * (1.5 + Math.sin(p.pulse) * 0.5);

        // Alone luminoso
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glow * 3.5);
        grad.addColorStop(0,   `hsla(${p.hue},${p.sat}%,75%,${alpha * 0.45})`);
        grad.addColorStop(0.4, `hsla(${p.hue},${p.sat}%,65%,${alpha * 0.15})`);
        grad.addColorStop(1,   `hsla(${p.hue},${p.sat}%,55%,0)`);
        ctx.beginPath();
        ctx.arc(p.x, p.y, glow * 3.5, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        // Nucleo
        ctx.beginPath();
        ctx.arc(p.x, p.y, glow * 0.7, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue},${p.sat}%,88%,${alpha * 0.85})`;
        ctx.fill();
      });

      // Connessioni tra particelle vicine
      for (let i = 0; i < particles.current.length; i++) {
        for (let j = i + 1; j < particles.current.length; j++) {
          const a = particles.current[i];
          const b = particles.current[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          if (dist < 90) {
            const alpha = (1 - dist/90) * 0.08;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(140,110,255,${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      animRef.current = requestAnimationFrame(draw);
    }

    draw();
    return () => {
      window.removeEventListener("resize", resize);
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 0,
        opacity: 0.55,
      }}
    />
  );
}

// ═══════════════════════════════════════════════════════
// IMMAGINE CON FALLBACK GRADIENT
// ═══════════════════════════════════════════════════════
function CatImage({ catId, style = {}, className = "" }) {
  const [loaded, setLoaded] = useState(false);
  const [error,  setError]  = useState(false);

  return (
    <div style={{
      position: "relative",
      overflow: "hidden",
      background: CAT_GRADIENT[catId],
      ...style,
    }} className={className}>
      {!error && (
        <img
          src={CAT_IMAGES[catId]}
          alt=""
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: loaded ? 1 : 0,
            transition: "opacity 0.5s ease",
          }}
        />
      )}
      {/* Overlay sempre presente per leggibilità testo */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: `linear-gradient(to bottom, transparent 30%, rgba(3,1,10,0.85) 100%)`,
        zIndex: 1,
      }} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// CSS GLOBALE
// ═══════════════════════════════════════════════════════
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Cinzel+Decorative:wght@400;700&family=Raleway:wght@300;400;500;600&display=swap');

    :root {
      --bg-deep:        #03010a;
      --bg-card:        #0d0a1a;
      --bg-card2:       #110e20;
      --border:         rgba(140,110,255,0.18);
      --border-bright:  rgba(140,110,255,0.45);
      --purple:         #8c6eff;
      --purple-dim:     #534ab7;
      --purple-glow:    rgba(140,110,255,0.25);
      --gold:           #d4a843;
      --gold-dim:       #9a7520;
      --gold-glow:      rgba(212,168,67,0.2);
      --gold-bright:    #f0c060;
      --text:           #c8bfe8;
      --text-dim:       #7a6ea0;
      --text-bright:    #ede8ff;
      --flux:           #7af0c8;
      --danger:         #e05050;
      --success:        #4ecb71;
    }

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      background: var(--bg-deep);
      color: var(--text);
      font-family: 'Raleway', sans-serif;
      min-height: 100vh;
      overflow-x: hidden;
    }

    ::-webkit-scrollbar { width: 5px; }
    ::-webkit-scrollbar-track { background: var(--bg-deep); }
    ::-webkit-scrollbar-thumb { background: var(--purple-dim); border-radius: 3px; }

    #app-root {
      position: relative;
      min-height: 100vh;
      background:
        radial-gradient(ellipse at 15% 25%, rgba(83,74,183,0.10) 0%, transparent 55%),
        radial-gradient(ellipse at 85% 70%, rgba(122,240,200,0.05) 0%, transparent 45%),
        var(--bg-deep);
    }

    .app-content { position: relative; z-index: 1; }

    @keyframes dice-roll {
      0%   { transform: rotate(0deg) scale(1); }
      25%  { transform: rotate(180deg) scale(1.3); }
      50%  { transform: rotate(360deg) scale(0.8); }
      75%  { transform: rotate(540deg) scale(1.2); }
      100% { transform: rotate(720deg) scale(1); }
    }
    @keyframes dice-settle {
      0%   { transform: scale(1.2); }
      50%  { transform: scale(0.95); }
      100% { transform: scale(1); }
    }
    @keyframes slide-in {
      from { opacity: 0; transform: translateY(16px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes fade-in {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50%      { transform: translateY(-8px); }
    }
    @keyframes shimmer {
      0%   { background-position: -400px 0; }
      100% { background-position: 400px 0; }
    }

    .anim-slide-in { animation: slide-in 0.3s ease forwards; }
    .anim-fade-in  { animation: fade-in  0.4s ease forwards; }

    /* ── Navbar ── */
    .navbar {
      position: sticky; top: 0; z-index: 100;
      background: rgba(3,1,10,0.88);
      backdrop-filter: blur(20px);
      border-bottom: 1px solid var(--border);
      padding: 0 2rem;
      display: flex; align-items: center; height: 64px; gap: 2rem;
    }
    .navbar-logo {
      font-family: 'Cinzel Decorative', serif;
      font-size: 1.05rem; font-weight: 700;
      background: linear-gradient(135deg, var(--gold) 0%, var(--purple) 100%);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      background-clip: text; letter-spacing: 0.05em;
      white-space: nowrap; cursor: pointer;
    }
    .navbar-logo-img {
      height: 36px; width: auto; object-fit: contain;
      filter: drop-shadow(0 0 8px rgba(140,110,255,0.4));
    }
    .navbar-divider { height: 28px; width: 1px; background: var(--border); flex-shrink: 0; }
    .navbar-nav { display: flex; gap: 0.25rem; flex-wrap: wrap; }
    .nav-btn {
      background: none; border: none;
      color: var(--text-dim);
      font-family: 'Raleway', sans-serif; font-size: 0.82rem;
      font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase;
      padding: 0.4rem 0.9rem; border-radius: 4px;
      cursor: pointer; transition: all 0.2s; position: relative;
    }
    .nav-btn:hover { color: var(--text-bright); background: rgba(140,110,255,0.08); }
    .nav-btn.active { color: var(--purple); background: rgba(140,110,255,0.12); }
    .nav-btn.active::after {
      content: ''; position: absolute; bottom: -1px; left: 50%;
      transform: translateX(-50%); width: 60%; height: 2px;
      background: var(--purple); border-radius: 1px;
    }

    /* ── Layout ── */
    .page {
      max-width: 1280px; margin: 0 auto;
      padding: 2rem; min-height: calc(100vh - 64px);
    }

    /* ── Cards ── */
    .card {
      background: var(--bg-card); border: 1px solid var(--border);
      border-radius: 8px; transition: all 0.25s;
    }
    .card:hover { border-color: var(--border-bright); background: var(--bg-card2); }

    /* ── Typography ── */
    .section-title {
      font-family: 'Cinzel', serif; font-size: 0.75rem; font-weight: 600;
      letter-spacing: 0.2em; text-transform: uppercase;
      color: var(--text-dim); margin-bottom: 0.5rem;
    }
    .page-title {
      font-family: 'Cinzel', serif; font-size: 2rem; font-weight: 700;
      color: var(--text-bright); margin-bottom: 0.5rem;
    }
    .page-subtitle {
      color: var(--text-dim); font-size: 0.9rem;
      margin-bottom: 2rem; line-height: 1.6;
    }

    /* ── Stat bubble ── */
    .stat-bubble {
      display: flex; flex-direction: column; align-items: center; gap: 2px;
      padding: 0.5rem 0.6rem;
      background: rgba(140,110,255,0.06); border: 1px solid var(--border);
      border-radius: 6px; min-width: 50px;
    }
    .stat-name  { font-size: 0.65rem; font-weight: 700; letter-spacing: 0.1em; color: var(--text-dim); text-transform: uppercase; }
    .stat-value { font-family: 'Cinzel', serif; font-size: 1.1rem; font-weight: 700; color: var(--text-bright); line-height: 1; }
    .stat-mod   { font-size: 0.7rem; font-weight: 600; color: var(--purple); }

    /* ── Dice ── */
    .dice-container { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; }
    .dice {
      width: 80px; height: 80px;
      background: var(--bg-card2); border: 2px solid var(--border-bright);
      border-radius: 12px; display: flex; align-items: center; justify-content: center;
      font-family: 'Cinzel', serif; font-size: 2rem; font-weight: 900;
      color: var(--text-bright); cursor: pointer; transition: all 0.2s;
      position: relative; overflow: hidden; user-select: none;
    }
    .dice:hover { border-color: var(--purple); transform: translateY(-2px); box-shadow: 0 4px 20px rgba(140,110,255,0.25); }
    .dice.rolling { animation: dice-roll 0.6s ease-in-out; border-color: var(--gold); color: var(--gold); box-shadow: 0 0 20px var(--gold-glow); }
    .dice.settled  { animation: dice-settle 0.3s ease; border-color: var(--purple); color: var(--gold-bright); box-shadow: 0 0 16px var(--purple-glow); }

    /* ── Buttons ── */
    .btn {
      display: inline-flex; align-items: center; justify-content: center; gap: 0.4rem;
      font-family: 'Raleway', sans-serif; font-weight: 700; font-size: 0.85rem;
      letter-spacing: 0.06em; padding: 0.6rem 1.2rem;
      border-radius: 6px; border: none; cursor: pointer;
      transition: all 0.2s; text-transform: uppercase;
    }
    .btn-primary {
      background: linear-gradient(135deg, var(--purple-dim), var(--purple)); color: white;
    }
    .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(140,110,255,0.35); }
    .btn-gold {
      background: linear-gradient(135deg, var(--gold-dim), var(--gold)); color: #1a1000;
    }
    .btn-gold:hover { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(212,168,67,0.35); }
    .btn-outline {
      background: transparent; color: var(--text-dim); border: 1px solid var(--border);
    }
    .btn-outline:hover { color: var(--text-bright); border-color: var(--border-bright); background: rgba(140,110,255,0.06); }
    .btn-danger {
      background: rgba(224,80,80,0.15); color: var(--danger); border: 1px solid rgba(224,80,80,0.3);
    }
    .btn-danger:hover { background: rgba(224,80,80,0.25); border-color: var(--danger); }

    /* ── Input ── */
    .input-field {
      background: rgba(140,110,255,0.06); border: 1px solid var(--border);
      border-radius: 6px; padding: 0.6rem 0.9rem;
      color: var(--text-bright); font-family: 'Raleway', sans-serif;
      font-size: 0.9rem; width: 100%; transition: border-color 0.2s; outline: none;
    }
    .input-field:focus { border-color: var(--purple); background: rgba(140,110,255,0.1); }

    /* ── Progress bar ── */
    .progress-bar { height: 6px; background: rgba(140,110,255,0.1); border-radius: 3px; overflow: hidden; }
    .progress-fill {
      height: 100%; border-radius: 3px;
      background: linear-gradient(90deg, var(--purple-dim), var(--purple));
      transition: width 0.5s ease;
    }

    /* ── Skill card ── */
    .skill-card {
      background: rgba(140,110,255,0.04); border: 1px solid var(--border);
      border-radius: 6px; padding: 1rem; transition: all 0.2s;
    }
    .skill-card:hover { background: rgba(140,110,255,0.08); border-color: var(--border-bright); }

    /* ── Modal ── */
    .modal-overlay {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.88); backdrop-filter: blur(10px);
      z-index: 200; display: flex; align-items: center; justify-content: center;
      padding: 1rem; animation: fade-in 0.2s ease;
    }
    .modal-content {
      background: var(--bg-card); border: 1px solid var(--border-bright);
      border-radius: 12px; max-width: 800px; width: 100%;
      max-height: 90vh; overflow-y: auto;
      box-shadow: 0 0 60px rgba(140,110,255,0.2);
      animation: slide-in 0.3s ease;
    }

    /* ── Category banner con immagine ── */
    .cat-banner {
      position: relative; overflow: hidden;
      border-radius: 8px; margin-bottom: 1rem;
      height: 120px;
    }
    .cat-banner-content {
      position: absolute; bottom: 0; left: 0; right: 0;
      padding: 1rem 1.2rem; z-index: 2;
      display: flex; align-items: flex-end; gap: 1rem;
    }

    /* ── Hero ── */
    .hero {
      text-align: center; padding: 4rem 2rem 3rem;
      position: relative;
    }
    .hero-title {
      font-family: 'Cinzel Decorative', serif;
      font-size: clamp(2rem, 6vw, 4.5rem); font-weight: 700;
      background: linear-gradient(135deg, var(--gold-bright) 0%, var(--purple) 50%, var(--flux) 100%);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      background-clip: text; line-height: 1.2; margin-bottom: 0.5rem;
      animation: float 6s ease-in-out infinite;
    }
    .hero-sub {
      font-family: 'Cinzel', serif;
      font-size: clamp(0.8rem, 2vw, 1.1rem);
      letter-spacing: 0.25em; text-transform: uppercase;
      color: var(--text-dim); margin-bottom: 2rem;
    }

    /* ── Hero bg image ── */
    .hero-bg {
      position: absolute; inset: 0;
      background-size: cover; background-position: center;
      z-index: -1; opacity: 0.12;
      filter: blur(2px);
    }

    /* ── Separator ── */
    .sep {
      height: 1px;
      background: linear-gradient(90deg, transparent, var(--border-bright), transparent);
      margin: 1.5rem 0;
    }

    /* ── Cat header ── */
    .cat-header {
      display: flex; align-items: center; gap: 1rem;
      padding: 0.8rem 1.2rem; border-radius: 8px; margin-bottom: 1rem;
    }
    .cat-number {
      font-family: 'Cinzel', serif; font-size: 2rem;
      font-weight: 900; opacity: 0.9; line-height: 1;
    }

    /* ── Grids ── */
    .grid-2    { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
    .grid-3    { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
    .grid-4    { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.75rem; }
    .grid-auto { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1rem; }

    @media (max-width: 768px) {
      .grid-2, .grid-3, .grid-4 { grid-template-columns: 1fr; }
      .grid-auto { grid-template-columns: 1fr; }
      .page { padding: 1rem; }
      .navbar { padding: 0 1rem; gap: 1rem; }
    }
  `}</style>
);

// ═══════════════════════════════════════════════════════
// UTILITY
// ═══════════════════════════════════════════════════════
const modVal = v => Math.floor((v-10)/2);
const fmtMod = v => { const m = modVal(v); return (m>=0?"+":"")+m; };
const getRankColor = r => ({F:"#9090b0",E:"#5f9f5f",D:"#5f8faf",C:"#8f6fdf",B:"#df8f3f",A:"#df4f4f",S:"#d4a843",SS:"#f0c060",SSS:"#ffe080"})[r]||"#9090b0";

function getRankFromPA(pa) {
  let rank = "F";
  for (const r of RANKS) { if (pa >= RANK_PA[r]) rank = r; }
  return rank;
}
function getNextRankPA(rank) {
  const i = RANKS.indexOf(rank);
  if (i < RANKS.length-1) return RANK_PA[RANKS[i+1]];
  return null;
}

// ═══════════════════════════════════════════════════════
// UI COMPONENTS
// ═══════════════════════════════════════════════════════
function StatBubble({ name, value, highlight }) {
  return (
    <div className="stat-bubble" style={{ borderColor: highlight ? "rgba(212,168,67,0.3)" : undefined }}>
      <span className="stat-name">{name}</span>
      <span className="stat-value" style={{ color: highlight ? "var(--gold-bright)" : "var(--text-bright)" }}>{value}</span>
      <span className="stat-mod" style={{ color: highlight ? "var(--gold)" : "var(--purple)" }}>{fmtMod(value)}</span>
    </div>
  );
}

function RankBadge({ rank, size="md" }) {
  const color = getRankColor(rank);
  const isS   = ["S","SS","SSS"].includes(rank);
  const sizes = {
    sm: { font:"0.65rem", pad:"2px 6px",  radius:"3px" },
    md: { font:"0.85rem", pad:"4px 10px", radius:"4px" },
    lg: { font:"1.2rem",  pad:"6px 14px", radius:"6px" },
  };
  const s = sizes[size];
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", justifyContent:"center",
      fontFamily:"'Cinzel',serif", fontWeight:900, fontSize:s.font,
      padding:s.pad, borderRadius:s.radius,
      background: isS ? "linear-gradient(135deg,rgba(212,168,67,0.15),rgba(240,192,96,0.1))" : "rgba(140,110,255,0.1)",
      border:`1px solid ${isS ? "rgba(212,168,67,0.4)" : "rgba(140,110,255,0.3)"}`,
      color, boxShadow: isS ? "0 0 8px rgba(212,168,67,0.2)" : undefined,
    }}>{rank}</span>
  );
}

function ProgressBar({ value, max, color="var(--purple)", height=6 }) {
  const pct = Math.min(100, max>0 ? (value/max)*100 : 0);
  return (
    <div style={{ height, background:"rgba(140,110,255,0.1)", borderRadius:height, overflow:"hidden" }}>
      <div style={{
        height:"100%", borderRadius:height,
        background:`linear-gradient(90deg,${color}99,${color})`,
        width:`${pct}%`, transition:"width 0.5s ease",
      }} />
    </div>
  );
}

function Dice({ value, rolling, settled, onClick, label, size=80 }) {
  return (
    <div className="dice-container">
      <div
        className={`dice ${rolling?"rolling":""} ${settled&&!rolling?"settled":""}`}
        style={{ width:size, height:size, fontSize:size*0.35 }}
        onClick={onClick}
      >
        {rolling ? "?" : (value||"?")}
      </div>
      {label && <span style={{ fontSize:"0.75rem", color:"var(--text-dim)", textAlign:"center", letterSpacing:"0.06em" }}>{label}</span>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// CLASSE DETAIL MODAL
// ═══════════════════════════════════════════════════════
function ClasseDetail({ classe, onClose }) {
  const color = CAT_COLORS[classe.cat];
  const glow  = CAT_GLOW[classe.cat];
  const [activeSkill, setActiveSkill] = useState(0);
  const stats    = ["FOR","AGI","RES","INT","PER","CAR"];
  const statVals = [classe.FOR,classe.AGI,classe.RES,classe.INT,classe.PER,classe.CAR];
  const primStat = stats[statVals.indexOf(Math.max(...statVals))];
  const ps_soglie = [0,20,70,170,370];
  const sk = classe.skills[activeSkill];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        {/* Hero immagine categoria */}
        <div style={{ position:"relative", height:160, overflow:"hidden" }}>
          <CatImage catId={classe.cat} style={{ position:"absolute", inset:0, width:"100%", height:"100%" }} />
          <button onClick={onClose} style={{
            position:"absolute", top:"0.75rem", right:"0.75rem", zIndex:10,
            background:"rgba(0,0,0,0.6)", border:"1px solid var(--border)",
            color:"var(--text-dim)", cursor:"pointer", fontSize:"1rem",
            borderRadius:6, padding:"0.3rem 0.6rem",
          }}>✕</button>
          <div style={{ position:"absolute", bottom:0, left:0, right:0, padding:"1rem 1.5rem", zIndex:2 }}>
            <div style={{ display:"flex", alignItems:"center", gap:"0.75rem" }}>
              <span style={{ fontSize:"2.2rem" }}>{classe.icon}</span>
              <div>
                <div style={{ fontFamily:"'Cinzel',serif", fontSize:"1.4rem", fontWeight:700, color:"white" }}>{classe.nome}</div>
                <div style={{ color:glow, fontSize:"0.82rem" }}>{classe.flavor}</div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding:"1.5rem 2rem" }}>
          <p style={{ color:"var(--text-dim)", fontSize:"0.88rem", lineHeight:1.65, marginBottom:"1.5rem" }}>{classe.desc}</p>

          {/* Stats */}
          <div style={{ marginBottom:"1.5rem" }}>
            <div className="section-title" style={{ marginBottom:"0.75rem" }}>Caratteristiche Base</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:"0.5rem", marginBottom:"0.75rem" }}>
              {stats.map((s,i) => <StatBubble key={s} name={s} value={statVals[i]} highlight={s===primStat} />)}
            </div>
            <div style={{ display:"flex", gap:"1rem", flexWrap:"wrap" }}>
              {[{label:"HP Rank F",val:classe.hp,color:"var(--danger)"},{label:"Flusso Rank F",val:classe.fl,color:"var(--flux)"},{label:"Difesa",val:classe.dif,color:"var(--purple)"},{label:"Velocità",val:classe.vel,color:"var(--gold)"},{label:"Dado Vita",val:classe.dado,color:"var(--text)"}].map(s => (
                <div key={s.label} style={{ textAlign:"center" }}>
                  <div style={{ fontSize:"0.65rem", color:"var(--text-dim)", textTransform:"uppercase", letterSpacing:"0.1em" }}>{s.label}</div>
                  <div style={{ fontFamily:"'Cinzel',serif", fontWeight:700, color:s.color, fontSize:"1.1rem" }}>{s.val}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Rank table */}
          <div style={{ marginBottom:"1.5rem" }}>
            <div className="section-title" style={{ marginBottom:"0.75rem" }}>Progressione per Rank</div>
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"0.82rem" }}>
                <thead>
                  <tr style={{ borderBottom:"1px solid var(--border)" }}>
                    {["Rank","Titolo","PA","HP","Flusso","Difesa","Vel."].map(h => (
                      <th key={h} style={{ padding:"0.4rem 0.6rem", color:"var(--text-dim)", fontWeight:600, textAlign:"center" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {RANKS.map(r => (
                    <tr key={r} style={{
                      background:["S","SS","SSS"].includes(r)?"rgba(212,168,67,0.03)":undefined,
                      borderBottom:"1px solid rgba(140,110,255,0.06)",
                    }}>
                      <td style={{ padding:"0.5rem 0.6rem", textAlign:"center" }}><RankBadge rank={r} size="sm" /></td>
                      <td style={{ padding:"0.5rem 0.6rem", color:"var(--text-dim)", fontSize:"0.75rem" }}>{RANK_TITOLI[r]}</td>
                      <td style={{ padding:"0.5rem 0.6rem", textAlign:"center", color:"var(--gold)", fontFamily:"'Cinzel',serif", fontWeight:700 }}>{RANK_PA[r]}</td>
                      <td style={{ padding:"0.5rem 0.6rem", textAlign:"center", color:"var(--danger)", fontWeight:700 }}>{rHP(classe.hp,r)}</td>
                      <td style={{ padding:"0.5rem 0.6rem", textAlign:"center", color:"var(--flux)", fontWeight:700 }}>{rFL(classe.fl,r)}</td>
                      <td style={{ padding:"0.5rem 0.6rem", textAlign:"center", color:"var(--purple)", fontWeight:700 }}>{rDIF(classe.dif,r)}</td>
                      <td style={{ padding:"0.5rem 0.6rem", textAlign:"center", color:"var(--text-dim)" }}>{classe.vel}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Skills */}
          <div>
            <div className="section-title" style={{ marginBottom:"0.75rem" }}>Skill Base</div>
            <div style={{ display:"flex", gap:"0.5rem", marginBottom:"1rem" }}>
              {classe.skills.map((s,i) => (
                <button key={i} onClick={() => setActiveSkill(i)} style={{
                  background: i===activeSkill ? `${color}20` : "transparent",
                  border:`1px solid ${i===activeSkill?color:"var(--border)"}`,
                  color: i===activeSkill ? "var(--text-bright)" : "var(--text-dim)",
                  borderRadius:6, padding:"0.4rem 0.75rem", cursor:"pointer",
                  fontSize:"0.8rem", fontFamily:"'Raleway',sans-serif", fontWeight:600, transition:"all 0.2s",
                }}>{s.nome}</button>
              ))}
            </div>
            {sk && (
              <div style={{ background:`${color}08`, border:`1px solid ${color}30`, borderRadius:8, padding:"1.25rem" }}>
                <div style={{ display:"flex", alignItems:"center", gap:"0.75rem", marginBottom:"0.75rem" }}>
                  <div style={{ fontFamily:"'Cinzel',serif", fontWeight:700, color:"var(--text-bright)", fontSize:"1rem" }}>{sk.nome}</div>
                  <span style={{ background:`${color}20`, color:glow, border:`1px solid ${color}40`, borderRadius:4, padding:"2px 8px", fontSize:"0.72rem", fontWeight:700 }}>{sk.costo} Flusso</span>
                </div>
                <p style={{ color:"var(--text)", fontSize:"0.88rem", lineHeight:1.6, marginBottom:"1rem" }}>{sk.desc}</p>
                <div style={{ borderTop:"1px solid rgba(140,110,255,0.1)", paddingTop:"0.75rem" }}>
                  <div style={{ fontSize:"0.72rem", color:"var(--text-dim)", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:"0.5rem" }}>Progressione PS</div>
                  <div style={{ display:"flex", flexDirection:"column", gap:"0.35rem" }}>
                    {[sk.desc,sk.lv2,sk.lv3,sk.lv4,sk.lv5].map((eff,lv) => (
                      <div key={lv} style={{ display:"flex", gap:"0.75rem", alignItems:"flex-start" }}>
                        <div style={{
                          minWidth:22, height:22, borderRadius:"50%",
                          border:`1px solid ${lv===4?"var(--gold)":"var(--border)"}`,
                          background: lv===4 ? "rgba(212,168,67,0.15)" : "transparent",
                          display:"flex", alignItems:"center", justifyContent:"center",
                          fontFamily:"'Cinzel',serif", fontSize:"0.65rem", fontWeight:700,
                          color: lv===4 ? "var(--gold)" : "var(--text-dim)",
                          flexShrink:0, marginTop:2,
                        }}>{lv+1}</div>
                        <div>
                          <span style={{ fontSize:"0.7rem", color:"var(--text-dim)", marginRight:"0.4rem" }}>
                            {lv===0 ? "(base)" : `${ps_soglie[lv]} PS`}
                          </span>
                          <span style={{ fontSize:"0.82rem", color: lv===4?"var(--gold)":"var(--text-dim)" }}>{eff}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// FRAMMENTO DETAIL
// ═══════════════════════════════════════════════════════
function FrammentoDetail({ frammento, onClose }) {
  const gc = ["","var(--gold)","var(--purple)","var(--flux)","var(--danger)","var(--success)","#c060ff"][frammento.gruppo];
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth:600 }} onClick={e => e.stopPropagation()}>
        <div style={{ padding:"1.5rem 2rem", borderBottom:"1px solid var(--border)", background:`linear-gradient(135deg,${gc}12,transparent)` }}>
          <button onClick={onClose} style={{ float:"right", background:"none", border:"none", color:"var(--text-dim)", cursor:"pointer", fontSize:"1.2rem" }}>✕</button>
          <div className="section-title" style={{ color:gc, marginBottom:"0.4rem" }}>Gruppo {frammento.gruppo} — {GRUPPI_FRAMMENTI[frammento.gruppo-1].nome}</div>
          <div style={{ fontFamily:"'Cinzel',serif", fontSize:"1.4rem", fontWeight:700, color:"var(--text-bright)", marginBottom:"0.3rem" }}>{frammento.nome}</div>
          <div style={{ color:"var(--text-dim)", fontSize:"0.82rem" }}>{frammento.fonte}</div>
        </div>
        <div style={{ padding:"1.5rem 2rem" }}>
          <div style={{ fontStyle:"italic", color:"var(--text-dim)", fontSize:"0.88rem", lineHeight:1.65, marginBottom:"1.25rem", borderLeft:`2px solid ${gc}60`, paddingLeft:"1rem" }}>
            "{frammento.flavor}"
          </div>
          <div style={{ background:`${gc}0a`, border:`1px solid ${gc}25`, borderRadius:8, padding:"1.25rem" }}>
            <div style={{ fontSize:"0.72rem", color:"var(--text-dim)", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:"0.75rem" }}>Meccanica Completa</div>
            <p style={{ color:"var(--text)", fontSize:"0.9rem", lineHeight:1.7 }}>{frammento.mec}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// HOME PAGE
// ═══════════════════════════════════════════════════════
function HomePage({ setPage }) {
  const [heroBgLoaded, setHeroBgLoaded] = useState(false);
  const stats = [
    {label:"Classi",      val:"24",  color:"var(--purple)",      sub:"6 categorie · 4 archetipi ciascuna"},
    {label:"Frammenti",   val:"36",  color:"var(--gold)",        sub:"6 gruppi · 6 residui cosmici"},
    {label:"NPC",         val:"80",  color:"var(--flux)",        sub:"figure operanti · 8 fazioni"},
    {label:"Creature",    val:"231", color:"var(--gold-bright)", sub:"bestiario di Arkadium"},
  ];

  return (
    <div className="anim-fade-in">
      {/* HERO */}
      <div className="hero">
        {/* Sfondo hero immagine (opzionale) */}
        <div className="hero-bg" style={{
          backgroundImage: `url(/hero-bg.jpg)`,
          backgroundSize:"cover", backgroundPosition:"center",
        }} />

        <div style={{ position:"relative", zIndex:1 }}>
          {/* Logo immagine (se disponibile) o testo */}
          <div style={{ marginBottom:"1rem", display:"flex", justifyContent:"center" }}>
            <img
              src="/logo.png"
              alt="Arcadia2099"
              onError={e => { e.target.style.display="none"; }}
              style={{ height:80, objectFit:"contain", filter:"drop-shadow(0 0 16px rgba(140,110,255,0.5))" }}
            />
          </div>
          <div className="hero-title">CHAOS SYSTEM</div>
          <div className="hero-sub">Arcadia2099 · Sistema LUCID d20</div>
          <p style={{ color:"var(--text-dim)", maxWidth:560, margin:"0 auto 2.5rem", lineHeight:1.7, fontSize:"0.95rem" }}>
            Nel 2099, i grandi Domini che governavano Arkadium sono caduti. Al loro posto operano otto Fazioni che si
            contendono ogni zona di territorio. Il Flusso è instabile. I Frammenti del Creatore dormono nei viventi —
            destinati a risvegliarsi al Rank S.
          </p>
          <div style={{ display:"flex", gap:"0.75rem", justifyContent:"center", flexWrap:"wrap" }}>
            <button className="btn btn-gold"    onClick={() => setPage("generator")}>🎲 Crea Personaggio</button>
            <button className="btn btn-primary" onClick={() => setPage("wiki")}>📖 Esplora Wiki</button>
            <button className="btn btn-outline" onClick={() => setPage("compendio")}>📚 Compendio</button>
            <button className="btn btn-outline" onClick={() => setPage("tracker")}>📊 Tracker</button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom:"2.5rem" }}>
        {stats.map(s => (
          <div key={s.label} className="card" style={{ padding:"1.2rem 1.5rem", textAlign:"center" }}>
            <div style={{ fontFamily:"'Cinzel',serif", fontSize:"2.5rem", fontWeight:900, color:s.color, lineHeight:1 }}>{s.val}</div>
            <div style={{ fontFamily:"'Cinzel',serif", fontSize:"0.9rem", color:"var(--text-bright)", marginTop:"0.25rem" }}>{s.label}</div>
            <div style={{ fontSize:"0.75rem", color:"var(--text-dim)", marginTop:"0.2rem" }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Categorie con immagini */}
      <div style={{ marginBottom:"2.5rem" }}>
        <div className="section-title" style={{ marginBottom:"1rem" }}>Le 6 Categorie</div>
        <div className="grid-3">
          {CATEGORIE.map(cat => (
            <div key={cat.id} onClick={() => setPage("wiki")} style={{
              position:"relative", height:140, borderRadius:10, overflow:"hidden", cursor:"pointer",
              border:`1px solid ${CAT_COLORS[cat.id]}40`, transition:"all 0.25s",
            }}
              onMouseEnter={e => { e.currentTarget.style.transform="translateY(-3px)"; e.currentTarget.style.boxShadow=`0 8px 24px ${CAT_COLORS[cat.id]}30`; }}
              onMouseLeave={e => { e.currentTarget.style.transform=""; e.currentTarget.style.boxShadow=""; }}
            >
              <CatImage catId={cat.id} style={{ position:"absolute", inset:0, width:"100%", height:"100%" }} />
              <div style={{ position:"absolute", inset:0, zIndex:2, padding:"1rem", display:"flex", flexDirection:"column", justifyContent:"flex-end" }}>
                <div style={{ display:"flex", alignItems:"center", gap:"0.5rem" }}>
                  <span style={{ fontFamily:"'Cinzel',serif", fontSize:"1.6rem", fontWeight:900, color:CAT_COLORS[cat.id], opacity:0.9 }}>{cat.id}</span>
                  <div>
                    <div style={{ fontFamily:"'Cinzel',serif", fontWeight:700, color:"white", fontSize:"0.9rem" }}>{cat.nome}</div>
                    <div style={{ color:"rgba(255,255,255,0.6)", fontSize:"0.72rem" }}>{cat.desc}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lore */}
      <div style={{ background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:10, padding:"2rem", marginBottom:"2rem" }}>
        <div className="section-title" style={{ marginBottom:"1rem" }}>Il Mondo — Arkadia2099</div>
        <p style={{ color:"var(--text-dim)", fontSize:"0.88rem", lineHeight:1.7, marginBottom:"1.5rem" }}>
          Arkadia2099 è ambientata nel 2099, in un mondo segnato da tre grandi catastrofi chiamate Pandora. Nel 2030
          dell'era post-Arkadiana, Lucifer e Seraphin toccarono il Cristallo Oscuro, il nucleo di Flusso grezzo. L'evento
          che seguì è noto come la Prima Frattura. Per impedire il collasso totale del mondo, il Creatore si dissolse
          volontariamente, distribuendo la propria essenza tra i viventi sotto forma di Frammenti dormienti. Nei secoli
          successivi, tre Pandora devastarono Arkadium e ridisegnarono ogni confine.
        </p>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(280px,1fr))", gap:"1.5rem" }}>
          {[
            {title:"Il Flusso",text:"La materia narrativa di Arkadium. Non è magia né scienza: è un'energia senziente che plasma la realtà, altera gli stati emotivi e riscrive la materia fisica. Ogni Skill del sistema canalizza o resiste al Flusso.",color:"var(--flux)"},
            {title:"I Tre Pandora",text:"Tre catastrofi cosmiche che hanno spezzato l'equilibrio di Arkadium. Il Terzo Pandora ha frantumato definitivamente il Creatore, i cui Frammenti dormono ora in ogni personaggio giocante.",color:"var(--gold)"},
            {title:"Il Risveglio",text:"Al Rank S il Frammento si risveglia. Il personaggio cessa di essere un semplice portatore e acquisisce una connessione diretta con l'eredità cosmica del Creatore. L'Abilità Unica sbloccata non può essere replicata da nessun'altra Skill.",color:"var(--purple)"},
          ].map(l => (
            <div key={l.title}>
              <div style={{ fontFamily:"'Cinzel',serif", fontWeight:700, color:l.color, marginBottom:"0.4rem", fontSize:"0.9rem" }}>{l.title}</div>
              <p style={{ color:"var(--text-dim)", fontSize:"0.85rem", lineHeight:1.6 }}>{l.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Rank overview */}
      <div style={{ background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:10, padding:"1.5rem" }}>
        <div className="section-title" style={{ marginBottom:"1rem" }}>I 9 Rank</div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:"0.5rem" }}>
          {RANKS.map(r => (
            <div key={r} style={{
              padding:"0.5rem 1rem", borderRadius:6,
              border:`1px solid ${getRankColor(r)}40`, background:`${getRankColor(r)}10`,
              display:"flex", flexDirection:"column", alignItems:"center", gap:"0.2rem",
            }}>
              <RankBadge rank={r} size="sm" />
              <span style={{ fontSize:"0.68rem", color:"var(--text-dim)", textAlign:"center", maxWidth:80 }}>{RANK_TITOLI[r]}</span>
              <span style={{ fontSize:"0.65rem", color:"var(--text-dim)", opacity:0.7 }}>{RANK_PA[r]} PA</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// WIKI PAGE
// ═══════════════════════════════════════════════════════
function WikiPage() {
  const [tab, setTab]                         = useState("classi");
  const [selectedClasse, setSelectedClasse]   = useState(null);
  const [selectedFrammento, setSelectedFrammento] = useState(null);
  const [search, setSearch]                   = useState("");
  const [catFilter, setCatFilter]             = useState(0);
  const [gruppoFilter, setGruppoFilter]       = useState(0);

  const filteredClassi = CLASSI.filter(c =>
    (catFilter===0 || c.cat===catFilter) &&
    (search==="" || c.nome.toLowerCase().includes(search.toLowerCase()) || c.flavor.toLowerCase().includes(search.toLowerCase()))
  );
  const filteredFrammenti = FRAMMENTI.filter(f =>
    (gruppoFilter===0 || f.gruppo===gruppoFilter) &&
    (search==="" || f.nome.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="anim-fade-in">
      <div style={{ marginBottom:"2rem" }}>
        <div className="section-title">Database</div>
        <div className="page-title">Wiki di Arkadia2099</div>
        <p className="page-subtitle">Esplora le 24 classi, i 36 Frammenti del Creatore, le 6 razze e il sistema di Rank.</p>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:"0.5rem", marginBottom:"1.5rem", borderBottom:"1px solid var(--border)" }}>
        {[{id:"classi",label:"Classi",count:24},{id:"frammenti",label:"Frammenti",count:36},{id:"razze",label:"Razze",count:6},{id:"rank",label:"Rank & PA",count:9}].map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setSearch(""); }} style={{
            background:"none", border:"none", cursor:"pointer",
            fontFamily:"'Raleway',sans-serif", fontWeight:700, fontSize:"0.85rem",
            letterSpacing:"0.06em", textTransform:"uppercase", padding:"0.6rem 1rem",
            color: tab===t.id?"var(--purple)":"var(--text-dim)",
            borderBottom: tab===t.id?"2px solid var(--purple)":"2px solid transparent",
            marginBottom:"-1px", transition:"all 0.2s",
          }}>
            {t.label} <span style={{ marginLeft:"0.3rem", fontSize:"0.7rem", opacity:0.6 }}>({t.count})</span>
          </button>
        ))}
      </div>

      {/* Filtri */}
      <div style={{ display:"flex", gap:"0.75rem", marginBottom:"1.5rem", flexWrap:"wrap" }}>
        <input className="input-field" placeholder="Cerca..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth:260 }} />
        {tab==="classi" && (
          <div style={{ display:"flex", gap:"0.4rem", flexWrap:"wrap" }}>
            <button onClick={() => setCatFilter(0)} className="btn btn-outline" style={{ padding:"0.4rem 0.8rem", fontSize:"0.78rem", color:catFilter===0?"var(--purple)":"var(--text-dim)", borderColor:catFilter===0?"var(--purple)":"var(--border)" }}>Tutte</button>
            {CATEGORIE.map(c => (
              <button key={c.id} onClick={() => setCatFilter(c.id)} className="btn btn-outline" style={{
                padding:"0.4rem 0.8rem", fontSize:"0.78rem",
                color: catFilter===c.id?"var(--text-bright)":"var(--text-dim)",
                borderColor: catFilter===c.id?CAT_COLORS[c.id]:"var(--border)",
                background: catFilter===c.id?`${CAT_COLORS[c.id]}18`:"transparent",
              }}>{c.id}. {c.nome.split(" ")[0]}</button>
            ))}
          </div>
        )}
        {tab==="frammenti" && (
          <div style={{ display:"flex", gap:"0.4rem", flexWrap:"wrap" }}>
            <button onClick={() => setGruppoFilter(0)} className="btn btn-outline" style={{ padding:"0.4rem 0.8rem", fontSize:"0.78rem", color:gruppoFilter===0?"var(--gold)":"var(--text-dim)", borderColor:gruppoFilter===0?"var(--gold)":"var(--border)" }}>Tutti</button>
            {GRUPPI_FRAMMENTI.map(g => (
              <button key={g.id} onClick={() => setGruppoFilter(g.id)} className="btn btn-outline" style={{
                padding:"0.4rem 0.8rem", fontSize:"0.78rem",
                color: gruppoFilter===g.id?"var(--gold-bright)":"var(--text-dim)",
                borderColor: gruppoFilter===g.id?"var(--gold)":"var(--border)",
                background: gruppoFilter===g.id?"rgba(212,168,67,0.1)":"transparent",
              }}>{g.id}. {g.nome}</button>
            ))}
          </div>
        )}
      </div>

      {/* CLASSI */}
      {tab==="classi" && (
        <div>
          {CATEGORIE.filter(c => catFilter===0||c.id===catFilter).map(cat => {
            const classi = filteredClassi.filter(c => c.cat===cat.id);
            if (!classi.length) return null;
            return (
              <div key={cat.id} style={{ marginBottom:"2rem" }}>
                {/* Banner categoria con immagine */}
                <div className="cat-banner">
                  <CatImage catId={cat.id} style={{ position:"absolute", inset:0, width:"100%", height:"100%" }} />
                  <div className="cat-banner-content">
                    <span className="cat-number" style={{ color:CAT_COLORS[cat.id] }}>{cat.id}</span>
                    <div>
                      <div style={{ fontFamily:"'Cinzel',serif", fontWeight:700, color:"white", fontSize:"1.1rem" }}>{cat.nome}</div>
                      <div style={{ color:"rgba(255,255,255,0.65)", fontSize:"0.8rem" }}>{cat.desc}</div>
                    </div>
                  </div>
                </div>
                <div className="grid-auto">
                  {classi.map(c => (
                    <div key={c.nome} className="card" style={{ padding:"1.25rem", cursor:"pointer" }} onClick={() => setSelectedClasse(c)}>
                      <div style={{ display:"flex", alignItems:"center", gap:"0.75rem", marginBottom:"0.75rem" }}>
                        <span style={{ fontSize:"1.8rem" }}>{c.icon}</span>
                        <div>
                          <div style={{ fontFamily:"'Cinzel',serif", fontWeight:700, color:"var(--text-bright)", fontSize:"0.95rem" }}>{c.nome}</div>
                          <div style={{ color:CAT_GLOW[c.cat], fontSize:"0.75rem" }}>{c.flavor}</div>
                        </div>
                      </div>
                      <div style={{ display:"flex", gap:"0.75rem", marginBottom:"0.75rem" }}>
                        {[{l:"HP",v:c.hp,col:"var(--danger)"},{l:"Flusso",v:c.fl,col:"var(--flux)"},{l:"Dif",v:c.dif,col:"var(--purple)"},{l:"Dado",v:c.dado,col:"var(--gold)"}].map(s => (
                          <div key={s.l} style={{ textAlign:"center" }}>
                            <div style={{ fontSize:"0.6rem", color:"var(--text-dim)", textTransform:"uppercase" }}>{s.l}</div>
                            <div style={{ fontFamily:"'Cinzel',serif", fontWeight:700, color:s.col, fontSize:"1rem" }}>{s.v}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ display:"flex", gap:"0.4rem", flexWrap:"wrap" }}>
                        {c.skills.map(s => (
                          <span key={s.nome} style={{ fontSize:"0.68rem", background:"rgba(140,110,255,0.08)", border:"1px solid var(--border)", borderRadius:3, padding:"2px 6px", color:"var(--text-dim)" }}>{s.nome}</span>
                        ))}
                      </div>
                      <div style={{ marginTop:"0.75rem", fontSize:"0.72rem", color:"var(--purple)", textAlign:"right" }}>Vedi dettagli →</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FRAMMENTI */}
      {tab==="frammenti" && (
        <div>
          {GRUPPI_FRAMMENTI.filter(g => gruppoFilter===0||g.id===gruppoFilter).map(gruppo => {
            const frammenti = filteredFrammenti.filter(f => f.gruppo===gruppo.id);
            if (!frammenti.length) return null;
            const gc = ["","var(--gold)","var(--purple)","var(--flux)","var(--danger)","var(--success)","#c060ff"][gruppo.id];
            return (
              <div key={gruppo.id} style={{ marginBottom:"2rem" }}>
                <div style={{ display:"flex", alignItems:"center", gap:"0.75rem", marginBottom:"0.75rem", padding:"0.6rem 1rem", background:`${gc}0d`, border:`1px solid ${gc}25`, borderRadius:6 }}>
                  <span style={{ fontFamily:"'Cinzel',serif", fontSize:"1.5rem", fontWeight:900, color:gc }}>{gruppo.id}</span>
                  <div>
                    <div style={{ fontFamily:"'Cinzel',serif", fontWeight:700, color:"var(--text-bright)" }}>Frammenti {gruppo.nome}</div>
                    <div style={{ color:"var(--text-dim)", fontSize:"0.78rem" }}>{gruppo.desc}</div>
                  </div>
                </div>
                <div className="grid-auto">
                  {frammenti.map(f => (
                    <div key={f.nome} className="card" style={{ padding:"1.1rem", cursor:"pointer" }} onClick={() => setSelectedFrammento(f)}>
                      <div style={{ fontFamily:"'Cinzel',serif", fontWeight:700, color:"var(--text-bright)", marginBottom:"0.3rem", fontSize:"0.9rem" }}>{f.nome}</div>
                      <div style={{ fontSize:"0.72rem", color:gc, marginBottom:"0.5rem" }}>{f.fonte}</div>
                      <p style={{ fontSize:"0.8rem", color:"var(--text-dim)", lineHeight:1.55, fontStyle:"italic", marginBottom:"0.75rem" }}>"{f.flavor}"</p>
                      <div style={{ background:`${gc}0a`, border:`1px solid ${gc}20`, borderRadius:5, padding:"0.5rem 0.75rem", fontSize:"0.78rem", color:"var(--text)", lineHeight:1.5 }}>{f.mec_breve}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* RAZZE */}
      {tab==="razze" && (
        <div className="grid-auto">
          {RAZZE.filter(r => search===""||r.nome.toLowerCase().includes(search.toLowerCase())).map(r => (
            <div key={r.nome} className="card" style={{ padding:"1.5rem", borderTop:`3px solid ${r.color}` }}>
              <div style={{ fontFamily:"'Cinzel',serif", fontWeight:700, fontSize:"1.1rem", color:"var(--text-bright)", marginBottom:"0.2rem" }}>{r.nome}</div>
              <div style={{ fontSize:"0.78rem", color:r.color, marginBottom:"0.75rem", fontStyle:"italic" }}>{r.flavor}</div>
              <div style={{ background:"rgba(140,110,255,0.06)", border:"1px solid var(--border)", borderRadius:5, padding:"0.5rem 0.75rem", fontSize:"0.78rem", color:"var(--gold)", marginBottom:"0.75rem", fontWeight:600 }}>{r.bonus}</div>
              {[{l:"Tratto 1",v:r.tratto1},{l:"Tratto 2",v:r.tratto2}].map(t => (
                <div key={t.l} style={{ marginBottom:"0.5rem" }}>
                  <div style={{ fontSize:"0.68rem", color:"var(--text-dim)", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:"0.3rem" }}>{t.l}</div>
                  <p style={{ fontSize:"0.82rem", color:"var(--text)", lineHeight:1.55 }}>{t.v}</p>
                </div>
              ))}
              <div style={{ background:"rgba(224,80,80,0.06)", border:"1px solid rgba(224,80,80,0.2)", borderRadius:5, padding:"0.5rem 0.75rem", fontSize:"0.78rem", color:"var(--danger)", lineHeight:1.5 }}>⚠ {r.malus}</div>
            </div>
          ))}
        </div>
      )}

      {/* RANK */}
      {tab==="rank" && (
        <div style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
          <div style={{ background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:10, padding:"1.5rem" }}>
            <div className="section-title" style={{ marginBottom:"0.75rem" }}>Sistema PA — Punti Avanzamento</div>
            <p style={{ color:"var(--text-dim)", fontSize:"0.88rem", lineHeight:1.65 }}>
              I PA si <strong style={{ color:"var(--text)" }}>accumulano soltanto</strong> — non si spendono mai. Quando raggiungi la soglia di un Rank, sali automaticamente.
            </p>
          </div>
          {RANKS.map((r,i) => {
            const col  = getRankColor(r);
            const isS  = ["S","SS","SSS"].includes(r);
            const paNeeded = i>0 ? RANK_PA[r]-RANK_PA[RANKS[i-1]] : 0;
            const sessioni = paNeeded>0 ? Math.ceil(paNeeded/75) : 0;
            const SBLOCCHI = {F:"Punto di partenza. 3 Skill base + 1 Skill Generale. 3 Scintille.",E:"Accesso zone avanzate. Skill a Lv PS 2 disponibile.",D:"Sfida di Rank richiesta. Zone PvP aperte. Frammento si agita.",C:"Zone avanzate. Skill a Lv PS 3. Ibridazione Skill.",B:"Skill a Lv PS 4. Frammento: effetti migliorati.",A:"Skill a Lv PS 5 (forma finale). Zone leggendarie.",S:"IL FRAMMENTO SI RISVEGLIA. Poteri narrativi unici.",SS:"Poteri semi-divini. Il mondo reagisce alla tua presenza.",SSS:"Solo per campagne leggendarie."};
            return (
              <div key={r} style={{
                background: isS ? "linear-gradient(135deg,rgba(212,168,67,0.05),var(--bg-card))" : "var(--bg-card)",
                border:`1px solid ${isS?"rgba(212,168,67,0.3)":"var(--border)"}`,
                borderLeft:`4px solid ${col}`, borderRadius:8, padding:"1.25rem 1.5rem",
              }}>
                <div style={{ display:"flex", alignItems:"flex-start", gap:"1.5rem", flexWrap:"wrap" }}>
                  <div style={{ minWidth:80, textAlign:"center" }}>
                    <RankBadge rank={r} size="lg" />
                    <div style={{ fontSize:"0.7rem", color:"var(--text-dim)", marginTop:"0.3rem" }}>{RANK_TITOLI[r]}</div>
                  </div>
                  <div style={{ flex:1, minWidth:200 }}>
                    <div style={{ display:"flex", gap:"1.5rem", marginBottom:"0.5rem", flexWrap:"wrap" }}>
                      <div>
                        <div style={{ fontSize:"0.65rem", color:"var(--text-dim)", textTransform:"uppercase" }}>PA totali</div>
                        <div style={{ fontFamily:"'Cinzel',serif", fontWeight:700, color:"var(--gold)", fontSize:"1.1rem" }}>{RANK_PA[r]}</div>
                      </div>
                      {paNeeded>0 && <div>
                        <div style={{ fontSize:"0.65rem", color:"var(--text-dim)", textTransform:"uppercase" }}>Da guadagnare</div>
                        <div style={{ fontFamily:"'Cinzel',serif", fontWeight:700, color:col, fontSize:"1.1rem" }}>+{paNeeded}</div>
                      </div>}
                      {sessioni>0 && <div>
                        <div style={{ fontSize:"0.65rem", color:"var(--text-dim)", textTransform:"uppercase" }}>Sessioni stimate</div>
                        <div style={{ fontFamily:"'Cinzel',serif", fontWeight:700, color:"var(--text-dim)", fontSize:"1.1rem" }}>~{sessioni}</div>
                      </div>}
                    </div>
                    <p style={{ fontSize:"0.85rem", color:"var(--text-dim)", lineHeight:1.6 }}>{SBLOCCHI[r]}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedClasse    && <ClasseDetail    classe={selectedClasse}       onClose={() => setSelectedClasse(null)} />}
      {selectedFrammento && <FrammentoDetail frammento={selectedFrammento} onClose={() => setSelectedFrammento(null)} />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// GENERATORE PG
// ═══════════════════════════════════════════════════════
function GeneratorePage() {
  const [step,             setStep]             = useState(0);
  const [catRoll,          setCatRoll]          = useState(null);
  const [grpRoll,          setGrpRoll]          = useState(null);
  const [rolling1,         setRolling1]         = useState(false);
  const [rolling2,         setRolling2]         = useState(false);
  const [settled1,         setSettled1]         = useState(false);
  const [settled2,         setSettled2]         = useState(false);
  const [selectedClasse,   setSelectedClasse]   = useState(null);
  const [selectedFrammento,setSelectedFrammento]= useState(null);
  const [selectedRazza,    setSelectedRazza]    = useState(null);
  const [pgName,           setPgName]           = useState("");
  const [pgBackground,     setPgBackground]     = useState("");
  const [generated,        setGenerated]        = useState(null);

  function rollDice(_, setRoll, setRolling, setSettled) {
    setRolling(true); setSettled(false); setRoll(null);
    setTimeout(() => {
      const val = Math.ceil(Math.random()*6);
      setRoll(val); setRolling(false);
      setTimeout(() => setSettled(true), 50);
    }, 700);
  }

  function generateSheet() {
    if (!selectedClasse||!selectedFrammento||!selectedRazza) return;
    const c = selectedClasse, r = selectedRazza;
    const baseHP = typeof r.mod_hp==="number" && r.mod_hp>0 ? c.hp+r.mod_hp : typeof r.mod_hp==="number" && r.mod_hp<0 && r.mod_hp>-1 ? Math.ceil(c.hp*(1+r.mod_hp)) : c.hp+(r.mod_hp||0);
    const baseFL = typeof r.mod_fl==="number" && r.mod_fl<0 ? Math.floor(c.fl*(1+r.mod_fl)) : c.fl+(r.mod_fl||0);
    setGenerated({
      nome: pgName||"Senza Nome", classe:c, frammento:selectedFrammento, razza:r, background:pgBackground,
      hp:baseHP, fl:baseFL, dif:c.dif+(r.mod_dif||0),
      vel:c.vel+(r.nome==="Nano del Sogno"?-1:0),
      scintille:3+(r.nome==="Umano"?1:0), pa:0, rank:"F",
    });
    setStep(4);
  }

  function restart() {
    setStep(0); setCatRoll(null); setGrpRoll(null);
    setRolling1(false); setRolling2(false); setSettled1(false); setSettled2(false);
    setSelectedClasse(null); setSelectedFrammento(null); setSelectedRazza(null);
    setPgName(""); setPgBackground(""); setGenerated(null);
  }

  const catClassi    = catRoll ? CLASSI.filter(c => c.cat===catRoll) : [];
  const grpFrammenti = grpRoll ? FRAMMENTI.filter(f => f.gruppo===grpRoll) : [];

  return (
    <div className="anim-fade-in">
      <div style={{ marginBottom:"2rem" }}>
        <div className="section-title">Crea il tuo avventuriero</div>
        <div className="page-title">Generatore Personaggio</div>
        <p className="page-subtitle">Tira i dadi — il Flusso decide la tua natura.</p>
      </div>

      {step<4 && (
        <div style={{ display:"flex", gap:"0.5rem", marginBottom:"2rem", alignItems:"center", flexWrap:"wrap" }}>
          {["Classe","Frammento","Razza","Dettagli"].map((s,i) => (
            <div key={s} style={{ display:"flex", alignItems:"center", gap:"0.5rem" }}>
              <div style={{
                width:28, height:28, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center",
                fontFamily:"'Cinzel',serif", fontWeight:700, fontSize:"0.75rem",
                background: step>i?"var(--purple)":step===i?"rgba(140,110,255,0.2)":"transparent",
                border:`2px solid ${step>=i?"var(--purple)":"var(--border)"}`,
                color: step>i?"white":step===i?"var(--purple)":"var(--text-dim)",
              }}>{i+1}</div>
              <span style={{ fontSize:"0.78rem", color:step===i?"var(--text-bright)":"var(--text-dim)", fontWeight:step===i?700:400 }}>{s}</span>
              {i<3 && <span style={{ color:"var(--border)", fontSize:"0.8rem" }}>→</span>}
            </div>
          ))}
        </div>
      )}

      {/* Step 1: Classe */}
      {step<=1 && (
        <div className="anim-slide-in">
          <div style={{ background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:10, padding:"2rem", marginBottom:"1.5rem" }}>
            <div className="section-title" style={{ marginBottom:"1rem" }}>Passo 1 — Categoria Classe</div>
            <p style={{ color:"var(--text-dim)", fontSize:"0.88rem", marginBottom:"1.5rem" }}>Tira 1d6 per la categoria. Poi scegli 1 delle 4 classi in quella categoria.</p>
            <div style={{ display:"flex", justifyContent:"center", marginBottom:"1.5rem" }}>
              <Dice value={catRoll} rolling={rolling1} settled={settled1} label="Tira per la Categoria" onClick={() => !rolling1 && rollDice(1,setCatRoll,setRolling1,setSettled1)} />
            </div>
            {catRoll && !rolling1 && (
              <div className="anim-slide-in">
                {/* Banner categoria */}
                <div style={{ position:"relative", height:100, borderRadius:8, overflow:"hidden", marginBottom:"1.25rem" }}>
                  <CatImage catId={catRoll} style={{ position:"absolute", inset:0, width:"100%", height:"100%" }} />
                  <div style={{ position:"absolute", inset:0, zIndex:2, display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <span style={{ fontFamily:"'Cinzel',serif", color:"white", fontSize:"1.1rem", fontWeight:700, textShadow:"0 2px 8px rgba(0,0,0,0.8)" }}>
                      Categoria {catRoll} — {CATEGORIE[catRoll-1].nome}
                    </span>
                  </div>
                </div>
                <div className="grid-2">
                  {catClassi.map(c => (
                    <div key={c.nome} onClick={() => setSelectedClasse(c)} className="card" style={{
                      padding:"1rem 1.25rem", cursor:"pointer",
                      border:`1px solid ${selectedClasse?.nome===c.nome?CAT_COLORS[c.cat]:"var(--border)"}`,
                      background: selectedClasse?.nome===c.nome?`${CAT_COLORS[c.cat]}12`:"var(--bg-card)",
                    }}>
                      <div style={{ display:"flex", alignItems:"center", gap:"0.75rem", marginBottom:"0.5rem" }}>
                        <span style={{ fontSize:"1.6rem" }}>{c.icon}</span>
                        <div>
                          <div style={{ fontFamily:"'Cinzel',serif", fontWeight:700, color:"var(--text-bright)", fontSize:"0.9rem" }}>{c.nome}</div>
                          <div style={{ fontSize:"0.72rem", color:CAT_GLOW[c.cat] }}>{c.flavor}</div>
                        </div>
                      </div>
                      <div style={{ display:"flex", gap:"0.5rem" }}>
                        {[{l:"HP",v:c.hp,col:"var(--danger)"},{l:"FL",v:c.fl,col:"var(--flux)"},{l:"Dif",v:c.dif,col:"var(--purple)"},{l:"Dado",v:c.dado,col:"var(--gold)"}].map(s => (
                          <div key={s.l} style={{ textAlign:"center" }}>
                            <div style={{ fontSize:"0.58rem", color:"var(--text-dim)", textTransform:"uppercase" }}>{s.l}</div>
                            <div style={{ fontFamily:"'Cinzel',serif", fontWeight:700, color:s.col, fontSize:"0.85rem" }}>{s.v}</div>
                          </div>
                        ))}
                      </div>
                      {selectedClasse?.nome===c.nome && <div style={{ marginTop:"0.5rem", fontSize:"0.72rem", color:CAT_GLOW[c.cat], textAlign:"right" }}>✓ Selezionata</div>}
                    </div>
                  ))}
                </div>
                <div style={{ marginTop:"1.25rem", display:"flex", gap:"0.75rem", justifyContent:"flex-end" }}>
                  <button className="btn btn-outline" onClick={() => { setCatRoll(null); setSettled1(false); setSelectedClasse(null); }}>Ritira</button>
                  <button className="btn btn-primary" disabled={!selectedClasse} onClick={() => setStep(1)} style={{ opacity:selectedClasse?1:0.4, cursor:selectedClasse?"pointer":"default" }}>Avanti → Frammento</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 2: Frammento */}
      {step>=1 && step<=2 && (
        <div className="anim-slide-in">
          <div style={{ background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:10, padding:"2rem", marginBottom:"1.5rem" }}>
            <div className="section-title" style={{ marginBottom:"1rem" }}>Passo 2 — Frammento del Creatore</div>
            <p style={{ color:"var(--text-dim)", fontSize:"0.88rem", marginBottom:"1.5rem" }}>Tira 1d6 per il gruppo. Poi scegli 1 dei 6 frammenti in quel gruppo.</p>
            <div style={{ display:"flex", justifyContent:"center", marginBottom:"1.5rem" }}>
              <Dice value={grpRoll} rolling={rolling2} settled={settled2} label="Tira per il Gruppo" onClick={() => !rolling2 && rollDice(1,setGrpRoll,setRolling2,setSettled2)} />
            </div>
            {grpRoll && !rolling2 && (
              <div className="anim-slide-in">
                <div style={{ textAlign:"center", marginBottom:"1.25rem" }}>
                  <span style={{ fontFamily:"'Cinzel',serif", color:"var(--gold)", fontSize:"1rem" }}>Gruppo {grpRoll} — Frammenti {GRUPPI_FRAMMENTI[grpRoll-1].nome}</span>
                </div>
                <div className="grid-2">
                  {grpFrammenti.map(f => {
                    const gc = ["","var(--gold)","var(--purple)","var(--flux)","var(--danger)","var(--success)","#c060ff"][f.gruppo];
                    return (
                      <div key={f.nome} onClick={() => setSelectedFrammento(f)} className="card" style={{
                        padding:"1rem", cursor:"pointer",
                        border:`1px solid ${selectedFrammento?.nome===f.nome?gc:"var(--border)"}`,
                        background: selectedFrammento?.nome===f.nome?`${gc}0f`:"var(--bg-card)",
                      }}>
                        <div style={{ fontFamily:"'Cinzel',serif", fontWeight:700, color:"var(--text-bright)", marginBottom:"0.2rem", fontSize:"0.85rem" }}>{f.nome}</div>
                        <div style={{ fontSize:"0.7rem", color:gc, marginBottom:"0.4rem" }}>{f.fonte}</div>
                        <div style={{ fontSize:"0.78rem", color:"var(--text-dim)", lineHeight:1.5 }}>{f.mec_breve}</div>
                        {selectedFrammento?.nome===f.nome && <div style={{ marginTop:"0.4rem", fontSize:"0.72rem", color:gc, textAlign:"right" }}>✓ Selezionato</div>}
                      </div>
                    );
                  })}
                </div>
                <div style={{ marginTop:"1.25rem", display:"flex", gap:"0.75rem", justifyContent:"flex-end" }}>
                  <button className="btn btn-outline" onClick={() => { setGrpRoll(null); setSettled2(false); setSelectedFrammento(null); }}>Ritira</button>
                  <button className="btn btn-primary" disabled={!selectedFrammento} onClick={() => setStep(2)} style={{ opacity:selectedFrammento?1:0.4, cursor:selectedFrammento?"pointer":"default" }}>Avanti → Razza</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 3: Razza + Dettagli */}
      {step>=2 && step<=3 && (
        <div className="anim-slide-in">
          <div style={{ background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:10, padding:"2rem", marginBottom:"1.5rem" }}>
            <div className="section-title" style={{ marginBottom:"1rem" }}>Passo 3 — Razza</div>
            <p style={{ color:"var(--text-dim)", fontSize:"0.88rem", marginBottom:"1.25rem" }}>Scelta libera — nessun dado.</p>
            <div className="grid-3">
              {RAZZE.map(r => (
                <div key={r.nome} onClick={() => setSelectedRazza(r)} className="card" style={{
                  padding:"1rem", cursor:"pointer",
                  border:`1px solid ${selectedRazza?.nome===r.nome?r.color:"var(--border)"}`,
                  background: selectedRazza?.nome===r.nome?`${r.color}10`:"var(--bg-card)",
                  borderTop:`3px solid ${selectedRazza?.nome===r.nome?r.color:"var(--border)"}`,
                }}>
                  <div style={{ fontFamily:"'Cinzel',serif", fontWeight:700, color:"var(--text-bright)", marginBottom:"0.2rem" }}>{r.nome}</div>
                  <div style={{ fontSize:"0.72rem", color:r.color, fontStyle:"italic", marginBottom:"0.5rem" }}>{r.flavor}</div>
                  <div style={{ fontSize:"0.75rem", color:"var(--gold)", fontWeight:600, marginBottom:"0.3rem" }}>{r.bonus}</div>
                  <div style={{ fontSize:"0.72rem", color:"var(--danger)", opacity:0.8 }}>{r.malus}</div>
                  {selectedRazza?.nome===r.nome && <div style={{ marginTop:"0.4rem", fontSize:"0.72rem", color:r.color, textAlign:"right" }}>✓ Scelta</div>}
                </div>
              ))}
            </div>
          </div>
          <div style={{ background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:10, padding:"2rem", marginBottom:"1.5rem" }}>
            <div className="section-title" style={{ marginBottom:"1rem" }}>Passo 4 — Dettagli</div>
            <div className="grid-2">
              <div>
                <label style={{ fontSize:"0.75rem", color:"var(--text-dim)", display:"block", marginBottom:"0.4rem", textTransform:"uppercase", letterSpacing:"0.08em" }}>Nome Personaggio</label>
                <input className="input-field" value={pgName} onChange={e => setPgName(e.target.value)} placeholder="Come ti chiami in Arkadia2099?" />
              </div>
              <div>
                <label style={{ fontSize:"0.75rem", color:"var(--text-dim)", display:"block", marginBottom:"0.4rem", textTransform:"uppercase", letterSpacing:"0.08em" }}>Background</label>
                <input className="input-field" value={pgBackground} onChange={e => setPgBackground(e.target.value)} placeholder="Es: Sopravvissuto del Pandora" />
              </div>
            </div>
          </div>
          <div style={{ display:"flex", gap:"0.75rem", justifyContent:"flex-end" }}>
            <button className="btn btn-outline" onClick={() => setStep(1)}>← Indietro</button>
            <button className="btn btn-gold" disabled={!selectedRazza} onClick={generateSheet} style={{ opacity:selectedRazza?1:0.4, cursor:selectedRazza?"pointer":"default" }}>✨ Genera Scheda</button>
          </div>
        </div>
      )}

      {/* Step 4: Scheda generata */}
      {step===4 && generated && (
        <div className="anim-slide-in">
          <div style={{ background:"var(--bg-card)", border:"1px solid var(--border-bright)", borderRadius:12, overflow:"hidden", boxShadow:"0 0 40px rgba(140,110,255,0.12)" }}>
            {/* Hero scheda con immagine categoria */}
            <div style={{ position:"relative", height:180 }}>
              <CatImage catId={generated.classe.cat} style={{ position:"absolute", inset:0, width:"100%", height:"100%" }} />
              <div style={{ position:"absolute", inset:0, zIndex:2, padding:"1.5rem 2rem", display:"flex", alignItems:"flex-end", justifyContent:"space-between" }}>
                <div>
                  <div style={{ fontFamily:"'Cinzel Decorative',serif", fontSize:"1.8rem", fontWeight:700, color:"white", marginBottom:"0.3rem", textShadow:"0 2px 12px rgba(0,0,0,0.8)" }}>{generated.nome}</div>
                  <div style={{ display:"flex", gap:"0.75rem", alignItems:"center", flexWrap:"wrap" }}>
                    <span style={{ fontSize:"1.4rem" }}>{generated.classe.icon}</span>
                    <span style={{ fontFamily:"'Cinzel',serif", fontWeight:700, color:CAT_GLOW[generated.classe.cat] }}>{generated.classe.nome}</span>
                    <span style={{ color:"rgba(255,255,255,0.6)" }}>·</span>
                    <span style={{ color:"rgba(255,255,255,0.8)" }}>{generated.razza.nome}</span>
                    <RankBadge rank="F" />
                  </div>
                  {generated.background && <div style={{ marginTop:"0.3rem", fontSize:"0.82rem", color:"var(--gold)", fontStyle:"italic" }}>Background: {generated.background}</div>}
                </div>
                <button className="btn btn-outline" style={{ fontSize:"0.75rem" }} onClick={restart}>🎲 Nuovo PG</button>
              </div>
            </div>

            <div style={{ padding:"2rem", display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:"1.5rem" }}>
              {/* Stats */}
              <div>
                <div className="section-title" style={{ marginBottom:"0.75rem" }}>Statistiche Rank F</div>
                <div style={{ display:"flex", gap:"1rem", marginBottom:"1rem", flexWrap:"wrap" }}>
                  {[{l:"HP",v:generated.hp,col:"var(--danger)"},{l:"Flusso",v:generated.fl,col:"var(--flux)"},{l:"Difesa",v:generated.dif,col:"var(--purple)"},{l:"Velocità",v:generated.vel,col:"var(--gold)"},{l:"Scintille",v:generated.scintille,col:"#c060ff"}].map(s => (
                    <div key={s.l} style={{ textAlign:"center", background:"rgba(140,110,255,0.06)", border:"1px solid var(--border)", borderRadius:6, padding:"0.6rem 0.8rem", minWidth:60 }}>
                      <div style={{ fontSize:"0.6rem", color:"var(--text-dim)", textTransform:"uppercase", letterSpacing:"0.1em" }}>{s.l}</div>
                      <div style={{ fontFamily:"'Cinzel',serif", fontWeight:900, color:s.col, fontSize:"1.4rem", lineHeight:1 }}>{s.v}</div>
                    </div>
                  ))}
                </div>
                <div className="section-title" style={{ marginBottom:"0.5rem" }}>Caratteristiche</div>
                <div style={{ display:"flex", gap:"0.4rem", flexWrap:"wrap" }}>
                  {["FOR","AGI","RES","INT","PER","CAR"].map((s,i) => {
                    const vals = [generated.classe.FOR,generated.classe.AGI,generated.classe.RES,generated.classe.INT,generated.classe.PER,generated.classe.CAR];
                    const primStat = ["FOR","AGI","RES","INT","PER","CAR"][vals.indexOf(Math.max(...vals))];
                    return <StatBubble key={s} name={s} value={vals[i]} highlight={s===primStat} />;
                  })}
                </div>
              </div>

              {/* Frammento */}
              <div>
                <div className="section-title" style={{ marginBottom:"0.75rem" }}>Frammento del Creatore</div>
                {(() => {
                  const gc = ["","var(--gold)","var(--purple)","var(--flux)","var(--danger)","var(--success)","#c060ff"][generated.frammento.gruppo];
                  return (
                    <div style={{ background:`${gc}0a`, border:`1px solid ${gc}30`, borderRadius:8, padding:"1rem" }}>
                      <div style={{ fontFamily:"'Cinzel',serif", fontWeight:700, color:"var(--text-bright)", marginBottom:"0.2rem" }}>{generated.frammento.nome}</div>
                      <div style={{ fontSize:"0.72rem", color:gc, marginBottom:"0.5rem" }}>{generated.frammento.fonte}</div>
                      <p style={{ fontSize:"0.8rem", color:"var(--text-dim)", fontStyle:"italic", lineHeight:1.55, marginBottom:"0.75rem" }}>"{generated.frammento.flavor}"</p>
                      <div style={{ fontSize:"0.8rem", color:"var(--text)", lineHeight:1.6 }}>{generated.frammento.mec}</div>
                    </div>
                  );
                })()}
              </div>

              {/* Razza */}
              <div>
                <div className="section-title" style={{ marginBottom:"0.75rem" }}>Razza — {generated.razza.nome}</div>
                <div style={{ background:`${generated.razza.color}0a`, border:`1px solid ${generated.razza.color}30`, borderRadius:8, padding:"1rem" }}>
                  <div style={{ fontSize:"0.78rem", color:"var(--gold)", fontWeight:600, marginBottom:"0.6rem" }}>{generated.razza.bonus}</div>
                  {[{l:"Tratto 1",v:generated.razza.tratto1},{l:"Tratto 2",v:generated.razza.tratto2}].map(t => (
                    <div key={t.l} style={{ marginBottom:"0.5rem" }}>
                      <div style={{ fontSize:"0.65rem", color:"var(--text-dim)", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:"0.25rem" }}>{t.l}</div>
                      <p style={{ fontSize:"0.8rem", color:"var(--text)", lineHeight:1.55 }}>{t.v}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Skill */}
              <div>
                <div className="section-title" style={{ marginBottom:"0.75rem" }}>Skill Base</div>
                <div style={{ display:"flex", flexDirection:"column", gap:"0.6rem" }}>
                  {generated.classe.skills.map(sk => (
                    <div key={sk.nome} className="skill-card">
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"0.4rem" }}>
                        <span style={{ fontFamily:"'Cinzel',serif", fontWeight:700, fontSize:"0.85rem", color:"var(--text-bright)" }}>{sk.nome}</span>
                        <span style={{ fontSize:"0.72rem", background:"rgba(140,110,255,0.15)", color:"var(--purple)", border:"1px solid rgba(140,110,255,0.3)", borderRadius:3, padding:"1px 7px" }}>{sk.costo} Flusso</span>
                      </div>
                      <p style={{ fontSize:"0.8rem", color:"var(--text-dim)", lineHeight:1.5 }}>{sk.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rank */}
              <div style={{ gridColumn:"1/-1" }}>
                <div className="section-title" style={{ marginBottom:"0.75rem" }}>Progressione Rank (PA)</div>
                <div style={{ display:"flex", gap:"0.4rem", flexWrap:"wrap" }}>
                  {RANKS.map(r => {
                    const col = getRankColor(r);
                    const isCurrent = r==="F";
                    return (
                      <div key={r} style={{
                        padding:"0.4rem 0.8rem", borderRadius:5,
                        border:`1px solid ${isCurrent?col:"rgba(140,110,255,0.1)"}`,
                        background: isCurrent?`${col}15`:"transparent",
                        display:"flex", flexDirection:"column", alignItems:"center", gap:"0.15rem",
                      }}>
                        <RankBadge rank={r} size="sm" />
                        <span style={{ fontSize:"0.6rem", color:"var(--text-dim)" }}>{RANK_PA[r]} PA</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// SCHEDA GIOCABILE — Combattimento, Avatar, Token, PDF
// ═══════════════════════════════════════════════════════

const CONDIZIONI_LIST = [
  { nome:"Spaventato",   desc:"Svantaggio su attacchi e prove mentre la fonte è visibile" },
  { nome:"Stordito",     desc:"Nessuna azione o reazione possibile" },
  { nome:"Silenziato",   desc:"Non puoi usare Skill verbali" },
  { nome:"Sanguinante",  desc:"1d4 danni all'inizio di ogni turno" },
  { nome:"Rallentato",   desc:"Velocità dimezzata, -2 TS Destrezza" },
  { nome:"Addormentato", desc:"Prono, incosciente — attacchi automatici critici" },
  { nome:"Confuso",      desc:"Tira 1d6 per determinare l'azione casuale" },
  { nome:"Corrotto",     desc:"Accumula stack — a 5: -2 a tutti i tiri" },
  { nome:"Esausto",      desc:"Svantaggio attacchi, no Skill ≥3 Flusso" },
];

const modSta = v => Math.floor((v-10)/2);
const modStaFmt = v => { const m = modSta(v); return (m>=0?"+":"")+m; };
const skillLvFromPS = ps => {
  const soglie = [0,20,70,170,370];
  let lv = 1;
  for (let i = soglie.length-1; i >= 0; i--) {
    if (ps >= soglie[i]) { lv = i+1; break; }
  }
  return lv;
};

// Token Canvas — disegna un cerchio con iniziali + badge Rank
function TokenCanvas({ char, rank }) {
  const ref = useRef(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    const sz = 80;
    cv.width = sz; cv.height = sz;
    ctx.clearRect(0, 0, sz, sz);

    // Sfondo cerchio
    ctx.beginPath();
    ctx.arc(sz/2, sz/2, sz/2 - 1, 0, Math.PI*2);
    ctx.fillStyle = char.token_color || "#8c6eff";
    ctx.fill();

    const drawOverlay = () => {
      // Badge rank in basso a destra
      ctx.beginPath();
      ctx.arc(sz*0.78, sz*0.78, 13, 0, Math.PI*2);
      ctx.fillStyle = "rgba(3,1,8,0.85)";
      ctx.fill();
      ctx.strokeStyle = "#c9a96e";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = "#c9a96e";
      ctx.font = `bold ${rank.length>=2?8:11}px 'Cinzel',serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(rank, sz*0.78, sz*0.79);

      // Bordo esterno
      ctx.beginPath();
      ctx.arc(sz/2, sz/2, sz/2 - 1, 0, Math.PI*2);
      ctx.strokeStyle = "#c9a96e";
      ctx.lineWidth = 2;
      ctx.stroke();
    };

    if (char.avatar) {
      const img = new Image();
      img.onload = () => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(sz/2, sz/2, sz/2 - 1, 0, Math.PI*2);
        ctx.clip();
        ctx.drawImage(img, 0, 0, sz, sz);
        ctx.restore();
        drawOverlay();
      };
      img.src = char.avatar;
    } else {
      // Iniziali
      ctx.fillStyle = "rgba(255,255,255,0.92)";
      ctx.font = `bold ${sz*0.38}px 'Cinzel',serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText((char.nome||"?").slice(0,2).toUpperCase(), sz/2, sz/2);
      drawOverlay();
    }
  }, [char.avatar, char.token_color, char.nome, rank]);

  return <canvas ref={ref} className="token-canvas" style={{ width:80, height:80, borderRadius:"50%" }} />;
}

function SchedaGiocabile() {
  const defaultChar = useCallback(() => {
    const c = CLASSI[0];
    const r = RAZZE[0];
    return {
      id: Date.now(),
      nome: "Nuovo Personaggio",
      classeNome: c.nome,
      razzaNome: r.nome,
      frammentoNome: FRAMMENTI[0].nome,
      background: "Sopravvissuto del Pandora",
      pa: 0,
      hp_curr: c.hp,
      fl_curr: c.fl,
      scintille: 3,
      scintille_max: 3,
      armatura: 0,
      avatar: null,
      token_color: "#8c6eff",
      note: "",
      skills: c.skills.map(sk => ({ nome: sk.nome, ps: 0, costo: sk.costo })),
      condizioni: [],
      log: [],
    };
  }, []);

  const [personaggi, setPersonaggi] = useState(() => {
    try { const s = localStorage.getItem("arcadia_schede_v1"); return s ? JSON.parse(s) : []; }
    catch { return []; }
  });
  const [selectedId, setSelectedId] = useState(() => {
    try { return localStorage.getItem("arcadia_schede_selected_v1") || null; }
    catch { return null; }
  });
  const [tab, setTab] = useState("info"); // info | combat | skills | progress | log
  const avatarRef = useRef(null);

  useEffect(() => {
    try { localStorage.setItem("arcadia_schede_v1", JSON.stringify(personaggi)); } catch {}
  }, [personaggi]);

  useEffect(() => {
    try {
      if (selectedId) localStorage.setItem("arcadia_schede_selected_v1", selectedId);
      else localStorage.removeItem("arcadia_schede_selected_v1");
    } catch {}
  }, [selectedId]);

  const char = selectedId ? personaggi.find(p => String(p.id) === String(selectedId)) : null;

  const updateChar = useCallback((patch) => {
    setPersonaggi(prev => prev.map(p => String(p.id) === String(selectedId) ? { ...p, ...patch } : p));
  }, [selectedId]);

  const addLog = useCallback((msg, type = "info") => {
    const entry = {
      msg,
      type,
      time: new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }),
    };
    setPersonaggi(prev => prev.map(p => {
      if (String(p.id) !== String(selectedId)) return p;
      return { ...p, log: [entry, ...(p.log || []).slice(0, 49)] };
    }));
  }, [selectedId]);

  const newPG = () => {
    const n = defaultChar();
    setPersonaggi(prev => [...prev, n]);
    setSelectedId(n.id);
    setTab("info");
  };

  const deletePG = () => {
    if (!char) return;
    if (!confirm(`Eliminare "${char.nome}"?`)) return;
    setPersonaggi(prev => prev.filter(p => String(p.id) !== String(selectedId)));
    setSelectedId(null);
  };

  const duplicatePG = () => {
    if (!char) return;
    const copy = { ...JSON.parse(JSON.stringify(char)), id: Date.now(), nome: char.nome + " (copia)" };
    setPersonaggi(prev => [...prev, copy]);
    setSelectedId(copy.id);
  };

  const exportJSON = () => {
    if (!char) return;
    const blob = new Blob([JSON.stringify(char, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${char.nome || "pg"}_arcadia2099.json`;
    a.click();
  };

  const importJSON = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = ev => {
      try {
        const data = JSON.parse(ev.target.result);
        data.id = Date.now();
        setPersonaggi(prev => [...prev, data]);
        setSelectedId(data.id);
      } catch { alert("File JSON non valido"); }
    };
    r.readAsText(f);
    e.target.value = "";
  };

  const handleAvatar = (e) => {
    const f = e.target.files?.[0];
    if (!f || !char) return;
    const r = new FileReader();
    r.onload = ev => updateChar({ avatar: ev.target.result });
    r.readAsDataURL(f);
    e.target.value = "";
  };

  // Se non c'è personaggio selezionato, mostra la lista
  if (!char) {
    return (
      <div className="anim-fade-in">
        <div style={{ marginBottom:"2rem" }}>
          <div className="section-title">Scheda del Personaggio</div>
          <div className="page-title">Le tue Schede Giocabili</div>
          <p className="page-subtitle">Crea, gestisci e gioca con le tue schede. Combattimento live, tiri di dado, progressione, stampa PDF.</p>
        </div>

        <div style={{ display:"flex", gap:"0.75rem", marginBottom:"1.5rem", flexWrap:"wrap" }}>
          <button className="btn btn-primary" onClick={newPG}>+ Nuova Scheda</button>
          <label className="btn btn-outline" style={{ cursor:"pointer" }}>
            📂 Importa JSON
            <input type="file" accept=".json" onChange={importJSON} style={{ display:"none" }} />
          </label>
        </div>

        {personaggi.length === 0 ? (
          <div className="card" style={{ padding:"3rem 2rem", textAlign:"center" }}>
            <div style={{ fontSize:"3rem", marginBottom:"1rem" }}>📜</div>
            <div style={{ fontFamily:"'Cinzel',serif", fontSize:"1.1rem", color:"var(--text-bright)", marginBottom:"0.5rem" }}>Nessuna scheda ancora creata</div>
            <p style={{ color:"var(--text-dim)", fontSize:"0.9rem", marginBottom:"1.5rem" }}>
              Inizia creando una nuova scheda oppure generandone una dal Generatore Personaggio.
            </p>
            <button className="btn btn-gold" onClick={newPG}>✦ Crea la Prima Scheda</button>
          </div>
        ) : (
          <div className="grid-2">
            {personaggi.map(p => {
              const cls = CLASSI.find(c => c.nome === p.classeNome) || CLASSI[0];
              const rank = getRankFromPA(p.pa);
              const rCol = getRankColor(rank);
              return (
                <div key={p.id} className="card" style={{ padding:"1.2rem", cursor:"pointer" }}
                  onClick={() => { setSelectedId(p.id); setTab("info"); }}>
                  <div style={{ display:"flex", alignItems:"center", gap:"1rem" }}>
                    <div style={{
                      width:60, height:60, borderRadius:"50%",
                      background: p.avatar ? `url(${p.avatar}) center/cover` : `linear-gradient(135deg, ${p.token_color||"#8c6eff"}, ${rCol})`,
                      border: `2px solid ${rCol}`,
                      display:"flex", alignItems:"center", justifyContent:"center",
                      fontFamily:"'Cinzel',serif", fontWeight:700, color:"white",
                      flexShrink:0,
                    }}>
                      {!p.avatar && (p.nome||"?").slice(0,2).toUpperCase()}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", marginBottom:"0.2rem" }}>
                        <div style={{ fontFamily:"'Cinzel',serif", fontWeight:700, color:"var(--text-bright)", fontSize:"1rem" }}>{p.nome}</div>
                        <RankBadge rank={rank} size="sm" />
                      </div>
                      <div style={{ fontSize:"0.78rem", color:"var(--text-dim)" }}>
                        {cls.icon} {p.classeNome} · {p.razzaNome}
                      </div>
                      <div style={{ fontSize:"0.72rem", color:"var(--gold)", marginTop:"0.3rem" }}>
                        {p.pa.toLocaleString()} PA
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Calcoli della scheda attiva
  const cls = CLASSI.find(c => c.nome === char.classeNome) || CLASSI[0];
  const razza = RAZZE.find(r => r.nome === char.razzaNome) || RAZZE[0];
  const frammento = FRAMMENTI.find(f => f.nome === char.frammentoNome);
  const rank = getRankFromPA(char.pa);
  const rankNext = getNextRankPA(rank);

  // HP/FL massimi dinamici in base a Rank e Razza
  const hp_max = (() => {
    let hp = Math.round(cls.hp * RANK_MHP[rank]);
    if (typeof razza.mod_hp === "number") {
      if (razza.mod_hp < 0 && razza.mod_hp > -1) hp = Math.ceil(hp * (1 + razza.mod_hp));
      else hp = hp + razza.mod_hp;
    }
    return Math.max(1, hp);
  })();
  const fl_max = (() => {
    let fl = Math.round(cls.fl * RANK_MFL[rank]);
    if (typeof razza.mod_fl === "number" && razza.mod_fl < 0) fl = Math.floor(fl * (1 + razza.mod_fl));
    return Math.max(1, fl);
  })();
  const dif = cls.dif + RANK_BDIF[rank] + (char.armatura || 0) + (razza.mod_dif || 0);
  const vel = cls.vel + (razza.nome === "Nano del Sogno" ? -1 : 0);

  const statsBase = {
    FOR: cls.FOR, AGI: cls.AGI, RES: cls.RES, INT: cls.INT, PER: cls.PER, CAR: cls.CAR
  };
  // Applica bonus razziali (semplificati: parsificando il bonus testuale)
  const stats = { ...statsBase };
  if (razza.nome === "Elfo del Sogno") { stats.AGI+=2; stats.PER+=2; stats.INT+=1; stats.RES-=2; }
  else if (razza.nome === "Orc del Sogno") { stats.FOR+=3; stats.RES+=2; stats.INT-=2; }
  else if (razza.nome === "Fantasma") { stats.INT+=2; stats.PER+=2; stats.CAR+=1; stats.FOR-=3; }
  else if (razza.nome === "Nano del Sogno") { stats.RES+=2; stats.FOR+=2; stats.INT+=1; stats.AGI-=2; }
  else if (razza.nome === "Bestian") { stats.AGI+=2; stats.PER+=1; stats.FOR+=1; }

  const hpChange = (d) => {
    const v = Math.min(hp_max, Math.max(0, (char.hp_curr ?? hp_max) + d));
    if (d < 0) addLog(`${char.nome} subisce ${-d} danni → ${v}/${hp_max} HP`, "attack");
    else if (d > 0) addLog(`${char.nome} recupera ${d} HP → ${v}/${hp_max} HP`, "heal");
    updateChar({ hp_curr: v });
  };
  const flChange = (d) => {
    const v = Math.min(fl_max, Math.max(0, (char.fl_curr ?? fl_max) + d));
    updateChar({ fl_curr: v });
  };
  const toggleCond = (c) => {
    const l = char.condizioni || [];
    updateChar({ condizioni: l.includes(c) ? l.filter(x => x!==c) : [...l, c] });
    if (!l.includes(c)) addLog(`Applicato: ${c}`, "skill");
  };

  return (
    <div className="anim-fade-in">
      <div style={{ marginBottom:"1.5rem" }}>
        <button className="btn btn-outline btn-sm no-print" onClick={() => setSelectedId(null)}>← Torna alle schede</button>
      </div>

      {/* HERO SCHEDA */}
      <div className="card" style={{ padding:"1.5rem", marginBottom:"1rem", position:"relative", overflow:"hidden" }}>
        <div style={{
          position:"absolute", inset:0, opacity:0.08,
          background: CAT_GRADIENT[cls.cat], pointerEvents:"none",
        }} />
        <div style={{ position:"relative", display:"flex", alignItems:"center", gap:"1.25rem", flexWrap:"wrap" }}>
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"0.5rem" }}>
            <div className="avatar-frame no-print" onClick={() => avatarRef.current?.click()}
              style={{
                width:100, height:100, borderRadius:"50%",
                border:`3px solid ${getRankColor(rank)}`,
                overflow:"hidden", cursor:"pointer",
                display:"flex", alignItems:"center", justifyContent:"center",
                background: char.avatar ? "none" : "var(--panel2)",
                boxShadow: `0 0 30px ${getRankColor(rank)}40`,
              }}>
              {char.avatar
                ? <img src={char.avatar} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                : <span style={{ fontSize:"2.2rem" }}>{cls.icon}</span>}
            </div>
            <input ref={avatarRef} type="file" accept="image/*" style={{ display:"none" }} onChange={handleAvatar} />
            <div style={{ fontSize:"0.62rem", color:"var(--text-dim)", textAlign:"center" }} className="no-print">Clicca per avatar</div>
            <TokenCanvas char={char} rank={rank} />
          </div>

          <div style={{ flex:1, minWidth:260 }}>
            <input value={char.nome} onChange={e => updateChar({ nome: e.target.value })}
              style={{
                background:"transparent", border:"none", outline:"none",
                fontFamily:"'Cinzel Decorative',serif", fontSize:"1.8rem", fontWeight:700,
                color:"var(--text-bright)", width:"100%", padding:0, marginBottom:"0.3rem",
              }} />
            <div style={{ display:"flex", gap:"0.75rem", alignItems:"center", flexWrap:"wrap" }}>
              <span style={{ fontSize:"1.2rem" }}>{cls.icon}</span>
              <span style={{ fontFamily:"'Cinzel',serif", fontWeight:700, color:CAT_GLOW[cls.cat] }}>{cls.nome}</span>
              <span style={{ color:"var(--text-mute)" }}>·</span>
              <span style={{ color:"var(--text-dim)" }}>{razza.nome}</span>
              <RankBadge rank={rank} size="lg" />
            </div>
            <div style={{ marginTop:"0.3rem", fontSize:"0.82rem", color:"var(--gold)", fontStyle:"italic" }}>
              {rank}: {RANK_TITOLI[rank]}
            </div>
          </div>

          <div className="no-print" style={{ display:"flex", flexDirection:"column", gap:"0.4rem" }}>
            <input type="color" value={char.token_color || "#8c6eff"}
              onChange={e => updateChar({ token_color: e.target.value })}
              style={{ width:60, height:32, border:"none", background:"none", cursor:"pointer", borderRadius:4 }} />
            <button className="btn btn-outline btn-xs" onClick={duplicatePG}>Duplica</button>
            <button className="btn btn-danger btn-xs" onClick={deletePG}>Elimina</button>
          </div>
        </div>

        {/* BARRE VITALI */}
        <div style={{ marginTop:"1.25rem" }}>
          <div style={{ marginBottom:"0.75rem" }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"0.25rem", fontSize:"0.78rem" }}>
              <span style={{ fontFamily:"'Cinzel',serif", color:"var(--red)", letterSpacing:"0.08em" }}>HP</span>
              <span style={{ color:"var(--text)", fontWeight:600 }}>{char.hp_curr ?? hp_max} / {hp_max}</span>
            </div>
            <ProgressBar value={char.hp_curr ?? hp_max} max={hp_max} color="var(--red)" height={10} />
          </div>
          <div>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"0.25rem", fontSize:"0.78rem" }}>
              <span style={{ fontFamily:"'Cinzel',serif", color:"var(--flux)", letterSpacing:"0.08em" }}>FLUSSO</span>
              <span style={{ color:"var(--text)", fontWeight:600 }}>{char.fl_curr ?? fl_max} / {fl_max}</span>
            </div>
            <ProgressBar value={char.fl_curr ?? fl_max} max={fl_max} color="var(--flux)" height={10} />
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="no-print" style={{ display:"flex", gap:"0.3rem", marginBottom:"1rem", flexWrap:"wrap" }}>
        {[
          ["info","📋 Info"],
          ["combat","⚔️ Combattimento"],
          ["skills","⚡ Skill"],
          ["progress","📈 Progressione"],
          ["log","📜 Log"],
        ].map(([id,label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`nav-btn ${tab===id?"active":""}`}
            style={{ fontSize:"0.75rem" }}>{label}</button>
        ))}
      </div>

      {/* ═══════ TAB INFO ═══════ */}
      {tab === "info" && (
        <>
          <div className="card" style={{ padding:"1.5rem", marginBottom:"1rem" }}>
            <div className="section-title" style={{ marginBottom:"1rem" }}>Statistiche Derivate</div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(110px,1fr))", gap:"0.75rem", marginBottom:"1rem" }}>
              {[
                { l:"HP Max", v:hp_max, col:"var(--red)" },
                { l:"FL Max", v:fl_max, col:"var(--flux)" },
                { l:"Difesa", v:dif, col:"var(--purple)" },
                { l:"Velocità", v:`${vel}m`, col:"var(--gold)" },
                { l:"Scintille", v:`${char.scintille||0}/${char.scintille_max||3}`, col:"#c060ff" },
                { l:"Iniziativa", v:modStaFmt(stats.AGI), col:"var(--teal)" },
                { l:"Dado", v:cls.dado, col:"var(--gold)" },
              ].map(s => (
                <div key={s.l} style={{ textAlign:"center", background:"rgba(140,110,255,0.06)", border:"1px solid var(--border)", borderRadius:6, padding:"0.6rem" }}>
                  <div style={{ fontSize:"0.6rem", color:"var(--text-dim)", textTransform:"uppercase", letterSpacing:"0.1em" }}>{s.l}</div>
                  <div style={{ fontFamily:"'Cinzel',serif", fontWeight:900, color:s.col, fontSize:"1.3rem", lineHeight:1.2 }}>{s.v}</div>
                </div>
              ))}
            </div>
            <div className="section-title" style={{ marginBottom:"0.5rem" }}>Caratteristiche</div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:"0.4rem" }}>
              {Object.entries(stats).map(([k,v]) => (
                <div key={k} style={{ textAlign:"center", padding:"0.6rem 0.3rem", background:"var(--panel2)", border:"1px solid var(--border)", borderRadius:5 }}>
                  <div style={{ fontSize:"0.62rem", color:"var(--text-dim)", fontWeight:600 }}>{k}</div>
                  <div style={{ fontFamily:"'Cinzel',serif", fontSize:"1.3rem", fontWeight:700, color:"var(--text-bright)" }}>{v}</div>
                  <div style={{ fontSize:"0.7rem", color:"var(--purple-bright)" }}>{modStaFmt(v)}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ padding:"1.5rem", marginBottom:"1rem" }}>
            <div className="section-title" style={{ marginBottom:"1rem" }}>Identità</div>
            <div className="grid-2">
              <div>
                <label style={{ fontSize:"0.7rem", color:"var(--text-dim)", textTransform:"uppercase", letterSpacing:"0.08em", display:"block", marginBottom:"0.3rem" }}>Classe</label>
                <select className="input-field" value={char.classeNome}
                  onChange={e => {
                    const newCls = CLASSI.find(c => c.nome === e.target.value);
                    if (!newCls) return;
                    updateChar({
                      classeNome: e.target.value,
                      skills: newCls.skills.map(sk => ({ nome: sk.nome, ps: 0, costo: sk.costo })),
                    });
                  }}>
                  {CLASSI.map(c => <option key={c.nome} value={c.nome}>{c.icon} {c.nome}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize:"0.7rem", color:"var(--text-dim)", textTransform:"uppercase", letterSpacing:"0.08em", display:"block", marginBottom:"0.3rem" }}>Razza</label>
                <select className="input-field" value={char.razzaNome} onChange={e => updateChar({ razzaNome: e.target.value })}>
                  {RAZZE.map(r => <option key={r.nome} value={r.nome}>{r.nome}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize:"0.7rem", color:"var(--text-dim)", textTransform:"uppercase", letterSpacing:"0.08em", display:"block", marginBottom:"0.3rem" }}>Frammento</label>
                <select className="input-field" value={char.frammentoNome} onChange={e => updateChar({ frammentoNome: e.target.value })}>
                  {FRAMMENTI.map(f => <option key={f.nome} value={f.nome}>{f.nome}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize:"0.7rem", color:"var(--text-dim)", textTransform:"uppercase", letterSpacing:"0.08em", display:"block", marginBottom:"0.3rem" }}>Armatura</label>
                <select className="input-field" value={char.armatura || 0} onChange={e => updateChar({ armatura: parseInt(e.target.value) })}>
                  <option value={0}>Nessuna (+0)</option>
                  <option value={1}>Leggera (+1)</option>
                  <option value={2}>Media (+2)</option>
                  <option value={3}>Pesante (+3)</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize:"0.7rem", color:"var(--text-dim)", textTransform:"uppercase", letterSpacing:"0.08em", display:"block", marginBottom:"0.3rem" }}>Background</label>
                <input className="input-field" value={char.background || ""} onChange={e => updateChar({ background: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize:"0.7rem", color:"var(--text-dim)", textTransform:"uppercase", letterSpacing:"0.08em", display:"block", marginBottom:"0.3rem" }}>Scintille Max</label>
                <input className="input-field" type="number" min={1} max={10} value={char.scintille_max || 3}
                  onChange={e => updateChar({ scintille_max: parseInt(e.target.value) || 3 })} />
              </div>
            </div>
            <div style={{ marginTop:"1rem" }}>
              <label style={{ fontSize:"0.7rem", color:"var(--text-dim)", textTransform:"uppercase", letterSpacing:"0.08em", display:"block", marginBottom:"0.3rem" }}>Note</label>
              <textarea className="input-field" rows={4} value={char.note || ""} onChange={e => updateChar({ note: e.target.value })}
                placeholder="Storia, obiettivi, segreti del personaggio..." />
            </div>
          </div>

          {frammento && (
            <div className="card" style={{ padding:"1.5rem", marginBottom:"1rem" }}>
              <div className="section-title" style={{ marginBottom:"0.75rem" }}>Frammento del Creatore</div>
              <div style={{ fontFamily:"'Cinzel',serif", fontWeight:700, color:"var(--text-bright)", fontSize:"1rem", marginBottom:"0.3rem" }}>{frammento.nome}</div>
              <div style={{ fontSize:"0.78rem", color:"var(--gold)", marginBottom:"0.5rem" }}>{frammento.fonte}</div>
              <p style={{ fontStyle:"italic", color:"var(--text-dim)", fontSize:"0.85rem", marginBottom:"0.75rem" }}>"{frammento.flavor}"</p>
              <div style={{ fontSize:"0.85rem", lineHeight:1.6 }}>{frammento.mec}</div>
            </div>
          )}

          <div className="card" style={{ padding:"1.5rem" }}>
            <div className="section-title" style={{ marginBottom:"0.75rem" }}>Razza — {razza.nome}</div>
            <div style={{ fontSize:"0.85rem", color:"var(--gold)", fontWeight:600, marginBottom:"0.75rem" }}>{razza.bonus}</div>
            <div style={{ marginBottom:"0.5rem" }}>
              <div style={{ fontSize:"0.7rem", color:"var(--text-dim)", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:"0.2rem" }}>Tratto 1</div>
              <p style={{ fontSize:"0.85rem" }}>{razza.tratto1}</p>
            </div>
            <div>
              <div style={{ fontSize:"0.7rem", color:"var(--text-dim)", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:"0.2rem" }}>Tratto 2</div>
              <p style={{ fontSize:"0.85rem" }}>{razza.tratto2}</p>
            </div>
          </div>
        </>
      )}

      {/* ═══════ TAB COMBATTIMENTO ═══════ */}
      {tab === "combat" && <CombatTab char={char} cls={cls} stats={stats} hp_max={hp_max} fl_max={fl_max} dif={dif} rank={rank}
        hpChange={hpChange} flChange={flChange} updateChar={updateChar} addLog={addLog} toggleCond={toggleCond} />}

      {/* ═══════ TAB SKILL ═══════ */}
      {tab === "skills" && (
        <div className="card" style={{ padding:"1.5rem" }}>
          <div className="section-title" style={{ marginBottom:"1rem" }}>Skill del Personaggio</div>
          {(char.skills || []).map((sk, i) => {
            const lv = skillLvFromPS(sk.ps || 0);
            const soglie = [0,20,70,170,370];
            const nextPs = lv < 5 ? soglie[lv] : null;
            const clsSkill = cls.skills.find(s => s.nome === sk.nome);
            return (
              <div key={i} className="skill-card" style={{ marginBottom:"0.75rem", padding:"1rem" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:"0.75rem", marginBottom:"0.5rem", flexWrap:"wrap" }}>
                  <div style={{ flex:1, minWidth:200 }}>
                    <div style={{ fontFamily:"'Cinzel',serif", fontWeight:700, color:"var(--text-bright)" }}>{sk.nome}</div>
                    <div style={{ display:"flex", gap:"0.5rem", alignItems:"center", marginTop:"0.2rem" }}>
                      <span style={{ fontFamily:"'Cinzel',serif", fontWeight:700, fontSize:"0.8rem", color: lv>=5?"var(--gold)":"var(--purple)" }}>Lv {lv}</span>
                      {lv < 5 ? <span style={{ fontSize:"0.72rem", color:"var(--text-dim)" }}>{sk.ps||0} / {nextPs} PS</span>
                             : <span style={{ fontSize:"0.72rem", color:"var(--gold)" }}>✦ FORMA FINALE</span>}
                      {sk.costo && <span style={{ fontSize:"0.72rem", color:"var(--flux)" }}>· {sk.costo} FL</span>}
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:"0.3rem", flexWrap:"wrap" }}>
                    {[1,3,5].map(n => (
                      <button key={n} className="btn btn-outline btn-xs" onClick={() => {
                        const arr = [...(char.skills||[])];
                        arr[i] = { ...arr[i], ps: (arr[i].ps||0) + n };
                        updateChar({ skills: arr });
                        addLog(`+${n} PS su "${sk.nome}" → ${arr[i].ps} PS`, "skill");
                      }}>+{n}</button>
                    ))}
                    <button className="btn btn-outline btn-xs" onClick={() => {
                      const v = prompt("PS totali:", sk.ps || 0);
                      if (v === null) return;
                      const arr = [...(char.skills||[])];
                      arr[i] = { ...arr[i], ps: parseInt(v) || 0 };
                      updateChar({ skills: arr });
                    }}>✎</button>
                  </div>
                </div>
                <ProgressBar value={lv>=5?1:(sk.ps||0) - soglie[lv-1]} max={lv>=5?1:soglie[lv] - soglie[lv-1]} color={lv>=5?"var(--gold)":"var(--purple)"} height={5} />
                <div style={{ display:"flex", gap:"0.2rem", marginTop:"0.35rem" }}>
                  {[1,2,3,4,5].map(l => (
                    <div key={l} style={{
                      flex:1, height:3, borderRadius:2,
                      background: (sk.ps||0) >= soglie[l-1] ? (l===5?"var(--gold)":"var(--purple)") : "rgba(140,110,255,0.1)",
                    }} />
                  ))}
                </div>
                {clsSkill && (
                  <div style={{ marginTop:"0.6rem", fontSize:"0.78rem", color:"var(--text-dim)", lineHeight:1.5 }}>
                    {clsSkill.desc}
                  </div>
                )}
              </div>
            );
          })}
          <div style={{ marginTop:"1rem", padding:"0.75rem", background:"var(--panel2)", border:"1px solid var(--border)", borderRadius:6, fontSize:"0.78rem", color:"var(--text-dim)" }}>
            <strong style={{ color:"var(--gold)" }}>Soglie PS:</strong> Lv2=20 · Lv3=70 · Lv4=170 · Lv5=370 (Forma Finale)
          </div>
        </div>
      )}

      {/* ═══════ TAB PROGRESSIONE ═══════ */}
      {tab === "progress" && <ProgressTab char={char} rank={rank} rankNext={rankNext} cls={cls} razza={razza} updateChar={updateChar} addLog={addLog} />}

      {/* ═══════ TAB LOG ═══════ */}
      {tab === "log" && (
        <div className="card" style={{ padding:"1.5rem" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1rem" }}>
            <div className="section-title">Registro Sessione</div>
            <button className="btn btn-outline btn-xs" onClick={() => updateChar({ log: [] })}>Cancella</button>
          </div>
          <div style={{ maxHeight:500, overflowY:"auto" }}>
            {!(char.log || []).length ? (
              <div style={{ color:"var(--text-dim)", fontStyle:"italic", padding:"2rem", textAlign:"center" }}>Nessuna azione registrata</div>
            ) : (char.log || []).map((e, i) => {
              const col = e.type === "attack" ? "var(--red)"
                : e.type === "heal" ? "var(--green)"
                : e.type === "level" ? "var(--gold)"
                : e.type === "skill" ? "var(--purple)"
                : "var(--border)";
              return (
                <div key={i} style={{
                  fontSize:"0.82rem", padding:"0.5rem 0.75rem", marginBottom:"0.3rem",
                  background:"var(--panel2)", borderRadius:5,
                  borderLeft:`3px solid ${col}`, lineHeight:1.4,
                }}>
                  <span style={{ color:"var(--text-mute)", fontSize:"0.72rem", marginRight:"0.5rem", fontFamily:"'JetBrains Mono',monospace" }}>{e.time}</span>
                  {e.msg}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* AZIONI GLOBALI */}
      <div className="card no-print" style={{ padding:"1rem", marginTop:"1rem" }}>
        <div style={{ display:"flex", gap:"0.5rem", flexWrap:"wrap" }}>
          <button className="btn btn-gold btn-sm" onClick={exportJSON}>💾 Salva JSON</button>
          <button className="btn btn-primary btn-sm" onClick={() => window.print()}>📄 Stampa / Salva PDF</button>
          <label className="btn btn-outline btn-sm" style={{ cursor:"pointer" }}>
            📂 Importa JSON
            <input type="file" accept=".json" onChange={importJSON} style={{ display:"none" }} />
          </label>
        </div>
        <div style={{ fontSize:"0.7rem", color:"var(--text-mute)", marginTop:"0.5rem", fontStyle:"italic" }}>
          Per PDF: clicca "Stampa" e seleziona "Salva come PDF" come destinazione. Autosalvataggio nel browser.
        </div>
      </div>

      {/* LAYOUT DI STAMPA */}
      <PrintLayout char={char} cls={cls} razza={razza} frammento={frammento} stats={stats}
        rank={rank} hp_max={hp_max} fl_max={fl_max} dif={dif} vel={vel} />
    </div>
  );
}

// Sotto-componenti per SchedaGiocabile
function CombatTab({ char, cls, stats, hp_max, fl_max, dif, rank, hpChange, flChange, updateChar, addLog, toggleCond }) {
  const [lastRoll, setLastRoll] = useState(null);
  const [atkStat, setAtkStat] = useState("FOR");
  const [tdif, setTdif] = useState(12);
  const [dmgQty, setDmgQty] = useState(5);
  const [flCost, setFlCost] = useState(2);
  const [init, setInit] = useState(null);
  const rankIdx = RANKS.indexOf(rank);

  const d20 = (b=0) => { const d = Math.floor(Math.random()*20)+1; return { d, total:d+b, crit:d===20, fumble:d===1 }; };

  const doAtk = () => {
    const b = modSta(stats[atkStat]) + rankIdx;
    const r = d20(b);
    const hit = !r.fumble && (r.crit || r.total >= tdif);
    setLastRoll({ ...r, hit, b, type:"atk", stat:atkStat });
    addLog(r.crit ? `CRITICO! d20=20+${b}=${r.total} → HIT` :
      r.fumble ? `FUMBLE! d20=1 → MISS` :
      `Attacco ${atkStat}: d20=${r.d}+${b}=${r.total} vs DIF${tdif} → ${hit?"HIT":"MISS"}`, hit?"skill":"attack");
  };
  const doDmg = () => {
    const faces = parseInt(cls.dado.split("d")[1]);
    const d = Math.floor(Math.random()*faces) + 1;
    const sb = modSta(stats[atkStat]);
    const total = d + sb;
    setLastRoll({ d, total, dado:cls.dado, sb, type:"dmg", stat:atkStat });
    addLog(`Danno ${atkStat}: ${cls.dado}=${d}+${sb}=${total}`, "attack");
  };
  const doInit = () => {
    const b = modSta(stats.AGI);
    const r = d20(b);
    setInit(r.total);
    addLog(`Iniziativa: d20=${r.d}+${b}=${r.total}`, "skill");
  };
  const shortRest = () => {
    const hg = Math.floor(hp_max * 0.25);
    const fg = Math.floor(fl_max * 0.3);
    const nh = Math.min(hp_max, (char.hp_curr||0) + hg);
    const nf = Math.min(fl_max, (char.fl_curr||0) + fg);
    addLog(`Riposo breve: +${hg} HP, +${fg} FL`, "heal");
    updateChar({ hp_curr: nh, fl_curr: nf });
  };
  const longRest = () => {
    addLog("Riposo lungo: pieno ripristino", "heal");
    updateChar({ hp_curr: hp_max, fl_curr: fl_max, scintille: char.scintille_max || 3, condizioni: [] });
  };

  return (
    <>
      {/* TIRO D'ATTACCO */}
      <div className="card" style={{ padding:"1.5rem", marginBottom:"1rem", background:"linear-gradient(135deg, rgba(255,77,109,0.04), rgba(140,110,255,0.04))", borderColor:"rgba(255,77,109,0.25)" }}>
        <div className="section-title" style={{ color:"var(--red)", marginBottom:"1rem" }}>⚔️ Tiro d'Attacco</div>
        <div className="grid-2" style={{ gap:"0.75rem", marginBottom:"0.75rem" }}>
          <div>
            <label style={{ fontSize:"0.7rem", color:"var(--text-dim)", display:"block", marginBottom:"0.3rem" }}>Stat attacco</label>
            <select className="input-field" value={atkStat} onChange={e => setAtkStat(e.target.value)}>
              {["FOR","AGI","RES","INT","PER","CAR"].map(s => <option key={s} value={s}>{s} ({modStaFmt(stats[s])})</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize:"0.7rem", color:"var(--text-dim)", display:"block", marginBottom:"0.3rem" }}>DIF bersaglio</label>
            <input className="input-field" type="number" value={tdif} onChange={e => setTdif(parseInt(e.target.value)||10)} />
          </div>
        </div>
        <div style={{ display:"flex", gap:"0.4rem", flexWrap:"wrap", marginBottom:"0.75rem" }}>
          <button className="btn btn-primary btn-sm" onClick={doAtk}>🎲 Attacco 1d20</button>
          <button className="btn btn-outline btn-sm" onClick={doDmg}>⚔️ Danno ({cls.dado})</button>
          <button className="btn btn-outline btn-sm" onClick={doInit}>⚡ Iniziativa</button>
          {init !== null && <span className="btn btn-gold btn-sm" style={{ pointerEvents:"none" }}>Init: {init}</span>}
        </div>
        {lastRoll && (
          <div style={{ background:"var(--panel2)", border:"1px solid var(--border)", borderRadius:6, padding:"0.75rem", marginTop:"0.5rem" }}>
            <div style={{
              fontFamily:"'Cinzel Decorative',serif", fontSize:"3rem", fontWeight:900, textAlign:"center",
              color: lastRoll.crit ? "var(--green)" : lastRoll.fumble ? "var(--red)" : "var(--gold)",
              textShadow: lastRoll.crit ? "0 0 30px rgba(77,255,168,0.5)" : lastRoll.fumble ? "0 0 30px rgba(255,77,109,0.5)" : "0 0 30px var(--glow-gold)",
              lineHeight:1,
            }}>{lastRoll.total}</div>
            <div style={{ textAlign:"center", color:"var(--text-dim)", fontSize:"0.82rem", marginTop:"0.3rem" }}>
              {lastRoll.type==="atk" && `d20=${lastRoll.d} + ${lastRoll.stat}${modStaFmt(stats[lastRoll.stat])} + rank+${rankIdx}`}
              {lastRoll.type==="dmg" && `${lastRoll.dado}=${lastRoll.d} + ${lastRoll.stat}${lastRoll.sb>=0?"+":""}${lastRoll.sb}`}
              {lastRoll.crit && <div style={{ color:"var(--green)", fontWeight:700, marginTop:"0.3rem" }}>💥 CRITICO NATURALE</div>}
              {lastRoll.fumble && <div style={{ color:"var(--red)", fontWeight:700, marginTop:"0.3rem" }}>💀 FALLIMENTO CRITICO</div>}
              {lastRoll.type==="atk" && !lastRoll.crit && !lastRoll.fumble &&
                <div style={{ color:lastRoll.hit?"var(--green)":"var(--red)", fontWeight:700, marginTop:"0.3rem" }}>
                  {lastRoll.hit?"✓ HIT":"✗ MISS"}
                </div>}
            </div>
          </div>
        )}
      </div>

      {/* GESTIONE HP/FL */}
      <div className="card" style={{ padding:"1.5rem", marginBottom:"1rem" }}>
        <div className="section-title" style={{ marginBottom:"1rem" }}>Gestione Risorse</div>
        <div style={{ marginBottom:"0.75rem" }}>
          <div style={{ fontSize:"0.78rem", color:"var(--text-dim)", marginBottom:"0.3rem" }}>Danni / Cura (applicati alla barra HP)</div>
          <div style={{ display:"flex", gap:"0.3rem", flexWrap:"wrap", alignItems:"center" }}>
            <input className="input-field" type="number" value={dmgQty} onChange={e => setDmgQty(parseInt(e.target.value)||0)}
              style={{ width:90, fontSize:"0.88rem" }} />
            <button className="btn btn-danger btn-sm" onClick={() => hpChange(-Math.abs(dmgQty))}>💔 Danno</button>
            <button className="btn btn-success btn-sm" onClick={() => hpChange(Math.abs(dmgQty))}>💚 Cura</button>
            <span style={{ flex:1 }} />
            {[-10,-5,-1].map(d => <button key={d} className="btn btn-danger btn-xs" onClick={() => hpChange(d)}>{d}</button>)}
            {[1,5,10].map(d => <button key={d} className="btn btn-success btn-xs" onClick={() => hpChange(d)}>+{d}</button>)}
          </div>
        </div>
        <div style={{ marginBottom:"0.75rem" }}>
          <div style={{ fontSize:"0.78rem", color:"var(--text-dim)", marginBottom:"0.3rem" }}>Flusso (costo Skill)</div>
          <div style={{ display:"flex", gap:"0.3rem", flexWrap:"wrap", alignItems:"center" }}>
            <input className="input-field" type="number" value={flCost} onChange={e => setFlCost(parseInt(e.target.value)||0)}
              style={{ width:90, fontSize:"0.88rem" }} />
            <button className="btn btn-primary btn-sm" onClick={() => {
              flChange(-Math.abs(flCost));
              addLog(`Spesi ${Math.abs(flCost)} FL`, "skill");
            }}>⚡ Usa FL</button>
            <span style={{ flex:1 }} />
            {[-4,-2,-1].map(d => <button key={d} className="btn btn-outline btn-xs" onClick={() => flChange(d)}>{d}</button>)}
            {[1,2,4].map(d => <button key={d} className="btn btn-outline btn-xs" onClick={() => flChange(d)}>+{d}</button>)}
          </div>
        </div>
        <div style={{ marginBottom:"0.75rem" }}>
          <div style={{ fontSize:"0.78rem", color:"var(--text-dim)", marginBottom:"0.3rem" }}>Scintille ({char.scintille||0} / {char.scintille_max||3})</div>
          <div style={{ display:"flex", gap:"0.4rem", alignItems:"center", flexWrap:"wrap" }}>
            {Array.from({ length: char.scintille_max || 3 }).map((_, i) => (
              <div key={i} onClick={() => updateChar({ scintille: i < (char.scintille||0) ? i : i+1 })}
                style={{
                  width:22, height:22, borderRadius:"50%",
                  border:"2px solid var(--gold)", cursor:"pointer",
                  background: i < (char.scintille||0) ? "radial-gradient(circle, var(--gold-bright), var(--gold))" : "transparent",
                  boxShadow: i < (char.scintille||0) ? "0 0 10px rgba(201,169,110,0.6)" : "none",
                }} />
            ))}
            <button className="btn btn-outline btn-xs" onClick={() => updateChar({ scintille: Math.max(0, (char.scintille||0)-1) })}>−</button>
            <button className="btn btn-outline btn-xs" onClick={() => updateChar({ scintille: Math.min(char.scintille_max||3, (char.scintille||0)+1) })}>+</button>
          </div>
        </div>
        <div style={{ display:"flex", gap:"0.4rem", flexWrap:"wrap", marginTop:"1rem" }}>
          <button className="btn btn-outline btn-sm" onClick={shortRest}>🌙 Riposo Breve</button>
          <button className="btn btn-gold btn-sm" onClick={longRest}>☀️ Riposo Lungo</button>
        </div>
      </div>

      {/* CONDIZIONI */}
      <div className="card" style={{ padding:"1.5rem", marginBottom:"1rem" }}>
        <div className="section-title" style={{ marginBottom:"0.75rem" }}>Condizioni Attive</div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:"0.4rem" }}>
          {CONDIZIONI_LIST.map(c => {
            const on = (char.condizioni || []).includes(c.nome);
            return (
              <button key={c.nome} onClick={() => toggleCond(c.nome)}
                title={c.desc}
                style={{
                  padding:"0.35rem 0.75rem", borderRadius:16,
                  border:`1px solid ${on?"var(--red)":"var(--border)"}`,
                  background: on ? "rgba(255,77,109,0.2)" : "transparent",
                  color: on ? "var(--red)" : "var(--text-dim)",
                  fontFamily:"'Cinzel',serif", fontSize:"0.72rem", fontWeight:600,
                  cursor:"pointer", letterSpacing:"0.05em", transition:"all 0.15s",
                }}>{c.nome}</button>
            );
          })}
        </div>
        {(char.condizioni || []).length > 0 && (
          <div style={{ marginTop:"0.75rem", fontSize:"0.78rem", color:"var(--text-dim)" }}>
            {(char.condizioni || []).map(n => {
              const c = CONDIZIONI_LIST.find(x => x.nome === n);
              return c ? <div key={n} style={{ marginTop:"0.2rem" }}><strong style={{ color:"var(--red)" }}>{c.nome}:</strong> {c.desc}</div> : null;
            })}
          </div>
        )}
      </div>

      {/* SKILL RAPIDE IN COMBATTIMENTO */}
      <div className="card" style={{ padding:"1.5rem" }}>
        <div className="section-title" style={{ marginBottom:"0.75rem" }}>Usa Skill</div>
        {(char.skills || []).map((sk, i) => {
          const lv = skillLvFromPS(sk.ps || 0);
          const costoNum = parseInt(sk.costo) || 0;
          return (
            <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"0.7rem 0.9rem", background:"var(--panel2)", borderRadius:5, marginBottom:"0.5rem", border:"1px solid var(--border)", flexWrap:"wrap", gap:"0.5rem" }}>
              <div>
                <div style={{ fontFamily:"'Cinzel',serif", fontWeight:700, fontSize:"0.88rem", color:"var(--text-bright)" }}>{sk.nome}</div>
                <div style={{ fontSize:"0.72rem", color:"var(--text-dim)" }}>Lv {lv} · {sk.ps||0} PS · {sk.costo} FL</div>
              </div>
              <div style={{ display:"flex", gap:"0.3rem" }}>
                <button className="btn btn-primary btn-xs" onClick={() => {
                  if (costoNum > 0) flChange(-costoNum);
                  addLog(`Usa ${sk.nome} (Lv${lv}, -${costoNum} FL)`, "skill");
                }}>Usa</button>
                <button className="btn btn-outline btn-xs" onClick={() => {
                  const arr = [...(char.skills||[])];
                  arr[i] = { ...arr[i], ps: (arr[i].ps||0) + 3 };
                  updateChar({ skills: arr });
                  addLog(`+3 PS su ${sk.nome} → ${arr[i].ps} PS`, "skill");
                }}>+3 PS</button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function ProgressTab({ char, rank, rankNext, cls, razza, updateChar, addLog }) {
  const [paInp, setPaInp] = useState(50);
  const rankIdx = RANKS.indexOf(rank);

  const addPA = (amt) => {
    const np = Math.max(0, (char.pa||0) + amt);
    const oIdx = rankIdx;
    const nIdx = (() => {
      for (let i = RANKS.length-1; i >= 0; i--) {
        if (np >= RANK_PA[RANKS[i]]) return i;
      }
      return 0;
    })();
    addLog(`${amt>0?"+":""}${amt} PA → ${np.toLocaleString()} PA totali`, "level");
    if (nIdx > oIdx) {
      const newRank = RANKS[nIdx];
      let nhp = Math.round(cls.hp * RANK_MHP[newRank]);
      if (typeof razza.mod_hp === "number") {
        if (razza.mod_hp < 0 && razza.mod_hp > -1) nhp = Math.ceil(nhp * (1 + razza.mod_hp));
        else nhp += razza.mod_hp;
      }
      let nfl = Math.round(cls.fl * RANK_MFL[newRank]);
      if (typeof razza.mod_fl === "number" && razza.mod_fl < 0) nfl = Math.floor(nfl * (1 + razza.mod_fl));
      addLog(`🎉 RANK UP! ${RANKS[oIdx]} → ${newRank} — ${RANK_TITOLI[newRank]}`, "level");
      updateChar({ pa: np, hp_curr: nhp, fl_curr: nfl });
    } else {
      updateChar({ pa: np });
    }
  };

  const pctToNext = rankNext ? Math.min(100, ((char.pa - RANK_PA[rank]) / (rankNext - RANK_PA[rank])) * 100) : 100;

  return (
    <>
      <div className="card" style={{ padding:"2rem", marginBottom:"1rem", textAlign:"center" }}>
        <div className="section-title" style={{ marginBottom:"0.5rem" }}>Rank Attuale</div>
        <div style={{
          fontFamily:"'Cinzel Decorative',serif", fontSize:"6rem", fontWeight:900, lineHeight:1,
          color: getRankColor(rank),
          textShadow: `0 0 60px ${getRankColor(rank)}40`,
        }}>{rank}</div>
        <div style={{ fontFamily:"'Cinzel',serif", fontSize:"1rem", color:"var(--text-dim)", marginTop:"0.5rem" }}>{RANK_TITOLI[rank]}</div>
        <div style={{ fontSize:"1.4rem", fontWeight:600, marginTop:"0.75rem", color:"var(--gold)" }}>
          {(char.pa||0).toLocaleString()} <span style={{ fontSize:"0.82rem", color:"var(--text-mute)" }}>PA totali</span>
        </div>
        {rankNext && (
          <div style={{ marginTop:"1rem", maxWidth:400, margin:"1rem auto 0" }}>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:"0.75rem", color:"var(--text-dim)", marginBottom:"0.3rem" }}>
              <span>→ Rank {RANKS[rankIdx+1]}</span>
              <span>{((char.pa||0) - RANK_PA[rank]).toLocaleString()} / {(rankNext - RANK_PA[rank]).toLocaleString()}</span>
            </div>
            <ProgressBar value={(char.pa||0) - RANK_PA[rank]} max={rankNext - RANK_PA[rank]} color="var(--gold)" height={10} />
            <div style={{ fontSize:"0.75rem", color:"var(--text-mute)", marginTop:"0.3rem" }}>
              Mancano: {(rankNext - (char.pa||0)).toLocaleString()} PA
            </div>
          </div>
        )}
      </div>

      <div className="card" style={{ padding:"1.5rem", marginBottom:"1rem" }}>
        <div className="section-title" style={{ marginBottom:"1rem" }}>Aggiungi Punti Avanzamento</div>
        <div style={{ display:"flex", gap:"0.5rem", alignItems:"center", flexWrap:"wrap", marginBottom:"0.75rem" }}>
          <input className="input-field" type="number" value={paInp} onChange={e => setPaInp(parseInt(e.target.value)||0)}
            style={{ maxWidth:140 }} />
          <button className="btn btn-gold btn-sm" onClick={() => addPA(paInp)}>+ Aggiungi</button>
          <button className="btn btn-danger btn-sm" onClick={() => addPA(-Math.abs(paInp))}>- Rimuovi</button>
        </div>
        <div style={{ display:"flex", gap:"0.3rem", flexWrap:"wrap" }}>
          {[5,15,40,100,250,500].map(n => <button key={n} className="btn btn-outline btn-xs" onClick={() => addPA(n)}>+{n}</button>)}
          <button className="btn btn-outline btn-xs" onClick={() => addPA(150)}>+150 Missione</button>
          <button className="btn btn-outline btn-xs" onClick={() => addPA(400)}>+400 Boss</button>
        </div>
      </div>

      <div className="card" style={{ padding:"1.5rem" }}>
        <div className="section-title" style={{ marginBottom:"1rem" }}>Tabella Progressione</div>
        {RANKS.map((r, i) => {
          const ok = (char.pa||0) >= RANK_PA[r];
          const curr = i === rankIdx;
          const col = getRankColor(r);
          let nhp = Math.round(cls.hp * RANK_MHP[r]);
          if (typeof razza.mod_hp === "number") {
            if (razza.mod_hp < 0 && razza.mod_hp > -1) nhp = Math.ceil(nhp * (1 + razza.mod_hp));
            else nhp += razza.mod_hp;
          }
          let nfl = Math.round(cls.fl * RANK_MFL[r]);
          if (typeof razza.mod_fl === "number" && razza.mod_fl < 0) nfl = Math.floor(nfl * (1 + razza.mod_fl));
          return (
            <div key={r} style={{
              display:"flex", alignItems:"center", gap:"0.75rem",
              padding:"0.6rem 0.9rem", marginBottom:"0.3rem",
              opacity: ok ? 1 : 0.4,
              background: curr ? `${col}15` : ok ? "var(--panel2)" : "transparent",
              border:`1px solid ${curr?col:"var(--border)"}`,
              borderRadius:6,
            }}>
              <RankBadge rank={r} size="sm" />
              <div style={{ flex:1 }}>
                <div style={{ fontFamily:"'Cinzel',serif", fontWeight:600, fontSize:"0.85rem" }}>{RANK_TITOLI[r]}</div>
                <div style={{ fontSize:"0.72rem", color:"var(--text-dim)" }}>{RANK_PA[r].toLocaleString()} PA</div>
              </div>
              <div style={{ fontSize:"0.72rem", color:"var(--text-dim)", textAlign:"right" }}>
                {nhp} HP · {nfl} FL
                {curr && <div style={{ color:"var(--gold)", fontWeight:700 }}>← Attuale</div>}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function PrintLayout({ char, cls, razza, frammento, stats, rank, hp_max, fl_max, dif, vel }) {
  return (
    <div className="print-only" style={{ padding:"18px", fontFamily:"Georgia, serif", color:"#000", fontSize:"11pt", lineHeight:1.4, background:"white" }}>
      <div style={{ borderBottom:"2px solid #333", paddingBottom:12, marginBottom:16 }}>
        <div style={{ fontSize:"20pt", fontWeight:"bold", letterSpacing:"0.05em" }}>CHAOS SYSTEM · ARCADIA2099</div>
        <div style={{ fontSize:"9pt", color:"#666", marginTop:4 }}>Scheda Personaggio</div>
      </div>

      <div style={{ display:"flex", gap:20, marginBottom:16 }}>
        {char.avatar && (
          <img src={char.avatar} alt="" style={{ width:80, height:80, borderRadius:"50%", objectFit:"cover", border:"2px solid #333" }} />
        )}
        <div style={{ flex:1 }}>
          <div style={{ fontSize:"18pt", fontWeight:"bold", marginBottom:4 }}>{char.nome}</div>
          <div style={{ fontSize:"10pt" }}><b>Classe:</b> {cls.nome} · <b>Razza:</b> {razza.nome}</div>
          <div style={{ fontSize:"10pt" }}><b>Rank:</b> {rank} — {RANK_TITOLI[rank]} · <b>PA:</b> {char.pa.toLocaleString()}</div>
          {char.background && <div style={{ fontSize:"10pt" }}><b>Background:</b> {char.background}</div>}
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:14, background:"#f5f5f5", padding:10, border:"1px solid #ccc" }}>
        <div><b>HP:</b> {char.hp_curr} / {hp_max}</div>
        <div><b>FL:</b> {char.fl_curr} / {fl_max}</div>
        <div><b>Difesa:</b> {dif}</div>
        <div><b>Velocità:</b> {vel}m</div>
        <div><b>Iniziativa:</b> 1d20{modStaFmt(stats.AGI)}</div>
        <div><b>Scintille:</b> {char.scintille}/{char.scintille_max}</div>
      </div>

      <h3 style={{ fontSize:"11pt", borderBottom:"1px solid #666", paddingBottom:3, margin:"12px 0 6px", textTransform:"uppercase", letterSpacing:".1em" }}>Caratteristiche</h3>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:8, marginBottom:12 }}>
        {Object.entries(stats).map(([k,v]) => (
          <div key={k} style={{ textAlign:"center", border:"1px solid #333", padding:"5px 3px" }}>
            <div style={{ fontSize:"8pt", color:"#666", fontWeight:"bold" }}>{k}</div>
            <div style={{ fontSize:"15pt", fontWeight:"bold" }}>{v}</div>
            <div style={{ fontSize:"9pt", color:"#555" }}>{modStaFmt(v)}</div>
          </div>
        ))}
      </div>

      <h3 style={{ fontSize:"11pt", borderBottom:"1px solid #666", paddingBottom:3, margin:"12px 0 6px", textTransform:"uppercase", letterSpacing:".1em" }}>Skill</h3>
      {(char.skills||[]).map((sk,i) => (
        <div key={i} style={{ fontSize:"10pt", marginBottom:4 }}>
          <b>{sk.nome}</b> — Lv {skillLvFromPS(sk.ps||0)} ({sk.ps||0} PS) · Costo {sk.costo} FL
        </div>
      ))}

      {frammento && <>
        <h3 style={{ fontSize:"11pt", borderBottom:"1px solid #666", paddingBottom:3, margin:"14px 0 6px", textTransform:"uppercase", letterSpacing:".1em" }}>Frammento del Creatore</h3>
        <div style={{ fontSize:"10pt" }}><b>{frammento.nome}</b> — {frammento.fonte}</div>
        <div style={{ fontSize:"9pt", color:"#555", marginTop:3, fontStyle:"italic" }}>{frammento.mec_breve}</div>
      </>}

      <h3 style={{ fontSize:"11pt", borderBottom:"1px solid #666", paddingBottom:3, margin:"14px 0 6px", textTransform:"uppercase", letterSpacing:".1em" }}>Razza — {razza.nome}</h3>
      <div style={{ fontSize:"10pt", fontWeight:"bold" }}>{razza.bonus}</div>
      <div style={{ fontSize:"9pt", marginTop:4 }}><b>Tratto 1:</b> {razza.tratto1}</div>
      <div style={{ fontSize:"9pt", marginTop:3 }}><b>Tratto 2:</b> {razza.tratto2}</div>

      {char.note && <>
        <h3 style={{ fontSize:"11pt", borderBottom:"1px solid #666", paddingBottom:3, margin:"14px 0 6px", textTransform:"uppercase", letterSpacing:".1em" }}>Note</h3>
        <div style={{ fontSize:"10pt", whiteSpace:"pre-wrap" }}>{char.note}</div>
      </>}

      <div style={{ marginTop:20, paddingTop:10, borderTop:"1px solid #ccc", fontSize:"8pt", color:"#888", textAlign:"center" }}>
        Chaos System Arcadia2099 · Volume Unico v7
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// COMPENDIO — NPC · Bestiario · Arsenale
// ═══════════════════════════════════════════════════════
const FAZIONI_COLOR = {
  "Saint of Cosmos": "#c9a96e",
  "Lullaby": "#8c6eff",
  "Lions and Blood": "#ff4d6d",
  "Shadows": "#6b4dff",
  "M.A.F.I.A.": "#4dffa8",
  "Unity Army": "#4dd9ff",
  "Nova Era": "#a88dff",
  "Discepoli del Frammento Oscuro": "#ff6b6b",
};

function CompendioPage() {
  const [sezione, setSezione] = useState("npc"); // npc | bestiario | arsenale
  const [search, setSearch] = useState("");
  const [rankFilter, setRankFilter] = useState("");
  const [fazioneFilter, setFazioneFilter] = useState("");
  const [tipoFilter, setTipoFilter] = useState("");
  const [armiFilter, setArmiFilter] = useState("");
  const [selected, setSelected] = useState(null);

  // Chiudi dettaglio quando cambi sezione
  useEffect(() => { setSelected(null); setSearch(""); setRankFilter(""); setFazioneFilter(""); setTipoFilter(""); setArmiFilter(""); }, [sezione]);

  const npcFiltered = useMemo(() => {
    return NPCS.filter(n => {
      if (search && !n.nome.toLowerCase().includes(search.toLowerCase()) && !n.titolo.toLowerCase().includes(search.toLowerCase())) return false;
      if (rankFilter && n.rank !== rankFilter) return false;
      if (fazioneFilter && n.fazione !== fazioneFilter) return false;
      return true;
    });
  }, [search, rankFilter, fazioneFilter]);

  const bestFiltered = useMemo(() => {
    return BESTIARIO.filter(b => {
      if (search && !b.nome.toLowerCase().includes(search.toLowerCase()) && !b.tipo.toLowerCase().includes(search.toLowerCase())) return false;
      if (rankFilter && b.rank !== rankFilter) return false;
      if (tipoFilter && !b.tipo.toLowerCase().includes(tipoFilter.toLowerCase())) return false;
      return true;
    });
  }, [search, rankFilter, tipoFilter]);

  const armiFiltered = useMemo(() => {
    return ARSENALE.filter(a => {
      if (search && !a.nome.toLowerCase().includes(search.toLowerCase()) && !a.flavor.toLowerCase().includes(search.toLowerCase())) return false;
      if (rankFilter && a.rank !== rankFilter) return false;
      if (armiFilter && a.sezione !== armiFilter) return false;
      return true;
    });
  }, [search, rankFilter, armiFilter]);

  // Tipologie uniche del bestiario
  const tipiUnici = useMemo(() => {
    const set = new Set();
    BESTIARIO.forEach(b => {
      if (b.tipo) {
        // Estrae la parola chiave principale (prima parola o prima di "—")
        const first = b.tipo.split(/[—-]/)[0].trim();
        if (first) set.add(first);
      }
    });
    return Array.from(set).sort();
  }, []);

  // Sezioni armi uniche
  const sezioniArmi = useMemo(() => {
    const set = new Set(ARSENALE.map(a => a.sezione).filter(Boolean));
    return Array.from(set).sort();
  }, []);

  return (
    <div className="anim-fade-in">
      <div style={{ marginBottom:"2rem" }}>
        <div className="section-title">Volume II — Compendio di Arkadia2099</div>
        <div className="page-title">Il Compendio</div>
        <p className="page-subtitle">
          Ottanta figure operanti ad Arkadium. Duecentotrentuno creature del bestiario distribuite per sei categorie ecologiche.
          Cento armi di ordinanza e cerimoniali. Tutto ciò che è sopravvissuto al Terzo Pandora, catalogato per il GM.
        </p>
      </div>

      {/* Sotto-tabs */}
      <div style={{ display:"flex", gap:"0.5rem", marginBottom:"1.5rem", flexWrap:"wrap" }}>
        {[
          ["npc", `👤 NPC · ${NPCS.length}`],
          ["bestiario", `🐺 Bestiario · ${BESTIARIO.length}`],
          ["arsenale", `⚔️ Arsenale · ${ARSENALE.length}`],
        ].map(([id, label]) => (
          <button key={id} onClick={() => setSezione(id)}
            className={`btn ${sezione===id?"btn-primary":"btn-outline"}`}
            style={{ fontSize:"0.8rem" }}>{label}</button>
        ))}
      </div>

      {/* Filtri comuni */}
      <div className="card" style={{ padding:"1rem", marginBottom:"1rem" }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr auto auto", gap:"0.5rem", flexWrap:"wrap" }}>
          <input
            className="input-field"
            placeholder={`Cerca ${sezione === "npc" ? "per nome o titolo" : sezione === "bestiario" ? "per nome o tipologia" : "per nome o descrizione"}...`}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select className="input-field" value={rankFilter} onChange={e => setRankFilter(e.target.value)} style={{ minWidth:120 }}>
            <option value="">Tutti i Rank</option>
            {RANKS.map(r => <option key={r} value={r}>Rank {r}</option>)}
          </select>
          {sezione === "npc" && (
            <select className="input-field" value={fazioneFilter} onChange={e => setFazioneFilter(e.target.value)} style={{ minWidth:180 }}>
              <option value="">Tutte le Fazioni</option>
              {Object.keys(FAZIONI_COLOR).map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          )}
          {sezione === "bestiario" && (
            <select className="input-field" value={tipoFilter} onChange={e => setTipoFilter(e.target.value)} style={{ minWidth:180 }}>
              <option value="">Tutte le tipologie</option>
              {tipiUnici.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          )}
          {sezione === "arsenale" && (
            <select className="input-field" value={armiFilter} onChange={e => setArmiFilter(e.target.value)} style={{ minWidth:180 }}>
              <option value="">Tutte le categorie</option>
              {sezioniArmi.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          )}
        </div>
      </div>

      {/* NPC LIST */}
      {sezione === "npc" && (
        <div className="grid-2">
          {npcFiltered.map((n, i) => (
            <div key={i} onClick={() => setSelected({ type:"npc", data:n })}
              className="card" style={{
                padding:"1rem", cursor:"pointer",
                borderLeft:`3px solid ${FAZIONI_COLOR[n.fazione] || "var(--purple)"}`,
              }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"0.4rem", gap:"0.5rem" }}>
                <div>
                  <div style={{ fontFamily:"'Cinzel',serif", fontWeight:700, color:"var(--text-bright)", fontSize:"1rem", lineHeight:1.2 }}>{n.nome}</div>
                  <div style={{ fontSize:"0.72rem", color:"var(--text-dim)", marginTop:"0.2rem" }}>{n.titolo}</div>
                </div>
                <RankBadge rank={n.rank} size="sm" />
              </div>
              <div style={{ display:"flex", gap:"0.4rem", flexWrap:"wrap", marginTop:"0.4rem" }}>
                <span style={{ fontSize:"0.68rem", padding:"0.15rem 0.5rem", background:`${FAZIONI_COLOR[n.fazione]||"var(--purple)"}20`, color:FAZIONI_COLOR[n.fazione]||"var(--purple)", borderRadius:3, fontFamily:"'Cinzel',serif", fontWeight:600 }}>{n.fazione}</span>
                {n.razza && <span style={{ fontSize:"0.68rem", padding:"0.15rem 0.5rem", background:"var(--panel2)", color:"var(--text-dim)", borderRadius:3 }}>{n.razza}</span>}
                {n.classe && <span style={{ fontSize:"0.68rem", padding:"0.15rem 0.5rem", background:"var(--panel2)", color:"var(--text-dim)", borderRadius:3 }}>{n.classe}</span>}
              </div>
              <div style={{ display:"flex", gap:"0.6rem", marginTop:"0.6rem", fontSize:"0.72rem" }}>
                <span style={{ color:"var(--red)" }}>HP {n.hp}</span>
                <span style={{ color:"var(--flux)" }}>FL {n.fl}</span>
                <span style={{ color:"var(--purple)" }}>DIF {n.dif}</span>
              </div>
            </div>
          ))}
          {npcFiltered.length === 0 && <div style={{ gridColumn:"1/-1", textAlign:"center", padding:"2rem", color:"var(--text-dim)" }}>Nessun NPC trovato con questi filtri.</div>}
        </div>
      )}

      {/* BESTIARIO LIST */}
      {sezione === "bestiario" && (
        <div className="grid-2">
          {bestFiltered.map((b, i) => (
            <div key={i} onClick={() => setSelected({ type:"bestia", data:b })}
              className="card" style={{ padding:"1rem", cursor:"pointer" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"0.4rem" }}>
                <div>
                  <div style={{ fontFamily:"'Cinzel',serif", fontWeight:700, color:"var(--text-bright)", fontSize:"1rem", lineHeight:1.2 }}>{b.nome}</div>
                  <div style={{ fontSize:"0.72rem", color:"var(--text-dim)", fontStyle:"italic", marginTop:"0.2rem" }}>{b.tipo}</div>
                </div>
                <RankBadge rank={b.rank} size="sm" />
              </div>
              <div style={{ display:"flex", gap:"0.6rem", marginTop:"0.6rem", fontSize:"0.72rem" }}>
                <span style={{ color:"var(--red)" }}>HP {b.hp}</span>
                <span style={{ color:"var(--flux)" }}>FL {b.fl}</span>
                <span style={{ color:"var(--purple)" }}>DIF {b.dif}</span>
              </div>
              {b.ambiente && (
                <div style={{ fontSize:"0.7rem", color:"var(--text-dim)", marginTop:"0.5rem", opacity:0.8 }}>
                  <strong style={{ color:"var(--gold)" }}>Ambiente:</strong> {b.ambiente.length > 80 ? b.ambiente.slice(0,80)+"…" : b.ambiente}
                </div>
              )}
            </div>
          ))}
          {bestFiltered.length === 0 && <div style={{ gridColumn:"1/-1", textAlign:"center", padding:"2rem", color:"var(--text-dim)" }}>Nessuna creatura trovata con questi filtri.</div>}
        </div>
      )}

      {/* ARSENALE */}
      {sezione === "arsenale" && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(300px, 1fr))", gap:"1rem" }}>
          {armiFiltered.map((a, i) => (
            <div key={i} onClick={() => setSelected({ type:"arma", data:a })}
              className="card" style={{ padding:"1rem", cursor:"pointer" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:"0.4rem" }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontFamily:"'Cinzel',serif", fontWeight:700, color:"var(--text-bright)", fontSize:"0.95rem", lineHeight:1.2 }}>{a.nome}</div>
                  <div style={{ fontSize:"0.68rem", color:"var(--gold)", marginTop:"0.1rem" }}>{a.sezione}</div>
                </div>
                <div style={{ display:"flex", gap:"0.3rem", alignItems:"center" }}>
                  <RankBadge rank={a.rank} size="sm" />
                </div>
              </div>
              <div style={{ display:"flex", gap:"0.75rem", marginTop:"0.6rem", fontSize:"0.72rem", flexWrap:"wrap" }}>
                <span><span style={{ color:"var(--text-dim)" }}>Dado:</span> <strong style={{ color:"var(--text-bright)" }}>{a.dado}</strong></span>
                <span><span style={{ color:"var(--text-dim)" }}>Stat:</span> <strong style={{ color:"var(--purple)" }}>{a.stat}</strong></span>
                <span><span style={{ color:"var(--text-dim)" }}>Gittata:</span> <strong style={{ color:"var(--text-bright)" }}>{a.gittata}</strong></span>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", marginTop:"0.5rem", alignItems:"center" }}>
                <span style={{ fontSize:"0.72rem", color:"var(--text-dim)" }}>{a.proprieta}</span>
                <span style={{ fontSize:"0.78rem", color:"var(--gold)", fontWeight:700 }}>{a.prezzo}</span>
              </div>
            </div>
          ))}
          {armiFiltered.length === 0 && <div style={{ gridColumn:"1/-1", textAlign:"center", padding:"2rem", color:"var(--text-dim)" }}>Nessuna arma trovata con questi filtri.</div>}
        </div>
      )}

      {/* DETTAGLIO MODAL */}
      {selected && <CompendioDetail data={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function CompendioDetail({ data, onClose }) {
  const { type, data: item } = data;

  // Overlay con dettaglio
  return (
    <div onClick={onClose} style={{
      position:"fixed", inset:0, background:"rgba(3,1,8,0.85)", zIndex:100,
      display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem",
      animation:"fadeIn 0.2s ease", backdropFilter:"blur(6px)",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background:"var(--panel)", border:"1px solid var(--border-strong)", borderRadius:12,
        maxWidth:720, width:"100%", maxHeight:"88vh", overflowY:"auto",
        boxShadow:"0 20px 60px rgba(0,0,0,0.6)",
      }}>
        {type === "npc" && <NpcDetailBody item={item} onClose={onClose} />}
        {type === "bestia" && <BestiaDetailBody item={item} onClose={onClose} />}
        {type === "arma" && <ArmaDetailBody item={item} onClose={onClose} />}
      </div>
    </div>
  );
}

function NpcDetailBody({ item, onClose }) {
  const fazCol = FAZIONI_COLOR[item.fazione] || "var(--purple)";
  return (
    <>
      <div style={{
        padding:"1.5rem 1.5rem 1rem", borderBottom:`2px solid ${fazCol}`,
        background:`linear-gradient(135deg, ${fazCol}15, transparent)`,
      }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:"1rem" }}>
          <div>
            <div style={{ fontFamily:"'Cinzel Decorative',serif", fontSize:"1.6rem", fontWeight:700, color:"var(--text-bright)", lineHeight:1.2 }}>{item.nome}</div>
            <div style={{ fontSize:"0.85rem", color:"var(--gold)", marginTop:"0.3rem", fontStyle:"italic" }}>{item.titolo}</div>
            <div style={{ display:"flex", gap:"0.4rem", flexWrap:"wrap", marginTop:"0.6rem" }}>
              <span style={{ fontSize:"0.7rem", padding:"0.2rem 0.6rem", background:`${fazCol}30`, color:fazCol, borderRadius:4, fontFamily:"'Cinzel',serif", fontWeight:600 }}>{item.fazione}</span>
              {item.razza && <span style={{ fontSize:"0.7rem", padding:"0.2rem 0.6rem", background:"var(--panel2)", color:"var(--text-dim)", borderRadius:4 }}>{item.razza}</span>}
              {item.classe && <span style={{ fontSize:"0.7rem", padding:"0.2rem 0.6rem", background:"var(--panel2)", color:"var(--text-dim)", borderRadius:4 }}>{item.classe}</span>}
            </div>
          </div>
          <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:"0.4rem" }}>
            <RankBadge rank={item.rank} size="lg" />
            <button className="btn btn-outline btn-xs" onClick={onClose}>✕ Chiudi</button>
          </div>
        </div>
      </div>

      <div style={{ padding:"1.5rem" }}>
        {/* BLOCCO STAT */}
        <div style={{ background:"var(--panel2)", border:"1px solid var(--border)", borderRadius:8, padding:"1rem", marginBottom:"1rem" }}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:"0.5rem", marginBottom:"0.75rem" }}>
            {[{l:"HP",v:item.hp,c:"var(--red)"},{l:"FL",v:item.fl,c:"var(--flux)"},{l:"DIF",v:item.dif,c:"var(--purple)"},{l:"VEL",v:item.vel+"m",c:"var(--gold)"}].map(s => (
              <div key={s.l} style={{ textAlign:"center" }}>
                <div style={{ fontSize:"0.65rem", color:"var(--text-dim)", textTransform:"uppercase", letterSpacing:"0.1em" }}>{s.l}</div>
                <div style={{ fontFamily:"'Cinzel',serif", fontSize:"1.4rem", fontWeight:700, color:s.c }}>{s.v}</div>
              </div>
            ))}
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(6, 1fr)", gap:"0.3rem" }}>
            {Object.entries(item.stats).map(([k,v]) => (
              <div key={k} style={{ textAlign:"center", padding:"0.4rem 0.2rem", background:"var(--panel)", borderRadius:4 }}>
                <div style={{ fontSize:"0.6rem", color:"var(--text-dim)" }}>{k}</div>
                <div style={{ fontFamily:"'Cinzel',serif", fontSize:"1rem", fontWeight:700 }}>{v}</div>
                <div style={{ fontSize:"0.62rem", color:"var(--purple-bright)" }}>{((v-10)/2>=0?"+":"") + Math.floor((v-10)/2)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* SKILL */}
        {item.skills && item.skills.length > 0 && (
          <div style={{ marginBottom:"1rem" }}>
            <div className="section-title" style={{ marginBottom:"0.5rem" }}>Azioni</div>
            {item.skills.map((sk, i) => (
              <div key={i} style={{ marginBottom:"0.75rem", padding:"0.75rem", background:"var(--panel2)", border:"1px solid var(--border)", borderRadius:6 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"0.3rem", flexWrap:"wrap", gap:"0.3rem" }}>
                  <span style={{ fontFamily:"'Cinzel',serif", fontWeight:700, color:"var(--text-bright)", fontSize:"0.9rem" }}>{sk.nome}</span>
                  {sk.costo && <span style={{ fontSize:"0.68rem", background:"rgba(140,110,255,0.15)", color:"var(--purple-bright)", padding:"0.1rem 0.5rem", borderRadius:3, border:"1px solid rgba(140,110,255,0.3)" }}>{sk.costo}</span>}
                </div>
                <p style={{ fontSize:"0.82rem", color:"var(--text-dim)", lineHeight:1.5 }}>{sk.desc}</p>
              </div>
            ))}
          </div>
        )}

        {/* TRATTI */}
        {item.tratti && item.tratti.length > 0 && (
          <div style={{ marginBottom:"1rem" }}>
            <div className="section-title" style={{ marginBottom:"0.5rem" }}>Tratti</div>
            {item.tratti.map((t, i) => (
              <div key={i} style={{ marginBottom:"0.5rem", padding:"0.6rem 0.9rem", background:"var(--panel2)", border:"1px solid var(--border)", borderRadius:6, borderLeft:"3px solid var(--gold)" }}>
                <div style={{ fontFamily:"'Cinzel',serif", fontWeight:700, color:"var(--gold)", fontSize:"0.85rem", marginBottom:"0.2rem" }}>◆ {t.nome}</div>
                <p style={{ fontSize:"0.82rem", color:"var(--text-dim)", lineHeight:1.5 }}>{t.desc}</p>
              </div>
            ))}
          </div>
        )}

        {/* STORIA */}
        {item.storia && (
          <div style={{ marginBottom:"1rem" }}>
            <div className="section-title" style={{ marginBottom:"0.5rem" }}>Storia</div>
            <p style={{ fontSize:"0.88rem", color:"var(--text)", fontStyle:"italic", lineHeight:1.65, padding:"0.75rem 1rem", borderLeft:"2px solid var(--purple)", background:"rgba(140,110,255,0.05)" }}>"{item.storia}"</p>
          </div>
        )}

        {/* MOTIVAZIONE / SEGRETO / IN CAMPAGNA / IN COMBATTIMENTO */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr", gap:"0.5rem" }}>
          {[
            { label:"Motivazione", val:item.motivazione, col:"var(--gold)" },
            { label:"Segreto", val:item.segreto, col:"var(--red)" },
            { label:"In campagna", val:item.in_campagna, col:"var(--flux)" },
            { label:"In combattimento", val:item.in_combattimento, col:"var(--purple)" },
          ].filter(x => x.val).map(x => (
            <div key={x.label} style={{ padding:"0.7rem 0.9rem", background:"var(--panel2)", border:"1px solid var(--border)", borderRadius:6 }}>
              <div style={{ fontFamily:"'Cinzel',serif", fontSize:"0.68rem", color:x.col, textTransform:"uppercase", letterSpacing:"0.12em", fontWeight:700, marginBottom:"0.3rem" }}>{x.label}</div>
              <p style={{ fontSize:"0.85rem", color:"var(--text)", lineHeight:1.55 }}>{x.val}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function BestiaDetailBody({ item, onClose }) {
  return (
    <>
      <div style={{ padding:"1.5rem 1.5rem 1rem", borderBottom:"2px solid var(--purple)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:"1rem" }}>
          <div>
            <div style={{ fontFamily:"'Cinzel Decorative',serif", fontSize:"1.6rem", fontWeight:700, color:"var(--text-bright)", lineHeight:1.2 }}>{item.nome}</div>
            <div style={{ fontSize:"0.85rem", color:"var(--flux)", marginTop:"0.3rem", fontStyle:"italic" }}>{item.tipo}</div>
          </div>
          <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:"0.4rem" }}>
            <RankBadge rank={item.rank} size="lg" />
            <button className="btn btn-outline btn-xs" onClick={onClose}>✕ Chiudi</button>
          </div>
        </div>
      </div>

      <div style={{ padding:"1.5rem" }}>
        {/* STAT */}
        <div style={{ background:"var(--panel2)", border:"1px solid var(--border)", borderRadius:8, padding:"1rem", marginBottom:"1rem" }}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:"0.5rem", marginBottom:"0.75rem" }}>
            {[{l:"HP",v:item.hp,c:"var(--red)"},{l:"FL",v:item.fl,c:"var(--flux)"},{l:"DIF",v:item.dif,c:"var(--purple)"}].map(s => (
              <div key={s.l} style={{ textAlign:"center" }}>
                <div style={{ fontSize:"0.65rem", color:"var(--text-dim)", textTransform:"uppercase", letterSpacing:"0.1em" }}>{s.l}</div>
                <div style={{ fontFamily:"'Cinzel',serif", fontSize:"1.4rem", fontWeight:700, color:s.c }}>{s.v}</div>
              </div>
            ))}
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(7, 1fr)", gap:"0.3rem" }}>
            {Object.entries(item.stats).map(([k,v]) => (
              <div key={k} style={{ textAlign:"center", padding:"0.4rem 0.2rem", background:"var(--panel)", borderRadius:4 }}>
                <div style={{ fontSize:"0.6rem", color:"var(--text-dim)" }}>{k}</div>
                <div style={{ fontFamily:"'Cinzel',serif", fontSize:"1rem", fontWeight:700 }}>{v}</div>
                <div style={{ fontSize:"0.62rem", color:"var(--purple-bright)" }}>{((v-10)/2>=0?"+":"") + Math.floor((v-10)/2)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* SKILL */}
        {item.skills && item.skills.length > 0 && (
          <div style={{ marginBottom:"1rem" }}>
            <div className="section-title" style={{ marginBottom:"0.5rem" }}>Azioni</div>
            {item.skills.map((sk, i) => (
              <div key={i} style={{ marginBottom:"0.6rem", padding:"0.75rem", background:"var(--panel2)", border:"1px solid var(--border)", borderRadius:6 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"0.3rem", flexWrap:"wrap", gap:"0.3rem" }}>
                  <span style={{ fontFamily:"'Cinzel',serif", fontWeight:700, color:"var(--text-bright)", fontSize:"0.9rem" }}>{sk.nome}</span>
                  {sk.costo && <span style={{ fontSize:"0.68rem", background:"rgba(140,110,255,0.15)", color:"var(--purple-bright)", padding:"0.1rem 0.5rem", borderRadius:3, border:"1px solid rgba(140,110,255,0.3)" }}>{sk.costo}</span>}
                </div>
                <p style={{ fontSize:"0.82rem", color:"var(--text-dim)", lineHeight:1.5 }}>{sk.desc}</p>
              </div>
            ))}
          </div>
        )}

        {/* TRATTI */}
        {item.tratti && item.tratti.length > 0 && (
          <div style={{ marginBottom:"1rem" }}>
            <div className="section-title" style={{ marginBottom:"0.5rem" }}>Tratti</div>
            {item.tratti.map((t, i) => (
              <div key={i} style={{ marginBottom:"0.4rem", padding:"0.5rem 0.8rem", background:"var(--panel2)", border:"1px solid var(--border)", borderRadius:5, borderLeft:"3px solid var(--gold)" }}>
                <span style={{ fontFamily:"'Cinzel',serif", fontWeight:700, color:"var(--gold)", fontSize:"0.82rem" }}>■ {t.nome}.</span>
                <span style={{ fontSize:"0.82rem", color:"var(--text-dim)", marginLeft:"0.4rem" }}>{t.desc}</span>
              </div>
            ))}
          </div>
        )}

        {/* LORE */}
        {item.lore && item.lore.length > 30 && (
          <div style={{ marginBottom:"1rem" }}>
            <div className="section-title" style={{ marginBottom:"0.5rem" }}>Lore</div>
            <p style={{ fontSize:"0.88rem", color:"var(--text)", lineHeight:1.65, padding:"0.75rem 1rem", borderLeft:"2px solid var(--flux)", background:"rgba(77,217,255,0.04)" }}>{item.lore}</p>
          </div>
        )}

        {/* AMBIENTE / TATTICHE */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr", gap:"0.5rem" }}>
          {item.ambiente && (
            <div style={{ padding:"0.7rem 0.9rem", background:"var(--panel2)", border:"1px solid var(--border)", borderRadius:6 }}>
              <div style={{ fontFamily:"'Cinzel',serif", fontSize:"0.68rem", color:"var(--gold)", textTransform:"uppercase", letterSpacing:"0.12em", fontWeight:700, marginBottom:"0.3rem" }}>Ambiente</div>
              <p style={{ fontSize:"0.85rem", color:"var(--text)", lineHeight:1.55 }}>{item.ambiente}</p>
            </div>
          )}
          {item.tattiche && (
            <div style={{ padding:"0.7rem 0.9rem", background:"var(--panel2)", border:"1px solid var(--border)", borderRadius:6 }}>
              <div style={{ fontFamily:"'Cinzel',serif", fontSize:"0.68rem", color:"var(--red)", textTransform:"uppercase", letterSpacing:"0.12em", fontWeight:700, marginBottom:"0.3rem" }}>Tattiche</div>
              <p style={{ fontSize:"0.85rem", color:"var(--text)", lineHeight:1.55 }}>{item.tattiche}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function ArmaDetailBody({ item, onClose }) {
  return (
    <>
      <div style={{ padding:"1.5rem 1.5rem 1rem", borderBottom:"2px solid var(--gold)", background:"linear-gradient(135deg, rgba(201,169,110,0.1), transparent)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:"1rem" }}>
          <div>
            <div style={{ fontFamily:"'Cinzel Decorative',serif", fontSize:"1.6rem", fontWeight:700, color:"var(--text-bright)", lineHeight:1.2 }}>{item.nome}</div>
            <div style={{ fontSize:"0.85rem", color:"var(--gold)", marginTop:"0.3rem" }}>{item.sezione}</div>
          </div>
          <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:"0.4rem" }}>
            <RankBadge rank={item.rank} size="lg" />
            <button className="btn btn-outline btn-xs" onClick={onClose}>✕ Chiudi</button>
          </div>
        </div>
      </div>

      <div style={{ padding:"1.5rem" }}>
        <div style={{ background:"var(--panel2)", border:"1px solid var(--border)", borderRadius:8, padding:"1rem", marginBottom:"1rem" }}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:"0.75rem" }}>
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:"0.65rem", color:"var(--text-dim)", textTransform:"uppercase", letterSpacing:"0.1em" }}>Dado</div>
              <div style={{ fontFamily:"'Cinzel',serif", fontSize:"1.3rem", fontWeight:700, color:"var(--text-bright)" }}>{item.dado}</div>
            </div>
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:"0.65rem", color:"var(--text-dim)", textTransform:"uppercase", letterSpacing:"0.1em" }}>Stat</div>
              <div style={{ fontFamily:"'Cinzel',serif", fontSize:"1.3rem", fontWeight:700, color:"var(--purple)" }}>{item.stat}</div>
            </div>
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:"0.65rem", color:"var(--text-dim)", textTransform:"uppercase", letterSpacing:"0.1em" }}>Gittata</div>
              <div style={{ fontFamily:"'Cinzel',serif", fontSize:"1.1rem", fontWeight:700, color:"var(--text-bright)" }}>{item.gittata}</div>
            </div>
          </div>
        </div>

        <div style={{ padding:"0.9rem 1.1rem", background:"var(--panel2)", border:"1px solid var(--gold)", borderRadius:6, marginBottom:"1rem" }}>
          <div style={{ fontFamily:"'Cinzel',serif", fontSize:"0.7rem", color:"var(--gold)", textTransform:"uppercase", letterSpacing:"0.12em", fontWeight:700, marginBottom:"0.4rem" }}>Proprietà</div>
          <p style={{ fontSize:"0.95rem", color:"var(--text-bright)", lineHeight:1.55 }}>{item.proprieta}</p>
        </div>

        {item.flavor && (
          <div style={{ padding:"0.9rem 1.1rem", background:"rgba(140,110,255,0.05)", borderLeft:"2px solid var(--purple)", borderRadius:4, marginBottom:"1rem" }}>
            <p style={{ fontSize:"0.88rem", color:"var(--text-dim)", fontStyle:"italic", lineHeight:1.6 }}>{item.flavor}</p>
          </div>
        )}

        <div style={{ display:"flex", justifyContent:"space-between", padding:"0.75rem 1rem", background:"var(--panel2)", borderRadius:6 }}>
          <span style={{ fontFamily:"'Cinzel',serif", fontSize:"0.75rem", color:"var(--text-dim)", textTransform:"uppercase", letterSpacing:"0.12em" }}>Prezzo</span>
          <span style={{ fontFamily:"'Cinzel',serif", fontSize:"1.2rem", fontWeight:700, color:"var(--gold)" }}>{item.prezzo}</span>
        </div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════
// TRACKER PA / PS
// ═══════════════════════════════════════════════════════
function TrackerPage() {
  const [personaggi, setPersonaggi] = useState(() => {
    try { const s = localStorage.getItem("arcadia_personaggi_v2"); return s ? JSON.parse(s) : []; } catch { return []; }
  });
  const [selected, setSelected]   = useState(null);
  const [showNew,  setShowNew]    = useState(false);
  const [newName,  setNewName]    = useState("");
  const [newClasse,setNewClasse]  = useState("");
  const [paInput,  setPaInput]    = useState("");
  const [psInputs, setPsInputs]   = useState({});

  useEffect(() => {
    try { localStorage.setItem("arcadia_personaggi_v2", JSON.stringify(personaggi)); } catch {}
  }, [personaggi]);

  useEffect(() => {
    if (selected) {
      const p = personaggi.find(p => p.id===selected);
      if (p) { const init = {}; p.skills?.forEach(sk => { init[sk.nome]=""; }); setPsInputs(init); }
    }
  }, [selected]);

  function createPersonaggio() {
    if (!newName.trim()) return;
    const classeData = CLASSI.find(c => c.nome===newClasse);
    const skills = classeData ? classeData.skills.map(s => ({nome:s.nome,ps:0})) : [];
    const np = { id:Date.now(), nome:newName.trim(), classe:newClasse||"—", pa:0, skills, createdAt:new Date().toISOString() };
    setPersonaggi(prev => [...prev,np]); setSelected(np.id);
    setNewName(""); setNewClasse(""); setShowNew(false);
  }

  function deletePersonaggio(id) {
    if (!confirm("Eliminare questo personaggio?")) return;
    setPersonaggi(prev => prev.filter(p => p.id!==id));
    if (selected===id) setSelected(null);
  }

  function addPA(id) {
    const val = parseInt(paInput);
    if (isNaN(val)||val===0) return;
    setPersonaggi(prev => prev.map(p => p.id===id ? {...p,pa:Math.max(0,p.pa+val)} : p));
    setPaInput("");
  }

  function addPS(pgId, skillNome) {
    const val = parseInt(psInputs[skillNome]);
    if (isNaN(val)||val===0) return;
    setPersonaggi(prev => prev.map(p => {
      if (p.id!==pgId) return p;
      return {...p, skills:p.skills.map(sk => sk.nome===skillNome ? {...sk,ps:Math.max(0,sk.ps+val)} : sk)};
    }));
    setPsInputs(prev => ({...prev,[skillNome]:""}));
  }

  function getSkillLv(ps) {
    const soglie=[0,20,70,170,370]; let lv=1;
    for (let i=soglie.length-1;i>=0;i--) { if(ps>=soglie[i]){lv=i+1;break;} }
    return lv;
  }

  const pg = selected ? personaggi.find(p => p.id===selected) : null;
  const rank = pg ? getRankFromPA(pg.pa) : null;
  const nextRankPA = pg ? getNextRankPA(rank) : null;

  return (
    <div className="anim-fade-in">
      <div style={{ marginBottom:"2rem" }}>
        <div className="section-title">Progressione</div>
        <div className="page-title">Tracker PA & PS</div>
        <p className="page-subtitle">Tieni traccia dei Punti Avanzamento (Rank) e Punti Sogno (Skill). I dati vengono salvati automaticamente.</p>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"280px 1fr", gap:"1.5rem", alignItems:"start" }}>
        {/* Sidebar */}
        <div style={{ background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:10, overflow:"hidden" }}>
          <div style={{ padding:"0.9rem 1.2rem", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div style={{ fontFamily:"'Cinzel',serif", fontSize:"0.8rem", fontWeight:700, color:"var(--text-dim)", letterSpacing:"0.1em", textTransform:"uppercase" }}>Personaggi ({personaggi.length})</div>
            <button className="btn btn-primary" style={{ fontSize:"0.72rem", padding:"0.3rem 0.7rem" }} onClick={() => setShowNew(true)}>+ Nuovo</button>
          </div>
          {showNew && (
            <div style={{ padding:"1rem", borderBottom:"1px solid var(--border)", background:"rgba(140,110,255,0.04)" }}>
              <input className="input-field" placeholder="Nome personaggio" value={newName} onChange={e => setNewName(e.target.value)} style={{ marginBottom:"0.5rem", fontSize:"0.85rem" }} />
              <select className="input-field" value={newClasse} onChange={e => setNewClasse(e.target.value)} style={{ marginBottom:"0.5rem", fontSize:"0.85rem" }}>
                <option value="">Classe (opzionale)</option>
                {CLASSI.map(c => <option key={c.nome} value={c.nome}>{c.icon} {c.nome}</option>)}
              </select>
              <div style={{ display:"flex", gap:"0.5rem" }}>
                <button className="btn btn-primary" style={{ flex:1, fontSize:"0.78rem" }} onClick={createPersonaggio}>Crea</button>
                <button className="btn btn-outline" style={{ fontSize:"0.78rem" }} onClick={() => setShowNew(false)}>✕</button>
              </div>
            </div>
          )}
          {personaggi.length===0 ? (
            <div style={{ padding:"2rem", textAlign:"center", color:"var(--text-dim)", fontSize:"0.85rem" }}>
              <div style={{ fontSize:"2rem", marginBottom:"0.5rem" }}>⚔️</div>
              Nessun personaggio ancora.
            </div>
          ) : (
            <div>
              {personaggi.map(p => {
                const r = getRankFromPA(p.pa);
                const isSelected = p.id===selected;
                const classeData = CLASSI.find(c => c.nome===p.classe);
                return (
                  <div key={p.id} onClick={() => setSelected(p.id)} style={{
                    padding:"0.8rem 1.2rem", borderBottom:"1px solid rgba(140,110,255,0.06)",
                    cursor:"pointer",
                    background: isSelected?"rgba(140,110,255,0.08)":"transparent",
                    borderLeft: isSelected?"3px solid var(--purple)":"3px solid transparent",
                    transition:"all 0.15s",
                    position:"relative",
                  }}>
                    {/* Mini immagine categoria nella sidebar */}
                    {classeData && (
                      <div style={{
                        position:"absolute", top:0, right:0, bottom:0, width:40,
                        overflow:"hidden", opacity:0.15,
                      }}>
                        <CatImage catId={classeData.cat} style={{ width:"100%", height:"100%" }} />
                      </div>
                    )}
                    <div style={{ position:"relative", zIndex:1 }}>
                      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                        <div style={{ fontFamily:"'Cinzel',serif", fontWeight:700, color:isSelected?"var(--text-bright)":"var(--text)", fontSize:"0.88rem" }}>{p.nome}</div>
                        <RankBadge rank={r} size="sm" />
                      </div>
                      <div style={{ fontSize:"0.72rem", color:"var(--text-dim)", marginTop:"0.15rem" }}>{p.classe}</div>
                      <div style={{ marginTop:"0.4rem" }}>
                        <ProgressBar value={p.pa-RANK_PA[r]} max={(getNextRankPA(r)||RANK_PA[r]+1)-RANK_PA[r]} color={getRankColor(r)} height={3} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Dettaglio */}
        {pg ? (
          <div className="anim-fade-in">
            {/* Header con immagine categoria */}
            <div style={{ background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:10, overflow:"hidden", marginBottom:"1rem" }}>
              {(() => {
                const classeData = CLASSI.find(c => c.nome===pg.classe);
                return classeData ? (
                  <div style={{ position:"relative", height:100 }}>
                    <CatImage catId={classeData.cat} style={{ position:"absolute", inset:0, width:"100%", height:"100%" }} />
                    <div style={{ position:"absolute", inset:0, zIndex:2, padding:"1rem 1.5rem", display:"flex", alignItems:"flex-end", justifyContent:"space-between" }}>
                      <div>
                        <div style={{ fontFamily:"'Cinzel Decorative',serif", fontSize:"1.3rem", fontWeight:700, color:"white", textShadow:"0 2px 8px rgba(0,0,0,0.8)" }}>{pg.nome}</div>
                        <div style={{ color:"rgba(255,255,255,0.7)", fontSize:"0.82rem" }}>{pg.classe}</div>
                      </div>
                      <div style={{ display:"flex", gap:"0.5rem", alignItems:"center" }}>
                        <RankBadge rank={rank} size="lg" />
                        <button className="btn btn-danger" style={{ fontSize:"0.72rem", padding:"0.3rem 0.7rem" }} onClick={() => deletePersonaggio(pg.id)}>Elimina</button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding:"1.5rem", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <div>
                      <div style={{ fontFamily:"'Cinzel Decorative',serif", fontSize:"1.3rem", fontWeight:700, color:"var(--text-bright)" }}>{pg.nome}</div>
                      <div style={{ color:"var(--text-dim)", fontSize:"0.82rem" }}>{pg.classe}</div>
                    </div>
                    <div style={{ display:"flex", gap:"0.5rem" }}>
                      <RankBadge rank={rank} size="lg" />
                      <button className="btn btn-danger" style={{ fontSize:"0.72rem", padding:"0.3rem 0.7rem" }} onClick={() => deletePersonaggio(pg.id)}>Elimina</button>
                    </div>
                  </div>
                );
              })()}

              <div style={{ padding:"1.5rem" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"0.6rem" }}>
                  <div>
                    <span className="section-title" style={{ display:"inline" }}>PA Totali: </span>
                    <span style={{ fontFamily:"'Cinzel',serif", fontWeight:900, fontSize:"1.5rem", color:"var(--gold)", marginLeft:"0.5rem" }}>{pg.pa.toLocaleString()}</span>
                  </div>
                  <div style={{ textAlign:"right", fontSize:"0.78rem", color:"var(--text-dim)" }}>
                    {nextRankPA ? (
                      <>Prossimo: Rank {RANKS[RANKS.indexOf(rank)+1]} — {nextRankPA.toLocaleString()} PA<br/>
                      <span style={{ color:"var(--gold)" }}>Mancano: {(nextRankPA-pg.pa).toLocaleString()} PA</span></>
                    ) : <span style={{ color:"var(--gold)" }}>Rank Massimo</span>}
                  </div>
                </div>
                <ProgressBar value={pg.pa-RANK_PA[rank]} max={(nextRankPA||RANK_PA[rank]+1)-RANK_PA[rank]} color={getRankColor(rank)} height={8} />
                <div style={{ display:"flex", justifyContent:"space-between", marginTop:"0.3rem", fontSize:"0.68rem", color:"var(--text-dim)" }}>
                  <span>Rank {rank} — {RANK_PA[rank]} PA</span>
                  {nextRankPA && <span>Rank {RANKS[RANKS.indexOf(rank)+1]} — {nextRankPA} PA</span>}
                </div>
                <div style={{ marginTop:"1rem", display:"flex", gap:"0.75rem", alignItems:"center", flexWrap:"wrap" }}>
                  <input className="input-field" type="number" placeholder="PA da aggiungere (es: 50 o -10)" value={paInput}
                    onChange={e => setPaInput(e.target.value)} onKeyDown={e => e.key==="Enter"&&addPA(pg.id)}
                    style={{ maxWidth:300, fontSize:"0.88rem" }} />
                  <button className="btn btn-gold" onClick={() => addPA(pg.id)}>Aggiorna PA</button>
                </div>
                <div style={{ marginTop:"1rem", display:"flex", gap:"0.4rem", flexWrap:"wrap" }}>
                  {RANKS.map(r => {
                    const col = getRankColor(r);
                    const achieved = pg.pa>=RANK_PA[r];
                    const isCurrent = r===rank;
                    return (
                      <div key={r} style={{
                        padding:"0.3rem 0.7rem", borderRadius:4, fontSize:"0.7rem",
                        border:`1px solid ${achieved?col+"60":"rgba(140,110,255,0.1)"}`,
                        background: isCurrent?`${col}18`:achieved?`${col}08`:"transparent",
                        color: achieved?col:"var(--text-dim)",
                        fontFamily:"'Cinzel',serif", fontWeight:700, opacity:achieved?1:0.4, position:"relative",
                      }}>
                        {r}
                        {isCurrent && <span style={{ position:"absolute", top:-6, right:-3, width:6, height:6, borderRadius:"50%", background:col, boxShadow:`0 0 6px ${col}` }} />}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* PS Skills */}
            <div style={{ background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:10, overflow:"hidden" }}>
              <div style={{ padding:"1rem 1.5rem", borderBottom:"1px solid var(--border)" }}>
                <div className="section-title">PS Skill — Punti Sogno</div>
                <p style={{ fontSize:"0.78rem", color:"var(--text-dim)", marginTop:"0.25rem" }}>I PS si accumulano usando le Skill. Aggiungi i PS guadagnati durante le sessioni.</p>
              </div>
              {pg.skills && pg.skills.length>0 ? (
                <div>
                  {pg.skills.map(sk => {
                    const lv = getSkillLv(sk.ps);
                    const soglie = [0,20,70,170,370];
                    const nextSoglia = lv<5 ? soglie[lv] : null;
                    const sklColors = ["","var(--text-dim)","var(--purple)","var(--flux)","var(--gold)","var(--gold-bright)"];
                    return (
                      <div key={sk.nome} style={{ padding:"1.1rem 1.5rem", borderBottom:"1px solid rgba(140,110,255,0.06)" }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"0.5rem", gap:"1rem", flexWrap:"wrap" }}>
                          <div>
                            <div style={{ fontFamily:"'Cinzel',serif", fontWeight:700, color:"var(--text-bright)", fontSize:"0.88rem" }}>{sk.nome}</div>
                            <div style={{ display:"flex", gap:"0.5rem", alignItems:"center", marginTop:"0.2rem" }}>
                              <span style={{ fontFamily:"'Cinzel',serif", fontWeight:700, fontSize:"0.8rem", color:sklColors[lv] }}>Lv {lv}</span>
                              {lv<5 && <span style={{ fontSize:"0.72rem", color:"var(--text-dim)" }}>{sk.ps} / {nextSoglia} PS</span>}
                              {lv===5 && <span style={{ fontSize:"0.72rem", color:"var(--gold)" }}>✦ FORMA FINALE</span>}
                            </div>
                          </div>
                          <div style={{ display:"flex", gap:"0.5rem", alignItems:"center" }}>
                            <input className="input-field" type="number" placeholder="+PS"
                              value={psInputs[sk.nome]||""}
                              onChange={e => setPsInputs(prev => ({...prev,[sk.nome]:e.target.value}))}
                              onKeyDown={e => e.key==="Enter"&&addPS(pg.id,sk.nome)}
                              style={{ width:90, fontSize:"0.85rem", padding:"0.4rem 0.6rem" }} />
                            <button className="btn btn-outline" style={{ fontSize:"0.78rem", padding:"0.4rem 0.7rem" }} onClick={() => addPS(pg.id,sk.nome)}>+</button>
                          </div>
                        </div>
                        <ProgressBar
                          value={sk.ps-(lv>=5?370:soglie[lv-1])}
                          max={lv>=5?1:soglie[lv]-soglie[lv-1]}
                          color={sklColors[lv]} height={5} />
                        <div style={{ display:"flex", gap:"0.25rem", marginTop:"0.4rem" }}>
                          {[1,2,3,4,5].map(l => (
                            <div key={l} style={{
                              height:4, flex:1, borderRadius:2,
                              background: sk.ps>=soglie[l-1]?sklColors[l]:"rgba(140,110,255,0.1)",
                              transition:"background 0.3s",
                            }} />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ padding:"2rem", textAlign:"center", color:"var(--text-dim)", fontSize:"0.85rem" }}>
                  Nessuna Skill registrata. Crea il personaggio dal Generatore per aggiungere le Skill automaticamente.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"4rem", color:"var(--text-dim)", textAlign:"center" }}>
            <div style={{ fontSize:"3rem", marginBottom:"1rem", animation:"float 4s ease-in-out infinite" }}>📊</div>
            <div style={{ fontFamily:"'Cinzel',serif", color:"var(--text)", marginBottom:"0.5rem" }}>Seleziona un personaggio</div>
            <p style={{ fontSize:"0.85rem", maxWidth:280 }}>Scegli dalla lista o creane uno nuovo per iniziare a tracciare PA e PS.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// APP ROOT
// ═══════════════════════════════════════════════════════
export default function App() {
  const [page, setPage] = useState("home");

  const navItems = [
    {id:"home",      label:"Home"},
    {id:"wiki",      label:"Wiki"},
    {id:"compendio", label:"Compendio"},
    {id:"generator", label:"Genera PG"},
    {id:"scheda",    label:"Scheda"},
    {id:"tracker",   label:"Tracker"},
  ];

  const PageComponent = {
    home:      () => <HomePage setPage={setPage} />,
    wiki:      () => <WikiPage />,
    compendio: () => <CompendioPage />,
    generator: () => <GeneratorePage />,
    scheda:    () => <SchedaGiocabile />,
    tracker:   () => <TrackerPage />,
  }[page] || (() => <HomePage setPage={setPage} />);

  return (
    <>
      <GlobalStyles />
      <div id="app-root">
        {/* Particelle Flusso — sempre visibili, su tutto il sito */}
        <FluxParticles />

        <div className="app-content">
          <nav className="navbar">
            {/* Logo: prima prova immagine, poi fallback testo */}
            <div style={{ display:"flex", alignItems:"center", gap:"0.75rem", cursor:"pointer" }} onClick={() => setPage("home")}>
              <img
                src="/logo.png"
                alt=""
                className="navbar-logo-img"
                onError={e => { e.target.style.display="none"; }}
              />
              <div className="navbar-logo">ARCADIA2099</div>
            </div>

            <div className="navbar-divider" />

            <div className="navbar-nav">
              {navItems.map(n => (
                <button key={n.id} className={`nav-btn ${page===n.id?"active":""}`} onClick={() => setPage(n.id)}>
                  {n.label}
                </button>
              ))}
            </div>
          </nav>

          <div className="page">
            <PageComponent />
          </div>
        </div>
      </div>
    </>
  );
}
