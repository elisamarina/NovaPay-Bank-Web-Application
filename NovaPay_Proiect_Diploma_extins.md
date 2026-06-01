# Proiect de diploma - NovaPay

Titlu propus: NovaPay - aplicatie FinTech pentru agregarea conturilor bancare si integrarea unui sistem de staking bazat pe account abstraction.

Autor: [Numele studentului]

Coordonator stiintific: [Numele coordonatorului]

Program de studii: [Specializarea]

An universitar: 2025-2026

Lucrarea propune proiectarea si implementarea unei aplicatii FinTech moderne, orientata catre utilizatorii care doresc o experienta unificata pentru vizualizarea conturilor bancare, administrarea tranzactiilor si accesarea unor functionalitati Web3 fara complexitatea traditionala a portofelelor blockchain. NovaPay porneste de la o aplicatie web construita cu Next.js, Appwrite si servicii de integrare financiara, apoi extinde modelul clasic de personal finance management printr-un modul de staking vault in care interactiunea cu blockchain-ul este mascata prin smart wallet si account abstraction.

Documentul de fata este un draft extins pentru proiectul de diploma. El contine structura completa propusa pentru lucrarea finala, descrierea problemei, fundamentarea tehnica, analiza optiunilor de arhitectura si capitole dezvoltate suficient pentru a putea fi rafinate ulterior cu diagrame, capturi de ecran, fragmente de cod si rezultate experimentale. In versiunea finala, sectiunile marcate implicit prin formulari de tipul „se va prezenta” sau „se recomanda” pot fi transformate in descrieri concrete, pe baza implementarii finale si a testelor efectuate.

# Rezumat

NovaPay este o aplicatie FinTech destinata centralizarii informatiilor financiare personale si pregatirii unei experiente de investitie descentralizata accesibila utilizatorilor fara cunostinte tehnice avansate despre blockchain. Aplicatia urmareste sa rezolve o problema frecventa in produsele hibride Web2/Web3: utilizatorul este interesat de beneficii, randament, automatizare si transparenta, dar este descurajat de pasi precum instalarea unui wallet extern, gestionarea frazelor seed, plata manuala a comisioanelor de gas sau intelegerea interfetelor complexe ale protocoalelor DeFi.

Solutia propusa combina o interfata web familiara, autentificare clasica, integrarea conturilor bancare prin servicii specializate si o arhitectura blockchain bazata pe smart wallets. In loc ca utilizatorul sa gestioneze direct un cont extern de tip EOA, aplicatia poate crea sau asocia un smart account controlat printr-un mecanism de autentificare cunoscut, de exemplu email, passkey sau autentificare sociala. Tranzactiile pot fi transmise prin infrastructura ERC-4337, iar plata gas-ului poate fi sponsorizata sau abstractizata printr-un paymaster, in functie de modelul economic ales pentru produs.

Componenta de staking este proiectata in jurul standardului ERC-4626, care defineste o interfata comuna pentru tokenized vaults. Aceasta alegere permite separarea clara intre activele depuse, actiunile emise de vault si logica de contabilizare a randamentului. Pentru implementare se recomanda utilizarea bibliotecilor OpenZeppelin, deoarece acestea ofera componente auditate si uzuale pentru ERC-20, ERC-4626, controlul accesului, protectia impotriva reentrancy si mecanismele de pauza operationala. Lucrarea analizeaza si compromisurile unei asemenea arhitecturi: experienta mai buna pentru utilizator, dar dependenta mai mare de infrastructura terta, cerinte stricte de securitate si nevoia de transparenta in privinta custodiei cheilor.

# Abstract

NovaPay is proposed as a modern FinTech application that unifies personal finance management with a future staking vault experience based on account abstraction. The project addresses a practical adoption barrier: many users are willing to use blockchain-based financial services only if the interaction model resembles familiar digital banking flows. External wallets, seed phrases, gas fees and raw smart contract calls introduce friction and risk, especially for non-technical users.

The proposed architecture combines a Next.js web application, Appwrite authentication and database services, bank account connectivity, and a Web3 layer based on smart accounts. The staking module is designed around ERC-4337 account abstraction and an ERC-4626 tokenized vault. This structure allows the application to hide low-level blockchain complexity while still maintaining on-chain verifiability and a modular smart contract design. The thesis also discusses provider options such as Alchemy Account Kit, Privy, Turnkey, Pimlico and Biconomy, with a recommendation to start from a conservative MVP using a managed smart account infrastructure and OpenZeppelin contracts.

# Cuprins propus

1. Introducere

1.1 Contextul digitalizarii serviciilor financiare

1.2 Problema abordata si motivatia proiectului

1.3 Obiectivele aplicatiei NovaPay

1.4 Metodologia de lucru

1.5 Contributii personale

1.6 Structura lucrarii

2. Fundamente teoretice privind aplicatiile FinTech, DeFi si account abstraction

2.1 Evolutia aplicatiilor FinTech si experienta utilizatorului

2.2 Open banking, agregarea conturilor si integrarea datelor financiare

2.3 Blockchain, smart contracts si finante descentralizate

2.4 Standardul ERC-4337 si conceptul de smart wallet

2.5 Embedded wallets si modele de custodie

2.6 Standardul ERC-4626 pentru tokenized vaults

2.7 Riscuri de securitate in aplicatii financiare hibride

3. Analiza si proiectarea sistemului NovaPay

3.1 Cerinte functionale si nefunctionale

3.2 Arhitectura aplicatiei web

3.3 Modelul de date si integrarea Appwrite

3.4 Integrarea conturilor bancare si fluxul de onboarding

3.5 Arhitectura smart wallet

3.6 Arhitectura staking vault

3.7 Fluxuri utilizator si scenarii de eroare

3.8 Consideratii privind securitatea si confidentialitatea

4. Implementarea aplicatiei

4.1 Structura proiectului Next.js

4.2 Implementarea autentificarii si a sesiunilor

4.3 Implementarea dashboard-ului financiar

4.4 Implementarea interfetei dark mode si a identitatii vizuale NovaPay

4.5 Implementarea modulului de staking placeholder

4.6 Integrarea account abstraction in prototip

4.7 Implementarea contractelor smart cu OpenZeppelin

5. Testare si evaluare

5.1 Strategia de testare frontend

5.2 Strategia de testare backend si Appwrite

5.3 Testarea contractelor smart

5.4 Testarea fluxurilor de utilizator

5.5 Analiza performantei si a limitarilor

6. Concluzii si directii viitoare

Bibliografie

Anexe

# Lista abrevierilor

AA - Account Abstraction.

API - Application Programming Interface.

DeFi - Decentralized Finance.

EOA - Externally Owned Account.

EVM - Ethereum Virtual Machine.

KYC - Know Your Customer.

MVP - Minimum Viable Product.

OZ - OpenZeppelin.

RPC - Remote Procedure Call.

SCA - Smart Contract Account.

UX - User Experience.

# Plan tehnic pentru sistemul de staking cu account abstraction

## Premise si decizie recomandata

Pentru NovaPay, obiectivul principal nu este sa expuna utilizatorul la mecanismele brute ale blockchain-ului, ci sa ofere o experienta apropiata de banking digital. Din acest motiv, solutia recomandata este folosirea unui smart wallet integrat direct in aplicatie, nu a unui wallet extern obligatoriu. Utilizatorul trebuie sa se poata autentifica printr-un flux cunoscut, sa vada soldul si optiunile de staking in interfata NovaPay, iar tranzactiile on-chain sa fie transformate intr-o actiune simpla de tip „confirma”.

Varianta tehnica recomandata pentru MVP este Alchemy Account Kit impreuna cu infrastructura de smart accounts si gas sponsorship, deoarece ecosistemul Alchemy ofera pachete orientate spre aplicatii React, integrare cu smart accounts si suport pentru paymaster. Alternativ, Privy si Turnkey sunt potrivite daca prioritatea devine experienta de embedded wallet si managementul cheilor, iar Pimlico sau Biconomy sunt optiuni foarte bune pentru infrastructura ERC-4337, bundler si paymaster. Alegerea finala depinde de criterii precum cost, control asupra cheilor, suport EVM, maturitatea SDK-urilor si cerintele de conformitate.

Modelul de produs ar trebui sa ramana incremental. Prima versiune poate afisa staking-ul ca functionalitate pregatita, fara executie reala, pentru a valida experienta de utilizare. A doua versiune poate crea smart account-ul si poate afisa adresa asociata. A treia versiune poate permite depuneri pe testnet intr-un vault ERC-4626. Abia dupa audit, limitari de risc si monitorizare ar trebui luata in calcul interactiunea cu active reale pe mainnet sau layer 2.

## Arhitectura propusa pentru NovaPay

