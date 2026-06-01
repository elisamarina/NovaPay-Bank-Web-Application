# Pseudocod compact pentru cursurile de Embedded Systems

Document generat pe baza fisierelor: C01_INTRO_LED.pdf, C02_4x3.pdf, C03_DIO.pdf, C04_RTC_WDT.pdf, C05_UART.pdf, C06_I2C.pdf, C07_SPI.pdf.

Nota: pseudocodul rezuma secventele de cod si cerintele observate in cursuri. Nu este transcriere C completa, ci o forma compacta pentru invatare/implementare rapida.

# C01_INTRO_LED - Intro, LED si switch

## LED blink

```text
INITIALIZEAZA portul LED ca iesire

REPETA LA INFINIT:
    seteaza tot portul LED pe 1
    asteapta 500 ms
    seteaza tot portul LED pe 0
    asteapta 500 ms
```

## LED controlat de switch

```text
INITIALIZEAZA portul LED ca iesire
INITIALIZEAZA portul butoanelor ca intrare

REPETA LA INFINIT:
    CITESTE starea butonului
    DACA butonul este apasat:
        aprinde LED-ul asociat
    ALTFEL:
        stinge LED-ul asociat
```

## Cerinta: 3 butoane controleaza 3 LED-uri

```text
INITIALIZEAZA LED1, LED2, LED3 ca iesiri
INITIALIZEAZA BUTON1, BUTON2, BUTON3 ca intrari

REPETA LA INFINIT:
    PENTRU fiecare buton i din 1..3:
        DACA BUTON_i este apasat:
            aprinde LED_i
        ALTFEL:
            stinge LED_i
```

## Cerinta C++: clasa LED

```text
CLASA Led:
    CAMPURI:
        registruDirectie
        registruPort
        pin

    CONSTRUCTOR Led(ddr, port, pin):
        salveaza registrele si pinul
        seteaza pinul ca iesire

    METODA on():
        scrie 1 pe pin

    METODA off():
        scrie 0 pe pin

    METODA toggle():
        inverseaza starea pinului

MAIN:
    creeaza obiecte Led
    REPETA LA INFINIT:
        apeleaza on/off/toggle dupa cerinta aplicatiei
```

# C02_4x3 - Tastatura matriciala 4x3

## Scanare keypad

```text
DEFINSTE tabelul de coduri pentru cele 12 taste
INITIALIZEAZA portul de afisare ca iesire

REPETA LA INFINIT:
    seteaza nibble-ul inferior ca iesire si nibble-ul superior ca intrare cu pull-up
    asteapta cateva microsecunde
    citeste partea inferioara a codului tastei

    seteaza nibble-ul superior ca iesire si nibble-ul inferior ca intrare cu pull-up
    asteapta cateva microsecunde
    combina citirea curenta cu partea superioara a codului tastei

    DACA valoarea citita indica tasta apasata:
        cauta valoarea in tabelul de taste
        DACA exista potrivire:
            buton = indexul tastei
        ALTFEL:
            buton = cod invalid
    ALTFEL:
        buton = cod invalid

    trimite butonul catre portul de afisare / decodor / LCD
```

## Cerinta: activeaza tastele speciale

```text
EXTINDE tabelul de taste cu valorile pentru * si #

REPETA LA INFINIT:
    scaneaza keypad-ul
    DACA tasta este cifra:
        afiseaza cifra pe display
    DACA tasta este *:
        afiseaza caracterul special asociat sau executa functie speciala
    DACA tasta este #:
        afiseaza caracterul special asociat sau confirma intrarea
```

# C03_DIO - Porturi digitale, LCD si intreruperi

## Configurare intrare cu pull-up

```text
SETARE pin ca intrare:
    DDRx.bit = 0

ACTIVARE pull-up intern:
    PORTx.bit = 1

CITIRE intrare:
    stare = PINx.bit
    DACA stare este 0:
        butonul este apasat in configuratie active-low
    ALTFEL:
        butonul nu este apasat
```

## Control LED prin port digital

```text
SETARE pin LED ca iesire

PENTRU aprindere LED:
    PORTx.bit = 1

PENTRU stingere LED:
    PORTx.bit = 0

PENTRU comutare LED:
    PORTx.bit = opusul valorii curente
```

## LCD HD44780 in mod 8-bit

