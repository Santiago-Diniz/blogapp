// Carregando módulos
const express = require('express')
const exphbs = require('express-handlebars');
const app = express()
const admin = require('./routes/admin')
const path = require('path')
const mongoose = require('mongoose')
const session = require('express-session')
const flash = require('connect-flash')
require('./models/Postagem')
const Postagem = mongoose.model('postagens')
require('./models/Categoria')
const Categoria = mongoose.model('categorias')
const usuarios = require('./routes/usuario')
const passport = require('passport')
require('./config/auth')(passport)



//sessao
app.use(session({
  secret: 'cursodenode',
  resave: true,
  saveUninitialized: true
}))

app.use(passport.initialize())
app.use(passport.session())
app.use(flash())
//midleware
  app.use((req,res,next) => {
    res.locals.success_msg = req.flash('success_msg')
    res.locals.error_msg = req.flash('error_msg')
    res.locals.error = req.flash('error')
    res.locals.user = req.user || null;
    next()
  })

// Configurações
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Configurando Handlebars como engine de views
const hbs = exphbs.create({ defaultLayout: 'main' });
app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars')

//mongoose
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://127.0.0.1/blogapp').then(() => {
   console.log('Conectado com sucesso!')
}).catch((err) => {
    console.log('Erro ao se conectar!' +err)
})

// Configurando pasta public
app.use(express.static(path.join(__dirname, 'public')))

// Rotas
app.get('/', (req, res) => {
  Postagem.find().lean().populate('categoria').sort({data: 'desc'}).then((postagens) => {
    res.render('index', {postagens: postagens})
  }).catch((err) => {
    req.flash('error_msg', 'houve um erro')
    res.redirect('/404')
  })
})

app.get('/postagem/:slug', (req,res) => {
  Postagem.findOne({slug: req.params.slug}).lean().then((postagem) => {
    if(postagem){
        res.render('postagem/index', {postagem: postagem})
    }else{
      req.flash('error_msg', 'Essa mensagem não existe!')
      res.redirect('/')
    }
  }).catch((err) => {
    req.flash('error_msg', 'houve um erro interno')
    res.redirect('/')
  })
})

app.get('/categorias', (req,res) => {
  Categoria.find().lean().then((categorias) => {
    res.render('categorias/index', {categorias: categorias})

  }).catch((err) => {
    req.flash('error_msg', 'Houve um erro ao listar as categorias')
    res.redirect('/')

})

app.get('/categorias/:slug', (req,res) => {
  Categoria.findOne({slug: req.params.slug}).lean().then((categoria) => {
    if(categoria){
      
      Postagem.find({categoria: categoria._id}).lean().then((postagens) => {
        res.render('categorias/postagens', {postagens: postagens, categoria: categoria})
        
      }).catch((err) => {
        req.flash('error_msg', 'houve um erro ao listar os posts')
        res.redirect('/')
      })

    }else{
      req.flash('error_msg','Esta categoria não existe!')
      res.redirect('/')
    }

  }).catch((err) => {
    req.flash('error_msg', 'houve um erro interno interno ao carregar a pagina desta categoria')
    res.redirect('/')
  })
})

})
  
app.get('/404', (req,res) => {
  res.send('Error 404')
})



app.use('/admin', admin)
app.use('/usuarios', usuarios)


     

  // outros
    const Port = process.env.Port || 8089
    app.listen(Port, () => {
    console.log("servidor rodando! ")
})