La nivel conceptual, arhitectura este impartita in cinci zone. Prima zona este aplicatia web Next.js, responsabila pentru interfata, rutare, server actions si prezentarea datelor financiare. A doua zona este backend-ul de aplicatie, in care Appwrite gestioneaza autentificarea, baza de date si sesiunile. A treia zona este integrarea bancara, unde servicii precum Plaid si Dwolla pot furniza conectarea conturilor, verificarea utilizatorilor si initierea unor fluxuri financiare. A patra zona este infrastructura Web3, formata din smart accounts, bundler, paymaster si RPC provider. A cincea zona este sistemul de contracte smart, centrat in jurul vault-ului ERC-4626.

Fluxul ideal este urmatorul: utilizatorul intra in aplicatie, isi creeaza cont, conecteaza banca, vede dashboard-ul si poate accesa sectiunea de staking. Cand activeaza functia, aplicatia verifica daca exista deja un smart account asociat. Daca nu exista, sistemul il creeaza prin providerul ales si salveaza in baza de date doar identificatorii necesari, nu secrete sau chei private. Cand utilizatorul depune fonduri, aplicatia construieste o operatiune semnata sau autorizata prin mecanismul smart wallet, iar infrastructura ERC-4337 o transmite catre EntryPoint prin bundler.

Un element important este separarea responsabilitatilor. NovaPay nu ar trebui sa amestece logica de prezentare cu logica de semnare, nici logica de utilizator cu logica de randament. Interfata trebuie sa trimita cereri clare catre un strat de servicii, stratul de servicii trebuie sa gestioneze validarile si providerii externi, iar contractele smart trebuie sa ramana cat mai simple. Aceasta separare reduce riscul de erori si permite schimbarea furnizorului de account abstraction fara rescrierea completa a aplicatiei.

## Framework-uri si librarii recomandate

Alchemy Account Kit este o optiune puternica pentru NovaPay deoarece ofera componente pentru smart accounts, semnare, user operations si integrare in aplicatii React. Avantajul major este coerenta ecosistemului: acelasi furnizor poate acoperi RPC, smart accounts si sponsorship. Dezavantajul este dependenta mai mare de o platforma terta. Pentru un proiect de diploma si MVP, aceasta dependenta este acceptabila daca este documentata clar si daca arhitectura pastreaza puncte de inlocuire.

Privy este potrivit pentru experiente in care autentificarea familiara si wallet-ul embedded sunt foarte importante. El poate reduce frictiunea pentru utilizatorii care nu cunosc Web3, insa trebuie analizate atent modelul de custodie, responsabilitatea asupra cheilor si modul in care wallet-ul se integreaza cu account abstraction. Turnkey este atractiv prin accentul pe infrastructura de chei si politici de semnare, inclusiv scenarii in care cheile sunt protejate prin infrastructura specializata. Pimlico si Biconomy sunt relevante pentru partea de bundler si paymaster si pot fi folosite daca se doreste o separare intre providerul de wallet si providerul de infrastructura ERC-4337.

Pentru contracte smart, recomandarea principala este OpenZeppelin Contracts. Implementarea vault-ului ar trebui sa extinda ERC-4626 si sa foloseasca ERC-20 pentru tokenul de shares, Ownable sau AccessControl pentru operatiuni administrative, Pausable pentru oprire de urgenta si ReentrancyGuard pentru functii sensibile. Daca sistemul devine upgradeable, trebuie tratate separat riscurile proxy-urilor, initializarii si compatibilitatii storage-ului. Pentru prima versiune academica, contractele non-upgradeable sunt mai simple de analizat si mai usor de securizat.

## Flow MVP pentru utilizator

In MVP, experienta utilizatorului trebuie sa fie simpla. Dupa autentificare, utilizatorul ajunge in dashboard, vede conturile conectate si are acces la o sectiune Staking. In prima etapa, butonul de staking poate fi inactiv sau poate afisa un ecran de tip „Coming soon”, dar interfata trebuie sa comunice clar ce va face functionalitatea: depunere de active, acumulare de randament, retragere si vizualizare istoric.

In etapa urmatoare, butonul de activare poate crea smart account-ul. Utilizatorul nu trebuie sa vada notiuni precum nonce, EntryPoint sau calldata. Aceste detalii sunt importante pentru lucrare, dar in produs ele trebuie ascunse. Interfata poate afisa doar un status: wallet pregatit, retea selectata, estimare cost, nivel de risc si confirmare. Pentru un testnet, aplicatia poate afisa adresa smart wallet-ului si tranzactiile intr-un explorer, pentru transparenta.

Pentru depunere, utilizatorul alege suma, citeste o estimare si confirma. Aplicatia construieste operatiunea, o trimite catre provider si asteapta confirmarea. Dupa confirmare, dashboard-ul afiseaza shares primite, active depuse si randament estimat. Pentru retragere, fluxul este similar, dar poate include delay sau cooldown daca strategia de staking impune acest lucru. Din punct de vedere academic, aceste fluxuri trebuie descrise si apoi testate cu scenarii pozitive si negative.

# Introducere

## Contextul digitalizarii serviciilor financiare

Digitalizarea serviciilor financiare a modificat modul in care utilizatorii interactioneaza cu banii, institutiile bancare si produsele de investitii. In trecut, administrarea finantelor personale presupunea interactiuni separate cu mai multe banci, extrase de cont, aplicatii independente si procese birocratice. In prezent, utilizatorii se asteapta ca informatiile financiare sa fie disponibile rapid, intr-o interfata coerenta, cu actualizari aproape in timp real si cu posibilitatea de a lua decizii informate fara efort operational mare.

Aplicatiile FinTech au aparut ca raspuns la aceasta nevoie de viteza, transparenta si ergonomie. Ele nu inlocuiesc intotdeauna infrastructura bancara traditionala, ci o agrega, o simplifica si o completeaza. Pentru utilizator, valoarea nu vine doar din faptul ca poate vedea un sold, ci din faptul ca poate intelege situatia financiara, poate observa tranzactii, poate compara conturi, poate primi recomandari si poate executa actiuni intr-un context unic. Din acest punct de vedere, NovaPay urmareste sa fie mai mult decat o interfata de afisare: ea devine o punte intre finantele personale si serviciile financiare programabile.

In paralel cu dezvoltarea FinTech, ecosistemul blockchain a introdus o alta directie de inovare: contractele smart si finantele descentralizate. DeFi promite acces la protocoale transparente, lichiditate globala si reguli executate automat. Totusi, adoptia in randul utilizatorilor obisnuiti ramane limitata de complexitatea experientei. Un utilizator obisnuit trebuie sa instaleze un wallet, sa salveze o fraza seed, sa cumpere active native pentru gas, sa inteleaga retele, bridge-uri, approve-uri si riscuri de smart contract. Aceste etape sunt naturale pentru un utilizator avansat, dar sunt dificile pentru cineva obisnuit cu aplicatii bancare clasice.

Aceasta lucrare porneste de la ideea ca urmatoarea etapa de adoptie pentru aplicatiile Web3 nu va fi determinata doar de randament sau tehnologie, ci de experienta. Daca blockchain-ul ramane vizibil prin elementele sale cele mai tehnice, el va continua sa fie perceput ca riscant si greu de folosit. Daca, in schimb, infrastructura blockchain este integrata in spatele unei interfete clare, iar utilizatorul primeste explicatii simple si controale transparente, atunci un produs hibrid Web2/Web3 poate deveni mai accesibil.

## Problema abordata si motivatia proiectului

Problema principala abordata in aceasta lucrare este dificultatea construirii unei aplicatii financiare care sa combine date bancare, autentificare clasica si functionalitati blockchain fara a compromite securitatea sau experienta utilizatorului. Pe de o parte, aplicatia trebuie sa fie familiara, rapida si usor de folosit. Pe de alta parte, orice produs care gestioneaza date financiare, identitate si tranzactii on-chain trebuie sa respecte principii stricte de securitate, trasabilitate si separare a responsabilitatilor.

Motivatia proiectului NovaPay vine din observatia ca multe aplicatii se afla la una dintre extreme. Unele aplicatii FinTech ofera UX bun, dar nu integreaza servicii descentralizate. Multe aplicatii DeFi ofera transparenta on-chain, dar cer utilizatorului sa inteleaga direct mecanisme tehnice. NovaPay incearca sa ocupe zona de mijloc: o aplicatie cu interfata de finance dashboard, identitate vizuala proprie, dark mode, conectare bancara si o directie clara catre staking vault abstractizat prin smart wallets.