```text
FUNCTIE lcd_command(comanda):
    RS = 0
    pune comanda pe magistrala de date
    genereaza impuls Enable: HIGH apoi LOW
    asteapta procesarea

FUNCTIE lcd_data(caracter):
    RS = 1
    pune caracterul pe magistrala de date
    genereaza impuls Enable: HIGH apoi LOW
    asteapta procesarea

FUNCTIE lcd_init():
    trimite comanda mod 8-bit
    porneste display-ul
    seteaza incrementarea cursorului
    curata ecranul

FUNCTIE lcd_puts(text):
    PENTRU fiecare caracter din text:
        lcd_data(caracter)

MAIN:
    configureaza porturile LCD ca iesiri
    lcd_init()
    seteaza cursor linia 1, coloana dorita
    lcd_puts("mesaj 1")
    seteaza cursor linia 2, coloana dorita
    lcd_puts("mesaj 2")
    REPETA LA INFINIT
```

## LCD HD44780 in mod 4-bit

```text
FUNCTIE trimite_nibble(valoare):
    pune cei 4 biti pe pinii LCD
    genereaza impuls Enable

FUNCTIE lcd_command_4bit(comanda):
    RS = 0
    trimite nibble-ul superior al comenzii
    trimite nibble-ul inferior al comenzii
    asteapta

FUNCTIE lcd_data_4bit(caracter):
    RS = 1
    trimite nibble-ul superior al caracterului
    trimite nibble-ul inferior al caracterului
    asteapta
```

## Intrerupere externa INT0

```text
ISR INT0:
    executa rapid codul de tratare a evenimentului
    seteaza un flag daca procesarea lunga trebuie facuta in main

MAIN:
    configureaza pinul INT0 ca intrare
    dezactiveaza intreruperile globale
    activeaza intreruperea INT0
    configureaza tipul frontului / nivelului
    activeaza intreruperile globale

    REPETA LA INFINIT:
        DACA flagEveniment este setat:
            proceseaza evenimentul
            reseteaza flagEveniment
```

## Sleep cu trezire prin intrerupere

```text
CONFIGUREAZA sursa de intrerupere care poate trezi MCU
CONFIGUREAZA modul sleep dorit

REPETA LA INFINIT:
    executa sarcinile active
    pregateste perifericele pentru consum redus
    intra in sleep
    la intrerupere, MCU se trezeste
    continua executia dupa sleep
```

# C04_RTC_WDT - Timer, RTC si watchdog

## Timer periodic pentru baza de timp

```text
CONFIGUREAZA timerul:
    selecteaza sursa de ceas
    selecteaza prescalerul
    incarca valoarea de comparare OCR
    activeaza intreruperea de comparare sau overflow

ISR TIMER:
    incrementeaza contorul de tick-uri
    DACA s-a acumulat 1 secunda:
        actualizeaza secundele RTC software
        DACA secundele ajung la 60:
            reseteaza secundele si incrementeaza minutele
        DACA minutele ajung la 60:
            reseteaza minutele si incrementeaza orele

MAIN:
    initializeaza timerul
    activeaza intreruperile
    REPETA LA INFINIT:
        afiseaza sau foloseste timpul curent
```

## RTC software

```text
STRUCTURA timp:
    secunde
    minute
    ore
    zi
    luna
    an

LA fiecare tick de o secunda:
    secunde = secunde + 1
    DACA secunde == 60:
        secunde = 0
        minute = minute + 1
    DACA minute == 60:
        minute = 0
        ore = ore + 1
    DACA ore == 24:
        ore = 0
        actualizeaza data calendaristica
```

## Watchdog reset

```text
INITIALIZEAZA watchdog cu timeout ales

REPETA LA INFINIT:
    executa functie1()
    executa functie2()

    DACA executia a fost normala si s-a terminat in timp:
        reseteaza watchdog-ul
    ALTFEL:
        nu reseta watchdog-ul
        MCU va fi resetat automat la expirarea timeout-ului
```

## Cerinta: modifica aplicatia RTC ca sa foloseasca WDT

```text
INITIALIZEAZA RTC bazat pe timer
INITIALIZEAZA watchdog

REPETA LA INFINIT:
    ruleaza actualizarea / afisarea RTC
    DACA aplicatia functioneaza normal:
        wdt_reset()
    DACA simulezi blocare software:
        intra intr-o bucla fara wdt_reset()
        observa resetarea MCU

TESTEAZA:
    caz normal: watchdog resetat periodic, MCU nu se reseteaza
    caz defect: watchdog nu este resetat, MCU se reseteaza
```

## Watchdog cu rutina de intrerupere

