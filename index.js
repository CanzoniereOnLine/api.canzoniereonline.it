'use strict'
//Dipendenze
const Hapi = require('hapi')
const fs = require('fs')
var sqlite3 = require('sqlite3').verbose()
var SqliteStore = require('better-queue-sqlite')
var Queue = require('better-queue')

//cose da fare:
/* 
    Funzione POST di HAPI che prende il JSON 
    
        Richiama funzione per inserire il post nel database (rivece JSON)(trasmette ID del database)

            Richiama funzione per creare il file tex per la compilazione (rideve ID del databse e JSON)(trasmette ID)

                Aggiunge a coda con parametri di compilazione (rivece ID trasmette ID)
    
                    Compilare (riceve ID - si pesca i parametri dal db)(trasmette ID)
    
        Aggiunge a coda per email (ID)

    Crea email e invia allegati (ID - controlla parametri di compilazione)

funzione GET di HAPI che a domanda di canzoniere risponde con contenuto json dal  database


*/


const server = new Hapi.Server();
server.connection({ port: 3000, host: 'localhost' });

server.route({
    method: 'GET',
    path: '/',
    handler: function (request, reply) {
        reply('Hello, world!');
    }
});

server.route({
    method: 'GET',
    path: '/{name}',
    handler: function (request, reply) {
        reply('Hello, ' + encodeURIComponent(request.params.name) + '!');
    }
});

server.start((err) => {

    if (err) {
        throw err;
    }
    console.log(`Server running at: ${server.info.uri}`);
});