Aceasta directie este relevanta si din perspectiva academica, deoarece permite analiza mai multor arii tehnice intr-un sistem coerent. Proiectul include frontend modern, model de autentificare, baze de date, API-uri externe, design de produs, smart contracts, standarde Ethereum si account abstraction. Astfel, lucrarea nu se limiteaza la o aplicatie CRUD, ci demonstreaza proiectarea unei arhitecturi integrate cu constrangeri reale.

## Obiectivele aplicatiei NovaPay

Primul obiectiv este realizarea unei aplicatii web functionale, cu autentificare, pagini protejate si dashboard financiar. Utilizatorul trebuie sa poata crea un cont, sa se autentifice, sa vada informatiile profilului si sa acceseze zonele aplicatiei printr-o navigatie clara. Din punct de vedere tehnic, acest obiectiv implica gestionarea corecta a sesiunilor, validarea datelor, pastrarea informatiilor in Appwrite si tratarea cazurilor de eroare.

Al doilea obiectiv este definirea unei identitati vizuale coerente pentru aplicatie. Rebranding-ul in NovaPay, utilizarea unei cromatici mov-purpuriu, introducerea dark mode-ului si adaugarea animatiilor urmaresc sa creeze o aplicatie care nu arata generic. Intr-un produs FinTech, designul nu este doar estetic; el influenteaza increderea, perceptia de siguranta si usurinta cu care utilizatorul intelege informatiile afisate.

Al treilea obiectiv este proiectarea unui landing page care prezinta produsul inainte de intrarea in aplicatia principala. Landing page-ul are rolul de a explica propunerea de valoare, functionalitatile importante si directia de evolutie a produsului. Spre deosebire de dashboard, landing page-ul este orientat catre comunicare si convingere. El trebuie sa descrie clar ce este NovaPay, de ce este util si ce promite integrarea dintre banking si staking.

Al patrulea obiectiv este proiectarea unui sistem de staking bazat pe smart contracts. Pentru aceasta parte, lucrarea propune folosirea ERC-4626 pentru vault si a bibliotecilor OpenZeppelin pentru componente de securitate si standardizare. Sistemul trebuie sa fie suficient de modular pentru a putea fi testat initial pe testnet si suficient de simplu pentru a putea fi analizat riguros.

Al cincilea obiectiv este integrarea account abstraction pentru a elimina dependenta de wallet-uri externe in experienta utilizatorului. Acest obiectiv este esential pentru pozitionarea NovaPay ca aplicatie FinTech accesibila. Utilizatorul nu trebuie obligat sa inteleaga detalii precum EOAs, semnaturi brute, gas sau nonce. In schimb, aplicatia poate folosi smart accounts, bundlers si paymasters pentru a transforma interactiunea blockchain intr-un flux apropiat de o confirmare bancara.

## Metodologia de lucru

Metodologia propusa este incrementala. Prima etapa consta in analiza cerintelor si a fluxurilor principale de utilizator. In aceasta etapa se stabilesc paginile, datele necesare, starile aplicatiei si limitele MVP-ului. A doua etapa consta in implementarea aplicatiei web si stabilizarea autentificarii, deoarece fara un flux de sesiune corect nu se poate construi in siguranta o zona financiara protejata.

A treia etapa consta in proiectarea si documentarea arhitecturii Web3. Inainte de implementarea contractelor, trebuie clarificat ce active sunt sustinute, ce retea EVM se foloseste, ce provider de smart account este ales si cum se trateaza taxele de gas. Aceasta ordine este importanta deoarece staking-ul nu este o functionalitate izolata; el depinde de identitate, onboarding, risc, interfata si infrastructura.

A patra etapa este implementarea pe testnet. In aceasta etapa se pot folosi contracte ERC-4626 simple, active mock si smart accounts de test. Scopul nu este maximizarea randamentului, ci validarea arhitecturii. Se urmareste daca utilizatorul poate initia o depunere, daca aplicatia poate urmari tranzactia si daca starea afisata in dashboard corespunde starii on-chain.

A cincea etapa este testarea. Pentru frontend se recomanda teste de componente si verificari manuale ale fluxurilor critice. Pentru server actions se verifica tratamentul erorilor, datele obligatorii si autorizarea. Pentru contracte smart se recomanda teste unitare si teste de proprietati simple, precum conservarea activelor, raportul shares/assets si imposibilitatea retragerii peste sold. In lucrarea finala, rezultatele acestor teste trebuie prezentate in tabele si interpretate.

## Contributii personale

Contributiile personale ale proiectului pot fi grupate in patru categorii. Prima categorie este realizarea aplicatiei NovaPay ca produs web functional, cu identitate vizuala, navigatie, pagini publice si pagini protejate. Aceasta contributie arata capacitatea de a construi o aplicatie moderna, nu doar fragmente izolate de cod.

A doua categorie este integrarea serviciilor de backend si autentificare. In proiect, Appwrite este folosit pentru administrarea utilizatorilor si a datelor asociate. O parte importanta a contributiei este maparea corecta dintre schema bazei de date si datele transmise de aplicatie, deoarece erorile de tip atribut lipsa sau permisiuni incorecte pot bloca complet fluxul de sign-up si sign-in.

A treia categorie este proiectarea arhitecturii de staking. Chiar daca implementarea completa a staking-ului poate fi etapizata, lucrarea defineste un model tehnic coerent: smart account pentru utilizator, vault ERC-4626 pentru active, biblioteci OpenZeppelin pentru securitate si infrastructura ERC-4337 pentru trimiterea operatiunilor. Aceasta arhitectura poate fi extinsa ulterior fara a rescrie intreaga aplicatie.

A patra categorie este documentarea compromisurilor. O lucrare de diploma nu trebuie sa prezinte tehnologia ca solutie magica. Ea trebuie sa explice de ce s-au ales anumite instrumente, ce riscuri exista, ce alternative au fost analizate si ce limitari raman. In cazul NovaPay, compromisurile dintre UX, securitate, dependenta de provider si descentralizare sunt centrale.

## Structura lucrarii

Lucrarea este structurata in sase capitole. Capitolul introductiv prezinta contextul, problema, obiectivele si metodologia. Capitolul al doilea trateaza fundamentele teoretice privind FinTech, open banking, blockchain, DeFi, account abstraction, embedded wallets si ERC-4626. Capitolul al treilea descrie analiza si proiectarea sistemului NovaPay, incluzand cerintele, arhitectura aplicatiei si arhitectura smart contractelor.

Capitolul al patrulea va prezenta implementarea efectiva, cu fragmente de cod relevante, capturi de ecran si explicatii privind deciziile tehnice. Capitolul al cincilea va trata testarea si evaluarea. Capitolul al saselea va include concluziile, limitarile si directiile viitoare. Bibliografia va folosi referinte IEEE, iar anexele pot include diagrame suplimentare, secvente de cod, configurari Appwrite si capturi din testnet explorer.

# Capitolul 1. Fundamente privind aplicatiile FinTech, DeFi si account abstraction

## 1.1 Aplicatii FinTech si experienta utilizatorului

Aplicatiile FinTech reprezinta o categorie de produse software care folosesc tehnologia pentru a imbunatati, automatiza sau extinde servicii financiare. Ele pot acoperi plati, economisire, investitii, creditare, management financiar personal, verificare identitate, contabilitate sau servicii bancare integrate. Caracteristica lor comuna este orientarea catre utilizator si reducerea frictiunii. Un produs FinTech reusit nu ofera doar acces la functionalitati, ci le organizeaza intr-un flux predictibil, usor de inteles si sigur.

Experienta utilizatorului este deosebit de importanta in domeniul financiar deoarece deciziile luate in aplicatie implica bani, date personale si incredere. O eroare vizuala minora intr-o aplicatie obisnuita poate fi tolerata, dar intr-o aplicatie financiara poate genera teama sau confuzie. De aceea, interfata trebuie sa fie clara, iar starile de incarcare, eroare si succes trebuie tratate explicit. Utilizatorul trebuie sa stie cand o actiune a fost salvata, cand este in procesare si cand a esuat.

NovaPay se inscrie in aceasta directie printr-un dashboard care afiseaza solduri, conturi si zone functionale importante. Schimbarea cromaticii catre mov purpuriu si introducerea dark mode-ului nu sunt doar decizii estetice. Ele contribuie la construirea unei identitati vizuale distincte si la cresterea confortului pentru utilizatorii care folosesc aplicatia in contexte diferite. In acelasi timp, interfata trebuie sa ramana lizibila si profesionista, deoarece prea multe efecte vizuale pot reduce increderea intr-un produs financiar.

In aplicatiile FinTech, simplitatea nu inseamna lipsa de functionalitate, ci organizarea functionalitatii in pasi naturali. Utilizatorul nu trebuie sa fie obligat sa inteleaga arhitectura interna pentru a realiza o actiune. El trebuie sa aiba o imagine clara asupra rezultatului: conectarea unui cont, vizualizarea unui sold, initierea unei depuneri sau retragerea fondurilor. Aceasta filozofie este preluata si in partea de staking, unde account abstraction devine o metoda de a ascunde complexitatea blockchain-ului.