```text
ISR WDT:
    marcheaza aparitia timeout-ului
    salveaza informatie minima de diagnostic
    evita procesarea lunga in ISR

MAIN:
    activeaza WDT in modul interrupt sau interrupt + reset
    REPETA LA INFINIT:
        executa sarcini
        reseteaza WDT doar daca sistemul este sanatos
```

# C05_UART - Comunicare seriala UART

## Initializare UART

```text
DEFINESTE frecventa procesorului
DEFINESTE baud rate-ul dorit
CALCULEAZA valoarea UBRR

FUNCTIE uart_init(ubrr):
    scrie partea high si low in registrele UBRR
    activeaza receptorul RX
    activeaza transmitatorul TX
    optional activeaza intreruperea RX
    configureaza formatul cadrului: 8 biti de date, paritate dupa caz, 1/2 biti de stop
```

## Transmitere UART

```text
FUNCTIE uart_transmit(data):
    ASTEAPTA pana cand bufferul de transmisie este liber
    scrie data in registrul UDR
```

## Receptie UART cu intrerupere

```text
ISR UART_RX:
    citeste byte-ul primit din UDR
    salveaza byte-ul intr-un buffer
    seteaza flag pentru procesare in main

MAIN:
    dezactiveaza intreruperile globale
    uart_init()
    activeaza intreruperile globale

    REPETA LA INFINIT:
        DACA exista date noi:
            proceseaza caracterul primit
            optional trimite raspuns prin uart_transmit()
```

## Cerinta: comunicare prin porturi virtuale si Backspace

```text
CONFIGUREAZA doua porturi COM virtuale legate intre ele
DESCHIDE primul port in aplicatia MCU / simulator
DESCHIDE al doilea port in terminal

REPETA:
    citeste caracter primit prin UART
    DACA caracterul este Backspace/Delete:
        sterge ultimul caracter din buffer
        actualizeaza afisarea
    ALTFEL:
        adauga caracterul in buffer
        trimite ecou sau afiseaza caracterul
```

# C06_I2C - Magistrala I2C/TWI, EEPROM si DS1307

## Transmitere generica I2C

```text
FUNCTIE i2c_transmit(tip):
    DACA tip == START:
        seteaza TWINT, TWSTA si TWEN
    DACA tip == DATA:
        seteaza TWINT si TWEN
    DACA tip == DATA_ACK:
        seteaza TWEA, TWINT si TWEN
    DACA tip == STOP:
        seteaza TWINT, TWEN si TWSTO
        returneaza succes

    ASTEAPTA pana cand TWINT devine setat
    returneaza statusul TWI mascat
```

## Start I2C cu retry

```text
FUNCTIE i2c_start(device_id, device_addr, rw):
    retry = 0

    REPETA pana la MAX_TRIES:
        trimite START
        DACA arbitraj pierdut:
            continua retry
        DACA statusul nu este START sau REPEATED_START:
            returneaza eroare

        incarca adresa slave + bitul R/W in TWDR
        trimite DATA
        DACA slave raspunde cu ACK:
            returneaza succes
        DACA slave raspunde cu NACK sau arbitraj pierdut:
            retry = retry + 1

    returneaza eroare
```

## Scriere si citire I2C

```text
FUNCTIE i2c_write(data):
    incarca data in TWDR
    trimite DATA
    DACA statusul este DATA_ACK:
        returneaza succes
    ALTFEL:
        returneaza eroare

FUNCTIE i2c_read(ack):
    DACA ack este adevarat:
        trimite DATA_ACK
        asteapta DATA_ACK primit
    ALTFEL:
        trimite DATA fara ACK
        asteapta DATA_NACK primit

    citeste TWDR
    returneaza byte-ul primit

FUNCTIE i2c_stop():
    trimite STOP
```

## EEPROM I2C

```text
FUNCTIE eeprom_write_byte(adresa, data):
    i2c_start(EEPROM, WRITE)
    trimite byte-ul low al adresei
    trimite byte-ul high al adresei
    trimite data
    i2c_stop()

FUNCTIE eeprom_read_byte(adresa):
    i2c_start(EEPROM, WRITE)
    trimite byte-ul low al adresei
    trimite byte-ul high al adresei
    i2c_start(EEPROM, READ)
    data = i2c_read(NACK)
    i2c_stop()
    returneaza data

MAIN:
    initializeaza TWI: prescaler si TWBR
    citeste ID-ul din EEPROM
    DACA ID-ul nu exista:
        scrie secventa initiala in EEPROM
    REPETA LA INFINIT:
        citeste pe rand valorile din EEPROM
        afiseaza valorile pe PORTD
        asteapta 100 ms
```

