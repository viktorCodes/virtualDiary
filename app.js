const path = require('path')
const express = require('express')
const mongoose = require('mongoose')
const dotenv = require('dotenv')
const morgan = require('morgan')
const exphbs = require('express-handlebars')
const methodOverride = require('method-override')
const passport = require('passport')
const session = require('express-session')
const MongoStore = require('connect-mongo')
const connectDB = require('./config/db')


//Load Config
dotenv.config({path: './config/config.env' })

//Passport Config
require('./config/passport')(passport)


connectDB()

const app = express()

//Body Parser

app.use(express.urlencoded({ extended: true}))
app.use(express.json())

// Method override
app.use(
  methodOverride(function (request, response) {
    if (request.body && typeof request.body === 'object' && '_method' in request.body) {
      // look in urlencoded POST bodies and delete it
      let method = request.body._method
      delete request.body._method
      return method
    }
  })
)


//Logging
if(process.env.NODE_ENV === 'development'){
    app.use(morgan('dev'))
}

//Handlebars Helpers

const { formatDate, stripTags, truncate, editIcon, select } = require('./helpers/hbs')

//Handlebars

app.engine('.hbs', exphbs.engine({
  helpers: {
  formatDate,
  stripTags,
  truncate,
  editIcon,
  select,
}, 
defaultLayout: 'main', 
extname: '.hbs'}));

app.set('view engine', '.hbs');

//Sessions
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false,
    //store: new MongoStore({mongooseConnection: mongoose.connection })
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI
    })
    
}))

 

//Passport middleware
app.use(passport.initialize())
app.use(passport.session())

//Set global var
app.use(function (request, response, next) {
  response.locals.user = request.user || null;
  next()
})


//Static folder
app.use(express.static(path.join(__dirname, 'public')))

//Routes
app.use('/', require('./routes/index'))
app.use('/auth', require('./routes/auth'))
app.use('/journal', require('./routes/journals'))
app.use('/privatejournal', require('./routes/privatejournal'))

const PORT = process.env.PORT || 2000


app.listen(PORT, console.log(`Server running in ${process.env.NODE_ENV} mode on ${PORT}`))