## 1.2 Open banking si agregarea datelor financiare

Open banking desemneaza tendinta de a permite accesul controlat la date financiare prin API-uri si consimtamantul utilizatorului. In loc ca fiecare banca sa ramana o insula de date, aplicatiile autorizate pot agrega informatii din mai multe surse. Aceasta agregare permite utilizatorului sa vada situatia financiara intr-un singur loc, sa urmareasca tranzactiile si sa construiasca scenarii de analiza.

Integrarea cu servicii precum Plaid este relevanta pentru NovaPay deoarece permite conectarea conturilor bancare fara ca aplicatia sa ceara direct credentialele bancare. Intr-un flux tipic, utilizatorul interactioneaza cu o interfata securizata de conectare, iar aplicatia primeste tokeni sau identificatori care permit accesarea datelor autorizate. Aceasta separare este importanta pentru securitate si pentru increderea utilizatorului.

Agregarea datelor ridica insa si probleme de confidentialitate. Aplicatia trebuie sa colecteze doar datele necesare, sa explice clar scopul prelucrarii si sa limiteze expunerea datelor sensibile. In lucrarea finala, aceasta zona poate fi tratata printr-o diagrama a fluxului de date: utilizator, aplicatie, Appwrite, provider bancar si eventual servicii blockchain. O asemenea diagrama arata unde se afla datele, cine are acces la ele si ce riscuri trebuie controlate.

In NovaPay, partea de open banking este complementara cu partea de staking. Conturile bancare ofera contextul financiar initial, iar staking-ul devine o functionalitate suplimentara. Este important ca aceste doua lumi sa nu fie amestecate necontrolat. Datele bancare nu trebuie expuse on-chain, iar tranzactiile blockchain nu trebuie prezentate ca fiind identice cu depozitele bancare. Interfata trebuie sa faca diferenta intre solduri bancare, active digitale, estimari de randament si riscuri.

## 1.3 Blockchain, smart contracts si DeFi

Blockchain-ul este o infrastructura distribuita care permite stocarea si verificarea tranzactiilor fara o autoritate centrala unica. In retele precum Ethereum, contractele smart extind aceasta idee prin cod executat determinist de retea. Un contract smart poate defini reguli pentru transferuri, depozite, imprumuturi, schimburi sau distribuirea randamentului. Odata implementat, comportamentul sau este transparent si verificabil, dar modificarea lui poate fi dificila sau imposibila, in functie de arhitectura.

DeFi foloseste contractele smart pentru a construi servicii financiare deschise. Exemplele includ exchange-uri descentralizate, lending markets, vault-uri de yield, staking si instrumente de lichiditate. Avantajul principal este interoperabilitatea: un contract poate interactiona cu alt contract, iar activele pot circula intre protocoale. Dezavantajul este ca riscurile tehnice devin directe. Un bug in contract, o eroare de oracle sau o vulnerabilitate de reentrancy poate produce pierderi reale.

Pentru NovaPay, DeFi nu este introdus ca scop in sine, ci ca mecanism pentru functionalitatea de staking. Utilizatorul nu trebuie sa navigheze prin protocoale multiple. Aplicatia trebuie sa ii ofere un flux controlat, iar contractele smart trebuie sa fie cat mai simple. Alegerea unui vault ERC-4626 este potrivita pentru aceasta abordare, deoarece standardul defineste o interfata comuna pentru depunere, retragere si calculul shares.

Intr-un proiect de diploma, partea blockchain trebuie tratata realist. Nu este suficient sa se spuna ca smart contracts sunt sigure pentru ca ruleaza pe blockchain. Dimpotriva, codul lor trebuie proiectat cu atentie, testat si limitat ca suprafata de atac. De aceea, lucrarea recomanda folosirea bibliotecilor OpenZeppelin si evitarea logicii speculative in prima versiune. Un vault simplu, testat bine, este preferabil unei arhitecturi complicate cu multe strategii greu de auditat.

## 1.4 Account abstraction si standardul ERC-4337

In modelul traditional Ethereum, utilizatorii interactioneaza cu reteaua prin conturi externe, numite Externally Owned Accounts. Aceste conturi sunt controlate de chei private, iar fiecare tranzactie trebuie semnata si platita cu moneda nativa a retelei. Modelul este puternic, dar pentru utilizatorii obisnuiti creeaza frictiune. Pierderea cheii private poate insemna pierderea fondurilor, iar plata gas-ului cere detinerea unui activ suplimentar.

Account abstraction propune un model in care conturile utilizatorilor pot fi contracte smart programabile. In loc ca toate conturile sa fie limitate la regulile unui EOA, un smart account poate implementa politici de validare, recuperare, sesiuni, limite sau semnaturi multiple. ERC-4337 este un standard important deoarece permite account abstraction fara schimbarea consensului Ethereum. El introduce concepte precum UserOperation, bundler, EntryPoint si paymaster.

Intr-un flux ERC-4337, utilizatorul nu trimite direct o tranzactie clasica. Aplicatia creeaza o UserOperation, care este preluata de un bundler. Bundler-ul grupeaza operatiuni si le trimite catre contractul EntryPoint. Smart account-ul valideaza operatiunea, iar paymaster-ul poate sponsoriza gas-ul in anumite conditii. Pentru NovaPay, aceasta arhitectura este valoroasa deoarece permite experiente de tip gasless sau semi-gasless, unde utilizatorul nu trebuie sa cumpere manual token nativ pentru fiecare actiune.

Totusi, account abstraction nu elimina riscurile, ci le muta in alte componente. Bundler-ul, paymaster-ul, smart account-ul si providerul de infrastructura devin elemente critice. Daca aplicatia sponsorizeaza gas, trebuie sa existe politici anti-abuz. Daca semnarea este abstractizata, trebuie sa existe masuri de recuperare si protectie a contului. Daca smart account-ul este creat printr-un provider, trebuie analizat modelul de custodie si portabilitate.

## 1.5 Embedded wallets si modele de custodie

Embedded wallets sunt portofele integrate direct intr-o aplicatie, astfel incat utilizatorul sa nu instaleze extensii externe sau aplicatii separate. Ele pot fi construite in mai multe moduri. Unele modele sunt custodiale, ceea ce inseamna ca furnizorul controleaza cheile sau poate semna in numele utilizatorului. Alte modele sunt non-custodiale sau semi-custodiale, folosind tehnologii precum passkeys, MPC, enclaves hardware sau recovery social.

Pentru NovaPay, embedded wallets sunt atractive deoarece sustin obiectivul de UX simplificat. Utilizatorul poate avea un smart wallet asociat contului sau de aplicatie, iar actiunile blockchain pot fi prezentate ca operatiuni normale. In acelasi timp, aceasta alegere trebuie documentata atent. Daca utilizatorul nu vede fraza seed, cine controleaza de fapt cheia? Poate utilizatorul exporta wallet-ul? Ce se intampla daca isi pierde accesul la email? Poate aplicatia bloca sau limita tranzactii? Aceste intrebari sunt esentiale pentru incredere.

Privy si Turnkey ofera solutii orientate spre embedded wallets. Privy este util pentru integrarea rapida a autentificarii si portofelelor in aplicatii consumer. Turnkey pune accent pe infrastructura de chei, politici de semnare si medii securizate. Alchemy Account Kit este mai orientat spre smart accounts si user operations, iar Pimlico si Biconomy pot furniza infrastructura ERC-4337. O comparatie intre aceste solutii trebuie sa includa nu doar functionalitatile, ci si responsabilitatile pe care le transfera catre provider.

In lucrarea finala, se recomanda includerea unui tabel de comparatie cu criterii precum: suport pentru EVM, suport pentru passkeys, smart accounts, gas sponsorship, portabilitate, cost, complexitatea integrarii si nivelul de control asupra cheilor. Acest tabel va justifica alegerea tehnica si va arata ca decizia nu a fost arbitrara.

## 1.6 Standardul ERC-4626 pentru tokenized vaults

ERC-4626 defineste o interfata standard pentru tokenized vaults, adica vault-uri care accepta un activ de baza si emit shares reprezentand participatia utilizatorului in vault. Standardul este important deoarece uniformizeaza functii precum deposit, mint, withdraw, redeem, totalAssets si conversia dintre assets si shares. In absenta unui standard, fiecare vault ar putea avea o interfata proprie, ceea ce ar ingreuna integrarea si auditarea.

