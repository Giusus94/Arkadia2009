import { useState, useEffect, useRef, useCallback } from "react";

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
const CAT_GLOW = {1:"#e74c3c",2:"#95a5a6",3:"#8e7df5",4:"#3498db",5:"#f39c12",6:"#2ecc71"};

const CATEGORIE = [
  {id:1,nome:"Forza e Acciaio",desc:"Combattenti che dominano il corpo a corpo con potenza bruta"},
  {id:2,nome:"Velocità e Ombra",desc:"Combattenti agili che sfruttano posizionamento e velocità"},
  {id:3,nome:"Flusso e Magia",desc:"Manipolatori del Flusso che attaccano con energia arcana"},
  {id:4,nome:"Resistenza e Mura",desc:"Tank e difensori che assorbono danni e proteggono gli alleati"},
  {id:5,nome:"Percezione e Legami",desc:"Supporto, tracker e domatori che usano la PER come arma"},
  {id:6,nome:"Caos e Sacrificio",desc:"Classi ibride con meccaniche uniche che sfidano le regole"},
];

const CLASSI = [
  {cat:1,pos:1,nome:"Guerriero Hardcore",flavor:"Impara da ogni battaglia",icon:"⚔️",FOR:15,AGI:12,RES:13,INT:8,PER:10,CAR:8,hp:62,fl:22,dif:11,vel:6,dado:"1d10",
   desc:"La classe più adattabile. Osservando i nemici in combattimento può tentare di acquisire le loro tecniche. Nessun limite di Skill acquisibili.",
   skills:[{nome:"Lama dell'Ego",costo:"2",desc:"Attacco FOR. Danno 2d8+2. Se supera Difesa di 5+: Rottura Armatura (–2 Difesa, 2 turni).",lv2:"+1d danno o –1 costo Flusso",lv3:"Ignora 50% bonus armatura",lv4:"Danno 3d10+2, Rottura dura 3t",lv5:"FINALE: colpisce sempre, 4d8+2, Rottura permanente"},
    {nome:"Tempesta di Lame",costo:"4",desc:"Colpisce TUTTI i nemici in portata ravvicinata. FOR separato. Danno 1d8+2.",lv2:"2d8+2 ciascuno",lv3:"Portata 4m",lv4:"2d10+2 + Rallentato 1t",lv5:"FINALE: no tiro vs già colpiti, 3d8+2"},
    {nome:"Sfida del Guerriero",costo:"1+✦",desc:"Bersaglio: Svantaggio vs altri 2t. Tu: +1 Difesa vs lui.",lv2:"Dura 3t, costo ✦ rimosso",lv3:"–1 danni bersaglio attivo",lv4:"2 bersagli (2 Flusso)",lv5:"FINALE: bersaglio DEVE attaccare te. Se attacca altri: 1d6 automatici"}]},

  {cat:1,pos:2,nome:"Berserker",flavor:"Potenza pura — massimo danno",icon:"🔥",FOR:16,AGI:10,RES:14,INT:8,PER:8,CAR:8,hp:68,fl:16,dif:10,vel:5,dado:"1d12",
   desc:"Il Berserker non difende — travolge. Dado vita 1d12, danno più alto del gioco. Il prezzo è la Difesa bassa e l'Esausto post-Frenesia.",
   skills:[{nome:"Colpo Selvaggio",costo:"0",desc:"Attacco FOR. Danno 1d12+3. Manca di 1-3: 1d6 da pressione. No Schivata stessa turno.",lv2:"2d10+3",lv3:"Pressione sale a 1d8",lv4:"2d12+3. Critico: vola 3m (Prono)",lv5:"FINALE: colpisce sempre (tiro solo per critico), 3d10+3"},
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
   desc:"La classe più consistente del gioco. Nessun punto debole grave, nessun vantaggio estremo. Ideale per chi vuole essere efficace senza rischi meccanici.",
   skills:[{nome:"Freccia Perforante",costo:"2",desc:"Attacco AGI a distanza. Danno 1d8+2. Ignora 50% bonus armatura.",lv2:"2d6+2",lv3:"Ignora 100% armatura (penetrazione totale)",lv4:"Portata doppia, 2d8+2",lv5:"FINALE: colpisce 2 bersagli in linea retta"},
    {nome:"Colpo Doppio",costo:"3",desc:"2 attacchi: 1d20+2, danno 1d6+2. Il 2° ha –2 al tiro.",lv2:"2° senza penalità",lv3:"Colpo Triplo (3° ha –1)",lv4:"Vantaggio su tutti e 3 se bersaglio marcato",lv5:"FINALE: Colpo Quadruplo. Critico aggiunge attacco bonus (max 2)"},
    {nome:"Marcatura",costo:"1",desc:"A.Bonus. Bersaglio marcato: Vantaggio su tutti i tuoi attacchi 3t.",lv2:"Dura 5t",lv3:"Tutti gli alleati hanno Vantaggio vs marcato",lv4:"2 bersagli simultanei",lv5:"FINALE: permanente per lo scontro, costo 0"}]},

  {cat:2,pos:3,nome:"Danzatore di Lame",flavor:"Ogni schivata genera il prossimo attacco",icon:"💫",FOR:12,AGI:15,RES:10,INT:10,PER:8,CAR:11,hp:49,fl:30,dif:12,vel:7,dado:"1d8",
   desc:"Trasforma la difesa in attacco. Schivare non è perdere un turno — è preparare il successivo. Il ritmo è unico: più il nemico manca, più si mette in pericolo.",
   skills:[{nome:"Passo del Vento",costo:"2",desc:"Reazione quando colpito: AGI DC 13. Successo: schivi. Se schivi: Vantaggio prossimo attacco.",lv2:"DC scende a 11",lv3:"Schivata: +2 danni prossimo attacco",lv4:"Costo 1",lv5:"FINALE: gratuito (0). 2 schivate consecutive → prossimo attacco critico auto"},
    {nome:"Danza delle Lame",costo:"4",desc:"4 attacchi rapidi: 1d4+2. Ogni colpo riduce costo Flusso prossimo di 1.",lv2:"5 attacchi, 1d6+2",lv3:"Tutti a segno: bersaglio Stordito 1t",lv4:"Costo 3",lv5:"FINALE: 6 attacchi, 1d8+2. 1° critico → tutti lo sono"},
    {nome:"Contrattacco Fluido",costo:"0",desc:"Passivo. Nemico ti manca: contrattacca (1d6+2, no tiro). 1/round.",lv2:"1d8+2",lv3:"Applica anche Sanguinante",lv4:"2/round",lv5:"FINALE: attivo anche quando alleati entro 3m vengono mancati"}]},

  {cat:2,pos:4,nome:"Ombra del Vento",flavor:"Mobile e inafferrabile",icon:"🌑",FOR:8,AGI:16,RES:10,INT:12,PER:10,CAR:10,hp:55,fl:42,dif:13,vel:8,dado:"1d6",
   desc:"La più mobile del gioco. Combina la velocità dell'Assassino con la flessibilità magica. Il dado vita d6 è fragile — va eliminato prima di essere colpito.",
   skills:[{nome:"Passo Dimensionale",costo:"2",desc:"A.Bonus. Teletrasporto a punto visibile entro 8m. +2 danni prossimo attacco.",lv2:"Portata 12m, +3 danni",lv3:"Trascina un alleato adiacente",lv4:"2/turno",lv5:"FINALE: gratuito, portata illimitata"},
    {nome:"Lama d'Ombra",costo:"3",desc:"Attacco AGI. 1d6+3 + 1d6 oscuro (ignora armatura). Dopo Passo: oscuro x2.",lv2:"2d6+3 fisico",lv3:"Oscuro 2d6",lv4:"Dopo Passo: oscuro x3",lv5:"FINALE: a cono (3m). Tutti i bersagli subiscono danno completo"},
    {nome:"Velo d'Ombra",costo:"2",desc:"A.Bonus. Campo oscuro 3m 2t: Svantaggio su attacchi verso di te.",lv2:"Campo 5m",lv3:"Dura 3t + Rallentato chi entra",lv4:"Si sposta con te",lv5:"FINALE: invisibile. Ti dà stealth mentre sei al suo interno"}]},

  {cat:3,pos:1,nome:"Mago del Caos",flavor:"Distrugge aree — fragile come cristallo",icon:"⚡",FOR:8,AGI:12,RES:9,INT:16,PER:12,CAR:9,hp:50,fl:56,dif:11,vel:6,dado:"1d6",
   desc:"Il Flusso più alto del gioco (56 al Rank F, 160 al Rank SSS). Può mantenere Nova Oscura per molti round. Il problema è la RES 9: senza lo Scudo Arcano, due colpi fisici lo mettono fuori.",
   skills:[{nome:"Nova Oscura",costo:"5",desc:"Area 4m entro 20m. AGI DC 13. Fallimento: 3d6+3. Successo: metà.",lv2:"4d6+3",lv3:"Raggio 6m, DC 14",lv4:"Tipo danno a scelta (fuoco/fulmine/forza/freddo)",lv5:"FINALE: colpisce TUTTI i nemici visibili entro 20m. No tiro. 4d8+3"},
    {nome:"Sigillo del Silenzio",costo:"3",desc:"INT vs RES DC 12. Pieno: no Skill 2t. Parziale: 1t.",lv2:"Pieno 3t, Parziale 2t",lv3:"Il Sigillo si trasferisce al prossimo bersaglio se il primo muore",lv4:"Costo 2",lv5:"FINALE: area 5m (tutti i nemici), 1t. Costo 6"},
    {nome:"Scudo Arcano",costo:"3",desc:"Reazione. Assorbe 1d8+3 danni. Se assorbe tutto: nessuna condizione.",lv2:"2d8+3",lv3:"Attivabile su alleato entro 6m",lv4:"3d6+3. Se assorbe tutto: 50% riflesso",lv5:"FINALE: sempre attivo (passivo), assorbe 1d6+3 da qualsiasi fonte"}]},

  {cat:3,pos:2,nome:"Evocatore di Sogni",flavor:"Combatte tramite creature create dal Flusso",icon:"🌀",FOR:8,AGI:10,RES:10,INT:15,PER:14,CAR:9,hp:53,fl:52,dif:10,vel:5,dado:"1d6",
   desc:"La forza cresce nel tempo. Al Rank F la Sentinella è modesta. Al Rank S, con 3 Sentinelle rinforzate e l'Esplosione di Evocazione, produce danni devastanti in area.",
   skills:[{nome:"Evoca Sentinella",costo:"4",desc:"Sentinella: HP 30, Attacco 1d6+2, Difesa 12. Dura 3t o fino a sconfitta. Max 1.",lv2:"HP 50, Attacco 2d6+2",lv3:"Max 2 attive",lv4:"HP 70, si interpone tra te e attacchi",lv5:"FINALE: nessuna durata. Max 3 attive"},
    {nome:"Esplosione di Evocazione",costo:"5",desc:"Ogni creatura evocata esplode area 3m: 2d6+2 (AGI DC 12 per metà). Svanisce.",lv2:"3d6+2",lv3:"Raggio 5m",lv4:"Creatura sostituita gratis dopo esplosione",lv5:"FINALE: scegli se svanisce o sopravvive. 4d6+2"},
    {nome:"Rinforzo Mistico",costo:"3",desc:"A.Bonus. Creatura evocata: +4 danni 2t. Prossima Reazione gratis.",lv2:"+6 danni",lv3:"+2 Difesa e +10 HP temporanei",lv4:"Dura 3t",lv5:"FINALE: gratuito, si applica automaticamente a tutte le creature attive"}]},

  {cat:3,pos:3,nome:"Negromante",flavor:"Si nutre dell'energia dei nemici",icon:"💀",FOR:10,AGI:10,RES:11,INT:15,PER:10,CAR:10,hp:58,fl:50,dif:10,vel:5,dado:"1d6",
   desc:"Più il combattimento dura, più il Negromante sta bene. Eccelle contro boss solitari con molti HP. Il Vincolo dell'Anima in forma finale è il drain più alto del gioco.",
   skills:[{nome:"Tocco Drenante",costo:"3",desc:"Attacco INT. Danno 1d6+2. Recuperi 50% HP dal danno. Bersaglio <30%: recuperi 100%.",lv2:"Soglia sale a <40%",lv3:"Drena anche 1 Flusso ogni 5 HP drenati",lv4:"2d6+2, soglia <50%",lv5:"FINALE: costo 0, usabile come A.Bonus"},
    {nome:"Maledizione di Debolezza",costo:"4",desc:"INT vs RES DC 12. Pieno: –3 a tutti i tiri 2t. Parziale: –2 prossimo tiro.",lv2:"Pieno –4 per 3t",lv3:"Si trasferisce al prossimo bersaglio se il primo muore",lv4:"Area 4m, –3 a tutti",lv5:"FINALE: permanente per lo scontro"},
    {nome:"Vincolo dell'Anima",costo:"5",desc:"Per 2t: ogni HP che perde il bersaglio, recuperi metà. Può spezzare (RES DC 15).",lv2:"3t",lv3:"Recuperi 75%, DC spezzare 17",lv4:"Bidirezionale: lui recupera 25% dei tuoi",lv5:"FINALE: non spezzabile. Recuperi 100%"}]},

  {cat:3,pos:4,nome:"Illusionista",flavor:"Vince senza fare danni",icon:"👁️",FOR:8,AGI:13,RES:9,INT:15,PER:11,CAR:10,hp:50,fl:52,dif:11,vel:6,dado:"1d6",
   desc:"La più difficile da giocare bene. Non fa quasi danni — toglie i turni ai nemici. Due turni rubati al boss nel momento critico valgono più di due round di attacchi.",
   skills:[{nome:"Doppio Illusorio",costo:"3",desc:"A.Bonus. 1 copia. Nemici: INT DC 13 per capire il vero bersaglio. Svanisce al 1° colpo.",lv2:"2 copie",lv3:"Copie si muovono autonomamente, DC 14",lv4:"Copie usano Skill base (condizioni, no danno reale)",lv5:"FINALE: copie hanno 15 HP ciascuna. Max 3 attive"},
    {nome:"Terrore Reale",costo:"4",desc:"INT vs INT DC 13. Pieno: Spaventato 2t + Svantaggio su tutto. Parziale: Spaventato 1t.",lv2:"Pieno 3t",lv3:"Area 5m, tiro separato per ciascuno",lv4:"DC 15, chi fallisce anche Paralizzato 1t",lv5:"FINALE: istantaneo, no tiro difensivo. Tutti i nemici visibili: Spaventati 2t"},
    {nome:"Labirinto Illusorio",costo:"6",desc:"Bersaglio salta turno intero (INT vs INT DC 14). Fallisce su immuni.",lv2:"Costo 5",lv3:"2 bersagli",lv4:"Bersaglio subisce 2d6 psichici all'uscita",lv5:"FINALE: dura 2 turni. Il bersaglio non ricorda nulla"}]},

  {cat:4,pos:1,nome:"Guardiano del Sogno",flavor:"HP massimi del gioco — il muro indistruttibile",icon:"🛡️",FOR:11,AGI:8,RES:16,INT:10,PER:13,CAR:8,hp:79,fl:28,dif:9,vel:4,dado:"1d12",
   desc:"91 HP al Rank C — il più resistente del gioco. Lo Scudo dell'Anima rende il gruppo quasi invincibile se giocato bene.",
   skills:[{nome:"Barriera Cristallina",costo:"3",desc:"Scudo su sé o alleato entro 8m. Assorbe RES×4 (base 64) HP. Dura fino a fine scontro.",lv2:"RES×5 (base 80)",lv3:"20% danni assorbiti riflessi all'attaccante",lv4:"2 scudi simultanei su bersagli diversi",lv5:"FINALE: si rigenera di 10 HP ogni round"},
    {nome:"Aura di Guarigione",costo:"3",desc:"Alleati entro 6m (non sé): 1d8+1 HP. Se sotto 50%: cura doppia.",lv2:"2d6+1, soglia 60%",lv3:"Rimuove una condizione a scelta",lv4:"Costo 2, cura anche sé stesso",lv5:"FINALE: persistente — 1d6+1 a inizio ogni suo turno a tutti entro 6m"},
    {nome:"Scudo dell'Anima",costo:"0",desc:"Passivo. Alleato entro 8m subisce danno: puoi riceverlo tu, dimezzato. Dichiara prima.",lv2:"Danno ridotto di ulteriori 3",lv3:"Portata 12m",lv4:"Puoi deviare su qualsiasi bersaglio entro portata",lv5:"FINALE: automatico su tutti i turni. Qualsiasi danno agli alleati automaticamente dimezzato"}]},

  {cat:4,pos:2,nome:"Campione di Pietra",flavor:"Assorbe i colpi e risponde con forza",icon:"🪨",FOR:12,AGI:8,RES:16,INT:8,PER:10,CAR:12,hp:77,fl:16,dif:9,vel:4,dado:"1d12",
   desc:"La versione offensiva del Guardiano. Meno supporto, più danni e controllo del campo. La Sfida in forma finale rende impossibile ignorarlo.",
   skills:[{nome:"Sfida del Campione",costo:"0+✦",desc:"A.Bonus. Bersaglio: Svantaggio vs altri 2t. Tu: +1 Difesa vs lui.",lv2:"Costo ✦ rimosso, costo 1 Flusso",lv3:"2 bersagli, penalità = impossibile attaccare altri",lv4:"+2 Difesa, dura 3t",lv5:"FINALE: attiva su TUTTI i nemici all'inizio scontro (passiva), costo 2"},
    {nome:"Scossa Sismica",costo:"4",desc:"Colpisci il terreno. Nemici entro 3m: RES DC 13. Fallimento: Proni + 1d6.",lv2:"2d6",lv3:"Raggio 5m, Prono → Immobilizzato 1t",lv4:"DC 15",lv5:"FINALE: crea fessura 3m. Chi attraversa: Prono automaticamente"},
    {nome:"Fortezza",costo:"3",desc:"Reazione. Dimezza un singolo attacco. Se danno dimezzato = 0: recuperi 3 HP.",lv2:"Danno 0 → recuperi 6 HP",lv3:"Costo 2",lv4:"Dimezza tutti gli attacchi 1 turno intero",lv5:"FINALE: passiva — dimezza automaticamente ogni attacco >20 danni"}]},

  {cat:4,pos:3,nome:"Monaco del Sogno",flavor:"Resistenza e velocità in un corpo solo",icon:"☯️",FOR:12,AGI:14,RES:13,INT:8,PER:11,CAR:8,hp:62,fl:20,dif:12,vel:7,dado:"1d10",
   desc:"Il tank che non si ferma. Eccellente nei combattimenti su più fronti. Il Vortice in forma finale è una delle Skill più devastanti del gioco in spazi affollati.",
   skills:[{nome:"Pugno del Fulmine",costo:"2",desc:"Attacco FOR. Danno 1d8+1. Se critico: bersaglio Stordito 1t.",lv2:"2d6+1",lv3:"Stordito anche senza critico se superi Difesa di 5+",lv4:"2d8+1",lv5:"FINALE: ogni Pugno accumula contatore (max 3). Al 3°: esplosione 3d8 area 3m"},
    {nome:"Vortice del Monaco",costo:"4",desc:"Muoviti 4m e attacca ogni nemico attraversato: 1d6+1. No attacchi di opportunità.",lv2:"6m, 2d4+1",lv3:"Ogni bersaglio: Rallentato 1t",lv4:"Percorso x2 (attacchi doppi)",lv5:"FINALE: nessun limite distanza. 2d6+1 per bersaglio. Ogni colpito: Prono"},
    {nome:"Meditazione in Battaglia",costo:"2",desc:"A.Bonus. 1/scontro: recupera 2d6+1 HP. Sotto 30%: 3d6+1.",lv2:"2/scontro",lv3:"Rimuove una condizione",lv4:"Sotto 30%: 4d8+1",lv5:"FINALE: illimitato, costo 1"}]},

  {cat:4,pos:4,nome:"Araldo della Fine",flavor:"Più è vicino alla morte, più è letale",icon:"💥",FOR:14,AGI:10,RES:14,INT:10,PER:8,CAR:10,hp:63,fl:26,dif:10,vel:5,dado:"1d10",
   desc:"La classe più drammatica del gioco. Sotto il 20% HP il danno raddoppia, Flusso a 0, quasi inarrestabile. Il rischio reale è arrivarci vivi.",
   skills:[{nome:"Sacrificio di Sangue",costo:"0*",desc:"*Costa HP. Spendi X HP (min 5): infliggi X×1.5 danni puri. Sotto 20% HP: X×2.5.",lv2:"Base X×2. Sotto 20%: X×3",lv3:"Può colpire area 3m",lv4:"Base X×2.5. Sotto 20%: X×4",lv5:"FINALE: costo HP /2. Sotto 20%: X×5"},
    {nome:"Rinascita nel Sangue",costo:"0 (1/scontro)",desc:"Reazione automatica a 0 HP. Sopravvivi con 1 HP. Nemici entro 4m: 2d6 (RES DC 13 Storditi).",lv2:"3d6",lv3:"Raggio 6m",lv4:"2/scontro",lv5:"FINALE: recuperi 20% HP massimi. Danno nemici: 4d8"},
    {nome:"Flagello del Moribondo",costo:"5",desc:"3 attacchi FOR: 1d10+2. Sotto 20% HP: ogni colpo +1d6.",lv2:"4 attacchi, 1d12+2",lv3:"Sotto 20%: +2d6",lv4:"Costo 4",lv5:"FINALE: 5 attacchi, 2d8+2. Sotto 20%: costo 0"}]},

  {cat:5,pos:1,nome:"Domatore di Anime",flavor:"La forza cresce con ogni mostro domato",icon:"🐉",FOR:10,AGI:11,RES:11,INT:12,PER:15,CAR:7,hp:49,fl:36,dif:10,vel:5,dado:"1d8",
   desc:"Debole al Rank F, potentissimo al Rank S. Ogni mostro domato è un moltiplicatore di forza permanente. Max compagni attivi = modificatore PER (min 1, max 5).",
   skills:[{nome:"Doma",costo:"0",desc:"Su bersaglio ≤25% HP. PER vs DC (8+Rank mostro). Pieno: permanente. Parziale: 1 scontro.",lv2:"Tentabile fino a 35% HP",lv3:"Tentabile fino a 45%, Parziale → 1 sessione",lv4:"Tentabile su qualsiasi bersaglio (DC +8)",lv5:"FINALE: istantanea (A.Bonus)"},
    {nome:"Ruggito del Branco",costo:"4",desc:"Tutti i compagni attivi entro 20m attaccano stesso bersaglio in sequenza. Ogni attacco: +1d4 cumulativo.",lv2:"+1d6 cumulativo",lv3:"Puoi designare bersagli diversi",lv4:"Costo 3",lv5:"FINALE: automatico ogni tuo turno, costo 2"},
    {nome:"Legame Empatico",costo:"2",desc:"A.Bonus. Vedi attraverso gli occhi di un compagno 1t. Il compagno: Vantaggio su tutto 2t.",lv2:"Comunicazione bidirezionale",lv3:"Vantaggio dura 3t, controllo diretto",lv4:"Condividi le tue Skill al compagno",lv5:"FINALE: permanente su tutti i compagni attivi simultaneamente"}]},

  {cat:5,pos:2,nome:"Veggente del Sogno",flavor:"Anticipa i pericoli e mantiene il gruppo in vita",icon:"🔮",FOR:8,AGI:10,RES:10,INT:13,PER:16,CAR:9,hp:43,fl:44,dif:10,vel:5,dado:"1d6",
   desc:"La classe di supporto più pura. HP bassi (43 al Rank F) — deve stare protetto. In cambio, mantiene il gruppo in piedi in situazioni che nessun'altra classe potrebbe gestire.",
   skills:[{nome:"Previsione del Colpo",costo:"2",desc:"Inizio round: designa 1 alleato. Se attaccato quel turno: +3 Difesa contro quell'attacco.",lv2:"2 alleati",lv3:"+4 Difesa",lv4:"Copre tutti gli attacchi del turno",lv5:"FINALE: si applica a tutti gli alleati, costo 0"},
    {nome:"Tocco Curativo Avanzato",costo:"4",desc:"Cura alleato entro 6m di 2d8+2 HP. Se già a piena salute: Scudo pari alla cura.",lv2:"3d6+2",lv3:"Rimuove una condizione",lv4:"Costo 3, portata 10m",lv5:"FINALE: cura tutti gli alleati visibili, 2d8+2 a ciascuno"},
    {nome:"Destino Condiviso",costo:"3+✦",desc:"A.Bonus. Per 2t, ogni Scintilla che un alleato spende conta doppio.",lv2:"Costo ✦ rimosso",lv3:"Conta triplo",lv4:"2 alleati simultanei",lv5:"FINALE: intero gruppo per 1t. Costo 6"}]},

  {cat:5,pos:3,nome:"Cacciatore di Anime",flavor:"Nessuno sfugge — nessuno si nasconde",icon:"🎭",FOR:12,AGI:13,RES:11,INT:10,PER:14,CAR:6,hp:48,fl:28,dif:11,vel:6,dado:"1d8",
   desc:"Specializzato contro un singolo bersaglio prioritario. La Caccia Finale è uno dei danni singoli più alti del gioco. Eccelle in campagne con boss fuggitivi.",
   skills:[{nome:"Tracciamento Arcano",costo:"1",desc:"A.Bonus. Marca bersaglio. Per tutta la sessione: posizione entro 100m. Vantaggio per inseguire.",lv2:"2 bersagli simultanei",lv3:"Portata 1km, stato approssimativo noto",lv4:"Marca permanente (tutta la campagna)",lv5:"FINALE: passivo — ogni creatura che ti ha visto o attaccato è automaticamente marcata"},
    {nome:"Colpo di Arresto",costo:"3",desc:"Attacco PER. Danno 1d8+2. Se colpisce: Rallentato 2t (vel /2, –1 azione).",lv2:"Rallentato più severo: vel /3",lv3:"Aggiunge Sanguinante",lv4:"2d6+2, cono",lv5:"FINALE: su bersaglio marcato → Immobilizzato invece di Rallentato"},
    {nome:"Caccia Finale",costo:"5",desc:"Solo su bersaglio marcato. Danno 3d8+2, ignora 50% armatura. Sotto 40% HP: x1.5.",lv2:"4d8+2",lv3:"Ignora 100% armatura",lv4:"Soglia sale a 50% HP",lv5:"FINALE: se uccide → +3 Scintille e Tracciamento si azzera"}]},

  {cat:5,pos:4,nome:"Cercatore del Sogno",flavor:"Conosce il terreno prima ancora di entrarci",icon:"🗺️",FOR:10,AGI:12,RES:11,INT:11,PER:15,CAR:7,hp:56,fl:34,dif:11,vel:6,dado:"1d8",
   desc:"La classe con più vantaggi fuori dal combattimento. La conoscenza del terreno si traduce in danno e controllo precisi.",
   skills:[{nome:"Lettura del Campo",costo:"1",desc:"A.Bonus. Rileva trappole entro 10m, creature invisibili, uscite, coperture. Alleati: +1 Init. prossimo round.",lv2:"Portata 15m, +2 Iniziativa",lv3:"Rivela Skill già usate dai nemici",lv4:"Auto-aggiornamento ogni round",lv5:"FINALE: sempre attiva (passiva)"},
    {nome:"Colpo del Conoscitore",costo:"2",desc:"Attacco PER. Danno 1d8+2. Conosce la debolezza: x1.5 + applica debolezza.",lv2:"2d6+2",lv3:"x2 invece di x1.5",lv4:"Scopre debolezza al momento del colpo (no conoscenza previa)",lv5:"FINALE: ignora sempre tutta l'armatura"},
    {nome:"Trappola del Sogno",costo:"3",desc:"Piazza trappola entro 4m. Prima creatura: scegli Immobilizzato (2t), Spaventato (1t+Svantaggio), o Stordito (1t).",lv2:"2 trappole per attivazione",lv3:"Area 2m (più creature)",lv4:"Invisibile anche a sensi soprannaturali",lv5:"FINALE: combina 2 effetti + 2d6 bonus"}]},

  {cat:6,pos:1,nome:"Cavaliere Oscuro",flavor:"Ogni colpo porta un'eco di Flusso oscuro",icon:"🌑",FOR:13,AGI:10,RES:13,INT:12,PER:8,CAR:10,hp:60,fl:36,dif:10,vel:5,dado:"1d10",
   desc:"L'ibrido per eccellenza. Non eccelle nel danno puro né nel controllo, ma debilita i nemici mentre si sostiene. La Corruzione accumulata svuota il Flusso dei nemici.",
   skills:[{nome:"Lama Corrotta",costo:"3",desc:"Attacco FOR. 1d8+1 + 1d6 oscuro (ignora armatura). Corruzione: prossima Skill nemica +2 Flusso.",lv2:"2d6+1 fisico, 2d6 oscuro",lv3:"Corruzione max 2 stack",lv4:"2d8+1, oscuro 3d6",lv5:"FINALE: Corruzione senza limite stack, si applica a tutti i colpiti"},
    {nome:"Aura di Tenebra",costo:"4",desc:"A.Bonus. Aura 3m 2t: nemici –2 a tutti i tiri, alleati +1 danni oscuri. Immune.",lv2:"Raggio 5m",lv3:"Malus –3",lv4:"Dura 3t",lv5:"FINALE: sempre attiva, costo 2 a inizio scontro"},
    {nome:"Drenaggio Oscuro",costo:"3",desc:"Attacco INT. Drena 1d8+1 Flusso (o HP se esaurito). Recuperi metà del drenato.",lv2:"2d6+1",lv3:"Recuperi 100% del drenato",lv4:"Può drenare Scintille (1 ✦ = 5 Flusso)",lv5:"FINALE: A.Bonus invece di Azione, costo 2"}]},

  {cat:6,pos:2,nome:"Bardo del Sogno",flavor:"Trasforma il gruppo in qualcosa di superiore",icon:"🎵",FOR:10,AGI:12,RES:10,INT:12,PER:10,CAR:16,hp:51,fl:38,dif:11,vel:6,dado:"1d8",
   desc:"Non è forte da solo. In gruppo è un moltiplicatore. Il Canto in forma finale + Ballata sul DPS principale è la combinazione offensiva più alta del gioco in DPR totale.",
   skills:[{nome:"Canto di Battaglia",costo:"3",desc:"Azione. Alleati entro 8m: +1d4 danni 2t. Tu non attacchi mentre canti.",lv2:"+1d6",lv3:"Raggio 12m",lv4:"+1d8, costo 2",lv5:"FINALE: sempre attivo (passivo), costo 2 a inizio scontro, +1d6 permanente"},
    {nome:"Nota Dissonante",costo:"2",desc:"CAR vs INT DC 12. Pieno: Svantaggio su tutto 1t + 1d6 sonici. Parziale: Svantaggio.",lv2:"Pieno 2t + 2d6",lv3:"Area 4m, tiro separato per ciascuno",lv4:"DC 14 + Rallentato",lv5:"FINALE: no tiro difensivo. Tutti nemici entro 6m subiscono automaticamente"},
    {nome:"Ballata Ispiratrice",costo:"4+✦",desc:"A.Bonus. Un alleato: Vantaggio su TUTTI i tiri nel suo prossimo turno intero.",lv2:"Costo ✦ rimosso",lv3:"Dura 2 turni",lv4:"Costo 3",lv5:"FINALE: tutti gli alleati simultaneamente per 1t. Costo 6"}]},

  {cat:6,pos:3,nome:"Sciamano",flavor:"Controlla il campo con le forze naturali",icon:"🌊",FOR:10,AGI:10,RES:12,INT:13,PER:13,CAR:8,hp:59,fl:42,dif:10,vel:5,dado:"1d8",
   desc:"Lo Sciamano non ha un ruolo fisso — è tutto nello stesso corpo. Danno, controllo, supporto. Non il migliore in nessuna delle tre, ma l'unico a coprirle tutte.",
   skills:[{nome:"Fulmine dello Sciamano",costo:"4",desc:"Catena automatica: 2d6+1 al primo, salta al più vicino (1d6+1), poi ancora (1d4+1). No tiro.",lv2:"Catena 4 salti",lv3:"2° e 3° salto = 2d6+1",lv4:"Tutti i salti 3d6+1",lv5:"FINALE: catena illimitata. 2d8+1 per salto"},
    {nome:"Radici di Pietra",costo:"3",desc:"Bersaglio entro 12m. PER vs AGI DC 13. Pieno: Immobilizzato 1t. Parziale: Rallentato.",lv2:"Immobilizzato 2t",lv3:"Area 4m",lv4:"DC 15, radici fanno 1d6/turno",lv5:"FINALE: durata a discrezione Sciamano. 2d6/turno"},
    {nome:"Totem Curativo",costo:"3",desc:"Piazza totem entro 6m (HP 10). Ogni turno: 1d4+1 HP all'alleato più vicino entro 4m. Dura 3t.",lv2:"HP 20, 1d6+1",lv3:"Cura tutti gli alleati entro 4m",lv4:"Totem si sposta (tua A.Bonus)",lv5:"FINALE: 2 totem, 2d4+1 HP a tutti entro 4m ogni turno"}]},

  {cat:6,pos:4,nome:"Maestro del Tempo",flavor:"Chi controlla il ritmo controlla tutto",icon:"⏳",FOR:8,AGI:14,RES:10,INT:14,PER:10,CAR:10,hp:53,fl:48,dif:12,vel:7,dado:"1d6",
   desc:"Una delle classi più complesse ma più potenti. Rubare un turno al nemico con Bolla Temporale nel momento giusto può ribaltare qualsiasi scontro.",
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
  {gruppo:2,pos:5,nome:"Frammento dell'Onda d'Impatto",fonte:"Eco della Guerra del Codice",flavor:"Ogni colpo risuonava su più piani. Un eco di quella risonanza persiste.",mec_breve:"Passivo. Ogni tuo attacco a segno: 2 danni automatici a ogni nemico entro 2m.",mec:"Passivo. Ogni volta che un tuo attacco colpisce, tutti gli altri nemici entro 2 metri dal bersaglio subiscono automaticamente 2 danni non riducibili. Non si applica ad attacchi già di area."},
  {gruppo:2,pos:6,nome:"Frammento della Dissonanza",fonte:"Eco del Secondo Pandora",flavor:"Le magie fallivano con frequenza crescente. Un eco imprevedibile persiste.",mec_breve:"Condizioni che applichi: +1 turno. Applicarne 2+ nello stesso turno: +1 Scintilla.",mec:"Due effetti: ogni condizione che applichi ha durata +1 turno; se applichi 2+ condizioni distinte allo stesso bersaglio nello stesso turno, guadagni immediatamente 1 Scintilla."},
  {gruppo:3,pos:1,nome:"Frammento dell'A.R.U.",fonte:"Eco Saint of Cosmos",flavor:"Un frammento di quell'armonia cerca di distribuirsi.",mec_breve:"Inizio sessione: tutti gli alleati +1 a un tipo di tiro. Dura tutta la sessione.",mec:"All'inizio di ogni sessione, designi un tipo di tiro (attacco, danno, tiri salvezza, o iniziativa). Ogni alleato guadagna +1 a quel tipo per l'intera sessione. Scelta irrevocabile."},
  {gruppo:3,pos:2,nome:"Frammento della Culla Cogher",fonte:"Eco di Breyin Cogher — Lullaby",flavor:"Un frammento della sua empatia cerca chi sa sentire gli altri.",mec_breve:"A.Bonus (1 Flusso): vedi attraverso alleato entro 60m. Alla sua morte: +2✦ + Vantaggio 2t.",mec:"Due effetti: (1) Azione Bonus (1 Flusso): vedi e senti attraverso un alleato entro 60m per 1 turno; (2) Ogni volta che un alleato muore in combattimento: +2 Scintille e Vantaggio su tutto per 2 turni."},
  {gruppo:3,pos:3,nome:"Frammento del Codice Rosso",fonte:"Eco Lions and Blood",flavor:"Il Codice Rosso è inciso su armi da cerimonia. Chi lo ha interiorizzato non dimentica.",mec_breve:"Skill mancata: +1 al prossimo tiro con quella Skill (max +5). Si azzera al primo colpo.",mec:"Passivo. Ogni volta che una Skill non colpisce/fallisce, accumuli +1 al prossimo tiro con QUELLA STESSA Skill. Massimo +5. Si azzera al primo colpo riuscito. Conta separatamente per ogni Skill."},
  {gruppo:3,pos:4,nome:"Frammento dei Nodi Neri",fonte:"Eco degli Ombra",flavor:"Chi porta questo frammento fa lo stesso con se stesso.",mec_breve:"1/sessione: teletrasporto a luoghi visitati. In combattimento: 30m (2 Flusso, A.Bonus).",mec:"Due modalità: (1) 1/sessione come Azione Principale: teletrasporto a qualsiasi luogo visitato in questa campagna; (2) Azione Bonus (2 Flusso): teletrasporto a punto visibile entro 30m."},
  {gruppo:3,pos:5,nome:"Frammento della Coscienza Civile",fonte:"Eco Nova Era",flavor:"Un frammento di quella tecnologia permette di modificare la realtà.",mec_breve:"1/sessione: modifica terreno entro 30m. In combattimento: effetto minore (INT DC 14).",mec:"1/sessione come Azione Principale: modifica fisicamente il terreno entro 30m. Il GM valida la plausibilità. In combattimento: limitato a effetti minori (DC 14 INT)."},
  {gruppo:3,pos:6,nome:"Frammento Multialleanza",fonte:"Eco M.A.F.I.A.",flavor:"Chi comanda, riscrive. Un frammento di quella filosofia pragmatica persiste.",mec_breve:"1/sessione: crea copia funzionale di te per 2 turni (HP/2, stessa Difesa, 1 Skill base).",mec:"1/sessione come Azione Principale: crei una copia funzionale. HP = metà dei tuoi correnti, stessa Difesa, usa una tua Skill base a scelta. Agisce subito dopo di te. Dura 2 turni."},
  {gruppo:4,pos:1,nome:"Frammento della Guerra delle Meteore",fonte:"Eco della rabbia orchesca",flavor:"Il furore si condensò come rabbia purificata nel Flusso.",mec_breve:"1/scontro (A.Bonus): Furia 3t — danni fisici +50%, immune condizioni fisiche. Poi Esausto 2t.",mec:"1/scontro Azione Bonus: Furia Ancestrale 3 turni. Durante: danni fisici +50%, immune condizioni fisiche, no Skill >2 Flusso. Fine: Esausto 2 turni."},
  {gruppo:4,pos:2,nome:"Frammento del Codice Bruciato",fonte:"Ceneri del Codice Arkadiano",flavor:"Le ultime parole del Codice non si spensero. Cercano ancora qualcuno.",mec_breve:"Passivo. Ogni tuo critico applica Rottura Armatura (–2 Difesa, max –6, fino a fine scontro).",mec:"Passivo. Ogni tuo critico applica automaticamente Rottura Armatura: –2 Difesa al bersaglio. Cumulabile fino a –6. La riduzione dura fino a fine scontro."},
  {gruppo:4,pos:3,nome:"Frammento della Bilancia Rotta",fonte:"Reliquia del Terzo Pandora",flavor:"Chi porta questo frammento vede i fili del destino prima che si tendano.",mec_breve:"Inizio sessione: il GM ti dice un evento certo. 1/scontro: inverte un risultato di dado.",mec:"Due effetti: (1) Il GM ti rivela in segreto un evento certo all'inizio sessione; (2) 1/scontro, dopo un tiro, puoi dichiarare Inversione: il risultato diventa (21 − risultato naturale). Es: 15 → 6."},
  {gruppo:4,pos:4,nome:"Frammento della Soglia",fonte:"Eco del potere limite",flavor:"Sotto il 20% HP, qualcosa si sveglia nel codice.",mec_breve:"Passivo. Sotto 20% HP: danni x2, Flusso 0, +3 Difesa, immune Spaventato/Stordito.",mec:"Passivo. Sotto 20% HP massimi: danni x2, costo Flusso 0, Difesa +3, immune Spaventato e Stordito. Sotto 10%: danni x2.5 + 1 Scintilla per turno sopravvissuto."},
  {gruppo:4,pos:5,nome:"Frammento di Jixal",fonte:"Eco del Re di Arkadium",flavor:"La sua volontà era cosmica — non si piegava a nulla.",mec_breve:"Immune a controllo mentale/illusioni. Scintille guadagnate +1. Max Scintille +3.",mec:"Tre effetti permanenti: immune a controllo mentale e illusioni; ogni Scintilla guadagnata è +1 (es. guadagni 2 invece di 1); limite massimo Scintille sale da 10 a 13."},
  {gruppo:4,pos:6,nome:"Frammento dei Sette Eroi",fonte:"Eco dell'Era degli Eroi",flavor:"Un eco di quella coesione persiste.",mec_breve:"Passivo. Per ogni alleato con Frammento entro 10m: +1 a tutti i tuoi tiri.",mec:"Passivo. Per ogni alleato con Frammento del Creatore entro 10m da te durante uno scontro: +1 cumulativo a tutti i tuoi tiri. Con 3 alleati vicini: +3 a tutto."},
  {gruppo:5,pos:1,nome:"Frammento Adattivo",fonte:"Eco delle Mutazioni Frammentarie",flavor:"Un frammento di quella adattabilità può essere controllato.",mec_breve:"Passivo. Primo tipo di danno per scontro: guadagni Resistenza a quel tipo (max 3).",mec:"Passivo. La prima volta che subisci danno di un tipo specifico in uno scontro, guadagni Resistenza a quel tipo (danno dimezzato) per il resto dello scontro. Massimo 3 resistenze diverse simultaneamente."},
  {gruppo:5,pos:2,nome:"Frammento del Vampirismo",fonte:"Eco del Flusso Residuale",flavor:"Chi lo tocca impara a nutrirsi delle realtà in dissolvenza.",mec_breve:"Passivo. Ogni attacco a segno: recuperi HP = 20% del danno inflitto.",mec:"Passivo. Ogni volta che infliggi danno con qualsiasi attacco o Skill, recuperi HP pari al 20% del danno (min 1 se colpisci). Si applica a ogni singolo colpo."},
  {gruppo:5,pos:3,nome:"Frammento della Velocità",fonte:"Eco dell'Instabilità Post-Pandorica",flavor:"Un eco di quella velocità impossibile sopravvive.",mec_breve:"Velocità +3 permanente. Mai attacchi di opportunità. A.Bonus (1 Flusso): 2° movimento.",mec:"Tre effetti: velocità di movimento +3 permanente; non provochi mai attacchi di opportunità; Azione Bonus (1 Flusso) per un secondo movimento nello stesso turno."},
  {gruppo:5,pos:4,nome:"Frammento della Pelle di Mithral",fonte:"Eco dei Custodi della Pietra",flavor:"Il corpo divenne parte della pietra stessa.",mec_breve:"+1 Difesa permanente. Immune ai veleni. Vantaggio su TS contro condizioni fisiche.",mec:"Tre effetti permanenti: Difesa Base +1; immunità completa a tutti i veleni; Vantaggio su tutti i tiri salvezza contro condizioni fisiche (Stordito, Paralizzato, Rallentato, Sanguinante, Immobilizzato)."},
  {gruppo:5,pos:5,nome:"Frammento della Rigenerazione",fonte:"Eco della Furia del Sangue",flavor:"Un frammento di quella biologia impossibile persiste.",mec_breve:"Passivo. Inizio di ogni tuo turno in combattimento: recupera 2+mod RES HP (min 2).",mec:"Passivo. All'inizio di ogni tuo turno in combattimento: recuperi automaticamente 2 + modificatore RES HP (minimo 2). Non funziona se sei incapacitato o a 0 HP."},
  {gruppo:5,pos:6,nome:"Frammento della Visione del Sogno",fonte:"Eco degli Elfi Luminali",flavor:"Chi porta questo frammento vede oltre la superficie della realtà.",mec_breve:"Rileva invisibili entro 10m. Vantaggio su illusioni. Vantaggio su Percezione passiva.",mec:"Tre effetti permanenti: rilevi automaticamente entità invisibili entro 10m; Vantaggio su qualsiasi tiro per smascherare illusioni; Vantaggio su tutti i tiri di Percezione passiva."},
  {gruppo:6,pos:1,nome:"Il Nome Vero del Creatore",fonte:"Frammento Primordiale",flavor:"Chi pronuncia il Nome Vero non è più solo un avventuriero. È una nuova bilancia.",mec_breve:"1/campagna: effetto meccanicamente impossibile concordato col GM.",mec:"Una volta per campagna: pronuncia il Nome Vero per ottenere un effetto meccanicamente impossibile concordato col GM. Non esistono limiti meccanici — ma il Flusso di Arkadia2099 reagisce sempre."},
  {gruppo:6,pos:2,nome:"Frammento del Destino Condiviso",fonte:"Eco della Profezia della Nuova Frattura",flavor:"I Sette Eroi lasciarono nel mondo i semi di una nuova era.",mec_breve:"Inizio sessione: evento certo dal GM. 1/scontro: ritira qualsiasi dado.",mec:"Due effetti: (1) Il GM ti rivela un evento certo all'inizio sessione; (2) 1/scontro: dopo qualsiasi tiro, puoi dichiarare Ritiro Destino — il dado viene ritirato e si usa il nuovo risultato."},
  {gruppo:6,pos:3,nome:"Frammento del Contratto Perduto",fonte:"Eco del Codice Arkadiano",flavor:"Il frammento del tentativo rimase.",mec_breve:"1/campagna: Contratto col GM. Obiettivo impossibile → potere permanente unico.",mec:"1/campagna: stipula un Contratto col GM con un obiettivo narrativo impossibile. Se lo raggiungi: potere permanente unico. Se fallisci: penalità narrativa grave concordata. Irrevocabile."},
  {gruppo:6,pos:4,nome:"Frammento dell'Anima Accumulata",fonte:"Eco del Codice d'Onore",flavor:"Non si guadagna rango per eredità — lo si guadagna su sangue volontario.",mec_breve:"Ogni scontro vinto: +1 PA speciale. Spendi: +1 danno Skill (1), +5 HP max (2), +1 stat (5).",mec:"Ogni scontro vinto: +1 Punto Anima (diversi dai PA normali). Spesa: 1 PA = +1 danno permanente a una Skill; 2 PA = +5 HP massimi permanenti; 5 PA = +1 a una caratteristica permanente."},
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
// DATI FAZIONI
// ═══════════════════════════════════════════════════════
const FAZ_COLORS = {
  "SoC":"#534ab7","LUL":"#5C4B8A","L&B":"#854f0b","SHD":"#5f5e5a",
  "MAF":"#c0392b","UA":"#185fa5","NE":"#0f6e56","DFO":"#1a0d2e"
};

const FAZIONI = [
  {
    sigla:"SoC", nome:"Saint of Cosmos", motto:"«Il Flusso appartiene a tutti — o non appartiene a nessuno.»",
    icon:"✦", color:"#534ab7",
    lore:"Nata dai sopravvissuti del Secondo Pandora, la Saint of Cosmos crede che il Flusso sia un bene comune. Gestisce ospizi, biblioteche del Flusso e scuole per portatori di Frammento. In apparenza benevola — in realtà possiede i Custodi del Codice, una sezione segreta che elimina chi 'abusa' del Flusso senza criterio.",
    zona:"Arkadium — quartiere del Tempio del Flusso",
    nemico:"M.A.F.I.A., Nova Era",
    classiAffini:"Paladino del Sogno, Guardiano del Sogno, Veggente del Sogno",
    missioni:"Proteggere portatori di Frammento | Recuperare testi del Creatore | Bonificare nodi del Flusso corrotto",
    benefici:[
      {grado:"Simpatizzante", desc:"Mappe dei nodi del Flusso — DC Navigazione –2 nelle zone cartografate."},
      {grado:"Membro", desc:"1 volta/sessione: guarigione gratuita (1d8+Rank HP)."},
      {grado:"Fidato", desc:"+1 ai tiri INT per capire meccaniche di Frammenti e Flusso Profondo."},
      {grado:"Capitano", desc:"Aura del Codice — alleati entro 5m guadagnano +1 Difesa passiva."},
      {grado:"Leggenda", desc:"Voce del Fondatore — 1/sessione, dichiari un'azione 'sacra al Flusso': il GM non può farla fallire per motivi narrativi."},
    ]
  },
  {
    sigla:"LUL", nome:"Lullaby", motto:"«Il sonno è il solo luogo dove il Creatore ancora parla.»",
    icon:"🌙", color:"#5C4B8A",
    lore:"Misteriosa setta di interpreti dei sogni e del Flusso Residuale. I membri credono che ogni sogno sia un frammento di memoria del Creatore. Commerciano in profezie e coltivano trance del Flusso Profondo. La loro forza politica deriva dal fatto che i loro vaticini si avverano.",
    zona:"SognoLento — città sospesa tra il Flusso Superficiale e Residuale",
    nemico:"Nova Era, Unity Army",
    classiAffini:"Veggente del Sogno, Illusionista, Sciamano",
    missioni:"Interpretare sogni criptici | Raccogliere lacrime del Flusso Residuale | Sventare esperimenti sul Flusso Profondo",
    benefici:[
      {grado:"Simpatizzante", desc:"Interpretazione dei sogni — 1/sessione chiedi al GM un sogno profetico vago ma reale."},
      {grado:"Membro", desc:"Resistenza al Flusso Profondo — +3 ai tiri contro effetti di pazzia o corruzione."},
      {grado:"Fidato", desc:"Il GM ti dà 1 indizio gratuito all'inizio di ogni sessione (senza spendere Scintille)."},
      {grado:"Capitano", desc:"Velo del Sogno — 1/scontro, dopo danno: 50% chance di annullarlo ('era solo nel sogno')."},
      {grado:"Leggenda", desc:"Profezia del Risveglio — prima di una sessione importante, scrivi 3 eventi. Se 2+ si avverano: +10 Scintille."},
    ]
  },
  {
    sigla:"L&B", nome:"Lions and Blood", motto:"«Il sangue versato in combattimento è la preghiera più vera.»",
    icon:"🦁", color:"#854f0b",
    lore:"Lega di guerrieri d'élite nata dalle arene di Arkasangue. Non hanno ideologie — hanno onore. Il codice L&B: non colpire chi non può difendersi, non tradire chi combatte al tuo fianco, non fuggire senza dichiararlo prima. Violarlo è morte sociale — o peggio.",
    zona:"Arkasangue — città-arena nel cuore del territorio di Flusso",
    nemico:"Shadows, M.A.F.I.A.",
    classiAffini:"Guerriero Hardcore, Berserker, Cacciatore di Bestie, Campione di Pietra",
    missioni:"Tornei e sfide formali | Proteggere l'Arena da sabotatori | Recuperare guerrieri catturati",
    benefici:[
      {grado:"Simpatizzante", desc:"Accesso alle arene — guadagni PA bonus per sfide formali in arena (+20% PA)."},
      {grado:"Membro", desc:"Dopo aver sconfitto un nemico in combattimento diretto, recuperi 1d6 HP."},
      {grado:"Fidato", desc:"+2 ai tiri attacco contro bersagli che hanno già colpito un tuo alleato nel round."},
      {grado:"Capitano", desc:"Ruggito del Leone — 1/scontro: alleati entro 8m +2 danni per 2 turni, tu +1 Difesa."},
      {grado:"Leggenda", desc:"Campione di Arkasangue — 1/sessione: sfida formale. Vittoria = +50 PA bonus e +5 RF con L&B."},
    ]
  },
  {
    sigla:"SHD", nome:"Shadows", motto:"«Nessuno sa chi siamo. È per questo che vinciamo.»",
    icon:"🌑", color:"#5f5e5a",
    lore:"La rete di informazioni più capillare di Arkadia2099. I Shadows non uccidono per piacere — raccolgono segreti, ricattano, commerciano in informazioni. La loro sede è Velosombra, una città dove la luce non entra mai completamente. Ogni membro ha una maschera, letterale e metaforica.",
    zona:"Velosombra — città nel distretto ombra, accesso via Flusso Residuale",
    nemico:"Lions and Blood, Unity Army",
    classiAffini:"Assassino, Ombra del Vento, Danzatore di Lame, Cacciatore di Anime",
    missioni:"Raccogliere informazioni per clienti anonimi | Infiltrare basi nemiche | Proteggere identità di agenti compromessi",
    benefici:[
      {grado:"Simpatizzante", desc:"Rete informativa — 1/sessione chiedi una voce attendibile su un PNG o luogo."},
      {grado:"Membro", desc:"Movimento silenzioso — Svantaggio sui tiri percezione nemici per scovarti in furtività."},
      {grado:"Fidato", desc:"Identità di copertura — Vantaggio nelle interazioni sociali con non-nemici quando usi l'alias."},
      {grado:"Capitano", desc:"Rete dell'Ombra — 1/sessione: ottieni 2 fatti veri su qualsiasi PNG entro Arkadia2099."},
      {grado:"Leggenda", desc:"Il Fantasma — il tuo personaggio non esiste ufficialmente. Nessuna Fazione può emettere taglie su di te."},
    ]
  },
  {
    sigla:"MAF", nome:"M.A.F.I.A.", motto:"«Il Flusso è potere. Il potere si vende. Tutto il resto è sentimentalismo.»",
    icon:"💰", color:"#c0392b",
    lore:"Consorzio criminale nato dopo il Terzo Pandora nel caos economico seguente al crollo delle strutture del Creatore. Controlla il mercato nero del Flusso, le scommesse nelle arene, i traffici di Frammenti. Non hanno ideali — hanno contabilità. Tradire un accordo con loro ha conseguenze.",
    zona:"Kaltem — Zona Fratturata, nessuna legge, solo affari",
    nemico:"Saint of Cosmos, Discepoli del Frammento Oscuro",
    classiAffini:"Maestro del Tempo, Negromante, Cavaliere Oscuro, Bardo del Sogno",
    missioni:"Riscuotere debiti | Proteggere carichi sensibili | Sabotare concorrenti economici",
    benefici:[
      {grado:"Simpatizzante", desc:"Mercato nero — accesso a equipaggiamento raro senza Rank minimo (costo ×1.5)."},
      {grado:"Membro", desc:"Bustarella — 1/sessione, paga 50 monete per rimuovere un ostacolo burocratico."},
      {grado:"Fidato", desc:"Contratto attivo — i PNG sanno che attaccarti ha conseguenze. –2 ai tiri ostili non combattenti."},
      {grado:"Capitano", desc:"Chiamata del Consorzio — 1/missione: 2d4 tirapiedi Rank E-D entrano entro 2 round."},
      {grado:"Leggenda", desc:"Il Padrino — ogni PNG non nemico ti offre il meglio. 1/campagna puoi richiedere una risorsa impossibile."},
    ]
  },
  {
    sigla:"UA", nome:"Unity Army", motto:"«Senza ordine, il Flusso divora tutto. Noi siamo l'ordine.»",
    icon:"⚔️", color:"#185fa5",
    lore:"L'unica Fazione con struttura militare formale. La Unity Army crede che Arkadia2099 abbia bisogno di una governance unificata per sopravvivere a un eventuale Quarto Pandora. Ha eserciti, basi, gerarchie, leggi proprie. Amata dagli stabilisti, odiata dai libertari.",
    zona:"Anthelion — fortezza-città, la più difesa di Arkadia2099",
    nemico:"Shadows, Lullaby",
    classiAffini:"Paladino del Sogno, Guardiano del Sogno, Araldo della Fine, Monaco del Sogno",
    missioni:"Presidiare confini di zona | Missioni di ricognizione in territori ostili | Addestrare reclute",
    benefici:[
      {grado:"Simpatizzante", desc:"Accesso alle mappe militari — Vantaggio su tiri per orientarsi in zone sorvegliate dalla UA."},
      {grado:"Membro", desc:"Corsia preferenziale — nelle città UA passi senza controlli. Le guardie ti trattano da alleato."},
      {grado:"Fidato", desc:"Equipaggiamento standard UA — accesso gratuito ad armatura media e armi base al tuo Rank."},
      {grado:"Capitano", desc:"Comando tattico — 1/scontro: riorganizza l'iniziativa di tutti gli alleati per 1 round."},
      {grado:"Leggenda", desc:"Generale — puoi requisire risorse UA in emergenza. 1/sessione: supporto difensivo (effetto GM)."},
    ]
  },
  {
    sigla:"NE", nome:"Nova Era", motto:"«Il Flusso è evoluzione. Noi siamo i prossimi.»",
    icon:"⚗️", color:"#0f6e56",
    lore:"Movimento tecno-arcano nato a Neoterra. Crede che il Flusso possa essere studiato, amplificato e reindirizzato attraverso artefatti. I loro laboratori producono oggetti prodigiosi e mostruosi in egual misura. Reclutano attivamente portatori di Frammento — per collaborazione o per esperimento.",
    zona:"Neoterra — città laboratorio, sempre costruita e smontata",
    nemico:"Saint of Cosmos, Lullaby",
    classiAffini:"Mago del Caos, Evocatore di Sogni, Ranger del Sogno, Cercatore del Sogno",
    missioni:"Raccogliere campioni di Flusso anomalo | Testare nuovi artefatti | Recuperare dati da siti del Creatore",
    benefici:[
      {grado:"Simpatizzante", desc:"Prototipo — inizio campagna, ottieni un artefatto Rank F di Neoterra (GM sceglie da lista)."},
      {grado:"Membro", desc:"Upgrade artefatto — 1/sessione: potenzia temporaneamente un artefatto (+1 dado al suo effetto)."},
      {grado:"Fidato", desc:"Analisi Flusso — +3 a tiri per identificare Frammenti, Skill nemiche o artefatti sconosciuti."},
      {grado:"Capitano", desc:"Amplificatore del Flusso — 1/scontro: raddoppia il Flusso guadagnato da qualsiasi fonte per 2 turni."},
      {grado:"Leggenda", desc:"Architetto del Flusso — puoi richiedere la costruzione di un artefatto personalizzato a Neoterra (missione dedicata)."},
    ]
  },
  {
    sigla:"DFO", nome:"Discepoli del Frammento Oscuro", motto:"«Il Creatore si è spezzato. I suoi frammenti possono ancora distruggerlo.»",
    icon:"🔱", color:"#6a3fa0",
    lore:"Culto segreto che crede il Creatore fosse una prigione cosmica — e che la sua frammentazione sia stata liberazione. Vogliono spezzare i Frammenti del Creatore, non risvegliarli. Credono che ogni Frammento risvegliato sia un passo verso il ripristino della 'gabbia'. Chi scopre la loro esistenza, raramente vive per raccontarlo.",
    zona:"Labis Rotto — rovine post-Pandora, accesso tramite rito del Flusso Profondo",
    nemico:"Saint of Cosmos, M.A.F.I.A.",
    classiAffini:"Cavaliere Oscuro, Negromante, Sciamano, Maestro del Tempo",
    missioni:"Corrompere portatori di Frammento | Recuperare artefatti della 'gabbia' cosmica | Sventare il risveglio di Frammenti potenti",
    benefici:[
      {grado:"Simpatizzante", desc:"Conoscenza proibita — sai cose sui Frammenti che le altre Fazioni non sanno. +2 INT su meccaniche Frammenti."},
      {grado:"Membro", desc:"Corruzione del Frammento — 1/ora: sopprimi il tuo Frammento per guadagnare immunità al controllo esterno del Flusso."},
      {grado:"Fidato", desc:"Rito della Frattura — 1/sessione: infliggi 2d6 danni diretti a un portatore di Frammento (bypassa armatura)."},
      {grado:"Capitano", desc:"Vuoto del Creatore — 1/scontro: annulla temporaneamente le Skill di un bersaglio per 1 turno."},
      {grado:"Leggenda", desc:"La Verità Oscura — conosci il vero nome del Creatore. Usarlo è un'arma cosmica. Il GM gestisce caso per caso."},
    ]
  },
];

const GRADI_REP = [
  {nome:"Sconosciuto", rf:0, color:"var(--text-dim)"},
  {nome:"Simpatizzante", rf:20, color:"#4ecb71"},
  {nome:"Membro", rf:60, color:"#3498db"},
  {nome:"Fidato", rf:150, color:"var(--purple)"},
  {nome:"Capitano", rf:350, color:"var(--gold)"},
  {nome:"Leggenda", rf:700, color:"#ff6b6b"},
];

// ═══════════════════════════════════════════════════════
// DATI AU FRAMMENTI (Abilità Uniche — si sbloccano al Rank S)
// ═══════════════════════════════════════════════════════
const AU_MAP = {
  "Frammento di Raos": {nome:"Scudo Solare + Lama del Mattino", desc:"PASSIVO: Immune a danni da oscurità e paura. | ATTIVO: Emetti luce pura — tutti i nemici entro 10m: 3d8 danni sacri (no tiro salvezza). Non-morti/corrotti: 5d8."},
  "Frammento di Baros": {nome:"Corpo di Pietra + Pugno del Mondo", desc:"PASSIVO: +3 Difesa permanente, danni fisici dimezzati. | ATTIVO: Colpisci il terreno — area 6m, tutti i nemici: Proni + 2d10 danni. Non schivabile."},
  "Frammento di Arkan": {nome:"Istante Eterno + Riscrittura", desc:"PASSIVO: 1/scontro, agisci prima di chiunque altro (ignora iniziativa). | ATTIVO: Annulla l'ultimo evento del round (attacco, morte, effetto). Il GM valida i limiti."},
  "Frammento di Drako": {nome:"Manto Oscuro + Passo nell'Ombra", desc:"PASSIVO: Non puoi essere rilevato magicamente. | ATTIVO: Teletrasporti su qualsiasi ombra visibile entro 30m. Arrivi in stealth (Vantaggio al primo attacco)."},
  "Frammento del Muro Arkano": {nome:"Mura Viventi", desc:"ATTIVO: Per 2 turni, nessun alleato entro 6m può essere mosso/spinto involontariamente. Tutti gli alleati in zona: +3 Difesa."},
  "Frammento della Prima Legge": {nome:"Esito Scritto + Inevitabile", desc:"PASSIVO: I 20 naturali non possono essere annullati da nessuna meccanica nemica. | ATTIVO: Il prossimo tiro è trattato come 20 naturale, indipendentemente dal risultato."},
  "Frammento del Cristallo Oscuro": {nome:"Onda Caotica", desc:"ATTIVO: Lancia un'onda di Caos puro in area 8m. Effetto casuale per ogni nemico (1d6): 1=Stordito, 2=Paura, 3=2d10 danni, 4=Prono+Silenzio, 5=dimezza HP, 6=scelta GM. No tiro salvezza."},
  "Frammento di Seraphin": {nome:"Impostore Cosmico", desc:"ATTIVO: Assumi perfettamente l'aspetto di qualsiasi essere visto. Durata: 1 ora o fino al primo attacco. Meccanicamente impossibile distinguerti senza Flusso Profondo."},
  "Frammento della Frattura": {nome:"Singolarità", desc:"ATTIVO: Crei un punto di singolarità del Flusso. Tutto entro 4m attirato al centro (RES DC 16) + 4d6 danni. Poi esplode: 3d8 in area 6m."},
  "Frammento del Velo Riflesso": {nome:"Pelle del Creatore + Mimesi", desc:"PASSIVO: Per ogni Rank superiore di un nemico: +1 a tutti i tiri vs quel nemico. | ATTIVO: Copia una Skill vista in questo scontro. Usala 1 volta con i tuoi modificatori."},
  "Frammento dell'Onda d'Impatto": {nome:"Eco di Arkasangue", desc:"ATTIVO: Per 2 turni, ogni attacco che supera la Difesa nemica di 5+ applica automaticamente: Stordito, Prono o Spaventato (scegli dopo il tiro)."},
  "Frammento della Dissonanza": {nome:"Lingua del Creatore", desc:"ATTIVO: Pronunci una frase in lingua del Creatore. Un bersaglio entro 15m deve eseguire un'azione semplice che ordini (RES DC 18). Non funziona su SSS o Frammenti risvegliati."},
  "Frammento dell'A.R.U.": {nome:"Accordo Vincolante", desc:"ATTIVO: Stringi un patto con un PNG o PG. Mentre esiste: entrambi +2 quando agite in accordo. Chi viola: 2d10 danni automatici e –3 a tutti i tiri per 3 sessioni."},
  "Frammento della Culla Cogher": {nome:"Legame Vitale", desc:"ATTIVO: Crea un legame con un alleato per tutta la sessione. Ogni volta che uno subisce danno, l'altro recupera HP pari al 30%. Non funziona oltre 20m."},
  "Frammento del Codice Rosso": {nome:"Ruggito del Vincitore", desc:"ATTIVO: Dopo aver sconfitto un avversario nello stesso scontro: tutti gli alleati recuperano 1d8+2 HP, guadagnano +2 danni per 2 turni, e rimuovono una condizione negativa."},
  "Frammento dei Nodi Neri": {nome:"Slipstream + Movimento Impossibile", desc:"PASSIVO: +2 velocità, no attacchi di opportunità. | ATTIVO: Per 1 turno, velocità illimitata — puoi raggiungere qualsiasi punto visibile. Tutti gli attacchi quel turno: Vantaggio."},
  "Frammento della Coscienza Civile": {nome:"Amplificatore del Flusso", desc:"ATTIVO: Per 2 turni, raddoppia il Flusso guadagnato da qualsiasi fonte. Tutte le Skill costano 1 Flusso in meno (min 0) in questo periodo."},
  "Frammento Multialleanza": {nome:"Pugnale nell'Ombra", desc:"ATTIVO: Un bersaglio che si fida di te (GM valuta) non può difendersi dal tuo prossimo attacco — Difesa trattata come 0. Danno ignora armatura e Skill difensive."},
  "Frammento della Guerra delle Meteore": {nome:"Forma Titanica", desc:"ATTIVO: Per 2 turni: +20 HP temporanei, +5 danni melee, +2 Difesa. Ogni passo sposta 2 creature adiacenti indietro di 2m."},
  "Frammento del Codice Bruciato": {nome:"Colonna d'Assalto", desc:"ATTIVO: Carichi su bersaglio entro 12m. Tutto sul percorso: 2d6 danni (AGI DC 14 per schivare). Bersaglio finale: 3d8+FOR + Prono."},
  "Frammento della Bilancia Rotta": {nome:"Bivio Cosmico", desc:"ATTIVO: Tu o un alleato entro 6m può ripetere qualsiasi azione appena effettuata. La seconda versione sostituisce la prima. Usabile dopo aver visto il risultato."},
  "Frammento della Soglia": {nome:"Cecchino Cosmico", desc:"ATTIVO: Il prossimo attacco a distanza della sessione è garantito critico (senza tiro). La distanza massima diventa illimitata purché il bersaglio sia visibile."},
  "Frammento di Jixal": {nome:"Comando Assoluto", desc:"ATTIVO: Per 1 turno, tutti gli alleati agiscono con Vantaggio su tutto. Il tuo ordine tattico del turno viene eseguito perfettamente se meccanicamente possibile."},
  "Frammento dei Sette Eroi": {nome:"Prezzo del Destino", desc:"ATTIVO: Subisci volontariamente 3d6 danni (non riducibili). In cambio: un alleato entro 12m viene salvato da qualsiasi effetto negativo attivo (danni, condizioni, morte)."},
  "Frammento Adattivo": {nome:"Evoluzione Rapida", desc:"ATTIVO: Subisci qualsiasi tipo di danno — al prossimo scontro sei immune a quel tipo per tutta la sessione. Puoi accumulare fino a 3 immunità contemporaneamente."},
  "Frammento del Vampirismo": {nome:"Sangue Tossico + Inoculazione", desc:"PASSIVO: Chi ti colpisce melee subisce 1d4 danni veleno automatici. | ATTIVO: Inietta veleno del Frammento — bersaglio: –2 a tutti i tiri + 1d6 danni ogni turno per 3 turni (RES DC 14 per dimezzare la durata)."},
  "Frammento della Velocità": {nome:"Carne del Creatore", desc:"PASSIVO: Inizio ogni tuo turno, recuperi HP = Rank (F=1...S=7). | ATTIVO: Rigenerazione totale — recuperi il 50% degli HP massimi istantaneamente. Poi: Esausto 1 turno."},
  "Frammento della Pelle di Mithral": {nome:"Istinto della Caccia + Presa del Predatore", desc:"PASSIVO: Non puoi essere sorpreso. Senti la presenza di viventi entro 30m. | ATTIVO: Immobilizza bersaglio (RES DC 15) 2 turni: –2 Difesa + ogni tuo attacco vs lui +1d6 extra."},
  "Frammento della Rigenerazione": {nome:"Frenesia del Creatore", desc:"ATTIVO: Per 3 turni: +4 a tutti i danni, ignori Difesa nemica. MA ogni azione: 25% di colpirti (1d4 danni). Al termine: recuperi 2d8 HP dal caos assorbito."},
  "Frammento della Visione del Sogno": {nome:"Scrittura del Futuro", desc:"ATTIVO: Prima del tiro, dichiari il risultato esatto di 1d20. Se il dado esce quel numero: l'azione riesce perfettamente. Se non esce: il dado è comunque trattato come 15."},
  "Il Nome Vero del Creatore": {nome:"Risonanza del Creatore", desc:"ATTIVO: Per 1 turno, ogni Skill o AU usata si applica DUE VOLTE (secondo uso gratuito, stesso bersaglio o diverso). I danni non si sommano — si applicano separatamente."},
  "Frammento del Destino Condiviso": {nome:"Ritorno", desc:"ATTIVO: Torna indietro nel tempo narrativo di 1 turno intero — tutto ciò che è accaduto è annullato. HP, condizioni, posizioni: ripristinati a inizio turno. 1 volta per sessione."},
  "Frammento del Contratto Perduto": {nome:"Ciclicità Cosmica", desc:"PASSIVO: 1/scontro, agisci sempre due volte prima che il turno passi a chiunque altro. | ATTIVO: Raddoppia la durata di qualsiasi effetto attivo su di te (benefico o negativo)."},
  "Frammento dell'Anima Accumulata": {nome:"Codice del Sangue", desc:"ATTIVO: Sfida formale — un bersaglio. Per tutto il duello (max 5 round): +3 a tutti i tiri vs lui, lui –2 vs te. Nessun altro può intervenire senza 2d6 danni automatici."},
  "Frammento della Benedizione": {nome:"Eco del Serafino", desc:"ATTIVO: Per 1 turno, sei letteralmente intangibile — nessun danno, nessuna condizione ti tocca. Poi: Esausto 2 turni. Una volta per sessione."},
  "Frammento dell'Eco Finale": {nome:"Terrore della Battaglia", desc:"ATTIVO: Emetti aura di terrore — tutti i nemici entro 10m: Spaventati 2 turni (CAR DC 16 per resistere). Chi fallisce: anche –2 a tutti gli attacchi."},
};

// ═══════════════════════════════════════════════════════
// STILI CSS GLOBALI
// ═══════════════════════════════════════════════════════
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Cinzel+Decorative:wght@400;700&family=Raleway:wght@300;400;500;600&display=swap');

    :root {
      --bg-deep: #03010a;
      --bg-mid: #08050f;
      --bg-card: #0d0a1a;
      --bg-card2: #110e20;
      --border: rgba(140,110,255,0.18);
      --border-bright: rgba(140,110,255,0.45);
      --purple: #8c6eff;
      --purple-dim: #534ab7;
      --purple-glow: rgba(140,110,255,0.25);
      --gold: #d4a843;
      --gold-dim: #9a7520;
      --gold-glow: rgba(212,168,67,0.2);
      --gold-bright: #f0c060;
      --text: #c8bfe8;
      --text-dim: #7a6ea0;
      --text-bright: #ede8ff;
      --flux: #7af0c8;
      --flux-dim: rgba(122,240,200,0.15);
      --danger: #e05050;
      --success: #4ecb71;
    }

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      background: var(--bg-deep);
      color: var(--text);
      font-family: 'Raleway', sans-serif;
      min-height: 100vh;
      overflow-x: hidden;
    }

    /* Scrollbar */
    ::-webkit-scrollbar { width: 5px; }
    ::-webkit-scrollbar-track { background: var(--bg-deep); }
    ::-webkit-scrollbar-thumb { background: var(--purple-dim); border-radius: 3px; }

    /* Sfondo particelle */
    #app-root {
      position: relative;
      min-height: 100vh;
      background:
        radial-gradient(ellipse at 15% 25%, rgba(83,74,183,0.12) 0%, transparent 55%),
        radial-gradient(ellipse at 85% 70%, rgba(122,240,200,0.06) 0%, transparent 45%),
        radial-gradient(ellipse at 50% 90%, rgba(212,168,67,0.05) 0%, transparent 40%),
        var(--bg-deep);
    }

    /* Noise overlay */
    #app-root::before {
      content: '';
      position: fixed;
      inset: 0;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
      pointer-events: none;
      z-index: 0;
      opacity: 0.4;
    }

    .app-content { position: relative; z-index: 1; }

    /* Animazioni */
    @keyframes flux-pulse {
      0%, 100% { opacity: 0.5; transform: scale(1); }
      50% { opacity: 1; transform: scale(1.05); }
    }

    @keyframes glow-border {
      0%, 100% { box-shadow: 0 0 8px var(--purple-glow), inset 0 0 8px rgba(140,110,255,0.03); }
      50% { box-shadow: 0 0 20px var(--purple-glow), inset 0 0 12px rgba(140,110,255,0.06); }
    }

    @keyframes dice-roll {
      0% { transform: rotate(0deg) scale(1); }
      25% { transform: rotate(180deg) scale(1.3); }
      50% { transform: rotate(360deg) scale(0.8); }
      75% { transform: rotate(540deg) scale(1.2); }
      100% { transform: rotate(720deg) scale(1); }
    }

    @keyframes dice-settle {
      0% { transform: scale(1.2); }
      50% { transform: scale(0.95); }
      100% { transform: scale(1); }
    }

    @keyframes slide-in {
      from { opacity: 0; transform: translateY(16px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @keyframes fade-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-6px); }
    }

    @keyframes rank-shine {
      0% { background-position: -200% center; }
      100% { background-position: 200% center; }
    }

    .anim-slide-in { animation: slide-in 0.3s ease forwards; }
    .anim-fade-in { animation: fade-in 0.4s ease forwards; }

    /* Navbar */
    .navbar {
      position: sticky;
      top: 0;
      z-index: 100;
      background: rgba(3,1,10,0.92);
      backdrop-filter: blur(16px);
      border-bottom: 1px solid var(--border);
      padding: 0 2rem;
      display: flex;
      align-items: center;
      height: 64px;
      gap: 2rem;
    }

    .navbar-logo {
      font-family: 'Cinzel Decorative', serif;
      font-size: 1.1rem;
      font-weight: 700;
      background: linear-gradient(135deg, var(--gold) 0%, var(--purple) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      letter-spacing: 0.05em;
      white-space: nowrap;
      cursor: pointer;
    }

    .navbar-divider {
      height: 28px;
      width: 1px;
      background: var(--border);
      flex-shrink: 0;
    }

    .navbar-nav {
      display: flex;
      gap: 0.25rem;
      flex-wrap: wrap;
    }

    .nav-btn {
      background: none;
      border: none;
      color: var(--text-dim);
      font-family: 'Raleway', sans-serif;
      font-size: 0.82rem;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      padding: 0.4rem 0.9rem;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s;
      position: relative;
    }

    .nav-btn:hover { color: var(--text-bright); background: rgba(140,110,255,0.08); }

    .nav-btn.active {
      color: var(--purple);
      background: rgba(140,110,255,0.12);
    }

    .nav-btn.active::after {
      content: '';
      position: absolute;
      bottom: -1px;
      left: 50%;
      transform: translateX(-50%);
      width: 60%;
      height: 2px;
      background: var(--purple);
      border-radius: 1px;
    }

    /* Layout principale */
    .page {
      max-width: 1280px;
      margin: 0 auto;
      padding: 2rem;
      min-height: calc(100vh - 64px);
    }

    /* Cards */
    .card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 8px;
      transition: all 0.25s;
    }

    .card:hover {
      border-color: var(--border-bright);
      background: var(--bg-card2);
    }

    .card-glow {
      animation: glow-border 3s ease-in-out infinite;
    }

    /* Sezione titolo */
    .section-title {
      font-family: 'Cinzel', serif;
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: var(--text-dim);
      margin-bottom: 0.5rem;
    }

    .page-title {
      font-family: 'Cinzel', serif;
      font-size: 2rem;
      font-weight: 700;
      color: var(--text-bright);
      margin-bottom: 0.5rem;
    }

    .page-subtitle {
      color: var(--text-dim);
      font-size: 0.9rem;
      margin-bottom: 2rem;
      line-height: 1.6;
    }

    /* Rank badge */
    .rank-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-family: 'Cinzel', serif;
      font-weight: 900;
      border-radius: 4px;
      line-height: 1;
    }

    .rank-S, .rank-SS, .rank-SSS {
      background: linear-gradient(135deg, var(--gold-dim), var(--gold));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .rank-pill {
      font-family: 'Cinzel', serif;
      font-weight: 700;
      font-size: 0.7rem;
      padding: 2px 8px;
      border-radius: 3px;
      border: 1px solid;
    }

    /* Skill card */
    .skill-card {
      background: rgba(140,110,255,0.04);
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 1rem;
      transition: all 0.2s;
    }
    .skill-card:hover {
      background: rgba(140,110,255,0.08);
      border-color: var(--border-bright);
    }

    /* Stat bubble */
    .stat-bubble {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      padding: 0.5rem 0.6rem;
      background: rgba(140,110,255,0.06);
      border: 1px solid var(--border);
      border-radius: 6px;
      min-width: 50px;
    }

    .stat-name {
      font-size: 0.65rem;
      font-weight: 700;
      letter-spacing: 0.1em;
      color: var(--text-dim);
      text-transform: uppercase;
    }

    .stat-value {
      font-family: 'Cinzel', serif;
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--text-bright);
      line-height: 1;
    }

    .stat-mod {
      font-size: 0.7rem;
      font-weight: 600;
      color: var(--purple);
    }

    /* Dice */
    .dice-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
    }

    .dice {
      width: 80px;
      height: 80px;
      background: var(--bg-card2);
      border: 2px solid var(--border-bright);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Cinzel', serif;
      font-size: 2rem;
      font-weight: 900;
      color: var(--text-bright);
      cursor: pointer;
      transition: all 0.2s;
      position: relative;
      overflow: hidden;
      user-select: none;
    }

    .dice::before {
      content: '';
      position: absolute;
      inset: 0;
      background: radial-gradient(circle at 50% 50%, rgba(140,110,255,0.15), transparent 70%);
      opacity: 0;
      transition: opacity 0.2s;
    }

    .dice:hover { border-color: var(--purple); transform: translateY(-2px); }
    .dice:hover::before { opacity: 1; }

    .dice.rolling {
      animation: dice-roll 0.6s ease-in-out;
      border-color: var(--gold);
      color: var(--gold);
      box-shadow: 0 0 20px var(--gold-glow);
    }

    .dice.settled {
      animation: dice-settle 0.3s ease;
      border-color: var(--purple);
      color: var(--gold-bright);
      box-shadow: 0 0 16px var(--purple-glow);
    }

    /* Progress bar */
    .progress-bar {
      height: 6px;
      background: rgba(140,110,255,0.1);
      border-radius: 3px;
      overflow: hidden;
      position: relative;
    }

    .progress-fill {
      height: 100%;
      border-radius: 3px;
      background: linear-gradient(90deg, var(--purple-dim), var(--purple));
      transition: width 0.5s ease;
      position: relative;
    }

    .progress-fill::after {
      content: '';
      position: absolute;
      right: 0;
      top: 0;
      height: 100%;
      width: 20px;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3));
    }

    /* Tag */
    .tag {
      display: inline-flex;
      align-items: center;
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.06em;
      padding: 2px 8px;
      border-radius: 3px;
      text-transform: uppercase;
    }

    /* Input */
    .input-field {
      background: rgba(140,110,255,0.06);
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 0.6rem 0.9rem;
      color: var(--text-bright);
      font-family: 'Raleway', sans-serif;
      font-size: 0.9rem;
      width: 100%;
      transition: border-color 0.2s;
      outline: none;
    }

    .input-field:focus {
      border-color: var(--purple);
      background: rgba(140,110,255,0.1);
    }

    /* Button */
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.4rem;
      font-family: 'Raleway', sans-serif;
      font-weight: 700;
      font-size: 0.85rem;
      letter-spacing: 0.06em;
      padding: 0.6rem 1.2rem;
      border-radius: 6px;
      border: none;
      cursor: pointer;
      transition: all 0.2s;
      text-transform: uppercase;
    }

    .btn-primary {
      background: linear-gradient(135deg, var(--purple-dim), var(--purple));
      color: white;
    }

    .btn-primary:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 16px rgba(140,110,255,0.35);
    }

    .btn-gold {
      background: linear-gradient(135deg, var(--gold-dim), var(--gold));
      color: #1a1000;
    }

    .btn-gold:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 16px rgba(212,168,67,0.35);
    }

    .btn-outline {
      background: transparent;
      color: var(--text-dim);
      border: 1px solid var(--border);
    }

    .btn-outline:hover {
      color: var(--text-bright);
      border-color: var(--border-bright);
      background: rgba(140,110,255,0.06);
    }

    .btn-danger {
      background: rgba(224,80,80,0.15);
      color: var(--danger);
      border: 1px solid rgba(224,80,80,0.3);
    }

    .btn-danger:hover {
      background: rgba(224,80,80,0.25);
      border-color: var(--danger);
    }

    /* Rank table row */
    .rank-row-S, .rank-row-SS, .rank-row-SSS {
      background: rgba(212,168,67,0.05) !important;
    }

    /* Flux text */
    .flux-text {
      color: var(--flux);
      font-weight: 600;
    }

    .gold-text {
      color: var(--gold);
    }

    .purple-text {
      color: var(--purple);
    }

    /* Modal overlay */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.85);
      backdrop-filter: blur(8px);
      z-index: 200;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      animation: fade-in 0.2s ease;
    }

    .modal-content {
      background: var(--bg-card);
      border: 1px solid var(--border-bright);
      border-radius: 12px;
      max-width: 800px;
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 0 60px rgba(140,110,255,0.2);
      animation: slide-in 0.3s ease;
    }

    /* Category header */
    .cat-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.8rem 1.2rem;
      border-radius: 8px;
      margin-bottom: 1rem;
    }

    .cat-number {
      font-family: 'Cinzel', serif;
      font-size: 2rem;
      font-weight: 900;
      opacity: 0.9;
      line-height: 1;
    }

    /* Responsive grid */
    .grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
    .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
    .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.75rem; }
    .grid-auto { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1rem; }

    @media (max-width: 768px) {
      .grid-2, .grid-3, .grid-4 { grid-template-columns: 1fr; }
      .grid-auto { grid-template-columns: 1fr; }
      .page { padding: 1rem; }
      .navbar { padding: 0 1rem; gap: 1rem; }
      .navbar-logo { font-size: 0.9rem; }
    }

    /* Tooltip */
    .tooltip-wrap { position: relative; display: inline-block; }
    .tooltip-tip {
      position: absolute;
      bottom: calc(100% + 6px);
      left: 50%;
      transform: translateX(-50%);
      background: var(--bg-card2);
      border: 1px solid var(--border-bright);
      border-radius: 6px;
      padding: 0.5rem 0.75rem;
      font-size: 0.78rem;
      color: var(--text);
      white-space: nowrap;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.15s;
      z-index: 50;
      max-width: 240px;
      white-space: normal;
      text-align: center;
    }
    .tooltip-wrap:hover .tooltip-tip { opacity: 1; }

    /* Glow orb decorativo */
    .glow-orb {
      position: fixed;
      border-radius: 50%;
      filter: blur(80px);
      pointer-events: none;
      z-index: 0;
      opacity: 0.12;
    }

    /* Rank S glow */
    .rank-awakened {
      position: relative;
    }
    .rank-awakened::before {
      content: '';
      position: absolute;
      inset: -2px;
      border-radius: inherit;
      background: linear-gradient(135deg, var(--gold), var(--purple), var(--flux));
      z-index: -1;
      opacity: 0.4;
    }

    /* PA tracker */
    .pa-tracker {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 10px;
      overflow: hidden;
    }

    .pa-header {
      padding: 1.2rem 1.5rem;
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    /* Skill PS row */
    .ps-row {
      display: grid;
      grid-template-columns: 1fr 90px 90px;
      gap: 0.5rem;
      align-items: center;
      padding: 0.6rem 1rem;
      border-bottom: 1px solid rgba(140,110,255,0.06);
    }

    .ps-row:last-child { border-bottom: none; }

    /* Homepage hero */
    .hero {
      text-align: center;
      padding: 4rem 2rem 3rem;
      position: relative;
    }

    .hero-title {
      font-family: 'Cinzel Decorative', serif;
      font-size: clamp(2rem, 6vw, 4.5rem);
      font-weight: 700;
      background: linear-gradient(135deg, var(--gold-bright) 0%, var(--purple) 50%, var(--flux) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      line-height: 1.2;
      margin-bottom: 0.5rem;
      animation: float 6s ease-in-out infinite;
    }

    .hero-sub {
      font-family: 'Cinzel', serif;
      font-size: clamp(0.8rem, 2vw, 1.1rem);
      letter-spacing: 0.25em;
      text-transform: uppercase;
      color: var(--text-dim);
      margin-bottom: 2rem;
    }

    /* Separator */
    .sep {
      height: 1px;
      background: linear-gradient(90deg, transparent, var(--border-bright), transparent);
      margin: 1.5rem 0;
    }

    /* PS level circles */
    .ps-circle {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      border: 2px solid;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Cinzel', serif;
      font-size: 0.7rem;
      font-weight: 700;
    }

    /* Collapsible section */
    .collapsible-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      cursor: pointer;
      padding: 1rem 1.2rem;
      user-select: none;
      transition: background 0.2s;
      border-radius: 6px;
    }
    .collapsible-header:hover { background: rgba(140,110,255,0.04); }
    .collapsible-chevron {
      transition: transform 0.25s;
      color: var(--text-dim);
    }
    .collapsible-chevron.open { transform: rotate(180deg); }
  `}</style>
);

// ═══════════════════════════════════════════════════════
// UTILITY
// ═══════════════════════════════════════════════════════
const modVal = v => Math.floor((v-10)/2);
const fmtMod = v => { const m = modVal(v); return (m>=0?"+":"")+m; };
const getRankColor = r => ({ F:"#9090b0",E:"#5f9f5f",D:"#5f8faf",C:"#8f6fdf",B:"#df8f3f",A:"#df4f4f",S:"#d4a843",SS:"#f0c060",SSS:"#ffe080" })[r]||"#9090b0";

const PA_SOGLIE = RANKS.map((r,i) => ({ rank:r, pa:RANK_PA[r], next: RANKS[i+1] ? RANK_PA[RANKS[i+1]] : null }));

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
// COMPONENTI UI
// ═══════════════════════════════════════════════════════

function StatBubble({ name, value, highlight }) {
  const mod = modVal(value);
  const pColor = highlight ? "var(--gold)" : "var(--purple)";
  return (
    <div className="stat-bubble" style={{ borderColor: highlight ? "rgba(212,168,67,0.3)" : undefined }}>
      <span className="stat-name">{name}</span>
      <span className="stat-value" style={{ color: highlight ? "var(--gold-bright)" : "var(--text-bright)" }}>{value}</span>
      <span className="stat-mod" style={{ color: pColor }}>{fmtMod(value)}</span>
    </div>
  );
}

function RankBadge({ rank, size = "md" }) {
  const color = getRankColor(rank);
  const isS = ["S","SS","SSS"].includes(rank);
  const sizes = { sm: { font:"0.65rem", pad:"2px 6px", radius:"3px" }, md: { font:"0.85rem", pad:"4px 10px", radius:"4px" }, lg: { font:"1.2rem", pad:"6px 14px", radius:"6px" } };
  const s = sizes[size];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Cinzel',serif", fontWeight: 900, fontSize: s.font,
      padding: s.pad, borderRadius: s.radius,
      background: isS ? `linear-gradient(135deg, rgba(212,168,67,0.15), rgba(240,192,96,0.1))` : `rgba(140,110,255,0.1)`,
      border: `1px solid ${isS ? "rgba(212,168,67,0.4)" : "rgba(140,110,255,0.3)"}`,
      color: color,
      boxShadow: isS ? `0 0 8px rgba(212,168,67,0.2)` : undefined,
    }}>{rank}</span>
  );
}

function ProgressBar({ value, max, color = "var(--purple)", height = 6 }) {
  const pct = Math.min(100, max > 0 ? (value/max)*100 : 0);
  return (
    <div style={{ height, background: "rgba(140,110,255,0.1)", borderRadius: height, overflow:"hidden" }}>
      <div style={{
        height: "100%", borderRadius: height,
        background: `linear-gradient(90deg, ${color}99, ${color})`,
        width: `${pct}%`, transition: "width 0.5s ease",
        position: "relative"
      }} />
    </div>
  );
}

function Dice({ value, rolling, settled, onClick, label, size = 80 }) {
  return (
    <div className="dice-container">
      <div
        className={`dice ${rolling ? "rolling" : ""} ${settled && !rolling ? "settled" : ""}`}
        style={{ width: size, height: size, fontSize: size * 0.35 }}
        onClick={onClick}
      >
        {rolling ? "?" : (value || "?")}
      </div>
      {label && <span style={{ fontSize: "0.75rem", color: "var(--text-dim)", textAlign:"center", letterSpacing:"0.06em" }}>{label}</span>}
    </div>
  );
}

function Collapsible({ header, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <div className="collapsible-header" onClick={() => setOpen(o => !o)}>
        <div>{header}</div>
        <span className={`collapsible-chevron ${open?"open":""}`}>▼</span>
      </div>
      {open && <div style={{ paddingTop: "0.25rem" }}>{children}</div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// PAGINA: HOME
// ═══════════════════════════════════════════════════════
function HomePage({ setPage }) {
  const stats = [
    { label:"Classi", val:"24", color:"var(--purple)", sub:"6 categorie × 4" },
    { label:"Frammenti", val:"36", color:"var(--gold)", sub:"6 gruppi × 6" },
    { label:"Razze", val:"6", color:"var(--flux)", sub:"con tratti unici" },
    { label:"Rank", val:"9", color:"var(--gold-bright)", sub:"F → SSS" },
  ];

  const features = [
    { icon:"📖", title:"Wiki Completa", desc:"24 classi con progressione Rank F→SSS, 36 Frammenti, 6 razze con tutti i dettagli meccanici.", action:() => setPage("wiki"), label:"Esplora" },
    { icon:"🎲", title:"Generatore PG", desc:"Tira i dadi, scegli classe e Frammento, aggiungi la razza. La scheda si compila automaticamente.", action:() => setPage("generator"), label:"Crea Personaggio" },
    { icon:"📊", title:"Tracker PA / PS", desc:"Tieni traccia dei Punti Avanzamento (Rank) e dei Punti Sogno (Skill) di tutti i tuoi personaggi.", action:() => setPage("tracker"), label:"Apri Tracker" },
  ];

  return (
    <div className="anim-fade-in">
      <div className="hero">
        <div className="hero-title">CHAOS SYSTEM</div>
        <div className="hero-sub">Arcadia2099 · Sistema LUCID d20</div>
        <p style={{ color:"var(--text-dim)", maxWidth:540, margin:"0 auto 2.5rem", lineHeight:1.7, fontSize:"0.95rem" }}>
          Un mondo spezzato. Una bilancia senza piatti.<br/>
          Una storia da riscrivere — dal Rank F al Rank SSS.
        </p>
        <div style={{ display:"flex", gap:"0.75rem", justifyContent:"center", flexWrap:"wrap" }}>
          <button className="btn btn-gold" onClick={() => setPage("generator")}>🎲 Crea Personaggio</button>
          <button className="btn btn-primary" onClick={() => setPage("wiki")}>📖 Esplora Wiki</button>
          <button className="btn btn-outline" onClick={() => setPage("tracker")}>📊 Tracker</button>
        </div>
      </div>

      {/* Stats rapide */}
      <div className="grid-4" style={{ marginBottom: "2.5rem" }}>
        {stats.map(s => (
          <div key={s.label} className="card" style={{ padding:"1.2rem 1.5rem", textAlign:"center" }}>
            <div style={{ fontFamily:"'Cinzel',serif", fontSize:"2.5rem", fontWeight:900, color:s.color, lineHeight:1 }}>{s.val}</div>
            <div style={{ fontFamily:"'Cinzel',serif", fontSize:"0.9rem", color:"var(--text-bright)", marginTop:"0.25rem" }}>{s.label}</div>
            <div style={{ fontSize:"0.75rem", color:"var(--text-dim)", marginTop:"0.2rem" }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Features */}
      <div className="grid-3" style={{ marginBottom: "2.5rem" }}>
        {features.map(f => (
          <div key={f.title} className="card" style={{ padding:"1.5rem", display:"flex", flexDirection:"column", gap:"0.75rem" }}>
            <div style={{ fontSize:"2.2rem" }}>{f.icon}</div>
            <div>
              <div style={{ fontFamily:"'Cinzel',serif", fontWeight:700, fontSize:"1.05rem", color:"var(--text-bright)", marginBottom:"0.4rem" }}>{f.title}</div>
              <p style={{ color:"var(--text-dim)", fontSize:"0.85rem", lineHeight:1.6 }}>{f.desc}</p>
            </div>
            <button className="btn btn-outline" style={{ alignSelf:"flex-start", marginTop:"auto" }} onClick={f.action}>{f.label} →</button>
          </div>
        ))}
      </div>

      {/* Lore snippet */}
      <div style={{ background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:10, padding:"2rem", marginBottom:"2rem" }}>
        <div className="section-title" style={{ marginBottom:"1rem" }}>Il Mondo</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(280px, 1fr))", gap:"1.5rem" }}>
          {[
            { title:"Il Flusso", text:"Non è magia. Non è scienza. È la linfa narrativa del mondo — un'energia viva capace di plasmare realtà, alterare emozioni e riscrivere la materia.", color:"var(--flux)" },
            { title:"I Tre Pandora", text:"Tre eventi catastrofici che hanno spezzato l'equilibrio cosmico. Il Terzo Pandora ha frantumato definitivamente il Creatore, i cui Frammenti dormono ora in ogni PG.", color:"var(--gold)" },
            { title:"I Frammenti del Creatore", text:"Al Rank S il Frammento si risveglia. Il personaggio non è più un semplice avventuriero — è una nuova bilancia in un mondo senza Creatore.", color:"var(--purple)" },
            { title:"Le 8 Grandi Fazioni", text:"Saint of Cosmos, Lullaby, Lions and Blood, Shadows, M.A.F.I.A., Unity Army, Nova Era, Discepoli del Frammento Oscuro. Ognuna è un sistema di progressione con 5 gradi di Reputazione.", color:"#e05050" },
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
              padding:"0.5rem 1rem", borderRadius:6, border:`1px solid ${getRankColor(r)}40`,
              background:`${getRankColor(r)}10`, display:"flex", flexDirection:"column", alignItems:"center", gap:"0.2rem"
            }}>
              <RankBadge rank={r} size="sm" />
              <span style={{ fontSize:"0.68rem", color:"var(--text-dim)", textAlign:"center", maxWidth:80 }}>{RANK_TITOLI[r]}</span>
              <span style={{ fontSize:"0.65rem", color:"var(--text-dim)", opacity:0.7 }}>{RANK_PA[r]} PA</span>
            </div>
          ))}
        </div>
      </div>

      {/* Fazioni overview */}
      <div style={{ background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:10, padding:"1.5rem" }}>
        <div className="section-title" style={{ marginBottom:"0.5rem" }}>Le 8 Grandi Fazioni</div>
        <p style={{ color:"var(--text-dim)", fontSize:"0.82rem", marginBottom:"1rem" }}>Ogni Fazione è un sistema di progressione. Guadagna Reputazione Fazione (RF) per sbloccare benefici esclusivi — da Simpatizzante a Leggenda.</p>
        <div style={{ display:"flex", flexWrap:"wrap", gap:"0.5rem" }}>
          {FAZIONI.map(faz => (
            <div key={faz.sigla} style={{
              padding:"0.5rem 0.9rem", borderRadius:6,
              border:`1px solid ${faz.color}40`, background:`${faz.color}0d`,
              display:"flex", alignItems:"center", gap:"0.5rem"
            }}>
              <span style={{ fontSize:"1rem" }}>{faz.icon}</span>
              <div>
                <div style={{ fontFamily:"'Cinzel',serif", fontWeight:700, color:faz.color, fontSize:"0.75rem" }}>{faz.sigla}</div>
                <div style={{ fontSize:"0.65rem", color:"var(--text-dim)" }}>{faz.nome.split(" ").slice(0,2).join(" ")}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// WIKI — CLASSI DETAIL
// ═══════════════════════════════════════════════════════
function ClasseDetail({ classe, onClose }) {
  const color = CAT_COLORS[classe.cat];
  const glow = CAT_GLOW[classe.cat];
  const [activeRank, setActiveRank] = useState("F");
  const [activeSkill, setActiveSkill] = useState(0);
  const stats = ["FOR","AGI","RES","INT","PER","CAR"];
  const statVals = [classe.FOR,classe.AGI,classe.RES,classe.INT,classe.PER,classe.CAR];
  const primStat = stats[statVals.indexOf(Math.max(...statVals))];

  const ps_soglie = [0,20,70,170,370];
  const sk = classe.skills[activeSkill];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{
          padding:"1.5rem 2rem",
          background:`linear-gradient(135deg, ${color}18 0%, transparent 60%)`,
          borderBottom:"1px solid var(--border)",
          position:"relative"
        }}>
          <button onClick={onClose} style={{ position:"absolute", top:"1rem", right:"1rem", background:"none", border:"none", color:"var(--text-dim)", cursor:"pointer", fontSize:"1.2rem" }}>✕</button>
          <div style={{ display:"flex", alignItems:"center", gap:"1rem", marginBottom:"0.75rem" }}>
            <span style={{ fontSize:"2.5rem" }}>{classe.icon}</span>
            <div>
              <div style={{ fontFamily:"'Cinzel',serif", fontSize:"1.5rem", fontWeight:700, color:"var(--text-bright)" }}>{classe.nome}</div>
              <div style={{ color:glow, fontSize:"0.85rem", marginTop:"0.2rem" }}>{classe.flavor}</div>
            </div>
          </div>
          <p style={{ color:"var(--text-dim)", fontSize:"0.88rem", lineHeight:1.65, maxWidth:600 }}>{classe.desc}</p>
        </div>

        {/* Contenuto */}
        <div style={{ padding:"1.5rem 2rem" }}>
          {/* Stats */}
          <div style={{ marginBottom:"1.5rem" }}>
            <div className="section-title" style={{ marginBottom:"0.75rem" }}>Caratteristiche Base</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:"0.5rem", marginBottom:"0.75rem" }}>
              {stats.map((s,i) => <StatBubble key={s} name={s} value={statVals[i]} highlight={s===primStat} />)}
            </div>
            <div style={{ display:"flex", gap:"1rem", flexWrap:"wrap" }}>
              {[
                { label:"HP Rank F", val:classe.hp, color:"var(--danger)" },
                { label:"Flusso Rank F", val:classe.fl, color:"var(--flux)" },
                { label:"Difesa", val:classe.dif, color:"var(--purple)" },
                { label:"Velocità", val:classe.vel, color:"var(--gold)" },
                { label:"Dado Vita", val:classe.dado, color:"var(--text)" },
              ].map(s => (
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
                      <th key={h} style={{ padding:"0.4rem 0.6rem", color:"var(--text-dim)", fontWeight:600, textAlign:"center", letterSpacing:"0.05em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {RANKS.map(r => {
                    const isS = ["S","SS","SSS"].includes(r);
                    return (
                      <tr key={r}
                        onClick={() => setActiveRank(r)}
                        style={{
                          background: r===activeRank ? `${color}18` : isS ? "rgba(212,168,67,0.03)" : undefined,
                          borderBottom:"1px solid rgba(140,110,255,0.06)",
                          cursor:"pointer",
                          transition:"background 0.15s"
                        }}>
                        <td style={{ padding:"0.5rem 0.6rem", textAlign:"center" }}><RankBadge rank={r} size="sm" /></td>
                        <td style={{ padding:"0.5rem 0.6rem", color:"var(--text-dim)", fontSize:"0.75rem" }}>{RANK_TITOLI[r]}</td>
                        <td style={{ padding:"0.5rem 0.6rem", textAlign:"center", color:"var(--gold)", fontFamily:"'Cinzel',serif", fontWeight:700 }}>{RANK_PA[r]}</td>
                        <td style={{ padding:"0.5rem 0.6rem", textAlign:"center", color:"var(--danger)", fontWeight:700 }}>{rHP(classe.hp,r)}</td>
                        <td style={{ padding:"0.5rem 0.6rem", textAlign:"center", color:"var(--flux)", fontWeight:700 }}>{rFL(classe.fl,r)}</td>
                        <td style={{ padding:"0.5rem 0.6rem", textAlign:"center", color:"var(--purple)", fontWeight:700 }}>{rDIF(classe.dif,r)}</td>
                        <td style={{ padding:"0.5rem 0.6rem", textAlign:"center", color:"var(--text-dim)" }}>{classe.vel}</td>
                      </tr>
                    );
                  })}
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
                  border: `1px solid ${i===activeSkill ? color : "var(--border)"}`,
                  color: i===activeSkill ? "var(--text-bright)" : "var(--text-dim)",
                  borderRadius:6, padding:"0.4rem 0.75rem", cursor:"pointer",
                  fontSize:"0.8rem", fontFamily:"'Raleway',sans-serif", fontWeight:600,
                  transition:"all 0.2s",
                }}>{s.nome}</button>
              ))}
            </div>
            {sk && (
              <div style={{ background:`${color}08`, border:`1px solid ${color}30`, borderRadius:8, padding:"1.25rem" }}>
                <div style={{ display:"flex", alignItems:"center", gap:"0.75rem", marginBottom:"0.75rem" }}>
                  <div style={{ fontFamily:"'Cinzel',serif", fontWeight:700, color:"var(--text-bright)", fontSize:"1rem" }}>{sk.nome}</div>
                  <span style={{ background:`${color}20`, color:glow, border:`1px solid ${color}40`, borderRadius:4, padding:"2px 8px", fontSize:"0.72rem", fontWeight:700 }}>
                    {sk.costo} Flusso
                  </span>
                </div>
                <p style={{ color:"var(--text)", fontSize:"0.88rem", lineHeight:1.6, marginBottom:"1rem" }}>{sk.desc}</p>
                <div style={{ borderTop:"1px solid rgba(140,110,255,0.1)", paddingTop:"0.75rem" }}>
                  <div style={{ fontSize:"0.72rem", color:"var(--text-dim)", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:"0.5rem" }}>Progressione PS</div>
                  <div style={{ display:"flex", flexDirection:"column", gap:"0.35rem" }}>
                    {[sk.desc, sk.lv2, sk.lv3, sk.lv4, sk.lv5].map((eff, lv) => (
                      <div key={lv} style={{ display:"flex", gap:"0.75rem", alignItems:"flex-start" }}>
                        <div style={{
                          minWidth:22, height:22, borderRadius:"50%", border:`1px solid ${lv===4?"var(--gold)":"var(--border)"}`,
                          background: lv===4 ? "rgba(212,168,67,0.15)" : "transparent",
                          display:"flex", alignItems:"center", justifyContent:"center",
                          fontFamily:"'Cinzel',serif", fontSize:"0.65rem", fontWeight:700,
                          color: lv===4 ? "var(--gold)" : "var(--text-dim)",
                          flexShrink:0, marginTop:2
                        }}>{lv+1}</div>
                        <div>
                          <span style={{ fontSize:"0.7rem", color:"var(--text-dim)", marginRight:"0.4rem" }}>
                            {lv===0 ? "(base)" : `${ps_soglie[lv]} PS`}
                          </span>
                          <span style={{ fontSize:"0.82rem", color: lv===4 ? "var(--gold)" : "var(--text-dim)" }}>{eff}</span>
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
// WIKI — FRAMMENTO DETAIL
// ═══════════════════════════════════════════════════════
function FrammentoDetail({ frammento, onClose }) {
  const gruppoColor = ["","var(--gold)","var(--purple)","var(--flux)","var(--danger)","var(--success)","#c060ff"][frammento.gruppo];
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth:600 }} onClick={e => e.stopPropagation()}>
        <div style={{ padding:"1.5rem 2rem", borderBottom:"1px solid var(--border)", background:`linear-gradient(135deg, ${gruppoColor}12, transparent)` }}>
          <button onClick={onClose} style={{ float:"right", background:"none", border:"none", color:"var(--text-dim)", cursor:"pointer", fontSize:"1.2rem" }}>✕</button>
          <div className="section-title" style={{ color:gruppoColor, marginBottom:"0.4rem" }}>Gruppo {frammento.gruppo} — {GRUPPI_FRAMMENTI[frammento.gruppo-1].nome}</div>
          <div style={{ fontFamily:"'Cinzel',serif", fontSize:"1.4rem", fontWeight:700, color:"var(--text-bright)", marginBottom:"0.3rem" }}>{frammento.nome}</div>
          <div style={{ color:"var(--text-dim)", fontSize:"0.82rem" }}>{frammento.fonte}</div>
        </div>
          <div style={{ padding:"1.5rem 2rem" }}>
          <div style={{ fontStyle:"italic", color:"var(--text-dim)", fontSize:"0.88rem", lineHeight:1.65, marginBottom:"1.25rem", borderLeft:`2px solid ${gruppoColor}60`, paddingLeft:"1rem" }}>
            "{frammento.flavor}"
          </div>
          <div style={{ background:`${gruppoColor}0a`, border:`1px solid ${gruppoColor}25`, borderRadius:8, padding:"1.25rem", marginBottom:"1rem" }}>
            <div style={{ fontSize:"0.72rem", color:"var(--text-dim)", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:"0.75rem" }}>Meccanica Completa</div>
            <p style={{ color:"var(--text)", fontSize:"0.9rem", lineHeight:1.7 }}>{frammento.mec}</p>
          </div>
          {AU_MAP[frammento.nome] && (
            <div style={{ background:"rgba(212,168,67,0.05)", border:"1px solid rgba(212,168,67,0.3)", borderRadius:8, padding:"1.25rem" }}>
              <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", marginBottom:"0.75rem" }}>
                <span style={{ fontSize:"0.72rem", color:"var(--gold)", textTransform:"uppercase", letterSpacing:"0.1em", fontWeight:700 }}>✦ AU — Abilità Unica (si sblocca al Rank S)</span>
              </div>
              <div style={{ fontFamily:"'Cinzel',serif", fontWeight:700, color:"var(--gold)", fontSize:"0.95rem", marginBottom:"0.5rem" }}>{AU_MAP[frammento.nome].nome}</div>
              <p style={{ color:"var(--text)", fontSize:"0.88rem", lineHeight:1.7 }}>{AU_MAP[frammento.nome].desc}</p>
              <div style={{ marginTop:"0.75rem", fontSize:"0.75rem", color:"var(--text-dim)", fontStyle:"italic" }}>1 uso gratuito per sessione. Usi aggiuntivi: 3 Scintille ciascuno.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// PAGINA: WIKI
// ═══════════════════════════════════════════════════════
function WikiPage() {
  const [tab, setTab] = useState("classi");
  const [selectedClasse, setSelectedClasse] = useState(null);
  const [selectedFrammento, setSelectedFrammento] = useState(null);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState(0);
  const [gruppoFilter, setGruppoFilter] = useState(0);

  const tabs = [
    { id:"classi", label:"Classi", count:24 },
    { id:"frammenti", label:"Frammenti", count:36 },
    { id:"razze", label:"Razze", count:6 },
    { id:"rank", label:"Rank & PA", count:9 },
    { id:"fazioni", label:"Fazioni", count:8 },
  ];

  const filteredClassi = CLASSI.filter(c =>
    (catFilter === 0 || c.cat === catFilter) &&
    (search === "" || c.nome.toLowerCase().includes(search.toLowerCase()) || c.flavor.toLowerCase().includes(search.toLowerCase()))
  );

  const filteredFrammenti = FRAMMENTI.filter(f =>
    (gruppoFilter === 0 || f.gruppo === gruppoFilter) &&
    (search === "" || f.nome.toLowerCase().includes(search.toLowerCase()) || f.fonte.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="anim-fade-in">
      <div style={{ marginBottom:"2rem" }}>
        <div className="section-title">Database</div>
        <div className="page-title">Wiki di Arkadia2099</div>
        <p className="page-subtitle">Esplora le 24 classi, i 36 Frammenti del Creatore, le 6 razze, il sistema di Rank e le 8 Grandi Fazioni di Arkadia2099.</p>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:"0.5rem", marginBottom:"1.5rem", borderBottom:"1px solid var(--border)", paddingBottom:"0" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setSearch(""); }} style={{
            background:"none", border:"none", cursor:"pointer", fontFamily:"'Raleway',sans-serif",
            fontWeight:700, fontSize:"0.85rem", letterSpacing:"0.06em", textTransform:"uppercase",
            padding:"0.6rem 1rem", color: tab===t.id ? "var(--purple)" : "var(--text-dim)",
            borderBottom: tab===t.id ? "2px solid var(--purple)" : "2px solid transparent",
            marginBottom:"-1px", transition:"all 0.2s"
          }}>
            {t.label}
            <span style={{ marginLeft:"0.4rem", fontSize:"0.7rem", opacity:0.7 }}>({t.count})</span>
          </button>
        ))}
      </div>

      {/* Search + filter */}
      <div style={{ display:"flex", gap:"0.75rem", marginBottom:"1.5rem", flexWrap:"wrap" }}>
        <input className="input-field" placeholder="Cerca..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth:280 }} />
        {tab === "classi" && (
          <div style={{ display:"flex", gap:"0.4rem", flexWrap:"wrap" }}>
            <button onClick={() => setCatFilter(0)} className="btn btn-outline" style={{ padding:"0.4rem 0.8rem", fontSize:"0.78rem", color: catFilter===0?"var(--purple)":"var(--text-dim)", borderColor: catFilter===0?"var(--purple)":"var(--border)" }}>Tutte</button>
            {CATEGORIE.map(c => (
              <button key={c.id} onClick={() => setCatFilter(c.id)} className="btn btn-outline" style={{
                padding:"0.4rem 0.8rem", fontSize:"0.78rem",
                color: catFilter===c.id ? "var(--text-bright)" : "var(--text-dim)",
                borderColor: catFilter===c.id ? CAT_COLORS[c.id] : "var(--border)",
                background: catFilter===c.id ? `${CAT_COLORS[c.id]}18` : "transparent",
              }}>{c.id}. {c.nome.split(" ")[0]}</button>
            ))}
          </div>
        )}
        {tab === "frammenti" && (
          <div style={{ display:"flex", gap:"0.4rem", flexWrap:"wrap" }}>
            <button onClick={() => setGruppoFilter(0)} className="btn btn-outline" style={{ padding:"0.4rem 0.8rem", fontSize:"0.78rem", color: gruppoFilter===0?"var(--gold)":"var(--text-dim)", borderColor: gruppoFilter===0?"var(--gold)":"var(--border)" }}>Tutti</button>
            {GRUPPI_FRAMMENTI.map(g => (
              <button key={g.id} onClick={() => setGruppoFilter(g.id)} className="btn btn-outline" style={{
                padding:"0.4rem 0.8rem", fontSize:"0.78rem",
                color: gruppoFilter===g.id ? "var(--gold-bright)" : "var(--text-dim)",
                borderColor: gruppoFilter===g.id ? "var(--gold)" : "var(--border)",
                background: gruppoFilter===g.id ? "rgba(212,168,67,0.1)" : "transparent",
              }}>{g.id}. {g.nome}</button>
            ))}
          </div>
        )}
      </div>

      {/* TAB: CLASSI */}
      {tab === "classi" && (
        <div>
          {CATEGORIE.filter(c => catFilter===0 || c.id===catFilter).map(cat => {
            const classi = filteredClassi.filter(c => c.cat===cat.id);
            if (classi.length === 0) return null;
            return (
              <div key={cat.id} style={{ marginBottom:"2rem" }}>
                <div className="cat-header" style={{ background:`${CAT_COLORS[cat.id]}10`, border:`1px solid ${CAT_COLORS[cat.id]}30` }}>
                  <span className="cat-number" style={{ color:CAT_COLORS[cat.id] }}>{cat.id}</span>
                  <div>
                    <div style={{ fontFamily:"'Cinzel',serif", fontWeight:700, color:"var(--text-bright)", fontSize:"1.05rem" }}>{cat.nome}</div>
                    <div style={{ color:"var(--text-dim)", fontSize:"0.8rem" }}>{cat.desc}</div>
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
                        {[{l:"HP",v:c.hp,col:"var(--danger)"},{l:"Flusso",v:c.fl,col:"var(--flux)"},{l:"Dif",v:c.dif,col:"var(--purple)"}].map(s => (
                          <div key={s.l} style={{ textAlign:"center" }}>
                            <div style={{ fontSize:"0.6rem", color:"var(--text-dim)", textTransform:"uppercase" }}>{s.l}</div>
                            <div style={{ fontFamily:"'Cinzel',serif", fontWeight:700, color:s.col, fontSize:"1rem" }}>{s.v}</div>
                          </div>
                        ))}
                        <div style={{ textAlign:"center" }}>
                          <div style={{ fontSize:"0.6rem", color:"var(--text-dim)", textTransform:"uppercase" }}>Dado</div>
                          <div style={{ fontFamily:"'Cinzel',serif", fontWeight:700, color:"var(--gold)", fontSize:"1rem" }}>{c.dado}</div>
                        </div>
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

      {/* TAB: FRAMMENTI */}
      {tab === "frammenti" && (
        <div>
          {GRUPPI_FRAMMENTI.filter(g => gruppoFilter===0 || g.id===gruppoFilter).map(gruppo => {
            const frammenti = filteredFrammenti.filter(f => f.gruppo===gruppo.id);
            if (frammenti.length===0) return null;
            const gruppoColor = ["","var(--gold)","var(--purple)","var(--flux)","var(--danger)","var(--success)","#c060ff"][gruppo.id];
            return (
              <div key={gruppo.id} style={{ marginBottom:"2rem" }}>
                <div style={{ display:"flex", alignItems:"center", gap:"0.75rem", marginBottom:"0.75rem", padding:"0.6rem 1rem", background:`${gruppoColor}0d`, border:`1px solid ${gruppoColor}25`, borderRadius:6 }}>
                  <span style={{ fontFamily:"'Cinzel',serif", fontSize:"1.5rem", fontWeight:900, color:gruppoColor }}>{gruppo.id}</span>
                  <div>
                    <div style={{ fontFamily:"'Cinzel',serif", fontWeight:700, color:"var(--text-bright)" }}>Frammenti {gruppo.nome}</div>
                    <div style={{ color:"var(--text-dim)", fontSize:"0.78rem" }}>{gruppo.desc}</div>
                  </div>
                </div>
                <div className="grid-auto">
                  {frammenti.map(f => (
                    <div key={f.nome} className="card" style={{ padding:"1.1rem", cursor:"pointer" }} onClick={() => setSelectedFrammento(f)}>
                      <div style={{ fontFamily:"'Cinzel',serif", fontWeight:700, color:"var(--text-bright)", marginBottom:"0.3rem", fontSize:"0.9rem" }}>{f.nome}</div>
                      <div style={{ fontSize:"0.72rem", color:gruppoColor, marginBottom:"0.5rem" }}>{f.fonte}</div>
                      <p style={{ fontSize:"0.8rem", color:"var(--text-dim)", lineHeight:1.55, fontStyle:"italic", marginBottom:"0.75rem" }}>"{f.flavor}"</p>
                      <div style={{ background:`${gruppoColor}0a`, border:`1px solid ${gruppoColor}20`, borderRadius:5, padding:"0.5rem 0.75rem", fontSize:"0.78rem", color:"var(--text)", lineHeight:1.5 }}>
                        {f.mec_breve}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB: RAZZE */}
      {tab === "razze" && (
        <div className="grid-auto">
          {RAZZE.filter(r => search==="" || r.nome.toLowerCase().includes(search.toLowerCase())).map(r => (
            <div key={r.nome} className="card" style={{ padding:"1.5rem", borderTop:`3px solid ${r.color}` }}>
              <div style={{ fontFamily:"'Cinzel',serif", fontWeight:700, fontSize:"1.1rem", color:"var(--text-bright)", marginBottom:"0.2rem" }}>{r.nome}</div>
              <div style={{ fontSize:"0.78rem", color:r.color, marginBottom:"0.75rem", fontStyle:"italic" }}>{r.flavor}</div>
              <div style={{ background:"rgba(140,110,255,0.06)", border:"1px solid var(--border)", borderRadius:5, padding:"0.5rem 0.75rem", fontSize:"0.78rem", color:"var(--gold)", marginBottom:"0.75rem", fontWeight:600 }}>{r.bonus}</div>
              <div style={{ marginBottom:"0.5rem" }}>
                <div style={{ fontSize:"0.68rem", color:"var(--text-dim)", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:"0.3rem" }}>Tratto 1</div>
                <p style={{ fontSize:"0.82rem", color:"var(--text)", lineHeight:1.55 }}>{r.tratto1}</p>
              </div>
              <div style={{ marginBottom:"0.5rem" }}>
                <div style={{ fontSize:"0.68rem", color:"var(--text-dim)", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:"0.3rem" }}>Tratto 2</div>
                <p style={{ fontSize:"0.82rem", color:"var(--text)", lineHeight:1.55 }}>{r.tratto2}</p>
              </div>
              <div style={{ background:"rgba(224,80,80,0.06)", border:"1px solid rgba(224,80,80,0.2)", borderRadius:5, padding:"0.5rem 0.75rem", fontSize:"0.78rem", color:"var(--danger)", lineHeight:1.5 }}>
                ⚠ {r.malus}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB: RANK */}
      {tab === "rank" && (
        <div style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
          <div style={{ background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:10, padding:"1.5rem", marginBottom:"0.5rem" }}>
            <div className="section-title" style={{ marginBottom:"0.75rem" }}>Sistema PA — Punti Avanzamento</div>
            <p style={{ color:"var(--text-dim)", fontSize:"0.88rem", lineHeight:1.65 }}>
              I PA si <strong style={{ color:"var(--text)" }}>accumulano soltanto</strong> — non si spendono mai. Quando raggiungi la soglia di un Rank, sali automaticamente. Non devi fare nulla.
            </p>
          </div>
          {RANKS.map((r, i) => {
            const col = getRankColor(r);
            const isS = ["S","SS","SSS"].includes(r);
            const paNeeded = i > 0 ? RANK_PA[r] - RANK_PA[RANKS[i-1]] : 0;
            const sessioni = paNeeded > 0 ? Math.ceil(paNeeded/75) : 0;
            const SBLOCCHI = {
              F:"Punto di partenza. 3 Skill base + 1 Skill Generale. 3 Scintille del Creatore.",
              E:"Accesso zone avanzate. Skill a Lv PS 2 disponibile. +1 Scintilla max.",
              D:"Sfida di Rank richiesta per avanzare. Zone PvP aperte. Frammento si agita.",
              C:"Zone avanzate. Skill a Lv PS 3. Ibridazione Skill (costo ×2 PS).",
              B:"Skill a Lv PS 4. Frammento: effetti migliorati. +1 Scintilla max.",
              A:"Skill a Lv PS 5 (forma finale). Zone leggendarie. Territorio piccolo.",
              S:"IL FRAMMENTO SI RISVEGLIA. Poteri narrativi unici. Inizio Rank S.",
              SS:"Poteri semi-divini. Il mondo reagisce alla tua presenza.",
              SSS:"Solo per campagne leggendarie. Il GM gestisce caso per caso.",
            };
            return (
              <div key={r} style={{
                background: isS ? `linear-gradient(135deg, rgba(212,168,67,0.05), var(--bg-card))` : "var(--bg-card)",
                border: `1px solid ${isS ? "rgba(212,168,67,0.3)" : "var(--border)"}`,
                borderLeft: `4px solid ${col}`,
                borderRadius:8, padding:"1.25rem 1.5rem",
                boxShadow: isS ? `0 0 16px rgba(212,168,67,0.08)` : undefined,
              }}>
                <div style={{ display:"flex", alignItems:"flex-start", gap:"1.5rem", flexWrap:"wrap" }}>
                  <div style={{ minWidth:80, textAlign:"center" }}>
                    <RankBadge rank={r} size="lg" />
                    <div style={{ fontSize:"0.7rem", color:"var(--text-dim)", marginTop:"0.3rem" }}>{RANK_TITOLI[r]}</div>
                  </div>
                  <div style={{ flex:1, minWidth:200 }}>
                    <div style={{ display:"flex", gap:"1.5rem", marginBottom:"0.5rem", flexWrap:"wrap" }}>
                      <div>
                        <div style={{ fontSize:"0.65rem", color:"var(--text-dim)", textTransform:"uppercase", letterSpacing:"0.1em" }}>PA totali</div>
                        <div style={{ fontFamily:"'Cinzel',serif", fontWeight:700, color:"var(--gold)", fontSize:"1.1rem" }}>{RANK_PA[r]}</div>
                      </div>
                      {paNeeded > 0 && (
                        <div>
                          <div style={{ fontSize:"0.65rem", color:"var(--text-dim)", textTransform:"uppercase", letterSpacing:"0.1em" }}>DA guadagnare</div>
                          <div style={{ fontFamily:"'Cinzel',serif", fontWeight:700, color:col, fontSize:"1.1rem" }}>+{paNeeded}</div>
                        </div>
                      )}
                      {sessioni > 0 && (
                        <div>
                          <div style={{ fontSize:"0.65rem", color:"var(--text-dim)", textTransform:"uppercase", letterSpacing:"0.1em" }}>Sessioni stimate</div>
                          <div style={{ fontFamily:"'Cinzel',serif", fontWeight:700, color:"var(--text-dim)", fontSize:"1.1rem" }}>~{sessioni}</div>
                        </div>
                      )}
                    </div>
                    <p style={{ fontSize:"0.85rem", color:"var(--text-dim)", lineHeight:1.6 }}>{SBLOCCHI[r]}</p>
                  </div>
                </div>
              </div>
            );
          })}

          {/* PS system */}
          <div style={{ background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:10, padding:"1.5rem", marginTop:"0.5rem" }}>
            <div className="section-title" style={{ marginBottom:"1rem" }}>Sistema PS — Punti Sogno (per le Skill)</div>
            <p style={{ color:"var(--text-dim)", fontSize:"0.85rem", lineHeight:1.65, marginBottom:"1.25rem" }}>
              I PS si guadagnano <strong style={{ color:"var(--text)" }}>solo usando le Skill in situazioni reali</strong>. Ogni Skill ha un proprio contatore PS separato. Non si spendono — si accumulano e le soglie si superano automaticamente.
            </p>
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"0.85rem" }}>
                <thead>
                  <tr style={{ borderBottom:"1px solid var(--border)" }}>
                    {["Lv Skill","PS totali","PS da guadagnare","Effetto"].map(h => (
                      <th key={h} style={{ padding:"0.5rem 0.75rem", color:"var(--text-dim)", fontWeight:600, textAlign:"left", fontSize:"0.75rem", letterSpacing:"0.08em", textTransform:"uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    {lv:1,ps:0,diff:"—",eff:"Forma base — funziona come descritto"},
                    {lv:2,ps:20,diff:"+20",eff:"+1 dado danno OPPURE –1 costo Flusso (scegli)"},
                    {lv:3,ps:70,diff:"+50",eff:"Sblocca l'effetto secondario unico della Skill"},
                    {lv:4,ps:170,diff:"+100",eff:"Effetto base aumentato. –1 costo Flusso aggiuntivo"},
                    {lv:5,ps:370,diff:"+200",eff:"FORMA FINALE. Costo Flusso al minimo (1). Effetto trasformativo."},
                  ].map(row => (
                    <tr key={row.lv} style={{ borderBottom:"1px solid rgba(140,110,255,0.06)", background: row.lv===5 ? "rgba(212,168,67,0.04)" : undefined }}>
                      <td style={{ padding:"0.6rem 0.75rem" }}>
                        <span style={{
                          fontFamily:"'Cinzel',serif", fontWeight:700, fontSize:"0.9rem",
                          color: row.lv===5 ? "var(--gold)" : "var(--purple)"
                        }}>Lv {row.lv}</span>
                      </td>
                      <td style={{ padding:"0.6rem 0.75rem", color:"var(--text-dim)", fontFamily:"'Cinzel',serif" }}>{row.ps}</td>
                      <td style={{ padding:"0.6rem 0.75rem", color:"var(--flux)", fontWeight:600 }}>{row.diff}</td>
                      <td style={{ padding:"0.6rem 0.75rem", color: row.lv===5 ? "var(--gold)" : "var(--text-dim)", fontSize:"0.83rem" }}>{row.eff}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {selectedClasse && <ClasseDetail classe={selectedClasse} onClose={() => setSelectedClasse(null)} />}
      {selectedFrammento && <FrammentoDetail frammento={selectedFrammento} onClose={() => setSelectedFrammento(null)} />}

      {/* TAB: FAZIONI */}
      {tab === "fazioni" && (
        <div className="anim-slide-in">
          <div style={{ background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:10, padding:"1.25rem 1.5rem", marginBottom:"1.5rem" }}>
            <p style={{ color:"var(--text-dim)", fontSize:"0.88rem", lineHeight:1.7 }}>
              Le Fazioni non sono semplici organizzazioni — sono linee di sangue, codici di sopravvivenza, tradizioni nate dalle cicatrici degli Eventi Pandora. La Reputazione Fazione (RF) si guadagna completando missioni e aiutando i membri. Puoi avere reputazione in più Fazioni simultaneamente.
            </p>
          </div>

          {/* Gradi Reputazione */}
          <div style={{ display:"flex", gap:"0.5rem", flexWrap:"wrap", marginBottom:"2rem" }}>
            {GRADI_REP.map(g => (
              <div key={g.nome} style={{
                background:"var(--bg-card)", border:`1px solid ${g.color}40`, borderRadius:8,
                padding:"0.6rem 1rem", textAlign:"center", flex:"1", minWidth:100
              }}>
                <div style={{ fontFamily:"'Cinzel',serif", fontWeight:700, color:g.color, fontSize:"0.85rem" }}>{g.nome}</div>
                <div style={{ fontSize:"0.7rem", color:"var(--text-dim)", marginTop:"0.2rem" }}>{g.rf === 0 ? "Inizio" : `${g.rf} RF`}</div>
              </div>
            ))}
          </div>

          {/* Schede Fazioni */}
          <div style={{ display:"flex", flexDirection:"column", gap:"1.5rem" }}>
            {FAZIONI.map(faz => (
              <FazioneCard key={faz.sigla} fazione={faz} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function FazioneCard({ fazione: faz }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      background:"var(--bg-card)", border:`1px solid ${faz.color}40`,
      borderLeft:`4px solid ${faz.color}`, borderRadius:10, overflow:"hidden"
    }}>
      <div style={{
        padding:"1.25rem 1.5rem", cursor:"pointer",
        background:`linear-gradient(135deg, ${faz.color}08, transparent)`,
      }} onClick={() => setOpen(!open)}>
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:"1rem" }}>
          <div style={{ flex:1 }}>
            <div style={{ display:"flex", alignItems:"center", gap:"0.75rem", marginBottom:"0.3rem" }}>
              <span style={{ fontSize:"1.4rem" }}>{faz.icon}</span>
              <div>
                <span style={{ fontFamily:"'Cinzel',serif", fontWeight:700, color:"var(--text-bright)", fontSize:"1.05rem" }}>{faz.nome}</span>
                <span style={{ marginLeft:"0.75rem", fontSize:"0.72rem", color:faz.color, background:`${faz.color}18`, border:`1px solid ${faz.color}30`, borderRadius:4, padding:"2px 8px" }}>{faz.sigla}</span>
              </div>
            </div>
            <div style={{ fontStyle:"italic", color:`${faz.color}cc`, fontSize:"0.82rem", marginBottom:"0.5rem" }}>{faz.motto}</div>
            <div style={{ display:"flex", gap:"1rem", flexWrap:"wrap", fontSize:"0.75rem" }}>
              <span style={{ color:"var(--text-dim)" }}>📍 {faz.zona}</span>
              <span style={{ color:"var(--danger)", opacity:0.8 }}>⚔ Nemici: {faz.nemico}</span>
            </div>
          </div>
          <span style={{ color:"var(--text-dim)", fontSize:"1.2rem", transition:"transform 0.2s", transform: open ? "rotate(180deg)" : "none" }}>▼</span>
        </div>
      </div>

      {open && (
        <div className="anim-slide-in" style={{ padding:"0 1.5rem 1.5rem" }}>
          <p style={{ color:"var(--text-dim)", fontSize:"0.88rem", lineHeight:1.7, marginBottom:"1.25rem", paddingTop:"0.75rem", borderTop:"1px solid var(--border)" }}>
            {faz.lore}
          </p>

          <div style={{ display:"flex", gap:"0.75rem", flexWrap:"wrap", marginBottom:"1.25rem" }}>
            <div style={{ background:`${faz.color}10`, border:`1px solid ${faz.color}25`, borderRadius:6, padding:"0.6rem 0.9rem", flex:1, minWidth:200 }}>
              <div style={{ fontSize:"0.65rem", color:"var(--text-dim)", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:"0.3rem" }}>Classi affini</div>
              <div style={{ fontSize:"0.82rem", color:"var(--text)", fontWeight:600 }}>{faz.classiAffini}</div>
            </div>
            <div style={{ background:"rgba(140,110,255,0.06)", border:"1px solid var(--border)", borderRadius:6, padding:"0.6rem 0.9rem", flex:1, minWidth:200 }}>
              <div style={{ fontSize:"0.65rem", color:"var(--text-dim)", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:"0.3rem" }}>Tipo di missioni</div>
              <div style={{ fontSize:"0.78rem", color:"var(--text-dim)", lineHeight:1.6 }}>{faz.missioni}</div>
            </div>
          </div>

          {/* Benefici per grado */}
          <div style={{ marginBottom:"0.5rem" }}>
            <div style={{ fontSize:"0.72rem", color:"var(--text-dim)", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:"0.75rem" }}>Benefici per grado di reputazione</div>
            <div style={{ display:"flex", flexDirection:"column", gap:"0.4rem" }}>
              {faz.benefici.map((b, i) => {
                const col = GRADI_REP[i+1]?.color || "var(--gold)";
                return (
                  <div key={b.grado} style={{ display:"flex", gap:"0.75rem", alignItems:"flex-start" }}>
                    <div style={{
                      minWidth:90, padding:"0.2rem 0.4rem", borderRadius:4,
                      background:`${col}18`, border:`1px solid ${col}30`,
                      fontSize:"0.7rem", fontWeight:700, color:col, textAlign:"center", flexShrink:0
                    }}>{b.grado}</div>
                    <div style={{ fontSize:"0.82rem", color:"var(--text-dim)", lineHeight:1.6, paddingTop:"0.15rem" }}>{b.desc}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// EXPORT PDF — usa window.print() con una finestra dedicata
// ═══════════════════════════════════════════════════════
function exportPDF(pg) {
  const c = pg.classe;
  const f = pg.frammento;
  const r = pg.razza;
  const au = AU_MAP[f.nome];
  const color = CAT_COLORS[c.cat] || "#534ab7";

  const html = `<!DOCTYPE html><html lang="it"><head>
<meta charset="UTF-8">
<title>Scheda — ${pg.nome}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Raleway:wght@400;500;600&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Raleway',sans-serif;background:#fff;color:#1a1a1a;font-size:9pt;line-height:1.4}
  @page{size:A4;margin:1.2cm}
  @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
  h1{font-family:'Cinzel',serif;font-size:18pt;font-weight:900;color:${color};margin-bottom:2px}
  h2{font-family:'Cinzel',serif;font-size:10pt;font-weight:700;color:${color};text-transform:uppercase;letter-spacing:.08em;margin:10px 0 4px;border-bottom:1px solid ${color}40;padding-bottom:2px}
  h3{font-family:'Cinzel',serif;font-size:9pt;font-weight:700;color:#333;margin-bottom:2px}
  .header{background:${color}12;border:1.5px solid ${color};border-radius:6px;padding:12px 16px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:flex-start}
  .header-left .sub{color:#555;font-size:8pt;margin-top:2px}
  .rank-badge{background:${color};color:#fff;font-family:'Cinzel',serif;font-weight:900;padding:6px 14px;border-radius:4px;font-size:14pt}
  .grid2{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px}
  .grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:8px}
  .box{background:#f5f5f5;border:1px solid #ddd;border-radius:4px;padding:8px 10px}
  .box-color{background:${color}0d;border:1px solid ${color}30;border-radius:4px;padding:8px 10px}
  .stat-row{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:6px}
  .stat{text-align:center;min-width:52px;background:#eee;border-radius:4px;padding:4px 6px}
  .stat .label{font-size:6.5pt;color:#777;text-transform:uppercase;letter-spacing:.06em}
  .stat .val{font-family:'Cinzel',serif;font-weight:900;font-size:13pt;color:${color}}
  .stat .mod{font-size:7pt;color:#555}
  .big-stat{text-align:center;background:${color}10;border:1px solid ${color}30;border-radius:4px;padding:6px 10px;min-width:60px}
  .big-stat .label{font-size:6.5pt;color:#777;text-transform:uppercase}
  .big-stat .val{font-family:'Cinzel',serif;font-weight:900;font-size:16pt;color:${color}}
  .skill{border-left:3px solid ${color};padding:6px 8px;margin-bottom:6px;background:#f9f9f9}
  .skill .name{font-family:'Cinzel',serif;font-weight:700;font-size:9pt}
  .skill .cost{display:inline-block;background:${color}18;border:1px solid ${color}30;border-radius:3px;padding:1px 6px;font-size:7pt;font-weight:700;color:${color};margin-left:6px}
  .skill .desc{font-size:8pt;color:#444;margin-top:2px}
  .lv-row{display:flex;gap:4px;margin-top:4px;flex-wrap:wrap}
  .lv{font-size:7pt;background:#eeebff;border-radius:3px;padding:1px 5px;color:#534ab7}
  .rank-table{width:100%;border-collapse:collapse;font-size:8pt;margin-top:4px}
  .rank-table th{background:${color};color:#fff;padding:3px 6px;text-align:center;font-weight:700}
  .rank-table td{padding:3px 6px;text-align:center;border-bottom:1px solid #eee}
  .rank-table tr:nth-child(even){background:#f5f5f5}
  .rank-table .rank-s{background:#fef3d0;font-weight:700}
  .au-box{background:#fef9e7;border:1.5px solid #d4a843;border-radius:6px;padding:10px 12px;margin-top:8px}
  .au-box .au-title{font-family:'Cinzel',serif;font-weight:700;color:#9a6f0a;font-size:9.5pt;margin-bottom:4px}
  .trackers{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-top:6px}
  .tracker-box{border:1px solid #ddd;border-radius:4px;padding:6px 8px}
  .tracker-box .label{font-size:7pt;color:#777;text-transform:uppercase;margin-bottom:2px}
  .tracker-box .line{height:24px;border-bottom:1px solid #ccc;margin-top:4px}
  .note-box{border:1px solid #ddd;border-radius:4px;padding:8px;min-height:60px;margin-top:6px}
  .fazione-row{display:flex;gap:6px;flex-wrap:wrap;margin-top:4px}
  .fazione-badge{border:1px solid #ccc;border-radius:3px;padding:2px 7px;font-size:7.5pt;color:#555}
  .ps-table{width:100%;border-collapse:collapse;font-size:8pt}
  .ps-table th{background:#333;color:#fff;padding:3px 6px;text-align:left}
  .ps-table td{padding:3px 6px;border-bottom:1px solid #eee}
  .ps-table tr:nth-child(even){background:#f5f5f5}
  .page-break{page-break-before:always}
  .footer{margin-top:10px;text-align:center;font-size:7pt;color:#aaa;border-top:1px solid #eee;padding-top:4px}
</style>
</head><body>

<!-- INTESTAZIONE -->
<div class="header">
  <div class="header-left">
    <h1>${pg.nome}</h1>
    <div class="sub">${c.icon} ${c.nome} &nbsp;·&nbsp; ${r.nome} &nbsp;·&nbsp; Rank F — ${RANK_TITOLI["F"]}</div>
    ${pg.background ? `<div class="sub" style="color:#8a6f00;margin-top:2px">Background: ${pg.background}</div>` : ""}
  </div>
  <div class="rank-badge">F</div>
</div>

<!-- STATISTICHE PRINCIPALI -->
<div class="grid2">
  <div>
    <h2>Caratteristiche</h2>
    <div class="stat-row">
      ${["FOR","AGI","RES","INT","PER","CAR"].map((s,i)=>{
        const vals=[c.FOR,c.AGI,c.RES,c.INT,c.PER,c.CAR];
        const v=vals[i]; const m=Math.floor((v-10)/2);
        return `<div class="stat"><div class="label">${s}</div><div class="val">${v}</div><div class="mod">${m>=0?"+":""}${m}</div></div>`;
      }).join("")}
    </div>
    <h2>Statistiche Rank F</h2>
    <div class="stat-row">
      <div class="big-stat"><div class="label">HP</div><div class="val">${pg.hp}</div></div>
      <div class="big-stat"><div class="label">Flusso</div><div class="val">${pg.fl}</div></div>
      <div class="big-stat"><div class="label">Difesa</div><div class="val">${pg.dif}</div></div>
      <div class="big-stat"><div class="label">Velocità</div><div class="val">${pg.vel}</div></div>
      <div class="big-stat"><div class="label">Scintille</div><div class="val">${pg.scintille}</div></div>
      <div class="big-stat"><div class="label">Dado</div><div class="val" style="font-size:11pt">${c.dado}</div></div>
    </div>
  </div>
  <div>
    <h2>Progressione Rank (PA)</h2>
    <table class="rank-table">
      <tr><th>Rank</th><th>Titolo</th><th>PA</th><th>HP</th><th>Flusso</th><th>Dif</th></tr>
      ${RANKS.map(rk=>{
        const isS=["S","SS","SSS"].includes(rk);
        const hp=Math.round(pg.hp*RANK_MHP[rk]);
        const fl=Math.round(pg.fl*RANK_MFL[rk]);
        const dif=pg.dif+RANK_BDIF[rk];
        return `<tr${isS?' class="rank-s"':''}><td><b>${rk}</b></td><td style="font-size:7pt">${RANK_TITOLI[rk]}</td><td>${RANK_PA[rk]}</td><td>${hp}</td><td>${fl}</td><td>${dif}</td></tr>`;
      }).join("")}
    </table>
  </div>
</div>

<!-- RAZZA -->
<h2>Razza — ${r.nome}</h2>
<div class="box-color">
  <div style="font-weight:700;color:#8a6f00;margin-bottom:3px">${r.bonus}</div>
  <div style="font-size:8pt;margin-bottom:2px"><b>Tratto 1:</b> ${r.tratto1}</div>
  <div style="font-size:8pt"><b>Tratto 2:</b> ${r.tratto2}</div>
  <div style="font-size:7.5pt;color:#c0392b;margin-top:3px">Malus: ${r.malus}</div>
</div>

<!-- SKILL -->
<h2>Skill Base</h2>
${c.skills.map(sk=>`
<div class="skill">
  <div><span class="name">${sk.nome}</span><span class="cost">${sk.costo} Flusso</span></div>
  <div class="desc">${sk.desc}</div>
  <div class="lv-row">
    <span class="lv">Lv2: ${sk.lv2}</span>
    <span class="lv">Lv3: ${sk.lv3}</span>
    <span class="lv">Lv4: ${sk.lv4}</span>
    <span class="lv" style="background:#fef3d0;color:#9a6f0a">Lv5 FINALE: ${sk.lv5}</span>
  </div>
</div>`).join("")}

<!-- FRAMMENTO -->
<h2>Frammento del Creatore</h2>
<div class="box-color">
  <h3>${f.nome} <span style="font-size:8pt;color:#777;font-weight:400">— ${f.fonte}</span></h3>
  <div style="font-style:italic;color:#555;font-size:8pt;margin:3px 0">"${f.flavor}"</div>
  <div style="font-size:8.5pt">${f.mec}</div>
</div>

${au ? `<div class="au-box">
  <div style="font-size:7.5pt;color:#9a6f0a;text-transform:uppercase;font-weight:700;margin-bottom:2px">✦ AU — Abilità Unica (si sblocca al Rank S)</div>
  <div class="au-title">${au.nome}</div>
  <div style="font-size:8.5pt">${au.desc}</div>
  <div style="font-size:7pt;color:#999;margin-top:3px">1 uso gratuito per sessione. Usi aggiuntivi: 3 Scintille ciascuno.</div>
</div>` : ""}

<!-- TRACKERS -->
<div class="page-break"></div>
<h1 style="font-size:14pt;margin-bottom:8px">${pg.nome} — Scheda di Gioco</h1>

<h2>Tracker PA (Punti Avanzamento)</h2>
<div class="box">
  <div style="font-size:8pt;margin-bottom:6px">PA attuali: _________ &nbsp;&nbsp; Rank attuale: _________ &nbsp;&nbsp; Prossimo Rank a: _________</div>
  <div style="font-size:7.5pt;color:#555">F→E: 100 | E→D: 300 | D→C: 700 | C→B: 1500 | B→A: 3000 | A→S: 6000 | S→SS: 12000 | SS→SSS: 25000</div>
</div>

<h2>Tracker Skill (PS — Punti Sogno)</h2>
<table class="ps-table">
  <tr><th>Skill</th><th>Lv Skill</th><th>PS totali</th><th>Prossima soglia</th><th>Note effetto attuale</th></tr>
  ${c.skills.map(sk=>`<tr><td><b>${sk.nome}</b></td><td style="text-align:center">_</td><td style="text-align:center">__</td><td style="text-align:center">Lv2=20 / Lv3=70 / Lv4=170 / Lv5=370</td><td></td></tr>`).join("")}
  <tr><td><i>Skill extra 1</i></td><td></td><td></td><td></td><td></td></tr>
  <tr><td><i>Skill extra 2</i></td><td></td><td></td><td></td><td></td></tr>
</table>

<h2>Scintille del Creatore</h2>
<div class="box">
  <div style="font-size:8pt;margin-bottom:4px">Scintille: ${pg.scintille} (max 10) &nbsp;&nbsp; Attualmente: ___</div>
  <div style="font-size:7.5pt;color:#555">1✦=Ritiro dado | 1✦=Impulso narrativo | 2✦=Sopravvivi a 0HP | 3✦=Attivazione extra Frammento | 2✦=Eco del Caos (+1d10) | 1✦=Memoria del Flusso</div>
</div>

<h2>Fazione & Reputazione</h2>
<div class="box">
  <div style="font-size:8pt;margin-bottom:4px">Fazione principale: ___________________________ &nbsp;&nbsp; RF: ____</div>
  <div class="fazione-row">
    ${FAZIONI.map(faz=>`<div class="fazione-badge">${faz.icon} ${faz.sigla}: ____</div>`).join("")}
  </div>
  <div style="font-size:7pt;color:#777;margin-top:4px">Gradi: Sconosciuto(0) → Simpatizzante(20) → Membro(60) → Fidato(150) → Capitano(350) → Leggenda(700)</div>
</div>

<h2>Equipaggiamento & Note</h2>
<div class="note-box"></div>

<h2>Background & Storia</h2>
<div class="note-box" style="min-height:80px"></div>

<div class="footer">Chaos System Arkadia2099 v7 · ${pg.nome} · Generato su arkadia2099.vercel.app</div>
</body></html>`;

  const w = window.open("", "_blank", "width=900,height=700");
  w.document.write(html);
  w.document.close();
  w.onload = () => { w.focus(); w.print(); };
}

// ═══════════════════════════════════════════════════════
// PAGINA: GENERATORE PG
// ═══════════════════════════════════════════════════════
function GeneratorePage({ saveToTracker, setPage }) {
  const [step, setStep] = useState(0);
  const [catRoll, setCatRoll] = useState(null);
  const [grpRoll, setGrpRoll] = useState(null);
  const [rolling1, setRolling1] = useState(false);
  const [rolling2, setRolling2] = useState(false);
  const [settled1, setSettled1] = useState(false);
  const [settled2, setSettled2] = useState(false);
  const [selectedClasse, setSelectedClasse] = useState(null);
  const [selectedFrammento, setSelectedFrammento] = useState(null);
  const [selectedRazza, setSelectedRazza] = useState(null);
  const [pgName, setPgName] = useState("");
  const [pgBackground, setPgBackground] = useState("");
  const [generated, setGenerated] = useState(null);
  const [showClasseDetail, setShowClasseDetail] = useState(null);
  const [showFrammentoDetail, setShowFrammentoDetail] = useState(null);

  function rollDice(num, setRoll, setRolling, setSettled) {
    setRolling(true);
    setSettled(false);
    setRoll(null);
    setTimeout(() => {
      const val = Math.ceil(Math.random()*6);
      setRoll(val);
      setRolling(false);
      setTimeout(() => setSettled(true), 50);
    }, 700);
  }

  function generateSheet() {
    if (!selectedClasse || !selectedFrammento || !selectedRazza) return;
    const c = selectedClasse;
    const r = selectedRazza;
    const baseHP = typeof r.mod_hp === "number" && r.mod_hp > 0 ? c.hp + r.mod_hp : typeof r.mod_hp === "number" && r.mod_hp < 0 && r.mod_hp > -1 ? Math.ceil(c.hp * (1+r.mod_hp)) : c.hp + (r.mod_hp||0);
    const baseFL = typeof r.mod_fl === "number" && r.mod_fl < 0 ? Math.floor(c.fl * (1+r.mod_fl)) : c.fl + (r.mod_fl||0);
    setGenerated({
      nome: pgName || "Senza Nome",
      classe: c,
      frammento: selectedFrammento,
      razza: r,
      background: pgBackground,
      hp: baseHP,
      fl: baseFL,
      dif: c.dif + (r.mod_dif||0),
      vel: c.vel + (r.nome==="Nano del Sogno" ? -1 : 0),
      scintille: 3 + (r.nome==="Umano" ? 1 : 0),
      pa: 0,
      rank: "F",
    });
    setStep(4);
  }

  function restart() {
    setStep(0); setCatRoll(null); setGrpRoll(null);
    setRolling1(false); setRolling2(false); setSettled1(false); setSettled2(false);
    setSelectedClasse(null); setSelectedFrammento(null); setSelectedRazza(null);
    setPgName(""); setPgBackground(""); setGenerated(null);
  }

  const catClassi = catRoll ? CLASSI.filter(c => c.cat===catRoll) : [];
  const grpFrammenti = grpRoll ? FRAMMENTI.filter(f => f.gruppo===grpRoll) : [];

  return (
    <div className="anim-fade-in">
      <div style={{ marginBottom:"2rem" }}>
        <div className="section-title">Crea il tuo avventuriero</div>
        <div className="page-title">Generatore Personaggio</div>
        <p className="page-subtitle">Segui i 5 passi. Tira i dadi — il Flusso decide la tua natura.</p>
      </div>

      {/* Step indicator */}
      {step < 4 && (
        <div style={{ display:"flex", gap:"0.5rem", marginBottom:"2rem", alignItems:"center" }}>
          {["Classe","Frammento","Razza","Dettagli"].map((s,i) => (
            <div key={s} style={{ display:"flex", alignItems:"center", gap:"0.5rem" }}>
              <div style={{
                width:28, height:28, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center",
                fontFamily:"'Cinzel',serif", fontWeight:700, fontSize:"0.75rem",
                background: step>i ? "var(--purple)" : step===i ? "rgba(140,110,255,0.2)" : "transparent",
                border: `2px solid ${step>=i ? "var(--purple)" : "var(--border)"}`,
                color: step>i ? "white" : step===i ? "var(--purple)" : "var(--text-dim)",
              }}>{i+1}</div>
              <span style={{ fontSize:"0.78rem", color: step===i ? "var(--text-bright)" : "var(--text-dim)", fontWeight: step===i ? 700 : 400 }}>{s}</span>
              {i < 3 && <span style={{ color:"var(--border)", fontSize:"0.8rem" }}>→</span>}
            </div>
          ))}
        </div>
      )}

      {/* STEP 0 & 1: Classe */}
      {step <= 1 && (
        <div className="anim-slide-in">
          <div style={{ background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:10, padding:"2rem", marginBottom:"1.5rem" }}>
            <div className="section-title" style={{ marginBottom:"1rem" }}>Passo 1 — Categoria Classe</div>
            <p style={{ color:"var(--text-dim)", fontSize:"0.88rem", marginBottom:"1.5rem" }}>
              Tira il dado a 6 facce per ottenere la categoria. Poi scegli 1 delle 4 classi in quella categoria.
            </p>
            <div style={{ display:"flex", justifyContent:"center", marginBottom:"1.5rem" }}>
              <Dice
                value={catRoll}
                rolling={rolling1}
                settled={settled1}
                label="Tira per la Categoria"
                onClick={() => !rolling1 && rollDice(1, setCatRoll, setRolling1, setSettled1)}
              />
            </div>
            {catRoll && !rolling1 && (
              <div className="anim-slide-in">
                <div style={{ textAlign:"center", marginBottom:"1.25rem" }}>
                  <span style={{ fontFamily:"'Cinzel',serif", color:"var(--gold)", fontSize:"1rem" }}>
                    Categoria {catRoll} — {CATEGORIE[catRoll-1].nome}
                  </span>
                </div>
                <div className="grid-2">
                  {catClassi.map(c => (
                    <div key={c.nome} onClick={() => setSelectedClasse(c)}
                      className="card" style={{
                        padding:"1rem 1.25rem", cursor:"pointer",
                        border:`1px solid ${selectedClasse?.nome===c.nome ? CAT_COLORS[c.cat] : "var(--border)"}`,
                        background: selectedClasse?.nome===c.nome ? `${CAT_COLORS[c.cat]}12` : "var(--bg-card)",
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
                      {selectedClasse?.nome===c.nome && (
                        <div style={{ marginTop:"0.5rem", fontSize:"0.72rem", color:CAT_GLOW[c.cat], textAlign:"right" }}>✓ Selezionata</div>
                      )}
                    </div>
                  ))}
                </div>
                <div style={{ marginTop:"1.25rem", display:"flex", gap:"0.75rem", justifyContent:"flex-end" }}>
                  <button className="btn btn-outline" onClick={() => {setCatRoll(null); setSettled1(false); setSelectedClasse(null);}}>Ritira</button>
                  <button className="btn btn-primary" disabled={!selectedClasse} onClick={() => setStep(1)}
                    style={{ opacity: selectedClasse ? 1 : 0.4, cursor: selectedClasse ? "pointer" : "default" }}>
                    Avanti → Frammento
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 1 & 2: Frammento */}
      {step >= 1 && step <= 2 && (
        <div className="anim-slide-in">
          <div style={{ background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:10, padding:"2rem", marginBottom:"1.5rem" }}>
            <div className="section-title" style={{ marginBottom:"1rem" }}>Passo 2 — Frammento del Creatore</div>
            <p style={{ color:"var(--text-dim)", fontSize:"0.88rem", marginBottom:"1.5rem" }}>
              Tira il secondo dado per il gruppo del Frammento. Poi scegli 1 dei 6 frammenti in quel gruppo.
            </p>
            <div style={{ display:"flex", justifyContent:"center", marginBottom:"1.5rem" }}>
              <Dice
                value={grpRoll}
                rolling={rolling2}
                settled={settled2}
                label="Tira per il Gruppo"
                onClick={() => !rolling2 && rollDice(1, setGrpRoll, setRolling2, setSettled2)}
              />
            </div>
            {grpRoll && !rolling2 && (
              <div className="anim-slide-in">
                <div style={{ textAlign:"center", marginBottom:"1.25rem" }}>
                  <span style={{ fontFamily:"'Cinzel',serif", color:"var(--gold)", fontSize:"1rem" }}>
                    Gruppo {grpRoll} — Frammenti {GRUPPI_FRAMMENTI[grpRoll-1].nome}
                  </span>
                </div>
                <div className="grid-2">
                  {grpFrammenti.map(f => {
                    const gc = ["","var(--gold)","var(--purple)","var(--flux)","var(--danger)","var(--success)","#c060ff"][f.gruppo];
                    return (
                      <div key={f.nome} onClick={() => setSelectedFrammento(f)}
                        className="card" style={{
                          padding:"1rem", cursor:"pointer",
                          border:`1px solid ${selectedFrammento?.nome===f.nome ? gc : "var(--border)"}`,
                          background: selectedFrammento?.nome===f.nome ? `${gc}0f` : "var(--bg-card)",
                        }}>
                        <div style={{ fontFamily:"'Cinzel',serif", fontWeight:700, color:"var(--text-bright)", marginBottom:"0.2rem", fontSize:"0.85rem" }}>{f.nome}</div>
                        <div style={{ fontSize:"0.7rem", color:gc, marginBottom:"0.4rem" }}>{f.fonte}</div>
                        <div style={{ fontSize:"0.78rem", color:"var(--text-dim)", lineHeight:1.5 }}>{f.mec_breve}</div>
                        {selectedFrammento?.nome===f.nome && (
                          <div style={{ marginTop:"0.4rem", fontSize:"0.72rem", color:gc, textAlign:"right" }}>✓ Selezionato</div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div style={{ marginTop:"1.25rem", display:"flex", gap:"0.75rem", justifyContent:"flex-end" }}>
                  <button className="btn btn-outline" onClick={() => {setGrpRoll(null); setSettled2(false); setSelectedFrammento(null);}}>Ritira</button>
                  <button className="btn btn-primary" disabled={!selectedFrammento} onClick={() => setStep(2)}
                    style={{ opacity: selectedFrammento ? 1 : 0.4, cursor: selectedFrammento ? "pointer" : "default" }}>
                    Avanti → Razza
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 2 & 3: Razza + Dettagli */}
      {step >= 2 && step <= 3 && (
        <div className="anim-slide-in">
          <div style={{ background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:10, padding:"2rem", marginBottom:"1.5rem" }}>
            <div className="section-title" style={{ marginBottom:"1rem" }}>Passo 3 — Razza</div>
            <p style={{ color:"var(--text-dim)", fontSize:"0.88rem", marginBottom:"1.25rem" }}>Scelta libera — nessun dado.</p>
            <div className="grid-3">
              {RAZZE.map(r => (
                <div key={r.nome} onClick={() => setSelectedRazza(r)} className="card" style={{
                  padding:"1rem", cursor:"pointer",
                  border:`1px solid ${selectedRazza?.nome===r.nome ? r.color : "var(--border)"}`,
                  background: selectedRazza?.nome===r.nome ? `${r.color}10` : "var(--bg-card)",
                  borderTop:`3px solid ${selectedRazza?.nome===r.nome ? r.color : "var(--border)"}`,
                }}>
                  <div style={{ fontFamily:"'Cinzel',serif", fontWeight:700, color:"var(--text-bright)", marginBottom:"0.2rem" }}>{r.nome}</div>
                  <div style={{ fontSize:"0.72rem", color:r.color, fontStyle:"italic", marginBottom:"0.5rem" }}>{r.flavor}</div>
                  <div style={{ fontSize:"0.75rem", color:"var(--gold)", fontWeight:600, marginBottom:"0.3rem" }}>{r.bonus}</div>
                  <div style={{ fontSize:"0.72rem", color:"var(--danger)", opacity:0.8 }}>{r.malus}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:10, padding:"2rem", marginBottom:"1.5rem" }}>
            <div className="section-title" style={{ marginBottom:"1rem" }}>Passo 4 — Dettagli Personaggio</div>
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
            <button className="btn btn-gold" disabled={!selectedRazza} onClick={generateSheet}
              style={{ opacity: selectedRazza ? 1 : 0.4, cursor: selectedRazza ? "pointer" : "default" }}>
              ✨ Genera Scheda Personaggio
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Scheda generata */}
      {step === 4 && generated && (
        <div className="anim-slide-in">
          <div style={{ background:"var(--bg-card)", border:"1px solid var(--border-bright)", borderRadius:12, overflow:"hidden", boxShadow:"0 0 40px rgba(140,110,255,0.12)" }}>
            {/* Header scheda */}
            <div style={{
              padding:"2rem",
              background:`linear-gradient(135deg, ${CAT_COLORS[generated.classe.cat]}18, rgba(212,168,67,0.05))`,
              borderBottom:"1px solid var(--border)",
            }}>
              <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:"1rem", flexWrap:"wrap" }}>
                <div>
                  <div style={{ fontFamily:"'Cinzel Decorative',serif", fontSize:"1.8rem", fontWeight:700, color:"var(--text-bright)", marginBottom:"0.3rem" }}>
                    {generated.nome}
                  </div>
                  <div style={{ display:"flex", gap:"0.75rem", alignItems:"center", flexWrap:"wrap" }}>
                    <span style={{ fontSize:"1.5rem" }}>{generated.classe.icon}</span>
                    <div>
                      <span style={{ fontFamily:"'Cinzel',serif", fontWeight:700, color:CAT_GLOW[generated.classe.cat] }}>{generated.classe.nome}</span>
                      <span style={{ color:"var(--text-dim)", margin:"0 0.5rem" }}>·</span>
                      <span style={{ color:"var(--text-dim)" }}>{generated.razza.nome}</span>
                    </div>
                    <RankBadge rank="F" />
                  </div>
                  {generated.background && (
                    <div style={{ marginTop:"0.4rem", fontSize:"0.82rem", color:"var(--gold)", fontStyle:"italic" }}>Background: {generated.background}</div>
                  )}
                </div>
                <div style={{ display:"flex", gap:"0.5rem", flexWrap:"wrap" }}>
                  <button className="btn btn-outline" style={{ fontSize:"0.75rem" }} onClick={restart}>🎲 Nuovo PG</button>
                  <button className="btn btn-primary" style={{ fontSize:"0.75rem" }} onClick={() => { saveToTracker(generated); setPage("tracker"); }}>💾 Salva nel Tracker</button>
                  <button className="btn btn-gold" style={{ fontSize:"0.75rem" }} onClick={() => exportPDF(generated)}>📄 Esporta PDF</button>
                </div>
              </div>
            </div>

            <div style={{ padding:"2rem", display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(300px, 1fr))", gap:"1.5rem" }}>
              {/* Stats principali */}
              <div>
                <div className="section-title" style={{ marginBottom:"0.75rem" }}>Statistiche Rank F</div>
                <div style={{ display:"flex", gap:"1rem", marginBottom:"1rem", flexWrap:"wrap" }}>
                  {[
                    {l:"HP",v:generated.hp,col:"var(--danger)"},
                    {l:"Flusso",v:generated.fl,col:"var(--flux)"},
                    {l:"Difesa",v:generated.dif,col:"var(--purple)"},
                    {l:"Velocità",v:generated.vel,col:"var(--gold)"},
                    {l:"Scintille",v:generated.scintille,col:"#c060ff"},
                  ].map(s => (
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
                  <div style={{ marginBottom:"0.5rem" }}>
                    <div style={{ fontSize:"0.65rem", color:"var(--text-dim)", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:"0.25rem" }}>Tratto 1</div>
                    <p style={{ fontSize:"0.8rem", color:"var(--text)", lineHeight:1.55 }}>{generated.razza.tratto1}</p>
                  </div>
                  <div>
                    <div style={{ fontSize:"0.65rem", color:"var(--text-dim)", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:"0.25rem" }}>Tratto 2</div>
                    <p style={{ fontSize:"0.8rem", color:"var(--text)", lineHeight:1.55 }}>{generated.razza.tratto2}</p>
                  </div>
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
                        <span style={{ fontSize:"0.72rem", background:"rgba(140,110,255,0.15)", color:"var(--purple)", border:"1px solid rgba(140,110,255,0.3)", borderRadius:3, padding:"1px 7px" }}>
                          {sk.costo} Flusso
                        </span>
                      </div>
                      <p style={{ fontSize:"0.8rem", color:"var(--text-dim)", lineHeight:1.5 }}>{sk.desc}</p>
                      <div style={{ marginTop:"0.4rem", fontSize:"0.72rem", color:"var(--text-dim)", display:"flex", gap:"0.5rem", flexWrap:"wrap" }}>
                        {[sk.lv2,sk.lv3,sk.lv4].map((lv,i) => (
                          <span key={i} style={{ background:"rgba(140,110,255,0.06)", borderRadius:3, padding:"1px 5px" }}>Lv{i+2}: {lv}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* PA tracker inline */}
              <div style={{ gridColumn:"1/-1" }}>
                <div className="section-title" style={{ marginBottom:"0.75rem" }}>Progressione Rank (PA)</div>
                <div style={{ display:"flex", gap:"0.4rem", flexWrap:"wrap" }}>
                  {RANKS.map(r => {
                    const col = getRankColor(r);
                    const isCurrent = r==="F";
                    return (
                      <div key={r} style={{
                        padding:"0.4rem 0.8rem", borderRadius:5,
                        border:`1px solid ${isCurrent ? col : "rgba(140,110,255,0.1)"}`,
                        background: isCurrent ? `${col}15` : "transparent",
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
// COMBAT PANEL — Tiri caratteristica + Armi + Skill
// ═══════════════════════════════════════════════════════

const STAT_KEYS = ["FOR","AGI","RES","INT","PER","CAR"];
const STAT_COLORS = { FOR:"var(--danger)", AGI:"var(--success)", RES:"#e67e22", INT:"var(--purple)", PER:"var(--gold)", CAR:"var(--flux)" };

function rollD20(mod, label, addLog, tipo) {
  const base = Math.ceil(Math.random() * 20);
  const total = base + mod;
  const isCrit = base === 20;
  const isFumble = base === 1;
  const icon = isCrit ? "⚡ CRITICO!" : isFumble ? "💀 FUMBLE!" : total >= 15 ? "✓" : total >= 10 ? "~" : "✗";
  addLog(`🎲 ${label}: d20(${base}) ${mod >= 0 ? "+" : ""}${mod} = **${total}** ${icon}`);
  return { base, total, isCrit, isFumble };
}

function rollDamage(formula, modVal, label, addLog) {
  // Formula es: "1d8+2" o "2d6" o "1d6+3"
  const match = formula.match(/(\d+)d(\d+)([+-]\d+)?/i);
  if (!match) { addLog(`❌ Formula danno non valida: ${formula}`); return 0; }
  const n = parseInt(match[1]);
  const faces = parseInt(match[2]);
  const bonus = parseInt(match[3] || "0");
  let tot = bonus + (modVal || 0);
  const rolls = [];
  for (let i = 0; i < n; i++) { const r = Math.ceil(Math.random() * faces); tot += r; rolls.push(r); }
  addLog(`💥 ${label} danno: [${rolls.join(",")}]${bonus?`${bonus>=0?"+":""}${bonus}`:""}${modVal?`${modVal>=0?"+":""}${modVal} stat`:""} = **${tot}**`);
  return tot;
}

const CONDIZIONI = [
  {id:"avvelenato",label:"Avvelenato",icon:"☠️",color:"#4ecb71",desc:"–1 a tutti i tiri per turno"},
  {id:"stordito",label:"Stordito",icon:"⭐",color:"#f0c060",desc:"Salta il prossimo turno"},
  {id:"spaventato",label:"Spaventato",icon:"👁️",color:"#8e7df5",desc:"Svantaggio su attacchi"},
  {id:"rallentato",label:"Rallentato",icon:"🐢",color:"#3498db",desc:"Velocità /2, –1 azione"},
  {id:"prono",label:"Prono",icon:"⬇️",color:"#e67e22",desc:"Svantaggio a distanza, attacchi melee Vantaggio"},
  {id:"immobilizzato",label:"Immobilizzato",icon:"⛓️",color:"#e05050",desc:"Non può muoversi"},
  {id:"sanguinante",label:"Sanguinante",icon:"🩸",color:"#c0392b",desc:"–1d4 HP inizio turno"},
  {id:"benedetto",label:"Benedetto",icon:"✨",color:"#d4a843",desc:"+1d4 al prossimo tiro"},
  {id:"invisibile",label:"Invisibile",icon:"👻",color:"#534ab7",desc:"Non può essere bersagliato direttamente"},
  {id:"concentrato",label:"Concentrato",icon:"🎯",color:"#0f6e56",desc:"+2 al prossimo attacco"},
];

function CombatPanel({ pg, setPersonaggi, pgStats, rank }) {
  const cb = pg.combat || {};
  const hpMax = pgStats?.hp || pg.hp_base || 50;
  const flMax = pgStats?.fl || pg.fl_base || 30;
  const hpCurr = cb.hp ?? hpMax;
  const flCurr = cb.fl ?? flMax;
  const scintille = cb.scintille ?? (pg.scintille || 3);
  const condizioni = cb.condizioni || [];

  const [diceResult, setDiceResult] = useState(null);
  const [diceRolling, setDiceRolling] = useState(false);
  const [diceType, setDiceType] = useState(20);
  const [diceMod, setDiceMod] = useState(0);
  const [hpInput, setHpInput] = useState("");
  const [flInput, setFlInput] = useState("");
  const [logEntries, setLogEntries] = useState([]);
  const [activeTab, setActiveTab] = useState("vitali"); // vitali | stats | attacchi | skill

  function updateCombat(patch) {
    setPersonaggi(prev => prev.map(p => p.id === pg.id
      ? { ...p, combat: { ...(p.combat || {}), ...patch } }
      : p));
  }

  function addLog(msg) {
    setLogEntries(prev => [{ msg, time: new Date().toLocaleTimeString("it", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) }, ...prev.slice(0, 29)]);
  }

  function adjustHP(delta) {
    const v = parseInt(delta); if (isNaN(v)) return;
    const next = Math.max(0, Math.min(hpMax, hpCurr + v));
    updateCombat({ hp: next });
    addLog(`${v > 0 ? "💚" : "💔"} HP: ${v > 0 ? "+" : ""}${v} → ${next}/${hpMax}`);
    setHpInput("");
  }

  function adjustFL(delta) {
    const v = parseInt(delta); if (isNaN(v)) return;
    const next = Math.max(0, Math.min(flMax, flCurr + v));
    updateCombat({ fl: next });
    addLog(`🔵 Flusso: ${v > 0 ? "+" : ""}${v} → ${next}/${flMax}`);
    setFlInput("");
  }

  function toggleCondizione(id) {
    const curr = cb.condizioni || [];
    const next = curr.includes(id) ? curr.filter(c => c !== id) : [...curr, id];
    updateCombat({ condizioni: next });
    const cond = CONDIZIONI.find(c => c.id === id);
    addLog(`${cond.icon} ${curr.includes(id) ? "Rimossa" : "Applicata"}: ${cond.label}`);
  }

  // Tiro singolo dado con mod
  function rollDado(faces, mod) {
    setDiceRolling(true); setDiceResult(null);
    const m = parseInt(mod) || 0;
    setTimeout(() => {
      const r = Math.ceil(Math.random() * faces);
      const tot = r + m;
      const isCrit = faces === 20 && r === 20;
      const isFumble = faces === 20 && r === 1;
      setDiceResult({ val: r, tot, mod: m, faces, isCrit, isFumble });
      setDiceRolling(false);
      addLog(`🎲 1d${faces}${m !== 0 ? (m > 0 ? "+" : "") + m : ""}: d(${r})${m !== 0 ? (m > 0 ? "+" : "") + m : ""} = **${tot}**${isCrit ? " ⚡ CRITICO!" : isFumble ? " 💀 FUMBLE!" : ""}`);
    }, 350);
  }

  // Tiro caratteristica — ATT o TS
  function rollStat(statKey, tipo) {
    if (!pg.classeData) { addLog("⚠️ Dati classe mancanti — ricrea il PG dal Generatore."); return; }
    const c = pg.classeData;
    const vals = { FOR: c.FOR, AGI: c.AGI, RES: c.RES, INT: c.INT, PER: c.PER, CAR: c.CAR };
    const v = vals[statKey] || 10;
    const mod = Math.floor((v - 10) / 2);
    const base = Math.ceil(Math.random() * 20);
    const tot = base + mod;
    const isCrit = base === 20; const isFumble = base === 1;
    addLog(`🎲 ${tipo} ${statKey} (${v}→${mod >= 0 ? "+" : ""}${mod}): d(${base})+${mod} = **${tot}**${isCrit ? " ⚡ CRITICO!" : isFumble ? " 💀 FUMBLE!" : tot >= 15 ? " ✓" : tot >= 10 ? " ~" : " ✗"}`);
  }

  // Attacco con arma dall'inventario
  function attackWithItem(item) {
    if (!pg.classeData) { addLog("⚠️ Dati classe mancanti."); return; }
    const c = pg.classeData;
    // Determina stat da usare (arma=FOR, armatura=RES, altri per tipo)
    const statMap = { Arma: "FOR", Armatura: "RES", Consumabile: "INT", Artefatto: "INT", Altro: "FOR" };
    const statKey = statMap[item.tipo] || "FOR";
    const vals = { FOR: c.FOR, AGI: c.AGI, RES: c.RES, INT: c.INT, PER: c.PER, CAR: c.CAR };
    const v = vals[statKey] || 10;
    const mod = Math.floor((v - 10) / 2);
    const attRoll = Math.ceil(Math.random() * 20) + mod;
    const isCrit = (attRoll - mod) === 20;
    const isFumble = (attRoll - mod) === 1;
    addLog(`⚔️ [${item.nome}] ATT (${statKey}): **${attRoll}** ${isCrit ? "⚡ CRITICO!" : isFumble ? "💀 FUMBLE!" : ""}`);
    if (item.bonus) addLog(`   Bonus: ${item.bonus}`);
    if (isCrit) addLog("   💥 DANNO DOPPIO — tira danno e moltiplica ×2");
  }

  // Usa Skill del personaggio
  function useSkill(sk) {
    if (!pg.classeData) { addLog("⚠️ Dati classe mancanti."); return; }
    const c = pg.classeData;
    // Determina stat primaria dalla skill
    const skData = c.skills.find(s => s.nome === sk.nome);
    const lv = [0,20,70,170,370];
    const skLv = lv.findIndex(t => sk.ps < t);
    const lvLabel = skLv <= 0 ? 1 : skLv;
    // Cerca il modificatore migliore (usa il più alto della classe)
    const vals = { FOR: c.FOR, AGI: c.AGI, RES: c.RES, INT: c.INT, PER: c.PER, CAR: c.CAR };
    const best = Object.entries(vals).sort((a, b) => b[1] - a[1])[0];
    const mod = Math.floor((best[1] - 10) / 2);
    const base = Math.ceil(Math.random() * 20);
    const tot = base + mod;
    const isCrit = base === 20; const isFumble = base === 1;
    addLog(`✨ [${sk.nome}] Lv${lvLabel} (${best[0]}): d(${base})+${mod} = **${tot}**${isCrit ? " ⚡ CRITICO!" : isFumble ? " 💀 FUMBLE!" : ""}`);
    if (skData) addLog(`   ${skData.desc.substring(0, 80)}...`);
  }

  function resetCombat() {
    updateCombat({ hp: hpMax, fl: flMax, scintille: pg.scintille || 3, condizioni: [] });
    addLog(`⚔️ Nuovo scontro — HP/Flusso/Scintille ripristinati.`);
  }

  const hpPct = (hpCurr / hpMax) * 100;
  const flPct = (flCurr / flMax) * 100;
  const hpColor = hpPct > 60 ? "#4ecb71" : hpPct > 30 ? "#f0c060" : "#e05050";

  const combatTabs = [
    { id:"vitali", label:"Vitali" },
    { id:"stats", label:"Caratteristiche" },
    { id:"attacchi", label:"Armi & Attacchi" },
    { id:"skill", label:"Skill" },
  ];

  return (
    <div style={{ background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:10, overflow:"hidden" }}>
      {/* Header */}
      <div style={{ padding:"0.9rem 1.5rem", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div className="section-title" style={{ margin:0 }}>⚔️ Combattimento</div>
        <button className="btn btn-outline" style={{ fontSize:"0.72rem" }} onClick={resetCombat}>Nuovo Scontro</button>
      </div>

      {/* Sub-tabs */}
      <div style={{ display:"flex", borderBottom:"1px solid var(--border)", background:"var(--bg-mid)" }}>
        {combatTabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            background:"none", border:"none", cursor:"pointer",
            fontFamily:"'Raleway',sans-serif", fontWeight:700, fontSize:"0.78rem",
            letterSpacing:"0.05em", textTransform:"uppercase",
            padding:"0.5rem 1rem",
            color: activeTab === t.id ? "var(--purple)" : "var(--text-dim)",
            borderBottom: activeTab === t.id ? "2px solid var(--purple)" : "2px solid transparent",
          }}>{t.label}</button>
        ))}
      </div>

      {/* Tab Vitali */}
      {activeTab === "vitali" && (
        <div style={{ padding:"1.25rem 1.5rem" }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1.25rem", marginBottom:"1rem" }}>
            {/* HP */}
            <div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"0.4rem" }}>
                <span style={{ fontSize:"0.72rem", color:"var(--text-dim)", textTransform:"uppercase", letterSpacing:"0.08em" }}>Punti Vita</span>
                <span style={{ fontFamily:"'Cinzel',serif", fontWeight:900, color:hpColor, fontSize:"1.2rem" }}>
                  {hpCurr}<span style={{ fontSize:"0.75rem", color:"var(--text-dim)", fontWeight:400 }}>/{hpMax}</span>
                </span>
              </div>
              <div style={{ height:10, background:"rgba(255,255,255,0.06)", borderRadius:5, overflow:"hidden", marginBottom:"0.75rem" }}>
                <div style={{ height:"100%", width:`${hpPct}%`, background:hpColor, borderRadius:5, transition:"all 0.4s", boxShadow:`0 0 8px ${hpColor}60` }} />
              </div>
              <div style={{ display:"flex", gap:"0.4rem", marginBottom:"0.4rem" }}>
                {[-10,-5,-1,1,5,10].map(d => (
                  <button key={d} onClick={() => adjustHP(d)} style={{
                    flex:1, padding:"0.3rem 0", borderRadius:4, cursor:"pointer", fontSize:"0.8rem", fontWeight:700,
                    border:`1px solid ${d < 0 ? "rgba(224,80,80,0.4)" : "rgba(78,203,113,0.4)"}`,
                    background: d < 0 ? "rgba(224,80,80,0.08)" : "rgba(78,203,113,0.08)",
                    color: d < 0 ? "#e05050" : "#4ecb71", fontFamily:"'Cinzel',sans-serif",
                  }}>{d > 0 ? "+" : ""}{d}</button>
                ))}
              </div>
              <div style={{ display:"flex", gap:"0.4rem" }}>
                <input className="input-field" type="number" placeholder="±HP personalizzato" value={hpInput}
                  onChange={e => setHpInput(e.target.value)} onKeyDown={e => e.key === "Enter" && adjustHP(hpInput)}
                  style={{ flex:1, fontSize:"0.82rem", padding:"0.3rem 0.5rem" }} />
                <button className="btn btn-outline" style={{ fontSize:"0.78rem" }} onClick={() => adjustHP(hpInput)}>OK</button>
              </div>
              {hpCurr === 0 && (
                <div style={{ marginTop:"0.6rem", background:"rgba(224,80,80,0.12)", border:"1px solid rgba(224,80,80,0.4)", borderRadius:6, padding:"0.5rem 0.75rem", fontSize:"0.8rem", color:"#e05050", fontWeight:700 }}>
                  ⚠️ STATO CRITICO — Tiri Salvezza Mortali<br/>
                  <span style={{ fontSize:"0.72rem", fontWeight:400 }}>3 Successi (10+) = stabile | 3 Fallimenti = morte | Nat20 = recuperi 1 HP</span>
                </div>
              )}
            </div>

            {/* Flusso */}
            <div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"0.4rem" }}>
                <span style={{ fontSize:"0.72rem", color:"var(--text-dim)", textTransform:"uppercase", letterSpacing:"0.08em" }}>Flusso</span>
                <span style={{ fontFamily:"'Cinzel',serif", fontWeight:900, color:"var(--flux)", fontSize:"1.2rem" }}>
                  {flCurr}<span style={{ fontSize:"0.75rem", color:"var(--text-dim)", fontWeight:400 }}>/{flMax}</span>
                </span>
              </div>
              <div style={{ height:10, background:"rgba(255,255,255,0.06)", borderRadius:5, overflow:"hidden", marginBottom:"0.75rem" }}>
                <div style={{ height:"100%", width:`${flPct}%`, background:"var(--flux)", borderRadius:5, transition:"all 0.4s", boxShadow:"0 0 8px rgba(122,240,200,0.4)" }} />
              </div>
              <div style={{ display:"flex", gap:"0.4rem", marginBottom:"0.4rem" }}>
                {[-6,-3,-1,1,3,6].map(d => (
                  <button key={d} onClick={() => adjustFL(d)} style={{
                    flex:1, padding:"0.3rem 0", borderRadius:4, cursor:"pointer", fontSize:"0.8rem", fontWeight:700,
                    border:`1px solid ${d < 0 ? "rgba(122,240,200,0.2)" : "rgba(122,240,200,0.4)"}`,
                    background: d < 0 ? "rgba(122,240,200,0.04)" : "rgba(122,240,200,0.08)",
                    color:"var(--flux)", fontFamily:"'Cinzel',sans-serif",
                  }}>{d > 0 ? "+" : ""}{d}</button>
                ))}
              </div>
              <div style={{ display:"flex", gap:"0.4rem" }}>
                <input className="input-field" type="number" placeholder="±Flusso personalizzato" value={flInput}
                  onChange={e => setFlInput(e.target.value)} onKeyDown={e => e.key === "Enter" && adjustFL(flInput)}
                  style={{ flex:1, fontSize:"0.82rem", padding:"0.3rem 0.5rem" }} />
                <button className="btn btn-outline" style={{ fontSize:"0.78rem" }} onClick={() => adjustFL(flInput)}>OK</button>
              </div>
            </div>
          </div>

          {/* Scintille */}
          <div style={{ marginBottom:"1rem" }}>
            <div style={{ fontSize:"0.7rem", color:"var(--text-dim)", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:"0.5rem" }}>
              Scintille del Creatore ({scintille}/10)
            </div>
            <div style={{ display:"flex", gap:"0.35rem", alignItems:"center" }}>
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} onClick={() => { updateCombat({ scintille: i < scintille ? scintille - 1 : i + 1 }); }} style={{
                  width:22, height:22, borderRadius:"50%", cursor:"pointer", transition:"all 0.2s",
                  background: i < scintille ? "var(--gold)" : "rgba(212,168,67,0.1)",
                  border:`1px solid ${i < scintille ? "var(--gold)" : "rgba(212,168,67,0.2)"}`,
                  boxShadow: i < scintille ? "0 0 6px rgba(212,168,67,0.5)" : "none",
                }} />
              ))}
              <span style={{ fontSize:"0.75rem", color:"var(--gold)", fontFamily:"'Cinzel',serif", fontWeight:700, marginLeft:"0.5rem" }}>{scintille}</span>
            </div>
            <div style={{ display:"flex", gap:"0.5rem", marginTop:"0.5rem", flexWrap:"wrap" }}>
              {[
                { label:"Ritiro dado", cost:"1✦" }, { label:"Impulso narrativo", cost:"1✦" },
                { label:"Sopravvivi a 0HP", cost:"2✦" }, { label:"Attiva AU", cost:"3✦" },
                { label:"Eco del Caos +1d10", cost:"2✦" }, { label:"Memoria Flusso", cost:"1✦" },
              ].map(s => (
                <div key={s.label} style={{ fontSize:"0.72rem", color:"var(--text-dim)", background:"rgba(212,168,67,0.05)", border:"1px solid rgba(212,168,67,0.15)", borderRadius:4, padding:"2px 7px" }}>
                  <span style={{ color:"var(--gold)", fontWeight:700 }}>{s.cost}</span> {s.label}
                </div>
              ))}
            </div>
          </div>

          {/* Condizioni */}
          <div>
            <div style={{ fontSize:"0.7rem", color:"var(--text-dim)", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:"0.5rem" }}>Condizioni</div>
            <div style={{ display:"flex", gap:"0.4rem", flexWrap:"wrap" }}>
              {CONDIZIONI.map(cond => {
                const active = condizioni.includes(cond.id);
                return (
                  <button key={cond.id} onClick={() => toggleCondizione(cond.id)} title={cond.desc} style={{
                    padding:"0.3rem 0.6rem", borderRadius:20, fontSize:"0.75rem", cursor:"pointer",
                    border:`1px solid ${active ? cond.color : "var(--border)"}`,
                    background: active ? `${cond.color}20` : "transparent",
                    color: active ? cond.color : "var(--text-dim)",
                    fontWeight: active ? 700 : 400, transition:"all 0.15s",
                    display:"flex", alignItems:"center", gap:"0.3rem",
                  }}>
                    <span>{cond.icon}</span>{cond.label}
                  </button>
                );
              })}
            </div>
            {condizioni.length > 0 && (
              <div style={{ marginTop:"0.5rem", display:"flex", flexDirection:"column", gap:"0.2rem" }}>
                {condizioni.map(id => {
                  const c = CONDIZIONI.find(x => x.id === id);
                  return c ? <div key={id} style={{ fontSize:"0.75rem", color:c.color }}>{c.icon} {c.label}: {c.desc}</div> : null;
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab Caratteristiche */}
      {activeTab === "stats" && (
        <div style={{ padding:"1.25rem 1.5rem" }}>
          <p style={{ fontSize:"0.8rem", color:"var(--text-dim)", marginBottom:"1rem" }}>
            Tira 1d20 + modificatore della caratteristica. Usa <b>ATT</b> per attacchi, <b>TS</b> per tiri salvezza.
          </p>
          {pg.classeData ? (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"0.75rem" }}>
              {STAT_KEYS.map(sk => {
                const v = pg.classeData[sk] || 10;
                const mod = Math.floor((v - 10) / 2);
                const col = STAT_COLORS[sk];
                return (
                  <div key={sk} style={{ background:"var(--bg-card2)", border:`1px solid ${col}30`, borderRadius:8, padding:"0.9rem", textAlign:"center" }}>
                    <div style={{ fontFamily:"'Cinzel',serif", fontWeight:900, color:col, fontSize:"1.2rem" }}>{sk}</div>
                    <div style={{ fontSize:"1.5rem", fontWeight:900, color:"var(--text-bright)", lineHeight:1 }}>{v}</div>
                    <div style={{ fontSize:"0.75rem", color:col, fontWeight:700, marginBottom:"0.6rem" }}>
                      {mod >= 0 ? "+" : ""}{mod}
                    </div>
                    <div style={{ display:"flex", gap:"0.35rem" }}>
                      <button onClick={() => rollStat(sk, "ATT")} style={{
                        flex:1, padding:"0.35rem 0", borderRadius:4, cursor:"pointer",
                        border:`1px solid ${col}50`, background:`${col}12`, color:col,
                        fontSize:"0.72rem", fontWeight:700, fontFamily:"'Raleway',sans-serif",
                      }}>🎲 ATT</button>
                      <button onClick={() => rollStat(sk, "TS")} style={{
                        flex:1, padding:"0.35rem 0", borderRadius:4, cursor:"pointer",
                        border:"1px solid var(--border)", background:"transparent", color:"var(--text-dim)",
                        fontSize:"0.72rem", fontWeight:700, fontFamily:"'Raleway',sans-serif",
                      }}>🛡️ TS</button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ padding:"1.5rem", textAlign:"center", color:"var(--text-dim)", fontSize:"0.85rem" }}>
              ⚠️ Questo personaggio è stato creato manualmente. Ricrealo dal Generatore per avere i tiri automatici.
            </div>
          )}

          {/* Tiri combo */}
          <div style={{ marginTop:"1.25rem" }}>
            <div style={{ fontSize:"0.7rem", color:"var(--text-dim)", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:"0.6rem" }}>Tiri Speciali</div>
            <div style={{ display:"flex", gap:"0.5rem", flexWrap:"wrap" }}>
              {[
                { label:"Iniziativa (AGI)", statKey:"AGI", extra:"" },
                { label:"Vantaggio (2d20 alto)", statKey:null, special:"vantaggio" },
                { label:"Svantaggio (2d20 basso)", statKey:null, special:"svantaggio" },
                { label:"TS Mortale (1d20≥10)", statKey:null, special:"mortale" },
              ].map(t => (
                <button key={t.label} onClick={() => {
                  if (t.special === "vantaggio") {
                    const r1 = Math.ceil(Math.random()*20); const r2 = Math.ceil(Math.random()*20);
                    const best = Math.max(r1,r2);
                    addLog(`↑ VANTAGGIO: d20[${r1},${r2}] → usa **${best}** ${best===20?"⚡ CRITICO!":best===1?"💀 FUMBLE!":""}`);
                  } else if (t.special === "svantaggio") {
                    const r1 = Math.ceil(Math.random()*20); const r2 = Math.ceil(Math.random()*20);
                    const worst = Math.min(r1,r2);
                    addLog(`↓ SVANTAGGIO: d20[${r1},${r2}] → usa **${worst}** ${worst===1?"💀 FUMBLE!":""}`);
                  } else if (t.special === "mortale") {
                    const r = Math.ceil(Math.random()*20);
                    addLog(`⚠️ TS MORTALE: **${r}** → ${r>=10?"✓ SUCCESSO":"✗ FALLIMENTO"}${r===20?" ⚡ recuperi 1 HP!":""}`);
                  } else if (t.statKey) {
                    rollStat(t.statKey, "INIT");
                  }
                }} style={{
                  padding:"0.4rem 0.9rem", borderRadius:4, cursor:"pointer",
                  border:"1px solid var(--border)", background:"rgba(140,110,255,0.06)",
                  color:"var(--text)", fontSize:"0.8rem", fontWeight:600, fontFamily:"'Raleway',sans-serif",
                }}>{t.label}</button>
              ))}
            </div>
          </div>

          {/* Combo */}
          <div style={{ marginTop:"1rem" }}>
            <div style={{ fontSize:"0.7rem", color:"var(--text-dim)", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:"0.5rem" }}>Sistema Combo</div>
            <div style={{ display:"flex", gap:"0.5rem", flexWrap:"wrap" }}>
              {[
                { label:"Combo 2° (+1d4)", extra:()=>{ const r=Math.ceil(Math.random()*4); addLog(`✦ Combo 2°: +1d4 danno = **+${r}**`); } },
                { label:"Combo 3° (+2d4)", extra:()=>{ const r=Math.ceil(Math.random()*4)+Math.ceil(Math.random()*4); addLog(`✦✦ Combo 3°: +2d4 danno = **+${r}** (o critico se mancavi di ≤2)`); } },
                { label:"Combo 4°+ (×2 danno)", extra:()=>{ addLog("✦✦✦ Combo 4°+: DANNO RADDOPPIATO — tira danno arma e moltiplica ×2"); } },
              ].map(c => (
                <button key={c.label} onClick={c.extra} style={{
                  padding:"0.4rem 0.9rem", borderRadius:4, cursor:"pointer",
                  border:"1px solid rgba(140,110,255,0.35)", background:"rgba(140,110,255,0.08)",
                  color:"var(--purple)", fontSize:"0.8rem", fontWeight:700, fontFamily:"'Raleway',sans-serif",
                }}>{c.label}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab Armi & Attacchi — usa inventario */}
      {activeTab === "attacchi" && (
        <div style={{ padding:"1.25rem 1.5rem" }}>
          <div style={{ display:"flex", gap:"0.75rem", marginBottom:"1rem", flexWrap:"wrap" }}>
            {/* Dado personalizzato */}
            <div style={{ background:"var(--bg-card2)", border:"1px solid var(--border)", borderRadius:8, padding:"0.9rem", flex:"1", minWidth:220 }}>
              <div style={{ fontSize:"0.7rem", color:"var(--text-dim)", textTransform:"uppercase", marginBottom:"0.5rem" }}>Dado Personalizzato</div>
              <div style={{ display:"flex", gap:"0.4rem", flexWrap:"wrap", marginBottom:"0.5rem" }}>
                {[4,6,8,10,12,20,100].map(d => (
                  <button key={d} onClick={() => setDiceType(d)} style={{
                    padding:"0.25rem 0.5rem", borderRadius:4, fontSize:"0.78rem",
                    fontFamily:"'Cinzel',serif", fontWeight:700,
                    border:`1px solid ${diceType===d?"var(--purple)":"var(--border)"}`,
                    background: diceType===d?"rgba(140,110,255,0.15)":"transparent",
                    color: diceType===d?"var(--purple)":"var(--text-dim)",
                    cursor:"pointer",
                  }}>d{d}</button>
                ))}
              </div>
              <div style={{ display:"flex", gap:"0.4rem", alignItems:"center", marginBottom:"0.5rem" }}>
                <span style={{ fontSize:"0.75rem", color:"var(--text-dim)" }}>Mod:</span>
                <input type="number" value={diceMod} onChange={e=>setDiceMod(e.target.value)}
                  style={{ width:56, fontSize:"0.85rem", padding:"0.25rem 0.4rem", background:"rgba(255,255,255,0.04)", border:"1px solid var(--border)", borderRadius:4, color:"var(--text)" }} />
              </div>
              <div onClick={() => rollDado(diceType, diceMod)} style={{
                height:60, display:"flex", alignItems:"center", justifyContent:"center",
                background:"rgba(140,110,255,0.05)", border:"1px solid var(--border)", borderRadius:8, cursor:"pointer",
              }}>
                {diceRolling ? (
                  <span style={{ fontSize:"1.8rem", animation:"dice-roll 0.35s" }}>🎲</span>
                ) : diceResult ? (
                  <div style={{ textAlign:"center" }}>
                    <div style={{ fontFamily:"'Cinzel',serif", fontWeight:900, fontSize:"2rem", lineHeight:1,
                      color: diceResult.isCrit?"var(--gold)":diceResult.isFumble?"var(--danger)":"var(--text-bright)" }}>
                      {diceResult.tot}
                    </div>
                    <div style={{ fontSize:"0.65rem", color:"var(--text-dim)" }}>d{diceResult.faces}({diceResult.val}){diceResult.mod!==0?(diceResult.mod>0?"+":"")+diceResult.mod:""}</div>
                    {diceResult.isCrit && <div style={{ fontSize:"0.65rem", color:"var(--gold)", fontWeight:700 }}>CRITICO!</div>}
                    {diceResult.isFumble && <div style={{ fontSize:"0.65rem", color:"var(--danger)", fontWeight:700 }}>FUMBLE!</div>}
                  </div>
                ) : <span style={{ color:"var(--text-dim)", fontSize:"0.82rem" }}>Clicca per tirare 1d{diceType}</span>}
              </div>
            </div>
          </div>

          {/* Armi dall'inventario */}
          <div style={{ fontSize:"0.7rem", color:"var(--text-dim)", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:"0.5rem" }}>
            Attacchi da Inventario
          </div>
          {(pg.inventario || []).filter(it => ["Arma","Artefatto"].includes(it.tipo)).length === 0 ? (
            <div style={{ padding:"1rem", textAlign:"center", color:"var(--text-dim)", fontSize:"0.82rem", background:"rgba(140,110,255,0.03)", border:"1px solid var(--border)", borderRadius:6 }}>
              Nessuna arma nell'inventario. Aggiungila nella sezione Inventario.
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:"0.4rem" }}>
              {(pg.inventario || []).filter(it => ["Arma","Artefatto"].includes(it.tipo)).map(item => (
                <div key={item.id} style={{
                  display:"flex", alignItems:"center", gap:"0.75rem", padding:"0.65rem 0.9rem",
                  background:"rgba(140,110,255,0.05)", border:"1px solid var(--border)", borderRadius:6,
                }}>
                  <span style={{ fontSize:"1.1rem" }}>{TIPO_ICONS[item.tipo]}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontFamily:"'Cinzel',serif", fontWeight:700, color:"var(--text-bright)", fontSize:"0.88rem" }}>{item.nome}</div>
                    {item.bonus && <div style={{ fontSize:"0.72rem", color:"var(--gold)" }}>{item.bonus}</div>}
                    {item.note && <div style={{ fontSize:"0.72rem", color:"var(--text-dim)" }}>{item.note}</div>}
                  </div>
                  <button onClick={() => attackWithItem(item)} style={{
                    padding:"0.35rem 0.8rem", borderRadius:4, cursor:"pointer",
                    border:"1px solid rgba(224,80,80,0.4)", background:"rgba(224,80,80,0.08)",
                    color:"#e05050", fontSize:"0.78rem", fontWeight:700, fontFamily:"'Raleway',sans-serif",
                  }}>⚔️ Attacca</button>
                </div>
              ))}
            </div>
          )}

          {/* Attacchi rapidi generici */}
          <div style={{ marginTop:"1rem" }}>
            <div style={{ fontSize:"0.7rem", color:"var(--text-dim)", textTransform:"uppercase", marginBottom:"0.5rem" }}>Attacchi Rapidi</div>
            <div style={{ display:"flex", gap:"0.5rem", flexWrap:"wrap" }}>
              {pg.classeData ? [
                { label:"Attacco Base (FOR)", f:()=>{ const c=pg.classeData; const mod=Math.floor((c.FOR-10)/2); const r=Math.ceil(Math.random()*20); const dmg=Math.ceil(Math.random()*8)+Math.max(0,mod); addLog(`⚔️ Attacco Base FOR: d(${r})+${mod}=**${r+mod}** | Danno 1d8+${mod}=**${dmg}**`); } },
                { label:"Attacco Agile (AGI)", f:()=>{ const c=pg.classeData; const mod=Math.floor((c.AGI-10)/2); const r=Math.ceil(Math.random()*20); const dmg=Math.ceil(Math.random()*6)+Math.max(0,mod); addLog(`🗡️ Attacco Agile AGI: d(${r})+${mod}=**${r+mod}** | Danno 1d6+${mod}=**${dmg}**`); } },
                { label:"Magia (INT)", f:()=>{ const c=pg.classeData; const mod=Math.floor((c.INT-10)/2); const r=Math.ceil(Math.random()*20); const d1=Math.ceil(Math.random()*6); const d2=Math.ceil(Math.random()*6); addLog(`⚡ Magia INT: d(${r})+${mod}=**${r+mod}** | Danno 2d6+${mod}=**${d1+d2+mod}**`); } },
              ].map(a => (
                <button key={a.label} onClick={a.f} style={{
                  padding:"0.4rem 0.9rem", borderRadius:4, cursor:"pointer",
                  border:"1px solid var(--border)", background:"rgba(140,110,255,0.06)",
                  color:"var(--text)", fontSize:"0.8rem", fontWeight:600, fontFamily:"'Raleway',sans-serif",
                }}>{a.label}</button>
              )) : <div style={{ fontSize:"0.82rem", color:"var(--text-dim)" }}>Ricrea il personaggio dal Generatore per gli attacchi automatici.</div>}
            </div>
          </div>
        </div>
      )}

      {/* Tab Skill */}
      {activeTab === "skill" && (
        <div style={{ padding:"1.25rem 1.5rem" }}>
          {pg.skills && pg.skills.length > 0 && pg.classeData ? (
            <div style={{ display:"flex", flexDirection:"column", gap:"0.6rem" }}>
              {pg.skills.map(sk => {
                const lv = [0,20,70,170,370]; const lvNum = lv.findIndex(t => sk.ps < t); const lvLabel = lvNum<=0?1:lvNum;
                const skData = pg.classeData.skills.find(s => s.nome === sk.nome);
                const skColor = ["","var(--text-dim)","var(--purple)","var(--flux)","var(--gold)","var(--gold-bright)"][lvLabel];
                return (
                  <div key={sk.nome} style={{ background:"var(--bg-card2)", border:`1px solid ${skColor}25`, borderRadius:8, padding:"0.9rem 1rem" }}>
                    <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:"0.75rem", flexWrap:"wrap" }}>
                      <div style={{ flex:1 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", marginBottom:"0.3rem" }}>
                          <span style={{ fontFamily:"'Cinzel',serif", fontWeight:700, color:"var(--text-bright)", fontSize:"0.9rem" }}>{sk.nome}</span>
                          <span style={{ fontSize:"0.7rem", background:`${skColor}18`, color:skColor, border:`1px solid ${skColor}30`, borderRadius:3, padding:"1px 6px" }}>Lv{lvLabel}</span>
                          {skData && <span style={{ fontSize:"0.7rem", color:"var(--flux)", background:"rgba(122,240,200,0.08)", borderRadius:3, padding:"1px 6px" }}>{skData.costo} Flusso</span>}
                        </div>
                        {skData && <p style={{ fontSize:"0.78rem", color:"var(--text-dim)", lineHeight:1.5, marginBottom:"0.4rem" }}>{skData.desc}</p>}
                        {skData && lvLabel >= 2 && (
                          <div style={{ fontSize:"0.72rem", color:skColor }}>
                            {lvLabel===2?skData.lv2:lvLabel===3?skData.lv3:lvLabel===4?skData.lv4:skData.lv5}
                          </div>
                        )}
                      </div>
                      <button onClick={() => useSkill(sk)} style={{
                        padding:"0.5rem 1rem", borderRadius:6, cursor:"pointer", flexShrink:0,
                        border:`1px solid ${skColor}40`, background:`${skColor}10`,
                        color:skColor, fontSize:"0.82rem", fontWeight:700, fontFamily:"'Raleway',sans-serif",
                      }}>✨ Usa Skill</button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ padding:"1.5rem", textAlign:"center", color:"var(--text-dim)", fontSize:"0.85rem" }}>
              Nessuna Skill disponibile. Crea il personaggio dal Generatore per aggiungere le Skill automaticamente.
            </div>
          )}

          {/* AU Frammento */}
          {pg.frammento && AU_MAP[pg.frammento.nome] && (
            <div style={{ marginTop:"1rem", background:"rgba(212,168,67,0.05)", border:"1px solid rgba(212,168,67,0.3)", borderRadius:8, padding:"0.9rem 1rem" }}>
              <div style={{ fontSize:"0.65rem", color:"var(--gold)", textTransform:"uppercase", fontWeight:700, marginBottom:"0.4rem" }}>✦ Abilità Unica — {pg.frammento.nome}</div>
              <div style={{ fontFamily:"'Cinzel',serif", fontWeight:700, color:"var(--gold)", marginBottom:"0.4rem" }}>{AU_MAP[pg.frammento.nome].nome}</div>
              <p style={{ fontSize:"0.8rem", color:"var(--text-dim)", lineHeight:1.6, marginBottom:"0.6rem" }}>{AU_MAP[pg.frammento.nome].desc}</p>
              {rank && ["S","SS","SSS"].includes(rank) ? (
                <button onClick={() => addLog(`✦ AU ATTIVATA — ${pg.frammento.nome}: ${AU_MAP[pg.frammento.nome].nome}`)} style={{
                  padding:"0.45rem 1rem", borderRadius:6, cursor:"pointer",
                  border:"1px solid rgba(212,168,67,0.4)", background:"rgba(212,168,67,0.1)",
                  color:"var(--gold)", fontSize:"0.82rem", fontWeight:700, fontFamily:"'Raleway',sans-serif",
                }}>✦ Attiva AU</button>
              ) : (
                <div style={{ fontSize:"0.75rem", color:"var(--text-dim)", fontStyle:"italic" }}>AU sbloccata al Rank S</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Log */}
      {logEntries.length > 0 && (
        <div style={{ borderTop:"1px solid var(--border)", padding:"0.75rem 1.5rem" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"0.4rem" }}>
            <div style={{ fontSize:"0.65rem", color:"var(--text-dim)", textTransform:"uppercase", letterSpacing:"0.08em" }}>Log Scontro</div>
            <button onClick={() => setLogEntries([])} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--text-dim)", fontSize:"0.7rem" }}>Svuota</button>
          </div>
          <div style={{ maxHeight:130, overflowY:"auto", display:"flex", flexDirection:"column", gap:"0.15rem" }}>
            {logEntries.map((e, i) => (
              <div key={i} style={{ fontSize:"0.75rem", color: i===0?"var(--text)":"var(--text-dim)" }}>
                <span style={{ opacity:0.45, marginRight:"0.4rem", fontSize:"0.68rem" }}>{e.time}</span>
                <span dangerouslySetInnerHTML={{ __html: e.msg.replace(/\*\*(.*?)\*\*/g, '<strong style="color:var(--text-bright)">$1</strong>') }} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// INVENTARIO PANEL
// ═══════════════════════════════════════════════════════
const TIPO_ICONS = { Arma:"⚔️", Armatura:"🛡️", Consumabile:"🧪", Artefatto:"✦", Altro:"📦" };
const TIPO_COLORS = { Arma:"var(--danger)", Armatura:"var(--purple)", Consumabile:"var(--flux)", Artefatto:"var(--gold)", Altro:"var(--text-dim)" };

function InventarioPanel({ pg, setPersonaggi }) {
  const inventario = pg.inventario || [];
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nome:"", tipo:"Arma", peso:"", bonus:"", note:"" });
  const [editId, setEditId] = useState(null);

  function updateInventario(items) {
    setPersonaggi(prev => prev.map(p => p.id===pg.id ? { ...p, inventario: items } : p));
  }

  function saveItem() {
    if (!form.nome.trim()) return;
    if (editId) {
      updateInventario(inventario.map(it => it.id===editId ? { ...it, ...form } : it));
      setEditId(null);
    } else {
      updateInventario([...inventario, { ...form, id: Date.now(), usato: false }]);
    }
    setForm({ nome:"", tipo:"Arma", peso:"", bonus:"", note:"" });
    setShowForm(false);
  }

  function deleteItem(id) {
    updateInventario(inventario.filter(it => it.id !== id));
  }

  function toggleUsato(id) {
    updateInventario(inventario.map(it => it.id===id ? { ...it, usato: !it.usato } : it));
  }

  function startEdit(item) {
    setForm({ nome:item.nome, tipo:item.tipo, peso:item.peso||"", bonus:item.bonus||"", note:item.note||"" });
    setEditId(item.id);
    setShowForm(true);
  }

  const pesoTot = inventario.reduce((s,it) => s + (parseFloat(it.peso)||0), 0);
  const byTipo = ["Arma","Armatura","Consumabile","Artefatto","Altro"].map(t => ({
    tipo:t, items: inventario.filter(it => it.tipo===t)
  })).filter(g => g.items.length > 0);

  return (
    <div style={{ background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:10, overflow:"hidden" }}>
      <div style={{ padding:"1rem 1.5rem", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div>
          <div className="section-title">🎒 Inventario</div>
          <p style={{ fontSize:"0.75rem", color:"var(--text-dim)", marginTop:"0.2rem" }}>
            {inventario.length} oggetti · Peso totale: {pesoTot.toFixed(1)} kg
          </p>
        </div>
        <button className="btn btn-primary" style={{ fontSize:"0.72rem" }} onClick={() => { setShowForm(true); setEditId(null); setForm({ nome:"", tipo:"Arma", peso:"", bonus:"", note:"" }); }}>+ Oggetto</button>
      </div>

      {/* Form aggiunta */}
      {showForm && (
        <div style={{ padding:"1.25rem 1.5rem", borderBottom:"1px solid var(--border)", background:"rgba(140,110,255,0.03)" }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.6rem", marginBottom:"0.6rem" }}>
            <input className="input-field" placeholder="Nome oggetto *" value={form.nome} onChange={e=>setForm(p=>({...p,nome:e.target.value}))} style={{ fontSize:"0.85rem" }} />
            <select className="input-field" value={form.tipo} onChange={e=>setForm(p=>({...p,tipo:e.target.value}))} style={{ fontSize:"0.85rem" }}>
              {["Arma","Armatura","Consumabile","Artefatto","Altro"].map(t => <option key={t}>{t}</option>)}
            </select>
            <input className="input-field" placeholder="Peso (kg)" type="number" value={form.peso} onChange={e=>setForm(p=>({...p,peso:e.target.value}))} style={{ fontSize:"0.85rem" }} />
            <input className="input-field" placeholder="Bonus (es: +2 ATT, Difesa +1)" value={form.bonus} onChange={e=>setForm(p=>({...p,bonus:e.target.value}))} style={{ fontSize:"0.85rem" }} />
            <input className="input-field" placeholder="Note / descrizione" value={form.note} onChange={e=>setForm(p=>({...p,note:e.target.value}))} style={{ fontSize:"0.85rem", gridColumn:"1/-1" }} />
          </div>
          <div style={{ display:"flex", gap:"0.5rem" }}>
            <button className="btn btn-primary" style={{ fontSize:"0.8rem" }} onClick={saveItem}>{editId ? "Aggiorna" : "Aggiungi"}</button>
            <button className="btn btn-outline" style={{ fontSize:"0.8rem" }} onClick={() => { setShowForm(false); setEditId(null); }}>Annulla</button>
          </div>
        </div>
      )}

      {/* Lista */}
      {inventario.length === 0 ? (
        <div style={{ padding:"2rem", textAlign:"center", color:"var(--text-dim)", fontSize:"0.85rem" }}>
          <div style={{ fontSize:"2rem", marginBottom:"0.5rem" }}>🎒</div>
          Nessun oggetto. Aggiungi armi, armature e artefatti.
        </div>
      ) : (
        <div style={{ padding:"0.75rem 1.5rem 1.25rem" }}>
          {byTipo.map(g => (
            <div key={g.tipo} style={{ marginBottom:"1rem" }}>
              <div style={{ fontSize:"0.68rem", color:TIPO_COLORS[g.tipo], textTransform:"uppercase", letterSpacing:"0.1em", fontWeight:700, marginBottom:"0.4rem" }}>
                {TIPO_ICONS[g.tipo]} {g.tipo} ({g.items.length})
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:"0.35rem" }}>
                {g.items.map(it => (
                  <div key={it.id} style={{
                    display:"flex", alignItems:"flex-start", gap:"0.75rem", padding:"0.6rem 0.75rem",
                    background: it.usato ? "rgba(140,110,255,0.03)" : "rgba(140,110,255,0.06)",
                    border:`1px solid ${it.usato?"rgba(140,110,255,0.06)":"rgba(140,110,255,0.15)"}`,
                    borderRadius:6, opacity: it.usato ? 0.55 : 1, transition:"all 0.2s",
                  }}>
                    <input type="checkbox" checked={it.usato} onChange={() => toggleUsato(it.id)}
                      style={{ marginTop:3, cursor:"pointer", accentColor:"var(--purple)" }} />
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", flexWrap:"wrap" }}>
                        <span style={{ fontFamily:"'Cinzel',serif", fontWeight:700, color: it.usato?"var(--text-dim)":"var(--text-bright)", fontSize:"0.85rem", textDecoration: it.usato?"line-through":"none" }}>{it.nome}</span>
                        {it.bonus && <span style={{ fontSize:"0.7rem", background:`${TIPO_COLORS[it.tipo]}18`, color:TIPO_COLORS[it.tipo], border:`1px solid ${TIPO_COLORS[it.tipo]}30`, borderRadius:3, padding:"1px 6px" }}>{it.bonus}</span>}
                        {it.peso && <span style={{ fontSize:"0.68rem", color:"var(--text-dim)" }}>{it.peso}kg</span>}
                      </div>
                      {it.note && <div style={{ fontSize:"0.75rem", color:"var(--text-dim)", marginTop:"0.15rem" }}>{it.note}</div>}
                    </div>
                    <div style={{ display:"flex", gap:"0.3rem", flexShrink:0 }}>
                      <button onClick={() => startEdit(it)} style={{ background:"none", border:"1px solid var(--border)", borderRadius:4, padding:"0.2rem 0.4rem", cursor:"pointer", fontSize:"0.72rem", color:"var(--text-dim)" }}>✏️</button>
                      <button onClick={() => deleteItem(it.id)} style={{ background:"none", border:"1px solid rgba(224,80,80,0.3)", borderRadius:4, padding:"0.2rem 0.4rem", cursor:"pointer", fontSize:"0.72rem", color:"var(--danger)" }}>✕</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// PAGINA: TRACKER PA / PS
// ═══════════════════════════════════════════════════════
function TrackerPage() {
  const [personaggi, setPersonaggi] = useState(() => {
    try {
      const s = localStorage.getItem("arcadia_personaggi_v2");
      return s ? JSON.parse(s) : [];
    } catch { return []; }
  });
  const [selected, setSelected] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [newClasse, setNewClasse] = useState("");
  const [paInput, setPaInput] = useState("");
  const [psInputs, setPsInputs] = useState({});

  useEffect(() => {
    try { localStorage.setItem("arcadia_personaggi_v2", JSON.stringify(personaggi)); } catch {}
  }, [personaggi]);

  useEffect(() => {
    if (selected) {
      const p = personaggi.find(p => p.id===selected);
      if (p) {
        const init = {};
        p.skills?.forEach(sk => { init[sk.nome] = ""; });
        setPsInputs(init);
      }
    }
  }, [selected]);

  function createPersonaggio() {
    if (!newName.trim()) return;
    const classeData = CLASSI.find(c => c.nome===newClasse);
    const skills = classeData ? classeData.skills.map(s => ({ nome:s.nome, ps:0 })) : [];
    const np = {
      id: Date.now(),
      nome: newName.trim(),
      classe: newClasse || "—",
      pa: 0,
      skills,
      createdAt: new Date().toISOString(),
    };
    setPersonaggi(prev => [...prev, np]);
    setSelected(np.id);
    setNewName(""); setNewClasse(""); setShowNew(false);
  }

  function deletePersonaggio(id) {
    if (!confirm("Eliminare questo personaggio?")) return;
    setPersonaggi(prev => prev.filter(p => p.id!==id));
    if (selected===id) setSelected(null);
  }

  function addPA(id) {
    const val = parseInt(paInput);
    if (isNaN(val) || val===0) return;
    setPersonaggi(prev => prev.map(p => p.id===id ? { ...p, pa: Math.max(0, p.pa + val) } : p));
    setPaInput("");
  }

  function addPS(pgId, skillNome) {
    const val = parseInt(psInputs[skillNome]);
    if (isNaN(val) || val===0) return;
    setPersonaggi(prev => prev.map(p => {
      if (p.id!==pgId) return p;
      return {
        ...p,
        skills: p.skills.map(sk => sk.nome===skillNome ? { ...sk, ps: Math.max(0, sk.ps + val) } : sk)
      };
    }));
    setPsInputs(prev => ({ ...prev, [skillNome]: "" }));
  }

  function getSkillLv(ps) {
    const soglie = [0,20,70,170,370];
    let lv = 1;
    for (let i=soglie.length-1; i>=0; i--) { if (ps>=soglie[i]) { lv=i+1; break; } }
    return lv;
  }

  function getSkillProgress(ps, lv) {
    const soglie = [0,20,70,170,370];
    if (lv>=5) return 100;
    const start = soglie[lv-1];
    const end = soglie[lv];
    return Math.min(100, ((ps-start)/(end-start))*100);
  }

  const pg = selected ? personaggi.find(p => p.id===selected) : null;
  const rankAuto = pg ? getRankFromPA(pg.pa) : null;
  // rankManuale: null = segue PA, altrimenti rank scelto a mano
  const rank = pg ? (pg.rankManuale || rankAuto) : null;
  const nextRankPA = pg ? getNextRankPA(rankAuto) : null;
  const rankPct = pg && nextRankPA ? ((pg.pa - RANK_PA[rankAuto]) / (nextRankPA - RANK_PA[rankAuto])) * 100 : 100;

  // Stats calcolate per il rank attuale
  const pgStats = pg && pg.hp_base ? {
    hp: Math.round(pg.hp_base * RANK_MHP[rank]),
    fl: Math.round(pg.fl_base * RANK_MFL[rank]),
    dif: pg.dif_base + RANK_BDIF[rank],
    vel: pg.vel_base || "—",
  } : null;

  function setRankManuale(id, r) {
    setPersonaggi(prev => prev.map(p => p.id===id ? { ...p, rankManuale: r==="auto" ? null : r } : p));
  }

  function updateFazione(id, val) {
    setPersonaggi(prev => prev.map(p => p.id===id ? { ...p, fazione: val } : p));
  }

  function updateNote(id, val) {
    setPersonaggi(prev => prev.map(p => p.id===id ? { ...p, note: val } : p));
  }

  function exportPGPDF(pg) {
    if (!pg.classeData) { alert("Questo personaggio non ha dati completi per il PDF. Ricrealo dal Generatore."); return; }
    exportPDF({
      nome: pg.nome, classe: pg.classeData, frammento: pg.frammento,
      razza: pg.razza, background: pg.background,
      hp: pg.hp_base, fl: pg.fl_base, dif: pg.dif_base,
      vel: pg.vel_base, scintille: pg.scintille || 3,
    });
  }

  return (
    <div className="anim-fade-in">
      <div style={{ marginBottom:"2rem" }}>
        <div className="section-title">Progressione</div>
        <div className="page-title">Tracker PA & PS</div>
        <p className="page-subtitle">Tieni traccia dei Punti Avanzamento (Rank) e Punti Sogno (Skill) dei tuoi personaggi. I dati vengono salvati automaticamente.</p>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"280px 1fr", gap:"1.5rem", alignItems:"start" }}>
        {/* Sidebar personaggi */}
        <div>
          <div style={{ background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:10, overflow:"hidden" }}>
            <div style={{ padding:"0.9rem 1.2rem", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div style={{ fontFamily:"'Cinzel',serif", fontSize:"0.8rem", fontWeight:700, color:"var(--text-dim)", letterSpacing:"0.1em", textTransform:"uppercase" }}>
                Personaggi ({personaggi.length})
              </div>
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

            {personaggi.length === 0 ? (
              <div style={{ padding:"2rem", textAlign:"center", color:"var(--text-dim)", fontSize:"0.85rem" }}>
                <div style={{ fontSize:"2rem", marginBottom:"0.5rem" }}>⚔️</div>
                Nessun personaggio ancora.<br/>Crea il primo con "+ Nuovo".
              </div>
            ) : (
              <div>
                {personaggi.map(p => {
                  const r = getRankFromPA(p.pa);
                  const isSelected = p.id===selected;
                  return (
                    <div key={p.id} onClick={() => setSelected(p.id)} style={{
                      padding:"0.8rem 1.2rem",
                      borderBottom:"1px solid rgba(140,110,255,0.06)",
                      cursor:"pointer",
                      background: isSelected ? "rgba(140,110,255,0.08)" : "transparent",
                      borderLeft: isSelected ? "3px solid var(--purple)" : "3px solid transparent",
                      transition:"all 0.15s",
                    }}>
                      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                        <div style={{ fontFamily:"'Cinzel',serif", fontWeight:700, color:isSelected?"var(--text-bright)":"var(--text)", fontSize:"0.88rem" }}>{p.nome}</div>
                        <RankBadge rank={r} size="sm" />
                      </div>
                      <div style={{ fontSize:"0.72rem", color:"var(--text-dim)", marginTop:"0.15rem" }}>{p.classe}</div>
                      <div style={{ marginTop:"0.4rem" }}>
                        <ProgressBar value={p.pa - RANK_PA[r]} max={(getNextRankPA(r)||RANK_PA[r]+1) - RANK_PA[r]} color={getRankColor(r)} height={3} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Dettaglio personaggio */}
        {pg ? (
          <div className="anim-fade-in">
            {/* Header */}
            <div style={{ background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:10, padding:"1.5rem", marginBottom:"1rem" }}>
              <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:"1rem", flexWrap:"wrap" }}>
                <div>
                  <div style={{ fontFamily:"'Cinzel Decorative',serif", fontSize:"1.4rem", fontWeight:700, color:"var(--text-bright)" }}>{pg.nome}</div>
                  <div style={{ color:"var(--text-dim)", fontSize:"0.82rem", marginTop:"0.2rem" }}>{pg.classe}{pg.razza ? ` · ${pg.razza.nome}` : ""}{pg.background ? ` · ${pg.background}` : ""}</div>
                </div>
                <div style={{ display:"flex", gap:"0.5rem", alignItems:"center", flexWrap:"wrap" }}>
                  <RankBadge rank={rank} size="lg" />
                  {pg.classeData && (
                    <button className="btn btn-gold" style={{ fontSize:"0.72rem", padding:"0.3rem 0.7rem" }} onClick={() => exportPGPDF(pg)}>📄 PDF</button>
                  )}
                  <button className="btn btn-danger" style={{ fontSize:"0.72rem", padding:"0.3rem 0.7rem" }} onClick={() => deletePersonaggio(pg.id)}>Elimina</button>
                </div>
              </div>

              {/* Stats live per Rank */}
              {pgStats && (
                <div style={{ marginTop:"1rem", padding:"0.75rem 1rem", background:"rgba(140,110,255,0.05)", border:"1px solid var(--border)", borderRadius:8 }}>
                  <div style={{ fontSize:"0.65rem", color:"var(--text-dim)", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:"0.5rem" }}>
                    Statistiche al Rank <span style={{ color:getRankColor(rank), fontWeight:700 }}>{rank}</span>
                    {pg.rankManuale && <span style={{ color:"var(--gold)", marginLeft:"0.5rem" }}>(impostato manualmente)</span>}
                  </div>
                  <div style={{ display:"flex", gap:"1rem", flexWrap:"wrap" }}>
                    {[
                      {l:"HP",v:pgStats.hp,c:"var(--danger)"},
                      {l:"Flusso",v:pgStats.fl,c:"var(--flux)"},
                      {l:"Difesa",v:pgStats.dif,c:"var(--purple)"},
                      {l:"Velocità",v:pgStats.vel,c:"var(--gold)"},
                    ].map(s => (
                      <div key={s.l} style={{ textAlign:"center", minWidth:56 }}>
                        <div style={{ fontSize:"0.6rem", color:"var(--text-dim)", textTransform:"uppercase" }}>{s.l}</div>
                        <div style={{ fontFamily:"'Cinzel',serif", fontWeight:900, color:s.c, fontSize:"1.3rem", lineHeight:1 }}>{s.v}</div>
                      </div>
                    ))}
                    {rank === "S" || rank === "SS" || rank === "SSS" ? (
                      <div style={{ background:"rgba(212,168,67,0.1)", border:"1px solid rgba(212,168,67,0.3)", borderRadius:6, padding:"0.3rem 0.7rem", display:"flex", alignItems:"center" }}>
                        <span style={{ fontSize:"0.75rem", color:"var(--gold)", fontWeight:700 }}>✦ Frammento Risvegliato — AU sbloccata</span>
                      </div>
                    ) : null}
                  </div>
                </div>
              )}

              {/* Selettore Rank Manuale */}
              <div style={{ marginTop:"1rem" }}>
                <div style={{ fontSize:"0.7rem", color:"var(--text-dim)", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:"0.4rem" }}>
                  Livello Rank &nbsp;<span style={{ color:"var(--text-dim)", fontWeight:400 }}>(il Rank segue i PA automaticamente, oppure impostalo a mano)</span>
                </div>
                <div style={{ display:"flex", gap:"0.35rem", flexWrap:"wrap" }}>
                  <button onClick={() => setRankManuale(pg.id, "auto")} style={{
                    padding:"0.25rem 0.6rem", borderRadius:4, border:`1px solid ${!pg.rankManuale?"var(--purple)":"var(--border)"}`,
                    background: !pg.rankManuale ? "rgba(140,110,255,0.15)" : "transparent",
                    color: !pg.rankManuale ? "var(--purple)" : "var(--text-dim)",
                    cursor:"pointer", fontSize:"0.72rem", fontWeight:600, fontFamily:"'Raleway',sans-serif",
                  }}>Auto (PA)</button>
                  {RANKS.map(r => {
                    const col = getRankColor(r);
                    const active = pg.rankManuale===r;
                    return (
                      <button key={r} onClick={() => setRankManuale(pg.id, r)} style={{
                        padding:"0.25rem 0.6rem", borderRadius:4, border:`1px solid ${active?col:"var(--border)"}`,
                        background: active ? `${col}20` : "transparent",
                        color: active ? col : "var(--text-dim)",
                        cursor:"pointer", fontSize:"0.75rem", fontWeight:active?900:400, fontFamily:"'Cinzel',sans-serif",
                        transition:"all 0.15s",
                      }}>{r}</button>
                    );
                  })}
                </div>
              </div>

              <div className="sep" />

              {/* PA section */}
              <div style={{ marginBottom:"1rem" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"0.6rem" }}>
                  <div>
                    <span className="section-title" style={{ display:"inline" }}>PA Totali: </span>
                    <span style={{ fontFamily:"'Cinzel',serif", fontWeight:900, fontSize:"1.5rem", color:"var(--gold)", marginLeft:"0.5rem" }}>{pg.pa.toLocaleString()}</span>
                  </div>
                  <div style={{ textAlign:"right", fontSize:"0.78rem", color:"var(--text-dim)" }}>
                    {nextRankPA ? (
                      <>Prossimo Rank ({RANKS[RANKS.indexOf(rankAuto)+1]}): {nextRankPA.toLocaleString()} PA<br/>
                      Mancano: <span style={{ color:"var(--gold)" }}>{(nextRankPA - pg.pa).toLocaleString()} PA</span></>
                    ) : <span style={{ color:"var(--gold)" }}>Rank Massimo Raggiunto</span>}
                  </div>
                </div>
                <ProgressBar value={pg.pa - RANK_PA[rankAuto]} max={(nextRankPA||RANK_PA[rankAuto]+1) - RANK_PA[rankAuto]} color={getRankColor(rankAuto)} height={8} />
                <div style={{ display:"flex", justifyContent:"space-between", marginTop:"0.3rem", fontSize:"0.68rem", color:"var(--text-dim)" }}>
                  <span>Rank {rankAuto} — {RANK_PA[rankAuto]} PA</span>
                  {nextRankPA && <span>Rank {RANKS[RANKS.indexOf(rankAuto)+1]} — {nextRankPA} PA</span>}
                </div>
              </div>

              {/* Input PA */}
              <div style={{ display:"flex", gap:"0.75rem", alignItems:"center", flexWrap:"wrap" }}>
                <input className="input-field" type="number" placeholder="PA da aggiungere/togliere (es: +50 o -10)" value={paInput}
                  onChange={e => setPaInput(e.target.value)}
                  onKeyDown={e => e.key==="Enter" && addPA(pg.id)}
                  style={{ maxWidth:320, fontSize:"0.88rem" }} />
                <button className="btn btn-gold" onClick={() => addPA(pg.id)}>Aggiorna PA</button>
              </div>

              {/* Rank steps */}
              <div style={{ marginTop:"1rem", display:"flex", gap:"0.4rem", flexWrap:"wrap" }}>
                {RANKS.map(r => {
                  const col = getRankColor(r);
                  const achieved = pg.pa >= RANK_PA[r];
                  const isCurrent = r===rank;
                  return (
                    <div key={r} style={{
                      padding:"0.3rem 0.7rem", borderRadius:4, fontSize:"0.7rem",
                      border:`1px solid ${achieved ? col+"60" : "rgba(140,110,255,0.1)"}`,
                      background: isCurrent ? `${col}18` : achieved ? `${col}08` : "transparent",
                      color: achieved ? col : "var(--text-dim)",
                      fontFamily:"'Cinzel',serif", fontWeight:700,
                      opacity: achieved ? 1 : 0.4,
                      position:"relative",
                    }}>
                      {r}
                      {isCurrent && <span style={{ position:"absolute", top:-6, right:-3, width:6, height:6, borderRadius:"50%", background:col, boxShadow:`0 0 6px ${col}` }} />}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* PS Skills */}
            <div style={{ background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:10, overflow:"hidden" }}>
              <div style={{ padding:"1rem 1.5rem", borderBottom:"1px solid var(--border)" }}>
                <div className="section-title">PS Skill — Punti Sogno</div>
                <p style={{ fontSize:"0.78rem", color:"var(--text-dim)", marginTop:"0.25rem" }}>
                  I PS si accumulano usando le Skill. Aggiungi i PS guadagnati durante le sessioni.
                </p>
              </div>
              {pg.skills && pg.skills.length > 0 ? (
                <div>
                  {pg.skills.map(sk => {
                    const lv = getSkillLv(sk.ps);
                    const pct = getSkillProgress(sk.ps, lv);
                    const soglie = [0,20,70,170,370];
                    const nextSoglia = lv < 5 ? soglie[lv] : null;
                    const sklColors = ["","var(--text-dim)","var(--purple)","var(--flux)","var(--gold)","var(--gold-bright)"];
                    return (
                      <div key={sk.nome} style={{ padding:"1.1rem 1.5rem", borderBottom:"1px solid rgba(140,110,255,0.06)" }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"0.5rem", gap:"1rem", flexWrap:"wrap" }}>
                          <div>
                            <div style={{ fontFamily:"'Cinzel',serif", fontWeight:700, color:"var(--text-bright)", fontSize:"0.88rem" }}>{sk.nome}</div>
                            <div style={{ display:"flex", gap:"0.5rem", alignItems:"center", marginTop:"0.2rem" }}>
                              <span style={{ fontFamily:"'Cinzel',serif", fontWeight:700, fontSize:"0.8rem", color:sklColors[lv] }}>Lv {lv}</span>
                              {lv < 5 && <span style={{ fontSize:"0.72rem", color:"var(--text-dim)" }}>{sk.ps} / {nextSoglia} PS</span>}
                              {lv === 5 && <span style={{ fontSize:"0.72rem", color:"var(--gold)" }}>✦ FORMA FINALE</span>}
                            </div>
                          </div>
                          <div style={{ display:"flex", gap:"0.5rem", alignItems:"center" }}>
                            <input className="input-field" type="number" placeholder="+PS"
                              value={psInputs[sk.nome]||""}
                              onChange={e => setPsInputs(prev => ({...prev,[sk.nome]:e.target.value}))}
                              onKeyDown={e => e.key==="Enter" && addPS(pg.id, sk.nome)}
                              style={{ width:90, fontSize:"0.85rem", padding:"0.4rem 0.6rem" }} />
                            <button className="btn btn-outline" style={{ fontSize:"0.78rem", padding:"0.4rem 0.7rem" }} onClick={() => addPS(pg.id, sk.nome)}>+</button>
                          </div>
                        </div>
                        <ProgressBar value={sk.ps - (lv>=5?370:([0,20,70,170,370][lv-1]))} max={lv>=5?1:([0,20,70,170,370][lv]-[0,20,70,170,370][lv-1])} color={sklColors[lv]} height={5} />
                        <div style={{ display:"flex", gap:"0.25rem", marginTop:"0.4rem" }}>
                          {[1,2,3,4,5].map(l => (
                            <div key={l} style={{
                              height:4, flex:1, borderRadius:2,
                              background: sk.ps >= [0,20,70,170,370][l-1] ? sklColors[l] : "rgba(140,110,255,0.1)",
                              transition:"background 0.3s"
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

            {/* ══ COMBATTIMENTO ══ */}
            <CombatPanel pg={pg} setPersonaggi={setPersonaggi} pgStats={pgStats} rank={rank} />

            {/* ══ INVENTARIO ══ */}
            <InventarioPanel pg={pg} setPersonaggi={setPersonaggi} />
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"4rem", color:"var(--text-dim)", textAlign:"center" }}>
            <div style={{ fontSize:"3rem", marginBottom:"1rem", animation:"float 4s ease-in-out infinite" }}>📊</div>
            <div style={{ fontFamily:"'Cinzel',serif", color:"var(--text)", marginBottom:"0.5rem" }}>Seleziona un personaggio</div>
            <p style={{ fontSize:"0.85rem", maxWidth:280 }}>Scegli un personaggio dalla lista o creane uno nuovo per iniziare a tracciare PA e PS.</p>
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
  const [savedAlert, setSavedAlert] = useState(false);

  // Funzione globale per salvare PG dal generatore nel tracker
  function saveToTracker(generated) {
    try {
      const existing = JSON.parse(localStorage.getItem("arcadia_personaggi_v2") || "[]");
      const np = {
        id: Date.now(),
        nome: generated.nome,
        classe: generated.classe.nome,
        classeData: generated.classe,
        frammento: generated.frammento,
        razza: generated.razza,
        background: generated.background || "",
        pa: 0,
        rankManuale: null, // null = auto da PA
        skills: generated.classe.skills.map(s => ({ nome: s.nome, ps: 0 })),
        hp_base: generated.hp,
        fl_base: generated.fl,
        dif_base: generated.dif,
        vel_base: generated.vel,
        scintille: generated.scintille,
        fazione: "",
        note: "",
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem("arcadia_personaggi_v2", JSON.stringify([...existing, np]));
      setSavedAlert(true);
      setTimeout(() => setSavedAlert(false), 3000);
    } catch(e) { alert("Errore nel salvataggio."); }
  }

  const navItems = [
    { id:"home", label:"Home" },
    { id:"wiki", label:"Wiki" },
    { id:"generator", label:"Genera PG" },
    { id:"tracker", label:"Tracker" },
  ];

  const PageComponent = {
    home: () => <HomePage setPage={setPage} />,
    wiki: () => <WikiPage />,
    generator: () => <GeneratorePage saveToTracker={saveToTracker} setPage={setPage} />,
    tracker: () => <TrackerPage />,
  }[page] || (() => <HomePage setPage={setPage} />);

  return (
    <>
      <GlobalStyles />
      <div id="app-root">
        <div className="app-content">
          <nav className="navbar">
            <div className="navbar-logo" onClick={() => setPage("home")}>ARCADIA2099</div>
            <div className="navbar-divider" />
            <div className="navbar-nav">
              {navItems.map(n => (
                <button key={n.id} className={`nav-btn ${page===n.id?"active":""}`} onClick={() => setPage(n.id)}>
                  {n.label}
                </button>
              ))}
            </div>
          </nav>
          {savedAlert && (
            <div style={{
              position:"fixed", top:72, right:24, zIndex:999,
              background:"#1a3a1a", border:"1px solid #4ecb71", borderRadius:8,
              padding:"0.75rem 1.25rem", color:"#4ecb71", fontWeight:700, fontSize:"0.85rem",
              boxShadow:"0 4px 20px rgba(0,0,0,0.4)", animation:"fade-in 0.3s ease"
            }}>
              ✓ Personaggio salvato nel Tracker!
            </div>
          )}
          <div className="page">
            <PageComponent />
          </div>
        </div>
      </div>
    </>
  );
}
