import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { NPCS, BESTIARIO, ARSENALE } from "../compendio.js";

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
   desc:"Non esiste un limite alla progressione delle sue Skill. La classe con il più alto potenziale di adattamento. Osservando un nemico in combattimento può acquisirne la tecnica: tiro INT DC 15 (stesso Rank) o DC 20 (Rank superiore), costo 60 PS. Massimo 3 Skill acquisibili con questo metodo per campagna.",
   skills:[{nome:"Lama dell'Ego",costo:"2",desc:"Attacco FOR. Danno 2d8+2. Se supera Difesa di 5+: Rottura Armatura (–2 Difesa, 2 turni).",lv2:"+1d danno o –1 costo Flusso",lv3:"Ignora 50% bonus armatura",lv4:"Danno 3d10+2, Rottura dura 3t",lv5:"FINALE: colpisce sempre, 4d8+2, Rottura permanente"},
    {nome:"Tempesta di Lame",costo:"4",desc:"Colpisce TUTTI i nemici in portata ravvicinata. FOR separato. Danno 1d8+2.",lv2:"2d8+2 ciascuno",lv3:"Portata 4m",lv4:"2d10+2 + Rallentato 1t",lv5:"FINALE: no tiro vs già colpiti, 3d8+2"},
    {nome:"Sfida del Guerriero",costo:"1+✦",desc:"Bersaglio: Svantaggio vs altri 2t. Tu: +1 Difesa vs lui.",lv2:"Dura 3t, costo ✦ rimosso",lv3:"–1 danni bersaglio attivo",lv4:"2 bersagli (2 Flusso)",lv5:"FINALE: bersaglio DEVE attaccare te. Se attacca altri: 1d6 automatici"}]},
  {cat:1,pos:2,nome:"Berserker",flavor:"Potenza pura — massimo danno",icon:"🔥",FOR:16,AGI:10,RES:14,INT:8,PER:8,CAR:8,hp:68,fl:16,dif:10,vel:5,dado:"1d12",
   desc:"Privilegia la potenza offensiva rispetto a qualsiasi approccio tattico. Il Berserker non difende — travolge. Difesa bassa (10), compensata dagli HP alti. La Frenesia è il cuore della classe: entra, distrugge, esce prima che arrivi la risposta.",
   skills:[{nome:"Colpo Selvaggio",costo:"0",desc:"Attacco FOR. Danno 1d12+3. Manca di 1-3: 1d6 da pressione. No Schivata stessa turno.",lv2:"2d10+3",lv3:"Pressione sale a 1d8",lv4:"2d12+3. Critico: vola 3m (Prono)",lv5:"FINALE: colpisce sempre, 3d10+3"},
    {nome:"Frenesia",costo:"3",desc:"Azione Bonus. Per 3t: +3 danni, no Skill >2 Flusso, immune Spaventato. Poi: Esausto 2t.",lv2:"Dura 4t, Esausto 1t",lv3:"+5 danni, immune anche Stordito",lv4:"Esausto scompare",lv5:"FINALE: attiva automaticamente sotto 30% HP, costo 0"},
    {nome:"Grido di Guerra",costo:"0",desc:"A.Bonus. Alleati entro 6m: +1 danni 2t. Tu: +2. 1/scontro.",lv2:"Alleati +2",lv3:"+1 Difesa per tutti 2t",lv4:"Utilizzabile 2/scontro",lv5:"FINALE: automatico a inizio scontro, dura 3t"}]},
  {cat:1,pos:3,nome:"Paladino Arkadiano",flavor:"Forza fisica e Flusso curativo",icon:"✨",FOR:13,AGI:10,RES:14,INT:10,PER:12,CAR:11,hp:67,fl:32,dif:10,vel:5,dado:"1d10",
   desc:"Il personaggio eccelle sia nel combattimento in prima lineaento che nel supporto. La classe più equilibrata del sistema. Nessun primato assoluto, nessun punto critico di debolezza. Il sacrificio dell'Imposizione delle Mani è una scelta tattica costante — il suo valore aumenta proporzionalmente alla situazione.",
   skills:[{nome:"Colpo Sacro",costo:"2",desc:"Attacco FOR. Danno 1d8+1 + 1d6 sacro (ignora armatura). Vs non-morti/corrotti: sacro x2.",lv2:"2d6+1 fisico",lv3:"Sacro 2d6 + Benedizione alleato",lv4:"2d8+1, sacro 2d8",lv5:"FINALE: sacro guarisce il Paladino del 50%"},
    {nome:"Aura Protettiva",costo:"3",desc:"A.Bonus. Alleati entro 4m: +1 Difesa e resist. veleni 3t.",lv2:"Portata 6m, costo 2",lv3:"+2 Difesa + resist. Spaventato",lv4:"Dura 5t",lv5:"FINALE: sempre attiva, costo 1 a inizio scontro"},
    {nome:"Imposizione delle Mani",costo:"0*",desc:"A.Bonus. Cura alleato adiacente 1d8+1 HP. *Tu perdi metà HP curati.",lv2:"Cura 2d6+1",lv3:"Sacrificio scende a 1/3. Rimuove Avvelenato",lv4:"Cura 2d8+1. No sacrificio.",lv5:"FINALE: portata 6m, 3d6+1, rimuove qualsiasi condizione"}]},
  {cat:1,pos:4,nome:"Cacciatore di Bestie",flavor:"Conosce i nemici meglio di loro",icon:"🎯",FOR:14,AGI:14,RES:12,INT:8,PER:12,CAR:8,hp:55,fl:22,dif:12,vel:7,dado:"1d8",
   desc:"Analizza i propri avversari prima ancora di affrontarli. Versatile e tecnico. Il suo valore reale emerge con la conoscenza del nemico — più sa, più fa. Nei dungeon con mostri variati è la classe più efficace in assoluto.",
   skills:[{nome:"Analisi della Preda",costo:"1",desc:"A.Bonus. Scopri HP approssimativi, Difesa esatta o debolezza elementale. +2 danni 3t.",lv2:"Scopri tutte e 3 le info",lv3:"+3 danni, dura 5t",lv4:"Debolezza causa danni doppi",lv5:"FINALE: sempre attiva su qualsiasi nemico incontrato"},
    {nome:"Trappola Esplosiva",costo:"3",desc:"Piazza trappola entro 4m. Primo nemico: 2d6 + Rallentato 2t (RES DC 13). Attiva 3t.",lv2:"3d6, 2 trappole per attivazione",lv3:"Rallentato → Immobilizzato",lv4:"Non scade mai",lv5:"FINALE: invisibile anche a sensi soprannaturali, 4d6 + Stordito 1t"},
    {nome:"Colpo del Cacciatore",costo:"2",desc:"Vantaggio se già colpito. Danno 1d8+2. Marca: ogni attacco +1d4.",lv2:"+1d6 invece di +1d4",lv3:"Vantaggio anche 1° attacco se marcato",lv4:"Marca non svanisce mai",lv5:"FINALE: ignora tutta l'armatura del bersaglio marcato"}]},
  {cat:2,pos:1,nome:"Assassino",flavor:"Un colpo — bersaglio eliminato",icon:"🗡️",FOR:10,AGI:16,RES:10,INT:10,PER:12,CAR:8,hp:52,fl:28,dif:13,vel:8,dado:"1d8",
   desc:"Un singolo attacco ben posizionato è sufficiente a eliminare il bersaglio. Fragile se scoperto, letale se in posizione. Con Difesa 13 regge discretamente, ma i 52 HP sono il suo limite reale. Ogni scontro è una finestra temporale — apri con Esecuzione, chiudi prima di essere colpito.",
   skills:[{nome:"Lama Avvelenata",costo:"2",desc:"Attacco AGI. Danno 1d6+3 + Veleno (1d4/turno 3t, RES DC 13).",lv2:"Veleno 4t, DC 14",lv3:"Veleno applica –1 a tutti i tiri",lv4:"2d6+3, veleno 2 stack",lv5:"FINALE: veleno permanente per lo scontro"},
    {nome:"Passo d'Ombra",costo:"3",desc:"A.Bonus. Stealth assoluto. Prossimo attacco da stealth = critico automatico (x2). 1/scontro.",lv2:"2/scontro",lv3:"Critico da stealth = x2.5",lv4:"Costo 2, 3/scontro",lv5:"FINALE: gratuito (0 Flusso), illimitato"},
    {nome:"Esecuzione",costo:"4",desc:"Solo da stealth. Colpisce sempre: 3d6+3, ignora tutta l'armatura. Bersaglio >75% HP: x1.5.",lv2:"4d6+3",lv3:"Soglia sale a >50% HP",lv4:"Se uccide: rientra in stealth gratis",lv5:"FINALE: usabile senza stealth (danno /2). Da stealth: 5d6+3"}]},
  {cat:2,pos:2,nome:"Ranger del Flusso",flavor:"Efficace a distanza e in mischia",icon:"🏹",FOR:12,AGI:15,RES:11,INT:10,PER:13,CAR:8,hp:50,fl:26,dif:12,vel:7,dado:"1d8",
   desc:"Risulta efficace sia a distanza che in mischia. La classe con la curva di efficacia più stabile del sistema. Nessuna debolezza critica, nessun picco di potenza estremo. Adatta a qualsiasi composizione di gruppo senza richiedere gestione di meccaniche ad alto rischio. 29 CHAOS SYSTEM Arcadia2099 Volume Unico · v7.0",
   skills:[{nome:"Freccia Perforante",costo:"2",desc:"Attacco AGI a distanza. Danno 1d8+2. Ignora 50% bonus armatura.",lv2:"2d6+2",lv3:"Ignora 100% armatura",lv4:"Portata doppia, 2d8+2",lv5:"FINALE: colpisce 2 bersagli in linea retta"},
    {nome:"Colpo Doppio",costo:"3",desc:"2 attacchi: 1d20+2, danno 1d6+2. Il 2° ha –2 al tiro.",lv2:"2° senza penalità",lv3:"Colpo Triplo (3° ha –1)",lv4:"Vantaggio su tutti e 3 se marcato",lv5:"FINALE: Colpo Quadruplo. Critico aggiunge attacco bonus"},
    {nome:"Marcatura",costo:"1",desc:"A.Bonus. Bersaglio marcato: Vantaggio su tutti i tuoi attacchi 3t.",lv2:"Dura 5t",lv3:"Tutti gli alleati hanno Vantaggio vs marcato",lv4:"2 bersagli simultanei",lv5:"FINALE: permanente per lo scontro, costo 0"}]},
  {cat:2,pos:3,nome:"Danzatore di Lame",flavor:"Ogni schivata genera il prossimo attacco",icon:"💫",FOR:12,AGI:15,RES:10,INT:10,PER:8,CAR:11,hp:49,fl:30,dif:12,vel:7,dado:"1d8",
   desc:"Più viene attaccato, più è efficace. Una classe che trasforma la difesa in attacco. Schivare non è perdere un turno — e' preparare il successivo. Il ritmo del Danzatore è unico: più il nemico manca, più si mette in pericolo.",
   skills:[{nome:"Passo del Vento",costo:"2",desc:"Reazione quando colpito: AGI DC 13. Successo: schivi. Se schivi: Vantaggio prossimo attacco.",lv2:"DC scende a 11",lv3:"Schivata: +2 danni prossimo attacco",lv4:"Costo 1",lv5:"FINALE: gratuito. 2 schivate consecutive → prossimo attacco critico auto"},
    {nome:"Danza delle Lame",costo:"4",desc:"4 attacchi rapidi: 1d4+2. Ogni colpo riduce costo Flusso prossimo di 1.",lv2:"5 attacchi, 1d6+2",lv3:"Tutti a segno: bersaglio Stordito 1t",lv4:"Costo 3",lv5:"FINALE: 6 attacchi, 1d8+2. 1° critico → tutti lo sono"},
    {nome:"Contrattacco Fluido",costo:"0",desc:"Passivo. Nemico ti manca: contrattacca (1d6+2, no tiro). 1/round.",lv2:"1d8+2",lv3:"Applica anche Sanguinante",lv4:"2/round",lv5:"FINALE: attivo anche quando alleati entro 3m vengono mancati"}]},
  {cat:2,pos:4,nome:"Ombra del Vento",flavor:"Mobile e inafferrabile",icon:"🌑",FOR:8,AGI:16,RES:10,INT:12,PER:10,CAR:10,hp:55,fl:42,dif:13,vel:8,dado:"1d6",
   desc:"Il personaggio è difficile da individuare e quasi impossibile da fermare. La più mobile del gioco. Combina la velocita' dell'Assassino con la flessibilita' magica. Il dado vita d6 è fragile — va eliminato prima di essere colpito, usando il teletrasporto per non esserlo mai.",
   skills:[{nome:"Passo Dimensionale",costo:"2",desc:"A.Bonus. Teletrasporto a punto visibile entro 8m. +2 danni prossimo attacco.",lv2:"Portata 12m, +3 danni",lv3:"Trascina un alleato adiacente",lv4:"2/turno",lv5:"FINALE: gratuito, portata illimitata"},
    {nome:"Lama d'Ombra",costo:"3",desc:"Attacco AGI. 1d6+3 + 1d6 oscuro (ignora armatura). Dopo Passo: oscuro x2.",lv2:"2d6+3 fisico",lv3:"Oscuro 2d6",lv4:"Dopo Passo: oscuro x3",lv5:"FINALE: a cono (3m). Tutti i bersagli subiscono danno completo"},
    {nome:"Velo d'Ombra",costo:"2",desc:"A.Bonus. Campo oscuro 3m 2t: Svantaggio su attacchi verso di te.",lv2:"Campo 5m",lv3:"Dura 3t + Rallentato chi entra",lv4:"Si sposta con te",lv5:"FINALE: invisibile. Ti dà stealth mentre sei al suo interno"}]},
  {cat:3,pos:1,nome:"Mago del Caos",flavor:"Distrugge aree — fragile come cristallo",icon:"⚡",FOR:8,AGI:12,RES:9,INT:16,PER:12,CAR:9,hp:50,fl:56,dif:11,vel:6,dado:"1d6",
   desc:"Dispone però di una Difesa estremamente bassa. Il Flusso più alto del gioco (56 al Rank F, 160 al Rank SSS). Puo' mantenere Nova Oscura per molti round. Il problema è la RES 9: senza lo Scudo Arcano, due colpi fisici lo mettono fuori combattimento.",
   skills:[{nome:"Nova Oscura",costo:"5",desc:"Area 4m entro 20m. AGI DC 13. Fallimento: 3d6+3. Successo: metà.",lv2:"4d6+3",lv3:"Raggio 6m, DC 14",lv4:"Tipo danno a scelta",lv5:"FINALE: colpisce TUTTI i nemici visibili. No tiro. 4d8+3"},
    {nome:"Sigillo del Silenzio",costo:"3",desc:"INT vs RES DC 12. Pieno: no Skill 2t. Parziale: 1t.",lv2:"Pieno 3t, Parziale 2t",lv3:"Il Sigillo si trasferisce se il bersaglio muore",lv4:"Costo 2",lv5:"FINALE: area 5m (tutti i nemici), 1t. Costo 6"},
    {nome:"Scudo Arcano",costo:"3",desc:"Reazione. Assorbe 1d8+3 danni. Se assorbe tutto: nessuna condizione.",lv2:"2d8+3",lv3:"Attivabile su alleato entro 6m",lv4:"3d6+3. Se assorbe tutto: 50% riflesso",lv5:"FINALE: sempre attivo (passivo), assorbe 1d6+3 da qualsiasi fonte"}]},
  {cat:3,pos:2,nome:"Evocatore del Flusso",flavor:"Combatte tramite creature create dal Flusso",icon:"🌀",FOR:8,AGI:10,RES:10,INT:15,PER:14,CAR:9,hp:53,fl:52,dif:10,vel:5,dado:"1d6",
   desc:"Genera creature dal Flusso che agiscono al suo posto. Una classe a progressione lenta e potenza crescente. Al Rank F le Sentinelle hanno un ruolo di supporto. Al Rank S, con tre evocazioni attive e Rinforzo Mistico, il potenziale offensivo in area supera la maggior parte delle classi DPS dirette. 37 CHAOS SYSTEM Arcadia2099 Volume Unico · v7.0",
   skills:[{nome:"Evoca Sentinella",costo:"4",desc:"Sentinella: HP 30, Attacco 1d6+2, Difesa 12. Dura 3t. Max 1.",lv2:"HP 50, Attacco 2d6+2",lv3:"Max 2 attive",lv4:"HP 70, si interpone tra te e attacchi",lv5:"FINALE: nessuna durata. Max 3 attive"},
    {nome:"Esplosione di Evocazione",costo:"5",desc:"Ogni creatura evocata esplode area 3m: 2d6+2 (AGI DC 12 per metà). Svanisce.",lv2:"3d6+2",lv3:"Raggio 5m",lv4:"Creatura sostituita gratis dopo esplosione",lv5:"FINALE: scegli se svanisce o sopravvive. 4d6+2"},
    {nome:"Rinforzo Mistico",costo:"3",desc:"A.Bonus. Creatura evocata: +4 danni 2t. Prossima Reazione gratis.",lv2:"+6 danni",lv3:"+2 Difesa e +10 HP temporanei",lv4:"Dura 3t",lv5:"FINALE: gratuito, si applica a tutte le creature attive"}]},
  {cat:3,pos:3,nome:"Negromante",flavor:"Si nutre dell'energia dei nemici",icon:"💀",FOR:10,AGI:10,RES:11,INT:15,PER:10,CAR:10,hp:58,fl:50,dif:10,vel:5,dado:"1d6",
   desc:"Quanto più attacca, più risorse recupera. Più il combattimento dura, più il Negromante sta bene. Si autoripristina continuamente. Eccelle contro boss solitari con molti HP — il Vincolo dell'Anima in forma finale contro un boss è il drain più alto del gioco.",
   skills:[{nome:"Tocco Drenante",costo:"3",desc:"Attacco INT. Danno 1d6+2. Recuperi 50% HP. Bersaglio <30%: recuperi 100%.",lv2:"Soglia sale a <40%",lv3:"Drena anche 1 Flusso ogni 5 HP drenati",lv4:"2d6+2, soglia <50%",lv5:"FINALE: costo 0, usabile come A.Bonus"},
    {nome:"Maledizione di Debolezza",costo:"4",desc:"INT vs RES DC 12. Pieno: –3 a tutti i tiri 2t. Parziale: –2 prossimo tiro.",lv2:"Pieno –4 per 3t",lv3:"Si trasferisce se il bersaglio muore",lv4:"Area 4m, –3 a tutti",lv5:"FINALE: permanente per lo scontro"},
    {nome:"Vincolo dell'Anima",costo:"5",desc:"Per 2t: ogni HP che perde il bersaglio, recuperi metà. Può spezzare (RES DC 15).",lv2:"3t",lv3:"Recuperi 75%, DC spezzare 17",lv4:"Bidirezionale: lui recupera 25% dei tuoi",lv5:"FINALE: non spezzabile. Recuperi 100%"}]},
  {cat:3,pos:4,nome:"Illusionista",flavor:"Vince senza fare danni",icon:"👁️",FOR:8,AGI:13,RES:9,INT:15,PER:11,CAR:10,hp:50,fl:52,dif:11,vel:6,dado:"1d6",
   desc:"Controlla la percezione degli avversari. La classe a più alto coefficiente tattico del sistema. Il danno diretto è marginale — il suo strumento è la sottrazione di azioni al nemico. Due turni negati a un boss in un momento decisivo superano il contributo offensivo di qualsiasi altra classe.",
   skills:[{nome:"Doppio Illusorio",costo:"3",desc:"A.Bonus. 1 copia. Nemici: INT DC 13 per capire il vero bersaglio. Svanisce al 1° colpo.",lv2:"2 copie",lv3:"Copie si muovono autonomamente, DC 14",lv4:"Copie usano Skill base",lv5:"FINALE: copie hanno 15 HP ciascuna. Max 3 attive"},
    {nome:"Terrore Reale",costo:"4",desc:"INT vs INT DC 13. Pieno: Spaventato 2t + Svantaggio su tutto. Parziale: Spaventato 1t.",lv2:"Pieno 3t",lv3:"Area 5m, tiro separato per ciascuno",lv4:"DC 15, chi fallisce anche Paralizzato 1t",lv5:"FINALE: istantaneo. Tutti i nemici visibili: Spaventati 2t"},
    {nome:"Labirinto Illusorio",costo:"6",desc:"Bersaglio salta turno intero (INT vs INT DC 14). Fallisce su immuni.",lv2:"Costo 5",lv3:"2 bersagli",lv4:"Bersaglio subisce 2d6 psichici all'uscita",lv5:"FINALE: dura 2 turni. Il bersaglio non ricorda nulla"}]},
  {cat:4,pos:1,nome:"Guardiano Arkadiano",flavor:"HP massimi del gioco — il muro indistruttibile",icon:"🛡️",FOR:11,AGI:8,RES:16,INT:10,PER:13,CAR:8,hp:79,fl:28,dif:9,vel:4,dado:"1d12",
   desc:"Punti Ferita più elevati del sistema. Il suo ruolo principale è proteggere gli alleati. 91 HP al Rank C — il più resistente del gioco. Il DPR è il più basso, ma la sopravvivenza estrema e lo Scudo dell'Anima rendono il gruppo quasi invincibile se giocato bene.",
   skills:[{nome:"Barriera Cristallina",costo:"3",desc:"Scudo su sé o alleato entro 8m. Assorbe RES×4 (base 64) HP. Dura fino a fine scontro.",lv2:"RES×5 (base 80)",lv3:"20% danni assorbiti riflessi all'attaccante",lv4:"2 scudi simultanei su bersagli diversi",lv5:"FINALE: si rigenera di 10 HP ogni round"},
    {nome:"Aura di Guarigione",costo:"3",desc:"Alleati entro 6m (non sé): 1d8+1 HP. Se sotto 50%: cura doppia.",lv2:"2d6+1, soglia 60%",lv3:"Rimuove una condizione a scelta",lv4:"Costo 2, cura anche sé stesso",lv5:"FINALE: persistente — 1d6+1 a inizio ogni suo turno a tutti entro 6m"},
    {nome:"Scudo dell'Anima",costo:"0",desc:"Passivo. Alleato entro 8m subisce danno: puoi riceverlo tu, dimezzato. Dichiara prima.",lv2:"Danno ridotto di ulteriori 3",lv3:"Portata 12m",lv4:"Puoi deviare su qualsiasi bersaglio entro portata",lv5:"FINALE: automatico. Qualsiasi danno agli alleati automaticamente dimezzato"}]},
  {cat:4,pos:2,nome:"Campione di Pietra",flavor:"Assorbe i colpi e risponde con forza",icon:"🪨",FOR:12,AGI:8,RES:16,INT:8,PER:10,CAR:12,hp:77,fl:16,dif:9,vel:4,dado:"1d12",
   desc:"Assorbe i danni subiti e risponde con forza equivalente. Variante offensiva del Guardiano. Riduce il supporto agli alleati a favore del controllo diretto del campo. La Sfida del Campione in Forma Finale obbliga qualsiasi nemico a considerarlo il bersaglio prioritario.",
   skills:[{nome:"Sfida del Campione",costo:"0+✦",desc:"A.Bonus. Bersaglio: Svantaggio vs altri 2t. Tu: +1 Difesa vs lui.",lv2:"Costo ✦ rimosso, costo 1 Flusso",lv3:"2 bersagli, penalità = impossibile attaccare altri",lv4:"+2 Difesa, dura 3t",lv5:"FINALE: attiva su TUTTI i nemici all'inizio scontro (passiva), costo 2"},
    {nome:"Scossa Sismica",costo:"4",desc:"Colpisci il terreno. Nemici entro 3m: RES DC 13. Fallimento: Proni + 1d6.",lv2:"2d6",lv3:"Raggio 5m, Prono → Immobilizzato 1t",lv4:"DC 15",lv5:"FINALE: crea fessura 3m. Chi attraversa: Prono automaticamente"},
    {nome:"Fortezza",costo:"3",desc:"Reazione. Dimezza un singolo attacco. Se danno dimezzato = 0: recuperi 3 HP.",lv2:"Danno 0 → recuperi 6 HP",lv3:"Costo 2",lv4:"Dimezza tutti gli attacchi 1 turno intero",lv5:"FINALE: passiva — dimezza ogni attacco >20 danni"}]},
  {cat:4,pos:3,nome:"Monaco del Flusso",flavor:"Resistenza e velocità in un corpo solo",icon:"☯️",FOR:12,AGI:14,RES:13,INT:8,PER:11,CAR:8,hp:62,fl:20,dif:12,vel:7,dado:"1d10",
   desc:"Il personaggio risulta più difficile da contenere rispetto ai tank tradizionali. Il tank che non si ferma. Combina resistenza fisica con la mobilita' dell'Assassino. Eccellente nei combattimenti su più fronti — il Vortice in forma finale è una delle Skill più devastanti del gioco in spazi affollati.",
   skills:[{nome:"Pugno del Fulmine",costo:"2",desc:"Attacco FOR. Danno 1d8+1. Se critico: bersaglio Stordito 1t.",lv2:"2d6+1",lv3:"Stordito anche senza critico se superi Difesa di 5+",lv4:"2d8+1",lv5:"FINALE: ogni Pugno accumula contatore (max 3). Al 3°: esplosione 3d8 area 3m"},
    {nome:"Vortice del Monaco",costo:"4",desc:"Muoviti 4m e attacca ogni nemico attraversato: 1d6+1. No attacchi di opportunità.",lv2:"6m, 2d4+1",lv3:"Ogni bersaglio: Rallentato 1t",lv4:"Percorso x2 (attacchi doppi)",lv5:"FINALE: nessun limite distanza. 2d6+1 per bersaglio. Ogni colpito: Prono"},
    {nome:"Meditazione in Battaglia",costo:"2",desc:"A.Bonus. 1/scontro: recupera 2d6+1 HP. Sotto 30%: 3d6+1.",lv2:"2/scontro",lv3:"Rimuove una condizione",lv4:"Sotto 30%: 4d8+1",lv5:"FINALE: illimitato, costo 1"}]},
  {cat:4,pos:4,nome:"Araldo della Fine",flavor:"Più è vicino alla morte, più è letale",icon:"💥",FOR:14,AGI:10,RES:14,INT:10,PER:8,CAR:10,hp:63,fl:26,dif:10,vel:5,dado:"1d10",
   desc:"La classe con il picco di potenza più elevato del sistema, attivato dalla soglia critica di HP. Sotto il 20% HP, il danno raddoppia e il costo del Flusso azzerato trasformano ogni turno in un'escalation. La sfida è raggiungere quella soglia in condizioni operative. 49",
   skills:[{nome:"Sacrificio di Sangue",costo:"0*",desc:"*Costa HP. Spendi X HP (min 5): infliggi X×1.5 danni puri. Sotto 20% HP: X×2.5.",lv2:"Base X×2. Sotto 20%: X×3",lv3:"Può colpire area 3m",lv4:"Base X×2.5. Sotto 20%: X×4",lv5:"FINALE: costo HP /2. Sotto 20%: X×5"},
    {nome:"Rinascita nel Sangue",costo:"0 (1/scontro)",desc:"Reazione automatica a 0 HP. Sopravvivi con 1 HP. Nemici entro 4m: 2d6 (RES DC 13 Storditi).",lv2:"3d6",lv3:"Raggio 6m",lv4:"2/scontro",lv5:"FINALE: recuperi 20% HP massimi. Danno nemici: 4d8"},
    {nome:"Flagello del Moribondo",costo:"5",desc:"3 attacchi FOR: 1d10+2. Sotto 20% HP: ogni colpo +1d6.",lv2:"4 attacchi, 1d12+2",lv3:"Sotto 20%: +2d6",lv4:"Costo 4",lv5:"FINALE: 5 attacchi, 2d8+2. Sotto 20%: costo 0"}]},
  {cat:5,pos:1,nome:"Domatore",flavor:"La forza cresce con ogni mostro domato",icon:"🐉",FOR:10,AGI:11,RES:11,INT:12,PER:15,CAR:7,hp:49,fl:36,dif:10,vel:5,dado:"1d8",
   desc:"Quanto più compagni possiede, più è efficace. Progressione asimmetrica: prestazioni contenute ai Rank bassi, potenziale moltiplicativo elevato ai Rank alti. Ogni creatura domata aggiunge un moltiplicatore permanente alla forza del gruppo. Il numero massimo di compagni attivi è pari al modificatore PER (minimo 1, massimo 5).",
   skills:[{nome:"Doma",costo:"0",desc:"Su bersaglio ≤25% HP. PER vs DC (8+Rank mostro). Pieno: permanente. Parziale: 1 scontro.",lv2:"Tentabile fino a 35% HP",lv3:"Tentabile fino a 45%, Parziale → 1 sessione",lv4:"Tentabile su qualsiasi bersaglio (DC +8)",lv5:"FINALE: istantanea (A.Bonus)"},
    {nome:"Ruggito del Branco",costo:"4",desc:"Tutti i compagni attivi entro 20m attaccano stesso bersaglio. Ogni attacco: +1d4 cumulativo.",lv2:"+1d6 cumulativo",lv3:"Puoi designare bersagli diversi",lv4:"Costo 3",lv5:"FINALE: automatico ogni tuo turno, costo 2"},
    {nome:"Legame Empatico",costo:"2",desc:"A.Bonus. Vedi attraverso gli occhi di un compagno 1t. Il compagno: Vantaggio su tutto 2t.",lv2:"Comunicazione bidirezionale",lv3:"Vantaggio dura 3t, controllo diretto",lv4:"Condividi le tue Skill al compagno",lv5:"FINALE: permanente su tutti i compagni attivi"}]},
  {cat:5,pos:2,nome:"Veggente",flavor:"Anticipa i pericoli e mantiene il gruppo in vita",icon:"🔮",FOR:8,AGI:10,RES:10,INT:13,PER:16,CAR:9,hp:43,fl:44,dif:10,vel:5,dado:"1d6",
   desc:"È il ruolo di supporto principale del sistema. La classe di supporto più pura. HP bassi (43 al Rank F) — deve stare protetto. In cambio, mantiene il gruppo in piedi in situazioni che nessuna altra classe potrebbe gestire. In forma finale, trasforma l'intero party in qualcosa di superiore.",
   skills:[{nome:"Previsione del Colpo",costo:"2",desc:"Inizio round: designa 1 alleato. Se attaccato quel turno: +3 Difesa contro quell'attacco.",lv2:"2 alleati",lv3:"+4 Difesa",lv4:"Copre tutti gli attacchi del turno",lv5:"FINALE: si applica a tutti gli alleati, costo 0"},
    {nome:"Tocco Curativo Avanzato",costo:"4",desc:"Cura alleato entro 6m di 2d8+2 HP. Se già a piena salute: Scudo pari alla cura.",lv2:"3d6+2",lv3:"Rimuove una condizione",lv4:"Costo 3, portata 10m",lv5:"FINALE: cura tutti gli alleati visibili, 2d8+2 a ciascuno"},
    {nome:"Destino Condiviso",costo:"3+✦",desc:"A.Bonus. Per 2t, ogni Scintilla che un alleato spende conta doppio.",lv2:"Costo ✦ rimosso",lv3:"Conta triplo",lv4:"2 alleati simultanei",lv5:"FINALE: intero gruppo per 1t. Costo 6"}]},
  {cat:5,pos:3,nome:"Cacciatore di Anime",flavor:"Nessuno sfugge — nessuno si nasconde",icon:"🎭",FOR:12,AGI:13,RES:11,INT:10,PER:14,CAR:6,hp:48,fl:28,dif:11,vel:6,dado:"1d8",
   desc:"Nessun avversario può nascondersi abbastanza a lungo. Specializzato contro un singolo bersaglio prioritario. La Caccia Finale e' uno dei danni singoli più alti del gioco. Eccelle in campagne con boss fuggitivi o nemici specifici da eliminare.",
   skills:[{nome:"Tracciamento Arcano",costo:"1",desc:"A.Bonus. Marca bersaglio. Per tutta la sessione: posizione entro 100m. Vantaggio per inseguire.",lv2:"2 bersagli simultanei",lv3:"Portata 1km, stato approssimativo noto",lv4:"Marca permanente (tutta la campagna)",lv5:"FINALE: passivo — ogni creatura che ti ha visto è automaticamente marcata"},
    {nome:"Colpo di Arresto",costo:"3",desc:"Attacco PER. Danno 1d8+2. Se colpisce: Rallentato 2t (vel /2, –1 azione).",lv2:"Rallentato più severo: vel /3",lv3:"Aggiunge Sanguinante",lv4:"2d6+2, cono",lv5:"FINALE: su bersaglio marcato → Immobilizzato invece di Rallentato"},
    {nome:"Caccia Finale",costo:"5",desc:"Solo su bersaglio marcato. Danno 3d8+2, ignora 50% armatura. Sotto 40% HP: x1.5.",lv2:"4d8+2",lv3:"Ignora 100% armatura",lv4:"Soglia sale a 50% HP",lv5:"FINALE: se uccide → +3 Scintille e Tracciamento si azzera"}]},
  {cat:5,pos:4,nome:"Cercatore",flavor:"Conosce il terreno prima ancora di entrarci",icon:"🗺️",FOR:10,AGI:12,RES:11,INT:11,PER:15,CAR:7,hp:56,fl:34,dif:11,vel:6,dado:"1d8",
   desc:"Quando il gruppo attraversa un'area, il personaggio ne conosce già i pericoli principali. La classe con più vantaggi fuori dal combattimento. In esplorazione, nessuno lo batte. In combattimento, la conoscenza del terreno si traduce in danno e controllo precisi.",
   skills:[{nome:"Lettura del Campo",costo:"1",desc:"A.Bonus. Rileva trappole entro 10m, creature invisibili, uscite, coperture. Alleati: +1 Init. prossimo round.",lv2:"Portata 15m, +2 Iniziativa",lv3:"Rivela Skill già usate dai nemici",lv4:"Auto-aggiornamento ogni round",lv5:"FINALE: sempre attiva (passiva)"},
    {nome:"Colpo del Conoscitore",costo:"2",desc:"Attacco PER. Danno 1d8+2. Conosce la debolezza: x1.5 + applica debolezza.",lv2:"2d6+2",lv3:"x2 invece di x1.5",lv4:"Scopre debolezza al momento del colpo",lv5:"FINALE: ignora sempre tutta l'armatura"},
    {nome:"Trappola del Sogno",costo:"3",desc:"Piazza trappola entro 4m. Prima creatura: scegli Immobilizzato (2t), Spaventato (1t+Svantaggio), o Stordito (1t).",lv2:"2 trappole per attivazione",lv3:"Area 2m (più creature)",lv4:"Invisibile anche a sensi soprannaturali",lv5:"FINALE: combina 2 effetti + 2d6 bonus"}]},
  {cat:6,pos:1,nome:"Cavaliere Oscuro",flavor:"Ogni colpo porta un'eco di Flusso oscuro",icon:"🌑",FOR:13,AGI:10,RES:13,INT:12,PER:8,CAR:10,hp:60,fl:36,dif:10,vel:5,dado:"1d10",
   desc:"Ogni colpo porta con sé un'eco di corruzione. L'ibrido per eccellenza. Non eccelle nel danno puro ne' nel controllo, ma debilita i nemici mentre si sostiene. La Corruzione accumulata in forma finale svuota rapidamente il Flusso dei nemici.",
   skills:[{nome:"Lama Corrotta",costo:"3",desc:"Attacco FOR. 1d8+1 + 1d6 oscuro (ignora armatura). Corruzione: prossima Skill nemica +2 Flusso.",lv2:"2d6+1 fisico, 2d6 oscuro",lv3:"Corruzione max 2 stack",lv4:"2d8+1, oscuro 3d6",lv5:"FINALE: Corruzione senza limite stack, si applica a tutti i colpiti"},
    {nome:"Aura di Tenebra",costo:"4",desc:"A.Bonus. Aura 3m 2t: nemici –2 a tutti i tiri, alleati +1 danni oscuri. Immune.",lv2:"Raggio 5m",lv3:"Malus –3",lv4:"Dura 3t",lv5:"FINALE: sempre attiva, costo 2 a inizio scontro"},
    {nome:"Drenaggio Oscuro",costo:"3",desc:"Attacco INT. Drena 1d8+1 Flusso (o HP se esaurito). Recuperi metà del drenato.",lv2:"2d6+1",lv3:"Recuperi 100% del drenato",lv4:"Può drenare Scintille (1 ✦ = 5 Flusso)",lv5:"FINALE: A.Bonus invece di Azione, costo 2"}]},
  {cat:6,pos:2,nome:"Bardo",flavor:"Trasforma il gruppo in qualcosa di superiore",icon:"🎵",FOR:10,AGI:12,RES:10,INT:12,PER:10,CAR:16,hp:51,fl:38,dif:11,vel:6,dado:"1d8",
   desc:"Le sue Skill potenziano l'intero gruppo, trasformando la squadra in qualcosa di superiore alla somma delle sue singole parti. Prestazioni individuali contenute, impatto di gruppo elevato. Il Canto di Battaglia in Forma Finale combinato con la Ballata Ispiratrice sul principale attaccante produce il DPR aggregato più alto ottenibile nel sistema.",
   skills:[{nome:"Canto di Battaglia",costo:"3",desc:"Azione. Alleati entro 8m: +1d4 danni 2t. Tu non attacchi mentre canti.",lv2:"+1d6",lv3:"Raggio 12m",lv4:"+1d8, costo 2",lv5:"FINALE: sempre attivo (passivo), costo 2 a inizio scontro, +1d6 permanente"},
    {nome:"Nota Dissonante",costo:"2",desc:"CAR vs INT DC 12. Pieno: Svantaggio su tutto 1t + 1d6 sonici. Parziale: Svantaggio.",lv2:"Pieno 2t + 2d6",lv3:"Area 4m, tiro separato per ciascuno",lv4:"DC 14 + Rallentato",lv5:"FINALE: no tiro difensivo. Tutti nemici entro 6m subiscono automaticamente"},
    {nome:"Ballata Ispiratrice",costo:"4+✦",desc:"A.Bonus. Un alleato: Vantaggio su TUTTI i tiri nel suo prossimo turno intero.",lv2:"Costo ✦ rimosso",lv3:"Dura 2 turni",lv4:"Costo 3",lv5:"FINALE: tutti gli alleati simultaneamente per 1t. Costo 6"}]},
  {cat:6,pos:3,nome:"Sciamano",flavor:"Controlla il campo con le forze naturali",icon:"🌊",FOR:10,AGI:10,RES:12,INT:13,PER:13,CAR:8,hp:59,fl:42,dif:10,vel:5,dado:"1d8",
   desc:"Una classe senza ruolo fisso. Danno, controllo del campo e supporto sono integrati nelle stesse Skill. Nessun primato in una singola categoria, ma la copertura completa di tutte e tre con un'unica attivazione è esclusiva di questa classe. 63 CHAOS SYSTEM Arcadia2099 Volume Unico · v7.0",
   skills:[{nome:"Fulmine dello Sciamano",costo:"4",desc:"Catena automatica: 2d6+1 al primo, salta al più vicino (1d6+1), poi ancora (1d4+1). No tiro.",lv2:"Catena 4 salti",lv3:"2° e 3° salto = 2d6+1",lv4:"Tutti i salti 3d6+1",lv5:"FINALE: catena illimitata. 2d8+1 per salto"},
    {nome:"Radici di Pietra",costo:"3",desc:"Bersaglio entro 12m. PER vs AGI DC 13. Pieno: Immobilizzato 1t. Parziale: Rallentato.",lv2:"Immobilizzato 2t",lv3:"Area 4m",lv4:"DC 15, radici fanno 1d6/turno",lv5:"FINALE: durata a discrezione Sciamano. 2d6/turno"},
    {nome:"Totem Curativo",costo:"3",desc:"Piazza totem entro 6m (HP 10). Ogni turno: 1d4+1 HP all'alleato più vicino entro 4m. Dura 3t.",lv2:"HP 20, 1d6+1",lv3:"Cura tutti gli alleati entro 4m",lv4:"Totem si sposta (tua A.Bonus)",lv5:"FINALE: 2 totem, 2d4+1 HP a tutti entro 4m ogni turno"}]},
  {cat:6,pos:4,nome:"Maestro del Tempo",flavor:"Chi controlla il ritmo controlla tutto",icon:"⏳",FOR:8,AGI:14,RES:10,INT:14,PER:10,CAR:10,hp:53,fl:48,dif:12,vel:7,dado:"1d6",
   desc:"Il personaggio che controlla il tempo controlla lo scontro. Una delle classi più complesse ma più potenti in assoluto. Rubare un turno al nemico con Bolla Temporale al momento giusto puo' ribaltare qualsiasi scontro. In forma finale, è quasi impossibile da sfruttare appieno senza esperienza.",
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
  {gruppo:1,pos:1,nome:"Frammento di Raos",fonte:"Guardiano della Luce",flavor:"In chi la ospita, la luce brucia più forte — anche nell'oscurità totale.",mec_breve:"Osserva Skill nemica 5× → INT DC 15 (max 3 Skill/campagna, 60 PS)",mec:"Dopo aver visto la stessa Skill nemica usata 5 volte (anche in sessioni diverse): tiro INT DC 15 (Rank uguale o inferiore) o DC 20 (Rank superiore). Successo: la Skill e' tua a Lv 1, costo 60 PS. La Skill acquisita non puo' mai salire di livello con i PS. Limite: max 3 Skill totali acquisibili con Raos per campagna."},
  {gruppo:1,pos:2,nome:"Frammento di Baros",fonte:"Guardiano della Materia",flavor:"Chi porta il suo frammento diventa un muro tra il caos e chi ama.",mec_breve:"Reazione: devia danno fisico alleato (8m) su te, dimezzato. Max 3/scontro.",mec:"Come Reazione: un alleato visibile entro 8m sta per subire danno fisico. Puoi riceverlo tu al suo posto, dimezzato. Dichiara PRIMA del calcolo del danno. Limite: max 3 deviazioni per scontro. Non si applica a danni magici, area, veleni o condizioni."},
  {gruppo:1,pos:3,nome:"Frammento di Arkan",fonte:"Guardiano del Tempo",flavor:"Chi porta un suo frammento tocca il tempo — brevemente, a carissimo prezzo.",mec_breve:"Reazione: modifica dado ±1d4 (3 Flusso) o ritiro (8 Flusso+✦). 3/sessione.",mec:"Come Reazione dopo che un dado e' tirato: spendi 3 Flusso per modificarlo di +/-1d4, OPPURE 8 Flusso + 1 Scintilla per richiedere un ritiro completo. Utilizzi: 3/sessione (Rank F-D), 5/sessione (Rank C-A), 7/sessione (Rank S+). Il sistema ha sempre un limite."},
  {gruppo:1,pos:4,nome:"Frammento di Drako",fonte:"Guardiano dell'Ombra",flavor:"Un frammento di quella quiete assoluta risiede in te.",mec_breve:"Immune a 1 condizione (Rank F). Da Rank B: immune a 2.",mec:"Scegli una condizione al Rank F: Veleno, Paura, Stordimento, Rallentamento, o Accecamento. Sei permanentemente immune. Da Rank B: scegli una seconda condizione."},
  {gruppo:1,pos:5,nome:"Frammento del Muro Arkano",fonte:"Reliquia Era della Ricostruzione",flavor:"Un frammento di quella struttura vive in te.",mec_breve:"1/sessione: per 1 turno intero tutti i danni ricevuti diventano 1.",mec:"1/scontro come Reazione prima del calcolo del danno: per l'intero turno in corso, ogni fonte di danno ti infligge esattamente 1 HP, indipendentemente dall'entita' o dall'origine."},
  {gruppo:1,pos:6,nome:"Frammento della Prima Legge",fonte:"Eco del Creatore primordiale",flavor:"'A ogni principio segue una fine. E ogni fine conserva un'origine.'",mec_breve:"1/giorno: a 0 HP sopravvivi con 1 HP. Nemici entro 4m: 2d6 danni.",mec:"Reazione automatica quando i tuoi HP raggiungono 0. Rimani in piedi con 1 HP. Tutti i nemici entro 4 metri: 2d6 danni (RES DC 13: Storditi 1 turno). Si azzera a fine scontro (1/scontro, non 1/giorno)."},
  {gruppo:2,pos:1,nome:"Frammento del Cristallo Oscuro",fonte:"Eco del Primo Tradimento",flavor:"Alcuni frammenti conservano la promessa originaria: la libertà dal limite.",mec_breve:"A.Bonus (3 Flusso): stealth assoluto. Prossimo attacco = critico auto. 1-3/scontro.",mec:"Azione Bonus (3 Flusso): entri in Ombra Assoluta. Invisibile e inudibile. Il primo attacco in questo stato è un critico automatico (danno x2). Lo stato termina dopo l'attacco o a fine turno. Utilizzi/scontro: 1 (Rank F-D), 2 (Rank C-A), 2 (Rank S+, non 3 — il corpo ha un limite anche al Rank S)."},
  {gruppo:2,pos:2,nome:"Frammento di Seraphin",fonte:"Eco del Primo Traditore",flavor:"Seraphin non fu mai sconfitto — fu esiliato.",mec_breve:"Non puoi essere sorpreso. Critici 19-20. Vantaggio vs bersagli con meno HP.",mec:"Tre effetti passivi permanenti: non puoi essere sorpreso; i tuoi critici su attacchi base (non Skill) avvengono con 19 o 20 naturale; se il bersaglio ha almeno il 30% in meno di HP rispetto ai tuoi correnti, hai Vantaggio."},
  {gruppo:2,pos:3,nome:"Frammento della Frattura",fonte:"Eco del Primo Pandora",flavor:"Alcune creature impararono ad abitare l'instabilità.",mec_breve:"Pari su d20 = +2. Dispari = -1. La fortuna diventa statistica.",mec:"Passivo. Ogni volta che tiri 1d20 e ottieni un risultato naturale pari: conta come +1. Ogni risultato naturale dispari: conta come -1. Il 20 vale sempre critico. Il risultato modificato non puo' superare 20."},
  {gruppo:2,pos:4,nome:"Frammento del Velo Riflesso",fonte:"Eco delle Memorie Viventi",flavor:"Chi porta questo frammento restituisce il danno narrativo ai mittenti.",mec_breve:"Reazione (4 Flusso): riflette 30% danno magico ricevuto al mittente.",mec:"Come Reazione quando subisci danno magico: spendi 5 Flusso. Il 30% del danno che hai subito viene riflesso al mittente come danno puro non riducibile (massimo 15 danni per attivazione). Se uccide il nemico: guadagni 1 Scintilla."},
  {gruppo:2,pos:5,nome:"Frammento dell'Onda d'Impatto",fonte:"Eco della Guerra del Codice",flavor:"Ogni colpo risuonava su più piani. Un eco di quella risonanza persiste.",mec_breve:"Passivo. Ogni tuo attacco a segno: 2 danni automatici a ogni nemico entro 2m.",mec:"Spezzato \"Durante la Guerra del Codice Spezzato, ogni attacco risuonava simultaneamente su più piani di esistenza. Questo Frammento preserva quella risonanza.\" Passivo. Una volta per turno: il primo tuo attacco che colpisce genera un'onda che infligge 2 danni non riducibili a tutti i nemici entro 2m dal bersaglio (massimo 4 nemici colpiti). Non si attiva su Skill gia' ad area."},
  {gruppo:2,pos:6,nome:"Frammento della Dissonanza",fonte:"Eco del Secondo Pandora",flavor:"Le magie fallivano con frequenza crescente. Un eco imprevedibile persiste.",mec_breve:"Condizioni che applichi: +1 turno. Applicarne 2+ nello stesso turno: +1 Scintilla.",mec:"Due effetti: ogni condizione che applichi ha durata +1 turno; se applichi 2+ condizioni distinte allo stesso bersaglio nello stesso turno, guadagni immediatamente 1 Scintilla."},
  {gruppo:3,pos:1,nome:"Frammento dell'A.R.U.",fonte:"Eco Saint of Cosmos",flavor:"Un frammento di quell'armonia cerca di distribuirsi.",mec_breve:"Inizio sessione: tutti gli alleati +1 a un tipo di tiro. Dura tutta la sessione.",mec:"All'inizio di ogni sessione, designi un tipo di tiro (attacco, danno, tiri salvezza, o iniziativa). Ogni alleato guadagna +1 a quel tipo per i primi 3 scontri della sessione. Dopo il 3° scontro il bonus si azzera. La scelta non è revocabile."},
  {gruppo:3,pos:2,nome:"Frammento della Culla Cogher",fonte:"Eco di Breyin Cogher — Lullaby",flavor:"Un frammento della sua empatia cerca chi sa sentire gli altri.",mec_breve:"A.Bonus (1 Flusso): vedi attraverso alleato entro 60m. Alla sua morte: +2✦ + Vantaggio 2t.",mec:"Due effetti: (1) come Azione Bonus spendi 1 Flusso per vedere e sentire attraverso un alleato entro 60m per 1 turno; (2) ogni volta che un alleato muore in combattimento: +1 Scintilla e Vantaggio su tutti i tiri per 1 turno."},
  {gruppo:3,pos:3,nome:"Frammento del Codice Rosso",fonte:"Eco Lions and Blood",flavor:"Il Codice Rosso è inciso su armi da cerimonia. Chi lo ha interiorizzato non dimentica.",mec_breve:"Skill mancata: +1 al prossimo tiro con quella Skill (max +5). Si azzera al primo colpo.",mec:"Passivo. Ogni volta che una tua Skill non colpisce o fallisce, accumuli +1 al prossimo tiro con QUELLA STESSA Skill. Massimo +5. Si azzera al primo colpo riuscito. Conta separatamente per ogni Skill."},
  {gruppo:3,pos:4,nome:"Frammento dei Nodi Neri",fonte:"Eco degli Ombra",flavor:"Chi porta questo frammento fa lo stesso con se stesso.",mec_breve:"1/sessione: teletrasporto a luoghi visitati. In combattimento: 30m (2 Flusso, A.Bonus).",mec:"Due modalita': (1) 1/sessione come Azione Principale: teletrasporto a qualsiasi luogo visitato in questa campagna; (2) come Azione Bonus (2 Flusso): teletrasporto a punto visibile entro 30m. Nessun attacco di opportunita'."},
  {gruppo:3,pos:5,nome:"Frammento della Coscienza Civile",fonte:"Eco Nova Era",flavor:"Un frammento di quella tecnologia permette di modificare la realtà.",mec_breve:"1/sessione: modifica terreno entro 30m. In combattimento: effetto minore (INT DC 14).",mec:"1/sessione come Azione Principale: modifica fisicamente il terreno entro 30m (crea muro, sposta acqua, crollo parziale, ecc.). Il GM valida la plausibilita'. In combattimento: stesso effetto ma limitato (DC 14 INT, fallimento = azione sprecata). Eco M.A.F.I.A."},
  {gruppo:3,pos:6,nome:"Frammento Multialleanza",fonte:"Eco M.A.F.I.A.",flavor:"Chi comanda, riscrive. Un frammento di quella filosofia pragmatica persiste.",mec_breve:"1/sessione: crea copia funzionale di te per 2 turni (HP/2, stessa Difesa, 1 Skill base).",mec:"1/scontro come Azione Principale: crei una copia funzionale. Ha HP pari alla meta' dei tuoi HP correnti, la tua stessa Difesa, e usa una tua Skill base a scelta. Agisce subito dopo di te. Dura 2 turni o fino alla sconfitta."},
  {gruppo:4,pos:1,nome:"Frammento della Guerra delle Meteore",fonte:"Eco della rabbia orchesca",flavor:"Il furore si condensò come rabbia purificata nel Flusso.",mec_breve:"1/scontro (A.Bonus): Furia 3t — danni fisici +50%, immune condizioni fisiche. Poi Esausto 2t.",mec:"1/scontro come Azione Bonus: Furia Ancestrale per 3 turni. Durante la furia: danni fisici +30%, immune a condizioni fisiche, no Skill >2 Flusso. Alla fine: Esausto 2 turni. Ceneri del Codice Arkadiano"},
  {gruppo:4,pos:2,nome:"Frammento del Codice Bruciato",fonte:"Ceneri del Codice Arkadiano",flavor:"Le ultime parole del Codice non si spensero. Cercano ancora qualcuno.",mec_breve:"Passivo. Ogni tuo critico applica Rottura Armatura (–2 Difesa, max –6, fino a fine scontro).",mec:"Passivo. Ogni tuo critico applica automaticamente Rottura Armatura: -2 Difesa al bersaglio. Cumulabile fino a -4 (massimo). La riduzione dura fino a fine scontro."},
  {gruppo:4,pos:3,nome:"Frammento della Bilancia Rotta",fonte:"Reliquia del Terzo Pandora",flavor:"Chi porta questo frammento vede i fili del destino prima che si tendano.",mec_breve:"Inizio sessione: il GM ti dice un evento certo. 1/scontro: inverte un risultato di dado.",mec:"Due effetti: (1) inizio sessione, il GM ti rivela in segreto un evento certo; (2) 1/scontro, dopo che un dado e' tirato, puoi dichiarare Inversione: il risultato diventa (21 - risultato naturale). Es: 15 diventa 6. Non si applica a Nat 1 (resterebbe 20) o Nat 20 (resterebbe 1) — i risultati estremi sono fuori dal controllo del Frammento."},
  {gruppo:4,pos:4,nome:"Frammento della Soglia",fonte:"Eco del potere limite",flavor:"Sotto il 20% HP, qualcosa si sveglia nel codice.",mec_breve:"Passivo. Sotto 20% HP: danni x2, Flusso 0, +3 Difesa, immune Spaventato/Stordito.",mec:"Passivo. Quando gli HP scendono sotto il 20% del massimo: danni x1.5, costo Flusso dimezzato, Difesa +2, immunita' a Spaventato e Stordito. Sotto il 10% HP: danni x2 + guadagni 1 Scintilla se sopravvivi allo scontro (non per turno)."},
  {gruppo:4,pos:5,nome:"Frammento di Jixal",fonte:"Eco del Re di Arkadium",flavor:"La sua volontà era cosmica — non si piegava a nulla.",mec_breve:"Immune a controllo mentale/illusioni. Scintille guadagnate +1. Max Scintille +3.",mec:"Tre effetti permanenti: immune a controllo mentale e illusioni; ogni Scintilla guadagnata e' +1 (es. guadagni 2 invece di 1); il limite massimo di Scintille sale da 10 a 12."},
  {gruppo:4,pos:6,nome:"Frammento dei Sette Eroi",fonte:"Eco dell'Era degli Eroi",flavor:"Un eco di quella coesione persiste.",mec_breve:"Passivo. Per ogni alleato con Frammento entro 10m: +1 a tutti i tuoi tiri.",mec:"Passivo. Per ogni alleato presente nello scontro che porta un Frammento del Creatore e si trova entro 10m da te: +1 a tutti i tuoi tiri. Massimo +2 totale, indipendentemente dal numero di alleati. Solo durante gli scontri."},
  {gruppo:5,pos:1,nome:"Frammento Adattivo",fonte:"Eco delle Mutazioni Frammentarie",flavor:"Un frammento di quella adattabilità può essere controllato.",mec_breve:"Passivo. Primo tipo di danno per scontro: guadagni Resistenza a quel tipo (max 3).",mec:"Passivo. La prima volta che subisci danno di un tipo specifico in uno scontro, guadagni Resistenza a quel tipo (danno dimezzato) per il resto dello scontro. Massimo 3 resistenze diverse simultaneamente. Si azzera a ogni nuovo scontro."},
  {gruppo:5,pos:2,nome:"Frammento del Vampirismo",fonte:"Eco del Flusso Residuale",flavor:"Chi lo tocca impara a nutrirsi delle realtà in dissolvenza.",mec_breve:"Passivo. Ogni attacco a segno: recuperi HP = 20% del danno inflitto.",mec:"Passivo. A fine di ogni tuo turno: recuperi HP pari al 20% del danno totale che hai inflitto in quel turno (sommando tutti gli attacchi). Massimo 10 HP recuperati per turno. Non funziona su Skill che costano HP."},
  {gruppo:5,pos:3,nome:"Frammento della Velocità",fonte:"Eco dell'Instabilità Post-Pandorica",flavor:"Un eco di quella velocità impossibile sopravvive.",mec_breve:"Velocità +2 permanente. Mai attacchi di opportunità. A.Bonus (1 Flusso): 2° movimento.",mec:"Tre effetti: velocità di movimento +2 permanente; non provochi mai attacchi di opportunità; come Azione Bonus (1 Flusso) puoi effettuare un secondo movimento nello stesso turno. Il secondo movimento non si combina con il primo per scopi di area-of-effect."},
  {gruppo:5,pos:4,nome:"Frammento della Pelle di Mithral",fonte:"Eco dei Custodi della Pietra",flavor:"Il corpo divenne parte della pietra stessa.",mec_breve:"+1 Difesa permanente. Immune ai veleni. Vantaggio su TS contro condizioni fisiche.",mec:"Tre effetti permanenti: Difesa Base +1 (si applica solo con armatura leggera o nessuna armatura — non si somma ad armatura media o pesante); immunita' completa a tutti i veleni; Vantaggio su tutti i tiri salvezza contro condizioni fisiche."},
  {gruppo:5,pos:5,nome:"Frammento della Rigenerazione",fonte:"Eco della Furia del Sangue",flavor:"Un frammento di quella biologia impossibile persiste.",mec_breve:"Passivo. Inizio di ogni tuo turno in combattimento: recupera 2+mod RES HP (min 2).",mec:"Passivo. All'inizio di ogni tuo turno in combattimento: recuperi automaticamente 2 + modificatore RES HP (minimo 2). Non funziona se sei incapacitato, paralizzato o a 0 HP. Fuori combattimento: usa il riposo normale."},
  {gruppo:5,pos:6,nome:"Frammento della Visione del Sogno",fonte:"Eco degli Elfi Luminali",flavor:"Chi porta questo frammento vede oltre la superficie della realtà.",mec_breve:"Rileva invisibili entro 10m. Vantaggio su illusioni. Vantaggio su Percezione passiva.",mec:"Tre effetti permanenti: rilevi automaticamente entita' invisibili entro 10m (nessun tiro); Vantaggio su qualsiasi tiro per smascherare o resistere alle illusioni; Vantaggio su tutti i tiri di Percezione passiva."},
  {gruppo:6,pos:1,nome:"Il Nome Vero del Creatore",fonte:"Frammento Primordiale",flavor:"Chi pronuncia il Nome Vero non è più solo un avventuriero. È una nuova bilancia.",mec_breve:"1/campagna: effetto meccanicamente impossibile concordato col GM.",mec:"Una volta per campagna: pronuncia il Nome Vero per ottenere un effetto meccanicamente impossibile concordato col GM prima dell'uso. Non esistono limiti meccanici — ma il Flusso di Arkadia2099 reagisce sempre. Nessuno è mai rimasto uguale dopo averlo pronunciato."},
  {gruppo:6,pos:2,nome:"Frammento del Destino Condiviso",fonte:"Eco della Profezia della Nuova Frattura",flavor:"I Sette Eroi lasciarono nel mondo i semi di una nuova era.",mec_breve:"Inizio sessione: evento certo dal GM. 1/scontro: ritira qualsiasi dado.",mec:"Frattura \"I Sette Eroi lasciarono nel mondo i semi di una nuova era. Questo Frammento è uno di quei semi, ancora in attesa di germogliare.\" Due effetti: (1) inizio sessione, il GM ti rivela un evento certo in segreto; (2) 1/scontro dopo qualsiasi tiro: puoi dichiarare Ritiro Destino, il dado viene ritirato e si usa obbligatoriamente il nuovo risultato."},
  {gruppo:6,pos:3,nome:"Frammento del Contratto Perduto",fonte:"Eco del Codice Arkadiano",flavor:"Il frammento del tentativo rimase.",mec_breve:"1/campagna: Contratto col GM. Obiettivo impossibile → potere permanente unico.",mec:"1/campagna: stipula un Contratto col GM. Definite insieme un obiettivo impossibile da raggiungere. Se lo raggiungi: il GM ti assegna un potere permanente unico. Se fallisci: una conseguenza grave concordata alla stipula si applica al personaggio. Il Contratto non è revocabile."},
  {gruppo:6,pos:4,nome:"Frammento dell'Anima Accumulata",fonte:"Eco del Codice d'Onore",flavor:"Non si guadagna rango per eredità — lo si guadagna su sangue volontario.",mec_breve:"Ogni scontro vinto: +1 PA speciale. Spendi: +1 danno Skill (1), +5 HP max (2), +1 stat (5).",mec:"Ogni scontro vinto (tutti i nemici sconfitti): +1 Punto Anima (PA). I Punti Avanzamento si accumulano per tutta la campagna. Spesa: 1 PA = +1 danno permanente a una Skill; 2 PA = +5 HP massimi permanenti; 5 PA = +1 a una caratteristica permanente. Cap: massimo +3 a qualsiasi caratteristica per campagna (evita crescita infinita)."},
  {gruppo:6,pos:5,nome:"Frammento della Benedizione",fonte:"Eco del Serafino Arveil",flavor:"Portarono spiriti antichi come guide.",mec_breve:"1/sessione: evoca Spirito Antico (Battaglia/Guarigione/Saggezza). Stats = tuo Rank.",mec:"1/scontro come Azione Principale: evochi uno Spirito Antico. BATTAGLIA: attacca ogni turno per 1d8+3. GUARIGIONE: cura 1d6+2 a alleato adiacente ogni turno. SAGGEZZA: +1 a tutti i tiri di un alleato designato. Dura max 5 turni. Lo spirito ha HP = tuo Rank × 10."},
  {gruppo:6,pos:6,nome:"Frammento dell'Eco Finale",fonte:"Eco dell'ultima parola del Creatore",flavor:"'Ora siete soli.' Non del tutto.",mec_breve:"1/sessione: boss non può ucciderti (vai a 1 HP). Alleati vicini: +1✦ a inizio sessione.",mec:"Due effetti: (1) 1/scontro, se un boss ti porterebbe a 0 HP con un singolo attacco, vai invece a 1 HP; (2) quando il salvataggio si attiva, tutti gli alleati entro 8m guadagnano immediatamente 1 Scintilla. Il bonus Scintille e' legato all'attivazione del salvataggio, non al passaggio del tempo."},
];