Pentru NovaPay, ERC-4626 este potrivit deoarece partea de staking poate fi modelata ca depunere de active intr-un vault. Utilizatorul depune un token suportat, primeste shares, iar valoarea acestor shares reflecta participatia lui. Daca vault-ul produce randament, raportul dintre assets si shares se modifica. Aceasta logica este mai transparenta decat un sistem ad-hoc in care soldurile sunt actualizate manual.

OpenZeppelin ofera o implementare de ERC-4626 care poate fi extinsa. Folosirea acestei implementari reduce riscul de a gresi functiile standard si permite concentrarea pe logica specifica produsului. Totusi, un contract ERC-4626 nu este automat sigur. Trebuie analizate riscuri precum inflation attacks, rounding errors, reentrancy, strategii externe compromise si manipularea pretului activului de baza. Pentru un MVP, se recomanda un vault simplu, cu active mock sau stablecoin pe testnet, fara strategii externe complexe.

O directie posibila este definirea unui NovaPayStakingVault care extinde ERC-4626 si adauga reguli minime: pauza de urgenta, rol de manager, limita de depunere in faza beta si evenimente clare. Daca se doreste randament simulat in testnet, acesta poate fi introdus printr-un mecanism controlat doar pentru demonstratie, marcat clar ca atare. In versiunea finala reala, randamentul trebuie sa provina dintr-o strategie transparenta si auditata.

## 1.7 Riscuri de securitate in aplicatii financiare hibride

Aplicatiile hibride Web2/Web3 combina riscurile ambelor lumi. Din zona Web2 apar riscuri precum sesiuni compromise, permisiuni gresite in baza de date, expunerea secretelor in variabile publice, validare insuficienta si erori de autentificare. Din zona Web3 apar riscuri precum smart contract bugs, semnaturi abuzive, approve-uri nelimitate, gas sponsorship exploatat si pierderea cheilor.

Un principiu important pentru NovaPay este separarea datelor sensibile. Datele bancare si datele personale nu trebuie scrise on-chain. Blockchain-ul este public, iar orice informatie publicata acolo poate ramane permanent vizibila. In schimb, on-chain trebuie sa existe doar stari financiare necesare pentru protocol: adrese, solduri de token, shares si evenimente contractuale. Datele personale raman in infrastructura aplicatiei, protejate prin permisiuni si politici adecvate.

Alt principiu este minimizarea increderii. Chiar daca aplicatia foloseste un provider extern pentru account abstraction, contractele trebuie sa fie verificabile, iar utilizatorul trebuie sa poata vedea tranzactiile importante. Daca sistemul sponsorizeaza gas, trebuie sa existe limite si reguli. Daca exista roluri administrative, acestea trebuie justificate si protejate. Daca exista posibilitatea de pauza, trebuie explicat cand se foloseste si ce efect are asupra utilizatorilor.

In lucrarea finala, riscurile pot fi prezentate intr-o matrice: risc, cauza, impact, probabilitate si masura de control. Aceasta abordare arata maturitate tehnica si ajuta la transformarea proiectului dintr-o simpla implementare intr-un sistem analizat riguros.

# Capitolul 2. Analiza si proiectarea sistemului NovaPay

## 2.1 Cerinte functionale

Prima cerinta functionala este inregistrarea utilizatorului. Formularul de sign-up trebuie sa colecteze date precum nume, prenume, adresa, oras, stat, cod postal, data nasterii, SSN, email si parola. Aceste date sunt necesare in fluxurile de onboarding financiar si trebuie mapate corect catre schema Appwrite. In proiectul NovaPay, aceasta mapare este critica deoarece Appwrite valideaza strict numele atributelor. O diferenta intre firstName si FirstName sau intre id si ID poate genera erori de tip „Missing required attribute”.

A doua cerinta este autentificarea utilizatorului. Sign-in-ul trebuie sa creeze o sesiune valida si sa pastreze cookie-ul intr-o forma care functioneaza in mediul local si in productie. In dezvoltare, cookie-ul nu trebuie marcat ca secure daca aplicatia ruleaza pe HTTP, altfel browserul il poate ignora si utilizatorul este redirectionat repetat la sign-in. Aceasta problema a fost deja observata in timpul dezvoltarii si reprezinta un exemplu bun de detaliu mic cu impact major asupra experientei.

A treia cerinta este afisarea utilizatorului autentificat in dashboard. Dupa login, aplicatia trebuie sa identifice utilizatorul prin sesiunea Appwrite si sa caute documentul corespunzator in colectia de utilizatori. Pentru interogari server-side, este important ca aplicatia sa foloseasca un client cu permisiunile potrivite. Daca se foloseste un client de sesiune fara permisiuni pentru listDocuments, apare eroarea „The current user is not authorized”. Solutia arhitecturala este validarea sesiunii cu clientul de utilizator si interogarea datelor aplicatiei cu un client administrativ, acolo unde este justificat.

A patra cerinta este conectarea conturilor bancare. Utilizatorul trebuie sa aiba acces la un buton de conectare banca si la o lista de conturi. In interfata, acest flux trebuie sa fie vizibil in momentul potrivit. Daca utilizatorul nu are conturi conectate, aplicatia trebuie sa il ghideze catre conectare. Daca are conturi, trebuie sa afiseze solduri si informatii relevante. In versiunea finala, aceasta sectiune poate include si stari de eroare pentru token expirat sau conexiune bancara esuata.

A cincea cerinta este existenta unei pagini de staking. In MVP, butonul poate fi placeholder, dar prezenta lui in navigatie este importanta pentru directia produsului. Pagina de staking trebuie sa pregateasca utilizatorul pentru o functionalitate viitoare: activare smart wallet, depunere, vizualizare shares, randament si retragere. Chiar daca butonul nu executa inca tranzactii, designul trebuie sa lase loc pentru aceste stari.

## 2.2 Cerinte nefunctionale

Securitatea este cea mai importanta cerinta nefunctionala. Aplicatia lucreaza cu date personale si financiare, deci nu poate trata autentificarea si permisiunile superficial. Datele sensibile nu trebuie logate inutil, parolele nu trebuie expuse, cheile API trebuie pastrate in variabile de mediu server-side, iar cookie-urile trebuie configurate in functie de mediul de rulare. Pentru zona blockchain, aplicatia nu trebuie sa pastreze chei private in baza de date proprie.

Usability este a doua cerinta majora. NovaPay trebuie sa fie clara pentru un utilizator care nu stie ce este ERC-4337. Interfata trebuie sa prezinte actiunile in limbaj financiar, nu in limbaj de infrastructura. De exemplu, „Activeaza portofelul NovaPay” este mai potrivit decat „Deploy smart account”. Totusi, aplicatia poate oferi detalii avansate intr-o zona secundara, pentru utilizatorii care doresc transparenta.

Scalabilitatea trebuie privita pragmatic. Pentru un proiect de diploma, nu este necesara o arhitectura distribuita complexa. Totusi, aplicatia trebuie sa fie organizata astfel incat sa poata creste. Separarea componentelor, izolarea server actions, organizarea tipurilor si pastrarea unei structuri clare de foldere sunt suficiente pentru MVP. In zona smart contracts, scalabilitatea inseamna mai degraba modularitate si posibilitatea de a adauga strategii noi, nu optimizari premature.

Mentenabilitatea este importanta deoarece aplicatia combina mai multe tehnologii. Un bug poate aparea in frontend, in Appwrite, in providerul bancar, in providerul Web3 sau in contracte. Codul trebuie sa fie suficient de explicit pentru a putea urmari fluxurile. Numele campurilor trebuie sa fie consistente, erorile trebuie raportate clar, iar documentatia trebuie sa explice deciziile tehnice.

Performanta este relevanta mai ales pentru experienta dashboard-ului si landing page-ului. Animatiile trebuie sa fie fluide, dar nu trebuie sa blocheze interactiunea. Dark mode-ul trebuie sa se aplice fara flash vizual deranjant. Server actions trebuie sa raspunda intr-un timp acceptabil, iar paginile protejate trebuie sa gestioneze incarcarea datelor fara redirectionari inutile.

## 2.3 Arhitectura aplicatiei web

NovaPay foloseste Next.js cu App Router, ceea ce permite separarea intre pagini publice si pagini protejate. Landing page-ul este pagina publica principala, orientata catre prezentarea produsului. Zona dashboard este protejata si accesibila dupa autentificare. Aceasta separare este utila deoarece vizitatorii pot intelege produsul inainte de a crea cont, iar utilizatorii autentificati au o experienta focalizata pe datele lor.