## RTC DS1307 - citire timp

```text
FUNCTIE read_DS1307():
    i2c_start(DS1307, WRITE)
    scrie adresa registrului 0x00
    i2c_stop()

    i2c_start(DS1307, READ)
    secunde = BCD_to_DEC(i2c_read(ACK) fara bitul CH)
    minute  = BCD_to_DEC(i2c_read(ACK))
    oraRaw  = i2c_read(ACK)

    DACA oraRaw indica mod 12h:
        ora = BCD_to_DEC(oraRaw fara biti de mod)
        memoreaza AM/PM
    ALTFEL:
        ora = BCD_to_DEC(oraRaw fara biti de mod 24h)

    ziSaptamana = BCD_to_DEC(i2c_read(ACK))
    ziLuna      = BCD_to_DEC(i2c_read(ACK))
    luna        = BCD_to_DEC(i2c_read(ACK))
    an          = BCD_to_DEC(i2c_read(NACK))
    i2c_stop()
```

## RTC DS1307 - scriere timp

```text
FUNCTIE write_DS1307(timp):
    dezactiveaza bitul CH din secunde pentru a porni oscilatorul
    i2c_start(DS1307, WRITE)
    scrie adresa registrului 0x00

    PENTRU fiecare camp din secunde, minute, ora, zi, data, luna, an:
        DACA este campul ora:
            converteste in BCD
            seteaza bitii pentru mod 12h/24h si AM/PM
            scrie ora formatata
        ALTFEL:
            scrie DEC_to_BCD(camp)

    i2c_stop()
```

## Cerinta: doua microcontrolere pe I2C

```text
MCU_A este master
MCU_B este slave

MCU_A:
    initializeaza I2C ca master
    REPETA:
        pregateste data de transmis
        trimite START
        trimite adresa MCU_B cu WRITE
        trimite data
        trimite STOP

MCU_B:
    initializeaza I2C ca slave cu adresa proprie
    LA primirea datelor:
        citeste byte-ul primit
        executa actiunea asociata
```

# C07_SPI - Magistrala SPI

## SPI slave

```text
INITIALIZEAZA SPI_SLAVE:
    seteaza MISO ca iesire
    seteaza MOSI, SCK si SS ca intrari
    activeaza SPI

FUNCTIE spi_slave_receive():
    ASTEAPTA pana cand flagul SPIF indica transfer complet
    returneaza SPDR

MAIN SLAVE:
    initializeaza display-ul / portul de iesire
    spi_slave_init()

    REPETA LA INFINIT:
        data = spi_slave_receive()
        afiseaza data pe port / 7-segmente
```

## SPI master

```text
INITIALIZEAZA SPI_MASTER:
    seteaza MOSI si SCK ca iesiri
    seteaza MISO ca intrare
    optional seteaza SS ca iesire
    activeaza SPI in mod master
    seteaza prescalerul de ceas

FUNCTIE spi_master_transmit(data):
    incarca data in SPDR
    ASTEAPTA pana cand SPIF indica transfer complet

MAIN MASTER:
    spi_master_init()
    i = 0

    REPETA LA INFINIT:
        i = i modulo 16
        spi_master_transmit(i)
        i = i + 1
        asteapta 100 ms
```

## Cerinta: numere pare catre slave0 si impare catre slave1

```text
CONFIGUREAZA masterul SPI
CONFIGUREAZA SS0 si SS1 ca iesiri
DESELECTEAZA toti slave-ii

REPETA pentru numerele 0..15:
    DACA numarul este par:
        activeaza SS0
        trimite numarul prin SPI
        dezactiveaza SS0
    ALTFEL:
        activeaza SS1
        trimite numarul prin SPI
        dezactiveaza SS1

    asteapta scurt intre transmisii
```

## Cerinta: comunicare daisy-chain

```text
CONFIGUREAZA masterul SPI
CONFIGUREAZA slave-ii in lant: iesirea primului intra in urmatorul

REPETA:
    activeaza linia SS comuna
    PENTRU fiecare byte din mesaj:
        trimite byte prin SPI
        citeste byte-ul intors din lant
    dezactiveaza linia SS comuna
    proceseaza raspunsurile decalate in functie de pozitia slave-ului
```