const RAZZE = [
  {nome:"Umano",flavor:"Adattabile — nessun limite naturale, nessuna barriera",bonus:"+1 a due caratteristiche diverse a scelta",tratto1:"Adattamento (1/giorno): dopo aver visto il risultato di un dado, aggiungi +2 prima che il GM dichiari l'esito.",tratto2:"Potenziale: PS guadagnati +10%. Ogni Rank pari (E, C, A, SS) sblocca un Talento permanente.",malus:"+1 Scintilla a inizio sessione. Nessun malus.",mod_hp:0,mod_fl:0,mod_dif:0,color:"#185fa5"},
  {nome:"Elfo del Sogno",flavor:"Creatura nativa del Flusso — leggera, magica, fragile",bonus:"+2 AGI, +2 PER, +1 INT / –2 RES / HP max –15%",tratto1:"Visione del Sogno: rilevi automaticamente entità invisibili entro 10m e illusioni.",tratto2:"Affinità Magica: ogni Skill costa 1 Flusso in meno (min 0). Recupera 2 Flusso extra per riposo breve.",malus:"RES –2, HP max –15%, danni da corruzione +2.",mod_hp:-0.15,mod_fl:0,mod_dif:0,color:"#0f6e56"},
  {nome:"Orc del Sogno",flavor:"Guerriero nato — ogni sconfitta lo rende più pericoloso",bonus:"+3 FOR, +2 RES, +1 a scelta / –2 INT / Flusso max –20%",tratto1:"Furia del Sangue: sotto 30% HP automaticamente +2 danni e immunità Spaventato. No Skill >2 Flusso.",tratto2:"Rigenerazione: recupera 2+mod RES HP all'inizio di ogni proprio turno in combattimento.",malus:"INT –2, Flusso max –20%.",mod_hp:9,mod_fl:-0.2,mod_dif:0,color:"#c0392b"},
  {nome:"Fantasma",flavor:"Entità semi-corporea — già attraversata la morte una volta",bonus:"+2 INT, +2 PER, +1 CAR / –3 FOR / no armature pesanti",tratto1:"Corpo d'Ombra: 1/sessione, ignora completamente il primo colpo fisico ricevuto.",tratto2:"Eco della Memoria: percepisce emozioni entro 5m. 1/turno: +3 Difesa contro attacco visto partire.",malus:"FOR –3, nessuna armatura pesante, danno sacro/purificazione ×1.5.",mod_hp:-9,mod_fl:0,mod_dif:0,color:"#534ab7"},
  {nome:"Nano del Sogno",flavor:"Custode della pietra — indistruttibile, lento, insostituibile",bonus:"+2 RES, +2 FOR, +1 INT / –2 AGI / Velocità –1",tratto1:"Pelle di Mithral: +1 Difesa permanente. Immune ai veleni naturali. Vantaggio su TS condizioni fisiche.",tratto2:"Maestro Artigiano: ogni riposo lungo crea 1 oggetto (Bomba, Pozione, Trappola, o Arnese +3).",malus:"AGI –2, Velocità –1 (min 1). Svantaggio su Schivata Attiva.",mod_hp:6,mod_fl:0,mod_dif:1,color:"#854f0b"},
  {nome:"Bestian",flavor:"Umanoide con tratti animali — sensi affinati, corpo agile",bonus:"+2 AGI, +1 PER, +1 FOR / scegli sottospecie al Rank F",tratto1:"Sensi Acuti: non puoi essere sorpreso. Vantaggio su Percezione passiva. Rilevi stealth entro 8m.",tratto2:"Artigli/Morso: 1d6+FOR o AGI come Azione Bonus dopo attacco con arma. Sottospecie: Felino (+1 AGI), Canide (+1 FOR), Rapace (+1 PER).",malus:"Svantaggio Furtività in spazi chiusi (odore). Scegli sottospecie al Rank F.",mod_hp:0,mod_fl:0,mod_dif:0,color:"#3b6d11"},
  {nome:"Cyborg",flavor:"Umano modificato — ha perso pezzi di sé, ha guadagnato qualcos'altro",bonus:"+2 FOR, +2 RES, +1 INT / –1 AGI / nessuna cura magica",tratto1:"Corpo Potenziato: gli impianti meccanici assorbono parte dei danni fisici. Riduci di 2 tutti i danni fisici subiti (minimo 1). Una volta per riposo lungo, puoi sostituire un tiro salvezza fallito con un successo automatico.",tratto2:"Sovraccarico (1/scontro, A.Bonus): forzi gli impianti oltre i limiti. Per 2 turni: +3 danni fisici e +2 Difesa. Al termine: Rallentato 1 turno.",malus:"AGI –1. Nessuna cura magica: recuperi HP solo da riposo o kit medici. Acqua/campi elettrici: Svantaggio su tutti i tiri fino a fine scontro.",mod_hp:0,mod_fl:0,mod_dif:0,color:"#4a5568"},
  {nome:"Sintetico",flavor:"Costrutto organico-meccanico di Nova Era — non nato, progettato",bonus:"+2 INT, +2 RES, +1 a scelta (FOR/INT) / nessun recupero naturale HP / no cura magica",tratto1:"Architettura Modulare: non sei mai Esausto. Dopo ogni riposo breve, scegli 1 tra: +2 a un modificatore per il prossimo scontro, ripristino 20% FL, +2 Difesa per 1 scontro.",tratto2:"Protocollo di Emergenza: quando scendi a 0 HP, prima dei TS Mortali effettua 1 tiro RES DC 12. Successo: rimani in piedi con 1 HP (1/scontro).",malus:"Non recuperi HP da riposo o cura magica — solo da riparazioni (kit medici, Maestro Artigiano, strutture Nova Era). Vulnerabile al fulmine (+2 danni).",mod_hp:0,mod_fl:0,mod_dif:0,color:"#4dd9ff"},
  {nome:"Eco del Pandora",flavor:"Sopravvissuto al Pandora — la corruzione è diventata la sua unica certezza",bonus:"+2 RES, +2 FOR, +1 INT / –2 CAR / aspetto segnato dalla corruzione",tratto1:"Metabolismo Corrotto: immune a veleni e corruzione del Flusso. Ogni danno di corruzione subito viene convertito in Flusso recuperato (1 danno = 1 FL, max 10 FL/turno).",tratto2:"Rilascio Controllato (1/scontro, A.Bonus): per 3 turni i tuoi attacchi infliggono +1d6 danni di corruzione. Al termine: subisci 1d4 danni di corruzione (convertiti in Flusso).",malus:"CAR –2 — la corruzione è visibile. Nelle zone civili sei trattato come una minaccia. Danni sacri/purificazione +50%. Nessuna cura divina.",mod_hp:0,mod_fl:0,mod_dif:0,color:"#8e44ad"},
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
    @keyframes spin {
      from { transform: rotate(0deg); }
      to   { transform: rotate(360deg); }
    }
    @keyframes pulse-ring {
      0%   { box-shadow: 0 0 0 0 rgba(255,77,109,0.5); }
      70%  { box-shadow: 0 0 0 12px rgba(255,77,109,0); }
      100% { box-shadow: 0 0 0 0 rgba(255,77,109,0); }
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

    /* ── Select dropdown: force dark theme nel dropdown nativo del browser ── */
    select.input-field {
      background-color: #14112a;
      color: var(--text-bright);
      -webkit-appearance: none;
      -moz-appearance: none;
      appearance: none;
      background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'><path fill='%238c6eff' d='M6 9L1 4h10z'/></svg>");
      background-repeat: no-repeat;
      background-position: right 0.6rem center;
      padding-right: 2rem;
      cursor: pointer;
    }
    select.input-field option {
      background-color: #14112a;
      color: #e8e2d5;
      padding: 0.5rem;
    }
    select.input-field option:hover,
    select.input-field option:checked {
      background-color: #8c6eff;
      color: white;
    }
    /* Input type="color" più leggibile */
    input[type="color"].input-field {
      padding: 0.2rem;
      cursor: pointer;
    }

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
          {/* Logo grande — contiene già il nome Arcadia2099 */}
          <div style={{ marginBottom:"1.5rem", display:"flex", justifyContent:"center" }}>
            <img
              src="/logo.png"
              alt="Arcadia 2099"
              onError={e => {
                e.target.style.display="none";
                // Se il logo non carica, mostra il titolo testuale di fallback
                const fallback = document.getElementById("hero-title-fallback");
                if (fallback) fallback.style.display = "block";
              }}
              style={{
                maxWidth: "min(420px, 80vw)",
                width: "100%", height: "auto", objectFit:"contain",
                filter:"drop-shadow(0 0 24px rgba(140,110,255,0.4))",
              }}
            />
          </div>
          {/* Fallback testuale: nascosto se il logo carica */}
          <div id="hero-title-fallback" style={{ display:"none" }}>
            <div className="hero-title">ARCADIA 2099</div>
          </div>
          <div className="hero-sub" style={{ marginTop:"0.5rem" }}>Chaos System · Sistema LUCID d20</div>
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
function GeneratorePage({ setPage }) {
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
  const [savedSchedaId,    setSavedSchedaId]    = useState(null);

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

    // ═══ SALVA AUTOMATICAMENTE NELLA SCHEDA GIOCABILE ═══
    const newId = Date.now();
    const schedaPG = {
      id: newId,
      nome: pgName || "Senza Nome",
      classeNome: c.nome,
      razzaNome: r.nome,
      frammentoNome: selectedFrammento.nome,
      locked: true, // creata dal Generatore — classe/razza/frammento non modificabili
      background: pgBackground || "",
      pa: 0,
      hp_curr: baseHP,
      fl_curr: baseFL,
      scintille: 3 + (r.nome === "Umano" ? 1 : 0),
      scintille_max: 3 + (r.nome === "Umano" ? 1 : 0),
      armatura: 0,
      avatar: null,
      token_color: "#8c6eff",
      note: "",
      skills: c.skills.map(sk => ({ nome: sk.nome, ps: 0, costo: sk.costo })),
      condizioni: [],
      log: [{
        msg: `Scheda creata dal Generatore · ${c.nome} · ${r.nome} · ${selectedFrammento.nome}`,
        type: "level",
        time: new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }),
      }],
    };

    try {
      let existing = [];
      const raw = localStorage.getItem("arcadia_schede_v1");
      if (raw) {
        try { existing = JSON.parse(raw); if (!Array.isArray(existing)) existing = []; }
        catch { existing = []; }
      }
      existing.push(schedaPG);
      localStorage.setItem("arcadia_schede_v1", JSON.stringify(existing));
      localStorage.setItem("arcadia_schede_selected_v1", String(newId));
      console.log("[Generatore] Scheda salvata:", schedaPG.nome, "ID:", newId, "Tot schede:", existing.length);
      setSavedSchedaId(newId);
    } catch (e) {
      console.error("[Generatore] Errore salvataggio scheda:", e);
      alert("Impossibile salvare la scheda: " + e.message);
    }

    setStep(4);
  }

  function goToScheda() {
    if (setPage) setPage("scheda");
  }

  function restart() {
    setStep(0); setCatRoll(null); setGrpRoll(null);
    setRolling1(false); setRolling2(false); setSettled1(false); setSettled2(false);
    setSelectedClasse(null); setSelectedFrammento(null); setSelectedRazza(null);
    setPgName(""); setPgBackground(""); setGenerated(null); setSavedSchedaId(null);
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

            {/* Banner: scheda salvata nella Scheda Giocabile */}
            {savedSchedaId && (
              <div style={{
                margin:"1rem 2rem 0",
                padding:"1rem 1.25rem",
                background:"linear-gradient(135deg, rgba(77,255,168,0.1), rgba(140,110,255,0.08))",
                border:"1px solid rgba(77,255,168,0.4)",
                borderRadius:8,
                display:"flex",
                justifyContent:"space-between",
                alignItems:"center",
                gap:"1rem",
                flexWrap:"wrap",
              }}>
                <div>
                  <div style={{ fontFamily:"'Cinzel',serif", fontWeight:700, color:"var(--green)", fontSize:"0.88rem", marginBottom:"0.2rem" }}>
                    ✓ Scheda salvata automaticamente
                  </div>
                  <div style={{ fontSize:"0.78rem", color:"var(--text-dim)" }}>
                    Puoi ora combattere, salire di Rank, modificare HP/FL e stampare il PDF dalla Scheda Giocabile.
                  </div>
                </div>
                <button className="btn btn-primary" style={{ fontSize:"0.8rem", whiteSpace:"nowrap" }} onClick={goToScheda}>
                  📋 Apri nella Scheda →
                </button>
              </div>
            )}

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
    try {
      const s = localStorage.getItem("arcadia_schede_v1");
      const parsed = s ? JSON.parse(s) : [];
      if (!Array.isArray(parsed)) return [];
      // Migrazione nomi classi vecchi → manuale v7
      const RENAME_MAP = {
        "Paladino del Sogno": "Paladino Arkadiano",
        "Ranger del Sogno": "Ranger del Flusso",
        "Evocatore di Sogni": "Evocatore del Flusso",
        "Guardiano del Sogno": "Guardiano Arkadiano",
        "Monaco del Sogno": "Monaco del Flusso",
        "Domatore di Anime": "Domatore",
        "Veggente del Sogno": "Veggente",
        "Cercatore del Sogno": "Cercatore",
        "Bardo del Sogno": "Bardo",
      };
      let migrated = 0;
      const fixed = parsed.map(p => {
        if (p.classeNome && RENAME_MAP[p.classeNome]) {
          migrated++;
          return { ...p, classeNome: RENAME_MAP[p.classeNome] };
        }
        return p;
      });
      if (migrated > 0) {
        localStorage.setItem("arcadia_schede_v1", JSON.stringify(fixed));
        console.log(`[Scheda] Migrate ${migrated} schede ai nuovi nomi classe v7`);
      }
      console.log("[Scheda] Caricate", fixed.length, "schede dal localStorage");
      return fixed;
    }
    catch { return []; }
  });
  const [selectedId, setSelectedId] = useState(() => {
    try {
      const v = localStorage.getItem("arcadia_schede_selected_v1");
      console.log("[Scheda] Scheda pre-selezionata:", v);
      return v || null;
    }
    catch { return null; }
  });
  const [tab, setTab] = useState("info"); // info | combat | skills | progress | log
  const [hasInitialized, setHasInitialized] = useState(false);
  const [rankUpEvent, setRankUpEvent] = useState(null); // {oldRank, newRank, newHp, newFl, newDif}
  const avatarRef = useRef(null);

  // Scrive in localStorage solo DOPO il primo render (evita di sovrascrivere al mount)
  useEffect(() => {
    if (!hasInitialized) { setHasInitialized(true); return; }
    try { localStorage.setItem("arcadia_schede_v1", JSON.stringify(personaggi)); } catch {}
  }, [personaggi, hasInitialized]);

  useEffect(() => {
    if (!hasInitialized) return;
    try {
      if (selectedId) localStorage.setItem("arcadia_schede_selected_v1", String(selectedId));
      else localStorage.removeItem("arcadia_schede_selected_v1");
    } catch {}
  }, [selectedId, hasInitialized]);

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
  else if (razza.nome === "Cyborg") { stats.FOR+=2; stats.RES+=2; stats.INT+=1; stats.AGI-=1; }
  else if (razza.nome === "Sintetico") { stats.INT+=2; stats.RES+=2; stats.FOR+=1; }
  else if (razza.nome === "Eco del Pandora") { stats.RES+=2; stats.FOR+=2; stats.INT+=1; stats.CAR-=2; }

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
      {/* MODAL RANK UP CELEBRATIVA */}
      {rankUpEvent && (
        <div onClick={() => setRankUpEvent(null)} style={{
          position:"fixed", inset:0, background:"rgba(3,1,8,0.92)", zIndex:300,
          display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem",
          backdropFilter:"blur(8px)",
        }}>
          <div onClick={e => e.stopPropagation()} className="card anim-fade-in" style={{
            padding:"2.5rem 2rem", maxWidth:520, width:"100%", textAlign:"center",
            borderTop:`4px solid ${getRankColor(rankUpEvent.newRank)}`,
            boxShadow:`0 0 60px ${getRankColor(rankUpEvent.newRank)}80`,
          }}>
            <div style={{ fontSize:"3rem", marginBottom:"0.5rem" }}>🎉</div>
            <div style={{ fontFamily:"'Cinzel',serif", fontSize:"0.85rem", color:"var(--text-dim)", textTransform:"uppercase", letterSpacing:"0.18em", marginBottom:"0.4rem" }}>
              Rank Up
            </div>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"1.5rem", marginBottom:"1rem" }}>
              <div style={{
                fontFamily:"'Cinzel Decorative',serif", fontSize:"3rem", fontWeight:700,
                color:getRankColor(rankUpEvent.oldRank), opacity:0.5,
              }}>{rankUpEvent.oldRank}</div>
              <div style={{ fontSize:"2rem", color:"var(--gold)" }}>→</div>
              <div style={{
                fontFamily:"'Cinzel Decorative',serif", fontSize:"5rem", fontWeight:900,
                color:getRankColor(rankUpEvent.newRank),
                textShadow:`0 0 30px ${getRankColor(rankUpEvent.newRank)}80`,
              }}>{rankUpEvent.newRank}</div>
            </div>
            <div style={{ fontFamily:"'Cinzel',serif", fontSize:"1.1rem", color:"var(--gold)", marginBottom:"1.5rem", fontStyle:"italic" }}>
              {rankUpEvent.titolo}
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"0.75rem", marginBottom:"1.5rem" }}>
              <div style={{ padding:"0.75rem", background:"var(--panel2)", borderRadius:6 }}>
                <div style={{ fontSize:"0.65rem", color:"var(--text-dim)", textTransform:"uppercase", letterSpacing:"0.1em" }}>HP</div>
                <div style={{ fontSize:"0.9rem", color:"var(--text-dim)", marginTop:"0.2rem" }}>{rankUpEvent.hp_old}</div>
                <div style={{ fontSize:"1.4rem", color:"var(--red)", fontWeight:700 }}>{rankUpEvent.hp_new}</div>
                <div style={{ fontSize:"0.7rem", color:"var(--green)", marginTop:"0.1rem" }}>+{rankUpEvent.hp_new - rankUpEvent.hp_old}</div>
              </div>
              <div style={{ padding:"0.75rem", background:"var(--panel2)", borderRadius:6 }}>
                <div style={{ fontSize:"0.65rem", color:"var(--text-dim)", textTransform:"uppercase", letterSpacing:"0.1em" }}>Flusso</div>
                <div style={{ fontSize:"0.9rem", color:"var(--text-dim)", marginTop:"0.2rem" }}>{rankUpEvent.fl_old}</div>
                <div style={{ fontSize:"1.4rem", color:"var(--flux)", fontWeight:700 }}>{rankUpEvent.fl_new}</div>
                <div style={{ fontSize:"0.7rem", color:"var(--green)", marginTop:"0.1rem" }}>+{rankUpEvent.fl_new - rankUpEvent.fl_old}</div>
              </div>
              <div style={{ padding:"0.75rem", background:"var(--panel2)", borderRadius:6 }}>
                <div style={{ fontSize:"0.65rem", color:"var(--text-dim)", textTransform:"uppercase", letterSpacing:"0.1em" }}>Difesa</div>
                <div style={{ fontSize:"0.9rem", color:"var(--text-dim)", marginTop:"0.2rem" }}>{rankUpEvent.dif_old}</div>
                <div style={{ fontSize:"1.4rem", color:"var(--purple)", fontWeight:700 }}>{rankUpEvent.dif_new}</div>
                <div style={{ fontSize:"0.7rem", color: rankUpEvent.dif_new > rankUpEvent.dif_old ? "var(--green)" : "var(--text-mute)", marginTop:"0.1rem" }}>
                  {rankUpEvent.dif_new > rankUpEvent.dif_old ? `+${rankUpEvent.dif_new - rankUpEvent.dif_old}` : "—"}
                </div>
              </div>
            </div>
            <button className="btn btn-gold btn-lg" onClick={() => setRankUpEvent(null)}>✨ Continua</button>
          </div>
        </div>
      )}

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
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1rem", flexWrap:"wrap", gap:"0.5rem" }}>
              <div className="section-title">Identità</div>
              {char.locked && (
                <div style={{ display:"flex", alignItems:"center", gap:"0.5rem" }}>
                  <span style={{ fontSize:"0.72rem", color:"var(--gold)", background:"rgba(201,169,110,0.12)", padding:"0.25rem 0.6rem", borderRadius:4, border:"1px solid rgba(201,169,110,0.3)" }}>
                    🔒 Generato dal Creatore di PG
                  </span>
                  <button className="btn btn-outline btn-xs" onClick={() => {
                    if (confirm("Sbloccare l'identità? Potrai cambiare classe, razza e frammento, ma perderai la coerenza con la generazione originale.")) {
                      updateChar({ locked: false });
                    }
                  }}>Sblocca</button>
                </div>
              )}
            </div>
            <div className="grid-2">
              <div>
                <label style={{ fontSize:"0.7rem", color:"var(--text-dim)", textTransform:"uppercase", letterSpacing:"0.08em", display:"block", marginBottom:"0.3rem" }}>Classe</label>
                <select className="input-field" value={char.classeNome} disabled={char.locked}
                  style={char.locked ? { opacity:0.7, cursor:"not-allowed" } : {}}
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
                <select className="input-field" value={char.razzaNome} disabled={char.locked}
                  style={char.locked ? { opacity:0.7, cursor:"not-allowed" } : {}}
                  onChange={e => updateChar({ razzaNome: e.target.value })}>
                  {RAZZE.map(r => <option key={r.nome} value={r.nome}>{r.nome}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize:"0.7rem", color:"var(--text-dim)", textTransform:"uppercase", letterSpacing:"0.08em", display:"block", marginBottom:"0.3rem" }}>Frammento</label>
                <select className="input-field" value={char.frammentoNome} disabled={char.locked}
                  style={char.locked ? { opacity:0.7, cursor:"not-allowed" } : {}}
                  onChange={e => updateChar({ frammentoNome: e.target.value })}>
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
      {tab === "progress" && <ProgressTab char={char} rank={rank} rankNext={rankNext} cls={cls} razza={razza} updateChar={updateChar} addLog={addLog} onRankUp={setRankUpEvent} />}

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

  // ═══ TIRI SALVEZZA MORTALI (cap. 6.9) ═══
  // A 0 HP, all'inizio di ogni proprio turno tira 1d20:
  // - 20 nat: torni a 1 HP. - 10-19: 1 successo. - 2-9: 1 fallimento. - 1 nat: 2 fallimenti.
  // 3 successi → Stabilizzato (incosciente, non muori). 3 fallimenti → MORTE.
  const tiroSalvezzaMortale = () => {
    if ((char.hp_curr ?? 0) > 0) {
      addLog("Non puoi tirare TS Mortali: hai HP > 0", "info");
      return;
    }
    if ((char.morti_succ || 0) >= 3 || (char.morti_fall || 0) >= 3) {
      addLog("Lo stato è già determinato (Stabilizzato o Morto)", "info");
      return;
    }
    const r = Math.floor(Math.random() * 20) + 1;
    let succ = char.morti_succ || 0;
    let fall = char.morti_fall || 0;
    let msg = `🩸 TS Mortale: d20=${r} → `;
    let updates = {};
    if (r === 20) {
      msg += "20 NAT! Recuperi conoscenza con 1 HP";
      updates = { hp_curr: 1, morti_succ: 0, morti_fall: 0 };
    } else if (r === 1) {
      fall += 2;
      msg += `1 NAT! 2 fallimenti (${succ} succ / ${fall} fall)`;
      updates = { morti_fall: fall };
    } else if (r >= 10) {
      succ += 1;
      msg += `Successo (${succ} succ / ${fall} fall)`;
      updates = { morti_succ: succ };
    } else {
      fall += 1;
      msg += `Fallimento (${succ} succ / ${fall} fall)`;
      updates = { morti_fall: fall };
    }
    if (succ >= 3) {
      msg += " · ✓ STABILIZZATO (incosciente, salvo)";
      updates = { ...updates, morti_succ: 3 };
    }
    if (fall >= 3) {
      msg += " · ☠️ MORTE";
      updates = { ...updates, morti_fall: 3 };
    }
    addLog(msg, fall >= 3 ? "danno" : succ >= 3 ? "heal" : "info");
    updateChar(updates);
  };

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
    if (!confirm(`Riposo Breve (10-30 min)?\nRecuperi:\n  • 25% HP (${Math.floor(hp_max * 0.25)})\n  • 30% Flusso (${Math.floor(fl_max * 0.3)})\n  • Reset Reazione e condizioni minori`)) return;
    const hg = Math.floor(hp_max * 0.25);
    const fg = Math.floor(fl_max * 0.3);
    const nh = Math.min(hp_max, (char.hp_curr||0) + hg);
    const nf = Math.min(fl_max, (char.fl_curr||0) + fg);
    // Rimuovi condizioni temporanee (non permanenti)
    const condTemp = ["Stordito","Spaventato","Concentrato","Benedetto","Bruciante"];
    const newCond = (char.condizioni || []).filter(c => !condTemp.includes(c));
    addLog(`🌙 Riposo Breve: +${hg} HP (${nh}/${hp_max}), +${fg} FL (${nf}/${fl_max}) · condizioni temporanee rimosse`, "heal");
    updateChar({ hp_curr: nh, fl_curr: nf, condizioni: newCond });
  };
  const longRest = () => {
    if (!confirm(`Riposo Lungo (8h)?\nRipristino completo:\n  • HP, Flusso al massimo\n  • Scintille al massimo\n  • Tutte le condizioni rimosse\n  • Tutte le abilità "1/giorno" si resettano`)) return;
    addLog(`☀️ Riposo Lungo: HP ${hp_max}/${hp_max}, FL ${fl_max}/${fl_max}, Scintille ${char.scintille_max||3}/${char.scintille_max||3} · tutte le condizioni rimosse`, "heal");
    updateChar({
      hp_curr: hp_max,
      fl_curr: fl_max,
      scintille: char.scintille_max || 3,
      condizioni: [],
      morti_succ: 0,
      morti_fall: 0,
    });
  };

  return (
    <>
      {/* PANNELLO TIRI SALVEZZA MORTALI — appare solo a 0 HP */}
      {(char.hp_curr ?? 1) <= 0 && (char.morti_fall || 0) < 3 && (char.morti_succ || 0) < 3 && (
        <div className="card" style={{
          padding:"1.5rem", marginBottom:"1rem",
          background:"linear-gradient(135deg, rgba(255,77,109,0.15), rgba(0,0,0,0.5))",
          border:"2px solid var(--red)",
          boxShadow:"0 0 24px rgba(255,77,109,0.3)",
        }}>
          <div style={{ display:"flex", alignItems:"center", gap:"0.75rem", marginBottom:"1rem" }}>
            <div style={{ fontSize:"2rem" }}>🩸</div>
            <div>
              <div className="section-title" style={{ color:"var(--red)", marginBottom:"0.2rem" }}>Tiri Salvezza Mortali</div>
              <div style={{ fontSize:"0.78rem", color:"var(--text-dim)" }}>
                Sei a 0 HP. Tira 1d20 a inizio turno. 3 successi → Stabilizzato. 3 fallimenti → Morte.
              </div>
            </div>
          </div>
          {/* Indicatori successi/fallimenti */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.75rem", marginBottom:"1rem" }}>
            <div style={{ padding:"0.6rem", background:"var(--panel2)", borderRadius:6, border:"1px solid var(--green)" }}>
              <div style={{ fontSize:"0.65rem", color:"var(--green)", textTransform:"uppercase", letterSpacing:"0.1em", fontWeight:700 }}>Successi</div>
              <div style={{ display:"flex", gap:"0.4rem", marginTop:"0.4rem" }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{
                    width:24, height:24, borderRadius:"50%",
                    border:"2px solid var(--green)",
                    background: (char.morti_succ||0) > i ? "var(--green)" : "transparent",
                    transition:"background 0.3s",
                  }} />
                ))}
              </div>
            </div>
            <div style={{ padding:"0.6rem", background:"var(--panel2)", borderRadius:6, border:"1px solid var(--red)" }}>
              <div style={{ fontSize:"0.65rem", color:"var(--red)", textTransform:"uppercase", letterSpacing:"0.1em", fontWeight:700 }}>Fallimenti</div>
              <div style={{ display:"flex", gap:"0.4rem", marginTop:"0.4rem" }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{
                    width:24, height:24, borderRadius:"50%",
                    border:"2px solid var(--red)",
                    background: (char.morti_fall||0) > i ? "var(--red)" : "transparent",
                    transition:"background 0.3s",
                  }} />
                ))}
              </div>
            </div>
          </div>
          <button className="btn btn-danger btn-lg" onClick={tiroSalvezzaMortale} style={{ width:"100%" }}>
            🎲 Tira Salvezza Mortale (1d20)
          </button>
          <div style={{ fontSize:"0.7rem", color:"var(--text-mute)", marginTop:"0.5rem", textAlign:"center", fontStyle:"italic" }}>
            Regola: 20 nat → 1 HP · 10-19 → successo · 2-9 → fallimento · 1 nat → 2 fallimenti
          </div>
        </div>
      )}

      {/* MESSAGGIO STABILIZZATO */}
      {(char.hp_curr ?? 1) <= 0 && (char.morti_succ || 0) >= 3 && (
        <div className="card" style={{ padding:"1rem", marginBottom:"1rem", background:"rgba(77,255,168,0.08)", border:"1px solid var(--green)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"0.75rem" }}>
            <div style={{ fontSize:"1.6rem" }}>✓</div>
            <div>
              <div style={{ fontFamily:"'Cinzel',serif", color:"var(--green)", fontWeight:700 }}>Stabilizzato</div>
              <div style={{ fontSize:"0.78rem", color:"var(--text-dim)", marginTop:"0.2rem" }}>
                Incosciente ma salvo. Recuperi 1 HP dopo 1 ora di riposo, o subito con cure di un alleato.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MESSAGGIO MORTE */}
      {(char.hp_curr ?? 1) <= 0 && (char.morti_fall || 0) >= 3 && (
        <div className="card" style={{ padding:"1.5rem", marginBottom:"1rem", background:"linear-gradient(135deg, rgba(0,0,0,0.6), rgba(255,77,109,0.15))", border:"2px solid var(--red)" }}>
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:"3rem", marginBottom:"0.4rem" }}>☠️</div>
            <div style={{ fontFamily:"'Cinzel Decorative',serif", color:"var(--red)", fontSize:"1.4rem", fontWeight:700 }}>{char.nome} è caduto</div>
            <div style={{ fontSize:"0.82rem", color:"var(--text-dim)", marginTop:"0.5rem", maxWidth:400, margin:"0.5rem auto 1rem" }}>
              Il personaggio è morto. Il GM può applicare le regole di resurrezione del manuale, oppure si crea un nuovo PG.
            </div>
            <button className="btn btn-outline btn-sm" onClick={() => {
              if (confirm("Resettare i Tiri Salvezza Mortali (es. dopo cure)?")) {
                updateChar({ morti_succ: 0, morti_fall: 0, hp_curr: 1 });
                addLog("Stato resettato: 1 HP", "heal");
              }
            }}>↻ Reset (cure ricevute)</button>
          </div>
        </div>
      )}

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

function ProgressTab({ char, rank, rankNext, cls, razza, updateChar, addLog, onRankUp }) {
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
      const oldRank = RANKS[oIdx];
      let nhp = Math.round(cls.hp * RANK_MHP[newRank]);
      let ohp = Math.round(cls.hp * RANK_MHP[oldRank]);
      if (typeof razza.mod_hp === "number") {
        if (razza.mod_hp < 0 && razza.mod_hp > -1) {
          nhp = Math.ceil(nhp * (1 + razza.mod_hp));
          ohp = Math.ceil(ohp * (1 + razza.mod_hp));
        } else {
          nhp += razza.mod_hp;
          ohp += razza.mod_hp;
        }
      }
      let nfl = Math.round(cls.fl * RANK_MFL[newRank]);
      let ofl = Math.round(cls.fl * RANK_MFL[oldRank]);
      if (typeof razza.mod_fl === "number" && razza.mod_fl < 0) {
        nfl = Math.floor(nfl * (1 + razza.mod_fl));
        ofl = Math.floor(ofl * (1 + razza.mod_fl));
      }
      const ndif = cls.dif + RANK_BDIF[newRank] + (char.armatura||0);
      const odif = cls.dif + RANK_BDIF[oldRank] + (char.armatura||0);
      addLog(`🎉 RANK UP! ${oldRank} → ${newRank} — ${RANK_TITOLI[newRank]}`, "level");
      updateChar({ pa: np, hp_curr: nhp, fl_curr: nfl });
      // Modal celebrativa
      if (onRankUp) onRankUp({
        oldRank, newRank,
        titolo: RANK_TITOLI[newRank],
        hp_old: ohp, hp_new: nhp,
        fl_old: ofl, fl_new: nfl,
        dif_old: odif, dif_new: ndif,
      });
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
        </div>
      </div>

      {/* Tab categoria armi prominenti quando sei in Arsenale */}
      {sezione === "arsenale" && (
        <div style={{ display:"flex", gap:"0.4rem", flexWrap:"wrap", marginBottom:"1rem" }}>
          {[
            ["", `Tutte · ${ARSENALE.length}`, "var(--purple)"],
            ...sezioniArmi.map(s => [
              s,
              `${s.replace("Armi al ", "").replace("Armi a ", "").replace("Armi ", "")} · ${ARSENALE.filter(a => a.sezione === s).length}`,
              s === "Armi Bianche" ? "#c9c9c9" :
              s === "Armi al Plasma" ? "#ff9c4d" :
              s === "Armi a Raggio" ? "#4dd9ff" :
              s === "Armi Tecnomagiche" ? "#b47dff" : "var(--gold)"
            ])
          ].map(([val, label, color]) => (
            <button key={val || "all"} onClick={() => setArmiFilter(val)}
              style={{
                padding:"0.4rem 0.9rem", borderRadius:6, fontSize:"0.78rem",
                fontFamily:"'Cinzel',serif", fontWeight:700,
                border: `1px solid ${armiFilter === val ? color : "var(--border)"}`,
                background: armiFilter === val ? `${color}20` : "var(--panel2)",
                color: armiFilter === val ? color : "var(--text-dim)",
                cursor:"pointer",
                transition: "all 0.15s",
              }}>
              {label}
            </button>
          ))}
        </div>
      )}

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
// BATTAGLIA — Mappa tattica con token e targeting
// ═══════════════════════════════════════════════════════
const CELL_SIZE = 48; // px per cella della griglia
const GRID_W = 20;    // larghezza in celle
const GRID_H = 15;    // altezza in celle

const CONDIZIONI_BATTLE = ["Spaventato","Stordito","Silenziato","Sanguinante","Rallentato","Addormentato","Confuso","Corrotto","Esausto"];

function BattlePage() {
  // Stato battaglia (persistente)
  const [state, setState] = useState(() => {
    try {
      const s = localStorage.getItem("arcadia_battle_v1");
      const parsed = s ? JSON.parse(s) : null;
      if (parsed) {
        // Migrazione: se c'è turnIdx ma non currentTokenId, converti
        if (parsed.turnIdx !== undefined && !parsed.currentTokenId && parsed.tokens?.[parsed.turnIdx]) {
          parsed.currentTokenId = parsed.tokens[parsed.turnIdx].id;
        }
        return { tokens:[], round:1, currentTokenId:null, mapBg:null, log:[], ...parsed };
      }
      return { tokens: [], round: 1, currentTokenId: null, mapBg: null, log: [] };
    } catch { return { tokens: [], round: 1, currentTokenId: null, mapBg: null, log: [] }; }
  });

  const [showAddPanel, setShowAddPanel] = useState(false);
  const [addTab, setAddTab] = useState("schede"); // schede | bestiario | npc | custom
  const [dragId, setDragId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x:0, y:0 });
  const [damageInput, setDamageInput] = useState(5);
  const [customToken, setCustomToken] = useState({ nome:"", hp:20, color:"#ff4d6d" });
  // MODELLO COMBAT: un solo attaccante selezionato. 2° click su altro token = azione.
  const [attackerId, setAttackerId] = useState(null);
  const [attackStat, setAttackStat] = useState("FOR");
  // Quando clicchi un 2° token mentre c'è attackerId, si apre il menu azioni
  const [actionTargetId, setActionTargetId] = useState(null); // bersaglio del menu azioni
  // Skill picker
  const [skillPickerOpen, setSkillPickerOpen] = useState(false);
  const [skillTargetId, setSkillTargetId] = useState(null); // bersaglio pre-selezionato per skill
  const [pendingDodge, setPendingDodge] = useState(null);
  // Pannello "ispeziona" (shift+click o dall'elenco)
  const [inspectId, setInspectId] = useState(null);
  const gridRef = useRef(null);
  const mapInputRef = useRef(null);

  // Persistenza
  useEffect(() => {
    try { localStorage.setItem("arcadia_battle_v1", JSON.stringify(state)); } catch {}
  }, [state]);

  const update = (patch) => setState(s => ({ ...s, ...patch }));
  const updateToken = (id, patch) => setState(s => ({
    ...s,
    tokens: s.tokens.map(t => t.id === id ? { ...t, ...patch } : t),
  }));
  const removeToken = (id) => setState(s => ({
    ...s,
    tokens: s.tokens.filter(t => t.id !== id),
  }));
  const addLog = (msg, type="info") => {
    const entry = { msg, type, time: new Date().toLocaleTimeString("it-IT", { hour:"2-digit", minute:"2-digit" }) };
    setState(s => ({ ...s, log: [entry, ...(s.log||[]).slice(0,99)] }));
  };

  // Carica schede esistenti da localStorage (per aggiungerle come token)
  const schedeDisponibili = useMemo(() => {
    try {
      const s = localStorage.getItem("arcadia_schede_v1");
      return s ? JSON.parse(s) : [];
    } catch { return []; }
  }, [showAddPanel]); // ricarica quando si apre il pannello

  // Aggiungi token da scheda personaggio
  const addFromScheda = (scheda) => {
    const cls = CLASSI.find(c => c.nome === scheda.classeNome) || CLASSI[0];
    const razza = RAZZE.find(r => r.nome === scheda.razzaNome) || RAZZE[0];
    const rank = getRankFromPA(scheda.pa || 0);
    const hp_max = Math.round(cls.hp * RANK_MHP[rank]);
    const fl_max = Math.round(cls.fl * RANK_MFL[rank]);
    // Stat base classe + modificatori razziali
    const stats = { FOR: cls.FOR, AGI: cls.AGI, RES: cls.RES, INT: cls.INT, PER: cls.PER, CAR: cls.CAR };
    if (razza.nome === "Elfo del Sogno") { stats.AGI+=2; stats.PER+=2; stats.INT+=1; stats.RES-=2; }
    else if (razza.nome === "Orc del Sogno") { stats.FOR+=3; stats.RES+=2; stats.INT-=2; }
    else if (razza.nome === "Fantasma") { stats.INT+=2; stats.PER+=2; stats.CAR+=1; stats.FOR-=3; }
    else if (razza.nome === "Nano del Sogno") { stats.RES+=2; stats.FOR+=2; stats.INT+=1; stats.AGI-=2; }
    else if (razza.nome === "Bestian") { stats.AGI+=2; stats.PER+=1; stats.FOR+=1; }
    else if (razza.nome === "Cyborg") { stats.FOR+=2; stats.RES+=2; stats.INT+=1; stats.AGI-=1; }
    else if (razza.nome === "Sintetico") { stats.INT+=2; stats.RES+=2; stats.FOR+=1; }
    else if (razza.nome === "Eco del Pandora") { stats.RES+=2; stats.FOR+=2; stats.INT+=1; stats.CAR-=2; }

    const newTok = {
      id: `pg-${scheda.id}-${Date.now()}`,
      source: "scheda",
      schedaId: scheda.id,
      nome: scheda.nome,
      faction: "alleato",
      color: scheda.token_color || "#4dffa8",
      avatar: scheda.avatar,
      rank: rank,
      hp_curr: scheda.hp_curr ?? hp_max,
      hp_max: hp_max,
      fl_curr: scheda.fl_curr ?? fl_max,
      fl_max: fl_max,
      dif: cls.dif + RANK_BDIF[rank] + (scheda.armatura||0),
      stats: stats,
      dado_danno: cls.dado, // es "1d10" del Guerriero
      iniziativa: null,
      condizioni: [],
      skills: cls.skills, // le skill della classe
      reactionUsed: false, // reazione usata questo round
      pressione: { targetId: null, gradino: 0 }, // accumulo pressione
      velocita: cls.vel + (razza.nome === "Nano del Sogno" ? -1 : 0), // metri per turno
      movimentoUsato: 0, // metri mossi questo turno
      azionePrincipaleUsata: false,
      azioneBonusUsata: false,
      difendersi: false, // +2 DIF fino al prossimo turno
      x: 2 + (state.tokens.filter(t => t.faction==="alleato").length % 4),
      y: 2,
      dead: false,
    };
    setState(s => ({ ...s, tokens: [...s.tokens, newTok] }));
    addLog(`${scheda.nome} entra in battaglia`, "spawn");
    setShowAddPanel(false);
  };

  // Aggiungi token da creatura del Bestiario
  const addFromBestia = (bestia) => {
    const newTok = {
      id: `bst-${bestia.nome.replace(/\s+/g,'')}-${Date.now()}`,
      source: "bestiario",
      nome: bestia.nome,
      faction: "nemico",
      color: "#ff4d6d",
      rank: bestia.rank,
      hp_curr: bestia.hp,
      hp_max: bestia.hp,
      fl_curr: bestia.fl,
      fl_max: bestia.fl,
      dif: bestia.dif,
      stats: bestia.stats || { FOR:10, AGI:10, RES:10, INT:10, PER:10, CAR:10 },
      dado_danno: "1d8", // dado default per creature
      iniziativa: null,
      condizioni: [],
      reactionUsed: false,
      pressione: { targetId: null, gradino: 0 },
      velocita: bestia.velocita || 6,
      movimentoUsato: 0,
      azionePrincipaleUsata: false,
      azioneBonusUsata: false,
      difendersi: false,
      x: 15 + (state.tokens.filter(t => t.faction==="nemico").length % 3),
      y: 7,
      dead: false,
      tipo: bestia.tipo,
      skills: bestia.skills,
    };
    setState(s => ({ ...s, tokens: [...s.tokens, newTok] }));
    addLog(`${bestia.nome} appare sul campo`, "spawn");
    setShowAddPanel(false);
  };

  // Aggiungi NPC dal Compendio
  const addFromNpc = (npc) => {
    const newTok = {
      id: `npc-${npc.nome.replace(/\s+/g,'')}-${Date.now()}`,
      source: "npc",
      nome: npc.nome,
      faction: "neutrale",
      color: FAZIONI_COLOR[npc.fazione] || "#c9a96e",
      rank: npc.rank,
      hp_curr: npc.hp,
      hp_max: npc.hp,
      fl_curr: npc.fl,
      fl_max: npc.fl,
      dif: npc.dif,
      stats: npc.stats || { FOR:10, AGI:10, RES:10, INT:10, PER:10, CAR:10 },
      dado_danno: "1d8",
      iniziativa: null,
      condizioni: [],
      reactionUsed: false,
      pressione: { targetId: null, gradino: 0 },
      velocita: npc.velocita || 6,
      movimentoUsato: 0,
      azionePrincipaleUsata: false,
      azioneBonusUsata: false,
      difendersi: false,
      x: 10,
      y: 7,
      dead: false,
      fazione: npc.fazione,
      skills: npc.skills,
    };
    setState(s => ({ ...s, tokens: [...s.tokens, newTok] }));
    addLog(`${npc.nome} entra in scena`, "spawn");
    setShowAddPanel(false);
  };

  // Aggiungi custom
  const addCustom = () => {
    if (!customToken.nome.trim()) return;
    const newTok = {
      id: `cust-${Date.now()}`,
      source: "custom",
      nome: customToken.nome.trim(),
      faction: "nemico",
      color: customToken.color,
      hp_curr: parseInt(customToken.hp)||20,
      hp_max: parseInt(customToken.hp)||20,
      fl_curr: 0, fl_max: 0,
      dif: 10,
      stats: { FOR:10, AGI:10, RES:10, INT:10, PER:10, CAR:10 },
      dado_danno: "1d6",
      iniziativa: null,
      condizioni: [],
      reactionUsed: false,
      pressione: { targetId: null, gradino: 0 },
      velocita: 6,
      movimentoUsato: 0,
      azionePrincipaleUsata: false,
      azioneBonusUsata: false,
      difendersi: false,
      x: 10, y: 7, dead: false,
    };
    setState(s => ({ ...s, tokens: [...s.tokens, newTok] }));
    addLog(`${newTok.nome} entra in battaglia`, "spawn");
    setCustomToken({ nome:"", hp:20, color:"#ff4d6d" });
    setShowAddPanel(false);
  };

  // Tira iniziativa per tutti i token
  const rollIniziativa = () => {
    setState(s => {
      const tokens = s.tokens.map(t => ({
        ...t,
        iniziativa: Math.floor(Math.random()*20) + 1 + modStat((t.stats||{}).AGI) + (bonusRank(t.rank)||0),
        movimentoUsato: 0,
        azionePrincipaleUsata: false,
        azioneBonusUsata: false,
        reactionUsed: false,
        difendersi: false,
      }));
      // Ordina per iniziativa discendente (parità: PG prima di PNG)
      tokens.sort((a,b) => {
        if ((b.iniziativa||0) !== (a.iniziativa||0)) return (b.iniziativa||0) - (a.iniziativa||0);
        // parità: alleato > neutrale > nemico
        const rank = { alleato: 0, neutrale: 1, nemico: 2 };
        return (rank[a.faction]||1) - (rank[b.faction]||1);
      });
      const firstAlive = tokens.find(t => !t.dead);
      return { ...s, tokens, currentTokenId: firstAlive?.id || null, round: 1 };
    });
    addLog("Iniziativa tirata — ordine determinato", "info");
  };

  const nextTurn = () => {
    setState(s => {
      if (!s.tokens.length) return s;
      const aliveTokens = s.tokens.filter(t => !t.dead);
      if (!aliveTokens.length) return s;

      // Trova l'indice del corrente nell'array ORDINATO (rispetta iniziativa)
      const curIdx = aliveTokens.findIndex(t => t.id === s.currentTokenId);
      let nextIdx = curIdx + 1;
      let newRound = s.round;
      let tokens = s.tokens;

      if (curIdx === -1 || nextIdx >= aliveTokens.length) {
        // Corrente non trovato (es. morto/rimosso) o fine round
        nextIdx = 0;
        if (curIdx !== -1) {
          // Era una fine-round regolare
          newRound = s.round + 1;
          // Reset reazioni + scala durate condizioni
          tokens = tokens.map(t => ({
            ...t,
            reactionUsed: false,
            // TODO: scalare durate condizioni in futuro
          }));
        }
      }

      const nextToken = aliveTokens[nextIdx];

      // Reset flag turno sul token che sta per agire (azioni, movimento)
      tokens = tokens.map(t => {
        if (t.id === nextToken.id) {
          return {
            ...t,
            movimentoUsato: 0,
            azionePrincipaleUsata: false,
            azioneBonusUsata: false,
            difendersi: t.difendersi, // +2 DIF scade all'inizio del turno del tuo prossimo turno → lo togliamo ora
          };
        }
        return t;
      });
      // Rimuovi il bonus "Difendersi" se questo token lo aveva attivo l'ultima volta
      tokens = tokens.map(t => t.id === nextToken.id && t.difendersi ? { ...t, difendersi: false, dif: t.dif - 2 } : t);

      const newLog = [
        { msg: `▶ Turno di ${nextToken.nome}${newRound !== s.round ? ` · Round ${newRound}` : ""}`, type:"info", time:new Date().toLocaleTimeString("it-IT",{hour:"2-digit",minute:"2-digit"}) },
        ...(s.log || []).slice(0, 99),
      ];
      return { ...s, tokens, currentTokenId: nextToken.id, round: newRound, log: newLog };
    });
    // Applica effetti condizioni all'inizio del prossimo turno
    setTimeout(() => {
      setState(s => {
        const nextT = s.tokens.find(t => t.id === s.currentTokenId);
        if (nextT) applyTurnStartEffects(nextT.id);
        return s;
      });
    }, 50);
  };

  const resetBattle = () => {
    if (!confirm("Resettare completamente la battaglia? Tutti i token saranno rimossi.")) return;
    setState({ tokens: [], round: 1, currentTokenId: null, mapBg: state.mapBg, log: [] });
  };

  // Applica danno/cura al token con id dato
  const applyToToken = (tokenId, action, value) => {
    const t = state.tokens.find(x => x.id === tokenId);
    if (!t) return;
    if (action === "danno") {
      const newHp = Math.max(0, t.hp_curr - Math.abs(value));
      const dead = newHp === 0;
      updateToken(t.id, { hp_curr: newHp, dead });
      addLog(`${t.nome} subisce ${Math.abs(value)} danni → ${newHp}/${t.hp_max}${dead?" · K.O.!":""}`, "danno");
    } else if (action === "cura") {
      const newHp = Math.min(t.hp_max, t.hp_curr + Math.abs(value));
      updateToken(t.id, { hp_curr: newHp, dead: newHp === 0 });
      addLog(`${t.nome} recupera ${Math.abs(value)} HP → ${newHp}/${t.hp_max}`, "cura");
    } else if (action === "fl-cost") {
      const newFl = Math.max(0, t.fl_curr - Math.abs(value));
      updateToken(t.id, { fl_curr: newFl });
      addLog(`${t.nome} spende ${Math.abs(value)} FL`, "skill");
    } else if (action === "revive") {
      updateToken(t.id, { hp_curr: 1, dead: false });
      addLog(`${t.nome} torna in piedi (1 HP)`, "cura");
    }

    // Sync scheda
    if (t.source === "scheda" && t.schedaId) {
      try {
        const raw = localStorage.getItem("arcadia_schede_v1");
        const schede = raw ? JSON.parse(raw) : [];
        const idx = schede.findIndex(s => String(s.id) === String(t.schedaId));
        if (idx >= 0) {
          const newHp =
            action==="danno" ? Math.max(0, t.hp_curr - Math.abs(value)) :
            action==="cura" ? Math.min(t.hp_max, t.hp_curr + Math.abs(value)) :
            action==="revive" ? 1 : t.hp_curr;
          const newFl = action==="fl-cost" ? Math.max(0, t.fl_curr - Math.abs(value)) : t.fl_curr;
          schede[idx] = { ...schede[idx], hp_curr: newHp, fl_curr: newFl };
          localStorage.setItem("arcadia_schede_v1", JSON.stringify(schede));
        }
      } catch (e) { console.error("sync scheda err:", e); }
    }
  };

  const toggleConditionOn = (tokenId, cond) => {
    const t = state.tokens.find(x => x.id === tokenId);
    if (!t) return;
    const cur = t.condizioni || [];
    const newCond = cur.includes(cond) ? cur.filter(c => c !== cond) : [...cur, cond];
    updateToken(t.id, { condizioni: newCond });
    addLog(`${t.nome}: ${cur.includes(cond)?"rimossa":"applicata"} condizione ${cond}`, "skill");
  };

  // ═══════════════════════════════════════════════════════
  // SISTEMA DI ATTACCO — Regole core Chaos System v7 cap. 6.4
  // ═══════════════════════════════════════════════════════
  // Helper: modificatore caratteristica (v-10)/2 arrotondato per difetto
  const modStat = (v) => Math.floor(((v ?? 10) - 10) / 2);
  // Helper: bonus Rank
  const bonusRank = (rank) => RANK_BDIF[rank] || 0;
  // Helper: tira dado danno tipo "1d8+2" o "2d6"
  const rollDado = (spec) => {
    if (!spec) return 0;
    const m = spec.match(/^(\d+)d(\d+)(?:\+(\d+))?$/i);
    if (!m) return Math.floor(Math.random()*6)+1;
    const n = parseInt(m[1]), faces = parseInt(m[2]), plus = parseInt(m[3]||0);
    let total = plus;
    for (let i = 0; i < n; i++) total += Math.floor(Math.random()*faces) + 1;
    return total;
  };
  // Vantaggio/Svantaggio: tira 2d20 e mantiene max/min
  const rollD20Adv = (adv) => {
    const a = Math.floor(Math.random()*20)+1, b = Math.floor(Math.random()*20)+1;
    if (adv === "vantaggio") return { value: Math.max(a,b), rolls:[a,b], adv:"vantaggio" };
    if (adv === "svantaggio") return { value: Math.min(a,b), rolls:[a,b], adv:"svantaggio" };
    return { value: a, rolls:[a], adv:null };
  };
  // Calcola Vantaggio/Svantaggio in base a condizioni
  const getAdvantage = (attaccante, difensore) => {
    const condAtt = attaccante.condizioni || [];
    const condDef = difensore.condizioni || [];
    let vantaggi = 0, svantaggi = 0;
    // Svantaggi attaccante
    if (condAtt.includes("Spaventato")) svantaggi++;
    if (condAtt.includes("Avvelenato")) svantaggi++;  // gestito separatamente come -2
    // Vantaggi vs bersaglio
    if (condDef.includes("Paralizzato")) vantaggi++;
    if (condDef.includes("Addormentato")) vantaggi++;
    if (condDef.includes("Immobilizzato")) vantaggi++;
    if (vantaggi > 0 && svantaggi > 0) return null; // annullamento
    if (vantaggi > 0) return "vantaggio";
    if (svantaggi > 0) return "svantaggio";
    return null;
  };
  // Penalità da condizioni al tiro
  const penalitaDaCondizioni = (t) => {
    let pen = 0;
    const cond = t.condizioni || [];
    if (cond.includes("Avvelenato")) pen -= 2;
    if (cond.includes("Esausto")) pen -= 2;
    return pen;
  };

  // ═══════════════════════════════════════════════════════
  // PARSER SKILL — estrae info meccaniche dal testo
  // ═══════════════════════════════════════════════════════
  // Una skill ha: { nome, costo, desc }. Il parser tenta di inferire:
  // - flCost: costo in Flusso (es. "2" → 2, "1+✦" → 1 + scintilla)
  // - actionType: "principale" | "bonus" | "reazione" | "passiva"
  // - attackStat: se è un attacco, quale stat (FOR/AGI/INT/PER)
  // - damageDice: es. "2d8+2"
  // - healDice: se cura
  // - targetType: "single" | "area" | "self" | "ally"
  // - appliedConditions: lista di condizioni applicate sul bersaglio
  // - duration: turni
  // - isAOE: bool
  const CONDITION_KEYWORDS = {
    "Spaventato":["Spaventato","Spaventata","Terrore","Paura"],
    "Stordito":["Stordito","Stordita","Stun"],
    "Silenziato":["Silenziato","Silenziata","silenzio"],
    "Sanguinante":["Sanguinante","Sanguinamento"],
    "Rallentato":["Rallentato","Rallentata","Rallentamento"],
    "Addormentato":["Addormentato","Dormiente","Sonno"],
    "Paralizzato":["Paralizzato","Paralizzata","Paralisi"],
    "Immobilizzato":["Immobilizzato","Immobilizzata","Imprigionato"],
    "Avvelenato":["Avvelenato","Avvelenata","Veleno"],
    "Bruciante":["Bruciante","Fuoco","Incendiato"],
    "Esausto":["Esausto","Esaurita","Esausti"],
    "Corrotto":["Corrotto","Corruzione"],
    "Benedetto":["Benedetto","Benedizione","Blessed"],
    "Concentrato":["Concentrato","Concentrazione"],
  };

  const parseSkill = (skill) => {
    if (!skill) return null;
    const nome = skill.nome || "";
    const costo = String(skill.costo || "");
    const desc = skill.desc || "";
    const full = nome + " " + desc;

    // Costo Flusso
    const flMatch = costo.match(/(\d+)/);
    const flCost = flMatch ? parseInt(flMatch[1]) : 0;
    const needsScintilla = /✦|Scintilla/i.test(costo);

    // Tipo azione (default: principale)
    let actionType = "principale";
    if (/A\.Bonus|Azione Bonus|a\.bonus/i.test(desc)) actionType = "bonus";
    else if (/Reazione|Reaction/i.test(desc)) actionType = "reazione";
    else if (/Passivo|Passiva|Passive/i.test(desc)) actionType = "passiva";

    // Stat attacco
    let attackStat = null;
    if (/Attacco FOR/i.test(desc)) attackStat = "FOR";
    else if (/Attacco AGI|Att AGI/i.test(desc)) attackStat = "AGI";
    else if (/Attacco INT|Att INT/i.test(desc)) attackStat = "INT";
    else if (/Attacco PER|Att PER/i.test(desc)) attackStat = "PER";
    else if (/Attacco CAR|Att CAR/i.test(desc)) attackStat = "CAR";

    // Dado danno (primo pattern NdN+N)
    const damageDiceMatch = desc.match(/Danno[:\s]*(\d+d\d+(?:\+\d+)?)/i) ||
                            desc.match(/(\d+d\d+(?:\+\d+)?)\s*(?:danni|danno)/i) ||
                            desc.match(/(\d+d\d+(?:\+\d+)?)/);
    const damageDice = damageDiceMatch ? damageDiceMatch[1] : null;

    // Dado cura
    const healMatch = desc.match(/(?:Cura|recupera(?:no)?|ripristina)[:\s]*(\d+d\d+(?:\+\d+)?|\d+)\s*HP/i);
    const healDice = healMatch ? healMatch[1] : null;

    // Area
    const isAOE = /TUTTI|area|raggio|cono|entro\s+\d+m/i.test(desc);

    // Target type
    let targetType = "single";
    if (isAOE) targetType = "area";
    else if (/te stesso|su di te|alleato/i.test(desc)) targetType = "ally";
    else if (/su sé|su di te/i.test(desc)) targetType = "self";

    // Condizioni applicate
    const appliedConditions = [];
    for (const [cond, keywords] of Object.entries(CONDITION_KEYWORDS)) {
      for (const kw of keywords) {
        if (new RegExp("\\b"+kw+"\\b","i").test(desc)) {
          appliedConditions.push(cond);
          break;
        }
      }
    }

    // Durata in turni
    const durMatch = desc.match(/(\d+)\s*(?:t\.|turni|turno)/i) || desc.match(/per\s+(\d+)\s*turni/i);
    const duration = durMatch ? parseInt(durMatch[1]) : null;

    return {
      nome, costo, desc, flCost, needsScintilla, actionType,
      attackStat, damageDice, healDice, isAOE, targetType,
      appliedConditions, duration,
    };
  };

  // ═══════════════════════════════════════════════════════
  // USA SKILL — applica effetti della skill
  // ═══════════════════════════════════════════════════════
  const useSkill = (casterId, skill, targetId) => {
    if (!skill) return;
    const parsed = parseSkill(skill);
    if (!parsed) return;

    setState(s => {
      const caster = s.tokens.find(t => t.id === casterId);
      if (!caster || caster.dead) return s;

      // Condizioni bloccanti caster
      const condCaster = caster.condizioni || [];
      if (parsed.actionType !== "passiva" && (condCaster.includes("Stordito") || condCaster.includes("Paralizzato") || condCaster.includes("Addormentato"))) {
        const newLog = { msg: `${caster.nome} non può usare ${parsed.nome}: è ${condCaster.find(c => ["Stordito","Paralizzato","Addormentato"].includes(c))}`, type:"info", time:new Date().toLocaleTimeString("it-IT",{hour:"2-digit",minute:"2-digit"}) };
        return { ...s, log: [newLog, ...(s.log||[]).slice(0,99)] };
      }

      // Verifica costo Flusso
      if (parsed.flCost > 0 && caster.fl_curr < parsed.flCost) {
        const newLog = { msg: `${caster.nome} non ha abbastanza Flusso per ${parsed.nome} (richiede ${parsed.flCost}, ha ${caster.fl_curr})`, type:"info", time:new Date().toLocaleTimeString("it-IT",{hour:"2-digit",minute:"2-digit"}) };
        return { ...s, log: [newLog, ...(s.log||[]).slice(0,99)] };
      }

      // Blocca se l'azione richiesta è già stata usata questo turno
      if (parsed.actionType === "principale" && caster.azionePrincipaleUsata) {
        const newLog = { msg: `${caster.nome} ha già usato l'Azione Principale in questo turno`, type:"info", time:new Date().toLocaleTimeString("it-IT",{hour:"2-digit",minute:"2-digit"}) };
        return { ...s, log: [newLog, ...(s.log||[]).slice(0,99)] };
      }
      if (parsed.actionType === "bonus" && caster.azioneBonusUsata) {
        const newLog = { msg: `${caster.nome} ha già usato l'Azione Bonus in questo turno`, type:"info", time:new Date().toLocaleTimeString("it-IT",{hour:"2-digit",minute:"2-digit"}) };
        return { ...s, log: [newLog, ...(s.log||[]).slice(0,99)] };
      }
      if (parsed.actionType === "reazione" && caster.reactionUsed) {
        const newLog = { msg: `${caster.nome} ha già usato la Reazione in questo round`, type:"info", time:new Date().toLocaleTimeString("it-IT",{hour:"2-digit",minute:"2-digit"}) };
        return { ...s, log: [newLog, ...(s.log||[]).slice(0,99)] };
      }

      const target = targetId ? s.tokens.find(t => t.id === targetId) : caster;
      if (parsed.targetType === "single" && !target) return s;

      let logLines = [];
      logLines.push(`✨ ${caster.nome} usa ${parsed.nome}${parsed.flCost>0?` (−${parsed.flCost} FL)`:""}`);

      // Tokens modificati (partiamo da tutti i token). Paga FL + marca azione usata sul caster
      let newTokens = s.tokens.map(t => {
        if (t.id === caster.id) {
          const patch = { fl_curr: Math.max(0, t.fl_curr - parsed.flCost) };
          if (parsed.actionType === "principale") patch.azionePrincipaleUsata = true;
          else if (parsed.actionType === "bonus") patch.azioneBonusUsata = true;
          else if (parsed.actionType === "reazione") patch.reactionUsed = true;
          return { ...t, ...patch };
        }
        return t;
      });

      // Se è un attacco (ha attackStat e damageDice)
      if (parsed.attackStat && parsed.damageDice && target && target.id !== caster.id) {
        const roll = rollD20Adv(getAdvantage(caster, target));
        const mod = modStat((caster.stats||{})[parsed.attackStat]);
        const br = bonusRank(caster.rank);
        const penCast = penalitaDaCondizioni(caster);
        const attTotal = roll.value + mod + br + penCast;
        const dif = target.dif || 10;
        const isCrit = roll.value === 20;
        const isFumble = roll.value === 1;
        const hit = !isFumble && (isCrit || attTotal >= dif);

        const advText = roll.adv ? ` [${roll.adv==="vantaggio"?"VAN":"SVA"} ${roll.rolls.join(",")}]` : "";
        logLines.push(`🎲 Tiro ${parsed.attackStat}: d20=${roll.value}${advText} ${mod>=0?"+":""}${mod}${br>0?`+${br}`:""} = ${attTotal} vs DIF ${dif}`);

        if (isFumble) {
          logLines.push(`💀 FUMBLE`);
        } else if (!hit) {
          logLines.push(`✗ MISS`);
        } else {
          let dmg = rollDado(parsed.damageDice);
          if (isCrit) { dmg += rollDado(parsed.damageDice); logLines.push(`💥 CRITICO x2`); }
          logLines.push(`✓ HIT — danno: ${dmg}`);
          const newHp = Math.max(0, target.hp_curr - dmg);
          const dead = newHp === 0;
          logLines.push(`💔 ${target.nome}: ${target.hp_curr} → ${newHp} HP${dead?" · K.O.!":""}`);

          // Applica condizioni estratte (con durata se la skill la specifica)
          let appliedList = [];
          const newTargetCond = [...(target.condizioni || [])];
          const newTargetCondDur = { ...(target.condizioniDur || {}) };
          for (const c of parsed.appliedConditions) {
            if (!newTargetCond.includes(c)) {
              newTargetCond.push(c);
              appliedList.push(c);
            }
            if (parsed.duration) newTargetCondDur[c] = parsed.duration;
          }
          if (appliedList.length) logLines.push(`⚡ Applicato: ${appliedList.join(", ")}${parsed.duration?` (${parsed.duration}t)`:""}`);

          newTokens = newTokens.map(t =>
            t.id === target.id ? { ...t, hp_curr: newHp, dead, condizioni: newTargetCond, condizioniDur: newTargetCondDur } : t
          );

          // Sync scheda
          if (target.source === "scheda" && target.schedaId) {
            try {
              const raw = localStorage.getItem("arcadia_schede_v1");
              const schede = raw ? JSON.parse(raw) : [];
              const idx = schede.findIndex(sc => String(sc.id) === String(target.schedaId));
              if (idx >= 0) { schede[idx].hp_curr = newHp; localStorage.setItem("arcadia_schede_v1", JSON.stringify(schede)); }
            } catch {}
          }
        }
      }
      // Se è una cura
      else if (parsed.healDice) {
        const healAmount = parsed.healDice.includes("d") ? rollDado(parsed.healDice) : parseInt(parsed.healDice);
        const healTarget = parsed.targetType === "self" ? caster : (target || caster);
        const newHp = Math.min(healTarget.hp_max, healTarget.hp_curr + healAmount);
        logLines.push(`💚 ${healTarget.nome}: +${healAmount} HP → ${newHp}/${healTarget.hp_max}`);
        newTokens = newTokens.map(t =>
          t.id === healTarget.id ? { ...t, hp_curr: newHp, dead: newHp === 0 } : t
        );
        // Sync scheda
        if (healTarget.source === "scheda" && healTarget.schedaId) {
          try {
            const raw = localStorage.getItem("arcadia_schede_v1");
            const schede = raw ? JSON.parse(raw) : [];
            const idx = schede.findIndex(sc => String(sc.id) === String(healTarget.schedaId));
            if (idx >= 0) { schede[idx].hp_curr = newHp; localStorage.setItem("arcadia_schede_v1", JSON.stringify(schede)); }
          } catch {}
        }
      }
      // Se è solo condizione applicata (no attacco, no cura)
      else if (parsed.appliedConditions.length > 0 && target && target.id !== caster.id) {
        const newCond = [...(target.condizioni||[])];
        const newCondDur = { ...(target.condizioniDur||{}) };
        let appliedList = [];
        for (const c of parsed.appliedConditions) {
          if (!newCond.includes(c)) {
            newCond.push(c);
            appliedList.push(c);
          }
          // Imposta/aggiorna durata se la skill la specifica
          if (parsed.duration) {
            newCondDur[c] = parsed.duration;
          }
        }
        if (appliedList.length) {
          logLines.push(`⚡ ${target.nome}: applicato ${appliedList.join(", ")}${parsed.duration?` per ${parsed.duration}t`:""}`);
          newTokens = newTokens.map(t => t.id === target.id ? { ...t, condizioni: newCond, condizioniDur: newCondDur } : t);
        }
      }
      // Altrimenti è un effetto non automatizzato: logga solo
      else {
        logLines.push(`(effetto non automatizzato — applica manualmente secondo la descrizione della skill)`);
      }

      // Sync caster (costo Flusso)
      if (caster.source === "scheda" && caster.schedaId && parsed.flCost > 0) {
        try {
          const raw = localStorage.getItem("arcadia_schede_v1");
          const schede = raw ? JSON.parse(raw) : [];
          const idx = schede.findIndex(sc => String(sc.id) === String(caster.schedaId));
          if (idx >= 0) {
            schede[idx].fl_curr = Math.max(0, caster.fl_curr - parsed.flCost);
            localStorage.setItem("arcadia_schede_v1", JSON.stringify(schede));
          }
        } catch {}
      }

      const logEntries = logLines.map(msg => ({ msg, type:"skill", time:new Date().toLocaleTimeString("it-IT",{hour:"2-digit",minute:"2-digit"}) }));
      return { ...s, tokens: newTokens, log: [...logEntries.reverse(), ...(s.log||[]).slice(0, 99 - logEntries.length)] };
    });
  };

  // Esegui attacco: attaccante → difensore con stat scelta
  const executeAttack = (attId, defId, stat, opts = {}) => {
    // Protezione: non si può attaccare se stessi
    if (attId === defId) {
      addLog(`Auto-attacco bloccato — seleziona un bersaglio diverso`, "info");
      return;
    }
    setState(s => {
      const att = s.tokens.find(t => t.id === attId);
      const def = s.tokens.find(t => t.id === defId);
      if (!att || !def) return s;
      if (att.id === def.id) return s; // doppio controllo
      if (att.dead || def.dead) return s;

      // Condizioni bloccanti per l'attaccante
      const condAtt = att.condizioni || [];
      if (condAtt.includes("Stordito") || condAtt.includes("Paralizzato") || condAtt.includes("Addormentato")) {
        const newLog = { msg: `${att.nome} non può attaccare: ${condAtt.find(c => ["Stordito","Paralizzato","Addormentato"].includes(c))}`, type:"danno", time:new Date().toLocaleTimeString("it-IT",{hour:"2-digit",minute:"2-digit"}) };
        return { ...s, log: [newLog, ...(s.log||[]).slice(0,99)] };
      }

      // Attaccare è un'Azione Principale: se già usata, blocca
      if (att.azionePrincipaleUsata) {
        const newLog = { msg: `${att.nome} ha già usato l'Azione Principale in questo turno`, type:"info", time:new Date().toLocaleTimeString("it-IT",{hour:"2-digit",minute:"2-digit"}) };
        return { ...s, log: [newLog, ...(s.log||[]).slice(0,99)] };
      }

      // Determina vantaggio/svantaggio
      const adv = getAdvantage(att, def);
      // Tira 1d20
      const roll = rollD20Adv(adv);
      const mod = modStat((att.stats||{})[stat]);
      const brAtt = bonusRank(att.rank);
      const penAtt = penalitaDaCondizioni(att);
      const attTotal = roll.value + mod + brAtt + penAtt;
      const difesa = def.dif || 10;

      // Critico / Fumble
      const isCrit = roll.value === 20;
      const isFumble = roll.value === 1;
      const hit = !isFumble && (isCrit || attTotal >= difesa);

      let logLines = [];
      const advText = adv ? ` [${adv==="vantaggio"?"VAN":"SVA"} ${roll.rolls.join(",")}]` : "";
      const modText = `${mod>=0?"+":""}${mod}`;
      const brText = brAtt>0 ? `+${brAtt}` : "";
      const penText = penAtt !== 0 ? `${penAtt}` : "";
      logLines.push(`⚔️ ${att.nome} attacca ${def.nome} (${stat}): d20=${roll.value}${advText} ${modText}${brText}${penText} = ${attTotal} vs DIF ${difesa}`);

      if (isFumble) {
        logLines.push(`💀 FUMBLE (1 nat) — ${att.nome} manca e il GM introduce un Evento Avverso`);
      } else if (!hit) {
        // MISS: ma se manca di 1-3, Pressione non si azzera
        const missBy = difesa - attTotal;
        logLines.push(`✗ MISS — manca di ${missBy}${missBy<=3?" (Pressione conserva)":""}`);
      } else {
        // HIT: calcola danno e se il difensore può tentare Schivata Attiva,
        // salva il risultato "pendente" e aspetta la decisione del difensore
        let dmg = rollDado(att.dado_danno || "1d6") + mod;
        if (isCrit) {
          const crit2 = rollDado(att.dado_danno || "1d6") + mod;
          dmg = dmg + crit2;
        }

        // Calcola pressione (non la applichiamo ancora se danno pendente)
        let pressione = att.pressione || { targetId: null, gradino: 0 };
        if (pressione.targetId === def.id) {
          pressione = { ...pressione, gradino: Math.min(4, pressione.gradino + 1) };
        } else {
          pressione = { targetId: def.id, gradino: 1 };
        }
        if (pressione.gradino === 2) {
          const extra = rollDado("1d4");
          dmg += extra;
        } else if (pressione.gradino === 3) {
          const extra = rollDado("2d4");
          dmg += extra;
        } else if (pressione.gradino >= 4) {
          dmg = dmg * 2;
        }

        logLines.push(`${isCrit?"💥 CRITICO (20 nat) x2":"✓ HIT"} — danno potenziale: ${dmg}`);
        if (pressione.gradino > 1) {
          logLines.push(`📈 Pressione Gradino ${pressione.gradino} ${["","","(Spinta +1d4)","(Rottura +2d4)","(Valanga x2)"][pressione.gradino]}`);
        }

        // Il difensore può tentare Schivata Attiva? Solo se vivo, ha FL≥1, non ha Rallentato
        const condDef = def.condizioni || [];
        const canDodge = !def.dead && (def.fl_curr||0) >= 1 && !condDef.includes("Rallentato") && !def.reactionUsed;

        if (canDodge) {
          // Metti in pausa: apri prompt di schivata
          setTimeout(() => setPendingDodge({
            attId, defId, attTotal, damage: dmg, isCrit, pressione,
            logLinesPending: logLines,
          }), 0);
          // Aggiorna log. Marca Azione Principale usata sull'attaccante (il danno si applica dopo la decisione del difensore)
          const logEntries = logLines.concat([`⏸️ ${def.nome} può tentare Schivata Attiva (1 FL)`]).map(msg => ({ msg, type:"danno", time:new Date().toLocaleTimeString("it-IT",{hour:"2-digit",minute:"2-digit"}) }));
          const markedTokens = s.tokens.map(t => t.id === att.id ? { ...t, azionePrincipaleUsata: true } : t);
          return { ...s, tokens: markedTokens, log: [...logEntries.reverse(), ...(s.log||[]).slice(0, 99 - logEntries.length)] };
        }

        // Applica danno normalmente
        const newHp = Math.max(0, def.hp_curr - dmg);
        const dead = newHp === 0;
        logLines.push(`💔 ${def.nome}: ${def.hp_curr} → ${newHp} HP${dead?" · K.O.!":""}`);

        const newTokens = s.tokens.map(t => {
          if (t.id === def.id) return { ...t, hp_curr: newHp, dead };
          if (t.id === att.id) return { ...t, pressione, azionePrincipaleUsata: true };
          return t;
        });
        const logEntries = logLines.map(msg => ({ msg, type:"danno", time:new Date().toLocaleTimeString("it-IT",{hour:"2-digit",minute:"2-digit"}) }));
        // Sync scheda
        if (def.source === "scheda" && def.schedaId) {
          try {
            const raw = localStorage.getItem("arcadia_schede_v1");
            const schede = raw ? JSON.parse(raw) : [];
            const idx = schede.findIndex(sc => String(sc.id) === String(def.schedaId));
            if (idx >= 0) { schede[idx].hp_curr = newHp; localStorage.setItem("arcadia_schede_v1", JSON.stringify(schede)); }
          } catch {}
        }
        return { ...s, tokens: newTokens, log: [...logEntries.reverse(), ...(s.log||[]).slice(0, 99 - logEntries.length)] };
      }

      // MISS path: aggiorna pressione (mancato di 1-3 la mantiene)
      const missBy = difesa - attTotal;
      let pressione = att.pressione || { targetId: null, gradino: 0 };
      if (!isFumble && missBy > 0 && missBy <= 3 && pressione.targetId === def.id) {
        // Conserva
      } else {
        pressione = { targetId: null, gradino: 0 };
      }
      const newTokens = s.tokens.map(t => t.id === att.id ? { ...t, pressione, azionePrincipaleUsata: true } : t);
      const logEntries = logLines.map(msg => ({ msg, type:"danno", time:new Date().toLocaleTimeString("it-IT",{hour:"2-digit",minute:"2-digit"}) }));
      return { ...s, tokens: newTokens, log: [...logEntries.reverse(), ...(s.log||[]).slice(0, 99 - logEntries.length)] };
    });
  };

  // ═══ SCHIVATA ATTIVA (Reazione universale, cap. 6.7) ═══
  // Il difensore spende 1 FL e tira AGI DC = risultato attaccante
  // Successo → schiva (0 danni). Fallimento → subisce danno pieno.
  const resolveDodge = (tryDodge) => {
    if (!pendingDodge) return;
    const { attId, defId, attTotal, damage, pressione, isCrit } = pendingDodge;
    setState(s => {
      const att = s.tokens.find(t => t.id === attId);
      const def = s.tokens.find(t => t.id === defId);
      if (!att || !def) return s;

      let logLines = [];
      let finalDamage = damage;
      let dodgeSuccess = false;
      let flCost = 0;

      if (tryDodge) {
        flCost = 1;
        const roll = Math.floor(Math.random()*20) + 1;
        const modAgi = modStat((def.stats||{}).AGI);
        const brDef = bonusRank(def.rank);
        const penDef = penalitaDaCondizioni(def);
        const dodgeTotal = roll + modAgi + brDef + penDef;
        const dc = attTotal;
        dodgeSuccess = roll !== 1 && (roll === 20 || dodgeTotal >= dc);
        const modText = `${modAgi>=0?"+":""}${modAgi}`;
        const brText = brDef>0 ? `+${brDef}` : "";
        logLines.push(`🛡️ ${def.nome} tenta Schivata (−1 FL): d20=${roll} ${modText}${brText} = ${dodgeTotal} vs DC ${dc}`);
        if (dodgeSuccess) {
          logLines.push(`✓ SCHIVATO — 0 danni`);
          finalDamage = 0;
        } else {
          logLines.push(`✗ Schivata fallita`);
        }
      }

      // Applica danno (0 se schivata riuscita)
      const newHp = Math.max(0, def.hp_curr - finalDamage);
      const newFl = Math.max(0, def.fl_curr - flCost);
      const dead = newHp === 0;
      if (finalDamage > 0) {
        logLines.push(`💔 ${def.nome}: ${def.hp_curr} → ${newHp} HP${dead?" · K.O.!":""}`);
      }

      const newTokens = s.tokens.map(t => {
        if (t.id === def.id) return { ...t, hp_curr: newHp, fl_curr: newFl, dead, reactionUsed: tryDodge ? true : t.reactionUsed };
        if (t.id === att.id) return { ...t, pressione };
        return t;
      });
      const logEntries = logLines.map(msg => ({ msg, type: dodgeSuccess?"skill":"danno", time:new Date().toLocaleTimeString("it-IT",{hour:"2-digit",minute:"2-digit"}) }));

      // Sync scheda
      if (def.source === "scheda" && def.schedaId) {
        try {
          const raw = localStorage.getItem("arcadia_schede_v1");
          const schede = raw ? JSON.parse(raw) : [];
          const idx = schede.findIndex(sc => String(sc.id) === String(def.schedaId));
          if (idx >= 0) { schede[idx].hp_curr = newHp; schede[idx].fl_curr = newFl; localStorage.setItem("arcadia_schede_v1", JSON.stringify(schede)); }
        } catch {}
      }
      return { ...s, tokens: newTokens, log: [...logEntries.reverse(), ...(s.log||[]).slice(0, 99 - logEntries.length)] };
    });
    setPendingDodge(null);
  };

  // Azione "Difenditi": +2 Difesa fino all'inizio del prossimo turno del token. Consuma Azione Principale.
  const azioneDifenditi = (tokenId) => {
    setState(s => {
      const t = s.tokens.find(x => x.id === tokenId);
      if (!t || t.dead) return s;
      if (t.azionePrincipaleUsata) {
        const newLog = { msg: `${t.nome} ha già usato l'Azione Principale`, type:"info", time:new Date().toLocaleTimeString("it-IT",{hour:"2-digit",minute:"2-digit"}) };
        return { ...s, log: [newLog, ...(s.log||[]).slice(0,99)] };
      }
      if (t.difendersi) {
        const newLog = { msg: `${t.nome} sta già difendendosi`, type:"info", time:new Date().toLocaleTimeString("it-IT",{hour:"2-digit",minute:"2-digit"}) };
        return { ...s, log: [newLog, ...(s.log||[]).slice(0,99)] };
      }
      const newTokens = s.tokens.map(x => x.id === tokenId ? {
        ...x,
        difendersi: true,
        dif: (x.dif || 10) + 2,
        azionePrincipaleUsata: true,
      } : x);
      const newLog = { msg: `🛡️ ${t.nome} si difende: +2 DIF fino al prossimo turno`, type:"info", time:new Date().toLocaleTimeString("it-IT",{hour:"2-digit",minute:"2-digit"}) };
      return { ...s, tokens: newTokens, log: [newLog, ...(s.log||[]).slice(0,99)] };
    });
  };

  // Applica effetti a inizio turno del token corrente (danni da condizioni)
  const applyTurnStartEffects = (tokenId) => {
    setState(s => {
      const t = s.tokens.find(x => x.id === tokenId);
      if (!t || t.dead) return s;
      const cond = t.condizioni || [];
      const condDur = { ...(t.condizioniDur || {}) };
      let hpChange = 0;
      let logs = [];

      // Effetti danno per condizione (Bruciante)
      if (cond.includes("Bruciante")) {
        const d = rollDado("1d4");
        hpChange -= d;
        logs.push(`🔥 ${t.nome} Bruciante: -${d} HP`);
      }

      // Scala durate: -1 a tutte le condizioni con durata, rimuovi quelle scadute
      let condRemoved = [];
      const newCond = [];
      for (const c of cond) {
        if (condDur[c] !== undefined) {
          condDur[c] -= 1;
          if (condDur[c] <= 0) {
            condRemoved.push(c);
            delete condDur[c];
          } else {
            newCond.push(c);
          }
        } else {
          // Condizione senza durata (permanente / GM-managed): non scala
          newCond.push(c);
        }
      }
      if (condRemoved.length) {
        logs.push(`⏱️ ${t.nome}: scaduta ${condRemoved.join(", ")}`);
      }

      if (hpChange === 0 && condRemoved.length === 0) return s;
      const newHp = Math.max(0, t.hp_curr + hpChange);
      const dead = newHp === 0;
      const newTokens = s.tokens.map(x => x.id === tokenId ? {
        ...x,
        hp_curr: newHp,
        dead,
        condizioni: newCond,
        condizioniDur: condDur,
      } : x);
      const newLog = logs.map(msg => ({ msg, type:"info", time:new Date().toLocaleTimeString("it-IT",{hour:"2-digit",minute:"2-digit"}) }));
      return { ...s, tokens: newTokens, log: [...newLog.reverse(), ...(s.log||[]).slice(0, 99)] };
    });
  };

  // Drag & drop token sulla griglia con vincolo di Velocità
  // Regole: Azione Principale = Muoviti fino a Velocità metri
  //         Azione Bonus      = Muoviti altra metà Velocità (arrotondata per difetto)
  //         Totale max = Velocità + Vel/2
  // Distanza griglia = Chebyshev (max di |dx|,|dy|) = 1 cella = 1m
  const dragStartRef = useRef(null); // { tokenId, x0, y0 }
  const onTokenMouseDown = (e, t) => {
    if (e.button !== 0) return;
    if (t.dead) return;
    // Blocca drag se il token non è in turno (o se non c'è iniziativa attiva, permetti libero posizionamento)
    if (state.currentTokenId && t.id !== state.currentTokenId) {
      addLog(`${t.nome} non è in turno — solo ${currentToken?.nome || "il token in turno"} può muoversi`, "info");
      return;
    }
    // Blocca se ha già usato sia azione principale che bonus (=0 movimento residuo)
    const vel = t.velocita || 6;
    const budget = vel + Math.floor(vel/2);
    if ((t.movimentoUsato||0) >= budget) {
      addLog(`${t.nome} ha esaurito il movimento (${t.movimentoUsato}/${budget}m)`, "info");
      return;
    }
    const rect = gridRef.current.getBoundingClientRect();
    setDragId(t.id);
    dragStartRef.current = { tokenId: t.id, x0: t.x, y0: t.y };
    setDragOffset({
      x: e.clientX - rect.left - t.x*CELL_SIZE,
      y: e.clientY - rect.top - t.y*CELL_SIZE,
    });
    e.preventDefault();
    e.stopPropagation();
  };

  const onGridMouseMove = (e) => {
    if (!dragId || !gridRef.current) return;
    const rect = gridRef.current.getBoundingClientRect();
    const nx = Math.max(0, Math.min(GRID_W - 1, Math.round((e.clientX - rect.left - dragOffset.x)/CELL_SIZE)));
    const ny = Math.max(0, Math.min(GRID_H - 1, Math.round((e.clientY - rect.top - dragOffset.y)/CELL_SIZE)));
    // Preview: aggiorno solo posizione, NO movimentoUsato (si aggiorna a drop)
    updateToken(dragId, { x: nx, y: ny });
  };

  const onGridMouseUp = () => {
    if (!dragId) return;
    const start = dragStartRef.current;
    if (!start || start.tokenId !== dragId) {
      setDragId(null);
      return;
    }
    // Calcola distanza Chebyshev e verifica vincolo Velocità
    setState(s => {
      const t = s.tokens.find(x => x.id === dragId);
      if (!t) return s;
      const dx = Math.abs(t.x - start.x0);
      const dy = Math.abs(t.y - start.y0);
      const dist = Math.max(dx, dy); // metri (= celle Chebyshev)
      if (dist === 0) return s; // non mosso
      const vel = t.velocita || 6;
      const usedBefore = t.movimentoUsato || 0;
      const baseLeft = Math.max(0, vel - usedBefore); // movimento libero residuo
      const extraLeft = t.azioneBonusUsata ? 0 : Math.floor(vel/2); // Movimento breve (Azione Bonus)
      const budgetLeft = baseLeft + extraLeft;

      if (dist > budgetLeft) {
        // Ripristina posizione iniziale
        const newTokens = s.tokens.map(x => x.id === t.id ? { ...x, x: start.x0, y: start.y0 } : x);
        const newLog = { msg: `✗ ${t.nome}: ${dist}m > budget ${budgetLeft}m — movimento annullato`, type:"info", time:new Date().toLocaleTimeString("it-IT",{hour:"2-digit",minute:"2-digit"}) };
        return { ...s, tokens: newTokens, log: [newLog, ...(s.log||[]).slice(0,99)] };
      }

      // Movimento normale (fino a Velocità m) NON consuma Azione Principale né Bonus
      // (cap. 6.5: "Il personaggio può distribuire liberamente il proprio movimento").
      // Solo il movimento EXTRA oltre Velocità consuma Azione Bonus ("Movimento breve: metà Velocità").
      const newUsed = usedBefore + dist;
      let newBonus = t.azioneBonusUsata;
      if (newUsed > vel && !newBonus) {
        newBonus = true; // sforare Velocità → usi il Movimento breve come Azione Bonus
      }

      const newTokens = s.tokens.map(x => x.id === t.id ? {
        ...x,
        movimentoUsato: newUsed,
        azioneBonusUsata: newBonus,
      } : x);
      const newLog = { msg: `🏃 ${t.nome} si muove ${dist}m (totale ${newUsed}/${vel}${newUsed > vel ? ` + ${newUsed-vel}m bonus (Azione Bonus)` : "m"})`, type:"info", time:new Date().toLocaleTimeString("it-IT",{hour:"2-digit",minute:"2-digit"}) };
      return { ...s, tokens: newTokens, log: [newLog, ...(s.log||[]).slice(0,99)] };
    });
    dragStartRef.current = null;
    setDragId(null);
  };

  // Upload mappa
  const uploadMap = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = ev => update({ mapBg: ev.target.result });
    r.readAsDataURL(f);
    e.target.value = "";
  };

  const attacker = attackerId ? state.tokens.find(t => t.id === attackerId) : null;
  const actionTarget = actionTargetId ? state.tokens.find(t => t.id === actionTargetId) : null;
  const inspectToken = inspectId ? state.tokens.find(t => t.id === inspectId) : null;
  const currentToken = state.tokens.find(t => t.id === state.currentTokenId);
  const iniziativaOrdered = [...state.tokens].sort((a,b) => (b.iniziativa||0) - (a.iniziativa||0));

  return (
    <div className="anim-fade-in" onMouseUp={onGridMouseUp}>
      <div style={{ marginBottom:"1.5rem" }}>
        <div className="section-title">Campo di Battaglia</div>
        <div className="page-title">Mappa Tattica</div>
        <p className="page-subtitle">Trascina i token, targetta per applicare danni/cure/condizioni. HP/FL sincronizzati con le schede.</p>
      </div>

      {/* Controlli in alto */}
      <div style={{ display:"flex", gap:"0.5rem", marginBottom:"1rem", flexWrap:"wrap", alignItems:"center" }}>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAddPanel(true)}>+ Aggiungi Token</button>
        <button className="btn btn-gold btn-sm" onClick={rollIniziativa} disabled={!state.tokens.length}>🎲 Tira Iniziativa</button>
        <button className="btn btn-outline btn-sm" onClick={nextTurn} disabled={!state.tokens.length}>Prossimo Turno →</button>
        <label className="btn btn-outline btn-sm" style={{ cursor:"pointer" }}>
          🗺️ Carica Mappa
          <input ref={mapInputRef} type="file" accept="image/*" onChange={uploadMap} style={{ display:"none" }} />
        </label>
        {state.mapBg && <button className="btn btn-outline btn-sm" onClick={() => update({ mapBg: null })}>✕ Rimuovi Mappa</button>}
        <span style={{ flex:1 }} />
        <span style={{ fontSize:"0.8rem", color:"var(--text-dim)" }}>Round <strong style={{ color:"var(--gold)" }}>{state.round}</strong></span>
        {currentToken && <span style={{ fontSize:"0.8rem", color:"var(--purple-bright)" }}>Turno di <strong>{currentToken.nome}</strong></span>}
        <button className="btn btn-danger btn-sm" onClick={resetBattle}>🗑️ Reset</button>
      </div>

      {/* Banner TURNO ATTUALE prominente */}
      {currentToken && !currentToken.dead && (
        <div style={{
          display:"flex", alignItems:"center", gap:"1rem", flexWrap:"wrap",
          padding:"0.9rem 1.1rem", marginBottom:"1rem",
          background:"linear-gradient(90deg, rgba(140,110,255,0.15) 0%, rgba(140,110,255,0.03) 100%)",
          borderLeft:"4px solid var(--purple)",
          borderRadius:"0 6px 6px 0",
        }}>
          <div style={{
            width:48, height:48, borderRadius:"50%",
            background: currentToken.avatar ? `url(${currentToken.avatar}) center/cover` : currentToken.color,
            border:"3px solid var(--purple-bright)",
            boxShadow:"0 0 20px var(--purple)",
            animation:"pulse-ring 2s infinite",
            display:"flex", alignItems:"center", justifyContent:"center",
            color:"white", fontFamily:"'Cinzel',serif", fontWeight:700,
            flexShrink:0,
          }}>
            {!currentToken.avatar && currentToken.nome.slice(0,2).toUpperCase()}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:"0.68rem", color:"var(--purple-bright)", textTransform:"uppercase", letterSpacing:"0.14em", fontFamily:"'Cinzel',serif", fontWeight:700 }}>▶ Turno di · Round {state.round}</div>
            <div style={{ fontFamily:"'Cinzel Decorative',serif", fontSize:"1.3rem", fontWeight:700, color:"var(--text-bright)" }}>{currentToken.nome}</div>
            <div style={{ fontSize:"0.75rem", color:"var(--text-dim)", marginTop:"0.2rem" }}>
              {currentToken.hp_curr}/{currentToken.hp_max} HP · {currentToken.fl_curr||0}/{currentToken.fl_max||0} FL
              {currentToken.iniziativa !== null && currentToken.iniziativa !== undefined && ` · Iniziativa ${currentToken.iniziativa}`}
            </div>
            {/* Budget Movimento + Azioni */}
            {(() => {
              const vel = currentToken.velocita || 6;
              const used = currentToken.movimentoUsato || 0;
              const budget = vel + Math.floor(vel/2);
              const residuo = Math.max(0, budget - used);
              const pct = Math.min(100, (used / budget) * 100);
              return (
                <div style={{ marginTop:"0.4rem", display:"flex", flexWrap:"wrap", gap:"0.4rem", alignItems:"center" }}>
                  <div style={{ flex:"0 0 160px" }}>
                    <div style={{ fontSize:"0.65rem", color:"var(--text-dim)", marginBottom:"0.15rem" }}>
                      🏃 Movimento {used}/{vel}m {used>vel && `(+${used-vel} bonus)`}
                    </div>
                    <div style={{ height:5, background:"var(--panel)", borderRadius:3, overflow:"hidden" }}>
                      <div style={{
                        height:"100%",
                        width:`${pct}%`,
                        background: used <= vel ? "var(--green)" : "var(--gold)",
                        transition:"width 0.3s",
                      }}/>
                    </div>
                  </div>
                  <span style={{ fontSize:"0.65rem", color: currentToken.azionePrincipaleUsata ? "var(--red)" : "var(--green)", fontFamily:"'Cinzel',serif", fontWeight:700 }}>
                    {currentToken.azionePrincipaleUsata ? "✗" : "✓"} Principale
                  </span>
                  <span style={{ fontSize:"0.65rem", color: currentToken.azioneBonusUsata ? "var(--red)" : "var(--green)", fontFamily:"'Cinzel',serif", fontWeight:700 }}>
                    {currentToken.azioneBonusUsata ? "✗" : "✓"} Bonus
                  </span>
                  <span style={{ fontSize:"0.65rem", color: currentToken.reactionUsed ? "var(--red)" : "var(--green)", fontFamily:"'Cinzel',serif", fontWeight:700 }}>
                    {currentToken.reactionUsed ? "✗" : "✓"} Reazione
                  </span>
                  {currentToken.difendersi && <span style={{ fontSize:"0.65rem", color:"var(--flux)", fontFamily:"'Cinzel',serif", fontWeight:700 }}>🛡️ Difendersi</span>}
                </div>
              );
            })()}
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:"0.3rem", alignItems:"stretch" }}>
            <button className="btn btn-outline btn-sm" onClick={() => azioneDifenditi(currentToken.id)} disabled={currentToken.azionePrincipaleUsata || currentToken.difendersi} title="Azione Principale: +2 DIF fino al prossimo turno">
              🛡️ Difenditi
            </button>
            <button className="btn btn-primary" onClick={nextTurn} style={{ whiteSpace:"nowrap" }}>
              Fine Turno →
            </button>
          </div>
        </div>
      )}

      {/* Banner Attaccante selezionato */}
      {attacker && !attacker.dead && (
        <div style={{
          padding:"0.75rem 1rem", marginBottom:"1rem",
          background:"linear-gradient(135deg, rgba(255,77,109,0.12), rgba(140,110,255,0.05))",
          border:"2px solid var(--red)", borderRadius:6,
          display:"flex", justifyContent:"space-between", alignItems:"center", gap:"1rem", flexWrap:"wrap",
        }}>
          <div style={{ display:"flex", alignItems:"center", gap:"0.75rem" }}>
            <div style={{
              width:40, height:40, borderRadius:"50%",
              background: attacker.avatar ? `url(${attacker.avatar}) center/cover` : attacker.color,
              border:"2px solid var(--red)",
              boxShadow:"0 0 12px rgba(255,77,109,0.6)",
              display:"flex", alignItems:"center", justifyContent:"center",
              color:"white", fontFamily:"'Cinzel',serif", fontWeight:700, fontSize:"0.8rem",
              flexShrink:0,
            }}>
              {!attacker.avatar && attacker.nome.slice(0,2).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize:"0.65rem", color:"var(--red)", textTransform:"uppercase", letterSpacing:"0.14em", fontFamily:"'Cinzel',serif", fontWeight:700 }}>⚔️ Attaccante selezionato</div>
              <div style={{ fontFamily:"'Cinzel',serif", fontWeight:700, color:"var(--text-bright)", fontSize:"0.95rem" }}>{attacker.nome}</div>
              <div style={{ fontSize:"0.72rem", color:"var(--text-dim)", marginTop:"0.1rem" }}>
                Clicca un altro token per attaccarlo · stat: {attackStat}
              </div>
            </div>
          </div>
          <div style={{ display:"flex", gap:"0.4rem", alignItems:"center", flexWrap:"wrap" }}>
            {["FOR","AGI","INT","PER"].map(s => (
              <button key={s} onClick={() => setAttackStat(s)}
                style={{
                  padding:"0.25rem 0.55rem", borderRadius:4, fontSize:"0.72rem",
                  fontFamily:"'Cinzel',serif", fontWeight:700,
                  border:`1px solid ${attackStat===s?"var(--red)":"var(--border)"}`,
                  background: attackStat===s ? "rgba(255,77,109,0.2)" : "var(--panel)",
                  color: attackStat===s ? "var(--red)" : "var(--text-dim)",
                  cursor:"pointer",
                }}>
                {s}
              </button>
            ))}
            <button className="btn btn-primary btn-sm" disabled={!attacker.skills?.length}
              onClick={() => { setSkillTargetId(null); setSkillPickerOpen(true); }}>
              ⚡ Skill
            </button>
            <button className="btn btn-outline btn-sm" onClick={() => setAttackerId(null)}>✕ Deseleziona</button>
          </div>
        </div>
      )}

      <div style={{ display:"grid", gridTemplateColumns:"1fr 300px", gap:"1rem", alignItems:"start" }}>
        {/* MAPPA */}
        <div style={{
          position:"relative",
          width: GRID_W * CELL_SIZE,
          height: GRID_H * CELL_SIZE,
          maxWidth:"100%",
          border:"2px solid var(--border-strong)",
          borderRadius:8,
          overflow:"auto",
          background:"var(--panel2)",
        }}>
          <div
            ref={gridRef}
            onMouseMove={onGridMouseMove}
            style={{
              position:"relative",
              width: GRID_W * CELL_SIZE,
              height: GRID_H * CELL_SIZE,
              backgroundImage: state.mapBg
                ? `url(${state.mapBg})`
                : `linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)`,
              backgroundSize: state.mapBg
                ? `${GRID_W * CELL_SIZE}px ${GRID_H * CELL_SIZE}px`
                : `${CELL_SIZE}px ${CELL_SIZE}px, ${CELL_SIZE}px ${CELL_SIZE}px`,
              backgroundPosition: "0 0",
              backgroundRepeat: state.mapBg ? "no-repeat" : "repeat",
              userSelect:"none",
            }}>
            {/* Overlay griglia quando c'è mappa */}
            {state.mapBg && (
              <div style={{
                position:"absolute", inset:0, pointerEvents:"none",
                backgroundImage: `linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)`,
                backgroundSize: `${CELL_SIZE}px ${CELL_SIZE}px`,
                backgroundPosition: "0 0",
              }} />
            )}

            {/* TOKEN */}
            {state.tokens.map(t => {
              const isTurn = state.currentTokenId === t.id;
              const isAttacker = attackerId === t.id;
              const hasAttacker = !!attackerId && !!attacker && !attacker.dead;
              const canBeHit = hasAttacker && !isAttacker && !t.dead;
              const factionGlow = t.faction === "alleato" ? "rgba(77,255,168,0.5)"
                : t.faction === "nemico" ? "rgba(255,77,109,0.5)"
                : "rgba(201,169,110,0.5)";
              return (
                <div key={t.id}
                  onMouseDown={e => onTokenMouseDown(e, t)}
                  onClick={e => {
                    e.stopPropagation();
                    // Shift+click = ispeziona (no cambio attaccante)
                    if (e.shiftKey) {
                      setInspectId(t.id);
                      return;
                    }
                    // Modello: 1° click → seleziona attaccante. 2° click su token diverso → apre menu azioni
                    if (!attackerId) {
                      // Nessun attaccante ancora: seleziona questo come attaccante (se vivo)
                      if (t.dead) {
                        addLog(`${t.nome} è K.O. — non può essere selezionato`, "info");
                        return;
                      }
                      setAttackerId(t.id);
                      return;
                    }
                    if (attackerId === t.id) {
                      // Stesso token: deseleziona
                      setAttackerId(null);
                      return;
                    }
                    // Token diverso + attaccante presente = apre menu azioni su questo bersaglio
                    if (t.dead) {
                      // Morto: offri cura/rianimazione direttamente
                      setActionTargetId(t.id);
                      return;
                    }
                    setActionTargetId(t.id);
                  }}
                  style={{
                    position:"absolute",
                    left: t.x * CELL_SIZE,
                    top: t.y * CELL_SIZE,
                    width: CELL_SIZE,
                    height: CELL_SIZE,
                    padding: 3,
                    cursor: hasAttacker
                      ? (isAttacker ? "pointer" : "crosshair")
                      : dragId === t.id ? "grabbing" : "pointer",
                    zIndex: isAttacker ? 20 : isTurn ? 15 : 10,
                  }}>
                  <div style={{
                    width:"100%", height:"100%", borderRadius:"50%",
                    background: t.avatar ? `url(${t.avatar}) center/cover` : t.color,
                    border: `3px solid ${
                      isAttacker ? "var(--red)" :
                      isTurn ? "var(--purple-bright)" :
                      t.color
                    }`,
                    boxShadow:
                      isAttacker ? `0 0 22px rgba(255,77,109,0.9)` :
                      isTurn ? `0 0 18px var(--purple)` :
                      canBeHit ? `0 0 14px rgba(255,77,109,0.5)` :
                      `0 0 8px ${factionGlow}`,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontFamily:"'Cinzel',serif", fontWeight:700, fontSize:"0.72rem",
                    color:"white", textShadow:"0 1px 3px rgba(0,0,0,0.9)",
                    position:"relative",
                    opacity: t.dead ? 0.3 : 1,
                    filter: t.dead ? "grayscale(0.8)" : "none",
                    transition: "box-shadow 0.2s, border-color 0.2s",
                  }}>
                    {/* Icona attaccante */}
                    {isAttacker && (
                      <div style={{
                        position:"absolute", top:-18, left:"50%", transform:"translateX(-50%)",
                        fontSize:"1rem", filter:"drop-shadow(0 2px 4px rgba(0,0,0,0.8))",
                      }}>⚔️</div>
                    )}
                    {canBeHit && (
                      <div style={{
                        position:"absolute", inset:-6, borderRadius:"50%",
                        border:"2px dashed var(--red)", animation:"spin 3s linear infinite",
                        pointerEvents:"none",
                      }} />
                    )}
                    {!t.avatar && t.nome.slice(0,2).toUpperCase()}
                    {t.dead && <span style={{ position:"absolute", fontSize:"1.6rem" }}>💀</span>}
                    {/* Barra HP */}
                    <div style={{
                      position:"absolute", bottom:-8, left:0, right:0, height:4, borderRadius:2,
                      background:"rgba(0,0,0,0.6)", border:"1px solid rgba(0,0,0,0.8)",
                    }}>
                      <div style={{
                        height:"100%", borderRadius:2,
                        width: `${Math.max(0, (t.hp_curr/t.hp_max)*100)}%`,
                        background: t.hp_curr/t.hp_max > 0.6 ? "var(--green)"
                          : t.hp_curr/t.hp_max > 0.3 ? "var(--gold)" : "var(--red)",
                        transition:"width 0.3s",
                      }} />
                    </div>
                    {/* Badge rank */}
                    {t.rank && (
                      <div style={{
                        position:"absolute", top:-5, right:-5,
                        width:16, height:16, borderRadius:"50%",
                        background:"var(--panel)", border:`1.5px solid ${getRankColor(t.rank)}`,
                        display:"flex", alignItems:"center", justifyContent:"center",
                        fontSize: t.rank.length>=2 ? "0.55rem" : "0.65rem",
                        color: getRankColor(t.rank), fontWeight:700,
                      }}>{t.rank}</div>
                    )}
                    {/* Icone condizioni */}
                    {(t.condizioni||[]).length > 0 && (
                      <div style={{
                        position:"absolute", top:-5, left:-5,
                        width:14, height:14, borderRadius:"50%",
                        background:"var(--red)", display:"flex", alignItems:"center", justifyContent:"center",
                        fontSize:"0.6rem", color:"white", fontWeight:700,
                      }}>{t.condizioni.length}</div>
                    )}
                  </div>
                  {/* Nome sotto token */}
                  <div style={{
                    position:"absolute", top:CELL_SIZE-4, left:-10, right:-10,
                    textAlign:"center", fontSize:"0.62rem", color:"white",
                    textShadow:"0 1px 3px black, 0 0 6px black",
                    fontFamily:"'Cinzel',serif", fontWeight:700,
                    pointerEvents:"none",
                    whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis",
                  }}>{t.nome}</div>
                </div>
              );
            })}

            {/* Placeholder quando vuoto */}
            {state.tokens.length === 0 && (
              <div style={{
                position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center",
                pointerEvents:"none", color:"var(--text-dim)", fontSize:"0.9rem",
              }}>
                Clicca "+ Aggiungi Token" per iniziare la battaglia
              </div>
            )}
          </div>
        </div>

        {/* PANNELLO LATERALE: Iniziativa + Target Info */}
        <div style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
          {/* Ordine iniziativa */}
          <div className="card" style={{ padding:"0.75rem" }}>
            <div className="section-title" style={{ marginBottom:"0.5rem", fontSize:"0.72rem" }}>Ordine Iniziativa</div>
            {iniziativaOrdered.length === 0 ? (
              <div style={{ fontSize:"0.78rem", color:"var(--text-dim)", fontStyle:"italic", padding:"0.5rem" }}>Nessun token in battaglia</div>
            ) : iniziativaOrdered.map(t => {
              const isTurn = state.currentTokenId === t.id;
              return (
                <div key={t.id} onClick={() => setInspectId(t.id)}
                  style={{
                    display:"flex", alignItems:"center", gap:"0.5rem",
                    padding:"0.4rem 0.5rem", marginBottom:"0.2rem",
                    background: isTurn ? "rgba(140,110,255,0.15)" : "var(--panel2)",
                    border: `1px solid ${isTurn ? "var(--purple)" : "var(--border)"}`,
                    borderRadius:4, cursor:"pointer",
                    opacity: t.dead ? 0.4 : 1,
                  }}>
                  <div style={{
                    width:24, height:24, borderRadius:"50%",
                    background: t.avatar ? `url(${t.avatar}) center/cover` : t.color,
                    border:`2px solid ${t.color}`, flexShrink:0,
                  }} />
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:"0.78rem", fontWeight:600, color:"var(--text-bright)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{t.nome}</div>
                    <div style={{ fontSize:"0.68rem", color:"var(--text-dim)" }}>
                      {t.hp_curr}/{t.hp_max} HP {t.fl_max>0 && `· ${t.fl_curr}/${t.fl_max} FL`}
                    </div>
                  </div>
                  {t.iniziativa !== null && (
                    <div style={{ fontFamily:"'Cinzel',serif", fontWeight:700, color:"var(--gold)", fontSize:"0.85rem" }}>{t.iniziativa}</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* MENU AZIONI contestuale — appare quando attaccante + bersaglio selezionato */}
      {attacker && actionTarget && !actionTarget.dead && attacker.id !== actionTarget.id && (
        <div onClick={() => setActionTargetId(null)} style={{
          position:"fixed", inset:0, background:"rgba(3,1,8,0.75)", zIndex:150,
          display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem",
          backdropFilter:"blur(4px)",
        }}>
          <div onClick={e => e.stopPropagation()} className="card" style={{
            padding:"1.2rem", maxWidth:480, width:"100%", maxHeight:"86vh", overflowY:"auto",
          }}>
            {/* Header: A attacca B */}
            <div style={{ display:"flex", alignItems:"center", gap:"0.75rem", marginBottom:"1rem", flexWrap:"wrap" }}>
              <div style={{
                width:48, height:48, borderRadius:"50%",
                background: attacker.avatar ? `url(${attacker.avatar}) center/cover` : attacker.color,
                border:"2px solid var(--red)",
                boxShadow:"0 0 12px rgba(255,77,109,0.6)",
                display:"flex", alignItems:"center", justifyContent:"center",
                color:"white", fontFamily:"'Cinzel',serif", fontWeight:700, fontSize:"0.8rem",
                flexShrink:0,
              }}>
                {!attacker.avatar && attacker.nome.slice(0,2).toUpperCase()}
              </div>
              <div style={{ fontSize:"1.5rem", color:"var(--red)" }}>→</div>
              <div style={{
                width:48, height:48, borderRadius:"50%",
                background: actionTarget.avatar ? `url(${actionTarget.avatar}) center/cover` : actionTarget.color,
                border:`2px solid ${actionTarget.color}`,
                display:"flex", alignItems:"center", justifyContent:"center",
                color:"white", fontFamily:"'Cinzel',serif", fontWeight:700, fontSize:"0.8rem",
                flexShrink:0,
              }}>
                {!actionTarget.avatar && actionTarget.nome.slice(0,2).toUpperCase()}
              </div>
              <div style={{ flex:1, minWidth:160 }}>
                <div style={{ fontFamily:"'Cinzel Decorative',serif", fontSize:"1rem", fontWeight:700, color:"var(--text-bright)" }}>
                  <span style={{ color:"var(--red)" }}>{attacker.nome}</span> → <span style={{ color:actionTarget.color }}>{actionTarget.nome}</span>
                </div>
                <div style={{ fontSize:"0.72rem", color:"var(--text-dim)", marginTop:"0.2rem" }}>
                  HP {actionTarget.hp_curr}/{actionTarget.hp_max} · DIF {actionTarget.dif} · FL {actionTarget.fl_curr}/{actionTarget.fl_max}
                </div>
              </div>
              <button className="btn btn-outline btn-xs" onClick={() => setActionTargetId(null)}>✕</button>
            </div>

            {/* Scelta stat */}
            <div style={{ display:"flex", gap:"0.3rem", alignItems:"center", marginBottom:"0.75rem", flexWrap:"wrap" }}>
              <span style={{ fontSize:"0.72rem", color:"var(--text-dim)" }}>Stat:</span>
              {["FOR","AGI","INT","PER"].map(s => (
                <button key={s} onClick={() => setAttackStat(s)}
                  style={{
                    padding:"0.2rem 0.55rem", borderRadius:4, fontSize:"0.72rem",
                    fontFamily:"'Cinzel',serif", fontWeight:700,
                    border:`1px solid ${attackStat===s?"var(--red)":"var(--border)"}`,
                    background: attackStat===s ? "rgba(255,77,109,0.2)" : "var(--panel)",
                    color: attackStat===s ? "var(--red)" : "var(--text-dim)",
                    cursor:"pointer",
                  }}>{s}</button>
              ))}
              <span style={{ fontSize:"0.7rem", color:"var(--text-dim)", marginLeft:"0.4rem" }}>
                ({modStat((attacker.stats||{})[attackStat])>=0?"+":""}{modStat((attacker.stats||{})[attackStat])})
              </span>
            </div>

            {/* Azioni principali */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.4rem", marginBottom:"0.75rem" }}>
              <button className="btn btn-danger" disabled={attacker.azionePrincipaleUsata}
                title={attacker.azionePrincipaleUsata ? "Azione Principale già usata questo turno" : "Tiro 1d20 + mod(stat) + Rank vs DIF"}
                onClick={() => {
                  executeAttack(attacker.id, actionTarget.id, attackStat);
                  setActionTargetId(null);
                }}>
                🎲 Tira Attacco
              </button>
              <button className="btn btn-primary" disabled={!attacker.skills?.length} onClick={() => {
                setSkillTargetId(actionTarget.id);
                setSkillPickerOpen(true);
                setActionTargetId(null);
              }}>
                ⚡ Usa Skill
              </button>
            </div>
            {attacker.azionePrincipaleUsata && (
              <div style={{ fontSize:"0.72rem", color:"var(--red)", marginBottom:"0.5rem", textAlign:"center" }}>
                ⚠️ {attacker.nome} ha già usato l'Azione Principale — solo skill con tag [Bonus] o [Reazione] o "Fine Turno" rimangono
              </div>
            )}

            {/* Azioni manuali GM (danno/cura/condizioni) */}
            <details>
              <summary style={{ cursor:"pointer", color:"var(--text-dim)", fontSize:"0.78rem", marginBottom:"0.5rem" }}>
                Applica manualmente (GM)
              </summary>
              <div style={{ padding:"0.6rem", background:"var(--panel2)", borderRadius:4, border:"1px solid var(--border)" }}>
                <div style={{ display:"flex", gap:"0.3rem", alignItems:"center", marginBottom:"0.4rem", flexWrap:"wrap" }}>
                  <input className="input-field" type="number" value={damageInput}
                    onChange={e => setDamageInput(parseInt(e.target.value)||0)} style={{ width:70 }} />
                  <button className="btn btn-danger btn-xs" onClick={() => applyToToken(actionTarget.id, "danno", damageInput)}>💔 Danno</button>
                  <button className="btn btn-success btn-xs" onClick={() => applyToToken(actionTarget.id, "cura", damageInput)}>💚 Cura</button>
                  <button className="btn btn-primary btn-xs" onClick={() => applyToToken(actionTarget.id, "fl-cost", damageInput)} disabled={actionTarget.fl_max===0}>⚡ −FL</button>
                </div>
                <div style={{ fontSize:"0.68rem", color:"var(--text-dim)", marginBottom:"0.3rem" }}>Condizioni:</div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:"0.2rem" }}>
                  {CONDIZIONI_BATTLE.map(c => {
                    const on = (actionTarget.condizioni||[]).includes(c);
                    const dur = (actionTarget.condizioniDur||{})[c];
                    return (
                      <button key={c} onClick={() => toggleConditionOn(actionTarget.id, c)}
                        style={{
                          padding:"0.15rem 0.45rem", borderRadius:10,
                          border:`1px solid ${on?"var(--red)":"var(--border)"}`,
                          background: on ? "rgba(255,77,109,0.18)" : "transparent",
                          color: on ? "var(--red)" : "var(--text-dim)",
                          fontFamily:"'Cinzel',serif", fontSize:"0.62rem", fontWeight:600,
                          cursor:"pointer",
                        }}>{c}{dur ? ` (${dur}t)` : ""}</button>
                    );
                  })}
                </div>
              </div>
            </details>
          </div>
        </div>
      )}

      {/* PANNELLO ISPEZIONA (shift+click) */}
      {inspectToken && (
        <div onClick={() => setInspectId(null)} style={{
          position:"fixed", inset:0, background:"rgba(3,1,8,0.75)", zIndex:150,
          display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem",
          backdropFilter:"blur(4px)",
        }}>
          <div onClick={e => e.stopPropagation()} className="card" style={{
            padding:"1.2rem", maxWidth:460, width:"100%", maxHeight:"86vh", overflowY:"auto",
            borderTop:`4px solid ${inspectToken.color}`,
          }}>
            <div style={{ display:"flex", gap:"0.75rem", marginBottom:"0.75rem", alignItems:"center" }}>
              <div style={{
                width:56, height:56, borderRadius:"50%",
                background: inspectToken.avatar ? `url(${inspectToken.avatar}) center/cover` : inspectToken.color,
                border:`3px solid ${inspectToken.color}`,
                display:"flex", alignItems:"center", justifyContent:"center",
                color:"white", fontFamily:"'Cinzel',serif", fontWeight:700, fontSize:"1rem",
                flexShrink:0,
              }}>
                {!inspectToken.avatar && inspectToken.nome.slice(0,2).toUpperCase()}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontFamily:"'Cinzel Decorative',serif", fontSize:"1.1rem", fontWeight:700, color:"var(--text-bright)" }}>{inspectToken.nome}</div>
                <div style={{ display:"flex", gap:"0.3rem", flexWrap:"wrap", marginTop:"0.2rem" }}>
                  {inspectToken.rank && <RankBadge rank={inspectToken.rank} size="sm" />}
                  <span style={{ fontSize:"0.68rem", padding:"0.1rem 0.4rem", borderRadius:3, background:inspectToken.color+"30", color:inspectToken.color, fontFamily:"'Cinzel',serif", fontWeight:600 }}>{inspectToken.faction}</span>
                </div>
              </div>
              <button className="btn btn-outline btn-xs" onClick={() => setInspectId(null)}>✕</button>
            </div>
            {/* Stats */}
            {inspectToken.stats && (
              <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:"0.2rem", marginBottom:"0.75rem" }}>
                {Object.entries(inspectToken.stats).map(([k,v]) => (
                  <div key={k} style={{ textAlign:"center", padding:"0.3rem", background:"var(--panel2)", borderRadius:3 }}>
                    <div style={{ fontSize:"0.58rem", color:"var(--text-dim)" }}>{k}</div>
                    <div style={{ fontSize:"0.85rem", fontWeight:700, color:"var(--text-bright)" }}>{v}</div>
                    <div style={{ fontSize:"0.6rem", color:"var(--purple-bright)" }}>{modStat(v)>=0?"+":""}{modStat(v)}</div>
                  </div>
                ))}
              </div>
            )}
            <div style={{ marginBottom:"0.75rem" }}>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:"0.72rem", marginBottom:"0.2rem" }}>
                <span style={{ color:"var(--red)" }}>HP</span>
                <span>{inspectToken.hp_curr}/{inspectToken.hp_max}</span>
              </div>
              <ProgressBar value={inspectToken.hp_curr} max={inspectToken.hp_max} color="var(--red)" height={8} />
              {inspectToken.fl_max > 0 && (
                <>
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:"0.72rem", margin:"0.4rem 0 0.2rem" }}>
                    <span style={{ color:"var(--flux)" }}>FL</span>
                    <span>{inspectToken.fl_curr}/{inspectToken.fl_max}</span>
                  </div>
                  <ProgressBar value={inspectToken.fl_curr} max={inspectToken.fl_max} color="var(--flux)" height={8} />
                </>
              )}
              <div style={{ fontSize:"0.72rem", color:"var(--purple)", marginTop:"0.4rem" }}>DIF: {inspectToken.dif}</div>
            </div>
            {/* Rimuovi */}
            <button className="btn btn-danger btn-sm" onClick={() => {
              if (confirm(`Rimuovere ${inspectToken.nome} dalla battaglia?`)) {
                removeToken(inspectToken.id);
                addLog(`${inspectToken.nome} esce dal campo`, "info");
                setInspectId(null);
                if (attackerId === inspectToken.id) setAttackerId(null);
              }
            }}>🗑️ Rimuovi dal campo</button>
          </div>
        </div>
      )}

      {/* MODAL SCHIVATA ATTIVA */}
      {pendingDodge && (() => {
        const att = state.tokens.find(t => t.id === pendingDodge.attId);
        const def = state.tokens.find(t => t.id === pendingDodge.defId);
        if (!att || !def) { setPendingDodge(null); return null; }
        const canAfford = (def.fl_curr || 0) >= 1;
        return (
          <div style={{
            position:"fixed", inset:0, background:"rgba(3,1,8,0.85)", zIndex:200,
            display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem",
            backdropFilter:"blur(6px)",
          }}>
            <div className="card" style={{ padding:"1.5rem", maxWidth:460, width:"100%", borderTop:"3px solid var(--flux)" }}>
              <div style={{ fontFamily:"'Cinzel Decorative',serif", fontSize:"1.3rem", fontWeight:700, color:"var(--flux)", marginBottom:"0.5rem" }}>
                🛡️ Schivata Attiva?
              </div>
              <p style={{ fontSize:"0.88rem", color:"var(--text)", lineHeight:1.6, marginBottom:"1rem" }}>
                <strong>{att.nome}</strong> ha colpito <strong>{def.nome}</strong> con un tiro <strong style={{ color:"var(--red)" }}>{pendingDodge.attTotal}</strong>
                {pendingDodge.isCrit && <span style={{ color:"var(--gold)" }}> (CRITICO)</span>}.
                Danno potenziale: <strong style={{ color:"var(--red)" }}>{pendingDodge.damage}</strong>.
              </p>
              <div style={{ padding:"0.75rem", background:"var(--panel2)", border:"1px solid var(--border)", borderRadius:6, marginBottom:"1rem", fontSize:"0.82rem" }}>
                <div style={{ color:"var(--text-dim)", marginBottom:"0.4rem" }}>
                  <strong style={{ color:"var(--flux)" }}>{def.nome}</strong> può spendere <strong>1 Flusso</strong> (ha {def.fl_curr}) per tentare una Schivata Attiva:
                </div>
                <div style={{ color:"var(--text)" }}>
                  Tira <strong>d20 + AGI ({modStat((def.stats||{}).AGI)>=0?"+":""}{modStat((def.stats||{}).AGI)})</strong> {bonusRank(def.rank)>0 && `+ ${bonusRank(def.rank)} Rank`} vs DC {pendingDodge.attTotal}
                </div>
                <div style={{ fontSize:"0.75rem", color:"var(--text-dim)", marginTop:"0.3rem", fontStyle:"italic" }}>
                  Successo → 0 danni. Fallimento → danno pieno. Consuma la Reazione di questo round.
                </div>
              </div>
              <div style={{ display:"flex", gap:"0.5rem", justifyContent:"flex-end", flexWrap:"wrap" }}>
                <button className="btn btn-danger btn-sm" onClick={() => resolveDodge(false)}>
                  💔 Subisci ({pendingDodge.damage} danni)
                </button>
                <button className="btn btn-gold btn-sm" onClick={() => resolveDodge(true)} disabled={!canAfford || def.reactionUsed}>
                  🛡️ Schiva (−1 FL)
                </button>
              </div>
              {!canAfford && <div style={{ color:"var(--red)", fontSize:"0.72rem", marginTop:"0.5rem", textAlign:"right" }}>Flusso insufficiente</div>}
              {def.reactionUsed && <div style={{ color:"var(--red)", fontSize:"0.72rem", marginTop:"0.5rem", textAlign:"right" }}>Reazione già usata questo round</div>}
            </div>
          </div>
        );
      })()}

      {/* MODAL SKILL PICKER — scegli skill (caster = attaccante selezionato) */}
      {skillPickerOpen && attacker && (() => {
        const caster = attacker;
        if (!caster) { setSkillPickerOpen(false); return null; }
        const skills = caster.skills || [];
        return (
          <div onClick={() => { setSkillPickerOpen(false); setSkillTargetId(null); }}
            style={{
              position:"fixed", inset:0, background:"rgba(3,1,8,0.85)", zIndex:200,
              display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem",
              backdropFilter:"blur(6px)",
            }}>
            <div onClick={e => e.stopPropagation()} className="card" style={{
              padding:"1.5rem", maxWidth:640, width:"100%", maxHeight:"86vh", overflowY:"auto",
              borderTop:"3px solid var(--purple)",
            }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1rem" }}>
                <div>
                  <div style={{ fontFamily:"'Cinzel Decorative',serif", fontSize:"1.3rem", fontWeight:700, color:"var(--purple-bright)" }}>
                    ⚡ Skill di {caster.nome}
                  </div>
                  <div style={{ fontSize:"0.78rem", color:"var(--text-dim)", marginTop:"0.2rem" }}>
                    Flusso attuale: <strong style={{ color:"var(--flux)" }}>{caster.fl_curr}/{caster.fl_max}</strong>
                  </div>
                </div>
                <button className="btn btn-outline btn-xs" onClick={() => { setSkillPickerOpen(false); setSkillTargetId(null); }}>✕ Chiudi</button>
              </div>

              {skills.length === 0 ? (
                <div style={{ textAlign:"center", padding:"2rem", color:"var(--text-dim)", fontStyle:"italic" }}>
                  Nessuna skill disponibile.
                </div>
              ) : skills.map((sk, i) => {
                const parsed = parseSkill(sk);
                if (!parsed) return null;
                const canAfford = caster.fl_curr >= parsed.flCost;
                // Verifica se l'azione richiesta dalla skill è già stata usata
                const actionBlocked =
                  (parsed.actionType === "principale" && caster.azionePrincipaleUsata) ||
                  (parsed.actionType === "bonus" && caster.azioneBonusUsata) ||
                  (parsed.actionType === "reazione" && caster.reactionUsed);
                const canUse = canAfford && !actionBlocked && parsed.actionType !== "passiva";
                const needsTarget = parsed.attackStat || parsed.appliedConditions.length > 0;
                const validTargets = state.tokens.filter(t => !t.dead && t.id !== caster.id);

                const actionBadgeColor = {
                  "principale": "var(--red)",
                  "bonus": "var(--gold)",
                  "reazione": "var(--flux)",
                  "passiva": "var(--text-dim)",
                }[parsed.actionType] || "var(--text-dim)";

                return (
                  <div key={i} style={{
                    marginBottom:"0.75rem", padding:"0.9rem",
                    background:"var(--panel2)", border:`1px solid ${actionBlocked ? "rgba(255,77,109,0.4)" : "var(--border)"}`, borderRadius:6,
                    opacity: canUse ? 1 : 0.55,
                  }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"0.4rem", gap:"0.5rem", flexWrap:"wrap" }}>
                      <div style={{ flex:1, minWidth:200 }}>
                        <div style={{ fontFamily:"'Cinzel',serif", fontWeight:700, color:"var(--text-bright)", fontSize:"0.95rem" }}>{parsed.nome}</div>
                        <div style={{ display:"flex", gap:"0.3rem", marginTop:"0.25rem", flexWrap:"wrap" }}>
                          <span style={{ fontSize:"0.65rem", padding:"0.1rem 0.5rem", borderRadius:3, background:`${actionBadgeColor}20`, color:actionBadgeColor, fontFamily:"'Cinzel',serif", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em" }}>
                            {parsed.actionType}
                          </span>
                          <span style={{ fontSize:"0.65rem", padding:"0.1rem 0.5rem", borderRadius:3, background:"rgba(77,217,255,0.15)", color:"var(--flux)", fontFamily:"'Cinzel',serif", fontWeight:600 }}>
                            {parsed.flCost} FL{parsed.needsScintilla?" + ✦":""}
                          </span>
                          {parsed.attackStat && (
                            <span style={{ fontSize:"0.65rem", padding:"0.1rem 0.5rem", borderRadius:3, background:"rgba(255,77,109,0.15)", color:"var(--red)", fontFamily:"'Cinzel',serif", fontWeight:600 }}>
                              Attacco {parsed.attackStat}
                            </span>
                          )}
                          {parsed.damageDice && (
                            <span style={{ fontSize:"0.65rem", padding:"0.1rem 0.5rem", borderRadius:3, background:"rgba(140,110,255,0.15)", color:"var(--purple-bright)" }}>
                              Danno {parsed.damageDice}
                            </span>
                          )}
                          {parsed.healDice && (
                            <span style={{ fontSize:"0.65rem", padding:"0.1rem 0.5rem", borderRadius:3, background:"rgba(77,255,168,0.15)", color:"var(--green)" }}>
                              Cura {parsed.healDice}
                            </span>
                          )}
                          {parsed.appliedConditions.map(c => (
                            <span key={c} style={{ fontSize:"0.65rem", padding:"0.1rem 0.5rem", borderRadius:3, background:"rgba(255,184,77,0.15)", color:"var(--amber)" }}>
                              {c}
                            </span>
                          ))}
                          {parsed.isAOE && (
                            <span style={{ fontSize:"0.65rem", padding:"0.1rem 0.5rem", borderRadius:3, background:"rgba(201,169,110,0.15)", color:"var(--gold)" }}>
                              Area
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div style={{ fontSize:"0.78rem", color:"var(--text-dim)", lineHeight:1.5, marginBottom:"0.6rem" }}>
                      {parsed.desc}
                    </div>

                    {/* Pulsanti azione */}
                    {parsed.actionType === "passiva" ? (
                      <div style={{ fontSize:"0.72rem", color:"var(--text-mute)", fontStyle:"italic" }}>
                        Effetto passivo — sempre attivo
                      </div>
                    ) : needsTarget ? (
                      <div style={{ display:"flex", gap:"0.4rem", flexWrap:"wrap", alignItems:"center" }}>
                        <select className="input-field" id={`tgt-${i}`} style={{ flex:1, minWidth:150, fontSize:"0.82rem" }} defaultValue={skillTargetId || ""}>
                          <option value="">Scegli bersaglio...</option>
                          {validTargets.map(t => (
                            <option key={t.id} value={t.id}>{t.nome} (HP {t.hp_curr}/{t.hp_max})</option>
                          ))}
                        </select>
                        <button className="btn btn-primary btn-sm" disabled={!canUse}
                          onClick={() => {
                            const sel = document.getElementById(`tgt-${i}`);
                            const tgtId = sel?.value || skillTargetId;
                            if (!tgtId) { alert("Scegli un bersaglio prima di lanciare la skill."); return; }
                            useSkill(caster.id, sk, tgtId);
                            setSkillPickerOpen(false); setSkillTargetId(null);
                          }}>
                          Usa
                        </button>
                      </div>
                    ) : (
                      <button className="btn btn-primary btn-sm" disabled={!canUse}
                        onClick={() => {
                          useSkill(caster.id, sk, caster.id);
                          setSkillPickerOpen(false); setSkillTargetId(null);
                        }}>
                        Usa su te stesso
                      </button>
                    )}
                    {!canAfford && <div style={{ color:"var(--red)", fontSize:"0.68rem", marginTop:"0.3rem" }}>Flusso insufficiente</div>}
                    {actionBlocked && <div style={{ color:"var(--red)", fontSize:"0.68rem", marginTop:"0.3rem" }}>
                      ⚠️ Azione {parsed.actionType === "principale" ? "Principale" : parsed.actionType === "bonus" ? "Bonus" : "Reazione"} già usata
                    </div>}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* PANNELLO AGGIUNGI TOKEN */}
      {showAddPanel && (
        <div onClick={() => setShowAddPanel(false)} style={{
          position:"fixed", inset:0, background:"rgba(3,1,8,0.75)", zIndex:160,
          display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem",
          backdropFilter:"blur(4px)",
        }}>
          <div onClick={e => e.stopPropagation()} className="card" style={{
            padding:"1.5rem", maxWidth:640, width:"100%", maxHeight:"86vh", overflowY:"auto",
          }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1rem" }}>
              <div className="page-title" style={{ fontSize:"1.3rem", margin:0 }}>Aggiungi Token</div>
              <button className="btn btn-outline btn-xs" onClick={() => setShowAddPanel(false)}>✕</button>
            </div>

            {/* Tabs */}
            <div style={{ display:"flex", gap:"0.3rem", marginBottom:"1rem", flexWrap:"wrap" }}>
              {[["schede","📋 Schede"],["bestiario","🐺 Bestiario"],["npc","👤 NPC"],["custom","🎯 Custom"]].map(([id,label]) => (
                <button key={id} onClick={() => setAddTab(id)}
                  className={`btn ${addTab===id?"btn-primary":"btn-outline"} btn-sm`}>{label}</button>
              ))}
            </div>

            {/* Content */}
            {addTab === "schede" && (
              <div>
                {schedeDisponibili.length === 0 ? (
                  <div style={{ textAlign:"center", padding:"2rem", color:"var(--text-dim)", fontStyle:"italic" }}>
                    Nessuna scheda giocatore salvata.<br/>Crea un personaggio dal Generatore.
                  </div>
                ) : schedeDisponibili.map(s => (
                  <div key={s.id} onClick={() => addFromScheda(s)}
                    className="card" style={{ padding:"0.75rem", marginBottom:"0.4rem", cursor:"pointer", display:"flex", gap:"0.75rem", alignItems:"center" }}>
                    <div style={{
                      width:44, height:44, borderRadius:"50%",
                      background: s.avatar ? `url(${s.avatar}) center/cover` : (s.token_color || "var(--purple)"),
                      border:"2px solid var(--border)",
                      display:"flex", alignItems:"center", justifyContent:"center",
                      color:"white", fontFamily:"'Cinzel',serif", fontWeight:700, fontSize:"0.75rem",
                    }}>{!s.avatar && s.nome.slice(0,2).toUpperCase()}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontFamily:"'Cinzel',serif", fontWeight:700, color:"var(--text-bright)" }}>{s.nome}</div>
                      <div style={{ fontSize:"0.72rem", color:"var(--text-dim)" }}>{s.classeNome} · {s.razzaNome} · Rank {getRankFromPA(s.pa||0)}</div>
                    </div>
                    <button className="btn btn-primary btn-xs">+</button>
                  </div>
                ))}
              </div>
            )}

            {addTab === "bestiario" && <CompactList items={BESTIARIO} onPick={addFromBestia} subtitle={b => b.tipo} />}
            {addTab === "npc" && <CompactList items={NPCS} onPick={addFromNpc} subtitle={n => n.fazione || n.titolo} />}

            {addTab === "custom" && (
              <div>
                <p style={{ fontSize:"0.82rem", color:"var(--text-dim)", marginBottom:"1rem" }}>Crea un token rapido per nemici o PNG non nel Compendio.</p>
                <div className="grid-2" style={{ marginBottom:"0.75rem" }}>
                  <div>
                    <label style={{ fontSize:"0.7rem", color:"var(--text-dim)" }}>Nome</label>
                    <input className="input-field" value={customToken.nome} onChange={e => setCustomToken(c => ({ ...c, nome:e.target.value }))} placeholder="Brigante, Zombie..." />
                  </div>
                  <div>
                    <label style={{ fontSize:"0.7rem", color:"var(--text-dim)" }}>HP</label>
                    <input className="input-field" type="number" value={customToken.hp} onChange={e => setCustomToken(c => ({ ...c, hp:e.target.value }))} />
                  </div>
                </div>
                <div style={{ marginBottom:"0.75rem" }}>
                  <label style={{ fontSize:"0.7rem", color:"var(--text-dim)", display:"block", marginBottom:"0.3rem" }}>Colore token</label>
                  <input type="color" className="input-field" value={customToken.color}
                    onChange={e => setCustomToken(c => ({ ...c, color:e.target.value }))} style={{ width:80, height:36, padding:2 }} />
                </div>
                <button className="btn btn-primary" onClick={addCustom} disabled={!customToken.nome.trim()}>+ Aggiungi</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* LOG BATTAGLIA */}
      {state.log && state.log.length > 0 && (
        <div className="card" style={{ padding:"1rem", marginTop:"1rem", maxHeight:200, overflowY:"auto" }}>
          <div className="section-title" style={{ marginBottom:"0.5rem", fontSize:"0.72rem" }}>Log Battaglia</div>
          {state.log.slice(0,20).map((e,i) => {
            const col = e.type==="danno" ? "var(--red)"
              : e.type==="cura" ? "var(--green)"
              : e.type==="skill" ? "var(--purple)"
              : e.type==="spawn" ? "var(--gold)"
              : "var(--border)";
            return (
              <div key={i} style={{ fontSize:"0.78rem", padding:"0.3rem 0.5rem", marginBottom:"0.15rem", borderLeft:`2px solid ${col}`, background:"var(--panel2)", borderRadius:3 }}>
                <span style={{ color:"var(--text-mute)", fontSize:"0.68rem", marginRight:"0.4rem", fontFamily:"'JetBrains Mono',monospace" }}>{e.time}</span>
                {e.msg}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Lista compatta con ricerca (per bestiario/npc nel pannello aggiungi)
function CompactList({ items, onPick, subtitle }) {
  const [search, setSearch] = useState("");
  const [rankF, setRankF] = useState("");
  const filtered = useMemo(() => items.filter(it => {
    if (search && !it.nome.toLowerCase().includes(search.toLowerCase())) return false;
    if (rankF && it.rank !== rankF) return false;
    return true;
  }), [items, search, rankF]);

  return (
    <div>
      <div style={{ display:"flex", gap:"0.5rem", marginBottom:"0.75rem" }}>
        <input className="input-field" placeholder="Cerca nome..." value={search} onChange={e => setSearch(e.target.value)} />
        <select className="input-field" value={rankF} onChange={e => setRankF(e.target.value)} style={{ maxWidth:130 }}>
          <option value="">Tutti Rank</option>
          {RANKS.map(r => <option key={r} value={r}>Rank {r}</option>)}
        </select>
      </div>
      <div style={{ maxHeight:400, overflowY:"auto" }}>
        {filtered.slice(0,40).map((it,i) => (
          <div key={i} onClick={() => onPick(it)}
            style={{
              padding:"0.5rem 0.75rem", marginBottom:"0.25rem",
              background:"var(--panel2)", border:"1px solid var(--border)", borderRadius:4,
              cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center", gap:"0.5rem",
            }}>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontFamily:"'Cinzel',serif", fontWeight:600, fontSize:"0.85rem", color:"var(--text-bright)" }}>{it.nome}</div>
              <div style={{ fontSize:"0.7rem", color:"var(--text-dim)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{subtitle(it)}</div>
            </div>
            <RankBadge rank={it.rank} size="sm" />
            <span style={{ fontSize:"0.7rem", color:"var(--red)" }}>HP {it.hp}</span>
          </div>
        ))}
        {filtered.length > 40 && <div style={{ textAlign:"center", fontSize:"0.75rem", color:"var(--text-dim)", padding:"0.5rem" }}>...e altri {filtered.length-40}. Usa la ricerca.</div>}
      </div>
    </div>
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
    {id:"battle",    label:"Battaglia"},
    {id:"tracker",   label:"Tracker"},
  ];

  const PageComponent = {
    home:      () => <HomePage setPage={setPage} />,
    wiki:      () => <WikiPage />,
    compendio: () => <CompendioPage />,
    generator: () => <GeneratorePage setPage={setPage} />,
    scheda:    () => <SchedaGiocabile />,
    battle:    () => <BattlePage />,
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
            <PageComponent key={page} />
          </div>
        </div>
      </div>
    </>
  );
}