La nivel de componente, aplicatia include sidebar, mobile navigation, formulare de autentificare, carduri de sold, zone de conturi bancare si pagini dedicate. Introducerea dark mode-ului presupune ca aceste componente sa foloseasca clase compatibile cu tema. O implementare buna nu schimba doar background-ul general, ci ajusteaza textul, bordurile, starile active si umbrele. Intr-un produs financiar, contrastul este critic; un dark mode frumos dar greu de citit este o problema, nu un avantaj.

Server actions sunt folosite pentru operatiuni precum sign-up, sign-in, logout si obtinerea utilizatorului autentificat. Ele permit rularea logicii sensibile pe server, unde exista acces la chei si variabile de mediu private. Totusi, server actions trebuie sa fie foarte clare in privinta datelor primite si returnate. Mesajele de eroare trebuie sa ajute utilizatorul, dar sa nu expuna informatii sensibile.

Structura aplicatiei trebuie sa pastreze distinctia dintre datele brute venite de la provider si modelul folosit in interfata. De exemplu, Appwrite poate folosi nume de campuri precum FirstName si LastName, dar in cod poate exista un model normalizat cu firstName si lastName. Aceasta normalizare reduce complexitatea in componente si izoleaza dependenta de schema externa intr-un singur loc.

## 2.4 Modelul de date si Appwrite

Appwrite este folosit pentru autentificare si stocarea documentelor utilizatorilor. Colectia utilizatori contine campuri precum email, ID, dwollaCustomerUrl, dwollaCustomerId, FirstName, LastName, address1, city, postalCode, dateOfBirth, ssn si state. Faptul ca Appwrite verifica strict campurile este util pentru consistenta, dar poate produce erori daca aplicatia trimite nume diferite de cele definite in schema.

Un exemplu concret este campul ID. Daca in aplicatie se trimite id sau userId, iar in Appwrite atributul obligatoriu este ID, documentul nu poate fi creat. La fel, FirstName difera de firstName, iar email trebuie sa fie prezent exact sub numele cerut de colectie. Din acest motiv, functia de sign-up trebuie sa construiasca explicit payload-ul pentru Appwrite, nu sa trimita direct obiectul formularului.

Pentru interogarea utilizatorului autentificat, aplicatia trebuie sa foloseasca ID-ul contului Appwrite ca legatura intre autentificare si documentul din colectie. La login, account.get() confirma sesiunea si returneaza utilizatorul din serviciul de autentificare. Apoi aplicatia cauta documentul in colectia utilizatori dupa ID. Daca documentul lipseste, aplicatia poate folosi un fallback minimal, dar in mod ideal trebuie sa remedieze inconsistenta si sa anunte utilizatorul.

Permisiunile sunt esentiale. Daca documentele utilizatorilor sunt accesate server-side, clientul administrativ poate fi folosit pentru interogari controlate, dar rezultatul trebuie filtrat si returnat doar pentru utilizatorul curent. Nu trebuie expuse liste complete de utilizatori in client. In versiunea finala, se poate analiza si un model cu permisiuni document-level, dar pentru MVP este acceptabila o abordare server-side bine izolata.

## 2.5 Integrarea conturilor bancare

Integrarea conturilor bancare presupune un flux in care utilizatorul autorizeaza aplicatia sa acceseze informatii financiare. In mod normal, aplicatia genereaza un link token, utilizatorul parcurge fluxul de conectare, iar aplicatia primeste un public token care este schimbat ulterior pentru un access token. Acest proces trebuie implementat server-side pentru a proteja secretele providerului.

In NovaPay, butonul de conectare banca trebuie sa fie vizibil pentru utilizatorii care nu au conturi asociate. Daca butonul lipseste, experienta se blocheaza dupa sign-up: utilizatorul a creat contul, dar nu stie ce urmeaza. Din acest motiv, layout-ul dashboard-ului si sidebar-ul trebuie verificate impreuna. O schimbare vizuala aparent minora poate ascunde cardurile din dreapta sau poate muta butonul in afara viewport-ului.

Datele bancare trebuie prezentate intr-un mod clar si limitat. Nu este necesar ca aplicatia sa afiseze toate detaliile tehnice ale contului. Pentru dashboard sunt suficiente numele institutiei, ultimele cifre ale contului, soldul si eventual tipul contului. Pentru istoricul tranzactiilor, se pot afisa data, descrierea, suma si categoria. Informatiile sensibile trebuie evitate sau mascate.

Intr-o versiune matura, aplicatia ar putea folosi datele agregate pentru recomandari sau insight-uri financiare. Totusi, pentru lucrarea de diploma, este mai sanatos sa se limiteze scopul: conectare, afisare si pregatirea unei experiente de staking. Functionalitatile AI sau recomandarile automate pot fi prezentate ca directii viitoare, cu discutii despre riscuri si confidentialitate.

## 2.6 Arhitectura smart wallet

Smart wallet-ul este componenta care permite NovaPay sa ofere o experienta blockchain fara wallet extern obligatoriu. In loc ca utilizatorul sa conecteze MetaMask sau alt wallet, aplicatia poate crea un smart account asociat profilului sau. Controlul asupra acestui smart account se face prin mecanisme definite de provider: passkey, email, social login, signer local sau alt model de semnare.

Din punct de vedere tehnic, smart wallet-ul trebuie tratat ca o identitate on-chain separata de identitatea Appwrite. Appwrite spune cine este utilizatorul in aplicatie. Smart account-ul spune ce adresa executa operatiuni on-chain. Legatura dintre cele doua se pastreaza in baza de date printr-un identificator de tip smartAccountAddress sau providerAccountId. Nu se stocheaza chei private.

Fluxul de creare trebuie sa fie idempotent. Daca utilizatorul apasa de mai multe ori pe buton, aplicatia nu trebuie sa creeze conturi multiple necontrolat. Ea trebuie sa verifice daca exista deja un smart account si sa il refoloseasca. In caz de eroare, trebuie sa pastreze starea clara: wallet inexistent, creare in progres, wallet creat, wallet indisponibil temporar.

Paymaster-ul este componenta care poate sponsoriza gas-ul. Pentru NovaPay, sponsorship-ul poate fi limitat la operatiuni permise, cum ar fi prima activare a wallet-ului sau depuneri pana la o anumita suma pe testnet. In productie, sponsorship-ul trebuie protejat impotriva abuzului. Fara limite, un atacator poate incerca sa genereze multe operatiuni pentru a consuma bugetul aplicatiei.

## 2.7 Arhitectura staking vault

Sistemul de staking propus este centrat pe un contract ERC-4626. Contractul primeste un activ de baza si emite shares. Utilizatorul nu interactioneaza direct cu contractul printr-un wallet extern, ci prin smart account-ul sau. Aplicatia construieste operatiunea de deposit sau withdraw si o transmite prin infrastructura ERC-4337.

Un contract minimal poate include NovaPayStakingVault, care extinde ERC4626 si ERC20. Pentru control operational, poate include Ownable sau AccessControl. Pentru situatii de urgenta, Pausable permite oprirea temporara a depunerilor si retragerilor. Pentru functii care transfera active, ReentrancyGuard reduce riscul unor atacuri de reentrancy. Aceste componente trebuie justificate in lucrare si testate.

Daca vault-ul foloseste o strategie de randament externa, arhitectura devine mai complexa. In acest caz, vault-ul nu doar pastreaza activele, ci le aloca intr-o strategie. Strategia poate fi separata intr-un contract distinct, ceea ce permite schimbarea ei, dar creste suprafata de atac. Pentru prima versiune, se recomanda evitarea strategiilor externe si simularea randamentului pe testnet, pentru a pastra analiza concentrata pe account abstraction si UX.

Evenimentele contractului sunt importante pentru sincronizarea cu aplicatia. Depunerile, retragerile, pauzele si modificarile administrative trebuie sa emita evenimente clare. Aplicatia poate asculta aceste evenimente sau poate interoga periodic starea on-chain. In lucrarea finala, se poate include o diagrama care arata cum un deposit produce o tranzactie, un event on-chain si o actualizare in dashboard.

## 2.8 Fluxuri functionale

Fluxul de onboarding incepe cu landing page-ul. Utilizatorul citeste prezentarea, apasa pe un call-to-action si ajunge la sign-up. Dupa completarea formularului, aplicatia creeaza contul Appwrite, creeaza documentul utilizatorului si il redirectioneaza catre zona unde poate conecta banca. Daca oricare dintre acesti pasi esueaza, utilizatorul trebuie sa primeasca un mesaj clar. Un mesaj generic de tip „Sign up failed” este util doar temporar; pentru dezvoltare, mesajele exacte ajuta la identificarea campului lipsa.

