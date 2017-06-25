'use strict'
//Dipendenze
const Hapi = require('hapi')
const fs = require('fs')
var sqlite3 = require('sqlite3').verbose()
var SqliteStore = require('better-queue-sqlite')
var Queue = require('better-queue')
var Hashids = require('hashids')
const nodemailer = require('nodemailer')
var secret = require('./secret');



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

//definisci variabili. Le cartelle devono finire con /
const dbpath = '/Users/matteoconci/websites/canzoniereonline/canzonieri.db'
const texpath = '/Users/matteoconci/websites/canzoniereonline/singletex/'
const workpath = '/Users/matteoconci/websites/canzoniereonline/work/'
const queuepath = '/Users/matteoconci/websites/canzoniereonline/queuepath.db'
//FUNZIONI
var hashids = new Hashids('', 10, 'abcdefghijklmnopqrstuvwxyz1234567890')

//Inizializza email

// create reusable transporter object using the default SMTP transport
let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: secret.mailuser,
        pass: secret.mailpsw
    }
});


//Creazione delle Code

var store = new SqliteStore({
    type: 'sql',
    dialect: 'sqlite',
    path: queuepath
});

var compile = new Queue(function (input, cb) { 
    var hash = hashids.encode(input)

    var db = new sqlite3.Database(dbpath) //apre db
    var risultato = db.get('SELECT * FROM canzonieri WHERE id = ?', input ,function(err,row){ //seleziona id del canzoniere
    console.log(err)

    var canzoniere = JSON.parse(row.canzoniere) //prende tutte le info del canzoniere e le trasforma in oggetto 

    //PRENDI PARAMETRO CANZONIERE E COMPILA IN MODO SINCRONO
            
    
    mail.push(id)

    })
    cb(null, result)
})

var mail = new Queue(function (input, cb) { 
    var hash = hashids.encode(input)

    var db = new sqlite3.Database(dbpath) //apre db
    var risultato = db.get('SELECT * FROM canzonieri WHERE id = ?', input ,function(err,row){ //seleziona id del canzoniere
    console.log(err)

    var canzoniere = JSON.parse(row.canzoniere) //prende tutte le info del canzoniere e le trasforma in oggetto 
        let mailOptions = {
        from: '"CanzoniereOnLine" <canzoniereonline@gmail.com>', // sender address
        to: 'concimatteo@gmail.com', // list of receivers
        subject: '🎶 Ecco il tuo canzoniere '+input, // Subject line
        text: 'Hello world!' + canzoniere.titolo, // plain text body
        html: '<b>Hello world ?</b>'+ canzoniere.titolo, // html body
        attachments: [
            {
                path: workpath + hash + "/" + input + ".tex"
            }
        ]
        };

        // send mail with defined transport object
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return console.log(error);
            }
        console.log('Message %s sent: %s', info.messageId, info.response);
        });

        console.log("Mail con canzoniere " + input)

        })

    cb(null, result)
})


function createTEX(id){
        var db = new sqlite3.Database(dbpath) //apre db

        var risultato = db.get('SELECT * FROM canzonieri WHERE id = ?', id ,function(err,row){ //seleziona id del canzoniere
            console.log(err)

            var canzoniere = JSON.parse(row.canzoniere) //prende tutte le info del canzoniere e le trasforma in oggetto 

            var selezionecanzoni = canzoniere.selezionecanzoni

            var canzonieretex = ""

            for (var i = 0; i < selezionecanzoni.length; i++) {
                var contenuto =  fs.readFileSync(texpath + selezionecanzoni[i].identificatore + ".tex").toString()
                canzonieretex = canzonieretex + contenuto
            }
            var hash = hashids.encode(id)
            fs.mkdirSync(workpath + hash)
            fs.writeFileSync(workpath + hash + "/" + id + ".tex", canzonieretex)
        })
        db.close() 
        mail.push(id)
}



// Inizializzazione database

var db = new sqlite3.Database(dbpath)

db.run("CREATE TABLE canzonieri (id INTEGER PRIMARY KEY, canzoniere TEXT)", function(err, row) {
      console.log(err)
      console.log(row)
  })

db.close()


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

server.route({
    method: 'POST',
    path: '/crea',
    config: {
        cors: {
            origin: ['*'],
            additionalHeaders: ['cache-control', 'x-requested-with']
        }
    },
    handler: function (request, reply) {
        var db = new sqlite3.Database(dbpath)
        var lastid = 0
        db.run('INSERT INTO canzonieri (canzoniere) VALUES (?)',request.payload.canzoniere,function(err,row){
            lastid=this.lastID
            createTEX(this.lastID)
            reply(lastid)
        })
        db.close()
    }
});

server.start((err) => {

    if (err) {
        throw err;
    }
    console.log(`Server running at: ${server.info.uri}`)
});