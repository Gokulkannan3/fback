const express = require('express');
const mysql = require('mysql2');
const app = express();
const cors =require('cors');
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const session = require("cookie-parser");
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const setRounds=10;
const nodemailer = require('nodemailer');

app.use(express.json());
app.use(cors({origin:'*'}));
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended:true}));

app.use(
    session({
        key: "username",
        secret: "success",
        resave: false,
        saveUninitialized: false,
        cookie:{
            expires: 60 * 10,
        }
    })
)

    const db = mysql.createConnection({
        user:'avnadmin',
        password:'AVNS_5W135YZrjuwuLR-WHt5',
        host:'mysql-39af648c-gokul.a.aivencloud.com',
        database:'innumvai',
        port:'11941'
    })

    const verifyJWT = (req, res, next) => {
        const token = req.headers["x-access-token"];
        if (!token) {
            res.send("We need token give it next time");
        } else {
            jwt.verify(token, "secret", (err, decoded) => {
                if (err) {
                    res.json({ auth: false, message: "Failed to authenticate" });
                } else {
                    req.usermail = decoded.id;
                    next();
                }
            });
        }
    };
    
    
    app.get('/isAuth',verifyJWT,(req,res)=>{
        res.send("Authenticeted Successfully");
    })
    
    app.post('/login', async (req, res) => {
        const username = req.body?.username;
        const password = req.body?.password;
    
        db.query(
            "SELECT * FROM signin WHERE username=?",
            [username],
            (err, result) => {
                if (err) {
                    console.log("Error:", err);
                    res.status(500).json({ error: 'Internal Server Error' });
                    return;
                }
    
                if (result.length > 0) {
                    bcryptjs.compare(password, result[0].password, (err, response) => {
                        if (response) {
                            const id  = result[0].id;
                            const token = jwt.sign({ id }, "secret", { expiresIn: 5 });
                            res.json({ auth: true, token: token, result: result[0], message: 'Login Successful' });
                        } else {
                            res.status(401).json({ message: 'Invalid Credentials' });
                        }
                    });
                } else {
                    res.status(401).json({ message: 'Invalid Credentials' });
                }
            }
        );
    });
    
    const verJWT = (req, res, next) => {
        const token = req.headers["x-access-token"];
        if (!token) {
            res.send("We need token give it next time");
        } else {
            jwt.verify(token, "secret", (err, decoded) => {
                if (err) {
                    res.json({ auth: false, message: "Failed to authenticate" });
                } else {
                    req.usermail = decoded.id;
                    next();
                }
            });
        }
    };
    
    
    app.get('/isAauth', verJWT, (req, res) => {
        const userDetails = {
            usermail: req.usermail,
        };
    
        res.json({ result: [userDetails] });
    });
    
    app.post('/alogin', async (req, res) => {
        const name = req.body?.name;
        const password = req.body?.password;
    
        db.query(
            "SELECT * FROM admin WHERE name=?",
            [name],
            (err, result) => {
                if (err) {
                    console.log("Error:", err);
                    res.status(500).json({ error: 'Internal Server Error' });
                    return;
                }
    
                if (result.length > 0) {
                    bcryptjs.compare(password, result[0].password, (err, response) => {
                        if (response) {
                            const id  = result[0].id;
                            const token = jwt.sign({ id }, "secret", { expiresIn: 300 });
                            res.json({ auth: true, token: token, message: 'Login Successful' });
                        } else {
                            res.status(401).json({ message: 'Invalid Credentials' });
                        }
                    });
                } else {
                    res.status(401).json({ message: 'Invalid Credentials' });
                }
            }
        );
    });

    app.post('/order', (req, res) => {
        const { username, email, contact, address, coffee, pasta, rosemilk, brownie, cake, totalAmount } = req.body;
    
        db.query(
            'INSERT INTO orders (username, email, contact, address, coffee, pasta, rosemilk, brownie, cake, totalamount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [username, email, contact, address, coffee, pasta, rosemilk, brownie, cake, totalAmount],
            (err, result) => {
                if (err) {
                    console.log(err);
                    res.status(500).send('Internal Server Error');
                } else {
                    const productDetails = `
                        Coffee: ${coffee} cups
                        Pasta: ${pasta} plates
                        Rose Milk: ${rosemilk} glasses
                        Brownie: ${brownie} pieces
                        Cake: ${cake} pieces
                    `;
    
                    const transporter = nodemailer.createTransport({
                        service: 'gmail',
                        auth: {
                            user: 'gokul8506@gmail.com',
                            pass: 'tdmc ggvc itfc oagr'
                        }
                    });
    
                    const mailOptions = {
                        from: 'gokul8506@gmail.com',
                        to: email,
                        subject: 'Order Confirmation',
                        text: `Dear customer Thanks for your order with Innumvai😊\n\nYour order has been successfully placed!\n\nTotal amount: ₹${totalAmount}\n\nOrdered Items:\n${productDetails}`
                    };
    
                    transporter.sendMail(mailOptions, (error, info) => {
                        if (error) {
                            console.error('Error sending email:', error);
                        } else {
                            console.log('Email sent:', info.response);
                        }
                    });
    
                    res.status(200).send('Order placed successfully!');
                    console.log(result);
                    const orderId = result.insertId;
                }
            }
        );
    });

    

    app.get('/track/:id', (req, res) => {
        const orderId = req.params.id;

        db.query(
            'SELECT * FROM orders WHERE id = ?',
            [orderId],
            (err, result) => {
            if (err) {
                console.log(err);
                res.status(500).send('Internal Server Error');
            } else {
                res.status(200).json(result[0]);
            }
            }
        );
    });

    app.get('/countcoffee', (req, res) => {
        db.query(
            'SELECT SUM(coffee) AS totalCoffee FROM orders',
            (error, results) => {
                if (error) {
                    console.error('Error retrieving total coffee count:', error);
                    res.status(500).json({ error: 'Internal server error' });
                } else {
                    const totalCoffee = results[0].totalCoffee || 0;
                    console.log('Total coffee count:', totalCoffee);
                    res.json({ totalCoffee });
                }
            }
        );
    });
    app.get('/countpasta', (req, res) => {
        db.query(
            'SELECT SUM(pasta) AS totalPasta FROM orders',
            (error, results) => {
                if (error) {
                    console.error('Error retrieving total pasta count:', error);
                    res.status(500).json({ error: 'Internal server error' });
                } else {
                    const totalPasta = results[0].totalPasta || 0;
                    console.log('Total pasta count:', totalPasta);
                    res.json({ totalPasta });
                }
            }
        );
    });
    app.get('/countrosemilk', (req, res) => {
        db.query(
            'SELECT SUM(rosemilk) AS totalRosemilk FROM orders',
            (error, results) => {
                if (error) {
                    console.error('Error retrieving total rosemilk count:', error);
                    res.status(500).json({ error: 'Internal server error' });
                } else {
                    const totalRosemilk = results[0].totalRosemilk || 0;
                    console.log('Total rosemilk count:', totalRosemilk);
                    res.json({ totalRosemilk });
                }
            }
        );
    });
    app.get('/countbrownie', (req, res) => {
        db.query(
            'SELECT SUM(brownie) AS totalBrownie FROM orders',
            (error, results) => {
                if (error) {
                    console.error('Error retrieving total brownie count:', error);
                    res.status(500).json({ error: 'Internal server error' });
                } else {
                    const totalBrownie = results[0].totalBrownie || 0;
                    console.log('Total brownie count:', totalBrownie);
                    res.json({ totalBrownie });
                }
            }
        );
    });
    app.get('/countcake', (req, res) => {
        db.query(
            'SELECT SUM(cake) AS totalCake FROM orders',
            (error, results) => {
                if (error) {
                    console.error('Error retrieving total cake count:', error);
                    res.status(500).json({ error: 'Internal server error' });
                } else {
                    const totalCake = results[0].totalCake || 0;
                    console.log('Total cake count:', totalCake);
                    res.json({ totalCake });
                }
            }
        );
    });
    
      

    app.post('/register', (req, res) => {
        const firstname = req.body?.firstname;
        const lastname = req.body?.lastname;
        const dob = req.body?.dob;
        const age = req.body?.age;
        const email = req.body?.email;
        const contact = req.body?.contact;
        const address = req.body?.address;
        const username =req.body?.username;
        const password = req.body?.password;
        const cpassword = req.body?.cpassword;

        console.log(req.body);

        if (password !== cpassword) {
            return res.status(400).json({ error: 'Password and Confirm Password do not match' });
        }

        bcryptjs.hash(password,setRounds,(err,hash)=>{
            if(err){
                console.log(err)
            }

            db.query('INSERT INTO signin(firstname, lastname, dob, age, email, contact, address, username, password, cpassword) VALUES (?,?,?,?,?,?,?,?,?,?)',
            [firstname, lastname, dob, age, email, contact, address, username, hash, hash],
            (err, result) => {
                if (err) {
                    console.log(err);
                    return res.status(500).json({ error: 'Internal Server Error' });
                } else {
                    console.log(result);
                    return res.status(200).json({ message: 'Registration Successful' });
                }
            }
        );
        })
    });

    app.put('/updateStatus/:id', (req, res) => {
        const orderId = req.params?.id;
        const newStatus = req.body?.newStatus;
    
        db.query(
          'UPDATE orders SET status = ? WHERE id = ?',
          [newStatus, orderId],
          (err, result) => {
            if (err) {
              console.log(err);
              res.status(500).json({ error: 'Internal Server Error' });
            } else {
              if (result.affectedRows > 0) {
                console.log(result);
                res.status(200).json({ message: 'Status updated successfully' });
              } else {
                res.status(404).json({ message: 'Order not found' });
              }
            }
          }
        );
    });
    
      
      

    app.post('/aregister', (req, res) => {
        const name = req.body?.name;
        const password = req.body?.password;
        const cpassword = req.body?.cpassword;

        console.log(req.body);

        if (password !== cpassword) {
            return res.status(400).json({ error: 'Password and Confirm Password do not match' });
        }

        bcryptjs.hash(password,setRounds,(err,hash)=>{
            if(err){
                console.log(err)
            }

            db.query('INSERT INTO admin(name, password, cpassword) VALUES (?,?,?)',
            [name, hash, hash],
            (err, result) => {
                if (err) {
                    console.log(err);
                    return res.status(500).json({ error: 'Internal Server Error' });
                } else {
                    console.log(result);
                    return res.status(200).json({ message: 'Registration Successful' });
                }
            }
        );
        })
    });

    app.get('/gokul',(req,res)=>{
        res.json("Gokul backend is running");
    })
    app.get('/order' , (req,res) => {
        db.query("SELECT * FROM orders", 
        (err,result)=>{
            if(err)
            {
                console.log(err);
            }
            else{
                res.send(result);
            }
        }
        )
    })
    
    


    app.listen(3002,()=>{
        console.log('Server started');
    });