Fluxul de login este mai simplu, dar critic. Utilizatorul introduce email si parola, Appwrite creeaza sesiunea, aplicatia seteaza cookie-ul si redirectioneaza catre dashboard. Daca parola este gresita, aplicatia afiseaza eroare de credentiale. Daca sesiunea se creeaza, dar cookie-ul nu se salveaza, utilizatorul va fi trimis inapoi la sign-in. Aceasta situatie trebuie tratata in documentatie deoarece a aparut in timpul dezvoltarii.

Fluxul de conectare banca implica initierea unei sesiuni cu providerul bancar, finalizarea autorizarii si salvarea conturilor conectate. Dupa succes, dashboard-ul trebuie sa afiseze cardurile din dreapta si lista conturilor. Daca nu exista conturi, interfata trebuie sa ramana utila si sa prezinte butonul de conectare. Un ecran gol intr-o aplicatie financiara produce confuzie.

Fluxul de staking incepe prin activarea smart wallet-ului. Daca wallet-ul nu exista, aplicatia il creeaza. Daca exista, aplicatia afiseaza starea lui. Apoi utilizatorul selecteaza suma de depus. Aplicatia verifica soldul, construieste operatiunea, obtine semnarea necesara si trimite UserOperation. Dupa confirmare, interfata afiseaza shares si tranzactia. Pentru retragere, fluxul este similar, dar trebuie sa verifice soldul de shares si eventualele reguli de cooldown.

## 2.9 Securitate si confidentialitate

Securitatea NovaPay trebuie tratata pe straturi. Primul strat este autentificarea. Parolele sunt gestionate de Appwrite, nu de aplicatie direct. Aplicatia trebuie sa configureze corect cookie-urile si sa evite expunerea sesiunilor. Al doilea strat este autorizarea. Datele unui utilizator trebuie sa fie accesibile doar acelui utilizator sau logicii server-side care actioneaza in numele lui.

Al treilea strat este protectia datelor financiare. Informatiile bancare trebuie afisate minim si stocate doar daca este necesar. Tokenii de acces ai providerilor financiari trebuie tratati ca secrete. Daca aplicatia foloseste Dwolla sau alte servicii pentru transferuri, identificatorii trebuie pastrati cu atentie si nu trebuie expusi inutil in client.

Al patrulea strat este securitatea Web3. Smart accounts trebuie create printr-un provider de incredere sau prin contracte auditate. Contractele de staking trebuie testate si, inainte de orice utilizare reala, auditate. Functiile administrative trebuie limitate. Daca exista pausability, trebuie definit cine poate opri vault-ul si in ce conditii. Daca exista upgradeability, trebuie documentate riscurile de guvernanta.

Al cincilea strat este transparenta pentru utilizator. O aplicatie care abstractizeaza blockchain-ul nu trebuie sa ascunda complet riscul. Utilizatorul trebuie sa stie ca staking-ul implica active digitale si contracte smart. Interfata trebuie sa explice diferenta dintre cont bancar si vault on-chain. Aceasta transparenta nu trebuie sa fie alarmista, dar trebuie sa fie suficienta pentru consimtamant informat.

## 2.10 Diagrame recomandate pentru lucrarea finala

Figura 1 ar trebui sa prezinte arhitectura generala NovaPay. Diagrama poate include browserul utilizatorului, aplicatia Next.js, Appwrite, providerul bancar, providerul de account abstraction, bundler, paymaster, EntryPoint si contractul ERC-4626. Scopul ei este sa arate cum sunt separate responsabilitatile.

Figura 2 ar trebui sa prezinte fluxul de sign-up. Diagrama poate arata validarea formularului, crearea contului Appwrite, crearea documentului in colectia utilizatori, setarea sesiunii si redirectionarea catre dashboard sau conectare banca. Aceasta diagrama este utila deoarece sign-up-ul a fost unul dintre fluxurile problematice in dezvoltare.

Figura 3 ar trebui sa prezinte fluxul de staking deposit. Utilizatorul selecteaza suma, aplicatia verifica smart account-ul, construieste UserOperation, bundler-ul o trimite catre EntryPoint, smart account-ul valideaza, vault-ul executa deposit, iar aplicatia actualizeaza dashboard-ul. Aceasta diagrama ajuta la explicarea account abstraction intr-un mod vizual.

Tabelul 1 poate compara furnizorii de account abstraction: Alchemy, Privy, Turnkey, Pimlico si Biconomy. Tabelul 2 poate lista riscurile si masurile de control. Tabelul 3 poate prezenta cerintele functionale si stadiul lor de implementare. In anexa se pot include capturi de ecran cu landing page-ul, dashboard-ul dark mode si pagina de staking.

# Capitolul 3. Directii de implementare si validare

## 3.1 Implementarea identitatii vizuale NovaPay

Identitatea vizuala NovaPay trebuie sa sustina ideea de aplicatie financiara moderna, nu de experiment tehnic. Numele NovaPay sugereaza o platforma noua, rapida si orientata spre plati sau finante digitale. Logo-ul purpuriu si cromatica asociata diferentiaza aplicatia de paletele albastre folosite frecvent in aplicatiile bancare. Totusi, paleta trebuie folosita cu masura. Movul poate functiona ca accent, iar fundalurile dark pot crea profunzime, dar informatia financiara trebuie sa ramana lizibila.

Animatiile trebuie sa fie dinamice, dar utile. Pe landing page, ele pot comunica energia produsului: carduri care intra gradual, linii care sugereaza fluxuri financiare, efecte subtile pe butoane si tranzitii intre sectiuni. In dashboard, animatiile trebuie sa fie mai retinute. Utilizatorul vine acolo pentru date si actiuni, nu pentru spectacol. Astfel, produsul poate avea un landing page expresiv si o aplicatie principala calma, eficienta si clara.

Dark mode-ul trebuie implementat ca o tema completa, nu ca inversare simpla de culori. Textul, bordurile, fundalurile, cardurile, iconurile si starile active trebuie ajustate. In lucrarea finala, se poate include o comparatie intre tema light si tema dark, explicand deciziile de contrast si accesibilitate.

## 3.2 Implementarea fluxului de autentificare

Fluxul de autentificare trebuie sa fie stabil inainte de integrarea functionalitatilor blockchain. Daca utilizatorul este redirectionat gresit la sign-in, orice functie de staking va parea defecta. De aceea, autentificarea trebuie tratata ca fundatie. Implementarea trebuie sa verifice sesiunea, sa seteze corect cookie-ul si sa foloseasca Appwrite conform modelului sau de permisiuni.

In sign-up, aplicatia trebuie sa creeze mai intai contul de autentificare si apoi documentul de profil. Daca documentul de profil esueaza, trebuie decis ce se intampla cu contul creat. Pentru MVP, se poate afisa o eroare si se poate permite reluarea fluxului. Pentru productie, ar fi utila o operatiune compensatorie sau un job de reconciliere care identifica utilizatorii fara profil complet.

In sign-in, aplicatia trebuie sa normalizeze email-ul, sa trimita parola catre Appwrite si sa gestioneze erorile. Mesajul „Invalid credentials” nu inseamna intotdeauna ca parola pare gresita pentru utilizator; poate insemna ca userul a fost creat cu alt email, ca parola a fost resetata, ca exista spatii suplimentare sau ca sesiunea precedenta a creat confuzie. Documentarea acestor cazuri ajuta la explicarea procesului de debugging din proiect.

## 3.3 Implementarea staking-ului pe testnet

Implementarea staking-ului ar trebui inceputa pe un testnet EVM, de exemplu Sepolia sau o retea layer 2 de test. Prima versiune poate folosi un token ERC-20 mock si un vault ERC-4626 simplu. Utilizatorul nu depune active reale, dar fluxul tehnic este acelasi: smart account, approve sau permit daca este disponibil, deposit, shares si withdraw.

Pentru smart accounts, aplicatia poate crea contul la prima accesare a paginii Staking. In interfata, acest pas poate fi prezentat ca „Pregatim wallet-ul NovaPay”. Dupa creare, utilizatorul vede adresa si statusul. In spate, aplicatia foloseste SDK-ul providerului ales pentru a genera user operations. Pentru MVP, este acceptabil ca anumite actiuni sa fie limitate sau simulate, atata timp cat lucrarea explica exact ce este implementat si ce este planificat.

Contractele trebuie dezvoltate cu teste. Un test minim verifica depunerea si emiterea de shares. Alt test verifica retragerea. Alt test verifica faptul ca un utilizator nu poate retrage mai mult decat detine. Un test de pauza verifica blocarea operatiunilor in situatie de urgenta. Daca se foloseste AccessControl, trebuie testate rolurile. Aceste teste sunt importante pentru nota finala deoarece arata ca sistemul nu este doar desenat, ci validat.

## 3.4 Evaluarea solutiei

Evaluarea NovaPay trebuie sa combine criterii tehnice si criterii de utilizare. Din punct de vedere tehnic, se poate evalua daca fluxurile de autentificare functioneaza, daca datele sunt salvate corect, daca dashboard-ul se incarca, daca smart account-ul se creeaza si daca vault-ul executa operatiuni de baza. Din punct de vedere UX, se poate evalua daca utilizatorul intelege pasii si daca interfata ascunde corect complexitatea fara a ascunde riscurile.

Pentru partea blockchain, evaluarea poate include costuri estimate de gas, timp de confirmare si complexitatea operatiunilor. Account abstraction poate imbunatati UX, dar introduce costuri suplimentare si dependente. Un tabel comparativ intre tranzactie clasica EOA si UserOperation ERC-4337 ar fi util: pasi pentru utilizator, componente tehnice, costuri, riscuri si beneficii.

Pentru partea de aplicatie, evaluarea poate include testarea pe desktop si mobil, verificarea dark mode-ului, verificarea landing page-ului si testarea redirectionarilor. Intr-un produs financiar, redirectionarile gresite sunt critice deoarece utilizatorul poate crede ca si-a pierdut contul sau ca datele nu au fost salvate. De aceea, fluxurile de sign-up, sign-in si logout trebuie testate explicit.

## 3.5 Limitari

Prima limitare este ca un MVP academic nu poate demonstra toate cerintele unui produs financiar de productie. Pentru lansare reala ar fi necesare audituri, conformitate legala, politici de confidentialitate, monitorizare, rate limiting, protectie impotriva fraudelor si procese de suport. Lucrarea poate discuta aceste aspecte, dar nu le poate implementa complet in intervalul unui proiect de diploma.

A doua limitare este dependenta de providerii externi. Appwrite, Plaid, Dwolla, Alchemy, Privy sau Turnkey pot schimba API-uri, costuri sau conditii. O arhitectura buna reduce impactul prin separarea providerilor in servicii dedicate, dar nu elimina dependenta. In lucrare, aceasta dependenta trebuie recunoscuta ca tradeoff pentru viteza de implementare si siguranta operationala.

A treia limitare este modelul de staking. Un vault simplu pe testnet nu echivaleaza cu un produs de investitii real. Randamentul real implica strategii, riscuri de piata si riscuri de protocol. Pentru lucrarea de diploma, accentul trebuie pus pe arhitectura, UX si securitate, nu pe promisiuni de profit.

# Plan de paginare pentru versiunea finala de minimum 50 de pagini

Pentru a ajunge la minimum 50 de pagini de continut real, lucrarea finala poate fi impartita astfel: introducere 6-8 pagini, fundamente teoretice 10 pagini, analiza si proiectare 12-14 pagini, implementare 12-15 pagini, testare 6-8 pagini, concluzii 3-4 pagini, bibliografie si anexe separat. Capturile de ecran, diagramele si tabelele trebuie incluse in capitolele potrivite, nu adaugate artificial la final.

Capitolul de implementare va creste natural dupa adaugarea capturilor din aplicatie. Se pot include imagini cu landing page-ul, sign-up, sign-in, dashboard light, dashboard dark, sidebar, pagina de staking si erorile tratate in timpul dezvoltarii. Fiecare figura trebuie sa aiba titlu si explicatie. Nu este recomandat sa se adauge capturi fara comentariu, deoarece ele ocupa spatiu fara valoare academica.

Capitolul de testare poate include tabele cu scenarii. De exemplu: sign-up cu date valide, sign-up cu email lipsa, sign-in cu parola gresita, acces dashboard fara sesiune, creare smart account pe testnet, depunere in vault, retragere din vault, incercare de retragere peste sold, pausability. Pentru fiecare scenariu se poate nota rezultatul asteptat, rezultatul obtinut si observatiile.

Anexele pot include cod relevant pentru contracte smart, configurari Appwrite, schema colectiilor, structura folderelor si fragmente din testele contractelor. Aceste anexe nu trebuie sa inlocuiasca explicatia din capitole, dar pot sustine lucrarea si pot arata implementarea concreta.

# Bibliografie

[1] Ethereum Improvement Proposals, „ERC-4337: Account Abstraction Using Alt Mempool,” 2023. [Online]. Available: https://eips.ethereum.org/EIPS/eip-4337

[2] ERC-4337 Documentation, „Core Standards - ERC-4337,” 2026. [Online]. Available: https://docs.erc4337.io/core-standards/erc-4337

[3] Ethereum Improvement Proposals, „ERC-4626: Tokenized Vault Standard,” 2022. [Online]. Available: https://eips.ethereum.org/EIPS/eip-4626

[4] Ethereum.org, „ERC-4626 Tokenized Vault Standard,” 2026. [Online]. Available: https://ethereum.org/en/developers/docs/standards/tokens/erc-4626/

[5] OpenZeppelin, „ERC4626 - OpenZeppelin Contracts,” 2026. [Online]. Available: https://docs.openzeppelin.com/contracts/5.x/erc4626

[6] OpenZeppelin, „Access Control,” 2026. [Online]. Available: https://docs.openzeppelin.com/contracts/access-control

[7] OpenZeppelin, „Security,” 2026. [Online]. Available: https://docs.openzeppelin.com/contracts/4.x/api/security

[8] Alchemy, „Smart Accounts,” 2026. [Online]. Available: https://www.alchemy.com/docs/wallets/reference/smart-accounts

[9] Alchemy, „Gas Manager and Sponsored Transactions,” 2026. [Online]. Available: https://www.alchemy.com/docs/wallets/transactions/sponsor-gas

[10] Alchemy, „Account Kit React,” 2026. [Online]. Available: https://www.alchemy.com/docs/wallets/reference/account-kit/react

[11] Privy, „Embedded Wallets Overview,” 2026. [Online]. Available: https://docs.privy.io/wallets/overview/embedded

[12] Turnkey, „Embedded Wallets Overview,” 2026. [Online]. Available: https://docs.turnkey.com/embedded-wallets

[13] Pimlico, „Pimlico Documentation,” 2026. [Online]. Available: https://docs.pimlico.io/

[14] Biconomy, „Biconomy Documentation,” 2026. [Online]. Available: https://docs.biconomy.io/

[15] Next.js, „App Router Documentation,” 2026. [Online]. Available: https://nextjs.org/docs/app

[16] Appwrite, „Authentication - Overview,” 2026. [Online]. Available: https://appwrite.io/docs/products/auth

[17] Appwrite, „Authentication and Security,” 2026. [Online]. Available: https://appwrite.io/docs/advanced/security/authentication

[18] Plaid, „Link - Overview,” 2026. [Online]. Available: https://plaid.com/docs/link/

[19] Dwolla, „Dwolla API Documentation,” 2026. [Online]. Available: https://developers.dwolla.com/

[20] A. M. Antonopoulos and G. Wood, Mastering Ethereum: Building Smart Contracts and DApps. Sebastopol, CA, USA: O'Reilly Media, 2018.

[21] F. Schar, „Decentralized Finance: On Blockchain- and Smart Contract-Based Financial Markets,” Federal Reserve Bank of St. Louis Review, vol. 103, no. 2, pp. 153-174, 2021.

[22] S. Nakamoto, „Bitcoin: A Peer-to-Peer Electronic Cash System,” 2008. [Online]. Available: https://bitcoin.org/bitcoin.pdf

[23] D. Yaga, P. Mell, N. Roby, and K. Scarfone, „Blockchain Technology Overview,” National Institute of Standards and Technology, NISTIR 8202, 2018.

[24] M. Qin, K. Li, and Y. Gai, „An Empirical Study of DeFi Liquidations: Incentives, Risks, and Instabilities,” in Proc. ACM Internet Measurement Conference, 2021.

[25] S. Eskandari, S. Moosavi, and J. Clark, „SoK: Transparent Dishonesty: Front-Running Attacks on Blockchain,” in Financial Cryptography and Data Security Workshops, 2019.

[26] K. Toyoda, P. T. Mathiopoulos, I. Sasase, and T. Ohtsuki, „A Novel Blockchain-Based Product Ownership Management System,” IEEE Access, vol. 5, pp. 17465-17477, 2017.

[27] A. El Faqir, J. Arroyo, and S. Hassan, „An Overview of Decentralized Autonomous Organizations on the Blockchain,” in Proc. 16th International Symposium on Open Collaboration, 2020.

[28] arXiv, „VELLET: Verifiable Embedded Wallet for Securing Authenticity and Integrity,” 2024. [Online]. Available: https://arxiv.org/abs/2404.03874

[29] arXiv, „Account Abstraction, Analysed,” 2023. [Online]. Available: https://arxiv.org/abs/2309.00448

[30] OpenZeppelin, „Contracts Wizard,” 2026. [Online]. Available: https://wizard.openzeppelin.com/
